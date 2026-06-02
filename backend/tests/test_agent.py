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


def test_agent_parses_suggestions_block():
    answer = (
        "Across both orgs we found **13 accounts**.\n\n"
        "<suggestions>\n"
        "Show open opportunities in VS&A\n"
        "Break down LMR accounts by type\n"
        "</suggestions>"
    )
    client = FakeBedrock([_text_response(answer)])
    events = list(run_agent("overview", client=client))
    summary = next(e for e in events if e["type"] == "summary")
    suggestions = next(e for e in events if e["type"] == "suggestions")
    assert "<suggestions>" not in summary["text"]
    assert "13 accounts" in summary["text"]
    assert suggestions["items"] == [
        "Show open opportunities in VS&A",
        "Break down LMR accounts by type",
    ]


def test_agent_no_suggestions_event_when_absent():
    client = FakeBedrock([_text_response("Just a plain answer.")])
    events = list(run_agent("hi", client=client))
    assert not any(e["type"] == "suggestions" for e in events)


def test_agent_passes_history_into_messages():
    client = FakeBedrock([_text_response("ok")])
    history = [
        {"role": "user", "text": "everything on UC"},
        {"role": "assistant", "text": "Found 13 accounts."},
    ]
    list(run_agent("dig into the largest", client=client, history=history))
    sent = client.calls[0]["messages"]
    # The loop appends the assistant's own reply after the call, so inspect the
    # leading turns: history (2) + the new question (1).
    assert sent[0]["content"][0]["text"] == "everything on UC"
    assert sent[1]["role"] == "assistant"
    assert sent[2]["content"][0]["text"] == "dig into the largest"
    assert sent[2]["role"] == "user"


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
