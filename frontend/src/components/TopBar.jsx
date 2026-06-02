import { LayersIcon } from "../lib/icons.jsx";

export default function TopBar({ orgsConnected = 2 }) {
  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-ms-line">
      <div className="flex items-center gap-4">
        <img src="/motorola.avif" alt="Motorola Solutions" className="h-7 w-auto" />
        <div className="h-6 w-px bg-ms-line" />
        <div className="flex items-baseline gap-2">
          <span className="font-display font-700 text-lg tracking-tight">Headless</span>
          <span className="font-display font-700 text-lg tracking-tight text-ms-blue">360</span>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-ms-line bg-ms-surface px-3 py-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ms-blue opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-ms-blue" />
        </span>
        <span className="font-mono text-xs text-ms-muted">{orgsConnected} orgs connected</span>
        <LayersIcon width={14} height={14} className="text-ms-muted" />
      </div>
    </header>
  );
}
