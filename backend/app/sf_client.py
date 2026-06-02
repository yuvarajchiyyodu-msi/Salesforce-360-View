"""Thin subprocess wrappers around the Salesforce `sf` CLI.

Functions never raise on Salesforce-side errors (bad SOQL, unknown field) —
they return {"ok": False, "error": "..."} so the agent can read the failure
and adapt. They DO raise ValueError for programmer errors (unknown org).
"""
import json
import subprocess

from .config import ORGS, MAX_ROWS, SF_TIMEOUT_SECONDS


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


def _strip_attributes(record: dict) -> dict:
    """Remove Salesforce's noisy `attributes` block and flatten nothing else."""
    return {k: v for k, v in record.items() if k != "attributes"}
