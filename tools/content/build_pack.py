"""Build Kural Heart's couplet pack from the downloaded sources. Never type couplets by hand.

Sources (tools/content/sources, downloaded 9 Nov 2026):
  pm_moolam.html   Project Madurai etext 0001, the plain Thirukkural. The text of record.
  pm_thirukkural.html  Project Madurai etext 0017 (couplets with Suddhananda Bharati's English).
                   Only its Tamil is used, as a second witness. Its English is under copyright and is ignored.
  tk120404.json    github.com/tk120404/thirukkural. No licence, so it is a third witness only, never shipped
                   or committed. To rebuild, download raw.githubusercontent.com/tk120404/thirukkural/master/thirukkural.json
                   into tools/content/sources/ first.
  se_aiyar.xhtml   Standard Ebooks' V. V. S. Aiyar translation (public domain, CC0). The English shipped.

Each line of each couplet is compared across the three Tamil witnesses after removing spacing and
punctuation (editions split and join words differently). The record's text ships when another witness
agrees. When the other two agree against it, theirs ships. When all three differ, the record ships and
the line is listed for the owner in tools/content/report.md.

Run from the project root:  python -I tools/content/build_pack.py
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "tools/content/sources"
OUT = ROOT / "app/src/main/assets/kural/pack.json"
REPORT = ROOT / "tools/content/report.md"
QUESTIONS = ROOT / "tools/content/questions.json"
CHOICES = {k: v for k, v in json.loads((ROOT / "tools/content/choices.json").read_text(encoding="utf-8")).items()
           if not k.startswith("_")}

NUMBER_FIXES = []
TAMIL = re.compile("[஀-௿]")


def text_lines(path):
    s = path.read_text(encoding="utf-8")
    s = re.sub(r"<br\s*/?>", "\n", s, flags=re.I)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s).replace(" ", " ").replace("﻿", "")
    return [ln.rstrip() for ln in s.split("\n")]


def tidy(line):
    line = re.sub(r"\s+", " ", line).strip()
    return line


def key(line):
    """Comparison key: Tamil letters and signs only."""
    return re.sub(r"[^஀-௿]", "", line)


def parse_moolam():
    lines = [l for l in text_lines(SRC / "pm_moolam.html") if l.strip()]
    kurals, prev = {}, None
    for ln in lines:
        m = re.match(r"^(.*?[஀-௿].*?)[\s.]*?(\d{1,4})\s*$", ln)
        if m and prev and not re.match(r"^\s*\d+\.\d", ln):
            # Couplets run in order; a few printed numbers are mistyped (71 twice, 7811, 12983), so count.
            n = len(kurals) + 1
            if int(m.group(2)) != n:
                NUMBER_FIXES.append((n, m.group(2)))
            kurals[n] = (tidy(prev), tidy(m.group(1)))
            prev = None
            continue
        prev = ln if TAMIL.search(ln) and not re.match(r"^\s*\d", ln) else None
    return kurals


def parse_chapter_names():
    """Tamil chapter names from etext 0017's contents table, one row per chapter."""
    names = {}
    for ln in text_lines(SRC / "pm_thirukkural.html"):
        m = re.match(r"^\s*(\d{1,3})[\s.;]+([஀-௿][஀-௿ ]*?)[\s.;-]*[A-Za-z]", ln)
        # skip the three part headings (அறத்துப்பால் and so on), which share the "N. name" shape
        if m and 1 <= int(m.group(1)) <= 133 and int(m.group(1)) not in names and not m.group(2).strip().endswith("பால்"):
            names[int(m.group(1))] = tidy(m.group(2))
    return names


def parse_pm17():
    lines = [l for l in text_lines(SRC / "pm_thirukkural.html") if l.strip()]
    out, i = {}, 0
    while i < len(lines) - 3:
        m = re.match(r"^\s*\d{1,2}\.\s*(\S.*[஀-௿].*)$", lines[i])
        if m and TAMIL.search(lines[i + 1]) and not re.match(r"^\s*\d", lines[i + 1]):
            # the kural number ends the English, within the next few lines
            for j in range(i + 2, min(i + 6, len(lines))):
                t = re.search(r"(\d{1,4})\s*$", lines[j])
                if t and not TAMIL.search(lines[j]):
                    out[int(t.group(1))] = (tidy(m.group(1)), tidy(lines[i + 1]))
                    break
            i += 2
            continue
        i += 1
    return out


def parse_tk():
    d = json.loads((SRC / "tk120404.json").read_text(encoding="utf-8"))
    return {int(k["Number"]): (tidy(k["Line1"]), tidy(k["Line2"])) for k in d["kural"]}


