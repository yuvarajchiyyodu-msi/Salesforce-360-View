"""Bedrock Converse tool specifications and the dispatcher that runs them."""
from .config import ORGS
from .sf_client import run_soql, describe_object, SfError

_ORG_ENUM = list(ORGS)

TOOL_SPECS = [
    {
        "toolSpec": {
            "name": "run_soql",
            "description": (
                "Run a SOQL query against one Salesforce org and get up to 50 rows back. "
                "Use this to find accounts, opportunities, contracts, quotes, cases, etc. "
                "If a field name is wrong the result contains an error you can read and retry."
            ),
            "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                        "org": {
                            "type": "string",
                            "enum": _ORG_ENUM,
                            "description": "Which org to query.",
                        },
                        "query": {
                            "type": "string",
                            "description": "A valid SOQL query string.",
                        },
                    },
                    "required": ["org", "query"],
                }
            },
        }
    },
    {
        "toolSpec": {
            "name": "describe_object",
            "description": (
                "List the fields of an sobject in one org. Use this when you are unsure "
                "what fields exist or how they are named (the two orgs differ)."
            ),
            "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                        "org": {"type": "string", "enum": _ORG_ENUM},
                        "sobject": {
                            "type": "string",
                            "description": "API name of the sobject, e.g. Account, Opportunity, SBQQ__Quote__c.",
                        },
                    },
                    "required": ["org", "sobject"],
                }
            },
        }
    },
]


def dispatch_tool(name: str, args: dict) -> dict:
    """Execute a tool by name. Always returns a dict with an 'ok' key; never raises."""
    try:
        if name == "run_soql":
            if "org" not in args or "query" not in args:
                return {"ok": False, "error": "run_soql requires 'org' and 'query'"}
            return run_soql(args["org"], args["query"])
        if name == "describe_object":
            if "org" not in args or "sobject" not in args:
                return {"ok": False, "error": "describe_object requires 'org' and 'sobject'"}
            return describe_object(args["org"], args["sobject"])
        return {"ok": False, "error": f"Unknown tool '{name}'"}
    except (ValueError, SfError) as exc:
        return {"ok": False, "error": str(exc)}
