import pytest
from app.sf_client import run_soql, describe_object, SfError


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
