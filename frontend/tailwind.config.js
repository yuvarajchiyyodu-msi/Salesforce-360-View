/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ms: {
          blue: "#0073CF",
          blueDim: "#0A5BA0",
          ink: "#0B0E11",      // canvas
          surface: "#13171C",  // raised surface
          line: "#222831",     // hairline border
          muted: "#8A93A0",    // secondary text
          text: "#E7ECF2",     // primary text
        },
        lmr: "#3DC8B4",        // MCN/LMR accent (teal)
        vsa: "#C8A14B",        // VS&A accent (amber)
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        body: ["'Inter Tight'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      keyframes: {
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        lineIn: {
          "0%": { opacity: "0", transform: "translateX(-6px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        riseIn: "riseIn 0.4s cubic-bezier(0.2,0.7,0.2,1) both",
        lineIn: "lineIn 0.3s ease-out both",
      },
    },
  },
  plugins: [],
};
