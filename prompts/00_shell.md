# Agent: SHELL (design system + home page). Phase 1, runs alone first.
Worktree `../wt-shell`, branch `agent/shell`, preview port 3101. Handoff: `docs/HANDOFF-shell.md`.

Read `SPEC.md` and `AGENTS.md` fully before doing anything. Then produce a plan and wait for approval.

## Mission
Build the foundation that three other agents will build on in parallel after you: the design system, the shared JavaScript, and the home page. The quality bar is "an editorial site a design-conscious person would bookmark", not "a template".

## You own
`assets/css/**`, `assets/js/site.js`, `assets/img/brand/**`, `index.html`, `404.html`, `docs/design-system.html`, `docs/HANDOFF-shell.md`.

## Deliverables
0. Fonts: use the system fallbacks unless WOFF2 files exist in `provided/fonts/` (then copy them to `assets/fonts/`). Never download fonts.
1. `assets/css/site.css` (may import partials from `assets/css/`): all tokens from SPEC section 4 as custom properties, light and dark, plus every component in the SPEC section 5 contract: `.callout` (4 variants), `.figure`, `.stepper`, `.run`, `.deepdive`, `.qa`, `.table-wrap/.table`, `.prose`, `.lesson-hero`, `.toc`, `.btn`, `.chip`, `.kicker`, `.prevnext`, `.card-grid/.card` (3 accent variants: `card--transformer`, `card--harness`, `card--roofline`), site header and footer, theme toggle.
2. `assets/js/site.js`: auto-wires `[data-stepper]` (steps are cumulative, current step gets `is-current`, buttons, left/right arrow keys, updates the panel from the JSON block, announces changes politely), `[data-copy]` copy buttons, a light/dark toggle that remembers the choice, and a table-of-contents scrollspy. No dependencies.
3. `index.html`: hero (strong headline, one-line promise, a small decorative SVG), the three lesson cards using the exact card anatomy in the spec, and a short "how to use this site" strip. Write the card copy from the three `content/` files; do not invent claims.
4. **Imagery:** three card thumbnails (960x640) in `assets/img/brand/thumb-transformer.svg`, `thumb-harness.svg`, `thumb-roofline.svg`, plus a brand mark and favicon. Concepts: transformer = stacked tiles joined by attention arcs; harness = an engine being fitted into a motorcycle frame; roofline = a roof-shaped line over a dhaba kitchen counter. Flat, rounded strokes, 2 to 3 token colours, a subtle dotted or rangoli-like texture. Meaningful alt text on every use.
5. `docs/design-system.html`: a live gallery showing every component in both themes, using the real markup, so the lesson agents can copy from it. This page is their reference, so make it complete.
6. `404.html` with personality, fully self-contained (inline CSS, no relative assets), per SPEC section 5.

## Acceptance
- Home and gallery: Lighthouse mobile >= 90 in all four categories; no horizontal scroll at 360px; no console errors; keyboard-only navigation works with a visible focus ring; contrast AA in both themes.
- The stepper works with the sample markup in the gallery, with mouse, touch and keyboard.
- Cards: hover lift and focus ring work; the whole card is one link.

Finish with `docs/HANDOFF-shell.md`, then stop.
