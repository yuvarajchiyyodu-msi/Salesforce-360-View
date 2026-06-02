import { useState } from "react";
import { SearchIcon } from "../lib/icons.jsx";

// Clickable next-step probes the agent proposed, plus an optional free-text box
// for the user to ask their own follow-up. Both ask the next turn, carrying
// conversation history. `showInput` is true only for the latest turn so old
// turns in the thread don't each sprout an input.
export default function Suggestions({ items, onAsk, disabled, showInput }) {
  const [value, setValue] = useState("");
  const hasItems = items?.length > 0;
  if (!hasItems && !showInput) return null;

  function submit(e) {
    e.preventDefault();
    const q = value.trim();
    if (q && !disabled) {
      onAsk(q);
      setValue("");
    }
  }

  return (
    <div className="mt-5">
      <p className="mb-2 font-display text-xs uppercase tracking-wider text-ms-muted">
        Dig deeper
      </p>

      {hasItems && (
        <div className="flex flex-col gap-2">
          {items.map((s) => (
            <button
              key={s}
              disabled={disabled}
              onClick={() => onAsk(s)}
              className="group flex items-center gap-2.5 rounded-lg border border-ms-line bg-ms-surface/40 px-3.5 py-2.5 text-left text-sm text-ms-text transition-colors hover:border-ms-blue hover:bg-ms-blue/5 disabled:opacity-40"
            >
              <SearchIcon
                width={15}
                height={15}
                className="shrink-0 text-ms-muted transition-colors group-hover:text-ms-blue"
              />
              <span>{s}</span>
            </button>
          ))}
        </div>
      )}

      {showInput && (
        <form onSubmit={submit} className={hasItems ? "mt-3" : ""}>
          <div className="flex items-center gap-3 rounded-lg border border-ms-line bg-ms-surface/40 px-3.5 py-2.5 transition-colors focus-within:border-ms-blue">
            <SearchIcon width={15} height={15} className="shrink-0 text-ms-muted" />
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={disabled}
              placeholder="Or ask your own follow-up…"
              className="flex-1 bg-transparent text-sm text-ms-text outline-none placeholder:text-ms-muted/70 disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={disabled || !value.trim()}
              className="rounded-md bg-ms-blue px-3 py-1 font-display text-xs font-600 text-white transition-colors hover:bg-ms-blueDim disabled:opacity-40"
            >
              Ask
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
