from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json

from agents.planning_agent import create_plan
from agents.priority_agent import prioritize_tasks
from agents.rescue_agent import rescue_plan
from agents.daily_coach_agent import daily_action_plan

app = FastAPI(title="LastMinuteAI", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------
# Request Models
# -------------------------

class TaskRequest(BaseModel):
    task: str


class PriorityRequest(BaseModel):
    tasks: list[str]


class RescueRequest(BaseModel):
    task: str
    hours_needed: int
    hours_left: int


class DailyCoachRequest(BaseModel):
    tasks: list[str]


# -------------------------
# Utility Function
# -------------------------

def parse_gemini_json(result: str):
    """
    Removes markdown wrappers like ```json ... ```
    and converts response into JSON.
    """
    try:
        cleaned = result.strip()

        # Strip any number of opening backtick blocks
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]

        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]

        cleaned = cleaned.strip()
        return json.loads(cleaned)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error": str(e), "raw_response": result}
        )


# -------------------------
# Routes
# -------------------------

@app.get("/")
def home():
    return {"message": "🚀 LastMinuteAI Backend Running"}


# -------------------------
# Planner Agent
# -------------------------

@app.post("/plan")
def plan_task(req: TaskRequest):
    if not req.task.strip():
        raise HTTPException(status_code=400, detail="Task cannot be empty.")

    result = create_plan(req.task)

    if result.startswith("Gemini Error"):
        raise HTTPException(status_code=502, detail=result)

    return {"plan": result}


# -------------------------
# Priority Agent
# -------------------------

@app.post("/priority")
def priority(req: PriorityRequest):
    if not req.tasks:
        raise HTTPException(status_code=400, detail="Tasks list cannot be empty.")

    result = prioritize_tasks(req.tasks)

    if isinstance(result, str) and result.startswith("Gemini Error"):
        raise HTTPException(status_code=502, detail=result)

    return parse_gemini_json(result)


# -------------------------
# Rescue Agent
# -------------------------

@app.post("/rescue")
def rescue(req: RescueRequest):
    if not req.task.strip():
        raise HTTPException(status_code=400, detail="Task cannot be empty.")
    if req.hours_needed <= 0 or req.hours_left <= 0:
        raise HTTPException(status_code=400, detail="Hours must be positive numbers.")

    result = rescue_plan(req.task, req.hours_needed, req.hours_left)

    if isinstance(result, str) and result.startswith("Gemini Error"):
        raise HTTPException(status_code=502, detail=result)

    return parse_gemini_json(result)


# -------------------------
# Daily Coach Agent
# -------------------------

@app.post("/daily-coach")
def daily_coach(req: DailyCoachRequest):
    if not req.tasks:
        raise HTTPException(status_code=400, detail="Tasks list cannot be empty.")

    result = daily_action_plan(req.tasks)

    if isinstance(result, str) and result.startswith("Gemini Error"):
        raise HTTPException(status_code=502, detail=result)

    return parse_gemini_json(result)
