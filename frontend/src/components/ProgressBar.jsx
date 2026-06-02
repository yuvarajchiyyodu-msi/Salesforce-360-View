// A 2px indeterminate bar pinned under the header while the agent runs.
export default function ProgressBar({ active }) {
  if (!active) return null;
  return (
    <div className="relative h-0.5 w-full overflow-hidden bg-transparent">
      <div
        className="absolute h-full w-1/3 bg-ms-blue"
        style={{ animation: "indeterminate 1.1s ease-in-out infinite" }}
      />
      <style>{`
        @keyframes indeterminate {
          0%   { left: -33%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
