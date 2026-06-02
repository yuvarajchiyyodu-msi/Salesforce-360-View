"""Thin subprocess wrappers around the Salesforce `sf` CLI.

Functions never raise on Salesforce-side errors (bad SOQL, unknown field) —
they return {"ok": False, "error": "..."} so the agent can read the failure
and adapt. They DO raise ValueError for programmer errors (unknown org).
"""
import json
import subprocess

from .config import ORGS, MAX_ROWS, SF_TIMEOUT_SECONDS, UPDATABLE_FIELDS


class SfError(RuntimeError):
    """Raised when the sf CLI itself fails to run (not a Salesforce data error)."""


def _run(args: list[str]) -> dict:
    """Run an sf command with --json and return the parsed JSON object.

    Returns the parsed dict regardless of exit code (sf emits JSON on failure
    too). Raises SfError only when the process can't run or emits no JSON.
    """
    try:
        proc = subprocess.run(
            args,
            capture_output=True,
            text=True,
            timeout=SF_TIMEOUT_SECONDS,
        )
    except FileNotFoundError as exc:
        raise SfError("sf CLI not found on PATH") from exc
    except subprocess.TimeoutExpired as exc:
        raise SfError(f"sf command timed out after {SF_TIMEOUT_SECONDS}s") from exc

    raw = proc.stdout.strip() or proc.stderr.strip()
    if not raw:
        raise SfError(f"sf produced no output (exit {proc.returncode})")
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise SfError(f"sf output was not JSON: {raw[:200]}") from exc


def _check_org(org: str) -> None:
    if org not in ORGS:
        raise ValueError(f"Unknown org '{org}'. Allowed: {', '.join(ORGS)}")


def run_soql(org: str, query: str) -> dict:
    """Run a SOQL query against `org`.

    Returns {"ok": True, "records": [...], "totalSize": int, "capped": bool}
    or {"ok": False, "error": "..."}.
    """
    _check_org(org)
    parsed = _run([
        "sf", "data", "query",
        "--query", query,
        "--target-org", org,
        "--json",
    ])
    if parsed.get("status") != 0:
        msg = parsed.get("message") or json.dumps(parsed)[:300]
        return {"ok": False, "error": msg}

    result = parsed.get("result", {})
    records = result.get("records", [])
    total = result.get("totalSize", len(records))
    capped = len(records) > MAX_ROWS
    trimmed = [_strip_attributes(r) for r in records[:MAX_ROWS]]
    return {"ok": True, "records": trimmed, "totalSize": total, "capped": capped}


def describe_object(org: str, sobject: str) -> dict:
    """Describe an sobject's fields so the agent can discover field names.

    Returns {"ok": True, "fields": [{"name","label","type"}...]} or
    {"ok": False, "error": "..."}.
    """
    _check_org(org)
    parsed = _run([
        "sf", "sobject", "describe",
        "--sobject", sobject,
        "--target-org", org,
        "--json",
    ])
    if parsed.get("status") != 0:
        msg = parsed.get("message") or json.dumps(parsed)[:300]
        return {"ok": False, "error": msg}

    fields = parsed.get("result", {}).get("fields", [])
    slim = [
        {"name": f.get("name"), "label": f.get("label"), "type": f.get("type")}
        for f in fields
    ]
    return {"ok": True, "fields": slim}


def _check_updatable(sobject: str, fields) -> list[str]:
    """Validate an update is allowed. Returns the allowlist for the object.

    Raises ValueError if the object isn't updatable or any field is off-allowlist.
    This is the single gate enforced for BOTH the agent's proposal and the
    confirmed write, so a malformed proposal can never reach Salesforce.
    """
    allowed = UPDATABLE_FIELDS.get(sobject)
    if allowed is None:
        raise ValueError(
            f"Updates to '{sobject}' are not permitted. Updatable objects: "
            f"{', '.join(UPDATABLE_FIELDS)}"
        )
    bad = [f for f in fields if f not in allowed]
    if bad:
        raise ValueError(
            f"Field(s) not updatable on {sobject}: {', '.join(bad)}. "
            f"Allowed: {', '.join(allowed)}"
        )
    return allowed


def validate_update(org: str, sobject: str, record_id: str, fields: dict) -> dict:
    """Validate a proposed update and read current values for a before→after diff.

    Does NOT write. Returns {"ok": True, "record_id", "sobject", "changes":
    [{"field","from","to"}...]} or {"ok": False, "error": "..."}.
    """
    _check_org(org)
    if not record_id:
        return {"ok": False, "error": "record_id is required"}
    if not fields:
        return {"ok": False, "error": "no fields to update"}
    try:
        _check_updatable(sobject, fields.keys())
    except ValueError as exc:
        return {"ok": False, "error": str(exc)}

    # Read the record's current values for the proposed fields.
    cols = ", ".join(["Id", *fields.keys()])
    safe_id = record_id.replace("'", "")
    current = run_soql(org, f"SELECT {cols} FROM {sobject} WHERE Id = '{safe_id}'")
    if not current.get("ok"):
        return current
    rows = current.get("records", [])
    if not rows:
        return {"ok": False, "error": f"No {sobject} found with Id {record_id}"}
    row = rows[0]

    changes = [
        {"field": name, "from": row.get(name), "to": new_value}
        for name, new_value in fields.items()
    ]
    return {"ok": True, "record_id": record_id, "sobject": sobject, "org": org, "changes": changes}


def update_record(org: str, sobject: str, record_id: str, fields: dict) -> dict:
    """Write field updates to one record via `sf data update record`.

    Re-validates the allowlist before writing. Returns {"ok": True, "record_id"}
    or {"ok": False, "error": "..."}.
    """
    _check_org(org)
    if not record_id:
        return {"ok": False, "error": "record_id is required"}
    if not fields:
        return {"ok": False, "error": "no fields to update"}
    try:
        _check_updatable(sobject, fields.keys())
    except ValueError as exc:
        return {"ok": False, "error": str(exc)}

    # sf expects --values "Field=value Field2=value2"; quote each value.
    values = " ".join(f'{k}="{str(v)}"' for k, v in fields.items())
    parsed = _run([
        "sf", "data", "update", "record",
        "--sobject", sobject,
        "--record-id", record_id,
        "--values", values,
        "--target-org", org,
        "--json",
    ])
    if parsed.get("status") != 0:
        msg = parsed.get("message") or json.dumps(parsed)[:300]
        return {"ok": False, "error": msg}
    return {"ok": True, "record_id": record_id, "sobject": sobject}


def _strip_attributes(record: dict) -> dict:
    """Remove Salesforce's noisy `attributes` block and flatten nothing else."""
    return {k: v for k, v in record.items() if k != "attributes"}
