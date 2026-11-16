# Comprehensive QA Audit Report: "From Zero"

**Date of Audit:** 16 November 2026  
**Auditor Lane:** QA Agent (`agent/qa`)  
**Target Worktree:** `wt-qa` (Port 3105)  
**Verification Status:** **AUDIT COMPLETE** (All scores and data derived from actual command executions)

---

## 1. Executive Summary & SPEC Compliance Matrix

| Requirement | Target Criteria | Actual Measured Result | Status |
|---|---|---|---|
| **Lighthouse Mobile** | $\ge 90$ across all 4 categories on all 5 pages | **96 to 100** across all categories on all 5 pages | **PASSED** |
| **Horizontal Scrolling** | 0 overflow at 360px, 768px, 1280px | **0px overflow** across all 30 viewport configurations | **PASSED** |
| **Internal Links & Assets** | 0 broken internal links, all images exist | **0 broken links, 0 missing assets** (out of 97 links & 16 images) | **PASSED** |
| **Numerical Fidelity** | Numbers match `content/*.md` sources | **61/61 numbers and epistemic labels verified** | **PASSED** |
| **No Runtime Dependencies** | Zero npm / CDN dependencies at runtime | Pure HTML5, CSS custom properties, self-contained SVG | **PASSED** |
| **axe-core Accessibility** | 0 serious or critical violations | 0 critical violations; 6 serious issues identified across 4 pages | **ISSUES LOGGED** |
| **Visual Documentation** | Screenshots at 360px, 768px, 1280px | **30 screenshots generated** in `tests/screens/` | **PASSED** |

---

## 2. Test Environment & Commands Executed

Every result and metric recorded below is backed by reproducible commands executed in this repository:

- **Operating System:** Windows 11
- **Node.js:** `v22.16.0` | **npm:** `10.9.2`
- **Python:** `3.13.5`
- **Browser Engine:** Google Chrome Headless `133.0.6943.98` (`C:\Program Files\Google\Chrome\Application\chrome.exe`)
- **axe-core Engine:** `axe-core@4.10.2` via `puppeteer-core@23.8.0`
- **Lighthouse CLI / Engine:** `lighthouse@12.3.0` (Mobile emulation: 360x640, deviceScaleFactor 2)
- **Local Static Server:** Port 3105 (`node tests/server.js`)

### Exact Execution Commands
```bash
# 1. Links, Images & Alt-Text Crawler
python scripts/qa_links.py

# 2. Source Truth & Numerical Verification
python scripts/qa_numbers.py

# 3. SVG XML Well-Formedness Check
python scripts/check_svg.py

# 4. axe-core WCAG AA Accessibility Suite
node tests/run_axe.js

# 5. Multi-Viewport & Responsive Screenshot Suite
node tests/run_responsive.js

# 6. Lighthouse Mobile Audit
node tests/run_lighthouse.js
```

---

## 3. Lighthouse Mobile Audit Scores

Lighthouse was executed against all five pages using mobile device emulation. Raw JSON audit results are preserved in `tests/lighthouse/` and consolidated in `tests/lighthouse-scores.json`.

| Page | Path | Performance | Accessibility | Best Practices | SEO | SPEC Threshold ($\ge 90$) |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **Home** | `index.html` | **100** | **100** | **100** | **100** | **PASSED** |
| **404 Page** | `404.html` | **100** | **100** | **96** | **100** | **PASSED** |
| **Transformer** | `lessons/transformer/index.html` | **98** | **100** | **100** | **100** | **PASSED** |
| **Harness** | `lessons/harness/index.html` | **100** | **96** | **100** | **100** | **PASSED** |
| **Roofline** | `lessons/roofline/index.html` | **100** | **100** | **100** | **100** | **PASSED** |

> **Key Performance Note:** All five pages comfortably exceed the required 90-point threshold across every category. First Contentful Paint (FCP) and Largest Contentful Paint (LCP) are consistently under 0.8s due to zero external font requests, zero render-blocking frameworks, and self-hosted SVG assets.

---

## 4. Multi-Viewport & Responsive Layout Matrix

Audited across 3 viewport widths (**360px** mobile, **768px** tablet, **1280px** desktop) in both **Light** and **Dark** themes (30 configurations). Overflow was measured by comparing `Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)` against `clientWidth`.

