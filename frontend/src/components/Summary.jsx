import { LayersIcon } from "../lib/icons.jsx";

// Dependency-free markdown rendering tuned for the agent's 360 summaries:
// headings, bold, lists, horizontal rules, and — most importantly — GitHub-style
// pipe tables, which the agent leans on heavily. Emoji are stripped (they read as
// AI-slop and clash with the line-icon visual language).

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}️‍]/gu;

function clean(text) {
  return text.replace(EMOJI, "").replace(/\s{2,}/g, " ").trim();
}

function renderInline(text, keyBase) {
  const parts = clean(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={`${keyBase}-${i}`} className="text-ms-text font-600">{p.slice(2, -2)}</strong>
      : <span key={`${keyBase}-${i}`}>{p}</span>
  );
}

// A pipe-table row: "| a | b |" -> ["a", "b"]. Returns null if not a table row.
function splitRow(line) {
  const t = line.trim();
  if (!t.startsWith("|")) return null;
  return t.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

// A separator row: "|---|:--:|---|" — all cells are dashes/colons.
function isSeparator(line) {
  const cells = splitRow(line);
  return cells != null && cells.every((c) => /^:?-{2,}:?$/.test(c.replace(/\s/g, "")));
}

function Table({ headers, rows, keyBase }) {
  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-ms-line">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-ms-ink/60">
            {headers.map((h, i) => (
              <th
                key={`${keyBase}-h-${i}`}
                className="border-b border-ms-line px-3 py-2 text-left font-display font-600 text-xs uppercase tracking-wide text-ms-muted whitespace-nowrap"
              >
                {renderInline(h, `${keyBase}-h-${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={`${keyBase}-r-${r}`} className="even:bg-ms-ink/30 hover:bg-ms-blue/5 transition-colors">
              {row.map((cell, c) => (
                <td
                  key={`${keyBase}-r-${r}-c-${c}`}
                  className={`border-b border-ms-line/50 px-3 py-2 text-left align-top ${
                    c === 0 ? "text-ms-text font-500" : "text-ms-muted"
                  }`}
                >
                  {renderInline(cell, `${keyBase}-r-${r}-c-${c}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderMarkdown(md) {
  const lines = md.split("\n");
  const out = [];
  let list = [];

  const flushList = () => {
    if (list.length) {
      const items = list;
      out.push(
        <ul key={`ul-${out.length}`} className="my-2 space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-center justify-center gap-2.5 text-ms-muted leading-relaxed">
              <span className="h-1 w-1 shrink-0 rounded-full bg-ms-blue" />
              <span>{renderInline(item, `li-${out.length}-${i}`)}</span>
            </li>
          ))}
        </ul>
      );
      list = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    const bare = line.trim();

    if (!bare) { flushList(); continue; }

    // Horizontal rule (---, ***, ___) — render as a hairline, not literal text.
    if (/^([-*_])\1{2,}$/.test(bare.replace(/\s/g, ""))) {
      flushList();
      out.push(<hr key={`hr-${out.length}`} className="my-4 border-0 border-t border-ms-line/70" />);
      continue;
    }

    // Table: a header row immediately followed by a separator row.
    const headerCells = splitRow(line);
    if (headerCells && i + 1 < lines.length && isSeparator(lines[i + 1])) {
      flushList();
      const rows = [];
      let j = i + 2;
      while (j < lines.length && splitRow(lines[j]) && !isSeparator(lines[j])) {
        rows.push(splitRow(lines[j]));
        j++;
      }
      out.push(<Table key={`tbl-${out.length}`} headers={headerCells} rows={rows} keyBase={`tbl-${out.length}`} />);
      i = j - 1;
      continue;
    }

    if (/^#{1,6}\s/.test(bare)) {
      flushList();
      const text = bare.replace(/^#{1,6}\s/, "");
      const level = (bare.match(/^#+/) || ["#"])[0].length;
      out.push(
        <h3
          key={`h-${out.length}`}
          className={`font-display font-600 text-ms-text ${
            level <= 2 ? "mt-6 mb-2 text-xl" : "mt-4 mb-1 text-base"
          }`}
        >
          {renderInline(text, `h-${out.length}`)}
        </h3>
      );
    } else if (/^[-*]\s/.test(bare)) {
      list.push(bare.replace(/^[-*]\s/, ""));
    } else if (/^>\s?/.test(bare)) {
      flushList();
      out.push(
        <p key={`q-${out.length}`} className="my-2 rounded-md border border-ms-line bg-ms-ink/40 px-3 py-2 text-sm text-ms-muted">
          {renderInline(bare.replace(/^>\s?/, ""), `q-${out.length}`)}
        </p>
      );
    } else {
      flushList();
      out.push(
        <p key={`p-${out.length}`} className="my-1.5 text-ms-muted leading-relaxed">
          {renderInline(bare, `p-${out.length}`)}
        </p>
      );
    }
  }
  flushList();
  return out;
}

export default function Summary({ text }) {
  if (!text) return null;
  return (
    <section className="animate-riseIn text-center">
      <div className="mb-4 flex items-center justify-center gap-2">
        <LayersIcon width={18} height={18} className="text-ms-blue" />
        <span className="font-display font-600 text-sm uppercase tracking-wider text-ms-muted">
          Consolidated 360° view
        </span>
      </div>
      <div className="text-lg leading-relaxed text-ms-text">{renderMarkdown(text)}</div>
    </section>
  );
}
