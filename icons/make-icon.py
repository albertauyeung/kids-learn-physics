# Draws the app icon (pixel art) at every size: python3 icons/make-icon.py icons /tmp/preview.png
# Pixel-art app icon: sky, a falling apple with strobe "ghosts" (the gaps grow as it speeds up), grass block ground.
import random, sys
from PIL import Image
N = 32
img = Image.new('RGB', (N, N))
px = img.load()
sky = [(0x79,0xa6,0xff),(0x86,0xb0,0xff),(0x93,0xba,0xff),(0xa2,0xc4,0xff),(0xb1,0xce,0xff)]
for y in range(N):
    for x in range(N):
        px[x, y] = sky[min(4, y * 5 // 23)]
rng = random.Random(7)
grass = [(0x5b,0x87,0x31),(0x6a,0x9a,0x3a),(0x4f,0x7a,0x2a),(0x7c,0xbd,0x3b)]
dirt = [(0x86,0x60,0x43),(0x79,0x55,0x3a),(0x96,0x70,0x4f),(0x6c,0x4b,0x32)]
G = 23  # top row of the ground
for y in range(G, N):
    for x in range(N):
        px[x, y] = rng.choice(grass) if y < G + 3 or (y == G + 3 and rng.random() < 0.5) else rng.choice(dirt)
# apple sprite 8x8 ('.' transparent)
apple = ['..GL..', '.RGRR.', 'RRRRWR', 'RRRRRR', 'RRRRRR', '.RRRR.']
pal = {'R': (0xd8,0x2a,0x2a), 'W': (0xff,0xa0,0xa0), 'G': (0x6b,0x45,0x22), 'L': (0x4c,0xb0,0x2a)}
def draw(ax, ay, alpha):
    for j, row in enumerate(apple):
        for i, ch in enumerate(row):
            if ch == '.': continue
            x, y = ax + i, ay + j
            if 0 <= x < N and 0 <= y < N:
                bg = px[x, y]; c = pal[ch]
                px[x, y] = tuple(round(bg[k] * (1 - alpha) + c[k] * alpha) for k in range(3))
# strobe positions: falls 1, then 3, then 5 rows... scaled (gaps grow) — last apple is the real one
ax = 12
for ay, a in [(1, 0.3), (7, 0.55), (16, 1.0)]:  # gaps grow as it speeds up
    draw(ax, ay, a)
# little motion arrow (yellow) to the right of the apple
for y in range(4, 15): px[23, y] = (0xfc,0xee,0x4b)
for d in range(1, 3):
    px[23 - d, 15 - d] = (0xfc,0xee,0x4b); px[23 + d, 15 - d] = (0xfc,0xee,0x4b)
px[23, 15] = (0xfc,0xee,0x4b)
out = sys.argv[1]
for size, name in [(180, 'apple-touch-icon.png'), (192, 'icon-192.png'), (512, 'icon-512.png'), (32, 'favicon-32.png')]:
    img.resize((size, size), Image.NEAREST).save(f'{out}/{name}')
img.resize((512, 512), Image.NEAREST).save(sys.argv[2])
