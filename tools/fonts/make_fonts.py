"""Cut static font files from the bundled variable fonts (React Native can't set a variable font's axes).

Run from the project root:  python tools/fonts/make_fonts.py
Reads assets/fonts/source/*.ttf, writes assets/fonts/*.ttf. The file name is the font family used in code.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "assets/fonts/source"
OUT = ROOT / "assets/fonts"

CUTS = {
    "anek_tamil.ttf": {
        "AnekTamil-Regular": {"wght": 400, "wdth": 100},
        "AnekTamil-Medium": {"wght": 500, "wdth": 100},
        "AnekTamil-SemiBold": {"wght": 600, "wdth": 100},
        "AnekTamil-Bold": {"wght": 700, "wdth": 100},
        # The couplet face: condensed, so a line of seven words fits a phone.
        "AnekTamil-Couplet": {"wght": 560, "wdth": 75},
        "AnekTamil-CoupletBold": {"wght": 700, "wdth": 75},
    },
    "literata.ttf": {
        "Literata-Regular": {"wght": 400},
        "Literata-Medium": {"wght": 500},
        "Literata-SemiBold": {"wght": 600},
    },
    "literata_italic.ttf": {"Literata-Italic": {"wght": 400}},
    "noto_serif_tamil.ttf": {
        "NotoSerifTamil-Regular": {"wght": 400, "wdth": 100},
        "NotoSerifTamil-Medium": {"wght": 500, "wdth": 100},
        "NotoSerifTamil-SemiBold": {"wght": 600, "wdth": 100},
        "NotoSerifTamil-ExtraBold": {"wght": 800, "wdth": 100},
    },
}

for src, cuts in CUTS.items():
    for name, axes in cuts.items():
        font = TTFont(SRC / src)
        have = {a.axisTag for a in font["fvar"].axes}
        static = instantiateVariableFont(font, {k: v for k, v in axes.items() if k in have}, updateFontNames=False)
        # Give each file its own family name, which is how React Native finds it on Android.
        for rec in static["name"].names:
            if rec.nameID in (1, 4, 16):
                rec.string = name
            elif rec.nameID == 6:
                rec.string = name.replace(" ", "")
        static.save(OUT / f"{name}.ttf")
        print(name, (OUT / f"{name}.ttf").stat().st_size // 1024, "KB")
