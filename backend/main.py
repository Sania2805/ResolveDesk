import re
import os
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Query, Header, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

import database
from models import (
    TicketAnalyzeRequest,
    TicketActionRequest,
    Ticket,
    AuditLogItem,
    AnalyticsResponse,
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    AuthResponse
)
from ai_service import analyze_ticket_with_gemini, get_env_config

# Initialize Database
database.init_db()

app = FastAPI(
    title="ResolveAI Backend API",
    description="AI-Powered IT Service Desk & Ticket Resolution Assistant with Role-Based Access Control",
    version="1.1.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_current_user_optional(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    if not authorization:
        return None
    user = database.get_user_by_token(authorization)
    return user

def get_current_user_required(authorization: Optional[str] = Header(None)) -> dict:
    user = get_current_user_optional(authorization)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in."
        )
    return user

def generate_next_ticket_id() -> str:
    tickets = database.list_tickets(role="admin")
    highest_num = 1000
    for t in tickets:
        tid = t.get("ticket_id", "")
        m = re.match(r"TKT-(\d+)", tid)
        if m:
            val = int(m.group(1))
            if val > highest_num:
                highest_num = val
    return f"TKT-{highest_num + 1}"

def model_name_tag():
    _, model = get_env_config()
    return model

# -------------------------------------------------------------
# System & Health
# -------------------------------------------------------------

@app.get("/api/health")
def get_health():
    api_key, model = get_env_config()
    is_configured = bool(api_key and len(api_key.strip()) > 5)
    return {
        "status": "healthy",
        "service": "ResolveAI",
        "gemini_configured": is_configured,
        "gemini_model": model,
        "timestamp": datetime.now().isoformat()
    }

# -------------------------------------------------------------
# Authentication Endpoints
# -------------------------------------------------------------

@app.post("/api/auth/register", response_model=AuthResponse)
def register(req: UserRegisterRequest):
    if not req.email.strip() or not req.password.strip():
        raise HTTPException(status_code=400, detail="Email and password are required.")
    
    role = req.role if req.role in ["user", "admin"] else "user"
    try:
        user = database.create_user(
            email=req.email,
            name=req.name,
            password=req.password,
            role=role
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    token = database.create_auth_token(user["id"])
    return {
        "user": user,
        "token": token
    }

@app.post("/api/auth/login", response_model=AuthResponse)
def login(req: UserLoginRequest):
    user = database.authenticate_user(req.email.strip().lower(), req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = database.create_auth_token(user["id"])
    return {
        "user": user,
        "token": token
    }

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(authorization: Optional[str] = Header(None)):
    user = get_current_user_required(authorization)
    return user

@app.get("/api/users", response_model=List[UserResponse])
def get_all_users(authorization: Optional[str] = Header(None)):
    user = get_current_user_required(authorization)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return database.list_users()

# -------------------------------------------------------------
# Ticket Operations
# -------------------------------------------------------------

@app.post("/api/tickets/analyze", response_model=Ticket)
def analyze_ticket(
    req: TicketAnalyzeRequest,
    authorization: Optional[str] = Header(None)
):
    current_user = get_current_user_optional(authorization)

    # 1. Edge Case: Empty ticket
    raw_desc = req.description.strip() if req.description else ""
    if not raw_desc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please describe your IT issue before submitting."
        )

    # 2. Edge Case: Excessively long ticket
    if len(raw_desc) > 4000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ticket description is too long (maximum 4000 characters allowed)."
        )

    # 3. Determine Ticket ID
    ticket_id = req.ticket_id.strip() if req.ticket_id and req.ticket_id.strip() else generate_next_ticket_id()
    if not ticket_id.startswith("TKT-"):
        ticket_id = f"TKT-{ticket_id}"

    # 4. Call Gemini AI Service
    try:
        analysis = analyze_ticket_with_gemini(raw_desc)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(ve)
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI analysis is temporarily unavailable. Please try again."
        )

    # 5. Build Ticket Record with User Attribution
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ticket_data = {
        "ticket_id": ticket_id,
        "user_id": current_user["id"] if current_user else None,
        "user_email": current_user["email"] if current_user else "guest@resolveai.com",
        "user_name": current_user["name"] if current_user else "Guest Requester",
        "description": raw_desc,
        "category": analysis["category"],
        "priority": analysis["priority"],
        "confidence": analysis["confidence"],
        "suggested_resolution": analysis["suggested_resolution"],
        "auto_resolve": analysis["auto_resolve"],
        "status": "Pending Approval",
        "assigned_team": analysis["assigned_team"],
        "summary": analysis["summary"],
        "reason": analysis["reason"],
        "warning": analysis.get("warning"),
        "created_at": now,
        "updated_at": now
    }

    # 6. Save to DB and Record Audit Log
    saved_ticket = database.save_ticket(ticket_data, current_user)

    user_label = f" by {current_user['name']} ({current_user['email']})" if current_user else ""
    database.add_audit_log(
        ticket_id=ticket_id,
        action="Ticket Triage",
        result=f"Analyzed by Gemini ({model_name_tag()}){user_label} — Category: {analysis['category']} ({int(analysis['confidence']*100)}% conf), Priority: {analysis['priority']}"
    )

    return saved_ticket

