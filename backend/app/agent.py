"""The Bedrock Converse agentic loop. `run_agent` is a generator that yields
event dicts matching the SSE contract."""
import re

import boto3

from .config import AWS_REGION, MODEL_ID, MAX_TOOL_CALLS
from .system_prompt import SYSTEM_PROMPT
from .tools import TOOL_SPECS, dispatch_tool

_SUGGESTIONS_RE = re.compile(r"<suggestions>(.*?)</suggestions>", re.DOTALL | re.IGNORECASE)


def _make_client():
    return boto3.client("bedrock-runtime", region_name=AWS_REGION)


def _summarize_tool_result(result: dict) -> dict:
    """Compact a tool result for streaming back to the UI."""
    if result.get("ok"):
        return {"ok": True, "rowCount": len(result.get("records", result.get("fields", [])))}
    return {"ok": False, "error": result.get("error", "unknown error")}


def _split_suggestions(text: str):
    """Pull the <suggestions> block out of the final answer.

    Returns (clean_summary, [suggestion, ...]). The block is stripped from the
    summary so it never renders as raw text.
    """
    suggestions = []
    match = _SUGGESTIONS_RE.search(text)
    if match:
        for line in match.group(1).splitlines():
            s = line.strip().lstrip("-*0123456789. ").strip()
            if s:
                suggestions.append(s)
    clean = _SUGGESTIONS_RE.sub("", text).strip()
    return clean, suggestions[:4]


def _build_messages(question: str, history):
    """Turn optional prior turns + the new question into Converse messages.

    `history` is a list of {"role": "user"|"assistant", "text": str}. We pass it
    as plain text turns so the model has context without us replaying tool calls.
    """
    messages = []
    for turn in history or []:
        role = turn.get("role")
        text = (turn.get("text") or "").strip()
        if role in ("user", "assistant") and text:
            messages.append({"role": role, "content": [{"text": text}]})
    messages.append({"role": "user", "content": [{"text": question}]})
    return messages


def run_agent(question: str, client=None, max_tool_calls: int = MAX_TOOL_CALLS, history=None):
    """Yield event dicts: status, tool_call, tool_result, summary, suggestions, done, error."""
    if client is None:
        client = _make_client()

    messages = _build_messages(question, history)
    tool_config = {"tools": TOOL_SPECS}
    calls_made = 0

    yield {"type": "status", "message": "Thinking…"}

    try:
        while True:
            response = client.converse(
                modelId=MODEL_ID,
                messages=messages,
                system=[{"text": SYSTEM_PROMPT}],
                toolConfig=tool_config,
                inferenceConfig={"maxTokens": 4096, "temperature": 0.2},
            )

            out_message = response["output"]["message"]
            messages.append(out_message)
            stop_reason = response.get("stopReason")
            content = out_message.get("content", [])

            # Stream interim assistant prose (between tool calls) as status.
            for block in content:
                if "text" in block and block["text"].strip() and stop_reason == "tool_use":
                    yield {"type": "status", "message": block["text"].strip()[:240]}

            if stop_reason != "tool_use":
                final_text = "".join(b.get("text", "") for b in content).strip()
                summary, suggestions = _split_suggestions(final_text)
                yield {"type": "summary", "text": summary}
                if suggestions:
                    yield {"type": "suggestions", "items": suggestions}
                yield {"type": "done"}
                return

            # Execute every toolUse block, collect results into one user turn.
            tool_results = []
            for block in content:
                if "toolUse" not in block:
                    continue
                tu = block["toolUse"]
                args = tu.get("input", {}) or {}

                if calls_made >= max_tool_calls:
                    tool_results.append({
                        "toolResult": {
                            "toolUseId": tu["toolUseId"],
                            "content": [{"json": {"ok": False,
                                "error": "Tool-call budget exhausted. Summarize with what you have."}}],
                        }
                    })
                    continue

                calls_made += 1
                yield {
                    "type": "tool_call",
                    "id": tu["toolUseId"],
                    "tool": tu["name"],
                    "org": args.get("org"),
                    "query": args.get("query") or args.get("sobject"),
                }
                result = dispatch_tool(tu["name"], args)
                yield {
                    "type": "tool_result",
                    "id": tu["toolUseId"],
                    **_summarize_tool_result(result),
                }
                tool_results.append({
                    "toolResult": {
                        "toolUseId": tu["toolUseId"],
                        "content": [{"json": result}],
                    }
                })

            messages.append({"role": "user", "content": tool_results})

            # If we just hit the cap, force a final summarization turn (no tools).
            if calls_made >= max_tool_calls:
                yield {"type": "status", "message": "Wrapping up this step…"}
                final = client.converse(
                    modelId=MODEL_ID,
                    messages=messages,
                    system=[{"text": SYSTEM_PROMPT}],
                    inferenceConfig={"maxTokens": 4096, "temperature": 0.2},
                )
                fmsg = final["output"]["message"]
                text = "".join(b.get("text", "") for b in fmsg.get("content", [])).strip()
                summary, suggestions = _split_suggestions(text)
                yield {"type": "summary", "text": summary or "Reached the step limit before completing."}
                if suggestions:
                    yield {"type": "suggestions", "items": suggestions}
                yield {"type": "done"}
                return

    except Exception as exc:  # noqa: BLE001 — surface any AWS/Bedrock error to the UI
        yield {"type": "error", "message": f"{type(exc).__name__}: {exc}"}
        return
