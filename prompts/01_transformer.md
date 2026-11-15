# Agent: TRANSFORMER lesson. Phase 2, parallel.
Worktree `../wt-transformer`, branch `agent/transformer`, port 3102. Handoff: `lessons/transformer/HANDOFF.md`.
Start only after the shell agent has been merged into `main`. Read `SPEC.md`, `AGENTS.md`, and `docs/design-system.html` (copy the real markup from it).

## Mission
Turn `content/transformer.md` into `lessons/transformer/index.html`: a lesson that makes a total beginner understand how a transformer predicts the next word, with real figures and a stepper that replaces the whiteboard.

## You own
`lessons/transformer/**`, `assets/img/transformer/**`. Scoped extras go in `lessons/transformer/lesson.css` and `lesson.js`.

## Deliverables
1. The page, in the story order of the content file: the keyboard hook, why RNNs and LSTMs struggled (include the measured RNN table), attention, the 2017 leap, then the nine build steps.
2. **The 9-step stepper** (SPEC section 6): inline SVG, bottom to top, example "Local trains are often ...", exactly the step order in the content file. Use token IDs and percentages as labelled "made up for illustration".
3. **"Who does *they* look at?"** a small bar demo using the 10% / 72% / 18% numbers from the content file. The scaling and mask explanations stay folded in `deepdive` blocks.
4. The measured tables (scaling, fusion) as `.callout--measured` plus `.table`. Maths stays in `deepdive` disclosures, written as clean typeset text (no libraries).
5. "Reproduce it": the code block from `provided/code/transformer_lesson_experiments.py`, trimmed to the relevant experiments, with copy buttons.
6. **Imagery:** a hero illustration (1600x900) and 3 to 4 inline SVG diagrams in `assets/img/transformer/`, in the shared style: the mandi (query, key, value), the passbook (LSTM), the red-pen bypass, and a rangoli-like attention pattern as decorative divider. Each with real alt text.
7. A "Check your understanding" section from the content file, as `qa` disclosures.

## Acceptance
Lighthouse mobile >= 90 on the page; 360px and 1280px both clean; stepper keyboard-operable; every number matches `content/transformer.md`; nothing invented. Finish with `lessons/transformer/HANDOFF.md`, then stop.
