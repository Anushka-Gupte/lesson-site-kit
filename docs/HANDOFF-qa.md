# Handoff: QA Lane (Phase 3)

**Agent:** QA Agent  
**Branch:** `agent/qa`  
**Worktree:** `wt-qa` (Port 3105)  
**Deliverables Completed:** All 7 items from `prompts/04_qa.md`

---

## 1. What Was Built

1. **`scripts/qa_links.py`**: Automated static link, stylesheet, script, and image crawler. Verifies internal relative links, anchor fragments, image presence, and checks for empty or missing alt text. Exits 0 on clean crawl.
2. **`scripts/qa_numbers.py`**: Quantitative and epistemic truth verifier. Extracts numbers and formulas from `content/*.md` "measured", "reasoned", and "spec" tables, checking that they appear unchanged on the lesson pages and verifying epistemic labels.
3. **`tests/run_axe.js` & axe-core suite**: Headless Chrome test runner injecting `axe-core@4.10.2` across all five pages in both light and dark themes. Captures all WCAG 2.0 / 2.1 AA violations and saves structured findings into `tests/axe-results.json`.
4. **`tests/run_lighthouse.js` & Lighthouse suite**: Mobile Lighthouse test suite executing across all five pages, measuring Performance, Accessibility, Best Practices, and SEO. Generates `tests/lighthouse-scores.json` and detailed audits in `tests/lighthouse/`.
5. **`tests/run_responsive.js` & Screenshot Suite**: Multi-viewport test runner checking 360px, 768px, and 1280px widths across light and dark themes (30 configurations). Verifies zero horizontal overflow (`scrollWidth > clientWidth`) and captures 30 visual screenshots in `tests/screens/`.
6. **`.github/workflows/pages.yml`**: GitHub Actions workflow deploying the repository root to GitHub Pages on push to `main`.
7. **`README.md`**: User-facing documentation explaining what "From Zero" is, local preview instructions (`python -m http.server 3105`), the multi-agent architecture, test suite commands, and project credits.
8. **`docs/QA-REPORT.md`**: Comprehensive quality report detailing measured Lighthouse scores, axe-core findings, responsive layout matrix, and an actionable prioritized issue table.

---

## 2. Files Touched

All created and modified files reside strictly within QA ownership (`ownership.json`):

- `scripts/qa_links.py`
- `scripts/qa_numbers.py`
- `.github/workflows/pages.yml`
- `tests/package.json`
- `tests/package-lock.json`
- `tests/server.js`
- `tests/run_axe.js`
- `tests/run_responsive.js`
- `tests/run_lighthouse.js`
- `tests/axe-results.json`
- `tests/responsive-results.json`
- `tests/lighthouse-scores.json`
- `tests/lighthouse/*.json` (5 report files)
- `tests/screens/*.png` (30 screenshots)
- `README.md`
- `docs/QA-REPORT.md`
- `docs/HANDOFF-qa.md`

---

## 3. Key Decisions

- **Zero Runtime Dependencies**: All Node test dependencies (`lighthouse`, `axe-core`, `puppeteer-core`) reside exclusively inside `tests/package.json`. No `package.json` or `node_modules` was added to the repository root.
- **Port Discipline**: All preview and automated test suites bind strictly to port **3105**, using `tests/server.js` or `python -m http.server 3105`.
- **System Chrome Integration**: Used system Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`) via `puppeteer-core`, eliminating bulky Chromium binary downloads.
- **Strict Lane Adherence**: Per `AGENTS.md` Rule 1, QA did not modify any files belonging to other lanes (`shell`, `transformer`, `harness`, `roofline`). All discovered issues were logged in `docs/QA-REPORT.md` for human review.

---

## 4. Discovered Issues & Requests from Other Lanes

The following issues were uncovered by our automated test suites and are logged in `docs/QA-REPORT.md` for owner remediation:

1. **`shell` lane**:
   - `404.html:199, 230`: Replace hardcoded `href="/"` with `href="./"` or a relative fallback.
   - `404.html` (Dark mode): Fix `#home-cta` button contrast ratio (currently fails WCAG AA).
2. **`transformer` lane**:
   - `lessons/transformer/index.html` (Dark mode): Improve text contrast on active attention token `button[data-demo-mode="they"]` and highlighted `td:nth-child(7)` (80% cell).
   - `lessons/transformer/index.html:806`: Add descriptive alt text to `rangoli-divider.svg` instead of `alt=""`.
3. **`harness` lane**:
   - `lessons/harness/index.html`: Fix text contrast on `.status--fail` badge (in both light and dark mode) and `.mini-btn-action--primary` (dark mode).
4. **`roofline` lane**:
   - `lessons/roofline/index.html`: Add `tabindex="0"` to the four `<pre>` blocks inside `.run` so keyboard users can scroll through code lines horizontally.
   - `lessons/roofline/index.html:730`: Add descriptive alt text to `roofline-divider.svg` instead of `alt=""`.

---

## 5. Verification Commands & Proof

All verification checks were run and validated:

```bash
# Verify SVG well-formedness
python scripts/check_svg.py
# Output: 16 svg files checked, 0 broken

# Verify links and images
python scripts/qa_links.py
# Output: 0 broken internal links, 0 missing images, all assets found

# Verify quantitative truth against content
python scripts/qa_numbers.py
# Output: 61/61 checks passed. ALL MEASURED AND SPEC NUMBERS VERIFIED UNCHANGED

# Verify mobile Lighthouse scores
node tests/run_lighthouse.js
# Output:
# Home:        Perf 100 | A11y 100 | BestPractices 100 | SEO 100
# 404:         Perf 100 | A11y 100 | BestPractices  96 | SEO 100
# Transformer: Perf  98 | A11y 100 | BestPractices 100 | SEO 100
# Harness:     Perf 100 | A11y  96 | BestPractices 100 | SEO 100
# Roofline:    Perf 100 | A11y 100 | BestPractices 100 | SEO 100

# Verify responsive layout & captures
node tests/run_responsive.js
# Output: 30 configurations checked, 0 horizontal overflows detected
```

---

## 6. Next Steps for Human

1. Review `docs/QA-REPORT.md` and the 30 visual screenshots in `tests/screens/`.
2. Direct the minor fixes in `shell`, `transformer`, `harness`, and `roofline` to resolve the color-contrast and keyboard scroll items.
3. Merge `agent/qa` into `main` after verifying `python scripts/check_ownership.py qa agent/qa`.
4. Deploy to GitHub Pages via `.github/workflows/pages.yml`.
