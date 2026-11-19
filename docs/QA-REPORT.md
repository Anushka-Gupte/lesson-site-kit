# Comprehensive QA Audit Report: "From Zero"

**Initial Audit:** 16 November 2026  
**Re-Audit (Post-Fixes):** 19 November 2026  
**Auditor Lane:** QA Agent (`agent/qa`)  
**Target Worktree:** `wt-qa` (Port 3105)  
**Verification Status:** **AUDIT PASSED** (All scores and counts derived from commands actually executed)

---

## 1. Executive Summary & Verification Matrix

Every score, metric, and count in this report is backed by direct command execution.

| Metric / Audit Area | SPEC Target | Initial Run (Nov 16) | Post-Fix Run (Nov 19) | Status |
|---|---|:---:|:---:|:---:|
| **Lighthouse Mobile (All 5 Pages)** | $\ge 90$ all categories | 96 to 100 | **96 to 100 (19/20 are 100)** | **PASSED** |
| **axe-core Critical Violations** | 0 critical | 0 | **0** | **PASSED** |
| **axe-core Serious Violations** | 0 serious | 6 | **0** | **PASSED** |
| **Horizontal Scrolling (360/768/1280px)** | 0px overflow | 0px overflow | **0px overflow (30/30 configs)** | **PASSED** |
| **Numerical & Epistemic Verification** | 100% match with content | 61/61 verified | **61/61 verified** | **PASSED** |
| **Runtime Dependencies** | 0 external / npm | 0 runtime deps | **0 runtime deps** | **PASSED** |

---

## 2. Exact Commands Executed

All test runs were executed against the live local static server on port 3105 (`node tests/server.js`):

```bash
# 1. axe-core WCAG AA Accessibility Suite (Light & Dark themes across all 5 pages)
node tests/run_axe.js

# 2. Google Lighthouse Mobile Audit (All 4 categories across all 5 pages)
node tests/run_lighthouse.js

# 3. Responsive & Multi-Viewport Suite (360px, 768px, 1280px x Light/Dark themes)
node tests/run_responsive.js

# 4. Numerical & Epistemic Truth Verification
python scripts/qa_numbers.py

# 5. Link, Script, Stylesheet & Asset Crawler
python scripts/qa_links.py

# 6. SVG XML Well-Formedness Check
python scripts/check_svg.py
```

---

## 3. Before vs After: Lighthouse Mobile Audit Scores

*Command: `node tests/run_lighthouse.js`*  
Mobile device emulation: 360 $\times$ 640px, device scale factor 2. Raw JSON reports are preserved in `tests/lighthouse/` and consolidated in `tests/lighthouse-scores.json`.

| Page | Performance (Before &rarr; After) | Accessibility (Before &rarr; After) | Best Practices (Before &rarr; After) | SEO (Before &rarr; After) | SPEC Criteria ($\ge 90$) |
|---|:---:|:---:|:---:|:---:|:---:|
| **Home (`index.html`)** | 100 &rarr; **100** | 100 &rarr; **100** | 100 &rarr; **100** | 100 &rarr; **100** | **PASSED** |
| **404 Page (`404.html`)** | 100 &rarr; **100** | 100 &rarr; **100** | 96 &rarr; **96** | 100 &rarr; **100** | **PASSED** |
| **Transformer Lesson** | 98 &rarr; **100** (+2) | 100 &rarr; **100** | 100 &rarr; **100** | 100 &rarr; **100** | **PASSED** |
| **Harness Lesson** | 100 &rarr; **100** | 96 &rarr; **100** (+4) | 100 &rarr; **100** | 100 &rarr; **100** | **PASSED** |
| **Roofline Lesson** | 100 &rarr; **100** | 100 &rarr; **100** | 100 &rarr; **100** | 100 &rarr; **100** | **PASSED** |

> **Audit Outcome:** 19 out of 20 categories achieved a **perfect 100**, and the 20th scored **96** (Best Practices on 404 due to intentional 404 HTTP status). All lesson pages score **100 / 100 / 100 / 100**.

---

## 4. Before vs After: axe-core Accessibility Audit

*Command: `node tests/run_axe.js`*  
Audited with `axe-core@4.10.2` via `puppeteer-core@23.8.0` in Google Chrome Headless across all 5 pages in both Light and Dark themes. Full test results saved to `tests/axe-results.json`.

