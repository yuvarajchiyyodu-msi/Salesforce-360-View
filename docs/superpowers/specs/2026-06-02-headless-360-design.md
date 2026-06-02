# Headless 360 — Design Spec

**Date:** 2026-06-02
**Status:** Approved (pending written-spec review)
**Context:** Hackathon build. A unified, AI-driven "360° customer view" that queries multiple Salesforce orgs and consolidates the result into one view — eliminating the "swivel chair" of logging into each system separately.

---

## Problem to solve

Sales operations run across 10+ separate Salesforce instances (main ones: **MCN** — formerly LMR/MSI — and **VS&A**). The same customer exists in multiple orgs with no shared unique identifier, so records can only be matched manually. To understand one customer, a seller logs into multiple systems and stitches data by hand. The result: no single view of a customer's total spend, contracts, or white space; no easy way to see how many opportunities exist and where; and no visibility into which sibling teams already work the same account.

## Our solution

**Headless 360** — a web app where a user asks a natural-language question (e.g. *"Give me everything we have on the State of California"*) and gets one consolidated 360° view across all connected Salesforce orgs, without logging into each. Claude (via Bedrock) runs an agentic tool-use loop: it queries each org with SOQL as needed, follows partner→end-customer links, normalizes differing schemas/revenue models, and writes a consolidated summary.

---

## Architecture

```
React + Tailwind SPA (Vite)
  • Motorola Solutions logo top-left, name "Headless 360"
  • Natural-language search box
  • Live agent-activity feed (streams each SOQL step)
  • Result: AI 360 summary + unified strip + two org cards
        │  POST /api/ask  (Server-Sent Events stream)
        ▼
FastAPI backend
  • /api/ask → runs agentic loop, streams events as SSE
  • Bedrock Converse API (Claude Sonnet 4.6), tool-use loop
  • Tool run_soql(org, query)      → sf data query --json
  • Tool describe_object(org, name) → sf sobject describe
        │  sf CLI (subprocess)
        ▼
LMRUATOrg (MCN)   VSAUATOrg (VS&A)   — already authenticated
```

**Stack:** Vite + React + Tailwind (frontend); FastAPI + boto3 + subprocess `sf` (backend). No database, no auth — hackathon simple.

## Environment (verified 2026-06-02)

- `sf` CLI 2.132 present. Authenticated orgs in scope: **`LMRUATOrg`** (MCN/LMR UAT) and **`VSAUATOrg`** (VS&A/Avigilon UAT). Both queryable (`SELECT COUNT() FROM Account` returns 5.86M / 364K).
- AWS Bedrock reachable in `us-east-1` via `BedrockOktaFederatedRole`. Model `us.anthropic.claude-sonnet-4-6` confirmed invocable through the Converse API.
- Logo: `/Users/RDX473/Documents/chatbot-with-MCP/6582081c531ac2845a26c9de_MotorolaSolutinos.avif`.
- Node v24, Python 3.12.

## Agentic loop & tools

**Model:** `us.anthropic.claude-sonnet-4-6` (Bedrock Converse). Sonnet for live-demo latency.

**Tools given to Claude:**

| Tool | Args | Implementation |
|------|------|----------------|
| `run_soql` | `org` (`LMRUATOrg`\|`VSAUATOrg`), `query` | `sf data query --query "..." --target-org <org> --json`; rows capped at 50 |
| `describe_object` | `org`, `sobject` | `sf sobject describe --sobject <name> --target-org <org> --json`; lets Claude discover differing field names |

**Loop:** standard Bedrock tool-use cycle — Claude requests tool → backend executes → returns `toolResult` → repeat until final text. Safety cap ~15 tool calls per request. Each tool call (and its SOQL) is streamed to the UI as an SSE event.

**System prompt grounding** (from the two architecture decks):

