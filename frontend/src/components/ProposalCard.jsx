import {
  EditIcon, ArrowRightIcon, CheckIcon, AlertIcon, SpinnerIcon, XIcon,
} from "../lib/icons.jsx";

const ORG_LABEL = { LMRUATOrg: "MCN / LMR", VSAUATOrg: "VS&A" };
const ORG_DOT = { LMRUATOrg: "bg-lmr", VSAUATOrg: "bg-vsa" };

// A confirm-gated write. The agent only ever PROPOSES; this card is the single
// place a user can apply the change to the live org. Shows a before→after diff
// so there's no ambiguity about what flips.
export default function ProposalCard({ proposal, onConfirm, onCancel }) {
  if (!proposal) return null;
  const { org, sobject, record_id, changes, status, error } = proposal;

  const applied = status === "applied";
  const applying = status === "applying";
  const cancelled = status === "cancelled";
  const failed = status === "error";
  const pending = status === "pending";

  return (
    <section className="mt-5 overflow-hidden rounded-xl border border-ms-blue/30 bg-ms-surface/60 text-left">
      <header className="flex items-center gap-2.5 border-b border-ms-line px-4 py-3">
        <EditIcon width={16} height={16} className="text-ms-blue" />
        <span className="font-display font-600 text-sm">Proposed update</span>
        <span
          className={`ml-auto flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-xs ${
            org === "LMRUATOrg" ? "bg-lmr/15 text-lmr ring-1 ring-lmr/30" : "bg-vsa/15 text-vsa ring-1 ring-vsa/30"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${ORG_DOT[org] ?? "bg-ms-muted"}`} />
          {ORG_LABEL[org] ?? org}
        </span>
      </header>

      <div className="px-4 py-3">
        <p className="mb-3 font-mono text-xs text-ms-muted">
          {sobject} · {record_id}
        </p>

        <ul className="space-y-2">
          {changes.map((c) => (
            <li key={c.field} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-500 text-ms-text">{c.field}</span>
              <span className="rounded bg-ms-ink/60 px-2 py-0.5 font-mono text-xs text-ms-muted line-through decoration-ms-muted/50">
                {fmt(c.from)}
              </span>
              <ArrowRightIcon width={14} height={14} className="text-ms-muted" />
              <span className="rounded bg-ms-blue/15 px-2 py-0.5 font-mono text-xs text-ms-text ring-1 ring-ms-blue/30">
                {fmt(c.to)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <footer className="flex items-center gap-3 border-t border-ms-line px-4 py-3">
        {pending && (
          <>
            <button
              onClick={onConfirm}
              className="flex items-center gap-1.5 rounded-lg bg-ms-blue px-3.5 py-1.5 font-display font-600 text-sm text-white transition-colors hover:bg-ms-blueDim"
            >
              <CheckIcon width={15} height={15} />
              Confirm update
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 rounded-lg border border-ms-line px-3.5 py-1.5 text-sm text-ms-muted transition-colors hover:border-ms-muted hover:text-ms-text"
            >
              <XIcon width={15} height={15} />
              Cancel
            </button>
            <span className="ml-auto font-mono text-xs text-ms-muted/70">
              Writes to the live org
            </span>
          </>
        )}
        {applying && (
          <span className="flex items-center gap-2 text-sm text-ms-muted">
            <SpinnerIcon width={15} height={15} />
            Applying to {ORG_LABEL[org] ?? org}…
          </span>
        )}
        {applied && (
          <span className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckIcon width={15} height={15} />
            Update applied to {ORG_LABEL[org] ?? org}.
          </span>
        )}
        {cancelled && (
          <span className="flex items-center gap-2 text-sm text-ms-muted">
            <XIcon width={15} height={15} />
            Cancelled. Nothing was changed.
          </span>
        )}
        {failed && (
          <div className="flex w-full items-start gap-2">
            <AlertIcon width={15} height={15} className="mt-0.5 shrink-0 text-red-400" />
            <div className="flex-1">
              <p className="text-sm text-red-400">Update failed.</p>
              <p className="mt-0.5 font-mono text-xs text-red-400/80">{error}</p>
            </div>
            <button
              onClick={onConfirm}
              className="rounded-lg border border-ms-line px-3 py-1 text-sm text-ms-muted transition-colors hover:border-ms-blue hover:text-ms-text"
            >
              Retry
            </button>
          </div>
        )}
      </footer>
    </section>
  );
}

function fmt(v) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}
