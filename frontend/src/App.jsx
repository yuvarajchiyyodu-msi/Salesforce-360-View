import { useAsk } from "./lib/useAsk.js";
import TopBar from "./components/TopBar.jsx";
import ProgressBar from "./components/ProgressBar.jsx";
import SearchHero from "./components/SearchHero.jsx";
import Turn from "./components/Turn.jsx";

export default function App() {
  const { ask, turns, running } = useAsk();
  const started = turns.length > 0;

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar orgsConnected={2} />
      <ProgressBar active={running} />

      <main className="flex-1">
        {!started ? (
          // Landing: hero owns the viewport, ask bar centered.
          <SearchHero onAsk={ask} running={running} compact={false} />
        ) : (
          <div className="mx-auto w-full max-w-5xl px-6 pb-32 pt-6">
            {/* Persistent slim ask bar pinned above the thread */}
            <div className="sticky top-4 z-10 mb-8">
              <SearchHero onAsk={ask} running={running} compact />
            </div>

            <div className="flex flex-col gap-12">
              {turns.map((turn, i) => (
                <div key={turn.id}>
                  {i > 0 && <div className="mb-12 border-t border-ms-line/60" />}
                  <Turn
                    turn={turn}
                    onAsk={ask}
                    anyRunning={running}
                    isLatest={i === turns.length - 1}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