- **LMRUATOrg (MCN / LMR):** Sales + Service Cloud, Land Mobile Radio, B2B & B2G, channel-driven, government-heavy. 5.86M accounts, 696K opps, 4.81M cases. **No CPQ/Revenue Cloud** — quote-to-cash manual. Custom sales stages (Execute & Expand/Won, Position & Align, Secure, Prospect, Design & Validate, No Pursuit, Lost). Account types incl. Commercial, State & Local, Government, Partner, Direct Customer, End User. Adobe Sign (`echosign_dev1__`), standard Contracts.
- **VSAUATOrg (VS&A / Avigilon):** Full Quote-to-Cash, video-surveillance B2B, hardware + subscriptions. 364K accounts, 1.1M opps, 8.6M cases. **CPQ** (`SBQQ__` — 807K quotes, 77.8K subscriptions), **Revenue Cloud** (`blng__` — 51K invoices, payments), Order Mgmt (137K orders), B2B Commerce (`ccrz__`), FedEx (`zkfedex__`). Account types: Integrators, Manufacturers, End customers.
- Instructions: match the customer across orgs (fuzzy by name; no shared key), follow partner→end-customer fields, report total spend, white space, opportunity distribution, and explicitly state what each org lacks ("if we don't have it, say so").

## UI / UX

Single-page, ultramodern. See **Visual language** for the anti-slop commitment.

- **Top bar:** Motorola Solutions logo (top-left), product name "Headless 360", "2 orgs connected" status pill.
- **Hero search:** large NL input — placeholder *"Ask anything… e.g. Give me everything we have on the State of California"* — with example chips.
- **Agent activity feed (showpiece):** streams each step live (search LMR accounts → query VS&A opportunities → follow partner account…), each expandable to the actual SOQL. Makes agentic reasoning visible.
- **Result view:**
  - **Unified strip** (the 360 payoff): total spend across both orgs, white-space callouts, opportunity distribution (e.g. "14 opps: 9 VS&A / 5 LMR").
  - **Two side-by-side org cards** — same layout skeleton, org-native fields:
    - *Shared header:* org name + badge, matched account name + ID, account Type, Direct vs Channel/Partner, and a clear "found / not found" state.
    - *MCN / LMR card:* Opportunities (name, custom stage, amount, close date) + total opp value (TCV-style); Contracts / Adobe Sign agreements; Cases (open/closed); note "No CPQ — quoting is manual".
    - *VS&A card:* Opportunities; CPQ Quotes & Subscriptions + **ARR** (`SBQQ__`); Orders + Invoices/Payments (`blng__`); Contracts; partner-vs-end-customer note.
  - Cards intentionally **not identical** — visually demonstrates the field/revenue-model mismatch.
- **Transport:** Server-Sent Events from `/api/ask`.

## Visual language (anti-slop commitment)

A specific branded system, decided up front:

- **Palette:** Motorola Solutions blue (`#0073CF` family) as the single accent, on near-black graphite canvas (`#0B0E11` base / `#13171C` surfaces). No purple, no rainbow gradients. MCN and VS&A each get one restrained distinguishing hue.
- **Type:** Display/headings **Space Grotesk**; body/data **Inter Tight**; numerics/SOQL **JetBrains Mono**. Confident type scale with real contrast.
- **Icons:** custom inline SVGs (Lucide-style line icons). **Never emoji.**
- **Layout:** asymmetric, left-weighted header; 12-col results grid; hairline 1px borders, generous whitespace — not heavy cards.
- **Motion:** purposeful only — activity lines stream with subtle stagger; result cards quiet fade+rise; thin top progress bar during agent work. No bounce/confetti.
- The **impeccable** skill is invoked during frontend build to hold this bar.

## Error handling

- SOQL/`sf` errors: tool returns the error text to Claude as a `toolResult` so it can adapt (retry with corrected fields, or report "not found"). Surfaced in the activity feed as a non-fatal step.
- Bedrock/throttling errors: backend emits an SSE `error` event; UI shows an inline retry, not a crash.
- Tool-call cap reached: loop stops, Claude summarizes with what it has, UI notes the cap.
- Customer not found in an org: that org card renders an explicit empty/not-found state.

## Testing (hackathon-scoped)

- Backend: a smoke test that `run_soql` returns parsed rows from each UAT org; one end-to-end `/api/ask` run against a known customer (e.g. State of California) asserting SSE events stream and a final summary arrives.
- Manual: live demo run-through of the State of California query.

## Out of scope (YAGNI)

- Persistence/database, user auth, write-back to Salesforce, the other 8+ orgs, MCP (CLI only per the transcript), production hardening, the order-management pass-through pain point (separate idea, not the chosen use case).
