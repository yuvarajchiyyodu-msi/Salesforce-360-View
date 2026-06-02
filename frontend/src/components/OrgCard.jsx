import { DatabaseIcon } from "../lib/icons.jsx";

// A presentational card. Because the agent returns free-form prose, the cards
// are driven by a small structured `org` prop the App derives from events:
//   { alias, label, accent, queryCount, note }
// The hard data lives in the Summary; these cards frame each org's identity and
// how much we touched it — and intentionally differ in their footer note to
// show the schema/revenue-model mismatch.
const ACCENT = {
  LMRUATOrg: { dot: "bg-lmr", text: "text-lmr", border: "hover:border-lmr/60" },
  VSAUATOrg: { dot: "bg-vsa", text: "text-vsa", border: "hover:border-vsa/60" },
};

export default function OrgCard({ org }) {
  const a = ACCENT[org.alias] ?? {};
  return (
    <div
      className={`flex flex-col rounded-xl border border-ms-line bg-ms-surface/50 p-5 transition-colors ${a.border} animate-riseIn`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`h-2.5 w-2.5 rounded-full ${a.dot}`} />
          <span className="font-display font-700 tracking-tight">{org.label}</span>
        </div>
        <span className="font-mono text-xs text-ms-muted">{org.alias}</span>
      </div>

      <div className="mt-4 flex items-center gap-2 text-ms-muted">
        <DatabaseIcon width={15} height={15} className={a.text} />
        <span className="font-mono text-sm">
          {org.queryCount} {org.queryCount === 1 ? "query" : "queries"} run
        </span>
      </div>

      <p className="mt-4 border-t border-ms-line pt-3 text-xs leading-relaxed text-ms-muted">
        {org.note}
      </p>
    </div>
  );
}