| Page | Viewport | Theme | Client Width | Scroll Width | Horizontal Overflow | Console Errors | Screenshot |
|---|---|---|:---:|:---:|:---:|:---:|---|
| Home | 360px | Light | 360px | 360px | None (0px) | 0 | `tests/screens/home-360px-light.png` |
| Home | 360px | Dark | 360px | 360px | None (0px) | 0 | `tests/screens/home-360px-dark.png` |
| Home | 768px | Light | 768px | 768px | None (0px) | 0 | `tests/screens/home-768px-light.png` |
| Home | 768px | Dark | 768px | 768px | None (0px) | 0 | `tests/screens/home-768px-dark.png` |
| Home | 1280px | Light | 1280px | 1280px | None (0px) | 0 | `tests/screens/home-1280px-light.png` |
| Home | 1280px | Dark | 1280px | 1280px | None (0px) | 0 | `tests/screens/home-1280px-dark.png` |
| 404 | 360px | Light | 360px | 360px | None (0px) | 0* | `tests/screens/404-360px-light.png` |
| 404 | 360px | Dark | 360px | 360px | None (0px) | 0 | `tests/screens/404-360px-dark.png` |
| 404 | 768px | Light | 768px | 768px | None (0px) | 0 | `tests/screens/404-768px-light.png` |
| 404 | 768px | Dark | 768px | 768px | None (0px) | 0 | `tests/screens/404-768px-dark.png` |
| 404 | 1280px | Light | 1280px | 1280px | None (0px) | 0 | `tests/screens/404-1280px-light.png` |
| 404 | 1280px | Dark | 1280px | 1280px | None (0px) | 0 | `tests/screens/404-1280px-dark.png` |
| Transformer | 360px | Light | 360px | 360px | None (0px) | 0 | `tests/screens/transformer-360px-light.png` |
| Transformer | 360px | Dark | 360px | 360px | None (0px) | 0 | `tests/screens/transformer-360px-dark.png` |
| Transformer | 768px | Light | 768px | 768px | None (0px) | 0 | `tests/screens/transformer-768px-light.png` |
| Transformer | 768px | Dark | 768px | 768px | None (0px) | 0 | `tests/screens/transformer-768px-dark.png` |
| Transformer | 1280px | Light | 1280px | 1280px | None (0px) | 0 | `tests/screens/transformer-1280px-light.png` |
| Transformer | 1280px | Dark | 1280px | 1280px | None (0px) | 0 | `tests/screens/transformer-1280px-dark.png` |
| Harness | 360px | Light | 360px | 360px | None (0px) | 0 | `tests/screens/harness-360px-light.png` |
| Harness | 360px | Dark | 360px | 360px | None (0px) | 0 | `tests/screens/harness-360px-dark.png` |
| Harness | 768px | Light | 768px | 768px | None (0px) | 0 | `tests/screens/harness-768px-light.png` |
| Harness | 768px | Dark | 768px | 768px | None (0px) | 0 | `tests/screens/harness-768px-dark.png` |
| Harness | 1280px | Light | 1280px | 1280px | None (0px) | 0 | `tests/screens/harness-1280px-light.png` |
| Harness | 1280px | Dark | 1280px | 1280px | None (0px) | 0 | `tests/screens/harness-1280px-dark.png` |
| Roofline | 360px | Light | 360px | 360px | None (0px) | 0 | `tests/screens/roofline-360px-light.png` |
| Roofline | 360px | Dark | 360px | 360px | None (0px) | 0 | `tests/screens/roofline-360px-dark.png` |
| Roofline | 768px | Light | 768px | 768px | None (0px) | 0 | `tests/screens/roofline-768px-light.png` |
| Roofline | 768px | Dark | 768px | 768px | None (0px) | 0 | `tests/screens/roofline-768px-dark.png` |
| Roofline | 1280px | Light | 1280px | 1280px | None (0px) | 0 | `tests/screens/roofline-1280px-light.png` |
| Roofline | 1280px | Dark | 1280px | 1280px | None (0px) | 0 | `tests/screens/roofline-1280px-dark.png` |

*\* Note: The single console warning observed on 404 page was the expected HTTP status code log emitted when an intentionally missing route is probed.*

---

## 5. Numerical Fidelity & Epistemic Verification

Verified using `python scripts/qa_numbers.py`. 61 distinct data points and epistemic status labels were checked against `content/*.md`:

1. **Transformer Lesson (`lessons/transformer/index.html`):**
   - Next-word probability distribution (late 40%, delayed 25%, cancelled 10%, crowded 8%): **VERIFIED**.
   - Attention score spread scaling ($d=4 \to 1.73$, $d=16 \to 3.64$, $d=64 \to 7.33$, $d=256 \to 14.70$, $d=1024 \to 29.70$): **VERIFIED**.
   - Unscaled vs scaled gradient saturation (unscaled max share $49\% \to 97\%$, scaled constant $31\% \to 32\%$, gradient preservation $0.05$ vs $0.35$): **VERIFIED**.
   - "They" attention distribution (friend 80%, my 8%, today 4%, you 3%, How 2%): **VERIFIED**.
   - Epistemic label *Measured*: **VERIFIED**.

2. **Harness Lesson (`lessons/harness/index.html`):**
   - Pi prompt & tool fixed character counts (system 2,295 chars, 4 tools 2,956 chars, total fixed 5,251 chars): **VERIFIED**.
   - Hermes Agent character overheads (system 6,634 chars, 27 tools 47,080 chars, total fixed 53,714 chars): **VERIFIED**.
   - Comparative multiplier: Hermes fixed cost is ~10.2x of Pi: **VERIFIED**.
   - Experimental benchmark date and software versions: 13 November 2026, Pi 1.5.2, Hermes Agent 0.19.0: **VERIFIED**.
   - Epistemic label *Measured*: **VERIFIED**.

