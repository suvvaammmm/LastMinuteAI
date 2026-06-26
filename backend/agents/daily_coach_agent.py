from services.gemini_service import ask_gemini

def daily_action_plan(tasks):

    prompt = f"""
You are LastMinuteAI, an AI productivity coach.

Today's Tasks:
{tasks}

Your goal is to help the user make the best decisions today and avoid missing deadlines.

Return ONLY valid JSON.

{{
  "highest_priority":"Assignment Submission",
  "today_goal":"Finish the assignment and prepare for the interview.",
  "recommended_schedule":[
    "4 PM - 6 PM Assignment Submission",
    "6 PM - 7 PM Technical Interview Preparation",
    "7 PM - 7:30 PM Gym"
  ],
  "avoid":[
    "Netflix",
    "Social Media"
  ],
  "motivation":"Focus on what moves you closer to your goals.",
  "completion_probability":"90%"
}}
"""

    return ask_gemini(prompt)