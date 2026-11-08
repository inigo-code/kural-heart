"""Copy the canvas prototype's sample couplets into a debug-only asset for the font specimen.

These lines are NOT the kural pack. They were typed for the design prototype and are unverified.
The release build never includes them (they live in app/src/debug). Milestone 1 replaces them with
the verified pack built from a source of record.

Run from the project root:  python tools/specimen/gen_specimen.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
html = (ROOT / "docs/canvas/project/Main.dc.html").read_text(encoding="utf-8")
block = html[html.index("var K = {"):]
block = block[:block.index("\n};")]
out = []
for m in re.finditer(r"\n  (\d+):\{(.*?)(?=\n  \d+:\{|\Z)", block, re.S):
    body = m.group(2)
    def s(key):
        bs = chr(92)  # a backslash, spelled out so the pattern survives copying between shells
        r = re.search(key + ":'((?:[^'" + bs + bs + "]|" + bs + bs + ".)*)'", body)
        return r.group(1).replace(chr(92) + "'", "'") if r else None
    ch = re.search(r"ch:\['([^']*)','([^']*)'\]", body)
    out.append({"n": int(m.group(1)), "a": s("a"), "b": s("b"), "chapterTa": ch.group(1), "chapterEn": ch.group(2),
                "pope": s("pope"), "meaning": s("en")})
dest = ROOT / "app/src/debug/assets/specimen.json"
dest.write_text(json.dumps({"note": "Prototype text from the design canvas. Unverified. Debug builds only.", "kurals": out},
                           ensure_ascii=False, indent=1), encoding="utf-8")
print(len(out), "couplets ->", dest.relative_to(ROOT))
