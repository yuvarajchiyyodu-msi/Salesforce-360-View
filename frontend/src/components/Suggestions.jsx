import { SearchIcon } from "../lib/icons.jsx";

// Clickable next-step probes the agent proposed. Clicking one asks it as the
// next turn, carrying conversation history.
export default function Suggestions({ items, onAsk, disabled }) {
  if (!items?.length) return null;
  return (
    <div className="mt-4">
      <p className="mb-2 font-display text-xs uppercase tracking-wider text-ms-muted">
        Dig deeper
      </p>
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
    </div>
  );
}
