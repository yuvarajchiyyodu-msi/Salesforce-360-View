import pytest
from app.sf_client import (
    run_soql, describe_object, validate_update, update_record, SfError,
)


def test_run_soql_returns_rows_from_lmr():
    result = run_soql("LMRUATOrg", "SELECT Id, Name FROM Account LIMIT 3")
    assert result["ok"] is True
    assert isinstance(result["records"], list)
    assert len(result["records"]) <= 3
    if result["records"]:
        assert "Id" in result["records"][0]


def test_run_soql_returns_rows_from_vsa():
    result = run_soql("VSAUATOrg", "SELECT Id, Name FROM Account LIMIT 2")
    assert result["ok"] is True
    assert isinstance(result["records"], list)


def test_run_soql_caps_rows_at_max():
    result = run_soql("LMRUATOrg", "SELECT Id FROM Account LIMIT 200")
    assert result["ok"] is True
    assert len(result["records"]) <= 50


def test_run_soql_rejects_unknown_org():
    with pytest.raises(ValueError):
        run_soql("BogusOrg", "SELECT Id FROM Account")


def test_run_soql_bad_query_returns_error_not_raise():
    result = run_soql("LMRUATOrg", "SELECT NoSuchField__c FROM Account LIMIT 1")
    assert result["ok"] is False
    assert result["error"]  # non-empty error text


def test_describe_object_returns_fields():
    result = describe_object("VSAUATOrg", "Account")
    assert result["ok"] is True
    names = [f["name"] for f in result["fields"]]
    assert "Id" in names
    assert "Name" in names


# --- validate_update / update_record allowlist (no live writes) ---

def test_validate_update_rejects_non_updatable_object():
    out = validate_update("LMRUATOrg", "Account", "001x", {"Name": "X"})
    assert out["ok"] is False
    assert "not permitted" in out["error"].lower()


def test_validate_update_rejects_off_allowlist_field():
    out = validate_update("LMRUATOrg", "Case", "500x", {"OwnerId": "x", "CaseNumber": "9"})
    assert out["ok"] is False
    assert "CaseNumber" in out["error"]


def test_validate_update_rejects_unknown_org():
    with pytest.raises(ValueError):
        validate_update("BogusOrg", "Case", "500x", {"Status": "New"})


def test_validate_update_builds_diff_from_current_values(monkeypatch):
    import app.sf_client as sf
    monkeypatch.setattr(
        sf, "run_soql",
        lambda org, query: {"ok": True, "records": [{"Id": "500x", "Priority": "Medium"}], "totalSize": 1, "capped": False},
    )
    out = validate_update("LMRUATOrg", "Case", "500x", {"Priority": "High"})
    assert out["ok"] is True
    assert out["changes"] == [{"field": "Priority", "from": "Medium", "to": "High"}]


def test_validate_update_record_not_found(monkeypatch):
    import app.sf_client as sf
    monkeypatch.setattr(
        sf, "run_soql",
        lambda org, query: {"ok": True, "records": [], "totalSize": 0, "capped": False},
    )
    out = validate_update("LMRUATOrg", "Case", "500missing", {"Status": "Closed"})
    assert out["ok"] is False
    assert "no case found" in out["error"].lower()


def test_update_record_rejects_off_allowlist_field_before_write():
    # Off-allowlist must fail without ever shelling out to sf.
    out = update_record("LMRUATOrg", "Opportunity", "006x", {"IsClosed": True})
    assert out["ok"] is False
    assert "IsClosed" in out["error"]


def test_update_record_writes_allowlisted_fields(monkeypatch):
    import app.sf_client as sf
    captured = {}
    def fake_run(args):
        captured["args"] = args
        return {"status": 0, "result": {"id": "006x", "success": True}}
    monkeypatch.setattr(sf, "_run", fake_run)
    out = update_record("VSAUATOrg", "Opportunity", "006x", {"StageName": "Closed Won"})
    assert out["ok"] is True
    assert out["record_id"] == "006x"
    assert "update" in captured["args"] and "record" in captured["args"]
