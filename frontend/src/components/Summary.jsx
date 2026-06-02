import { LayersIcon } from "../lib/icons.jsx";

// Minimal, dependency-free markdown rendering for the agent's summary:
// headings, bold, list items, and paragraphs. Good enough for the demo.
function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} className="text-ms-text font-600">{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  );
}

function renderMarkdown(md) {
  const lines = md.split("\n");
  const out = [];
  let list = [];

  const flush = () => {
    if (list.length) {
      out.push(
        <ul key={`ul-${out.length}`} className="my-2 space-y-1 pl-1">
          {list.map((item, i) => (
            <li key={i} className="flex gap-2 text-ms-muted">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ms-blue" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flush(); continue; }
    if (/^#{1,6}\s/.test(line)) {
      flush();
      const text = line.replace(/^#{1,6}\s/, "");
      out.push(
        <h3 key={`h-${out.length}`} className="mt-4 mb-1 font-display font-600 text-lg text-ms-text">
          {renderInline(text)}
        </h3>
      );
    } else if (/^[-*]\s/.test(line)) {
      list.push(line.replace(/^[-*]\s/, ""));
    } else {
      flush();
      out.push(
        <p key={`p-${out.length}`} className="my-1.5 text-ms-muted leading-relaxed">
          {renderInline(line)}
        </p>
      );
    }
  }
  flush();
  return out;
}

export default function Summary({ text }) {
  if (!text) return null;
  return (
    <section className="rounded-xl border border-ms-line bg-gradient-to-b from-ms-surface to-ms-surface/40 p-6 animate-riseIn">
      <div className="mb-3 flex items-center gap-2">
        <LayersIcon width={18} height={18} className="text-ms-blue" />
        <span className="font-display font-600 text-sm uppercase tracking-wider text-ms-muted">
          Consolidated 360° view
        </span>
      </div>
      <div className="text-[15px]">{renderMarkdown(text)}</div>
    </section>
  );
}
