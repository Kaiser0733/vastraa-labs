Phase A — scaffold, public/, data, apk lib — done — 2026-11-02T13:32:36+00:00
Phase B — mascot pipeline, favicons, OG cards, Rivet shots — done — 2026-11-02T13:34:47+00:00
Phase C — tokens, global CSS, chrome components, layout — done — 2026-11-02T13:36:49+00:00
Phase D — all seven pages — done — 2026-11-02T13:38:07+00:00
Phase E — motion in layout script + CSS — done — 2026-11-02T13:38:07+00:00
Phase F — build, hash and grep proofs, route probes — done — 2026-11-02T13:42:28+00:00

---

## Fix round (owner review, live site) — 2026-11-02

Gate note: Job A passed on the second route (see below), so Job B shipped.
Nothing committed, pushed, or deployed.

### Root cause 1 — ClientRouter removed
- `src/components/BaseHead.astro`: import and `<ClientRouter />` tag deleted.
- `src/components/Header.astro`: `transition:persist` deleted.
- `src/layouts/SiteLayout.astro`: `astro:page-load` listener replaced with a
  direct `init()` call. The site is plain multi-page; every link is a
  normal link. Proof: `find dist -name '*.js'` = 0 files; "ClientRouter"
  in dist = 0 hits.

### Root cause 2 — email never appears in served HTML
- Address split into `emailUser` / `emailDomain` in `src/data/links.ts`.
- Contact page shows the split parts; the site JS assembles the visible
  address and the Open href at runtime. No-JS fallback text reads
  "contact (at) vastraalabs.online". Footer mail icon and Contact Copy
  button work the same way. The scheme string is also assembled at
  runtime (the build minifier folds plain string splits back together;
  verified in the built output).
- Proof over dist HTML: `contact@vastraalabs` = 0, `mailto:` = 0,
  `data-cfemail` / "[email protected]" = 0.

### Job A — cutouts, proof gate (honest, per cutout)
Route 1, border flood-fill at thresholds 242/230/215/200/185: FAILED.
White pockets sealed between hair strands are not connected to the
border, so they stayed as white blobs on carbon (visible in the first
proofs). The stripes' highlight cores key the same as those pockets,
so no threshold separates them. Stripes intact, strands intact, but
the halo blobs fail the gate.
Route 2 (the one allowed alternative): rembg in the project `.venv`.
- `u2net`: rejected — left a white pocket beside the hand.
- `isnet-anime`: PASSED, and is what ships (`scripts/cutout.py`).
  - full: no halo, stripes intact, strand gaps clean, under-arm
    pocket removed. The hand at the bottom is cut by the frame, as in
    the source art.
  - bust: same. Clean edges all round.
  - head: clean at full size. At 24px it is muddy — a dark blob, face
    washed out.
  - face: clean; at 24px the eyes and face still read. Per the brief,
    the nav/footer marks use the FACE cutout, not head.
  - eyes: interior crop, nothing to remove; edges clean.
Proofs: `.receipts/cutout-proofs/*-on-carbon.jpg`, plus
`head-24px.png` / `face-24px.png` for the small-size call.

### Job B — placements (no white or porcelain under her, anywhere)
- Home hero: `bust.png` (porcelain rectangle) → `bust-cut.png` standing
  on carbon, wider (520px), same composition. Figcaption location
  label removed (Job C); `Back again?` stays.
- Header mark: `head.png` → `face-cut.png` (see 24px proof above).
- Footer mark: `head.png` → `face-cut.png`.
- Contact: porcelain panel deleted. Dark section, copy left, support
  copy column capped at 52% width, `full-cut.png` standing on carbon
  at the right with clear space. Buy Me a Coffee stays crimson, here
  only.
- 404: `eyes.png` → `eyes-cut.png` on carbon. "Wrong room." unchanged.
- Studio: no mascot beyond the nav/footer marks, as before.
- OG cards: regenerated (`og-default.png`, `og-rivet.png`) — cutout on
  carbon, no location text. Only two card files exist on this site;
  both were regenerated.
- Old rectangular crops deleted from `src/assets/mascot/`:
  master, full, bust, head, face, eyes, og (all `.png`). Replaced by
  `*-cut.png` (full, bust, head, face, eyes, og). No page references
  the old files (grep over dist = 0).
- `public/logo/` does not exist in this repo, so there was nothing to
  touch there. The square favicon/PFP art in `public/` (favicon.ico,
  apple-touch-icon, icon-192/512) is unchanged on purpose: browser and
  platform chrome, not a rectangle on a page.

### Job C — copy purge, old → new, page by page
Home (`src/pages/index.astro`):
- Title "Vastraa Labs — An AI studio that ships" → "Vastraa Labs".
- Meta "Vastraa Labs is an AI studio in Bihar, India. Two people.
  Everything here is live." → "Vastraa Labs is an AI studio. We build
  and ship our own products: Rivet, Freeline, and Governer."
- H1 "An AI studio that ships." → "An AI studio."
- Hero line "Two people. Everything here is live." → "We build and
  ship our own products."
- Hero mono label "BIHAR, INDIA" → removed.
- Close line "Built in public, with almost no money." → "Rivet,
  Freeline, and Governer are built and maintained by Vastraa Labs."
