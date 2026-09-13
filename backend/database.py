import sqlite3
import json
import hashlib
import secrets
from datetime import datetime
from typing import List, Optional, Dict, Any
import sqlite3
import json
import hashlib
import secrets
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DB_PATH = "resolveai.db"

# Simple secure session store in memory for token -> user_id
ACTIVE_TOKENS: Dict[str, int] = {}

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    if not salt:
        salt = secrets.token_hex(16)
    pw_hash = hashlib.sha256((salt + password).encode()).hexdigest()
    return pw_hash, salt

def init_db():
    with get_connection() as conn:
        cursor = conn.cursor()

        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                created_at TEXT NOT NULL
            )
        """)

        # Tickets table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tickets (
                ticket_id TEXT PRIMARY KEY,
                user_id INTEGER,
                user_email TEXT,
                user_name TEXT,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                priority TEXT NOT NULL,
                confidence REAL NOT NULL,
                suggested_resolution TEXT NOT NULL,
                auto_resolve INTEGER NOT NULL,
                status TEXT NOT NULL,
                assigned_team TEXT NOT NULL,
                summary TEXT NOT NULL,
                reason TEXT NOT NULL,
                warning TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        # Audit logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                ticket_id TEXT NOT NULL,
                action TEXT NOT NULL,
                result TEXT NOT NULL
            )
        """)
        conn.commit()

        # Migration: Ensure tickets table has user columns if previously created
        cursor.execute("PRAGMA table_info(tickets)")
        columns = [row["name"] for row in cursor.fetchall()]
        if "user_id" not in columns:
            cursor.execute("ALTER TABLE tickets ADD COLUMN user_id INTEGER")
        if "user_email" not in columns:
            cursor.execute("ALTER TABLE tickets ADD COLUMN user_email TEXT")
        if "user_name" not in columns:
            cursor.execute("ALTER TABLE tickets ADD COLUMN user_name TEXT")
        conn.commit()

    seed_default_users()

