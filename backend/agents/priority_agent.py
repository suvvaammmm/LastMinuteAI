from services.gemini_service import ask_gemini


def prioritize_tasks(tasks: list) -> str:
    tasks_formatted = "\n".join(f"- {t}" for t in tasks)

    prompt = f"""You are LastMinuteAI, an AI productivity assistant.

Analyze and rank the following tasks by urgency and importance.

Tasks:
{tasks_formatted}

Return ONLY valid JSON. No markdown. No explanation. No code blocks. No backticks.

{{
  "priorities": [
    {{
      "rank": 1,
      "task": "Task name here",
      "reason": "Brief reason for this priority rank",
      "urgency": "HIGH"
    }}
  ]
}}

"urgency" must be one of: "HIGH", "MEDIUM", "LOW".
Include all tasks in the list, ranked from most to least important.
"""
    return ask_gemini(prompt)
