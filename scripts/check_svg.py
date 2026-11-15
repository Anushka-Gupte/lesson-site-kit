#!/usr/bin/env python3
"""Validate that every .svg file is well-formed XML (a browser refuses to draw an SVG that is not).
Usage (from a worktree or repo root):  python scripts/check_svg.py      Exit 1 if any file is broken.
Typical bug: HTML named entities such as &bull; &nbsp; &mdash; &rarr; &copy; are NOT defined in XML.
Fix: use the numeric form (&#8226;) or the literal UTF-8 character, and write a bare & as &amp;."""
import os, re, sys, xml.etree.ElementTree as ET

bad = 0; total = 0
for root, dirs, files in os.walk("."):
    dirs[:] = [d for d in dirs if d not in (".git", "node_modules", "__pycache__")]
    for f in files:
        if not f.lower().endswith(".svg"): continue
        p = os.path.join(root, f); total += 1
        try:
            ET.parse(p)
        except ET.ParseError as e:
            bad += 1; line, col = e.position
            print(f"BROKEN  {p}  line {line}, col {col}: {e}")
            try: print("        >>", open(p, encoding="utf-8").read().splitlines()[line - 1][max(0, col - 40): col + 40].strip())
            except Exception: pass
        else:
            named = set(re.findall(r"&([A-Za-z][A-Za-z0-9]*);", open(p, encoding="utf-8").read())) - {"amp", "lt", "gt", "quot", "apos"}
            if named: print(f"WARNING {p}: unusual entities {sorted(named)}")
print(f"{total} svg files checked, {bad} broken")
sys.exit(1 if bad else 0)
