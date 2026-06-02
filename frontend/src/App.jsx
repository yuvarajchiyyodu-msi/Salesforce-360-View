import { useState } from "react";
import { useAsk } from "./lib/useAsk.js";
import TopBar from "./components/TopBar.jsx";
import ProgressBar from "./components/ProgressBar.jsx";
import SearchHero from "./components/SearchHero.jsx";
import ActivityFeed from "./components/ActivityFeed.jsx";
import Results from "./components/Results.jsx";
import { AlertIcon } from "./lib/icons.jsx";

export default function App() {
  const { ask, events, summary, status, error } = useAsk();
  const [asked, setAsked] = useState(false);
  const running = status === "running";

  function handleAsk(q) {
    setAsked(true);
    ask(q);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar orgsConnected={2} />
      <ProgressBar active={running} />

      <main className="flex-1">
        <SearchHero onAsk={handleAsk} running={running} compact={asked} />

        {asked && (
          <div className="px-8 pb-16 max-w-6xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Activity rail — left, narrower (asymmetric grid) */}
              <div className="lg:col-span-5 lg:sticky lg:top-6 self-start">
                <ActivityFeed events={events} running={running} />
              </div>

              {/* Results — right, dominant */}
              <div className="lg:col-span-7">
                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                    <AlertIcon className="text-red-400 mt-0.5" />
                    <div>
                      <p className="font-display font-600 text-ms-text">Something broke</p>
                      <p className="mt-1 font-mono text-xs text-red-400/80">{error}</p>
                      <p className="mt-2 text-sm text-ms-muted">Try asking again.</p>
                    </div>
                  </div>
                )}
                <Results summary={summary} events={events} />
                {running && !summary && !error && (
                  <div className="rounded-xl border border-ms-line bg-ms-surface/40 p-8 text-center text-ms-muted">
                    <p className="font-display">Consolidating across MCN / LMR and VS&amp;A…</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
