from app.tools import TOOL_SPECS, dispatch_tool


def test_tool_specs_shape():
    names = {t["toolSpec"]["name"] for t in TOOL_SPECS}
    assert names == {"run_soql", "describe_object", "propose_update"}
    for t in TOOL_SPECS:
        spec = t["toolSpec"]
        assert "description" in spec
        assert "json" in spec["inputSchema"]


def test_dispatch_run_soql(monkeypatch):
    import app.tools as tools
    monkeypatch.setattr(
        tools, "run_soql",
        lambda org, query: {"ok": True, "records": [{"Id": "1"}], "totalSize": 1, "capped": False},
    )
    out = dispatch_tool("run_soql", {"org": "LMRUATOrg", "query": "SELECT Id FROM Account"})
    assert out["ok"] is True
    assert out["records"] == [{"Id": "1"}]


def test_dispatch_describe(monkeypatch):
    import app.tools as tools
    monkeypatch.setattr(
        tools, "describe_object",
        lambda org, sobject: {"ok": True, "fields": [{"name": "Id"}]},
    )
    out = dispatch_tool("describe_object", {"org": "VSAUATOrg", "sobject": "Account"})
    assert out["ok"] is True


def test_dispatch_unknown_tool():
    out = dispatch_tool("nope", {})
    assert out["ok"] is False
    assert "unknown tool" in out["error"].lower()


def test_dispatch_missing_arg():
    out = dispatch_tool("run_soql", {"org": "LMRUATOrg"})
    assert out["ok"] is False
    assert out["error"]


def test_dispatch_propose_update(monkeypatch):
    import app.tools as tools
    monkeypatch.setattr(
        tools, "validate_update",
        lambda org, sobject, record_id, fields: {
            "ok": True, "org": org, "sobject": sobject, "record_id": record_id,
            "changes": [{"field": "Priority", "from": "Low", "to": "High"}],
        },
    )
    out = dispatch_tool("propose_update", {
        "org": "LMRUATOrg", "sobject": "Case", "record_id": "500x",
        "fields": {"Priority": "High"},
    })
    assert out["ok"] is True
    assert out["changes"][0]["to"] == "High"


def test_dispatch_propose_update_missing_args():
    out = dispatch_tool("propose_update", {"org": "LMRUATOrg", "sobject": "Case"})
    assert out["ok"] is False
    assert "record_id" in out["error"]
