from services.gemini_service import ask_gemini


def rescue_plan(task: str, hours_needed: int, hours_left: int) -> str:
    shortfall = hours_needed - hours_left
    is_at_risk = hours_left < hours_needed

    prompt = f"""You are LastMinuteAI, an AI Deadline Rescue Agent.

Analyze this time-critical situation and create an emergency action plan.

Task: {task}
Hours Needed: {hours_needed}
Hours Left: {hours_left}
Time Shortfall: {shortfall if is_at_risk else 0} hours {"(AT RISK)" if is_at_risk else "(ON TRACK)"}

Return ONLY valid JSON. No markdown. No explanation. No backticks.

{{
  "risk": "HIGH",
  "summary": "Brief one-line assessment of the situation",
  "focus": [
    "Most critical sub-task to prioritize"
  ],
  "postpone": [
    "Non-essential task to drop or defer"
  ],
  "schedule": [
    "2PM–4PM: Core implementation work",
    "4PM–5PM: Review and testing"
  ],
  "tips": [
    "Practical tip to work faster or smarter"
  ],
  "success_probability": "75%"
}}

"risk" must be one of: "LOW", "MEDIUM", "HIGH", "CRITICAL".
Be realistic about success probability based on the hours available.
"""
    return ask_gemini(prompt)