Studio (`src/pages/studio.astro`, `src/data/studio.ts`):
- Meta "Vastraa Labs is an AI studio in Bihar, India. Two people.
  Real software." → "The people behind Vastraa Labs products, and the
  record of releases."
- H1 "Two people. Real software." → "Who we are."
- Body "Vastraa Labs is an AI studio in Bihar, India. We build our own
  products and ship them in public. No outside money. If it's on this
  site, you can use it today." → "Vastraa Labs is an AI studio run by
  two people. We build our own products and release them in public.
  Everything listed on this site is available to use today."
- How-we-work 01 "Ship it or don't mention it." → "Products appear on
  this site only after they are released."
- How-we-work 02 "Spend little. Build carefully." → "We maintain what
  we release. Fixes and updates keep shipping after launch."
- How-we-work 03 "Open by default." → "Rivet and Governer are open
  source. Freeline is free to use."
- People row "Amardeep Kumar" (plus "kaiser" handle) → "kaiser",
  Founder. His GitHub and X links stay. Co-founder row unchanged.
Contact (`src/pages/contact.astro`):
- Support heading "Keep the lights on." → "Support Vastraa Labs."
- Support line "Tips buy model credits for the next release." →
  "Support goes toward developing and maintaining our products."
Footer (`src/components/Footer.astro`):
- Mono line "Bihar, India" → removed. Footer keeps the mark,
  "Vastraa Labs", and the © line.
OG cards (`scripts/prep-assets.py`):
- Default card mono "AI studio · Bihar, India" → "We build and ship
  our own products." Headlines unchanged ("Vastraa Labs", "Rivet").
Checked and left alone (factual, plain): all Work room lines, Rivet
page lines, Downloads lines, 404 "Wrong room.", ship ledger lines,
hero alt text, every meta description not listed above.

### Job D — QA items
- Sticky header: solid carbon (was carbon at 92%; chose solid over
  blur). One line in `global.css`.
- Governer terminal: same real captured output; the command line is
  now set over two lines with a backslash continuation, and terminal
  lines no longer wrap mid-flag (`white-space: pre`, box scrolls).
  No output text changed.
- Freeline panel: `min-height` and the grid stretch removed; the panel
  hugs its content like the other rooms' frames.

### Job E — proofs over dist (after final build)
- "Bihar" 0 · "Amardeep" 0 · "almost no money" 0 · "India" 0.
- Banned-voice sweep (the brief's list + the plan's list): 0 hits.
- "buymeacoffee" only in `dist/contact/index.html`. "UPI" 0.
  "Governor" 0. "MIT" 0 in HTML.
- APK hashes in dist and public: v1.1.1
  efa76c193773bd0586755c8c1dcee9c71e8edbbe6fc48ea1f25940252f71f8fa,
  v1.1.0 5c7168fcee6ad18679ad478984a311f0c734e401ba3f8d80ac91b25f3edbcc70.
  Byte-identical, untouched.
- Internal links, every page (plain hrefs, no JS interception; the
  only click handler left runs the menu and copy buttons, and never
  touches link navigation):
  all pages → /, /work/, /studio/, /contact/, /downloads/,
  /contact/#support; home adds /work/rivet/#download; downloads adds
  both APK paths and /work/rivet/; rivet page adds
  /downloads/Rivet-v1.1.1.apk; /rivet/ stub → /work/rivet/.
- Route probes against the built site: /, /work/, /work/rivet/,
  /studio/, /contact/, /downloads/, /rivet/, /404.html all 200.
- `npm run build` clean. New tooling: `scripts/cutout.py`, project
  `.venv` (rembg, gitignored). Nothing committed or pushed.

### Follow-up — people section (owner-supplied facts)
- Co-founder row: name set to "Rehan", role stays "Co-founder". His
  only link is Instagram: https://www.instagram.com/1.amrehan.
  No other links invented for him.
- kaiser row: links are now X, GitHub, Instagram, in that order.
  Instagram: https://www.instagram.com/vary.kaiser_
- Instagram glyph: the `instagram` brand mark from simple-icons,
  added to the existing Icon system (`src/components/Icon.astro`),
  one colour, currentColor, like every other brand mark. No emoji,
  no external image.
- Data: URLs added to `src/data/links.ts`; people rows updated in
  `src/data/studio.ts`; Studio row renders the Instagram link last.
- Handle sweep: "via.kaiser_" appears nowhere in src. Grep receipt
  over dist: `via.kaiser_` = 0 hits. `vary.kaiser_` present once
  (Studio page), `1.amrehan` present once.
- Fix round receipts re-checked after this build, all still hold:
  Bihar 0, Amardeep 0, ClientRouter 0, dist JS files 0, plain
  email/mailto 0, Buy Me a Coffee only in dist/contact/index.html,
  APK hashes unchanged (v1.1.1 efa76c19…, v1.1.0 5c7168fc…).
- `npm run build` clean. Nothing committed or pushed.
Fix round: RC1 ClientRouter removed, RC2 email runtime assembly — in progress — 2026-11-02T14:58:30+00:00
Fix round: RC1+RC2, Job A cutouts (rembg isnet-anime, gate passed), Job B placements, Job C copy purge, Job D QA, Job E proofs — done — 2026-11-02T15:13:10+00:00
