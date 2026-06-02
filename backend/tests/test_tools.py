from app.tools import TOOL_SPECS, dispatch_tool


def test_tool_specs_shape():
    names = {t["toolSpec"]["name"] for t in TOOL_SPECS}
    assert names == {"run_soql", "describe_object"}
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
