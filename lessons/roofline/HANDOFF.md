# Handoff Report: ROOFLINE Lesson (`lessons/roofline/`)

**Agent:** Roofline  
**Worktree:** `../wt-roofline`  
**Branch:** `agent/roofline`  
**Port:** 3104  
**Date:** 16 November 2026  

---

## 1. What Was Built

In accordance with `SPEC.md`, `AGENTS.md`, and `prompts/03_roofline.md`, the complete standalone lesson on the GPU Roofline Plot has been authored from first principles:

1. **Complete Lesson Page (`lessons/roofline/index.html`)**:
   - Structured in the exact story order from `content/The GPU Roofline Plot, from Scratch.md`:
     1. *A Kitchen with Two Bottlenecks*: opening 1,300 vs. 0.9 TFLOP/s puzzle; Dhaba kitchen metaphor (cook, helper, mandi, salad vs. biryani).
     2. *The Two Limits of a GPU*: peak compute $P$ and memory bandwidth $B$; AMD Instinct MI300X spec sheet table; hardware ratio of 247; vector units footnote.
     3. *Arithmetic Intensity: Chops per Kilo*: definition formula callout; worked comparisons for vector addition ($0.17$) and $4096 \times 4096$ matrix multiplication ($1,365$).
     4. *Deriving the Roofline from Scratch*: 4-line derivation ($\min(P, B \times I)$); log-log coordinate axes explanation; **5-step interactive stepper**.
     5. *Real Examples on the MI300X*: 4-operation table; chatbot single-token bottleneck ($16\text{ GB}$ weights $\to 330$ tok/s wall vs. $82,000$ tok/s compute); Mumbai BEST bus batching fix; prefill vs. decode analysis; KV cache caveat; chip ridge comparisons.
     6. *Interactive Roofline Explorer*: live interactive tool with presets, log sliders, and dynamic arithmetic readout.
     7. *Why Fusion and FlashAttention Help So Much*: memory round-trip reduction; FlashAttention SRAM tiling; decorative roofline divider.
     8. *I Measured My Own Roofline*: single-core Intel Xeon benchmark results ($11.7\text{ GB/s}$, $150\text{ GFLOP/s}$, ridge $13$, dial $k=1\dots 256$, fusion $3.7\times$); Colab Tesla T4 benchmark results ($247\text{ GB/s}$, $36\text{ TFLOP/s}$, ridge $147$, matmul sweep, fusion $4.2\times$); both measured PNG plots embedded in `.callout--measured`.
     9. *The Whole Thing in Plain Words*: 7 numbered takeaway cards.
     10. *Check Your Understanding*: 6 interactive Q&A disclosures (`<details class="qa">`) answering key presenter questions.
     11. *Run It Yourself (Reproduce It)*: full Python scripts `roofline_cpu.py` and `roofline_gpu_colab.py` inside `.run` blocks with one-click copy buttons (`[data-copy]`).
     12. *References & Methodology*: transparent accounting of what was measured vs. from spec sheets vs. reasoned; citations to Williams et al., Horace He, and AMD ROCm docs.
     13. *Navigation Strip*: accessible `.prevnext` linking back to Harness (`../../lessons/harness/`) and forward to Home (`../../index.html`).

2. **5-Step Interactive Stepper (`[data-stepper]`)**:
   - Integrated into Section 4, powered by `assets/js/site.js`.
   - SVG stage (`viewBox="0 0 700 420"`) with cumulative layers:
     - Step 1: Log-log axes and decade tick marks.
     - Step 2: Memory diagonal line ($5.3 \times I$) with slope 1.
     - Step 3: Flat peak compute ceiling at $1,307\text{ TFLOP/s}$.
     - Step 4: Ridge point marker ($I \approx 247$) with vertical line and region shading.
     - Step 5: The four example operations plotted on the roofline.
   - Synchronized ARIA live text panel and accessible forward/back buttons.

3. **Interactive Roofline Explorer (`lessons/roofline/lesson.js` & `lesson.css`)**:
   - Log-scale sliders for Peak Compute ($50\text{ GFLOP/s}$ to $3,000\text{ TFLOP/s}$) and Memory Bandwidth ($5\text{ GB/s}$ to $10\text{ TB/s}$).
   - Three quick chip presets:
     - *AMD Instinct MI300X (Spec Sheet, BF16)*: $1,307\text{ TFLOP/s}$, $5.3\text{ TB/s}$, Ridge $\approx 247\text{ FLOP/B}$.
     - *Tesla T4 (Measured, FP16)*: $36\text{ TFLOP/s}$, $247\text{ GB/s}$, Ridge $\approx 147\text{ FLOP/B}$.
     - *Intel CPU 1-core (Measured, FP32)*: $150\text{ GFLOP/s}$, $11.7\text{ GB/s}$, Ridge $\approx 13\text{ FLOP/B}$.
   - Live SVG canvas showing dynamic repositioning of the sloped bandwidth roof, flat compute ceiling, vertical ridge line, "Waiting on memory" vs. "Using whole chip" shaded regions, and the 4 benchmark operations moving along the roof.
   - Live calculation cards displaying $\text{Speed} = \min(P, B \times I)$, operational state, and share of peak compute.
   - Fully keyboard-operable with visible focus rings.

