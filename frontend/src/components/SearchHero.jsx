import { useState } from "react";
import { SearchIcon, SpinnerIcon } from "../lib/icons.jsx";

const EXAMPLES = [
  "Give me everything we have on University of California",
  "What's our total footprint with the State of California?",
  "Where do we have white space across both orgs?",
];

export default function SearchHero({ onAsk, running, compact }) {
  const [value, setValue] = useState("");

  function submit(e) {
    e.preventDefault();
    const q = value.trim();
    if (q && !running) onAsk(q);
  }

  return (
    <section className={compact ? "px-8 pt-8 pb-4" : "px-8 pt-20 pb-10 max-w-4xl mx-auto"}>
      {!compact && (
        <h1 className="font-display font-700 tracking-tight text-4xl md:text-5xl leading-[1.05]">
          One question.
          <br />
          <span className="text-ms-blue">Every system, answered.</span>
        </h1>
      )}
      {!compact && (
        <p className="mt-4 max-w-xl text-ms-muted">
          Ask in plain language. Headless&nbsp;360 queries MCN&nbsp;/&nbsp;LMR and
          VS&amp;A live, reconciles them, and hands back one view.
        </p>
      )}

      <form onSubmit={submit} className={compact ? "" : "mt-8"}>
        <div className="flex items-center gap-3 rounded-xl border border-ms-line bg-ms-surface px-4 py-3 focus-within:border-ms-blue transition-colors">
          <span className="text-ms-muted">
            {running ? <SpinnerIcon /> : <SearchIcon />}
          </span>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask anything… e.g. Give me everything we have on the State of California"
            className="flex-1 bg-transparent outline-none placeholder:text-ms-muted/70 text-ms-text"
          />
          <button
            type="submit"
            disabled={running || !value.trim()}
            className="rounded-lg bg-ms-blue px-4 py-1.5 font-display font-600 text-sm text-white disabled:opacity-40 hover:bg-ms-blueDim transition-colors"
          >
            Ask
          </button>
        </div>
      </form>

      {!compact && (
        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => !running && onAsk(ex)}
              className="rounded-full border border-ms-line bg-transparent px-3 py-1.5 text-xs text-ms-muted hover:border-ms-blue hover:text-ms-text transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