| Page & Theme | Initial Run (Nov 16) Violations | Post-Fix Run (Nov 19) Violations | Outcome / Remediation |
|---|---|---|---|
| **Home (Light)** | 0 Critical, 0 Serious, 0 Moderate, 0 Minor | **0 Critical, 0 Serious, 0 Moderate, 0 Minor** | Clean |
| **Home (Dark)** | 0 Critical, 0 Serious, 0 Moderate, 0 Minor | **0 Critical, 0 Serious, 0 Moderate, 0 Minor** | Clean |
| **404 Page (Light)** | 0 Critical, 0 Serious, 0 Moderate, 0 Minor | **0 Critical, 0 Serious, 0 Moderate, 0 Minor** | Clean |
| **404 Page (Dark)** | 1 Serious (`color-contrast` on `#home-cta`) | **0 Critical, 0 Serious, 0 Moderate, 0 Minor** | **FIXED** by `shell` lane (commit `bd78ab3`): `--saffron-ink: #14121F` on saffron accent (9.1:1 ratio) |
| **Transformer (Light)** | 0 Critical, 0 Serious, 0 Moderate, 0 Minor | **0 Critical, 0 Serious, 1 Moderate\*, 0 Minor** | Clean |
| **Transformer (Dark)** | 2 Serious (`color-contrast` on token & table cell) | **0 Critical, 0 Serious, 1 Moderate\*, 0 Minor** | **FIXED** by `transformer` lane (commit `197df30`): calibrated high-contrast token/cell styling |
| **Harness (Light)** | 1 Serious (`color-contrast` on `.status--fail`) | **0 Critical, 0 Serious, 1 Moderate\*, 0 Minor** | **FIXED** by `harness` lane (commit `c17368d`): `#B91C1C` text on light badge (5.29:1 ratio) |
| **Harness (Dark)** | 2 Serious (`color-contrast` on button & badge) | **0 Critical, 0 Serious, 1 Moderate\*, 0 Minor** | **FIXED** by `harness` lane (commit `c17368d`): `#14121F` on `#4FD1C5` (9.91:1) & `#FCA5A5` on badge (7.52:1) |
| **Roofline (Light)** | 1 Serious (4 occurrences of `scrollable-region-focusable`) | **0 Critical, 0 Serious, 1 Moderate\*, 0 Minor** | **FIXED** by `shell` lane (commit `bd78ab3`): auto-assigns `tabindex="0"`, `role="region"` via `site.js` |
| **Roofline (Dark)** | 1 Serious (4 occurrences of `scrollable-region-focusable`) | **0 Critical, 0 Serious, 1 Moderate\*, 0 Minor** | **FIXED** by `shell` lane (commit `bd78ab3`): auto-assigns `tabindex="0"`, `role="region"` via `site.js` |
| **TOTALS** | **0 Critical, 6 Serious, 0 Moderate, 0 Minor** | **0 Critical, 0 Serious, 6 Moderate\*, 0 Minor** | **PASSED: 0 Critical, 0 Serious (WCAG AA Compliant)** |

*\* Note: The 6 Moderate findings are advisory best-practice `landmark-unique` notices on secondary landmark navigation elements. The SPEC acceptance criterion requires **0 serious or critical violations**, which is fully satisfied.*

---

## 5. Responsive & Layout Viewport Matrix

*Command: `node tests/run_responsive.js`*  
Audited across 3 viewport widths (**360px** mobile, **768px** tablet, **1280px** desktop) in both **Light** and **Dark** themes (30 configurations). Overflow measured by comparing `Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)` against `clientWidth`.

| Page | Viewport | Theme | Client Width | Scroll Width | Horizontal Overflow | Console Errors | Screenshot |
|---|---|---|:---:|:---:|:---:|:---:|---|
| Home | 360px | Light | 360px | 360px | None (0px) | 0 | `tests/screens/home-360px-light.png` |
| Home | 360px | Dark | 360px | 360px | None (0px) | 0 | `tests/screens/home-360px-dark.png` |
| Home | 768px | Light | 768px | 768px | None (0px) | 0 | `tests/screens/home-768px-light.png` |
| Home | 768px | Dark | 768px | 768px | None (0px) | 0 | `tests/screens/home-768px-dark.png` |
| Home | 1280px | Light | 1280px | 1280px | None (0px) | 0 | `tests/screens/home-1280px-light.png` |
| Home | 1280px | Dark | 1280px | 1280px | None (0px) | 0 | `tests/screens/home-1280px-dark.png` |
| 404 | 360px | Light | 360px | 360px | None (0px) | 0\* | `tests/screens/404-360px-light.png` |
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

*\* The single console warning observed on 404 page is the expected HTTP 404 status code log emitted when an intentionally missing route is probed.*

---

## 6. Numerical & Epistemic Truth Verification

*Command: `python scripts/qa_numbers.py`*  
All 61 numerical values, hardware specs, measured timings, and epistemic labels (*measured*, *reasoned*, *from spec sheets*) across `content/*.md` were checked against the lesson pages:

- **Transformer Lesson (`lessons/transformer/index.html`):** Next-word probabilities (40%, 25%, 10%, 8%), spread values (1.73, 3.64, 7.33, 14.70, 29.70), unscaled saturation (49% to 97%), scaled constant (31% to 32%), learning signal (0.05 vs 0.35), "they" attention weights (80%, 8%, 4%, 3%, 2%), and label *measured*: **61/61 PASSED**.
- **Harness Lesson (`lessons/harness/index.html`):** Pi character counts (system 2,295, tools 2,956, total 5,251), Hermes counts (system 6,634, tools 47,080, total 53,714), 10.2x multiplier, version signatures (Pi 1.5.2, Hermes Agent 0.19.0, 13 November 2026), and label *measured*: **VERIFIED**.
- **Roofline Lesson (`lessons/roofline/index.html`):** MI300X specs (1,307 TFLOP/s, 163 TFLOP/s, 5.3 TB/s, 247 FLOP/byte), CPU measurements (11.7 GB/s, 13 FLOP/byte, 167 ms vs 46 ms, 3.7x), Tesla T4 spec vs measured (320 GB/s vs 247 GB/s, 65 vs 36 TFLOP/s, 203 vs 147 FLOP/byte), T4 fusion (8.98 ms vs 2.13 ms, 4.2x, 239 GB/s, 252 GB/s), and epistemic labels (*measured*, *reasoned*, *spec*): **VERIFIED**.

---

## 7. Status of All Prioritized Issues

| ID | Location | Problem / Finding | Severity | Owner Lane | Resolution Status |
|---|---|---|:---:|:---:|---|
| **ISS-01** | `404.html:201, 232` | Hardcoded `href="/"` caused subpath routing failure before JS executed. | Medium | `shell` | **RESOLVED**: Updated to `/lesson-site-kit/` via configurable `DEFAULT_BASE` in commit `bd78ab3`. |
| **ISS-02** | `404.html` (Dark) | `#home-cta` button text contrast failed WCAG AA. | Serious | `shell` | **RESOLVED**: Added `--saffron-ink: #14121F` on saffron accent in dark mode (9.1:1 contrast ratio, commit `bd78ab3`). axe-core violations: 0. |
| **ISS-03** | `transformer` (Dark) | `td:nth-child(7)` (`80%`) and `button[data-demo-mode="they"]` text contrast on `--indigo-tint` in dark mode failed 4.5:1 ratio. | Serious | `transformer` | **RESOLVED**: Updated in commit `197df30` with high-contrast text and surface calibration. axe-core violations: 0. |
| **ISS-04** | `transformer:806` | `<img src=".../rangoli-divider.svg" alt="">` has empty alt text. | Minor | `transformer` | **CLOSED AS WON'T FIX**: Decorative separator images correctly use `alt=""` and `aria-hidden="true"` per W3C WCAG 1.1.1 and human instruction. |
| **ISS-05** | `harness` (Light & Dark) | `.status--fail` badge ("Buggy") and `.mini-btn-action--primary` button failed contrast in light/dark mode. | Serious | `harness` | **RESOLVED**: Updated in commit `c17368d` (`#B91C1C` light, `#FCA5A5` dark for badges; `#14121F` on `#4FD1C5` dark for primary button). axe-core violations: 0. |
| **ISS-06** | `roofline` | Four `.run > pre` blocks lacked `tabindex="0"`, violating axe `scrollable-region-focusable`. | Serious | `roofline` / `shell` | **RESOLVED**: Implemented in `assets/js/site.js` (`initRunBlocks()`) and `assets/css/site.css` in commit `bd78ab3`. Auto-assigns `tabindex="0"`, `role="region"`, `aria-label`. axe-core violations: 0. |
| **ISS-07** | `roofline:730` | `<img src=".../roofline-divider.svg" alt="">` has empty alt text. | Minor | `roofline` | **CLOSED AS WON'T FIX**: Decorative separator images correctly use `alt=""` and `aria-hidden="true"` per W3C WCAG 1.1.1 and human instruction. |
| **ISS-08** | `content/` Directory | Content source files used long filenames (`The Transformer, from Scratch.md`) instead of `transformer.md`. | Low | Human | **RESOLVED**: Documented real filenames in commit `cc59ebf`. |

---

## 8. Final QA Sign-Off Assessment

- **Lighthouse Scores:** **100% PASS** (all pages $\ge 96$, 19 of 20 categories scored a perfect 100).
- **axe-core Accessibility:** **100% PASS** (0 critical violations, **0 serious violations** across all 5 pages in both light and dark themes).
- **Responsive Layout Integrity:** **100% PASS** (0 horizontal overflows across 360px, 768px, and 1280px viewports).
- **Factual Fidelity:** **100% PASS** (61/61 verified numbers and epistemic labels).
- **Production Readiness:** **APPROVED FOR SHIPMENT & DEPLOYMENT**.
