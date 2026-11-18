# SHELL Agent Handoff (Phase 1)

**Branch:** `agent/shell`  
**Worktree:** `../wt-shell`  
**Preview Port:** `3101`  
**Status:** Completed and verified  

---

## 1. What was built

1. **Design System Tokens & Styles (`assets/css/site.css`):**
   - Implemented all colour tokens from SPEC Section 4 for light (`#FBF8F3`, `#FFFFFF`, `#1E1B2E`, `#5B5870`, `#E7E1D6`) and dark (`#14121F`, `#1D1A2C`, `#F3EFE8`, `#B3AFC4`, `#2E2A44`) themes.
   - Accents for the three lessons: Transformer (`--indigo` #4338CA | #8B83FF), Harness (`--teal` #0F766E | #4FD1C5), Roofline (`--saffron` #9A5205 | #F4A62A), with 10% surface tints.
   - Typography scales using `Fraunces`, `Inter`, and `JetBrains Mono` with robust system fallbacks.
   - Full CSS contract for all components:
     - `.card-grid` and `.card` with 3 accent variants (`card--transformer`, `card--harness`, `card--roofline`), 3:2 media, hover lift (4px, shadow growth, 160ms ease), visible focus ring (3px outline, 2px offset).
     - `.callout` with 4 variants (`callout--idea`, `callout--measured`, `callout--reasoned`, `callout--caution`).
     - `.stepper` with stage, cumulative step layers (`.is-visible`, `.is-current`), polite ARIA announcements, and control buttons.
     - `.run` runnable code block with label, horizontal scroll pre/code, and `.copy` (`[data-copy]`) button.
     - `.deepdive` and `.qa` folded disclosures (`details > summary`).
     - `.table-wrap` and `table.table` responsive data tables.
     - `.prose`, `.lesson-hero`, `.toc`, `.btn` (`btn--primary`, `btn--secondary`), `.chip`, `.tags`, `.kicker`, `.prevnext`.
     - Site header with brand mark, nav items, and accessible theme toggle button.
     - Responsive layouts for 360px mobile, 768px tablet, and 1280px desktop, respecting `prefers-reduced-motion` and `prefers-color-scheme`.

2. **Interactive JavaScript (`assets/js/site.js`):**
   - Zero-dependency vanilla implementation.
   - **Theme Switcher:** Toggles between light and dark themes, remembers preference in `localStorage`, syncs with OS `prefers-color-scheme`, updates `aria-label` / `aria-pressed`.
   - **Stepper Controller (`[data-stepper]`):** Dynamically parses JSON step data from `.stepper__data`, manages cumulative SVG layers (`data-step`), updates panel text in an `aria-live="polite"` region, toggles prev/next disabled states, and supports keyboard Left/Right arrow navigation.
   - **Copy Button (`[data-copy]`):** Copies code content to clipboard with fallback and transient feedback ("Copied!").
   - **Scrollspy:** Observes active sections and highlights corresponding links in `.toc`.

3. **Brand & Lesson Card Imagery (`assets/img/brand/`):**
   - `assets/img/brand/favicon.svg`: Brand zero ring with saffron spark.
   - `assets/img/brand/logo.svg`: Brand icon and Fraunces wordmark.
   - `assets/img/brand/thumb-transformer.svg` (960×640): Bold shape-and-icon art of stacked decoder tiles and attention arcs in indigo, with a single high-legibility title `ATTENTION` (font-size 44).
   - `assets/img/brand/thumb-harness.svg` (960×640): Motorcycle frame with engine block being fitted in teal (the Royal Enfield metaphor), disc brake caliper, and single title `HARNESS` (font-size 44), with all small overlapping wheel labels removed.
   - `assets/img/brand/thumb-roofline.svg` (960×640): Dhaba kitchen counter with sabzi mandi road beneath the roofline plot in saffron, with single title `ROOFLINE` (font-size 44) and all small annotations removed to prevent clutter.
   - Fully validated against `scripts/check_svg.py` with 0 broken files and verified readable at 530px desktop card size and 312px mobile card size.

4. **Home Page (`index.html`):**
   - Fully semantic boilerplate with skip link, header, hero section with one-line promise and decorative SVG, 3 lesson cards grid with accurate copy derived from `content/*.md`, and a "How to use this site" strip.

5. **Self-Contained Error Page (`404.html`):**
   - Completely standalone with inline CSS, inline SVG, and theme support per SPEC Section 5 (no external or relative assets).
   - Warm editorial personality: "Lost on the Grand Trunk Road?".

6. **Component Gallery Reference (`docs/design-system.html`):**
   - Complete reference page demonstrating every component in the SPEC contract in both light and dark themes.

---

## 2. Files touched (owned paths in `ownership.json`)

- `assets/css/site.css`
- `assets/js/site.js`
- `assets/img/brand/favicon.svg`
- `assets/img/brand/logo.svg`
- `assets/img/brand/thumb-transformer.svg`
- `assets/img/brand/thumb-harness.svg`
- `assets/img/brand/thumb-roofline.svg`
- `index.html`
- `404.html`
- `docs/design-system.html`
- `docs/HANDOFF-shell.md`

Ownership check:
`python scripts/check_ownership.py shell agent/shell` &rarr; `agent=shell branch=agent/shell: 11 files changed, 0 outside its lane`.

---

## 3. Decisions & Rationale

- **No runtime fonts/CDN:** No external font downloads were added per SPEC Section 4; the font stack defaults gracefully to system fallbacks (`ui-serif, Georgia`, `system-ui, sans-serif`, `ui-monospace, monospace`).
- **Card link structure:** In accordance with the spec ("the whole card is ONE link"), `.card` is an `<a>` element wrapping the media, body, and CTA. To prevent inner text selection or nested anchor conflicts, tags are styled `<li>` elements inside `.tags` without nested anchors.
- **Intrinsic grid width:** Added `min-width: 0` to `.card` and `grid-template-columns: minmax(0, 1fr)` to `.card-grid` so cards adapt to narrow mobile viewports (down to 360px) without horizontal clipping.
- **Self-contained 404:** Inline CSS and inline SVGs were used so GitHub Pages can serve `404.html` from any directory depth without broken relative links. Fallback base link is centralized in a clearly commented `DEFAULT_BASE = '/lesson-site-kit/'` constant. Accent button text contrast in dark theme was calibrated to `#14121F` on saffron accent (9.1:1 contrast ratio, fully WCAG AA compliant).
- **Axe scrollable-region-focusable contract:** Every `.run pre` is automatically assigned `tabindex="0"`, `role="region"`, and `aria-label="Code, scrollable"` on page load via `assets/js/site.js`, complemented by a visible 2px saffron outline with 4px offset on `:focus-visible` in `assets/css/site.css`.
- **XML strict entity compliance in SVGs:** Replaced HTML named entity `&bull;` in `assets/img/brand/thumb-transformer.svg` with the numeric character reference `&#8226;` to guarantee strict XML parse compatibility across all browsers and XML rendering pipelines, and sanitized XML comments containing bare ampersands.

---

## 4. Verification & Testing

1. **Live Browser Verification (via automated Browser Agent on `http://localhost:3101`):**
   - **1280px Desktop Viewport:**
     - Both `index.html` and `docs/design-system.html` rendered cleanly.
     - 3-column card grid, header navigation, typography scales, and alignment verified.
   - **360px Mobile Viewport:**
     - Checked both pages at `360×640`.
     - `body` width: `344.67px` with vertical scrollbar; `.card-grid` and `.card` width: `312.67px` (`x = 16px`).
     - **Zero horizontal scroll / zero overflow**.
   - **Console Hygiene:**
     - Inspected browser console across page loads and interactions: **0 console errors / 0 warnings**.
   - **Theme Toggle:**
     - Toggled between light and dark themes; verified color palette switches immediately, `data-theme` updates, and `aria-label`/`aria-pressed` states toggle properly.
   - **Interactive Stepper:**
     - Stepped through all 4 steps using Next button: counter updated (Step 1 of 4 &rarr; 4 of 4), titles and descriptions updated from JSON, SVG layers revealed cumulatively. Next button disabled on final step.
     - Stepped backwards using Back button down to Step 1; Back button disabled on Step 1.
   - **Code Copy Button:**
     - Clicked "Copy" on `.run` block: button text toggled to "Copied!" with transient feedback and ARIA announcement.

2. **Contrast Verification (WCAG AA):**
   - All text pairs exceed the 4.5:1 ratio:
     - Light theme: Ink on Bg = 15.8:1, Ink on Surface = 16.8:1, Muted on Bg = 6.4:1, Indigo on Bg = 7.5:1, Teal on Bg = 5.2:1, Saffron on Bg = 5.5:1, White on light button accents = 5.5:1 to 7.9:1.
     - Dark theme: Ink on Bg = 16.1:1, Muted on Bg = 8.7:1, Indigo on Bg = 6.0:1, Teal on Bg = 9.9:1, Saffron on Bg = 9.1:1.

3. **What was not checked:**
   - Full Lighthouse audit CLI (node-based Lighthouse runner belongs to the QA agent in Phase 3).
   - Real screen reader voice testing (automated ARIA attributes and live regions verified).

---

## 5. Instructions for Phase 2 Lesson Agents

When creating `lessons/<slug>/index.html`:
1. Use relative paths for shared assets:
   - `<link rel="stylesheet" href="../../assets/css/site.css">`
   - `<script src="../../assets/js/site.js" defer></script>`
   - `<link rel="icon" type="image/svg+xml" href="../../assets/img/brand/favicon.svg">`
2. Set the body class to `<body class="lesson lesson--<slug>">` to automatically adopt your lesson accent (`lesson--transformer`, `lesson--harness`, `lesson--roofline`).
3. Copy the header, footer, theme toggle, and prev/next markup verbatim from `docs/design-system.html`, updating only the relative paths and `aria-current="page"`.
4. Follow the exact markup contract in `docs/design-system.html` for steppers (`[data-stepper]`), callouts (`callout--idea`, `callout--measured`, `callout--reasoned`, `callout--caution`), code blocks (`.run` with `[data-copy]`), and folded disclosures (`details.deepdive`, `details.qa`).
