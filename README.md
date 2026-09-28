# Vastraa Labs

Website for **Vastraa Labs**, a two-person independent software studio. The current
product is **Rivet**, a chat-first AI coding agent for Android.

React + TypeScript + Vite. No UI framework, no animation library, no analytics, no
trackers, no cookies.

## Commands

```bash
npm install          # add --no-bin-links on shared/FUSE storage
npm run dev          # dev server
npm run build        # typecheck + production build into dist/
npm run preview      # serve the production build locally
```

Useful extras:

```bash
npm run og           # regenerate public/og.png from the built CSS (needs a build first)
npm run audit        # responsive / a11y / contrast / interaction checks (see below)
npm run shots        # full-page screenshots into shots/
```

`npm run audit` and `npm run shots` drive a real Chromium over the DevTools
protocol. Start `npm run preview` in another shell first, then:

```bash
node scripts/audit.mjs http://127.0.0.1:4173/
```

## Deployment

Not deployed anywhere yet. `dist/` is a plain static directory — serve it from
whatever host you choose and it works unchanged.

Set `SITE_URL` to the live origin before you deploy. It feeds
`<link rel=canonical>`, `og:url` and the generated `sitemap.xml`. Without it the
build falls back to the visible placeholder `https://vastraa-labs.example`,
which is deliberate — `pages-check.mjs` fails the build on any `.example`
domain, so nothing ships with a fake canonical.

```bash
SITE_URL=https://your-host npm run build
node scripts/live-check.mjs https://your-host/   # verify the deployed bytes
```

Vite is configured with `base: './'`, so the same `dist/` works from a project
subpath, a domain root, or a local file. Adding a client-side router later
requires switching that to an absolute path; nothing else changes.

## Where things live

| Path | What it holds |
|---|---|
| `src/data/site.ts` | **All configurable values.** Name, tagline, links, the site origin, and the legal-page config point. |
| `src/data/rivet.ts` | The Rivet exchange, the changed-file list, and the four-step loop. |
| `src/data/principles.ts` | The four statements in the Principles section. |
| `src/styles/tokens.css` | Every colour, size, and duration. No hardcoded values elsewhere. |
| `src/sections/*.tsx` | One file per page section. |
| `src/components/RivetLedger.tsx` | The product visualisation and its state machine. |
| `DESIGN.md` | The design manifest — type scale, colour, motion, layout primitive. |

### Configurable placeholders that still need real values

Everything below lives in `src/data/site.ts` and currently points at a placeholder
or a plausible-but-unconfirmed address. **Set them before launch.**

- `site.url` — the live origin (or set the `SITE_URL` repo variable).
- `links.github.href` — the real GitHub organisation or repository.
- `links.x.href` — the real X account.
- `links.contact.href` — a real contact address. The footer note under it is copy
  and should be deleted if it is not true.
- `legal.privacy` / `legal.terms` / `legal.security` — all `null`, so the footer
  renders no legal links. Write the page, set the path, and the link appears.
  Nothing links to a route that would 404.

## Content that is deliberately absent

Rivet is in development, so the site has no download button, no store link, no
release date, no user count, no testimonial, no customer logo, no benchmark and
no pricing. If a number is not true yet, it is not on the page. The Lab section
lists only Rivet; the other rows are a designed empty state, not placeholders for
products that do not exist.

## Accessibility and verification

`npm run audit` is the gate. It checks horizontal overflow at 360 / 390 / 430 / 768
/ 1024 / 1440 / 1920 plus two landscape sizes, prose measure, heading order,
landmarks, computed WCAG contrast on every rendered text/background pair in both
colour schemes, tab order and focus rings, the Rivet state machine end to end
(including the declined path), `prefers-reduced-motion`, and the console.

It exits non-zero on any failure, and fails closed: a measurement it cannot take
is a failure, not a pass.
