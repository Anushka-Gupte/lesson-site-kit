# Agent: HARNESS lesson. Phase 2, parallel.
Worktree `../wt-harness`, branch `agent/harness`, port 3103. Handoff: `lessons/harness/HANDOFF.md`.
Start only after the shell agent has been merged. Read `SPEC.md`, `AGENTS.md`, `docs/design-system.html`.

## Mission
Turn `content/harness.md` into `lessons/harness/index.html`: what an AI agent harness is, why it matters, and how Pi and Hermes differ, with one playable demo that makes the idea click.

## You own
`lessons/harness/**`, `assets/img/harness/**`. Scoped extras in `lesson.css` and `lesson.js`.

## Deliverables
1. The page in the content file order: the glass room, engine versus motorcycle, the loop, the five design questions, Pi, Hermes, side by side, where to use each.
2. **Two steppers:** the 5-step "engine becomes a motorcycle" (model, tools, context, permissions, memory, then the harness frame) and the 5-step agent loop (you, build the context, model decides, harness runs the tool, result goes back, done).
3. **The playable mini-harness** (SPEC section 6): a scripted model replaying a plan, a brake ON/OFF switch, a visible `precious/` folder and a log of turns. It must reproduce the behaviour of `provided/code/mini_harness.py`: with the brake OFF the `rm -rf` runs and the folder vanishes; with it ON the harness blocks it. Say clearly on the page that the model is a script, not intelligent.
4. **Pi versus Hermes:** two cards side by side plus the comparison table, and an SVG bar chart of the measured fixed cost (about 5.2k versus 54k characters). Keep the *measured* labels and the caveat about the surprising brake test exactly as the content file states it.
5. "Run it yourself": code from `provided/code/` (`mini_harness.py`, `run_real_pi.sh`, `run_hermes_measure.sh`) with copy buttons and the exact commands.
6. **Imagery:** hero (1600x900) and inline SVGs in `assets/img/harness/`: the glass room, the motorcycle-with-engine blueprint, and the loop. Same style as the shell agent.

## Acceptance
Lighthouse mobile >= 90; 360px and 1280px clean; demo works by keyboard; numbers match the content file; no new claims about Pi or Hermes. Finish with `lessons/harness/HANDOFF.md`, then stop.
