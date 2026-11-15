#!/usr/bin/env python3
"""Merge guard: did this agent branch touch only files it owns?
Usage:  python3 scripts/check_ownership.py <agent-name> <branch> [base=main]
Exit code 0 = clean, 1 = the agent stepped outside its lane (list printed). Run it BEFORE you merge."""
import json, re, subprocess, sys

def glob_to_re(g):
    out, i = "", 0
    while i < len(g):
        if g[i:i+2] == "**": out += ".*"; i += 2
        elif g[i] == "*":    out += "[^/]*"; i += 1
        elif g[i] == "?":    out += "[^/]";  i += 1
        else:                out += re.escape(g[i]); i += 1
    return re.compile("^" + out + "$")

def main():
    if len(sys.argv) < 3: sys.exit(__doc__)
    agent, branch = sys.argv[1], sys.argv[2]
    base = sys.argv[3] if len(sys.argv) > 3 else "main"
    own = json.load(open("ownership.json"))
    if agent not in own: sys.exit(f"unknown agent {agent!r}; known: {[k for k in own if not k.startswith(_)]}")
    mine = [glob_to_re(g) for g in own[agent]]
    changed = subprocess.run(["git", "diff", "--name-only", f"{base}...{branch}"],
                             capture_output=True, text=True, check=True).stdout.split()
    bad = [f for f in changed if not any(r.match(f) for r in mine)]
    print(f"agent={agent} branch={branch}: {len(changed)} files changed, {len(bad)} outside its lane")
    for f in bad: print("  OUT OF LANE:", f)
    sys.exit(1 if bad else 0)

main()
