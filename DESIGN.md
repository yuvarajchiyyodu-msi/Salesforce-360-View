# Headless 360 — Design System

The decided, approved visual language. Anti-slop is the governing constraint.

## Theme

**Dark, deliberately.** Scene: an analyst at a desk on a large monitor during a workday, glancing between this tool and Salesforce, wanting the consolidated answer to feel like instrumentation they trust. A near-black graphite canvas reads as engineered equipment (command-center lineage), keeps the dense activity feed calm, and lets the single Motorola blue accent and the per-org hues carry meaning. Not dark-for-cool: dark because the surface is an instrument panel and color must signal, not decorate.

## Color

**Strategy: Restrained.** Tinted-graphite neutrals + one blue accent (≤10% of surface) + two minimal per-org signal hues used only to distinguish org provenance. Expressed in the codebase as hex tokens for hackathon speed; the intent below is OKLCH-style (neutrals tinted toward the blue hue, never pure #000/#fff).

| Token | Hex | Role |
|---|---|---|
| `ms-ink` | `#0B0E11` | Canvas (graphite, tinted toward blue) |
| `ms-surface` | `#13171C` | Raised surface / panels |
| `ms-line` | `#222831` | Hairline 1px borders, dividers |
| `ms-muted` | `#8A93A0` | Secondary text, labels |
| `ms-text` | `#E7ECF2` | Primary text (off-white, never pure white) |
| `ms-blue` | `#0073CF` | The single accent: primary actions, focus, key marks |
| `ms-blueDim` | `#0A5BA0` | Accent hover/pressed |
| `lmr` | `#3DC8B4` | MCN / LMR org signal (teal) — provenance dots only |
| `vsa` | `#C8A14B` | VS&A org signal (amber) — provenance dots only |

A subtle blue radial vignette at the top of the canvas gives depth without a decorative gradient. The org hues are signal, not theme — used for small dots/accents to mark which org a row or card belongs to, never as fills.

## Typography

- **Display / headings:** Space Grotesk (500/600/700). Confident, engineered character.
- **Body / data:** Inter Tight (400/500/600).
- **Numerics / SOQL / org aliases:** JetBrains Mono (400/500). Anything machine-precise renders mono.
- Hierarchy via scale + weight contrast (≥1.25 steps). Real contrast between the hero question, section labels (small, uppercase, tracked, muted), and body.

## Layout

- Asymmetric, left-weighted. Header is left-heavy (logo + wordmark) with a status pill far right.
- Results use a 12-col grid split **5 / 7**: a narrower left activity rail (the visible reasoning) and a dominant right results column. Not dead-center symmetry.
- Hairline 1px borders (`ms-line`), generous whitespace, varied padding for rhythm. Panels are light-touch, not heavy drop-shadowed cards.
- The two org panels share a skeleton but intentionally differ in content (VS&A shows CPQ/ARR/billing; MCN/LMR shows the manual quote-to-cash note) — the mismatch is the point.

## Iconography

Custom inline SVG, Lucide-style 1.5px line icons, `currentColor` stroke. **Never emoji.** Icons: search, database (query), schema (describe), bolt (agent), check, alert, spinner, chevron, layers.

## Motion

Purposeful only, ease-out (no bounce/elastic), never animate layout properties:
- Activity-feed rows stream in with a subtle staggered `lineIn` (opacity + small translateX), capped stagger so long runs don't lag.
- Result cards `riseIn` quietly (opacity + small translateY).
- A 2px indeterminate blue progress bar pinned under the header only while the agent runs.

## Anti-slop guardrails (enforced)

No purple/indigo default gradients. No gradient text (`background-clip:text`). No glassmorphism-by-default. No side-stripe colored borders >1px. No emoji. No identical card grid as the whole layout. No hero-metric SaaS template. No em dashes in UI copy.
