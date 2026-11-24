"""Builds the hero shadow and the About portrait from a photo and its mask (see cut_mask.py).
Usage: python export_assets.py photo.jpg mask.png out_dir
The shadow keeps a little of the photo's light and shade (so the face and shoulders read as a dark figure,
not a flat blob), tinted maroon-black, with a soft rose rim light along its edge."""
import cv2, numpy as np, sys

src, mask, outdir = sys.argv[1:4]
im = cv2.imread(src)
m = cv2.imread(mask, 0)
h, w = m.shape

# 1) tonal shadow: luminance squeezed into a dark range, softened so it reads as a shadow
gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
gray = cv2.GaussianBlur(gray, (0, 0), 3.0)
tone = 14 + 78 * np.power(gray, 1.5)                       # 14..92
# a vertical falloff: lighter at the shoulders/head, darker towards the bottom
tone *= np.linspace(1.15, 0.55, h, dtype=np.float32)[:, None]
body = np.zeros((h, w, 3), np.float32)
body[..., 0] = tone * 0.80   # B
body[..., 1] = tone * 0.74   # G
body[..., 2] = tone * 1.00   # R  (maroon-black tint)

# 2) rim light along the edge
hard = (m > 128).astype(np.uint8) * 255
inner = cv2.erode(hard, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17)))
rim = cv2.GaussianBlur((hard - inner).astype(np.float32) / 255.0, (0, 0), 3.0)
rim *= 0.55
for c, v in enumerate((189, 180, 224)):                      # BGR of #e0b4bd
    body[..., c] = np.clip(body[..., c] + rim * v, 0, 255)

out = np.dstack([np.clip(body, 0, 255).astype(np.uint8), m])
cv2.imwrite(outdir + "/silhouette.png", out, [cv2.IMWRITE_PNG_COMPRESSION, 9])

# 3) portrait for the About card
p = cv2.resize(im, (600, int(600 * h / w)), interpolation=cv2.INTER_AREA)
cv2.imwrite(outdir + "/profile.jpg", p, [cv2.IMWRITE_JPEG_QUALITY, 86])
