"""Prepares the portrait footage for the dark promo from the photo and its cutout mask (see assets/reference/silhouette).
Usage: python make_portrait_assets.py photo.jpg mask.png out_dir
Writes out_dir/cutout.png (the person on transparent), edges.png (white line art), dots.png (a dot-matrix portrait)."""
import cv2
import numpy as np
import os
import sys

photo, mask, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
im = cv2.imread(photo)
m = cv2.imread(mask, 0)
S = 2  # work at twice the size so the dots and lines stay crisp at 1080p
im = cv2.resize(im, None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC)
m = cv2.resize(m, None, fx=S, fy=S, interpolation=cv2.INTER_LINEAR)
h, w = m.shape
gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)

# 1) cutout: a moody grade (slightly desaturated and contrasty) with the soft mask as alpha
g = im.astype(np.float32) / 255.0
lum = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32)[..., None] / 255.0
g = lum + (g - lum) * 0.8          # desaturate a little
g = np.clip((g - 0.5) * 1.18 + 0.5 - 0.04, 0, 1)
cut = np.dstack([(g * 255).astype(np.uint8), m])
cv2.imwrite(os.path.join(out, "cutout.png"), cut, [cv2.IMWRITE_PNG_COMPRESSION, 6])

# 2) line art: edges of the person, white on transparent (a wireframe-like sketch)
blur = cv2.GaussianBlur(gray, (0, 0), 2.2)
edges = cv2.Canny(blur, 18, 52)
inside = cv2.dilate((m > 100).astype(np.uint8) * 255, np.ones((9, 9), np.uint8))
edges = cv2.bitwise_and(edges, inside)
outline = cv2.Canny((m > 128).astype(np.uint8) * 255, 50, 150)  # the silhouette edge, so the figure always closes up
edges = cv2.dilate(cv2.bitwise_or(edges, outline), np.ones((3, 3), np.uint8))
line = np.zeros((h, w, 4), np.uint8)
line[..., :3] = 255
line[..., 3] = cv2.GaussianBlur(edges, (0, 0), 0.8)
cv2.imwrite(os.path.join(out, "edges.png"), line)

# 3) dot matrix: white dots on a regular grid, bigger where the photo is brighter, only on the person
step = 14
dots = np.zeros((h, w), np.uint8)
smooth = cv2.GaussianBlur(gray, (0, 0), 3).astype(np.float32) / 255.0
smooth = np.clip((smooth - 0.12) * 1.5, 0, 1)
for y in range(step // 2, h, step):
    for x in range(step // 2, w, step):
        if m[y, x] < 110:
            continue
        r = (step * 0.62) * (smooth[y, x] ** 0.8)
        if r > 0.8:
            cv2.circle(dots, (x, y), int(round(r)), 255, -1, cv2.LINE_AA)
dot = np.zeros((h, w, 4), np.uint8)
dot[..., :3] = 255
dot[..., 3] = dots
cv2.imwrite(os.path.join(out, "dots.png"), dot)
print("done", w, h)
