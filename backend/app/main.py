"""FastAPI app exposing /api/ask (SSE) and /api/health."""
import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from .agent import run_agent
from .config import ORGS, ORG_LABELS
from .sf_client import update_record


class Turn(BaseModel):
    role: str   # "user" | "assistant"
    text: str

app = FastAPI(title="Headless 360")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AskRequest(BaseModel):
    question: str
    history: list[Turn] = []


class UpdateRequest(BaseModel):
    org: str
    sobject: str
    record_id: str
    fields: dict


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "orgs": [{"alias": o, "label": ORG_LABELS[o]} for o in ORGS],
    }


@app.post("/api/ask")
def ask(req: AskRequest):
    history = [{"role": t.role, "text": t.text} for t in req.history]

    def event_stream():
        for event in run_agent(req.question, history=history):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/update")
def update(req: UpdateRequest):
    """Apply a confirmed field update. The only write path in the app; the
    allowlist is re-checked inside update_record before anything is written."""
    return update_record(req.org, req.sobject, req.record_id, req.fields)
