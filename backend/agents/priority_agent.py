from services.gemini_service import ask_gemini

def prioritize_tasks(tasks):

    prompt = f"""
You are an API.

Tasks:
{tasks}

Return ONLY valid JSON.

NO markdown.
NO explanation.
NO code blocks.
NO ```json.

Example:

{{
  "priorities":[
    {{
      "rank":1,
      "task":"Assignment Submission",
      "reason":"Nearest deadline"
    }}
  ]
}}
"""

    return ask_gemini(prompt)