@app.get("/api/tickets", response_model=List[Ticket])
def get_tickets(
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None)
):
    current_user = get_current_user_optional(authorization)
    role = current_user["role"] if current_user else "user"
    user_id = current_user["id"] if current_user else None

    return database.list_tickets(
        user_id=user_id,
        role=role,
        category=category,
        priority=priority,
        status=status,
        search=search
    )

@app.get("/api/tickets/{ticket_id}", response_model=Ticket)
def get_ticket_detail(
    ticket_id: str,
    authorization: Optional[str] = Header(None)
):
    ticket = database.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket {ticket_id} not found."
        )

    current_user = get_current_user_optional(authorization)
    # If user is requester, check if ticket belongs to them
    if current_user and current_user["role"] != "admin":
        if ticket.get("user_id") and ticket["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied to this ticket.")

    return ticket

@app.post("/api/tickets/{ticket_id}/approve", response_model=Ticket)
def approve_resolution(
    ticket_id: str,
    req: Optional[TicketActionRequest] = None,
    authorization: Optional[str] = Header(None)
):
    current_user = get_current_user_optional(authorization)
    ticket = database.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket {ticket_id} not found."
        )

    updated = database.update_ticket_status(ticket_id, "Resolved")
    operator = current_user["name"] if current_user else "Operator"

    database.add_audit_log(
        ticket_id=ticket_id,
        action="Auto-Resolution Approved",
        result=f"Resolution approved by {operator}."
    )
    database.add_audit_log(
        ticket_id=ticket_id,
        action="Status Update",
        result=f"{ticket_id} marked Resolved"
    )

    return updated

@app.post("/api/tickets/{ticket_id}/route", response_model=Ticket)
def route_ticket(
    ticket_id: str,
    req: Optional[TicketActionRequest] = None,
    authorization: Optional[str] = Header(None)
):
    current_user = get_current_user_optional(authorization)
    ticket = database.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket {ticket_id} not found."
        )

    team = ticket.get("assigned_team", "Tier 2 Support")
    updated = database.update_ticket_status(ticket_id, "Routed")
    operator = current_user["name"] if current_user else "Operator"

    database.add_audit_log(
        ticket_id=ticket_id,
        action="Ticket Routed",
        result=f"{ticket_id} routed to {team} by {operator}."
    )

    return updated

@app.get("/api/audit-log", response_model=List[AuditLogItem])
def get_audit_log(
    limit: int = Query(200, ge=1, le=1000),
    authorization: Optional[str] = Header(None)
):
    current_user = get_current_user_optional(authorization)
    if current_user and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Audit log is restricted to IT administrators.")
    return database.get_audit_logs(limit=limit)

@app.get("/api/analytics", response_model=AnalyticsResponse)
def get_analytics(authorization: Optional[str] = Header(None)):
    current_user = get_current_user_optional(authorization)
    role = current_user["role"] if current_user else "admin"
    user_id = current_user["id"] if current_user else None

    return database.get_analytics(user_id=user_id, role=role)

@app.post("/api/tickets/clear")
def clear_tickets(authorization: Optional[str] = Header(None)):
    """Wipes all tickets and audit logs from database (Admin only)."""
    current_user = get_current_user_optional(authorization)
    if current_user and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can clear tickets.")
    database.clear_and_reset()
    return {
        "success": True,
        "message": "All tickets and audit logs have been cleared successfully."
    }
