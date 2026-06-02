from app.agent import run_agent


class FakeBedrock:
    """Returns a scripted sequence of Converse responses."""
    def __init__(self, responses):
        self._responses = list(responses)
        self.calls = []

    def converse(self, **kwargs):
        self.calls.append(kwargs)
        return self._responses.pop(0)


def _text_response(text):
    return {"stopReason": "end_turn",
            "output": {"message": {"role": "assistant", "content": [{"text": text}]}}}


def _tool_response(tool_use_id, name, inputs):
    return {"stopReason": "tool_use",
            "output": {"message": {"role": "assistant", "content": [
                {"toolUse": {"toolUseId": tool_use_id, "name": name, "input": inputs}}
            ]}}}


def test_agent_emits_summary_for_plain_answer():
    client = FakeBedrock([_text_response("All done. Customer found.")])
    events = list(run_agent("anything", client=client))
    types = [e["type"] for e in events]
    assert types[-1] == "done"
    assert any(e["type"] == "summary" and "All done" in e["text"] for e in events)


def test_agent_runs_tool_then_summarizes(monkeypatch):
    import app.agent as agent_mod
    monkeypatch.setattr(
        agent_mod, "dispatch_tool",
        lambda name, args: {"ok": True, "records": [{"Id": "001"}], "totalSize": 1, "capped": False},
    )
    client = FakeBedrock([
        _tool_response("t1", "run_soql", {"org": "LMRUATOrg", "query": "SELECT Id FROM Account"}),
        _text_response("Found 1 account."),
    ])
    events = list(run_agent("find acme", client=client))
    types = [e["type"] for e in events]
    assert "tool_call" in types
    assert "tool_result" in types
    assert types[-1] == "done"
    call_event = next(e for e in events if e["type"] == "tool_call")
    assert call_event["tool"] == "run_soql"
    assert call_event["org"] == "LMRUATOrg"


def test_agent_respects_tool_call_cap(monkeypatch):
    import app.agent as agent_mod
    monkeypatch.setattr(
        agent_mod, "dispatch_tool",
        lambda name, args: {"ok": True, "records": [], "totalSize": 0, "capped": False},
    )
    # Always asks for another tool — should stop at the cap, not loop forever.
    forever = [
        _tool_response(f"t{i}", "run_soql", {"org": "LMRUATOrg", "query": "SELECT Id FROM Account"})
        for i in range(50)
    ]
    client = FakeBedrock(forever)
    events = list(run_agent("loop", client=client, max_tool_calls=3))
    tool_calls = [e for e in events if e["type"] == "tool_call"]
    assert len(tool_calls) == 3
    assert events[-1]["type"] == "done"
