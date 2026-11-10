"""Compose Kural Heart's README pictures from real screenshots: docs/hero.png and docs/gallery.png.

    python make_readme_images.py <screens dir> <app repo>

The screens dir holds PNG screenshots named as in GALLERY and HERO below (1080 wide, from the emulator).
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

SHOTS = Path(sys.argv[1])
REPO = Path(sys.argv[2])
FONTS = REPO / "assets" / "fonts"
OUT = REPO / "docs"

IVORY = (246, 242, 234)
INK = (30, 26, 22)
INK2 = (86, 77, 68)
CLAY = (180, 73, 42)
LEAF1 = (243, 231, 198)
LEAF2 = (231, 212, 162)
GOLD = (201, 164, 92)
NIGHT = (20, 17, 15)


def font(name, size):
    return ImageFont.truetype(str(FONTS / name), size)


def rounded(im, r):
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.size[0] - 1, im.size[1] - 1), r, fill=255)
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.paste(im, (0, 0), mask)
    return out


def phone(shot: Path, width: int) -> Image.Image:
    """A screenshot in a dark phone frame with a soft shadow, [width] wide (frame included)."""
    bez = max(10, width // 34)
    sw = width - 2 * bez
    im = Image.open(shot).convert("RGB")
    sh = round(im.height * sw / im.width)
    im = im.resize((sw, sh), Image.LANCZOS)
    screen = rounded(im, sw // 9)
    w, h = width, sh + 2 * bez
    frame = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(frame).rounded_rectangle((0, 0, w - 1, h - 1), w // 8, fill=(24, 21, 19, 255))
    frame.alpha_composite(screen, (bez, bez))
    pad = width // 6
    out = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    shadow = Image.new("RGBA", out.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((pad, pad + width // 30, pad + w, pad + h + width // 30), w // 8, fill=(60, 40, 10, 90))
    shadow = shadow.filter(ImageFilter.GaussianBlur(width // 18))
    out.alpha_composite(shadow)
    out.alpha_composite(frame, (pad, pad))
    return out


def kolam_band(draw, x0, x1, y, color, step=36):
    """A pulli kolam row: dots joined by small diamonds, as on the app's tab bar."""
    x = x0
    while x <= x1:
        draw.ellipse((x - 4, y - 4, x + 4, y + 4), fill=color)
        d = step / 2
        if x + step <= x1:
            cx = x + d
            draw.polygon([(cx, y - 9), (cx + 9, y), (cx, y + 9), (cx - 9, y)], outline=color, width=2)
        x += step


def centred(draw, text, f, cx, y, fill):
    w = draw.textlength(text, font=f)
    draw.text((cx - w / 2, y), text, font=f, fill=fill)


def wrap(draw, text, f, width):
    words, lines, line = text.split(), [], ""
    for wd in words:
        t = (line + " " + wd).strip()
        if draw.textlength(t, font=f) <= width:
            line = t
        else:
            lines.append(line)
            line = wd
    lines.append(line)
    return lines


GALLERY = [
    ("today.png", "A couplet a day", "On its palm leaf"),
    ("kural.png", "Read it every way", "Aiyar, Pope, Mu. Va."),
    ("journal.png", "Your pages", "Feelings, photos, voice"),
    ("journey.png", "Your thread", "Rest days and seals"),
    ("chapters.png", "1,330 couplets", "By chapter, or search"),
    ("share.png", "Share a couplet", "Seven Tamil looks"),
]


def gallery():
    W, H = 2400, 1185
    im = Image.new("RGBA", (W, H), IVORY + (255,))
    d = ImageDraw.Draw(im)
    kolam_band(d, 40, W - 40, 40, GOLD + (110,))
    n = len(GALLERY)
    slot = W / n
    pw = int(slot * 0.86)
    title = font("Literata-SemiBold.ttf", 40)
    sub = font("AnekTamil-Regular.ttf", 29)
    for i, (f, t, s) in enumerate(GALLERY):
        p = phone(SHOTS / f, pw)
        cx = slot * i + slot / 2
        pad = pw // 6
        im.alpha_composite(p, (int(cx - p.width / 2), 90 - pad))
        y = 90 + p.height - 2 * pad + 40
        for line in wrap(d, t, title, slot - 30):
            centred(d, line, title, cx, y, INK)
            y += 50
        y += 4
        for line in wrap(d, s, sub, slot - 30):
            centred(d, line, sub, cx, y, INK2)
            y += 40
    # Trim to the captions, with the same margin below as above the phones.
    im.crop((0, 0, W, int(y) + 60)).convert("RGB").save(OUT / "gallery.png", optimize=True)


def hero():
    W, H = 2400, 1290
    im = Image.new("RGBA", (W, H), IVORY + (255,))
    d = ImageDraw.Draw(im)
    # A warm leaf-coloured wash on the right, behind the phones.
    wash = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(wash).ellipse((1250, -200, 2700, 1500), fill=LEAF1 + (255,))
    im.alpha_composite(wash.filter(ImageFilter.GaussianBlur(120)))
    kolam_band(d, 130, 1180, 120, GOLD + (150,))
    icon = Image.open(REPO / "assets" / "icon.png").convert("RGBA").resize((170, 170), Image.LANCZOS)
    im.alpha_composite(rounded(icon, 40), (130, 190))
    d.text((330, 178), "Kural", font=font("Literata-SemiBold.ttf", 120), fill=INK)
    d.text((330, 296), "Heart", font=font("Literata-SemiBold.ttf", 120), fill=CLAY)
    d.text((130, 470), "A private journal", font=font("Literata-Medium.ttf", 74), fill=INK)
    d.text((130, 560), "with Thiruvalluvar.", font=font("Literata-Medium.ttf", 74), fill=INK)
    body = font("AnekTamil-Regular.ttf", 42)
    y = 690
    for line in wrap(d, "One couplet of the Thirukkural each day, in Tamil and English, a question to write about, and a page that stays on your phone.", body, 1020):
        d.text((130, y), line, font=body, fill=INK2)
        y += 58
    chips = ["1,330 couplets", "Tamil and English", "No account, no ads", "Locked backups"]
    cf = font("AnekTamil-Medium.ttf", 36)
    x, y = 130, y + 50
    for c in chips:
        w = d.textlength(c, font=cf) + 64
        if x + w > 1200:
            x, y = 130, y + 90
        d.rounded_rectangle((x, y, x + w, y + 70), 35, fill=(255, 253, 249), outline=(224, 212, 193), width=2)
        d.text((x + 32, y + 14), c, font=cf, fill=INK)
        x += w + 18
    # Three phones: night behind, the story at the side, Today in front.
    back = phone(SHOTS / "today-night.png", 470).rotate(6, resample=Image.BICUBIC, expand=True)
    side = phone(SHOTS / "share.png", 430).rotate(-7, resample=Image.BICUBIC, expand=True)
    front = phone(SHOTS / "today.png", 540)
    im.alpha_composite(back, (1260, 60))
    im.alpha_composite(side, (1880, 180))
    im.alpha_composite(front, (1500, -10))
    im.convert("RGB").save(OUT / "hero.png", optimize=True)


OUT.mkdir(exist_ok=True)
gallery()
hero()
print("wrote", OUT / "gallery.png", OUT / "hero.png")
