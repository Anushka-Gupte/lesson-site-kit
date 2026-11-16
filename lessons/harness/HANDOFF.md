# HARNESS Lesson Agent Handoff (Phase 2)

**Branch:** `agent/harness`  
**Worktree:** `../wt-harness`  
**Preview Port:** `3103`  
**Handoff Path:** `lessons/harness/HANDOFF.md`  
**Status:** Completed and verified  

---

## 1. What was built

1. **Lesson Page (`lessons/harness/index.html`):**
   - Full semantic HTML page following the exact SPEC Section 5 HTML contract and design tokens.
   - Body class `lesson lesson--harness` utilizing `--teal` accent tokens (`#0F766E` light / `#4FD1C5` dark).
   - Global header with relative links and `aria-current="page"` on Harness nav item.
   - Accessible skip link to `#main`.
   - Hero block with reading time (25 min), kicker, title, tags (`Agents`, `Runtime`, `Brakes`), and high-resolution SVG diagram.
   - Sticky Table of Contents (`.toc`) linking to all 11 sections with scrollspy integration.
   - Content accurately structured in accordance with `content/What Is a Harness Pi vs Hermes.md`:
     1. The Brilliant Person Behind the Glass (the glass room metaphor, hands, memory, brakes)
     2. Engine vs Motorcycle (Royal Enfield workshop metaphor, bike-to-harness mapping table, Stepper 1)
     3. The Loop (scooter mechanic metaphor, 4-step execution logic, Stepper 2)
     4. The Playable Mini-Harness Sandbox (scripted model, safety brake switch, visual filesystem state, live terminal log)
     5. Why the Design Choices Matter (The 5 Design Questions)
     6. Pi: The Mechanic's Toolbox (jugaad philosophy, 4 tools, on-demand skills, real Pi run with fake model)
     7. Hermes: The House-Help Who Learns Your Home (family house-help metaphor, 27 default / 40+ documented tools, persistent memory, self-written skills, multi-channel reach, prompt size report)
     8. Pi and Hermes Side by Side (side-by-side comparison cards, measured character overhead bar chart, comprehensive comparison table, repo size vs prompt size deep dive, and the surprising brake test caveat)
     9. Where You Would Use Each (concrete scenarios: CS lab grading agent vs Mumbai designer morning assistant)
     10. The Whole Thing in Plain Words (5 dinner-conversation takeaways)
     11. Check Your Understanding (6 interactive `.qa` disclosures adapted from presenter questions)
     12. Run It Yourself &amp; References (executable commands for `mini_harness.py`, `run_real_pi.sh`, `run_hermes_measure.sh`, what was checked vs not checked, and authoritative citations)
   - Prev/Next navigation strip connecting Transformer &larr; Harness &rarr; Roofline.
   - Standardized footer copied verbatim from `docs/design-system.html`.

2. **Two Step-by-Step Interactive Steppers (`[data-stepper]`):**
   - **Stepper 1: "Engine Becomes a Motorcycle" (5 steps):**
     1. The Engine (The Model)
     2. The Handlebars (Tools: read, write, bash)
     3. The Dashboard (Context Window)
     4. The Brakes (Permissions &amp; Sandbox)
     5. The Service Book &amp; Frame (Memory &amp; Harness enclosure)
     - Features cumulative SVG layers (`data-step="1"` through `5`), dynamic `.is-visible` / `.is-current` states, polite ARIA announcements, and keyboard arrow controls.
   - **Stepper 2: "The 5-Step Agent Loop" (5 steps):**
     1. You State the Task
     2. Harness Builds Context
     3. Model Decides the Next Move
     4. Harness Executes the Tool
     5. Feed Result Back &amp; Exit
     - Cumulative SVG layers illustrating context injection, tool invocation, brake intercept, and exit when the model signals "DONE".

3. **Playable Mini-Harness Interactive Sandbox (`lessons/harness/lesson.js`):**
   - Standalone, zero-dependency browser implementation matching the behavior of `provided/code/mini_harness.py`.
   - Clear banner stating the stand-in model is a scripted plan, not intelligent.
   - **Scenario 1 (Run 1: Fix a Bug):**
     - Simulates test execution &rarr; fails with `AssertionError: expected 4, got 3.0`.
     - Simulates code write &rarr; fixes `calc.py`.
     - Simulates re-test &rarr; outputs `PASS`.
     - Updates visual filesystem badges (`calc.py` &rarr; Fixed, `test.py` &rarr; PASS).
   - **Scenario 2 (Run 2: Reckless Model):**
     - Interactive **Safety Brake Toggle** (`ON` / `OFF`) with full keyboard and screen-reader accessibility (`aria-pressed`).
     - With Brake `OFF`: Command `rm -rf precious` executes, terminal logs deletion, and visual folder badge updates to crossed-out `Deleted!`.
     - With Brake `ON`: Command is intercepted *before* running: `BLOCKED by harness: this command needs human approval.`, and folder badge indicates `Protected (thesis saved!)`.
   - Step Next Turn, Run All, and Reset actions with polite live region screen-reader announcements.