def seed_default_users():
    default_users = [
        (
            os.getenv("ADMIN_EMAIL"),
            os.getenv("ADMIN_NAME", "IT Desk Admin"),
            os.getenv("ADMIN_PASSWORD"),
            "admin"
        ),
        (
            os.getenv("DEMO_USER1_EMAIL"),
            os.getenv("DEMO_USER1_NAME", "John Doe"),
            os.getenv("DEMO_USER1_PASSWORD"),
            "user"
        ),
        (
            os.getenv("DEMO_USER2_EMAIL"),
            os.getenv("DEMO_USER2_NAME", "Alice Smith"),
            os.getenv("DEMO_USER2_PASSWORD"),
            "user"
        )
    ]

    with get_connection() as conn:
        cursor = conn.cursor()
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        for email, name, pwd, role in default_users:

            # Skip this user if credentials are not configured
            if not email or not pwd:
                continue

            cursor.execute(
                "SELECT id FROM users WHERE email = ?",
                (email.lower(),)
            )

            if not cursor.fetchone():
                pw_hash, salt = hash_password(pwd)

                cursor.execute("""
                    INSERT INTO users (
                        email,
                        name,
                        password_hash,
                        salt,
                        role,
                        created_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    email.lower(),
                    name,
                    pw_hash,
                    salt,
                    role,
                    now
                ))

        conn.commit()
def create_user(email: str, name: str, password: str, role: str = "user") -> Dict[str, Any]:
    email = email.strip().lower()
    pw_hash, salt = hash_password(password)
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    with get_connection() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO users (email, name, password_hash, salt, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (email, name.strip(), pw_hash, salt, role, now))
            conn.commit()
            user_id = cursor.lastrowid
        except sqlite3.IntegrityError:
            raise ValueError(f"An account with email '{email}' already exists.")

    return get_user_by_id(user_id)

def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, name, role, created_at FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),))
        row = cursor.fetchone()
        return dict(row) if row else None

def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    user = get_user_by_email(email)
    if not user:
        return None
    test_hash, _ = hash_password(password, user["salt"])
    if test_hash == user["password_hash"]:
        return {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "created_at": user["created_at"]
        }
    return None

def create_auth_token(user_id: int) -> str:
    token = f"tok_{secrets.token_urlsafe(32)}"
    ACTIVE_TOKENS[token] = user_id
    return token

def get_user_by_token(token: str) -> Optional[Dict[str, Any]]:
    if not token:
        return None
    clean_token = token.replace("Bearer ", "").strip()
    user_id = ACTIVE_TOKENS.get(clean_token)
    if user_id:
        return get_user_by_id(user_id)
    return None

def list_users() -> List[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, name, role, created_at FROM users ORDER BY id ASC")
        return [dict(r) for r in cursor.fetchall()]

def save_ticket(ticket: Dict[str, Any], user: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    with get_connection() as conn:
        cursor = conn.cursor()
        resolution_json = json.dumps(ticket.get("suggested_resolution", []))
        auto_resolve_int = 1 if ticket.get("auto_resolve") else 0
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        user_id = ticket.get("user_id") or (user["id"] if user else None)
        user_email = ticket.get("user_email") or (user["email"] if user else "guest@resolveai.com")
        user_name = ticket.get("user_name") or (user["name"] if user else "Requester")

        cursor.execute("""
            INSERT INTO tickets (
                ticket_id, user_id, user_email, user_name, description, category, priority, confidence,
                suggested_resolution, auto_resolve, status, assigned_team,
                summary, reason, warning, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(ticket_id) DO UPDATE SET
                description=excluded.description,
                category=excluded.category,
                priority=excluded.priority,
                confidence=excluded.confidence,
                suggested_resolution=excluded.suggested_resolution,
                auto_resolve=excluded.auto_resolve,
                status=excluded.status,
                assigned_team=excluded.assigned_team,
                summary=excluded.summary,
                reason=excluded.reason,
                warning=excluded.warning,
                updated_at=excluded.updated_at
        """, (
            ticket["ticket_id"],
            user_id,
            user_email,
            user_name,
            ticket["description"],
            ticket["category"],
            ticket["priority"],
            float(ticket["confidence"]),
            resolution_json,
            auto_resolve_int,
            ticket.get("status", "Pending Approval"),
            ticket["assigned_team"],
            ticket.get("summary", ""),
            ticket.get("reason", ""),
            ticket.get("warning"),
            ticket.get("created_at", now),
            now
        ))
        conn.commit()
    return get_ticket(ticket["ticket_id"])

def get_ticket(ticket_id: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tickets WHERE ticket_id = ?", (ticket_id,))
        row = cursor.fetchone()
        if not row:
            return None
        t = dict(row)
        t["suggested_resolution"] = json.loads(t["suggested_resolution"])
        t["auto_resolve"] = bool(t["auto_resolve"])
        return t

def list_tickets(
    user_id: Optional[int] = None,
    role: str = "admin",
    category: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None
) -> List[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM tickets WHERE 1=1"
        params = []

        # If user is not admin, filter to only their tickets
        if role != "admin" and user_id is not None:
            query += " AND user_id = ?"
            params.append(user_id)

        if category and category != "All":
            query += " AND category = ?"
            params.append(category)

        if priority and priority != "All":
            query += " AND priority = ?"
            params.append(priority)

        if status and status != "All":
            query += " AND status = ?"
            params.append(status)

        if search:
            query += " AND (ticket_id LIKE ? OR description LIKE ? OR summary LIKE ? OR user_email LIKE ? OR user_name LIKE ?)"
            term = f"%{search}%"
            params.extend([term, term, term, term, term])

        query += " ORDER BY datetime(updated_at) DESC, ticket_id DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        result = []
        for r in rows:
            item = dict(r)
            item["suggested_resolution"] = json.loads(item["suggested_resolution"])
            item["auto_resolve"] = bool(item["auto_resolve"])
            result.append(item)
        return result

def update_ticket_status(ticket_id: str, new_status: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("""
            UPDATE tickets
            SET status = ?, updated_at = ?
            WHERE ticket_id = ?
        """, (new_status, now, ticket_id))
        conn.commit()
    return get_ticket(ticket_id)

def add_audit_log(ticket_id: str, action: str, result: str):
    with get_connection() as conn:
        cursor = conn.cursor()
        timestamp = datetime.now().strftime("%I:%M %p")
        cursor.execute("""
            INSERT INTO audit_logs (timestamp, ticket_id, action, result)
            VALUES (?, ?, ?, ?)
        """, (timestamp, ticket_id, action, result))
        conn.commit()

def get_audit_logs(limit: int = 200) -> List[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM audit_logs
            ORDER BY id DESC
            LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]

def get_analytics(user_id: Optional[int] = None, role: str = "admin") -> Dict[str, Any]:
    with get_connection() as conn:
        cursor = conn.cursor()
        if role != "admin" and user_id is not None:
            cursor.execute("SELECT * FROM tickets WHERE user_id = ?", (user_id,))
        else:
            cursor.execute("SELECT * FROM tickets")
        rows = cursor.fetchall()

    total = len(rows)
    if total == 0:
        return {
            "total_tickets": 0,
            "auto_resolved_count": 0,
            "manual_review_count": 0,
            "high_priority_count": 0,
            "auto_resolution_rate": 0.0,
            "manual_review_rate": 0.0,
            "average_confidence": 0.0,
            "category_distribution": {},
            "priority_distribution": {},
            "status_distribution": {}
        }

    cat_dist = {}
    prio_dist = {}
    status_dist = {}
    auto_resolved_count = 0
    manual_review_count = 0
    high_priority_count = 0
    total_confidence = 0.0

    for r in rows:
        c = r["category"]
        p = r["priority"]
        s = r["status"]
        conf = float(r["confidence"])
        auto = bool(r["auto_resolve"])

        cat_dist[c] = cat_dist.get(c, 0) + 1
        prio_dist[p] = prio_dist.get(p, 0) + 1
        status_dist[s] = status_dist.get(s, 0) + 1

        total_confidence += conf

        if s == "Resolved" or (auto and s != "Routed"):
            auto_resolved_count += 1
        if c == "Needs Manual Review" or not auto or s == "Routed":
            manual_review_count += 1
        if p in ["High", "Critical"]:
            high_priority_count += 1

    return {
        "total_tickets": total,
        "auto_resolved_count": auto_resolved_count,
        "manual_review_count": manual_review_count,
        "high_priority_count": high_priority_count,
        "auto_resolution_rate": round((auto_resolved_count / total) * 100, 1),
        "manual_review_rate": round((manual_review_count / total) * 100, 1),
        "average_confidence": round((total_confidence / total) * 100, 1),
        "category_distribution": cat_dist,
        "priority_distribution": prio_dist,
        "status_distribution": status_dist
    }

def clear_and_reset():
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tickets")
        cursor.execute("DELETE FROM audit_logs")
        conn.commit()
