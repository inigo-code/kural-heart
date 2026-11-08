"""Procedural dark granite for the inscription direction."""
import sys
import numpy as np
from PIL import Image, ImageFilter

W, H = 780, 1688
rng = np.random.default_rng(1330)


def blur(a, r):
    lo, hi = a.min(), a.max()
    img = Image.fromarray(((a - lo) / (hi - lo) * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(r))
    b = np.asarray(img, 'float32')
    return (b - b.mean()) / (b.std() + 1e-6)


n = lambda: rng.normal(0, 1, (H, W)).astype('float32')
tone = 3.2 * blur(n(), 70) + 2.4 * blur(n(), 18) + 2.0 * blur(n(), 3) + 3.0 * blur(n(), .7)
flecks = np.clip(blur(n(), 1.1) - 2.1, 0, None) * 26 - np.clip(-blur(n(), 1.3) - 2.0, 0, None) * 14
v = tone + flecks
rgb = np.stack([50 + v, 48 + v * .98, 46 + v * .94], -1)
Image.fromarray(np.clip(rgb, 0, 255).astype('uint8')).save(sys.argv[1], quality=82, optimize=True)
print('ok')
