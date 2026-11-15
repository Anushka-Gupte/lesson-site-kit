# Lesson-site kit: run a real multi-agent session in Antigravity

This kit is YOUR plan, spec and guardrails. The session itself has to be real: you run the agents, you review, you record. Nothing here has been run in Antigravity yet (the scripts below were tested in a throwaway git repo; the prompts are untested).

## Before you record (30 to 40 minutes)
1. Make a new empty folder, copy this kit into it, and `git init -b main`.
2. Export your three lessons from Claude (Download as Markdown, or Word then convert) into `content/transformer.md`, `content/harness.md`, `content/roofline.md`. See `content/README.md`.
3. `git add -A && git commit -m "phase 0: spec, rules, content"`.
4. Read `SPEC.md` once, properly. You are the planner: edit it if you disagree with a choice (before you commit).
5. Do a 5-minute dry run of Antigravity: open the folder, check which surface you have (the 2.0 desktop app is the multi-agent one), check quota.

## The session
| Phase | What | You do | Agents | Rough target* |
|---|---|---|---|---|
| 1 | Design system and home page | `bash scripts/setup_worktrees.sh phase1`; open `../wt-shell` as a project; paste `prompts/00_shell.md`; approve the plan | 1 | 20 to 40 min |
| merge | | `python3 scripts/check_ownership.py shell agent/shell`; review in the browser; `git merge agent/shell` | | 10 min |
| 2 | Three lessons in parallel | `bash scripts/setup_worktrees.sh phase2`; open the three worktrees; paste the three prompts; approve three plans; watch | 3 (+ shell polishing) | 45 to 90 min |
| merge | | run the guard for each branch; review each; merge one at a time; fix conflicts | | 20 min |
| 3 | QA and README | `bash scripts/setup_worktrees.sh phase3`; paste `prompts/04_qa.md` | 1 | 20 to 30 min |
| 4 | Fix and ship | read the QA report; steer fixes; deploy to GitHub Pages | | 20 min |
*Targets are guesses. Record your real times. Never quote them as results.

After every phase: `bash scripts/evidence.sh phaseN-done` writes a timestamped proof snapshot into `evidence/` (branches, commits, lane check, site size). Then take the screenshots listed in `RECORDING.md`.

## How the agents are kept apart
One git worktree per agent, one folder lane per agent (`ownership.json`), one preview port per agent, a contract in `SPEC.md` section 5, and a machine check before every merge:
`python3 scripts/check_ownership.py <agent> agent/<agent>` (exit 1 if the agent touched files outside its lane).

## Files
`SPEC.md` goal, design system, contract, phases. `AGENTS.md` rules every agent follows. `ownership.json` who owns which paths. `prompts/` one prompt per agent. `scripts/` worktree setup and the ownership guard. `provided/` real code and measured images from the lessons. `RECORDING.md` your recording plan and the 20x worksheet.