def parse_aiyar():
    s = (SRC / "se_aiyar.xhtml").read_text(encoding="utf-8")
    titles, verses = {}, {}
    for sec in re.finditer(r'<section[^>]*id="chapter-(\d+)"[^>]*>(.*?)</section>', s, re.S):
        c = int(sec.group(1))
        body = sec.group(2)
        t = re.search(r'<p epub:type="title">(.*?)</p>', body, re.S)
        titles[c] = clean_en(t.group(1)) if t else ""
        n = (c - 1) * 10
        for li in re.findall(r"<li[^>]*>(.*?)</li>", body, re.S):
            n += 1
            verses[n] = clean_en(li)
    return titles, verses


def clean_en(fragment):
    fragment = re.sub(r'<a[^>]*epub:type="noteref"[^>]*>.*?</a>', "", fragment, flags=re.S)
    fragment = re.sub(r"<[^>]+>", "", fragment)
    return re.sub(r"\s+", " ", html.unescape(fragment)).strip()


def distance(a, b):
    """Levenshtein distance between two strings."""
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def part_of(chapter):
    return "aram" if chapter <= 38 else "porul" if chapter <= 108 else "inbam"


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    record, ch_ta = parse_moolam(), parse_chapter_names()
    pm17, tk = parse_pm17(), parse_tk()
    titles, aiyar = parse_aiyar()
    problems = []
    for name, got, want in [("record", len(record), 1330), ("pm17", len(pm17), 1330), ("tk", len(tk), 1330),
                            ("aiyar", len(aiyar), 1330), ("chapters", len(ch_ta), 133), ("titles", len(titles), 133)]:
        if got != want:
            problems.append(f"{name}: {got} parsed, expected {want}")
    if problems:
        sys.exit("Parse check failed:\n  " + "\n  ".join(problems))

    stats = {"agree": 0, "voted": 0, "review": 0}
    review = []
    kurals = []
    for n in range(1, 1331):
        lines, status = [], "agree"
        for li in range(2):
            r, p, t = record[n][li], pm17[n][li], tk[n][li]
            kr, kp, kt = key(r), key(p), key(t)
            if kr == kp or kr == kt:
                lines.append(r)
            elif kp == kt:
                lines.append(t)
                status = "voted" if status == "agree" else status
            else:
                # All three differ, usually by one garbled letter in one witness. Ship the version that sits
                # closest to the other two, and list the line for the owner.
                cands = [(r, kr), (p, kp), (t, kt)]
                pick = CHOICES.get(f"{n}:{li + 1}")
                if pick:
                    best = cands[["record", "pm17", "dataset"].index(pick)]
                else:
                    best = min(cands, key=lambda c: sum(distance(c[1], o[1]) for o in cands))
                lines.append(best[0])
                status = "review"
                review.append((n, li + 1, best[0], r, p, t))
        stats[status] += 1
        c = (n - 1) // 10 + 1
        lines = [ln.rstrip(" .?") for ln in lines]  # editions differ on closing stops; ship none
        kurals.append({"n": n, "c": c, "a": lines[0], "b": lines[1], "en": aiyar[n], "check": status})

    chapters = [{"n": c, "ta": ch_ta[c], "en": titles[c], "part": part_of(c)} for c in range(1, 134)]
    questions = {k: v for k, v in json.loads(QUESTIONS.read_text(encoding="utf-8")).items() if not k.startswith("_")}
    pool = [int(c) for c in questions["chapter"]]
    missing = [c for c in pool if not all(questions["chapter"][str(c)].get(l) for l in ("en", "ta"))]
    if len(pool) != 90 or missing:
        sys.exit(f"Questions: {len(pool)} chapters (want 90), incomplete: {missing}")
    pack = {
        "version": 1,
        "built": "2026-11-09",
        "sources": {
            "tamil": "Project Madurai etext 0001, voted against etext 0017 and a second dataset",
            "english": "V. V. S. Aiyar, 1916, from Standard Ebooks (public domain)",
        },
        "chapters": chapters,
        "kurals": kurals,
        "questions": questions,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(pack, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    rep = ["# Couplet pack report", "", f"Built {pack['built']}. 1,330 couplets, 133 chapters.", "",
           f"- Two or three witnesses agree: {stats['agree']}",
           f"- Settled by vote against the record: {stats['voted']}",
           f"- All three differ, a witness chosen in tools/content/choices.json, needs the owner: {stats['review']}", "",
           "| Kural | Line | Shipped | Record (etext 0001) | Etext 0017 | Dataset |", "| --- | --- | --- | --- | --- | --- |"]
    rep += [f"| {n} | {li} | {sh} | {r} | {p} | {t} |" for n, li, sh, r, p, t in review]
    rep += ["", "Agreement means at least two witnesses match, which can still share an error if one copied the other.", "", "Printed numbers corrected by position in the record: "
            + ", ".join(f"{n} (printed {was})" for n, was in NUMBER_FIXES)]
    REPORT.write_text("\n".join(rep) + "\n", encoding="utf-8")
    print(stats, "->", OUT.relative_to(ROOT), f"({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