3. **Roofline Lesson (`lessons/roofline/index.html`):**
   - MI300X spec sheet: 1,307 TFLOP/s BF16 matrix, 163 TFLOP/s FP32 vector, 5.3 TB/s bandwidth, 247 FLOP/byte ridge: **VERIFIED**.
   - CPU single-core measured: 11.7 GB/s bandwidth, 13 FLOP/byte ridge, fusion speedup 167 ms vs 46 ms (3.7x): **VERIFIED**.
   - Tesla T4 spec vs measured: 320 GB/s vs 247 GB/s (77%), 65 TFLOP/s vs 36 TFLOP/s (56%), 203 vs 147 FLOP/byte: **VERIFIED**.
   - Tesla T4 fusion experiment: 8.98 ms vs 2.13 ms (4.2x speedup), 239 GB/s vs 252 GB/s memory bandwidth: **VERIFIED**.
   - Epistemic labels: *Measured*, *Reasoned, not measured*, *From spec sheets*: **VERIFIED**.

---

## 6. Detailed Table of Prioritized Issues

The table below outlines issues discovered during testing, their severity, the owner lane (as defined in `ownership.json`), and the exact recommended fix.

| ID | Page / Path | Problem / Finding | Severity | Owner Lane | Suggested Fix |
|---|---|---|:---:|:---:|---|
| **ISS-01** | `404.html:199, 230` | `<a class="brand" href="/">` and `<a class="btn" href="/">` point to root `/`. While an inline client script attempts runtime fallback, static anchors fail if served under a GitHub Pages subpath before JS executes. | **Medium** | `shell` | Change `href="/"` to `href="./"` or provide a resilient relative anchor fallback. |
| **ISS-02** | `404.html` (Dark Theme) | `#home-cta` button text contrast fails WCAG AA in dark theme (`color: var(--ink)` on dark background button). | **Serious** | `shell` | Ensure `.error-card .btn` in dark mode uses high-contrast text (`color: #14121F` on `--saffron` or explicit `#FFFFFF` with adequate contrast). |
| **ISS-03** | `lessons/transformer/index.html` (Dark) | `td:nth-child(7)` (`80%`) and `button[data-demo-mode="they"]` text contrast on `--indigo-tint` in dark mode fails 4.5:1 ratio. | **Serious** | `transformer` | In dark mode, ensure active tokens and highlighted table cells use `--surface` or adjust text color to `#F3EFE8` over dark indigo tints. |
| **ISS-04** | `lessons/transformer/index.html:806` | `<img src=".../rangoli-divider.svg" alt="">` has empty alt attribute. SPEC rule 45 requires all images to explain what they teach. | **Minor** | `transformer` | Update `alt=""` to `alt="Rangoli geometric section divider pattern"`. |
| **ISS-05** | `lessons/harness/index.html` (Light & Dark) | `.status--fail` badge ("Buggy") has insufficient contrast against its background in light and dark mode; `.mini-btn-action--primary` fails contrast in dark mode. | **Serious** | `harness` | Darken text color on `.status--fail` in light mode (e.g. `#8B1C1C` on red tint) and adjust `.mini-btn-action--primary` text color in dark mode to ensure $\ge 4.5:1$. |
| **ISS-06** | `lessons/roofline/index.html` (Light & Dark) | Four `.run > pre` blocks are scrollable horizontally but do not possess `tabindex="0"`, violating axe-core `scrollable-region-focusable`. | **Serious** | `roofline` | Add `tabindex="0"` to each `<pre>` inside `.run` so keyboard users can navigate code lines. |
| **ISS-07** | `lessons/roofline/index.html:730` | `<img src=".../roofline-divider.svg" alt="">` has empty alt attribute. | **Minor** | `roofline` | Change `alt=""` to `alt="Decorative roofline boundary divider pattern"`. |
| **ISS-08** | `content/` Directory | Content source files were committed as `The Transformer, from Scratch.md`, etc., instead of the filenames documented in `content/README.md` (`transformer.md`, `harness.md`, `roofline.md`). | **Low** | `Human / Phase 0` | Maintain aliases or add symbolic links/copies for both filename conventions. |

---

## 7. QA Sign-Off Assessment

- **Lighthouse Performance, SEO, and Best Practices:** **READY FOR DEPLOYMENT** (all pages $\ge 96$).
- **Responsive Layout & Visual Integrity:** **READY FOR DEPLOYMENT** (0 horizontal overflow, responsive navigation verified).
- **Factual Fidelity:** **READY FOR DEPLOYMENT** (all numbers match empirical sources).
- **Accessibility:** 6 serious color-contrast and keyboard focus issues are cataloged above for owner lane remediation prior to final release.
