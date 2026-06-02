import { useEffect, useState } from "react";
import {
  DatabaseIcon, SchemaIcon, BoltIcon, CheckIcon, AlertIcon, SpinnerIcon, ChevronIcon,
} from "../lib/icons.jsx";

const ORG_LABEL = { LMRUATOrg: "MCN / LMR", VSAUATOrg: "VS&A" };
const ORG_DOT = { LMRUATOrg: "bg-lmr", VSAUATOrg: "bg-vsa" };
// Tinted badge: accent at low opacity for fill, full accent for text + dot.
const ORG_BADGE = {
  LMRUATOrg: "bg-lmr/15 text-lmr ring-1 ring-lmr/30",
  VSAUATOrg: "bg-vsa/15 text-vsa ring-1 ring-vsa/30",
};

export default function ActivityFeed({ events, running }) {
  // Open while the agent is working so the user can watch the queries land;
  // auto-collapse once the answer is in so the 360 view leads. The user can
  // re-open it any time to audit the SOQL behind a result.
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (!running) setOpen(false);
  }, [running]);

  if (!events.length && !running) return null;

  const toolEvents = events.filter((e) => e.type === "tool_call");
  const statusEvents = events.filter((e) => e.type === "status");
  const latestStatus = statusEvents[statusEvents.length - 1];
  const queryCount = toolEvents.length;

  return (
    <aside className="overflow-hidden rounded-xl border border-ms-line bg-ms-surface/60">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-ms-blue/5"
        aria-expanded={open}
      >
        <BoltIcon width={16} height={16} className="text-ms-blue" />
        <span className="font-display font-600 text-sm">Agent activity</span>
        {running && <SpinnerIcon width={13} height={13} className="text-ms-muted" />}
        <span className="ml-auto font-mono text-xs text-ms-muted">
          {queryCount} {queryCount === 1 ? "query" : "queries"}
        </span>
        <ChevronIcon
          width={16}
          height={16}
          className={`text-ms-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ol className="divide-y divide-ms-line/60 border-t border-ms-line">
          {/* Tool calls are the durable record; render them always. */}
          {toolEvents.map((e, i) => (
            <FeedRow key={e.id ?? `s-${i}`} event={e} index={i} />
          ))}
          {/* Status messages are transient narration — show only the latest,
              and only while the agent is still working, so nothing stale (like
              the opening "Thinking…") lingers after the turn completes. */}
          {running && latestStatus && (
            <li className="flex items-center gap-3 px-4 py-3 text-ms-muted">
              <SpinnerIcon width={16} height={16} />
              <span className="text-sm italic">{latestStatus.message}</span>
            </li>
          )}
        </ol>
      )}
    </aside>
  );
}

function FeedRow({ event, index }) {
  const [open, setOpen] = useState(false);

  // Only tool_call events reach here (status is rendered separately).
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

        <span
          className={`flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-xs ${
            ORG_BADGE[event.org] ?? "bg-ms-muted/10 text-ms-muted ring-1 ring-ms-line"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${ORG_DOT[event.org] ?? "bg-ms-muted"}`} />
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
