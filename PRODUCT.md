# Headless 360 — Product Context

**Register:** product (the UI serves an internal analyst tool; design supports the data, it is not the product itself)

## Product purpose

Headless 360 lets a Motorola Solutions seller or sales-ops analyst ask one natural-language question (e.g. "Give me everything we have on the State of California") and get a single consolidated 360° customer view stitched live across two separate Salesforce orgs — MCN/LMR and VS&A — without logging into each system and reconciling by hand. A Claude-on-Bedrock agent runs SOQL queries step by step; the interface makes that agentic reasoning visible and then presents the reconciled answer.

## Users

Internal Motorola Solutions sellers and sales-operations analysts. They are domain-fluent (they know what an opportunity, a quote, ARR, a partner account are) and impatient: they live in Salesforce all day and are sick of the "swivel chair" of logging into 10+ orgs. They judge the tool on whether it surfaces a trustworthy, complete answer fast — and whether they can see *how* it got there (which queries hit which org) so they trust it. Used at a desk on a large monitor, during a workday, often mid-call or prepping for one.

## Brand

Motorola Solutions. Mission-critical communications heritage: radios, command centers, public-safety and government customers. The brand signal is the Motorola Solutions blue and a sense of engineered, dependable instrumentation — not consumer playfulness. The logo (batwing + wordmark) sits top-left. This is an internal hackathon tool wearing the company's colors, so it should feel like a credible piece of Motorola tooling, not a generic SaaS starter.

## Tone

Precise, instrumented, confident. Reads like a piece of operational equipment a professional relies on: quiet by default, information-dense without clutter, honest about gaps ("this org does not track ARR — said plainly"). No marketing exuberance, no cheerleading, no emoji.

## Anti-references (what it must NOT look like)

- Generic "AI slop": default purple/indigo gradients, glassmorphism everywhere, emoji-as-icons, dead-center hero + three identical cards, Inter-everywhere, no real brand identity.
- A consumer chatbot. This is an instrument, not a friendly assistant persona.
- A flashy crypto/neon dashboard. No glow-for-glow's-sake.
- A SaaS hero-metric template (big gradient number, small label, repeat).

## Strategic principles

1. **Show the work.** The live agent-activity feed is the showpiece — each SOQL step, which org, row counts, expandable to the actual query. Visible reasoning earns trust.
2. **Honor the mismatch.** The two orgs genuinely differ (VS&A has CPQ/ARR/billing; MCN/LMR is manual quote-to-cash). The UI should make that difference legible, not paper over it. The two org panels are deliberately NOT identical.
3. **Quiet until it matters.** Restrained graphite canvas, one blue accent, hairline structure. Motion is purposeful (streaming feed, quiet result rise, thin progress bar) — never decorative.
4. **Honest about absence.** "Not found" and "this org doesn't track that" are first-class states, rendered explicitly.
