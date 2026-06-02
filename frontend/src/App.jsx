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
        <SearchHero onAsk={ask} running={running} compact={started} />

        {started && (
          <div className="mx-auto w-full max-w-6xl px-8 pb-24">
            <div className="flex flex-col gap-12">
              {turns.map((turn, i) => (
                <div key={turn.id}>
                  {i > 0 && <div className="mb-12 border-t border-ms-line/60" />}
                  <Turn turn={turn} onAsk={ask} anyRunning={running} />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
