import json
from fastapi.testclient import TestClient

import app.main as main_mod
from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_ask_streams_sse(monkeypatch):
    def fake_run_agent(question, **kwargs):
        yield {"type": "status", "message": "Thinking…"}
        yield {"type": "summary", "text": f"answer to: {question}"}
        yield {"type": "done"}

    monkeypatch.setattr(main_mod, "run_agent", fake_run_agent)

    with client.stream("POST", "/api/ask", json={"question": "find acme"}) as r:
        assert r.status_code == 200
        body = "".join(chunk for chunk in r.iter_text())

    events = [json.loads(line[len("data: "):])
              for line in body.splitlines() if line.startswith("data: ")]
    types = [e["type"] for e in events]
    assert types == ["status", "summary", "done"]
    assert "find acme" in events[1]["text"]


def test_ask_requires_question():
    r = client.post("/api/ask", json={})
    assert r.status_code == 422
