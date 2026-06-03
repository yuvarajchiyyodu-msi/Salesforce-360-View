import ActivityFeed from "./ActivityFeed.jsx";
import Summary from "./Summary.jsx";
import Suggestions from "./Suggestions.jsx";
import ProposalCard from "./ProposalCard.jsx";
import { AlertIcon } from "../lib/icons.jsx";

// One question→answer exchange, laid out as a chat turn: the user's question
// sits right-aligned as a bubble, and the agent's response stacks beneath it —
// collapsible activity, then the consolidated 360 view, then follow-ups.
export default function Turn({ turn, onAsk, onConfirmUpdate, onCancelUpdate, anyRunning, isLatest }) {
  const { question, events, summary, suggestions, proposals, status, error } = turn;
  const running = status === "running";

  return (
    <section className="animate-riseIn">
      {/* The asked question — right-aligned bubble, like a chat message */}
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm border border-ms-blue/25 bg-ms-blue/10 px-4 py-2.5">
          <p className="font-display font-500 leading-snug text-ms-text">
            {question}
          </p>
        </div>
      </div>

      {/* The agent's response — stacked beneath the question. While the agent
          is still working (no summary yet) the activity feed sits centered and
          prominent; once the response lands it expands full width and the
          activity feed collapses out of the way. */}
      <div
        className={`mt-5 flex flex-col gap-4 transition-all duration-500 ${
          running && !summary ? "mx-auto max-w-2xl" : "max-w-none"
        }`}
      >
        <ActivityFeed events={events} running={running} />

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
            <AlertIcon className="mt-0.5 text-red-400" />
            <div>
              <p className="font-display font-600 text-ms-text">Something broke</p>
              <p className="mt-1 font-mono text-xs text-red-400/80">{error}</p>
              <p className="mt-2 text-sm text-ms-muted">Try asking again.</p>
            </div>
          </div>
        )}

        {summary && <Summary text={summary} />}

        {proposals && proposals.length > 0 && (
          <div className="flex flex-col gap-4">
            {proposals.map((proposal, i) => (
              <ProposalCard
                key={i}
                proposal={proposal}
                onConfirm={() => onConfirmUpdate(turn.id, i)}
                onCancel={() => onCancelUpdate(turn.id, i)}
              />
            ))}
          </div>
        )}

        {summary && (
          <Suggestions
            items={suggestions}
            onAsk={onAsk}
            disabled={anyRunning}
            showInput={isLatest}
          />
        )}

        {running && !summary && !error && (
          <div className="rounded-xl border border-ms-line bg-ms-surface/40 p-8 text-center text-ms-muted">
            <p className="font-display">Querying MCN / LMR and VS&amp;A…</p>
          </div>
        )}
      </div>
    </section>
  );
}
