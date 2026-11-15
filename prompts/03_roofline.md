# Agent: ROOFLINE lesson. Phase 2, parallel.
Worktree `../wt-roofline`, branch `agent/roofline`, port 3104. Handoff: `lessons/roofline/HANDOFF.md`.
Start only after the shell agent has been merged. Read `SPEC.md`, `AGENTS.md`, `docs/design-system.html`.

## Mission
Turn `content/roofline.md` into `lessons/roofline/index.html`, centred on an interactive roofline that a beginner can play with.

## You own
`lessons/roofline/**`, `assets/img/roofline/**`. Scoped extras in `lesson.css` and `lesson.js`.

## Deliverables
1. The page in the content file order: the puzzle, the dhaba kitchen, the two limits, arithmetic intensity, deriving the roofline, real examples, fusion, my own measurements.
2. **5-step roofline stepper:** axes, memory diagonal, compute roof, ridge, four example operations, on log-log axes. Use the MI300X numbers from the content file.
3. **The interactive explorer:** inline SVG with sliders for peak compute and bandwidth (log-scaled), chip presets (MI300X; Tesla T4 *measured*; my CPU *measured*), live ridge point and "waiting on memory / using the whole chip" shading, and the four example operations moving as the sliders move. Show the arithmetic live: `speed = min(peak, bandwidth x intensity)`. Keyboard-operable.
4. **Measured results:** `provided/images/roofline_cpu_measured.png` and `roofline_t4_measured.png` with captions and the results tables from the content file, as `.callout--measured`. Keep the content file labels about what was measured and what was reasoned. Do not claim the MI300X numbers were measured.
5. "Run it yourself": code from `provided/code/roofline_cpu.py` and `roofline_gpu_colab.py` with copy buttons.
6. **Imagery:** hero (1600x900) and inline SVGs in `assets/img/roofline/`: the dhaba kitchen with helper and cook, and a decorative roof-line pattern divider. Same shared style.

## Acceptance
Lighthouse mobile >= 90; 360px and 1280px clean; explorer math matches the content file (ridge = peak / bandwidth); every number traceable. Finish with `lessons/roofline/HANDOFF.md`, then stop.
