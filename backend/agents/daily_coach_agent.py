from services.gemini_service import ask_gemini


def daily_action_plan(tasks: list) -> str:
    tasks_formatted = "\n".join(f"- {t}" for t in tasks)

    prompt = f"""You are LastMinuteAI, an AI productivity coach helping users make the most of their day.

Today's tasks:
{tasks_formatted}

Create a practical daily action plan. Help the user prioritize, schedule wisely, and avoid distractions.

Return ONLY valid JSON. No markdown. No explanation. No backticks.

{{
  "highest_priority": "The single most important task today",
  "today_goal": "One clear, motivating goal statement for the day",
  "recommended_schedule": [
    "9AM–11AM: Task with context",
    "11AM–12PM: Another task"
  ],
  "avoid": [
    "Specific distraction or time-waster to skip today"
  ],
  "motivation": "A short, genuine motivational message specific to these tasks",
  "completion_probability": "85%",
  "quick_wins": [
    "A fast task that can be done in under 15 minutes to build momentum"
  ]
}}

Be specific and practical. The schedule should feel realistic, not aspirational.
"""
    return ask_gemini(prompt)
