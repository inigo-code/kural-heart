"""Google Play graphics for Kural Heart, made from real screenshots: store/graphics/.

    python make_store_graphics.py <screens dir> <app repo>

<screens dir> holds 1080-wide emulator screenshots named as in SHOTS. Writes icon-512.png, feature-graphic.png
(1024 x 500) and screenshots/01.png to 06.png (1080 x 1920: Play wants the long side at most twice the short one,
so each screen sits in a phone frame under a caption).
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

SHOTS_DIR = Path(sys.argv[1])
REPO = Path(sys.argv[2])
FONTS = REPO / "assets" / "fonts"
OUT = REPO / "store" / "graphics"

IVORY = (246, 242, 234)
NIGHT = (20, 17, 15)
INK = (30, 26, 22)
INK2 = (86, 77, 68)
CLAY = (180, 73, 42)
LEAF1 = (243, 231, 198)
GOLD = (201, 164, 92)

SHOTS = [
    ("today.png", "One couplet a day", "On its palm leaf, in Tamil and English", False),
    ("kural.png", "Read it every way", "Aiyar, Pope, and Mu. Va. in Tamil", False),
    ("journal.png", "A private journal", "Feelings, photos, voice notes, places", False),
    ("journey.png", "A thread, not a streak", "Rest days, seals and 133 chapters", False),
    ("today-night.png", "Day and night", "Ivory or Midnight, by the hour", True),
    ("share.png", "Share a couplet", "Seven looks from Tamil life", True),
]


def font(name, size):
    return ImageFont.truetype(str(FONTS / name), size)


def rounded(im, r):
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.size[0] - 1, im.size[1] - 1), r, fill=255)
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.paste(im, (0, 0), mask)
    return out


def phone(shot: Path, width: int) -> Image.Image:
    bez = max(10, width // 34)
    sw = width - 2 * bez
    im = Image.open(shot).convert("RGB")
    im = im.resize((sw, round(im.height * sw / im.width)), Image.LANCZOS)
    w, h = width, im.height + 2 * bez
    frame = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(frame).rounded_rectangle((0, 0, w - 1, h - 1), w // 8, fill=(24, 21, 19, 255))
    frame.alpha_composite(rounded(im, sw // 9), (bez, bez))
    pad = width // 6
    out = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    shadow = Image.new("RGBA", out.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((pad, pad + width // 30, pad + w, pad + h + width // 30), w // 8, fill=(40, 25, 5, 110))
    out.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(width // 18)))
    out.alpha_composite(frame, (pad, pad))
    return out


def kolam(draw, x0, x1, y, color, step=36):
    x = x0
    while x <= x1:
        draw.ellipse((x - 4, y - 4, x + 4, y + 4), fill=color)
        if x + step <= x1:
            cx = x + step / 2
            draw.polygon([(cx, y - 9), (cx + 9, y), (cx, y + 9), (cx - 9, y)], outline=color, width=2)
        x += step


def centred(draw, text, f, cx, y, fill):
    draw.text((cx - draw.textlength(text, font=f) / 2, y), text, font=f, fill=fill)


def screenshot(i, name, title, sub, night):
    W, H = 1080, 1920
    bg, fg, fg2 = (NIGHT, (243, 236, 226), (203, 193, 180)) if night else (IVORY, INK, INK2)
    im = Image.new("RGBA", (W, H), bg + (255,))
    d = ImageDraw.Draw(im)
    kolam(d, 60, W - 60, 70, GOLD + (150,))
    centred(d, title, font("Literata-SemiBold.ttf", 76), W / 2, 120, fg)
    centred(d, sub, font("AnekTamil-Regular.ttf", 44), W / 2, 228, fg2)
    p = phone(SHOTS_DIR / name, 760)
    pad = 760 // 6
    im.alpha_composite(p, (int(W / 2 - p.width / 2), 330 - pad))
    (OUT / "screenshots").mkdir(parents=True, exist_ok=True)
    im.convert("RGB").save(OUT / "screenshots" / f"{i:02d}.png", optimize=True)


def feature():
    W, H = 1024, 500
    im = Image.new("RGBA", (W, H), IVORY + (255,))
    wash = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(wash).ellipse((560, -160, 1240, 680), fill=LEAF1 + (255,))
    im.alpha_composite(wash.filter(ImageFilter.GaussianBlur(70)))
    d = ImageDraw.Draw(im)
    kolam(d, 60, 560, 60, GOLD + (160,), step=30)
    icon = Image.open(REPO / "assets" / "icon.png").convert("RGBA").resize((120, 120), Image.LANCZOS)
    im.alpha_composite(rounded(icon, 28), (60, 110))
    d.text((200, 100), "Kural", font=font("Literata-SemiBold.ttf", 66), fill=INK)
    d.text((200, 170), "Heart", font=font("Literata-SemiBold.ttf", 66), fill=CLAY)
    d.text((60, 280), "A private journal", font=font("Literata-Medium.ttf", 40), fill=INK)
    d.text((60, 330), "with Thiruvalluvar.", font=font("Literata-Medium.ttf", 40), fill=INK)
    d.text((60, 408), "One couplet a day · Tamil and English · No account", font=font("AnekTamil-Regular.ttf", 24), fill=INK2)
    p = phone(SHOTS_DIR / "today.png", 300)
    pad = 300 // 6
    im.alpha_composite(p, (690 - pad, 40 - pad))
    im.convert("RGB").save(OUT / "feature-graphic.png", optimize=True)


OUT.mkdir(parents=True, exist_ok=True)
Image.open(REPO / "assets" / "icon.png").convert("RGBA").resize((512, 512), Image.LANCZOS).save(OUT / "icon-512.png", optimize=True)
feature()
for i, s in enumerate(SHOTS, 1):
    screenshot(i, *s)
print("wrote", OUT)
