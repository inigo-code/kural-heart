"""Generate the app's Valluvar art from the design canvas.

Source of truth: docs/canvas/project/Valluvar.dc.html (the owner's Valluvar model, ported to SVG).
Output: app/src/main/java/com/inigocode/kuralheart/ui/valluvar/ValluvarArt.kt

The SVG is flattened into a small line format that Valluvar.kt parses once:
  G|classes|a,b,c,d,e,f|opacity    open a group (matrix or "-")
  E                                close the group
  P|d|fill|stroke|width|cap|join|opacity|dash
  T|x|y|size|weight|fill|text      a Tamil letter (baseline at y)
Styles are resolved here, so the app never needs CSS inheritance.

Run from the project root:  python -I tools/valluvar/gen_valluvar.py
"""
import math
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "docs/canvas/project/Valluvar.dc.html"
OUT = ROOT / "app/src/main/java/com/inigocode/kuralheart/ui/valluvar/ValluvarArt.kt"

INHERITED = ("fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin")


def num(v):
    return float(v) if v not in (None, "") else 0.0


def fmt(x):
    s = f"{x:.3f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def mul(m, n):
    a, b, c, d, e, f = m
    a2, b2, c2, d2, e2, f2 = n
    return (a * a2 + c * b2, b * a2 + d * b2, a * c2 + c * d2, b * c2 + d * d2, a * e2 + c * f2 + e, b * e2 + d * f2 + f)


def parse_transform(t):
    m = (1, 0, 0, 1, 0, 0)
    for name, args in re.findall(r"(\w+)\(([^)]*)\)", t or ""):
        v = [float(x) for x in re.split(r"[ ,]+", args.strip()) if x]
        if name == "translate":
            n = (1, 0, 0, 1, v[0], v[1] if len(v) > 1 else 0)
        elif name == "scale":
            n = (v[0], 0, 0, v[1] if len(v) > 1 else v[0], 0, 0)
        elif name == "rotate":
            r = math.radians(v[0])
            n = (math.cos(r), math.sin(r), -math.sin(r), math.cos(r), 0, 0)
            if len(v) == 3:
                n = mul(mul((1, 0, 0, 1, v[1], v[2]), n), (1, 0, 0, 1, -v[1], -v[2]))
        else:
            sys.exit(f"unsupported transform {name}")
        m = mul(m, n)
    return m


def rect_d(e):
    x, y, w, h = (num(e.get(k)) for k in ("x", "y", "width", "height"))
    rx = num(e.get("rx")) or num(e.get("ry"))
    rx = min(rx, w / 2, h / 2)
    if not rx:
        return f"M{fmt(x)} {fmt(y)}h{fmt(w)}v{fmt(h)}h{fmt(-w)}z"
    r = fmt(rx)
    return (f"M{fmt(x + rx)} {fmt(y)}h{fmt(w - 2 * rx)}a{r} {r} 0 0 1 {r} {r}v{fmt(h - 2 * rx)}"
            f"a{r} {r} 0 0 1 -{r} {r}h{fmt(-(w - 2 * rx))}a{r} {r} 0 0 1 -{r} -{r}v{fmt(-(h - 2 * rx))}"
            f"a{r} {r} 0 0 1 {r} -{r}z")


def ellipse_d(cx, cy, rx, ry):
    return (f"M{fmt(cx - rx)} {fmt(cy)}a{fmt(rx)} {fmt(ry)} 0 1 0 {fmt(2 * rx)} 0"
            f"a{fmt(rx)} {fmt(ry)} 0 1 0 {fmt(-2 * rx)} 0z")


def shape_d(e, tag):
    if tag == "path":
        return " ".join(e.get("d").split())
    if tag == "rect":
        return rect_d(e)
    if tag == "circle":
        r = num(e.get("r"))
        return ellipse_d(num(e.get("cx")), num(e.get("cy")), r, r)
    if tag == "ellipse":
        return ellipse_d(num(e.get("cx")), num(e.get("cy")), num(e.get("rx")), num(e.get("ry")))
    if tag == "line":
        return f"M{e.get('x1')} {e.get('y1')}L{e.get('x2')} {e.get('y2')}"
    sys.exit(f"unsupported element {tag}")


def walk(e, style, out):
    tag = e.tag.split("}")[-1]
    style = dict(style)
    for k in INHERITED:
        if e.get(k) is not None:
            style[k] = e.get(k)
    if tag == "g":
        t = e.get("transform")
        m = ",".join(fmt(x) for x in parse_transform(t)) if t else "-"
        out.append(f"G|{e.get('class', '')}|{m}|{e.get('opacity', '1')}")
        for c in e:
            walk(c, style, out)
        out.append("E")
        return
    if tag == "text":
        out.append(f"T|{e.get('x')}|{e.get('y')}|{e.get('font-size')}|{e.get('font-weight', '400')}|{style.get('fill')}|{(e.text or '').strip()}")
        return
    d = shape_d(e, tag)
    cls = e.get("class")
    t = e.get("transform")
    wrap = bool(cls or t)
    if wrap:  # animated or transformed shapes get their own group, so motion has somewhere to live
        m = ",".join(fmt(x) for x in parse_transform(t)) if t else "-"
        out.append(f"G|{cls or ''}|{m}|1")
    fill = style.get("fill", "none")
    stroke = style.get("stroke", "none")
    sw = style.get("stroke-width", "1") if stroke != "none" else "0"
    out.append("P|" + "|".join([
        d, fill if fill != "none" else "-", stroke if stroke != "none" else "-", sw,
        style.get("stroke-linecap", "butt"), style.get("stroke-linejoin", "miter"),
        e.get("opacity", "1"), e.get("stroke-dasharray", "-") or "-",
    ]))
    if wrap:
        out.append("E")


def main():
    html = SRC.read_text(encoding="utf-8")
    start = html.index('<svg class="tv')
    svg = html[start:html.index("</svg>", start) + 6]
    svg = re.sub(r"\{\{[^}]*\}\}", "x", svg)  # template holes live only on the root element
    root = ET.fromstring(svg)
    out = []
    for c in root:
        walk(c, {"fill": root.get("fill", "black")}, out)
    for line in out:
        if '"""' in line or "$" in line:
            sys.exit("line cannot sit in a Kotlin raw string: " + line)
    chunks, size, cur = [], 0, []
    for line in out:  # keep each string constant well under the class-file limit
        cur.append(line)
        size += len(line.encode("utf-8")) + 1
        if size > 12000 and line == "E":
            chunks.append(cur)
            cur, size = [], 0
    if cur:
        chunks.append(cur)
    body = ",\n".join('        """\n' + "\n".join(c) + '\n"""' for c in chunks)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        "// Generated by tools/valluvar/gen_valluvar.py from docs/canvas/project/Valluvar.dc.html. Do not edit.\n"
        "package com.inigocode.kuralheart.ui.valluvar\n\n"
        "internal object ValluvarArt {\n"
        "    const val VIEW_WIDTH = 240f\n"
        "    const val VIEW_HEIGHT = 220f\n\n"
        "    val chunks: List<String> = listOf(\n" + body + "\n    )\n}\n",
        encoding="utf-8", newline="\n")
    print(f"{len(out)} lines in {len(chunks)} chunks -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
