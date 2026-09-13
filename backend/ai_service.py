import os
import json
import re
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from models import GeminiAnalysisOutput

ALLOWED_CATEGORIES = [
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

ALLOWED_PRIORITIES = ["Low", "Medium", "High", "Critical"]

SYSTEM_INSTRUCTION = """
You are an IT service desk triage assistant.
Analyze the user's support ticket.
Classify it into one of the allowed categories:
- Password Reset
- Access Request
- Software Issue
- Hardware Fault
- Network Issue
- Email Issue
- Account Issue
- Security Issue
- General IT Query
- Needs Manual Review

Determine priority:
- Low (e.g. standard queries, minor cosmetic/peripheral glitches)
- Medium (e.g. individual user blocked by password/software crash)
- High (e.g. VPN down, department-wide issues, data loss, access escalation)
- Critical (e.g. ransomware, company-wide outage, swollen battery fire hazard)

Estimate confidence score between 0.0 and 1.0.
Suggest safe troubleshooting/resolution steps (as a list of step-by-step instructions).
Determine whether the issue is safe for an auto-resolution recommendation (auto_resolve: boolean).

CRITICAL SAFETY & TRIAGE RULES:
1. Never invent company-specific policies.
2. Never recommend dangerous or destructive actions.
3. Security incidents, privileged access requests, data loss, critical infrastructure issues, and physical hardware replacement MUST require manual intervention (auto_resolve must be false).
4. Safe issues for auto-resolve include: password reset instructions, basic software troubleshooting, basic Wi-Fi / connectivity troubleshooting, standard email troubleshooting, and public FAQ / informational queries.
5. If the ticket is ambiguous, extremely short, or vague (such as "It doesn't work", "something is wrong"), you MUST:
   - Set category to "Needs Manual Review"
   - Set confidence to a low value (between 0.20 and 0.45)
   - Set auto_resolve to false
   - Explain in the reasoning that more specific technical details are required from the user.
6. Understand multilingual and mixed-language input (e.g., Hinglish, Spanglish). If the intent is clear, classify accurately; if ambiguous, assign to "Needs Manual Review".
7. Assign the most appropriate handling team:
   - "IT Support"
   - "Network Operations"
   - "Security Operations"
   - "Systems & Access Administration"
   - "Hardware / Desktop Engineering"
   - "Email & Collaboration Ops"
   - "Service Desk Tier 2 / Manual Triage"

Return ONLY valid JSON conforming to the requested schema.
"""

def get_env_config():
    # Reload in case user edited .env while server is running
    load_dotenv(override=True)
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"
    return api_key, model_name

def analyze_ticket_with_gemini(ticket_text: str) -> Dict[str, Any]:
    api_key, model_name = get_env_config()

    if not api_key:
        raise ValueError(
            "Gemini API key is not configured. Please paste your GEMINI_API_KEY in backend/.env to enable live AI triage."
        )

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        prompt = f"Analyze the following IT support ticket:\n\n\"\"\"\n{ticket_text}\n\"\"\""

        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            response_mime_type="application/json",
            response_schema=GeminiAnalysisOutput,
            temperature=0.1
        )

        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=config
        )

        raw_text = response.text or ""
        if not raw_text.strip():
            raise ValueError("Empty response received from Gemini API.")

        # Parse JSON
        parsed_data = json.loads(raw_text)

        # Validate with Pydantic
        output = GeminiAnalysisOutput.model_validate(parsed_data)
        data = output.model_dump()

    except json.JSONDecodeError:
        # Fallback regex extraction if raw JSON wrapper occurred
        match = re.search(r'\{.*\}', raw_text, re.DOTALL)
        if match:
            parsed_data = json.loads(match.group(0))
            output = GeminiAnalysisOutput.model_validate(parsed_data)
            data = output.model_dump()
        else:
            raise ValueError("AI returned an invalid JSON response structure.")
    except Exception as e:
        error_msg = str(e)
        if "API_KEY_INVALID" in error_msg or "invalid api key" in error_msg.lower():
            raise ValueError("The provided Gemini API key is invalid. Please check backend/.env.")
        elif "quota" in error_msg.lower() or "resource_exhausted" in error_msg.lower():
            raise ValueError("Gemini API quota exceeded or rate limited. Please try again shortly.")
        else:
            raise ValueError(f"AI analysis failed: {error_msg}")

    # Enforce Business Rules & Safety Guardrails
    data = enforce_guardrails(data, ticket_text)
    return data


def enforce_guardrails(data: Dict[str, Any], raw_text: str) -> Dict[str, Any]:
    # 1. Normalize Category
    if data.get("category") not in ALLOWED_CATEGORIES:
        data["category"] = "General IT Query"

    # 2. Normalize Priority
    if data.get("priority") not in ALLOWED_PRIORITIES:
        data["priority"] = "Medium"

    # 3. Confidence threshold enforcement
    confidence = float(data.get("confidence", 0.5))
    warning = None

    if confidence < 0.60:
        data["category"] = "Needs Manual Review"
        data["auto_resolve"] = False
        warning = f"Low confidence ({int(confidence * 100)}%) — manual review recommended."

    # 4. Dangerous / High-Risk Safety Override
    category = data.get("category")
    priority = data.get("priority")
    lower_text = raw_text.lower()

    critical_security_keywords = [
        "ransomware", "hacked", "compromise", "phishing", "wire transfer",
        "stolen", "malware", "bitcoin", "extortion", "suspicious login"
    ]
    hardware_replace_keywords = ["swollen", "broken screen", "smoke", "burned", "spilled", "water damage", "bulging"]
    privilege_keywords = ["admin privilege", "root access", "sudo access", "domain admin", "production s3", "iam role"]

    is_security_or_critical = (
        category in ["Security Issue", "Hardware Fault", "Access Request"] or
        priority == "Critical" or
        any(k in lower_text for k in critical_security_keywords) or
        any(k in lower_text for k in hardware_replace_keywords) or
        any(k in lower_text for k in privilege_keywords)
    )

    if is_security_or_critical:
        # Safe override: dangerous issues must NEVER be auto-resolved
        if category in ["Security Issue", "Hardware Fault", "Access Request"] or priority == "Critical":
            data["auto_resolve"] = False

    # 5. Fallback team routing if unassigned
    if not data.get("assigned_team"):
        if category == "Network Issue":
            data["assigned_team"] = "Network Operations"
        elif category == "Security Issue":
            data["assigned_team"] = "Security Operations"
        elif category == "Hardware Fault":
            data["assigned_team"] = "Hardware / Desktop Engineering"
        elif category == "Access Request":
            data["assigned_team"] = "Systems & Access Administration"
        elif category == "Email Issue":
            data["assigned_team"] = "Email & Collaboration Ops"
        elif category == "Needs Manual Review":
            data["assigned_team"] = "Service Desk Tier 2 / Manual Triage"
        else:
            data["assigned_team"] = "IT Support"

    data["warning"] = warning
    data["status"] = "Pending Approval"
    return data

