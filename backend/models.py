from typing import List, Optional, Literal
from pydantic import BaseModel, Field

# Strict Enums / Allowed literals according to specs
CategoryLiteral = Literal[
    "Password Reset",
    "Access Request",
    "Software Issue",
    "Hardware Fault",
    "Network Issue",
    "Email Issue",
    "Account Issue",
    "Security Issue",
    "General IT Query",
    "Needs Manual Review"
]

PriorityLiteral = Literal["Low", "Medium", "High", "Critical"]
StatusLiteral = Literal["Pending Approval", "Resolved", "Routed"]
RoleLiteral = Literal["user", "admin"]

class GeminiAnalysisOutput(BaseModel):
    """Structured response schema expected from Gemini API."""
    category: str = Field(
        description="The IT category of the ticket. Must be one of the allowed categories."
    )
    priority: str = Field(
        description="Priority level: Low, Medium, High, or Critical."
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence score from 0.0 to 1.0."
    )
    suggested_resolution: List[str] = Field(
        description="Clear numbered troubleshooting or resolution steps for the user or technician."
    )
    auto_resolve: bool = Field(
        description="Whether this issue is completely safe for an automated resolution recommendation."
    )
    status: str = Field(
        default="Pending Approval",
        description="Initial status, usually 'Pending Approval'."
    )
    assigned_team: str = Field(
        description="The IT team responsible for handling or escalating this ticket."
    )
    summary: str = Field(
        description="A concise one-line summary of the user's issue."
    )
    reason: str = Field(
        description="A short explanation/reasoning behind the category, priority, and routing decision."
    )

class TicketAnalyzeRequest(BaseModel):
    ticket_id: Optional[str] = None
    description: str

class TicketActionRequest(BaseModel):
    notes: Optional[str] = None

class Ticket(BaseModel):
    ticket_id: str
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    description: str
    category: str
    priority: str
    confidence: float
    suggested_resolution: List[str]
    auto_resolve: bool
    status: str
    assigned_team: str
    summary: str
    reason: str
    warning: Optional[str] = None
    created_at: str
    updated_at: str

class AuditLogItem(BaseModel):
    id: int
    timestamp: str
    ticket_id: str
    action: str
    result: str

class AnalyticsResponse(BaseModel):
    total_tickets: int
    auto_resolved_count: int
    manual_review_count: int
    high_priority_count: int
    auto_resolution_rate: float
    manual_review_rate: float
    average_confidence: float
    category_distribution: dict
    priority_distribution: dict
    status_distribution: dict

# Authentication Models
class UserRegisterRequest(BaseModel):
    email: str
    name: str
    password: str
    role: Optional[str] = "user"

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    created_at: str

class AuthResponse(BaseModel):
    user: UserResponse
    token: str
