# SPEC: "From Zero" — three first-principles lessons as a designed website

Human-owned. Agents READ this file; they never edit it. If something here is wrong or unclear, STOP and write the question in your handoff file.

## 1. Goal and success criteria
Turn three finished lessons (`content/transformer.md`, `content/harness.md`, `content/roofline.md`) into one small, beautiful, static website that a total beginner can read, play with and learn from.

Measurable "done":
- 5 pages: `index.html` (home), 3 lesson pages, `404.html`. Plain HTML/CSS/JS. **No build step, no framework, no runtime CDN** (self-hosted or system fonts only).
- Lighthouse (mobile) >= 90 in all four categories on every page.
- axe-core: 0 serious or critical violations. Every image has meaningful alt text. WCAG AA contrast, light and dark.
- 0 broken internal links. Works at 360px, 768px and 1280px widths without horizontal scrolling.
- Every number on a lesson page matches its `content/*.md` source or a file in `provided/`. Labels such as *measured*, *reasoned*, *from spec sheets* are kept: do not turn a reasoned number into a measured one.
- Deploys as-is to GitHub Pages.

## 2. Audience and voice
Total beginners. Warm, curious, concrete. Keep the Indian metaphors (dhaba kitchen, Royal Enfield, mandi, passbook, BEST bus, jugaad). Math only where it carries insight, tucked inside "Under the hood" disclosures. Never invent facts: if the content file does not say it, do not add it.

## 3. Pages
| Page | Path | Owner |
|---|---|---|
| Home: hero + 3 lesson cards + "how to use this site" | `index.html` | shell |
| Transformer, from scratch | `lessons/transformer/index.html` | transformer |
| What is a harness? Pi vs Hermes | `lessons/harness/index.html` | harness |
| The GPU roofline plot | `lessons/roofline/index.html` | roofline |
| 404 | `404.html` | shell |

Lesson page anatomy (top to bottom): hero (title, one-line hook, reading time, tags, hero illustration) -> sticky table of contents (desktop) -> sections written as short cards and prose -> interactive figure(s) -> callouts -> "Check your understanding" -> "Reproduce it" (code from `provided/code/`) -> references -> prev/next lesson links.

## 4. Design system (owned by the shell agent; implement as CSS custom properties)
**Mood:** warm paper, ink, one saffron spark. Editorial, calm, confident. Not a SaaS template.

Colour tokens (light | dark):
- `--bg` #FBF8F3 | #14121F   `--surface` #FFFFFF | #1D1A2C   `--ink` #1E1B2E | #F3EFE8
- `--muted` #5B5870 | #B3AFC4   `--border` #E7E1D6 | #2E2A44
- Lesson accents: transformer `--indigo` #4338CA | #8B83FF; harness `--teal` #0F766E | #4FD1C5; roofline `--saffron` #9A5205 | #F4A62A (the light value was darkened after a contrast check: #C2680A was only 3.76:1 on the page background)
- Callout tints are 10% of the matching accent on `--surface`. Contrast checked (WCAG, text): ink and muted pass everywhere; light accents on bg/surface/tint are indigo 7.5/7.9/6.7, teal 5.2/5.5/4.8, saffron 5.5/5.9/5.1; dark accents all >= 4.8. White text on a light-theme accent button passes for all three. Any NEW colour pair must be checked to >= 4.5:1 for text (3:1 only for 24px+ headings and UI borders).

Type: display **Fraunces** 600 (titles), body **Inter** 400/500/600, code **JetBrains Mono**. Use these as the FIRST names in each font stack, with system fallbacks (`ui-serif, Georgia`, `system-ui, sans-serif`, `ui-monospace, monospace`). The site must look good with the fallbacks alone. If the human has placed OFL-licensed WOFF2 files in `provided/fonts/`, the shell agent copies them to `assets/fonts/` and adds `@font-face` with `font-display: swap`. Agents never download fonts from the internet. Scale: 14/16/18/22/28/40/56. Body 18px, line-height 1.7, reading width 68ch.

