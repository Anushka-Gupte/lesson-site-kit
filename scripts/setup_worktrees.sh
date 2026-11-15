#!/usr/bin/env bash
# One git worktree per agent, so agents cannot overwrite each other. Run from the repo root.
#   bash scripts/setup_worktrees.sh phase1   -> worktree for the shell agent only
#   bash scripts/setup_worktrees.sh phase2   -> three lesson agents (run AFTER you merged the shell into main)
#   bash scripts/setup_worktrees.sh phase3   -> qa agent (run AFTER you merged the three lessons)
set -e
make() { name="$1"; port="$2"
  git worktree add "../wt-$name" -b "agent/$name" main
  echo "  ../wt-$name  (branch agent/$name)  preview:  cd ../wt-$name && python3 -m http.server $port"
}
case "${1:-}" in
  phase1) make shell 3101 ;;
  phase2) make transformer 3102; make harness 3103; make roofline 3104 ;;
  phase3) make qa 3105 ;;
  *) echo "usage: bash scripts/setup_worktrees.sh phase1|phase2|phase3"; exit 1 ;;
esac
echo; git worktree list
