"""FastAPI app exposing /api/ask (SSE) and /api/health."""
import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from .agent import run_agent
from .config import ORGS, ORG_LABELS

app = FastAPI(title="Headless 360")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AskRequest(BaseModel):
    question: str


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "orgs": [{"alias": o, "label": ORG_LABELS[o]} for o in ORGS],
    }


@app.post("/api/ask")
def ask(req: AskRequest):
    def event_stream():
        for event in run_agent(req.question):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
