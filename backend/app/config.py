"""Static configuration for Headless 360. No secrets here — AWS creds come from
the ambient environment / federated role; orgs come from the local sf CLI."""

# Salesforce CLI org aliases in scope (already authenticated locally).
ORGS = ("LMRUATOrg", "VSAUATOrg")

# Friendly labels used in the UI / prompt.
ORG_LABELS = {
    "LMRUATOrg": "MCN / LMR",
    "VSAUATOrg": "VS&A",
}

# Bedrock
AWS_REGION = "us-east-1"
MODEL_ID = "us.anthropic.claude-sonnet-4-6"

# Safety caps
MAX_ROWS = 50            # rows returned to Claude per SOQL call
MAX_TOOL_CALLS = 8       # tool calls per conversational turn (staggered, not exhaustive)
SF_TIMEOUT_SECONDS = 60  # per sf subprocess invocation

# Writes are confirm-gated and limited to these objects + fields. The agent may
# only PROPOSE changes to these; the allowlist is re-checked server-side before
# any record is written. Keep this tight — it's the blast radius for writes.
UPDATABLE_FIELDS = {
    "Case": ["Status", "Priority", "Subject", "Description", "OwnerId"],
    "Opportunity": ["StageName", "Amount", "CloseDate", "NextStep", "Description"],
}
