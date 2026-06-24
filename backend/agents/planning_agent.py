from services.gemini_service import ask_gemini

def create_plan(task):

    prompt = f"""
    Break this task into
    small actionable steps.

    Task:
    {task}

    Return numbered steps.
    """

    return ask_gemini(prompt)