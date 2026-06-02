import { useCallback, useRef, useState } from "react";

const API = "http://localhost:8000/api/ask";

// Streams SSE events from POST /api/ask via fetch + ReadableStream.
// (EventSource only supports GET, so we parse the SSE framing ourselves.)
export function useAsk() {
  const [events, setEvents] = useState([]);   // tool_call / tool_result / status
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState("idle"); // idle | running | done | error
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const ask = useCallback(async (question) => {
    setEvents([]);
    setSummary("");
    setError(null);
    setStatus("running");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const line = frame.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const evt = JSON.parse(line.slice(6));
          handleEvent(evt, { setEvents, setSummary, setStatus, setError });
        }
      }
      setStatus((s) => (s === "error" ? s : "done"));
    } catch (e) {
      if (e.name === "AbortError") return;
      setError(e.message);
      setStatus("error");
    }
  }, []);

  return { ask, events, summary, status, error };
}

function handleEvent(evt, { setEvents, setSummary, setStatus, setError }) {
  switch (evt.type) {
    case "status":
    case "tool_call":
    case "tool_result":
      setEvents((prev) => mergeEvent(prev, evt));
      break;
    case "summary":
      setSummary(evt.text);
      break;
    case "done":
      setStatus((s) => (s === "error" ? s : "done"));
      break;
    case "error":
      setError(evt.message);
      setStatus("error");
      break;
    default:
      break;
  }
}

// tool_result merges onto its matching tool_call by id so the feed shows one
// line per tool with a resolved state.
function mergeEvent(prev, evt) {
  if (evt.type === "tool_result") {
    return prev.map((e) =>
      e.type === "tool_call" && e.id === evt.id
        ? { ...e, result: evt }
        : e
    );
  }
  return [...prev, evt];
}
