import { LayersIcon } from "../lib/icons.jsx";

export default function TopBar({ orgsConnected = 2 }) {
  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-ms-line">
      <div className="flex items-center gap-4">
        {/* Official horizontal lockup, reverse (white wordmark) — sits directly
            on the dark header, no tile. Wordmark is the real Motorola typeface. */}
        <img
          src="/msi-logo-horizontal-rev.png"
          alt="Motorola Solutions"
          className="h-[2.1rem] w-auto"
        />
        <div className="h-6 w-px bg-ms-line" />
        <div className="flex items-baseline gap-2">
          <span className="font-display font-700 text-xl tracking-tight">to be determined</span>
          <span className="font-display font-700 text-xl tracking-tight text-ms-blue">360</span>
        </div>
      </div>
      <div className="flex items-center gap-2.5 rounded-full border border-ms-blue/30 bg-ms-blue/10 px-4 py-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ms-blue opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ms-blue" />
        </span>
        <span className="font-mono text-sm font-500 text-ms-text">{orgsConnected} orgs connected</span>
        <LayersIcon width={16} height={16} className="text-ms-blue" />
      </div>
    </header>
  );
}
