"""Procedural dried palm-leaf band: fine long fibres on a pale straw ground. No blocks, no planks."""
import sys
import numpy as np
from PIL import Image

W, H = 1560, 760
rng = np.random.default_rng(391)


def streaks(length, thick):
    n = rng.normal(0, 1, (H, W)).astype('float64')
    c = np.cumsum(np.concatenate([n, n[:, :length]], 1), 1)
    s = (c[:, length:] - c[:, :-length])
    v = s.copy()
    for k in range(1, thick):
        v += np.roll(s, k, 0)
    return ((v - v.mean()) / v.std()).astype('float32')


yy, xx = np.mgrid[0:H, 0:W].astype('float32')
drift = (np.sin(xx / 410 + yy / 300 + 1.1) + .7 * np.sin(xx / 170 - yy / 240 + 2.4) + .5 * np.sin(yy / 96 + xx / 900)) / 2.2

tone = 1.5 * streaks(700, 2) + 1.1 * streaks(220, 1) + .55 * streaks(60, 1) + 2.4 * drift

# a few long ribs, darker hairlines that wander very slightly
rib = np.zeros((H, W), 'float32')
for y0 in rng.uniform(0, H, 15):
    a, f, p = rng.uniform(1, 4), rng.uniform(320, 800), rng.uniform(0, 6.3)
    y = y0 + a * np.sin(np.arange(W) / f + p)
    for off, w in ((0, 1.0), (1, .45), (-1, .45)):
        rib[(y + off).astype(int) % H, np.arange(W)] -= w * rng.uniform(1.6, 3.2)

t = tone + rib
base = np.array([234, 218, 184], 'float32')
rgb = np.stack([base[0] + t, base[1] + t * 1.08, base[2] + t * 1.35], -1)
Image.fromarray(np.clip(rgb, 0, 255).astype('uint8')).save(sys.argv[1], quality=88, optimize=True)
print('ok')
