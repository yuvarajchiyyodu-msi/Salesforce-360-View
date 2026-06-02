import { useCallback, useRef, useState } from "react";

const API = "http://localhost:8000/api/ask";

// Manages a multi-turn conversation. Each turn is:
//   { id, question, events: [...], summary, suggestions: [...], status, error }
// where status is "running" | "done" | "error". Follow-up questions carry the
// prior turns back to the backend as history, so the agent stays stateless but
// context-aware.
export function useAsk() {
  const [turns, setTurns] = useState([]);
  const idRef = useRef(0);

  const running = turns.some((t) => t.status === "running");

  const ask = useCallback(async (question) => {
    const id = ++idRef.current;

    // Build history from completed turns BEFORE adding the new one.
    let history = [];
    setTurns((prev) => {
      history = prev.flatMap((t) =>
        t.summary
          ? [
              { role: "user", text: t.question },
              { role: "assistant", text: t.summary },
            ]
          : []
      );
      return [
        ...prev,
        { id, question, events: [], summary: "", suggestions: [], status: "running", error: null },
      ];
    });

    const patch = (fn) =>
      setTurns((prev) => prev.map((t) => (t.id === id ? fn(t) : t)));

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history }),
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
          applyEvent(JSON.parse(line.slice(6)), patch);
        }
      }
      patch((t) => (t.status === "error" ? t : { ...t, status: "done" }));
    } catch (e) {
      patch((t) => ({ ...t, status: "error", error: e.message }));
    }
  }, []);

  return { ask, turns, running };
}

function applyEvent(evt, patch) {
  switch (evt.type) {
    case "status":
    case "tool_call":
    case "tool_result":
      patch((t) => ({ ...t, events: mergeEvent(t.events, evt) }));
      break;
    case "summary":
      patch((t) => ({ ...t, summary: evt.text }));
      break;
    case "suggestions":
      patch((t) => ({ ...t, suggestions: evt.items ?? [] }));
      break;
    case "done":
      patch((t) => (t.status === "error" ? t : { ...t, status: "done" }));
      break;
    case "error":
      patch((t) => ({ ...t, status: "error", error: evt.message }));
      break;
    default:
      break;
  }
}

// tool_result merges onto its matching tool_call by id so the feed shows one
// line per tool with a resolved state.
function mergeEvent(events, evt) {
  if (evt.type === "tool_result") {
    return events.map((e) =>
      e.type === "tool_call" && e.id === evt.id ? { ...e, result: evt } : e
    );
  }
  return [...events, evt];
}