Space: 4px base (4, 8, 12, 16, 24, 32, 48, 72). Radius: cards 16px, small 10px. Shadow: `0 1px 2px rgba(20,18,31,.06), 0 8px 24px rgba(20,18,31,.08)`. Hover on cards: lift 4px, shadow grows, 160ms ease. Respect `prefers-reduced-motion`. Focus ring: 3px accent outline, 2px offset, always visible.

**Lesson card (the star of the home page):** the whole card is ONE link. Layout: media 3:2 (SVG illustration, accent-tinted background) on top; below it an eyebrow ("Lesson 1 · 25 min · Beginner"), title in Fraunces 28px, 2-line description, up to 3 tag chips, and a text CTA "Start the lesson ->". A thin accent bar sits at the card top. Cards sit in a responsive grid (3 columns >= 960px, 1 column below).

**Imagery rules:** all images are hand-built **SVG** (crisp, tiny, themeable) unless a PNG is listed in `provided/images/`. Flat geometric style, rounded strokes (3 to 4px), 2 to 3 colours drawn from the tokens, subtle texture allowed (dots, rangoli-like repeats). No stock photos, no hotlinked images, no copyrighted characters or logos. Sizes: card thumbnail 960x640, hero 1600x900, inline diagrams use a viewBox and scale to width. Informative images need alt text that explains what they teach. Purely decorative images (dividers, background patterns) must use alt="" plus aria-hidden="true"; never describe them.

## 5. HTML contract (the shell agent builds CSS and JS for exactly this markup; lesson agents write exactly this markup)
**Page boilerplate (every page, for Lighthouse SEO and accessibility):** `<!doctype html>`, `<html lang="en">`, `<meta charset="utf-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1">`, a unique `<title>`, a unique `<meta name="description">` (under 160 characters), `<meta name="color-scheme" content="light dark">`, one `<h1>`, a skip link to `#main`, landmarks (`header`, `nav`, `main id="main"`, `footer`), descriptive link text (never "click here").

**URLs:** every internal URL is RELATIVE (`../../assets/css/site.css`, never `/assets/...`), because GitHub Pages serves a project site from a sub-path. **`404.html` is the exception: it must be fully self-contained** (inline CSS, no relative assets), because GitHub Pages serves it from arbitrary depths.

**Header, footer, theme toggle and prev/next markup:** the shell agent defines them once in `docs/design-system.html`. Lesson pages copy them verbatim, changing only the relative paths and `aria-current`. Nav items: Home, Transformer, Harness, Roofline.

Lesson page head: `<link rel="stylesheet" href="../../assets/css/site.css">`, `<script src="../../assets/js/site.js" defer></script>`, optional `lesson.css` and `lesson.js` in the lesson folder. Body class `lesson lesson--<slug>` sets the accent.

```html
<!-- callout: variants idea | measured | reasoned | caution -->
<aside class="callout callout--measured"><p class="callout__label">Measured</p><p>...</p></aside>

<!-- figure -->
<figure class="figure"><img src="..." alt="..." width="1200" height="675" loading="lazy"><figcaption>...</figcaption></figure>

<!-- step-by-step figure: site.js wires it. Steps are cumulative; the current step gets .is-current -->
<figure class="stepper" data-stepper aria-label="...">
  <div class="stepper__stage"><svg viewBox="0 0 680 450" role="img" aria-label="..."><g data-step="1">...</g><g data-step="2">...</g></svg></div>
  <div class="stepper__panel" aria-live="polite"><p class="stepper__count"></p><h3 class="stepper__title"></h3><p class="stepper__text"></p></div>
  <div class="stepper__controls"><button type="button" data-prev>Back</button><button type="button" data-next>Next</button></div>
  <script type="application/json" class="stepper__data">[{"title":"...","text":"..."}]</script>
</figure>

<!-- runnable code, with a copy button -->
<div class="run"><p class="run__label">Run it</p><pre><code>...</code></pre><button type="button" class="copy" data-copy>Copy</button></div>

<!-- maths and deep dives stay folded -->
<details class="deepdive"><summary>Under the hood: why divide by sqrt(d)</summary>...</details>
<details class="qa"><summary>Question</summary><p>One-line answer</p></details>

<!-- card grid on the home page -->
<div class="card-grid"><a class="card card--transformer" href="lessons/transformer/"><div class="card__media"><img ...></div><div class="card__body"><p class="card__eyebrow">...</p><h3 class="card__title">...</h3><p class="card__text">...</p><ul class="tags"><li>...</li></ul><span class="card__cta">Start the lesson</span></div></a></div>
```
Also available: `.table-wrap > table.table`, `.prose`, `.lesson-hero`, `.toc`, `.btn`, `.chip`, `.kicker`, `.prevnext`.

