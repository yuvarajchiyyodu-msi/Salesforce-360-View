"""The Bedrock Converse agentic loop. `run_agent` is a generator that yields
event dicts matching the SSE contract."""
import boto3

from .config import AWS_REGION, MODEL_ID, MAX_TOOL_CALLS
from .system_prompt import SYSTEM_PROMPT
from .tools import TOOL_SPECS, dispatch_tool


def _make_client():
    return boto3.client("bedrock-runtime", region_name=AWS_REGION)


def _summarize_tool_result(result: dict) -> dict:
    """Compact a tool result for streaming back to the UI."""
    if result.get("ok"):
        return {"ok": True, "rowCount": len(result.get("records", result.get("fields", [])))}
    return {"ok": False, "error": result.get("error", "unknown error")}


def run_agent(question: str, client=None, max_tool_calls: int = MAX_TOOL_CALLS):
    """Yield event dicts: status, tool_call, tool_result, summary, done, error."""
    if client is None:
        client = _make_client()

    messages = [{"role": "user", "content": [{"text": question}]}]
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

            # Stream any assistant prose as status.
            for block in content:
                if "text" in block and block["text"].strip():
                    if stop_reason != "tool_use":
                        # final text — handled below as summary
                        continue
                    yield {"type": "status", "message": block["text"].strip()[:240]}

            if stop_reason != "tool_use":
                final_text = "".join(b.get("text", "") for b in content).strip()
                yield {"type": "summary", "text": final_text}
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

            # If we just hit the cap, force a final summarization turn.
            if calls_made >= max_tool_calls:
                yield {"type": "status", "message": "Tool budget reached — consolidating…"}
                final = client.converse(
                    modelId=MODEL_ID,
                    messages=messages,
                    system=[{"text": SYSTEM_PROMPT}],
                    inferenceConfig={"maxTokens": 4096, "temperature": 0.2},
                )
                fmsg = final["output"]["message"]
                text = "".join(b.get("text", "") for b in fmsg.get("content", [])).strip()
                yield {"type": "summary", "text": text or "Reached tool limit before completing."}
                yield {"type": "done"}
                return

    except Exception as exc:  # noqa: BLE001 — surface any AWS/Bedrock error to the UI
        yield {"type": "error", "message": f"{type(exc).__name__}: {exc}"}
        return
