import { useAsk } from "./lib/useAsk.js";
import TopBar from "./components/TopBar.jsx";
import ProgressBar from "./components/ProgressBar.jsx";
import SearchHero from "./components/SearchHero.jsx";
import Turn from "./components/Turn.jsx";

export default function App() {
  const { ask, turns, running, confirmUpdate, cancelUpdate } = useAsk();
  const started = turns.length > 0;

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      {/* Ambient brand background — full-bleed dark eco animation behind all
          content, dimmed so the UI stays readable. */}
      <img
        src="/bg-eco.gif"
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 h-full w-full object-cover opacity-[0.05] select-none"
      />
      {/* Scrim so text keeps contrast over the animation */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-ms-ink/40" />

      <div className="relative z-10">
        <TopBar orgsConnected={2} />
        <ProgressBar active={running} />
      </div>

      <main className="relative z-10 flex flex-1 flex-col">
        {!started ? (
          // Landing: hero fills the remaining space and centers within it.
          <div className="flex flex-1 items-center justify-center">
            <SearchHero onAsk={ask} running={running} compact={false} />
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl px-6 pb-32 pt-6">
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
                    onConfirmUpdate={confirmUpdate}
                    onCancelUpdate={cancelUpdate}
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
