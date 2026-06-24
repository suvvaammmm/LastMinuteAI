from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json

from agents.planning_agent import create_plan
from agents.priority_agent import prioritize_tasks
from agents.rescue_agent import rescue_plan

app = FastAPI(title="LastMinuteAI")

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

        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]

        if cleaned.startswith("```"):
            cleaned = cleaned[3:]

        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]

        cleaned = cleaned.strip()

        return json.loads(cleaned)

    except Exception as e:
        return {
            "error": str(e),
            "raw_response": result
        }


# -------------------------
# Routes
# -------------------------

@app.get("/")
def home():
    return {
        "message": "🚀 LastMinuteAI Backend Running"
    }


# -------------------------
# Planner Agent
# -------------------------

@app.post("/plan")
def plan_task(req: TaskRequest):

    result = create_plan(req.task)

    return {
        "plan": result
    }


# -------------------------
# Priority Agent
# -------------------------

@app.post("/priority")
def priority(req: PriorityRequest):

    result = prioritize_tasks(req.tasks)

    return parse_gemini_json(result)


# -------------------------
# Rescue Agent
# -------------------------

@app.post("/rescue")
def rescue(req: RescueRequest):

    result = rescue_plan(
        req.task,
        req.hours_needed,
        req.hours_left
    )

    return parse_gemini_json(result)