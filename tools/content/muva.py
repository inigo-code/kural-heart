"""Mu. Varadarasanar's Tamil explanation (Thirukkural Thelivurai, 1969) for each couplet.

Source: Tamil Wikisource, "திருக்குறள் தெளிவுரை, மு. வரதராசன்", transcribed from the Tamil Virtual Academy's scan
(TVA BOK 0019263). A Tamil Nadu nationalised book, released CC0. Downloaded 9 Nov 2026 into
tools/content/sources/muva/ (one rendered page per section, iyal) by fetching each subpage with action=render.

Each chapter in the book gives its ten explanations, each followed by the couplet's number within the chapter, and
then the ten couplets themselves, numbered the same way. The couplets are used only to keep the explanations in step
with the pack's chapters; the shipped couplet text still comes from build_pack.py's witnesses.
"""
import html
import re
from pathlib import Path

MUVA = Path(__file__).resolve().parent / "sources/muva"

# The book's sections in the Kural's order, with the chapters each holds.
SECTIONS = [
    ("பாயிரம்", 1, 4), ("இல்லறவியல்", 5, 24), ("துறவறவியல்", 25, 37), ("ஊழியல்", 38, 38), ("அரசியல்", 39, 63),
    ("அமைச்சியல்", 64, 73), ("அரணியல்", 74, 75), ("கூழியல்", 76, 76), ("படையியல்", 77, 78), ("நட்பியல்", 79, 95),
    ("குடியியல்", 96, 108), ("களவியல்", 109, 115), ("கற்பியல்", 116, 133),
]

NUMBER = re.compile(r"^\s*(\d{1,4})\s*\.?\s*$")


def _lines(path):
    s = path.read_text(encoding="utf-8")
    # Stylesheets and scripts are page furniture: their text would otherwise end up inside an explanation (kural 1280
    # carried a block of Wikisource CSS).
    s = re.sub(r"<(style|script)\b[^>]*>.*?</\1>", "", s, flags=re.I | re.S)
    s = re.sub(r"<br\s*/?>", "\n", s, flags=re.I)
    s = re.sub(r"</(p|div|li|h\d|tr)>", "\n", s, flags=re.I)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s).replace("​", "").replace("\xa0", " ")
    return [re.sub(r"\s+", " ", ln).strip() for ln in s.split("\n") if ln.strip()]


def _segments(lines):
    """Runs of text, each closed by a line holding only a number (the couplet's place in its chapter)."""
    out, buf = [], []
    for ln in lines:
        m = NUMBER.match(ln)
        if m:
            if buf:
                out.append((int(m.group(1)), buf))
            buf = []
        else:
            buf.append(ln)
    return out


def _key(s):
    return re.sub(r"[^஀-௿]", "", s)


def _similar(a, b, distance):
    a, b = _key(a), _key(b)
    if not a or not b:
        return 0.0
    return 1 - distance(a, b) / max(len(a), len(b))


def parse(kurals, chapter_names, distance):
    """{kural number: explanation}. kurals: {n: (line a, line b)}; chapter_names: {chapter: Tamil name}."""
    found, problems = {}, []
    for name, first, last in SECTIONS:
        files = list(MUVA.glob(f"*_{name}.html"))
        if not files:
            problems.append(f"missing section file: {name}")
            continue
        segs = _segments(_lines(files[0]))
        ch = first
        expl = []  # (printed number, text), in the order the book gives them

        def close():
            nonlocal ch, expl
            if len(expl) == 10:
                # Ten explanations always come in couplet order, so their place decides, not the printed number
                # (the scan misprints a few, which would put one couplet's explanation under its neighbour).
                for i, (_, text) in enumerate(expl, 1):
                    found[(ch - 1) * 10 + i] = text
            else:
                # Fewer or more than ten: keep only the numbers printed once, and leave the rest to the English.
                nums = [num for num, _ in expl]
                for num, text in expl:
                    if nums.count(num) == 1:
                        found[(ch - 1) * 10 + num] = text
                missing = [i for i in range(1, 11) if nums.count(i) != 1]
                problems.append(f"chapter {ch}: {len(expl)} explanations; none shipped for couplets {missing}")
            ch += 1
            expl = []

        for num, text in segs:
            if ch > last:
                continue
            joined = " ".join(text)
            # A couplet: it matches one of this chapter's couplets, or the next chapter's first (OCR and spacing
            # differ a little). The printed number isn't trusted: the scan prints chapter 47's as 641 to 650.
            scores = [(_similar(joined, "".join(kurals[(ch - 1) * 10 + j]), distance), j) for j in range(1, 11)]
            nxt = _similar(joined, "".join(kurals[ch * 10 + 1]), distance) if ch < 133 else 0.0
            best, j = max(scores)
            if max(best, nxt) > 0.6:
                if nxt > best and ch < last:
                    close()  # this chapter's last couplet was missed; the next chapter has begun
                elif j == 10:
                    close()
                continue
            # Explanations carry their place in the chapter (1 to 10).
            if not 1 <= num <= 10:
                continue
            # An explanation: drop headings that run into it (the chapter's name, the book's titles, page furniture).
            lines = [t for t in text if _key(t) not in {_key(chapter_names[ch]), _key("திருக்குறள்"), _key("தெளிவுரை")}
                     and not re.match(r"^\d+\.\s*\S+ப்பால்$", t)
                     and not re.search(r"[←→]|உரை:|தெளிவுரை, மு\.|^ஆசிரியர்", t)
                     and _key(t) not in {_key(s) for s, _, _ in SECTIONS}]
            lines = [t for t in lines if not (_key(t) and _key(t) == _key(chapter_names.get(ch + 1, "")))]
            if lines:
                expl.append((num, tidy(" ".join(lines))))
        if ch <= last:
            problems.append(f"{name}: stopped at chapter {ch}, expected to reach {last}")
    problems += mend(found)
    return found, problems


# Transcription slips in the Wikisource text, by couplet: (as transcribed, as printed). Each must match once.
SLIPS = {
    1: ("அதுபோல அதுபோல", "அதுபோல"),
    6: ("ஒழுக்க தெறியில்", "ஒழுக்க நெறியில்"),
    9: ("பார்க்கர்த", "பார்க்காத"),
    10: ("கடடலை", "கடலை"),
    1007: ("ஒரு ஒரு", "ஒரு"),
}


def tidy(s):
    s = re.sub(r"\s+", " ", s).strip()
    # Lines broken at the page edge leave a space before punctuation, and sometimes none after it.
    s = re.sub(r"\s+([,.;:?!])", r"\1", s)
    s = re.sub(r"([,;:])(?=[^\s\d])", r"\1 ", s)
    s = re.sub(r"(?<=[஀-௿])\.(?=[஀-௿(])", ". ", s)
    return s


def mend(found):
    """Correct the known slips; a slip that no longer matches is reported, so the list stays true."""
    problems = []
    for n, (was, right) in SLIPS.items():
        if found.get(n, "").count(was) == 1:
            found[n] = found[n].replace(was, right)
        else:
            problems.append(f"kural {n}: slip '{was}' not found once; check tools/content/muva.py SLIPS")
    return problems
