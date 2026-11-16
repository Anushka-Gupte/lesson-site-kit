# From Zero: First-Principles Lessons on AI & Systems

**From Zero** is a collection of three foundational, first-principles interactive lessons designed to make complex AI and computational systems intuitive, concrete, and accessible to beginners:

1. **The Transformer, from Scratch** (`lessons/transformer/`): Demystifying autoregressive language models, word embeddings, positional encodings, scaled dot-product attention, causal masking, MLPs, residual bypasses, and generation probabilities using relatable metaphors and an interactive 9-step stepper.
2. **What Is a Harness? Pi vs Hermes** (`lessons/harness/`): Exploring LLM agent harnesses, tool execution, context windows, sandbox safeguards, and the fixed-prompt character cost trade-off between minimalist single-file agents (Pi) and production tool frameworks (Hermes Agent).
3. **The GPU Roofline Plot, from Scratch** (`lessons/roofline/`): Understanding hardware bottlenecks, arithmetic intensity (FLOPs per byte), memory roofs, compute roofs, the ridge point, kernel fusion, and real empirical benchmarks measured on Intel Xeon CPUs and NVIDIA Tesla T4 GPUs.

---

## Quick Start / Local Preview

The site is 100% static with **zero runtime dependencies, zero external CDNs, and zero build steps**.

To preview locally:

```bash
# Serve from repository root on port 3105
python -m http.server 3105
```

Then open your browser to:
- [http://localhost:3105/](http://localhost:3105/) — Home page & lesson directory
- [http://localhost:3105/lessons/transformer/](http://localhost:3105/lessons/transformer/) — Transformer lesson
- [http://localhost:3105/lessons/harness/](http://localhost:3105/lessons/harness/) — Harness lesson
- [http://localhost:3105/lessons/roofline/](http://localhost:3105/lessons/roofline/) — Roofline lesson
- [http://localhost:3105/404.html](http://localhost:3105/404.html) — Self-contained 404 page

---

## Architectural Principles

- **No Frameworks or Bundlers**: Pure hand-written HTML5, semantic markup, and vanilla CSS custom properties.
- **Zero Runtime Dependencies**: No npm packages, external JS CDNs, or tracking scripts.
- **System Typography & Self-Contained Assets**: High-readability font stacks (`Fraunces`, `Inter`, `JetBrains Mono`) with native system fallbacks.
- **Vector Graphics & Crisp SVGs**: Crisp, theme-aware hand-crafted SVGs that scale cleanly without pixelation.
- **Full Accessibility (WCAG AA)**: Semantic landmark elements (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`), keyboard focus indicators, `prefers-reduced-motion` compliance, and dual light/dark theme support.
- **Epistemic Truth**: Rigorous separation between *measured* experimental data, *from spec sheets*, and *reasoned* mathematical bounds.

---

## How It Was Built: Multi-Agent Architecture

This project was built using **Google Antigravity**, coordinating specialized autonomous agent lanes operating in parallel isolated git worktrees:

```
lesson-site-kit/
├── wt-shell/         (agent/shell)       -> Core design system, CSS tokens, home page & 404
├── wt-transformer/   (agent/transformer) -> Transformer lesson & interactive 9-step builder
├── wt-harness/       (agent/harness)     -> Harness lesson & mini-sandbox simulation
├── wt-roofline/      (agent/roofline)    -> Roofline lesson, interactive explorer & charts
└── wt-qa/            (agent/qa)          -> Test suites, crawler, Lighthouse, axe, audit & docs
```

### Lane Ownership & Boundary Enforcement
To prevent cross-agent collisions, file ownership is strictly enforced via `ownership.json` and guarded by `scripts/check_ownership.py`:
- **Shell Agent**: `index.html`, `404.html`, `assets/css/**`, `assets/js/site.js`, `docs/design-system.html`.
- **Transformer Agent**: `lessons/transformer/**`, `assets/img/transformer/**`.
- **Harness Agent**: `lessons/harness/**`, `assets/img/harness/**`.
- **Roofline Agent**: `lessons/roofline/**`, `assets/img/roofline/**`.
- **QA Agent**: `tests/**`, `scripts/qa_*`, `.github/**`, `README.md`, `docs/QA-REPORT.md`, `docs/HANDOFF-qa.md`.

---

## QA & Automated Verification

The QA lane verifies site reliability, accessibility, and fidelity using automated test suites:

### 1. Link & Asset Crawler (`scripts/qa_links.py`)
Validates every internal `<a href>`, `<img src>`, `<link rel="stylesheet">`, and `<script>` across all 5 pages. Checks anchor targets, verifies image files exist, and validates alt text:
```bash
python scripts/qa_links.py
```

### 2. Numerical & Epistemic Verification (`scripts/qa_numbers.py`)
Checks that empirical figures, parameters, FLOPs, memory bandwidth, latency numbers, and token costs from `content/*.md` appear faithfully on the corresponding lesson pages, verifying epistemic labels (*measured*, *reasoned*, *from spec sheets*):
```bash
python scripts/qa_numbers.py
```

### 3. axe-core Accessibility Suite (`tests/run_axe.js`)
Audits all 5 pages in both light and dark themes against WCAG 2.0 / 2.1 AA rules using headless Chrome:
```bash
node tests/run_axe.js
```

### 4. Lighthouse Mobile Audit (`tests/run_lighthouse.js`)
Runs Google Lighthouse in mobile emulation mode across all five pages:
```bash
node tests/run_lighthouse.js
```
*Actual Measured Scores:*
- **Home**: Performance 100 | Accessibility 100 | Best Practices 100 | SEO 100
- **404**: Performance 100 | Accessibility 100 | Best Practices 96 | SEO 100
- **Transformer**: Performance 98 | Accessibility 100 | Best Practices 100 | SEO 100
- **Harness**: Performance 100 | Accessibility 96 | Best Practices 100 | SEO 100
- **Roofline**: Performance 100 | Accessibility 100 | Best Practices 100 | SEO 100

### 5. Responsive & Multi-Viewport Suite (`tests/run_responsive.js`)
Tests layout stability, detects horizontal scrolling (`scrollWidth > clientWidth`), verifies 0 browser console errors, and captures full-page visual screenshots at 360px, 768px, and 1280px widths:
```bash
node tests/run_responsive.js
```
Full screenshots are saved in `tests/screens/`.

---

## Deployment

The repository includes a GitHub Pages workflow at `.github/workflows/pages.yml`. Pushes to `main` automatically publish the repository root directly to GitHub Pages.

---

## Credits & Sources

- **Metaphors & Explanations**: Dhaba kitchens, Mumbai local trains, Royal Enfield motorcycle mechanics, and Indian mandi trading systems.
- **Empirical Experiments**: Measured attention scaling and RNN Jacobian gradients; Pi 1.5.2 and Hermes Agent 0.19.0 token character overheads; Intel Xeon single-core and NVIDIA Tesla T4 arithmetic intensity benchmarks.
- **Orchestration**: Built with Google Antigravity.