4. **Vector Illustrations & Diagrams (`assets/img/harness/`):**
   - `assets/img/harness/hero-harness.svg` (1600&times;900): Editorial hero blueprint schematic showing the model engine nestled in the motorcycle frame with handlebar tools, context gauge, brake caliper, and memory book.
   - `assets/img/harness/glass-room.svg` (800&times;480): Visual representation of the brilliant model locked inside a soundproof glass room, passing text notes under the door while lacking hands, memory, and brakes.
   - `assets/img/harness/chart-cost-comparison.svg` (840&times;440): High-contrast SVG bar chart illustrating measured fixed cost per turn: Pi 1.5.2 (5,251 chars / ~1,312 tokens across 4 tools) vs Hermes Agent 0.19.0 (53,714 chars / ~13,428 tokens across 27 tools) with breakdown between system prompt and tool schemas.
   - All SVGs strictly validated as clean XML via `python scripts/check_svg.py` with 0 HTML named entities and minimum text size &ge; 14px.

5. **Scoped Styles (`lessons/harness/lesson.css`):**
   - Scoped under `.lesson--harness`.
   - Styles for the Mini-Harness terminal, filesystem cards, control switches, side-by-side comparison cards (`.compare-grid`), and chart container.
   - Mobile overflow containment ensuring clean display at 360px viewport without horizontal window scrolling.

---

## 2. Files touched (owned paths in `ownership.json`)

All files are strictly within the `harness` ownership lane (`lessons/harness/**` and `assets/img/harness/**`):
- `assets/img/harness/hero-harness.svg`
- `assets/img/harness/glass-room.svg`
- `assets/img/harness/chart-cost-comparison.svg`
- `lessons/harness/index.html`
- `lessons/harness/lesson.css`
- `lessons/harness/lesson.js`
- `lessons/harness/HANDOFF.md`

Ownership check:
`python scripts/check_ownership.py harness agent/harness main` &rarr; `agent=harness branch=agent/harness: 0 outside its lane`.

---

## 3. Decisions & Rationale

- **No runtime libraries or CDNs:** Everything was constructed with pure HTML5, vanilla CSS, and standard ES6 JavaScript. Fonts default to system typography fallbacks gracefully.
- **Strict adherence to measured content:** All numbers match `content/What Is a Harness Pi vs Hermes.md` exactly (Pi: 2,295 char system prompt, 2,956 char tool definitions, 5,251 total chars; Hermes: 6,634 char prompt, 47,080 char schemas, 53,714 total chars). No figures or capabilities were invented.
- **The Brake Test caveat preserved:** Highlighted the surprising measurement where `rm -rf ~/victim` executed in Hermes one-shot mode (`-z`), emphasizing the core lesson: *"a brake you have not tested is only a hope."*
- **Mobile overflow isolation:** Added `overflow-x: auto`, `min-width: 0`, and `max-width: 100%` on code containers and pre blocks so code scrolls cleanly inside its container rather than expanding the page layout at 360px.
- **Strict XML entity adherence:** Used numeric entities (`&#8226;`, `&#8594;`, `&#10005;`) and UTF-8 characters across all `.svg` files to prevent XML parse failures.

---

## 4. Verification & Testing

1. **Automated SVG Linting (`scripts/check_svg.py`):**
   - Verified all 8 SVGs across the project: **0 broken files**.
2. **HTML Structure & Anchor Verification:**
   - Single `<h1>` on page (accessible landmark requirement).
   - 0 broken internal anchor links across TOC navigation.
   - Stepper JSON payloads parsed with 5/5 valid steps each.
3. **Browser QA Verification (via automated Browser Agent on `http://localhost:3103`):**
   - **Desktop Viewport (1280px):**
     - Full visual check: Header, Hero graphic, Table of contents, Steppers 1 &amp; 2, Mini-Harness simulator, comparison cards, chart, data table, and footer rendered cleanly.
     - **Console status: 0 errors, 0 uncaught exceptions, 0 failed network requests.**
   - **Theme Toggle:**
     - Switched between light and dark themes; verified color palette switches immediately, `data-theme` updates, and toggle icon changes.
   - **Interactive Steppers:**
     - Stepper 1: Stepped forward 1 &rarr; 5 and backward 5 &rarr; 1. SVG cumulative layers and text panels updated smoothly.
     - Stepper 2: Stepped forward through all 5 loop steps. Controls disabled at Step 5.
   - **Mini-Harness Sandbox:**
     - Run 1: Stepped through all 3 turns; verified tests failed, calc.py updated, and tests passed.
     - Run 2 with Brake OFF: Verified `rm -rf precious` executed and folder marked as `Deleted!`.
     - Run 2 with Brake ON: Verified `BLOCKED by harness` intercepted execution and folder remained `Protected`.
   - **Code Copy Button:**
     - Clicked copy button; verified feedback updated to "Copied!" and text copied to clipboard.
   - **Mobile Viewport (360px &times; 640px):**
     - Tested on mobile viewport; verified body width is 344.67px (&lt; 360px).
     - **Zero horizontal window scrolling / zero document overflow.**
     - Code snippets and data tables scroll within their dedicated containers.

---

## 5. Anything not done or needed from another lane

- Links to `../../lessons/transformer/` and `../../lessons/roofline/` point to the respective sibling lesson paths defined in the SPEC contract, which are owned and built by the parallel `transformer` and `roofline` agents.
