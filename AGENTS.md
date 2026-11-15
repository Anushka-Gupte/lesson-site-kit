# AGENTS.md: rules for every agent in this repo

You are one of several agents working at the same time. Read `SPEC.md` first, then your own prompt in `prompts/`.

1. **Stay in your lane.** Edit only the paths your agent owns in `ownership.json`. Never edit `SPEC.md`, `AGENTS.md`, `ownership.json`, `content/**`, `provided/**` or `prompts/**`. If you believe one of them is wrong, stop and write the question in your handoff file.
2. **Work only inside your own worktree** (`../wt-<name>`, branch `agent/<name>`). Never switch branches, never touch another worktree, never run `git push`, `git merge` or `git rebase`. The human merges.
3. **Commit small and often** with messages like `transformer: add 9-step stepper`. Keep a clean tree at every commit.
4. **Plan first.** Before writing code, produce a short plan (files you will create, in order). Wait for human approval if the tool asks.
5. **Content is the source of truth.** Use `content/*.md`. Do not invent numbers, quotes or claims. Keep the measured/reasoned labels. Code files come from `provided/code/` (copy, do not rewrite). Measured images come from `provided/images/`.
6. **No dependencies.** Hand-written HTML, CSS, JS. No npm packages at runtime, no CDN, no remote images, no tracking. Fonts self-hosted or system fallback.
7. **Accessibility is part of done:** semantic landmarks, one `h1` per page, alt text, 4.5:1 contrast, keyboard-operable controls, visible focus, `prefers-reduced-motion`, `prefers-color-scheme`.
8. **Local preview:** serve your worktree on your own port only (`python3 -m http.server <port>`; ports in `scripts/setup_worktrees.sh`). Do not share `.env` files.
9. **Verify before you claim.** Open your pages in the browser at 360px and 1280px, light and dark, and check the console is empty. Say what you actually checked and what you did not.
10. **Finish with a handoff file** (path in your prompt) containing: what you built, files touched, decisions, anything you could not do, anything you need from another lane, and how you verified. Then stop.
11. **If stuck or looping** (same tool call or error three times): stop and ask the human instead of guessing.