If a lesson needs a component that does not exist, write it as scoped CSS in its own `lessons/<slug>/lesson.css` under `.lesson--<slug>`. Never edit `assets/css/**`. The shell agent may promote it later.

## 6. Interactive figures (what makes the site more than a PDF)
- **Transformer:** a 9-step stepper that builds the decoder-only machine bottom to top with the example "Local trains are often ..." (text, token IDs, embeddings, position, masked attention + bypass, MLP + bypass, repeat N times, final scores, softmax). Plus a small "who does `they` look at?" attention bar demo using the numbers in the content file.
- **Harness:** (1) 5-step "engine becomes a motorcycle" stepper; (2) 5-step agent-loop stepper; (3) a playable mini-harness: a scripted model, a brake switch, and a visible `precious/` folder that survives only when the brake is ON; (4) Pi vs Hermes as two cards plus an SVG bar chart of the measured fixed cost (about 5.2k vs 54k characters).
- **Roofline:** (1) 5-step roofline build-up stepper; (2) an interactive explorer: sliders for peak TFLOP/s and bandwidth, chip presets (MI300X, Tesla T4 measured, my CPU measured), live ridge point, and four example operations placed on the plot; (3) the two measured PNGs with captions.

## 6b. Turning presenter scripts into web copy
The `content/*.md` files were written as lessons to be SPOKEN. When converting:
- Keep the story order, the examples, the numbers and the *measured / reasoned / spec sheet* labels exactly.
- Replace every drawing instruction (`Diagram N, step K`, `Step N diagram`, "draw a box...") with the real figure or stepper. Never print those markers on the page.
- Remove presenter-only material: timing tables, "How to say it" cues, "Questions to ask the room" (turn the questions into the `qa` disclosures), and instructions like "do the install before class".
- Keep first-person author voice ("I measured...") as written; do not add new "I" claims.
- Spoken `[Run]` blocks become a `.run` block under a short "Run it yourself" heading.
- Keep each section short: a card-sized idea, then a figure or callout. Long walls of prose are a failure of this brief.

## 7. Ownership and phases
See `ownership.json` (machine-checked by `scripts/check_ownership.py`).
1. **Phase 0 (human):** content files in place, SPEC and AGENTS committed.
2. **Phase 1 (shell agent alone):** design system, `site.js`, home page, component gallery `docs/design-system.html`. Human reviews and merges.
3. **Phase 2 (three lesson agents in parallel, each in its own worktree and port):** each branches from the merged `main`. The shell agent may keep polishing the home page.
4. **Phase 3 (qa agent):** tests, Lighthouse, axe, link check, README, QA report.
5. **Phase 4 (human):** review, fix, merge, deploy.

## 7b. Tooling rules
No agent adds a root `package.json`. If QA needs Node tools (Lighthouse, axe), they live only inside `tests/` (`tests/package.json`), and `node_modules/` is git-ignored (see `.gitignore`). Humans own `.gitignore`, `scripts/setup_worktrees.sh`, `scripts/check_ownership.py`, `scripts/evidence.sh` and `evidence/`.

## 8. Non-goals
No CMS, no search, no comments, no analytics, no login, no framework, no build pipeline.
