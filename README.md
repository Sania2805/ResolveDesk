# ResolveAI
> **AI-Powered IT Service Desk & Ticket Resolution Assistant**

ResolveAI is an intelligent, full-stack IT service desk triage and auto-resolution platform powered by Google Gemini. It automatically analyzes end-user support tickets, classifies category and priority, computes confidence scores, recommends safe step-by-step troubleshooting procedures, and determines whether an issue can be safely auto-resolved or must be routed to specialized IT engineering teams.

---

## Table of Contents

- [Overview & Capabilities](#overview--capabilities)
- [Key Features](#key-features)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [How the AI Engine Works](#how-the-ai-engine-works)
- [Gemini API Setup (Step-by-Step)](#gemini-api-setup-step-by-step)
- [Quick Start Guide](#quick-start-guide)
  - [Backend Setup](#1-backend-setup)
  - [Frontend Setup](#2-frontend-setup)
- [API Endpoints Reference](#api-endpoints-reference)
- [Example Ticket & AI Analysis](#example-ticket--ai-analysis)
- [Edge Cases Handled](#edge-cases-handled)
- [Safety & Guardrail Rules](#safety--guardrail-rules)
- [Future Enhancements](#future-enhancements)

---

## Overview & Capabilities

Traditional IT service desks face ticket backlogs, slow triage, and inconsistent classification. **ResolveAI** bridges this gap:

- **Instant Automated Triage**: Ingests unstructured user tickets (even vague or multilingual inputs) and normalizes them into structured data.
- **Categorization & Prioritization**: Automatically maps issues into standard ITIL categories (*Password Reset*, *Access Request*, *Network Issue*, *Security Issue*, etc.) with objective urgency and business impact scoring (*Low*, *Medium*, *High*, *Critical*).
- **Safe Auto-Resolution Workflow**: Recommends auto-resolution only for safe self-service issues (e.g. password resets, client-side software crashes, basic Wi-Fi fixes).
- **Human-in-the-Loop Operator Controls**: Provides single-click approval (`[Approve Resolution]`) or team routing (`[Route Ticket]`) with automatic audit trails.

---

## Key Features

1. **AI-Powered Ticket Triage**:
   - Structured JSON output utilizing Google GenAI SDK (`gemini-2.5-flash`).
   - Confidence scoring (0%–100%) with dynamic visual meters.
   - Low confidence warning banners (<60%) triggering automated safety fallback to `Needs Manual Review`.

2. **Operator Dashboard**:
   - Live KPI Stat Cards: *Total Tickets*, *Auto-Resolved*, *Manual Review*, *High Priority*.
   - Interactive Ticket Submission with pre-packaged quick test scenario chips (*Password Reset*, *Vague Issue*, *Security Alert*, *Network Down*, *Hinglish Login*).
   - Real-time resolution view with numbered action steps, summary, and AI reasoning.

3. **Ticket Management Table**:
   - Instant search across Ticket IDs, issue descriptions, and summaries.
   - Multi-facet filters: Category, Priority, and Status (*Pending Approval*, *Resolved*, *Routed*).
   - Drill-down modal for reviewing ticket diagnostics and performing approval actions.

4. **Analytics & Metrics**:
   - Auto-resolution efficiency rate vs. manual review rate.
   - Average AI confidence score benchmarks.
   - Category and priority distribution visual bar meters (built with pure CSS).

5. **Chronological Audit Log**:
   - Immutable timeline tracking every triage decision, AI classification, operator approval, and routing dispatch with timestamps and Ticket IDs (Admin view).

6. **User Authentication & Role-Based Portals**:
   - **Employee Portal**: Employees log in and see **only the tickets raised by them** in "My Tickets", with real-time resolution updates.
   - **Admin Portal**: IT Administrators log in and see **all tickets raised across all employees**, with requester identity, full approval/routing authority, org-wide analytics, and audit trails.
   - Built-in test accounts with 1-click switcher (Admin, John Doe, Alice Smith) plus self-registration.

---

## Architecture & Tech Stack

```
ResolveAI Architecture
┌─────────────────────────────────────────────────────────────┐
│                       React Frontend                        │
│          Vite • Vanilla CSS • Modern Dark Navy Theme        │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API (/api/*)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                        │
│     Pydantic Schemas • CORS • SQLite • Safety Guardrails    │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐  ┌───────────────────────────┐
│     SQLite Local Database    │  │     Google Gemini API     │
│   (Tickets & Audit Logs)     │  │ (Official GenAI 2.0 SDK)  │
└──────────────────────────────┘  └───────────────────────────┘
```

- **Frontend**:
  - React 18
  - Vite 5
  - Plain CSS (Zero Tailwind, Zero Bootstrap, Zero Material UI, custom dark navy SaaS theme)
  - Typography: Poppins & JetBrains Mono

- **Backend**:
  - Python 3.10+ / 3.14
  - FastAPI & Uvicorn
  - Pydantic v2
  - Python-Dotenv

- **AI Integration**:
  - Official Google GenAI SDK (`google-genai` / `types.GenerateContentConfig`)
  - Configurable model (defaults to `gemini-2.5-flash`)
  - Strict JSON schema enforcement via Pydantic

- **Database**:
  - Lightweight SQLite (`resolveai.db`) requiring zero setup or cloud dependencies.

---

## How the AI Engine Works

1. **Ingestion & Validation**:
   - Validates input non-emptiness and max-length guardrails.
   - Assigns or increments a sequential ticket identifier (e.g. `TKT-1021`).

2. **Structured Prompt Execution**:
   - System instructions define ITIL categories, priority definitions, and strict safety rules.
   - The model returns a structured JSON payload validated against `GeminiAnalysisOutput`.

3. **Deterministic Safety Overrides**:
   - Regardless of model output, tickets involving security threats (ransomware, phishing, breach), physical hardware damage (swollen batteries, broken screens), or privileged access elevation are strictly denied auto-resolution (`auto_resolve = false`) and routed to the corresponding specialist team.
   - If confidence is below 60%, the ticket category is automatically updated to `Needs Manual Review` with a warning banner.

4. **Persistence & Auditing**:
   - Ticket and analysis are saved to SQLite.
   - An audit trail entry is logged with the timestamp and model tag.

---

## Gemini API Setup (Step-by-Step)

To run live AI analysis, configure your Gemini API key in the backend environment file:

1. **Obtain an API Key**:
   - Visit [Google AI Studio](https://aistudio.google.com/) and generate an API key.

2. **Configure `.env`**:
   - Open `backend/.env` in your text editor.
   - Paste your key after `GEMINI_API_KEY=`:
     ```env
     GEMINI_API_KEY=AIzaSyYourActualGeminiApiKeyHere
     GEMINI_MODEL=gemini-2.5-flash
     ```

> **Security Note**: `backend/.env` is ignored by Git and never sent to or exposed in the React frontend. All AI requests are executed securely on the FastAPI server.

---

## Quick Start Guide

### 1. Backend Setup

Open a terminal in the project root:

```bash
# Navigate to backend folder
cd d:/ResolveDesk/backend

# (Optional) Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
python -m pip install -r requirements.txt

# Start the FastAPI backend server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The backend will start at `http://127.0.0.1:8000`. You can test health at `http://127.0.0.1:8000/api/health` or view OpenAPI documentation at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup

Open a separate terminal:

```bash
# Navigate to frontend folder
cd d:/ResolveDesk/frontend

# Install dependencies (already completed)
npm install

# Start the Vite development server
npm run dev
```

The frontend will run at `http://localhost:5173`. Open this URL in your web browser.

---

## API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticates user (email & password), returns token & user profile. |
| `POST` | `/api/auth/register` | Registers a new employee or administrator account. |
| `GET` | `/api/auth/me` | Returns profile of currently authenticated user. |
| `GET` | `/api/users` | Lists all registered accounts (Admin only). |
| `GET` | `/api/health` | Service health status, AI connectivity, and active model. |
| `POST` | `/api/tickets/analyze` | Analyzes ticket with Gemini, attaches user identity, and saves record. |
| `GET` | `/api/tickets` | Lists tickets (Admin sees all; Requester sees only their own tickets). |
| `GET` | `/api/tickets/{ticket_id}` | Retrieves details for a specific ticket. |
| `POST` | `/api/tickets/{ticket_id}/approve`| Approves auto-resolution (sets status to `Resolved` and records audit event). |
| `POST` | `/api/tickets/{ticket_id}/route` | Dispatches ticket to assigned team (sets status to `Routed` and records audit event). |
| `POST` | `/api/tickets/clear` | Wipes all tickets and audit logs for a fresh workspace (Admin only). |
| `GET` | `/api/audit-log` | Retrieves chronological audit event log (Admin only). |
| `GET` | `/api/analytics` | Returns aggregated metrics (scoped to user or global for admin). |

---


## Example Ticket & AI Analysis

### Input:
```
"I can't log into my laptop, it says my password expired."
```

### Output:
```json
{
  "ticket_id": "TKT-1001",
  "category": "Password Reset",
  "priority": "Medium",
  "confidence": 0.96,
  "suggested_resolution": [
    "Open the self-service password reset portal.",
    "Verify your identity via MFA push.",
    "Set a new password meeting security standards.",
    "Log in again with your updated credentials."
  ],
  "auto_resolve": true,
  "status": "Pending Approval",
  "assigned_team": "IT Support",
  "summary": "User is unable to log in because their password has expired.",
  "reason": "The ticket explicitly mentions an expired password."
}
```

---

## Edge Cases Handled

1. **Empty / Blank Ticket**:
   - Client and server-side validation immediately blocks submission with: *"Please describe your IT issue before submitting."* (Gemini is not called).

2. **Vague Tickets** (e.g. *"It doesn't work."*):
   - Categorized as `Needs Manual Review`
   - Confidence set low (<0.50)
   - Auto-resolve set to `false`
   - Reasoning explicitly requests more technical context from the user.

3. **Multilingual & Hinglish Support** (e.g. *"mera laptop login nahi ho raha"*):
   - Gemini accurately interprets Hindi/Hinglish intent, extracts core technical symptoms, and translates the summary and resolution into clear IT actions.

4. **Critical Security Threats** (e.g. *Ransomware, Phishing, Data Loss*):
   - Classified as `Security Issue` with `Critical` or `High` priority.
   - Deterministically prevents auto-resolution (`auto_resolve = false`).
   - Automatically routes to `Security Operations`.

5. **Missing or Invalid API Key**:
   - Backend catches SDK errors and returns clear, user-friendly messages without server crashes or raw stack trace leaks.

---

## Safety & Guardrail Rules

- **Zero Auto-Resolve on Destructive Actions**: Never automatically executes terminal commands or scripts. All resolution steps are purely instructional.
- **Strict Least-Privilege**: Cloud IAM and local admin requests always require supervisor authorization and are flagged for manual processing.
- **Hazardous Hardware**: Swollen batteries or smoke risks trigger immediate isolation instructions and direct technician dispatch.

---

## Future Enhancements

- Webhook integration with Slack and Microsoft Teams for real-time ticket alerts.
- Two-way sync with enterprise ITSM platforms (ServiceNow, Jira Service Management).
- Knowledge-base RAG (Retrieval-Augmented Generation) connecting to company internal confluence wikis.
- Multilingual responses responding back to the user in their preferred native language.

