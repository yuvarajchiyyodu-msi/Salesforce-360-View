import { useState } from "react";
import { SearchIcon, SpinnerIcon } from "../lib/icons.jsx";

const EXAMPLES = [
  "Give me everything we have on University of California",
  "What's our total footprint with the State of California?",
  "Where do we have white space across both orgs?",
];

// The ask bar. Two modes:
//  - landing (default): a centered hero that owns the viewport before the
//    first question. This is the "in the middle" state.
//  - compact: a slim persistent bar that sits above the conversation thread
//    once a question has been asked.
export default function SearchHero({ onAsk, running, compact }) {
  const [value, setValue] = useState("");

  function submit(e) {
    e.preventDefault();
    const q = value.trim();
    if (q && !running) {
      onAsk(q);
      setValue("");
    }
  }

  const bar = (
    <div className="flex items-center gap-3 rounded-xl border border-ms-line bg-ms-surface px-4 py-3 transition-colors focus-within:border-ms-blue">
      <span className="text-ms-muted">
        {running ? <SpinnerIcon /> : <SearchIcon />}
      </span>
      <input
        autoFocus={!compact}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask anything… e.g. Give me everything we have on the State of California"
        className="flex-1 bg-transparent text-ms-text outline-none placeholder:text-ms-muted/70"
      />
      <button
        type="submit"
        disabled={running || !value.trim()}
        className="rounded-lg bg-ms-blue px-4 py-1.5 font-display font-600 text-sm text-white transition-colors hover:bg-ms-blueDim disabled:opacity-40"
      >
        Ask
      </button>
    </div>
  );

  if (compact) {
    return (
      <form onSubmit={submit}>
        {bar}
      </form>
    );
  }

  // Landing — centered in the viewport, vertically and horizontally.
  return (
    <section className="flex w-full flex-col items-center px-6 text-center">
      <h1 className="font-display font-700 text-4xl leading-[1.05] tracking-tight md:text-6xl">
        One Vantage.
        <br />
        <span className="text-ms-blue">Every Salesforce system.</span>
      </h1>
      <p className="mt-5 max-w-2xl text-ms-muted">
        Ask in plain language. We query MCN&nbsp;/&nbsp;LMR and VS&amp;A live,
        reconcile them into a single view, and let you update cases and
        opportunities right here, no swivel-chairing between orgs.
      </p>

      <form onSubmit={submit} className="mt-9 w-full max-w-2xl">
        {bar}
      </form>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => !running && onAsk(ex)}
            className="rounded-full border border-ms-line bg-transparent px-3 py-1.5 text-xs text-ms-muted transition-colors hover:border-ms-blue hover:text-ms-text"
          >
            {ex}
          </button>
        ))}
      </div>
    </section>
  );
}
