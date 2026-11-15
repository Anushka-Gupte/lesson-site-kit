#!/usr/bin/env bash
# Snapshot REAL, timestamped proof of where the project stands. Run from the main repo root after every phase.
#   bash scripts/evidence.sh phase1-done      (writes evidence/phase1-done.txt and prints it: screenshot the terminal)
set -u
label="${1:?usage: bash scripts/evidence.sh <label, e.g. phase1-done>}"
mkdir -p evidence; out="evidence/${label}.txt"
branches=$(git for-each-ref --format='%(refname:short)' refs/heads/agent/ 2>/dev/null)
{
  echo "== $label =="; date -Iseconds
  echo; echo "== agent branches: commits ahead of main =="
  for b in $branches; do printf '%-22s %s commits\n' "$b" "$(git rev-list --count main..$b)"; done
  echo; echo "== worktrees =="; git worktree list
  echo; echo "== ownership guard (did any agent leave its lane?) =="
  for b in $branches; do python3 scripts/check_ownership.py "${b#agent/}" "$b" || true; done
  echo; echo "== history =="; git log --oneline --graph --all --decorate | head -40
  echo; echo "== what exists on main =="
  echo "html pages:  $(git ls-tree -r --name-only main | grep -c '\.html$')"
  echo "svg images:  $(git ls-tree -r --name-only main | grep -c '\.svg$')"
  echo "css/js files: $(git ls-tree -r --name-only main | grep -cE '\.(css|js)$')"
  echo "total lines (html+css+js): $(git ls-tree -r --name-only main | grep -E '\.(html|css|js)$' | while read f; do git show main:"$f" | wc -l; done | awk '{s+=$1} END {print s+0}')"
} | tee "$out"
