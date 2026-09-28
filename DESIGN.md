# Vastraa Labs — design manifest

Draw (uuid4-seeded, per run):

- **Language:** Tufte — serif display + serif body, sidenotes, hairline tables, 0–2px radius, no shadows, one link hue.
- **Persona:** keeps bees and sells their honey at a market. Measures, grades, labels, dates. No decoration she can't justify.
- **Seed noun:** tidal. A level read twice a day and written down.

First draw was Mission control (mono, high density, dark, true black + amber emissive). **Revised and disclosed:** that binds dark canvas + monospace + amber glow = the fake-terminal reflex this brief bans, and §3's last rule makes monochrome-plus-one-accent-dark a tell in its own right. Re-drew the language, kept persona and noun.

## Colour

Cool achromatic ramp, one hue. No warm/cool mixing. Dark is cool, not warm-dark.

| token | value | job | contrast on paper |
|---|---|---|---|
| `--paper` | `oklch(0.965 0.004 100)` | canvas | — |
| `--paper-sunk` | `oklch(0.945 0.005 100)` | the one sunk plane (Rivet device screen) | — |
| `--ink` | `oklch(0.205 0.008 245)` | primary text | 15.8:1 |
| `--ink-2` | `oklch(0.405 0.009 245)` | secondary text | 7.4:1 |
| `--ink-3` | `oklch(0.505 0.010 245)` | sidenotes, meta, ≥12px only | 5.1:1 |
| `--rule` | `oklch(0.205 0.008 245 / 0.16)` | hairline, primary depth cue | — |
| `--rule-soft` | `…/ 0.09` | internal dividers | — |
| `--rule-strong` | `…/ 0.38` | the one emphasised rule per viewport | — |
| `--accent` | `oklch(0.52 0.115 248)` | links, current state, one datum | 5.6:1 |
| `--accent-ink` | `oklch(0.40 0.10 248)` | accent text on paper | 7.9:1 |

Accent budget: under 3% of pixels. It appears as the link colour, the active state in the Rivet ledger, and the single datum square in the hero. Nowhere else.

No shadows anywhere. Depth is hairlines and one sunk plane. Paper is off-white, never `#fff`; ink is near-black, never `#000`.

## Type

One family well: **Source Serif 4 Variable** (200–900, optical size 8–60) for display *and* body. **Azeret Mono** 300–500 for sidenotes, coordinates, file paths, counts. Two families, two real jobs.

**UI ladder** (12/13/15/19/23) — tight, 1.1–1.27.
**Display ladder** (40/56/72/96/120) — wide jumps, 1.25–1.43.
They do not meet. The hole between 23 and 40 is deliberate.

- Display line-height **1.0** at 48px and up. 1.05 at 40px. Lead 1.15.
- Body 1.62. Measure `62ch` in prose blocks.
- Tracking: display −0.028em at 72px+, −0.02em at 40–56px, −0.012em at 23px lead. Body 0. Mono 11–13px **+0.08em** (small type needs air, and mono needs it more).
- Weights: 300 marginalia, 400 body, 600 display. **No 700 anywhere.** Hierarchy rides the colour ramp and size, not weight.
- `font-variant-numeric: tabular-nums` on every number that sits in a column: the changed-file counts, the ledger figures, the year.
- Mono is `text-transform: uppercase` at 11–12px with +0.08em — used only for sidenotes and status. It is not the body face and never carries a sentence.

## Space

4px base. Radius: **0 everywhere.** Squareness is the brand geometry (Tufte), and one radius value is cheaper than two.

Density alternates deliberately:
- Section padding 128px desktop / 72px mobile, but the gap *between* sections alternates: 128 → 64 → 128 → 96 → 128. Uniform section rhythm is the loudest layout tell there is.
- Element gaps 4/8/12. The margin column is 9rem, separated by a 1px rule, and it collapses below 900px.

## Depth

No shadows, no glow, no glass. Three levels only:
1. paper
2. `--paper-sunk` — exactly one, the Rivet screen
3. ink (the one inverted band, in the footer)

Hairlines: 0.16 alpha primary, 0.09 internal, 0.38 for the single emphasised rule per viewport. Focus ring: `0 0 0 2px var(--paper), 0 0 0 4px var(--accent)`.

## Motion

- 140ms for state changes in the Rivet ledger, 220ms for the lead element. Exits 120ms, enters 240ms.
- Easing `cubic-bezier(0.2, 0, 0, 1)`. No spring. No bounce. Nothing with a y > 1.
- `transform` and `opacity` only.
- **No scroll-triggered reveals.** A stock reveal plays once and leaves a half-animated page. Motion here is tied to a *state change*: the hero draws its rule once on load, the Rivet ledger advances on click or auto-cycle.
- The auto-cycle stops permanently on any user interaction, on focus, and when the tab is hidden. It is not required to read anything.
- `prefers-reduced-motion: reduce` → cycle off, transitions to 1ms, no auto-anything.

## Layout primitive

**One primitive, repeated: the marginal record.** A 9rem mono margin holding sidenotes, separated from the content by a single 1px vertical rule. It appears in the hero (as the site datum), in Rivet (as the ledger's speaker column), in philosophy (as statement numbers), in the lab, and in the footer. That column is the signature.

```
┌──────────────────────────────────────────────────────┐
│  VASTRAA LABS                          est. record   │  ← 120px display
│  ─────────────────────────────────────  01 / 06      │  ← hairline + datum
│                                                      │
│  independent          │  Independent software        │  ← 9rem margin
│  software             │  experiments, built into     │     + 1px rule
│  studio               │  real products.               │
│                      │                               │
│  two people           │  [ Current work → ]           │
└──────────────────────────────────────────────────────┘
```

**Chanel's rule:** remove one accessory. The lead serif-italic is gone; the rule carries it.

## The 20%

- **One bold move:** the whole site is a tide table. Marginal readings, a vertical rule, dated entries, hairline rows, and exactly one square datum — the only place the accent is a shape rather than a word. A bee-keeper's ledger, drawn as a page.
- **Voice:** "Rivet is in development." never becomes "Join the waitlist." "Follow the build." not "Get started." Section 02 is titled *Current work*, not *Product*. The lab says "Nothing published here yet." and means it.
- **One micro-interaction:** the Rivet ledger advances one row per click, and the datum square in the hero ticks along the hairline to the row you are reading. Clicking a row in the changed-files list slides the hairline under it.
- **One detail only someone who has used the product would add:** every ledger row is *stamped* — `T−00:04`, `T+00:11` — because Rivet reports elapsed time per step, and the changed-files row lists the real shape of a diff (`+12 −3`), never a fake "1 file updated."

## The collision probe

Same manifest for a different brief — say, a two-person studio building a compiler: Tufte, mono sidenotes, hairline rules, one link-blue, 0px radius. **It would be identical.** That's the collision.

Changed, and why: the brief's flat list of sections would render as a *catalogue*, so the layout primitive became the **tide-table marginal record** with a signed, dated, stamped ledger instead of a generic sidenote column — a thing that only makes sense if you have stood in a lab watching an agent take eleven seconds to find a null check. The Rivet device screen is the only sunk plane on the page, and it is sunk because a phone screen is sunk, not because cards need shadows. The footer is the only inverted band, and it is inverted because every tide table ends in a ruled ledger.

## Principles encoded

- Typography is the image. No stock, no orb, no grid background.
- Accent ≤3%. The site is 97% neutral.
- Zero radius, zero shadows, zero glass, zero gradients-as-decoration.
- The site still makes sense with `Rivet` removed: the lab and philosophy sections are about the studio, not the product.
