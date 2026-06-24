from services.gemini_service import ask_gemini

def rescue_plan(task, hours_needed, hours_left):

    prompt = f"""
You are an AI Deadline Rescue Agent.

Task: {task}
Hours Needed: {hours_needed}
Hours Left: {hours_left}

Analyze whether the user is at risk of missing the deadline.

Return ONLY valid JSON.

{{
  "risk":"HIGH",
  "focus":[
    "Task 1",
    "Task 2"
  ],
  "postpone":[
    "Task A",
    "Task B"
  ],
  "schedule":[
    "2PM-4PM Work",
    "4PM-5PM Review"
  ],
  "success_probability":"85%"
}}
"""

    return ask_gemini(prompt)