4. **Vector Imagery (`assets/img/roofline/`)**:
   - `hero-roofline.svg` ($1600 \times 900$): architectural roofline plot with log grid, dhaba and mandi motifs, and saffron accents. Generously spaced cards and labels with zero overlapping lines, text, or borders.
   - `dhaba-kitchen.svg` ($800 \times 450$): hardware metaphor illustrating the Sabzi Mandi (memory), the helper's road (bandwidth), the Dhaba kitchen (compute), and the salad vs. dum biryani recipe comparison.
   - `roofline-divider.svg` ($1200 \times 60$): repeating geometric roofline motif.
   - All SVGs strictly validated as clean XML with no HTML named entities.

---

## 2. Files Touched and Created

All files are strictly within paths owned by `roofline` in `ownership.json`:

```
lessons/roofline/
  ├── index.html                     (Main lesson page)
  ├── lesson.css                     (Scoped custom explorer styles)
  ├── lesson.js                      (Explorer interaction logic)
  └── HANDOFF.md                     (This report)

assets/img/roofline/
  ├── hero-roofline.svg              (1600x900 editorial hero SVG)
  ├── dhaba-kitchen.svg              (800x450 metaphor illustration SVG)
  ├── roofline-divider.svg           (1200x60 pattern divider SVG)
  ├── roofline_cpu_measured.png      (Copied from provided/images/)
  └── roofline_t4_measured.png       (Copied from provided/images/)
```

---

## 3. Decisions and Architecture

1. **Content Integrity**: All numbers, formulas, and labels (*measured*, *reasoned*, *spec sheet*) match `content/The GPU Roofline Plot, from Scratch.md` with complete precision. No numbers or benchmark claims were invented.
2. **Indian Metaphors**: Retained the Dhaba kitchen (cook, helper, sabzi mandi, salad vs. dum biryani) and the Mumbai BEST double-decker bus metaphor for transformer batching.
3. **Zero Runtime Dependencies**: No npm packages, external frameworks, CDNs, or remote fonts. Fonts rely on local/system stacks.
4. **Accessibility (WCAG AA)**:
   - Exactly one `h1` per page.
   - Skip link to `#main`.
   - Semantic landmarks (`<header>`, `<nav>`, `<main>`, `<section>`, `<aside>`, `<footer>`).
   - Every `<img>` tag has informative alt text explaining what it teaches; decorative divider has `aria-hidden="true"`.
   - Contrast checked: `--saffron` (`#9A5205` / `#F4A62A`) meets WCAG AA contrast against backgrounds.
   - All interactive controls have visible focus rings and ARIA labels.
5. **Scoped CSS**: All custom styles reside in `lessons/roofline/lesson.css` under the `.lesson--roofline` scope, leaving global `assets/css/site.css` untouched.

---

## 4. Anything Not Done / Out of Scope

- **Physical MI300X execution**: As noted in `content/The GPU Roofline Plot, from Scratch.md` and SPEC.md, MI300X numbers are derived from manufacturer spec sheets and theoretical roofline bounds; no actual run was performed on physical MI300X hardware.
- **T4 Thermal Root Cause**: The benchmark notes a drop in throughput for $N=4096$ and $8192$ on the Tesla T4 card; the thermal throttling hypothesis is noted as reasoned rather than hardware-probed.

---

## 5. Needs from Another Lane

- None. The global shell components (`site.css`, `site.js`, brand icons) from Phase 1 are integrated and functioning. Ready for the QA agent's Phase 3 test suite.

---

## 6. Verification and Validation Results

- **SVG XML Validity**:
  - Command: `python scripts/check_svg.py`
  - Result: `8 svg files checked, 0 broken` (Exit code 0).
- **Ownership Verification**:
  - Script: `check_own.py`
  - Result: 100% of files inside `lessons/roofline/**` or `assets/img/roofline/**`. No files touched outside roofline ownership.
- **HTML Contract Validation**:
  - Exactly 1 `<h1>`: "The GPU Roofline Plot, from Scratch"
  - Unique `<meta name="description">` length: 154 characters (< 160 char limit).
  - Stepper JSON: 5 valid steps matching all cumulative SVG layers.
  - Internal Anchor Links: 14 anchor links, all 14 resolve to valid IDs in the document.
  - Asset Paths: All referenced relative assets in `assets/` exist on disk.
  - Image Alt Text: All non-decorative images have descriptive educational alt text.
- **JavaScript Syntax Check**:
  - Command: `node -c lessons/roofline/lesson.js`
  - Result: Zero syntax errors (Exit code 0).
