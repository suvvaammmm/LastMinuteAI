from services.gemini_service import ask_gemini


def create_plan(task: str) -> str:
    prompt = f"""You are LastMinuteAI, an expert productivity and task-planning coach.

Break this task into clear, actionable, numbered steps. Each step should be specific and achievable.
Include estimated time per step where relevant.

Task: {task}

Return a numbered list of steps. Be concise but thorough. Use plain text only, no markdown.
"""
    return ask_gemini(prompt)
