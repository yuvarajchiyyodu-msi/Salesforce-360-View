// Motorola Solutions lockup, drawn inline so it renders crisply on the dark
// header (the supplied .avif has a baked white background). The emblem is the
// batwing "M" in Motorola blue; the wordmark is set in the display face with
// MOTOROLA heavy and SOLUTIONS light, tracked out, to echo the brand lockup.
export default function MotorolaLogo({ className = "" }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        viewBox="0 0 100 100"
        width="34"
        height="34"
        role="img"
        aria-label="Motorola Solutions"
        className="shrink-0"
      >
        <circle cx="50" cy="50" r="50" fill="#0073CF" />
        {/* batwing "M": two peaks with a central valley, filled so the inner
            negative space reads as the classic emblem. */}
        <path
          fill="#fff"
          d="M14 72 L14 30 L26 30 L50 56 L74 30 L86 30 L86 72 L74 72 L74 47 L54 68 L46 68 L26 47 L26 72 Z"
        />
      </svg>
      <span className="font-display leading-none tracking-tight">
        <span className="font-700 text-ms-text">MOTOROLA</span>
        <span className="ml-1.5 font-400 text-ms-muted">SOLUTIONS</span>
      </span>
    </div>
  );
}
