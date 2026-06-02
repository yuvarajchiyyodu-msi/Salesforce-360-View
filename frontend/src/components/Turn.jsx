import ActivityFeed from "./ActivityFeed.jsx";
import Summary from "./Summary.jsx";
import Suggestions from "./Suggestions.jsx";
import { AlertIcon, SearchIcon } from "../lib/icons.jsx";

// One question→answer exchange in the conversation thread.
export default function Turn({ turn, onAsk, anyRunning, isLatest }) {
  const { question, events, summary, suggestions, status, error } = turn;
  const running = status === "running";

  return (
    <section className="animate-riseIn">
      {/* The asked question, as a quiet header */}
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-1 text-ms-blue">
          <SearchIcon width={18} height={18} />
        </span>
        <h2 className="font-display font-600 text-lg leading-snug text-ms-text">
          {question}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Activity rail — left, narrower */}
        <div className="lg:col-span-5">
          <ActivityFeed events={events} running={running} />
        </div>

        {/* Answer — right, dominant */}
        <div className="lg:col-span-7">
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
      </div>
    </section>
  );
}
