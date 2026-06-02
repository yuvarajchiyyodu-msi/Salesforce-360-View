import { useState } from "react";
import {
  DatabaseIcon, SchemaIcon, BoltIcon, CheckIcon, AlertIcon, SpinnerIcon, ChevronIcon,
} from "../lib/icons.jsx";

const ORG_LABEL = { LMRUATOrg: "MCN / LMR", VSAUATOrg: "VS&A" };
const ORG_DOT = { LMRUATOrg: "bg-lmr", VSAUATOrg: "bg-vsa" };

export default function ActivityFeed({ events, running }) {
  if (!events.length && !running) return null;

  return (
    <aside className="rounded-xl border border-ms-line bg-ms-surface/60">
      <div className="flex items-center gap-2 border-b border-ms-line px-4 py-3">
        <BoltIcon width={16} height={16} className="text-ms-blue" />
        <span className="font-display font-600 text-sm">Agent activity</span>
        <span className="ml-auto font-mono text-xs text-ms-muted">
          {events.filter((e) => e.type === "tool_call").length} queries
        </span>
      </div>
      <ol className="divide-y divide-ms-line/60">
        {events.map((e, i) => (
          <FeedRow key={e.id ?? `s-${i}`} event={e} index={i} />
        ))}
        {running && (
          <li className="flex items-center gap-3 px-4 py-3 text-ms-muted">
            <SpinnerIcon width={16} height={16} />
            <span className="text-sm">Working…</span>
          </li>
        )}
      </ol>
    </aside>
  );
}

function FeedRow({ event, index }) {
  const [open, setOpen] = useState(false);

  if (event.type === "status") {
    return (
      <li
        className="flex items-center gap-3 px-4 py-2.5 animate-lineIn"
        style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-ms-muted/50" />
        <span className="text-sm text-ms-muted italic">{event.message}</span>
      </li>
    );
  }

  // tool_call (with optional resolved .result)
  const res = event.result;
  const pending = !res;
  const failed = res && !res.ok;
  const isDescribe = event.tool === "describe_object";

  return (
    <li
      className="px-4 py-2.5 animate-lineIn"
      style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
    >
      <div className="flex items-center gap-3">
        <span className="text-ms-blue">
          {isDescribe ? <SchemaIcon width={16} height={16} /> : <DatabaseIcon width={16} height={16} />}
        </span>

        <span className={`h-2 w-2 shrink-0 rounded-full ${ORG_DOT[event.org] ?? "bg-ms-muted"}`} />
        <span className="font-mono text-xs text-ms-muted w-20 shrink-0">
          {ORG_LABEL[event.org] ?? "—"}
        </span>

        <span className="text-sm text-ms-text truncate flex-1">
          {isDescribe ? `describe ${event.query}` : event.query}
        </span>

        <StatusPill pending={pending} failed={failed} res={res} />

        {event.query && (
          <button
            onClick={() => setOpen((o) => !o)}
            className="text-ms-muted hover:text-ms-text transition-colors"
            aria-label="Toggle query"
          >
            <ChevronIcon
              width={16} height={16}
              className={`transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      {open && event.query && (
        <pre className="mt-2 ml-8 overflow-x-auto rounded-md border border-ms-line bg-ms-ink/80 p-3 font-mono text-xs text-ms-muted">
{event.query}
        </pre>
      )}
      {failed && (
        <p className="mt-1 ml-8 font-mono text-xs text-red-400/80">{res.error}</p>
      )}
    </li>
  );
}

function StatusPill({ pending, failed, res }) {
  if (pending) return <SpinnerIcon width={15} height={15} className="text-ms-muted" />;
  if (failed) return <AlertIcon width={15} height={15} className="text-red-400" />;
  return (
    <span className="flex items-center gap-1 font-mono text-xs text-ms-muted">
      <CheckIcon width={14} height={14} className="text-emerald-400" />
      {res.rowCount}
    </span>
  );
}
