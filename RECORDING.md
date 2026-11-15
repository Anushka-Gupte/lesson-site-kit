# Recording plan: "Three lessons became a designed website, with 5 agents, in one session"

Rule one: record the REAL session, failures included. The brief asks what went wrong and how you steered. A session with no problems will look suspicious; a session with a clearly explained recovery is the best part of the video.

## Keep these running while you work (evidence)
- Screen recording from before Phase 1 to the deployed site. You can speed up the waiting, but keep a visible clock or timestamps.
- A notes file `steering-log.md` where you write, at the moment it happens: time, agent, what went wrong, what you did.
- `git log --oneline --graph --all` at each merge. After each phase, screenshots of: the agent list, the plan you approved, the diff you reviewed, the quota/usage view.

## Shot list (target 8 to 10 minutes of video)
| # | Beat | What to show | Say |
|---|---|---|---|
| 1 | The goal (0:30) | The three docs, then the finished site | What I wanted, why it matters (lessons for beginners deserve to be read, not only presented) |
| 2 | The plan (1:30) | `SPEC.md`: the contract, the design tokens, `ownership.json` | I planned first. The contract is what lets agents work without talking to each other |
| 3 | The split (1:00) | The phase table, five agents, worktrees and ports | One lane each. Phase 1 is sequential on purpose: three agents need the shared design system |
| 4 | The run (2:00) | Agent Manager with agents running side by side, plans being approved | How many at once, which model on which job, how I watched for stuck agents |
| 5 | The review (1:30) | A diff, `check_ownership.py` output, the browser at 360px and 1280px | I am the bottleneck, so I review against the spec and a guard, not by reading every line |
| 6 | What went wrong (1:30) | One or two real moments from `steering-log.md` | What I saw, what I changed (rejected a plan, narrowed a prompt, killed a looping agent, fixed a contract gap) |
| 7 | The result (1:00) | Live site, QA report numbers, Lighthouse, test output, repo stats | Real numbers only |
| 8 | The 20x question (1:00) | Your worksheet below | Your honest answer |

## IMPORTANT: if you record AFTER the session
You cannot recreate a live session afterwards, and the brief asks for the actual one. So:
1. **Keep a screen recorder running during the real session** (OBS or the built-in recorder), even if you never watch it back. At minimum record Phase 2, the moment 3 agents run at once. You can then trim and speed it up.
2. If you truly will not record live, take the screenshots below AS IT HAPPENS, then record a walkthrough afterwards of the real artifacts (agent conversation histories, `evidence/` files, git log, live site). Say it plainly in the video: "recorded after the session, from the real logs". Never re-enact or restage the agent runs.
3. After EVERY phase run `bash scripts/evidence.sh phaseN-done`. It writes a timestamped, real snapshot (branches, commits, ownership check, site size) into `evidence/`. Screenshot the terminal.

## Proof screenshots (take them during, in this order)
Must-have = the video is weak without it.
| # | When | Screenshot | Proves | |
|---|---|---|---|---|
| 1 | Phase 0 | `ls` plus `git log --oneline` showing SPEC.md, AGENTS.md, ownership.json, prompts/ committed before any agent ran | You planned first | Must |
| 2 | Phase 1 | The shell agent's PLAN as shown before you approve it (and your correction if you made one) | Plan-then-approve, you steering | Must |
| 3 | Phase 1 | Antigravity agent list/manager with the shell agent, its model, and the clock visible | Real tool, real session | Must |
| 4 | Phase 1 end | `python3 scripts/check_ownership.py shell agent/shell` output | Lane discipline | Must |
| 5 | Phase 1 end | The home page in the browser (1280px and 360px, one dark) and `docs/design-system.html` | Design quality, the shared system | Must |
| 6 | Phase 2 start | **The money shot:** Antigravity showing 3 (or more) agents RUNNING at once, names, status, models, clock visible | Parallelism | Must |
| 7 | Phase 2 | The three plans, one screenshot each, before approval | Spec-driven work | Nice |
| 8 | Phase 2 | Three browser windows or tabs on ports 3102, 3103, 3104, side by side | Separate lanes, real previews | Nice |
| 9 | Any time | **A problem and your steering message**: an agent looping, off-lane, wrong numbers, broken layout, plus the line you typed to fix it | What went wrong and how you steered | Must |
| 10 | Each merge | `check_ownership.py` for each lesson branch, and one diff you reviewed | Review before merge | Must |
| 11 | Merges | `git log --oneline --graph --all` after Phase 2, and any conflict you resolved | Integration | Nice |
| 12 | Phase 3 | `docs/QA-REPORT.md` with real Lighthouse and axe numbers, plus the command output that produced them | Measured results | Must |
| 13 | Phase 3 | `qa_links.py` and `qa_numbers.py` output | Checks, not vibes | Nice |
| 14 | Phase 4 | GitHub Actions run green, and the live URL open on your phone | Shipped | Must |
| 15 | Phase 4 | `bash scripts/evidence.sh final`, plus the three lesson pages on desktop | Final numbers | Must |
| 16 | Any time | Antigravity usage/quota view before and after Phase 2, if it has one | Cost of parallelism | Nice |
| 17 | End | `steering-log.md` and your filled 20x worksheet | Honest reflection | Must |

Take full-window screenshots with a visible clock. For long agent conversations, scroll-capture or take 2 to 3 screenshots, and save the conversation text if the tool allows an export. Keep every screenshot in `evidence/screens/` named `NN-what.png`.

## Results to capture (fill from real output)
| Metric | Value | Source |
|---|---|---|
| Agents run, max at once | | Agent Manager screenshot |
| Total wall-clock time | | your clock |
| Merges / conflicts / reverts | | `git log` |
| Pages, components, SVG images | | `find` and `wc` |
| Lighthouse mobile (4 scores, 5 pages) | | `docs/QA-REPORT.md` |
| axe violations (serious/critical) | | QA report |
| Broken links / number mismatches | | `qa_links.py`, `qa_numbers.py` |
| Out-of-lane edits caught by the guard | | `check_ownership.py` |

## The 20x worksheet (answer it from your own numbers)
1. **Alone, how long would each part take you?** List the tasks (design tokens and CSS, JS stepper engine, home page, 3 lesson pages, 9 + 5 + 5 diagram steps, 2 interactive demos, thumbnails and hero art, QA, README, deploy). Give an hour estimate per task. Sum it. Be honest, not generous.
2. **What did it actually take, and where did your time go?** Planning, approving plans, reviewing, merging, steering. Where was YOU the bottleneck?
3. **Ratio = alone estimate / actual hours.** Report it, even if it is 3x. A true 3x to 8x with evidence beats a claimed 20x.
4. **What made parallelism work:** the contract, the lanes, the guard, specs written before code. **What did not parallelise:** the design system (phase 1), merging, final taste decisions.
5. **How you would get closer to 20x:** more independent lanes, specs and acceptance tests written first, scripted checks instead of reading, a reviewer agent, fewer sequential phases.
6. **One sentence:** "Agents multiply my output only as fast as I can specify and verify, so I invest in the spec and the checks."

## Do not
Do not stage a failure. Do not quote the kit targets as results. Do not claim a Lighthouse score you did not run. Do not let an agent write its own acceptance report without a command output behind it.
