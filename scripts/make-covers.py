"""Gera capas synthwave (mockup de navegador neon + screenshot do projeto) para os cards e placas 3D.
Uso: python scripts/make-covers.py
"""
import pathlib
from PIL import Image, ImageDraw, ImageFilter

SRC = pathlib.Path('static/projects-covers')
OUT = pathlib.Path('static/projects-covers/generated')
OUT.mkdir(exist_ok=True)

W, H = 1024, 640
GRID = 64
BAR = 64
MARGIN = 48
PINK = (255, 46, 136)
CYAN = (0, 240, 255)
BG_TOP = (13, 2, 33)
BG_BOT = (44, 10, 82)

def base_canvas():
    img = Image.new('RGB', (W, H))
    top, bot = BG_TOP, BG_BOT
    for y in range(H):
        t = y / H
        img.paste(tuple(int(a + (b - a) * t) for a, b in zip(top, bot)), (0, y, W, y + 1))
    d = ImageDraw.Draw(img)
    for x in range(0, W, GRID):
        d.line((x, 0, x, H), fill=(58, 18, 92), width=1)
    for y in range(0, H, GRID):
        d.line((0, y, W, y), fill=(58, 18, 92), width=1)
    img = img.filter(ImageFilter.GaussianBlur(0.4))
    return img

def make_cover(shot_path, out_path, title):
    img = base_canvas()
    d = ImageDraw.Draw(img)
    x0, y0 = MARGIN, MARGIN + 18
    x1, y1 = W - MARGIN, H - MARGIN + 10
    shot = Image.open(shot_path).convert('RGB')
    inner_w, inner_h = (x1 - x0) - 8, (y1 - y0) - BAR - 8
    scale = min(inner_w / shot.width, inner_h / shot.height)
    sw, sh = int(shot.width * scale), int(shot.height * scale)
    shot = shot.resize((sw, sh), Image.LANCZOS)
    sx = x0 + 4 + (inner_w - sw) // 2
    sy = y0 + BAR + 4 + (inner_h - sh) // 2
    d.rounded_rectangle((x0, y0, x1, y1), radius=14, fill=(18, 4, 40), outline=PINK, width=3)
    d.line((x0 + 14, y0 + BAR, x1 - 14, y0 + BAR), fill=(123, 47, 247), width=2)
    for i, c in enumerate((PINK, (255, 140, 66), CYAN)):
        d.ellipse((x0 + 20 + i * 26, y0 + 22, x0 + 36 + i * 26, y0 + 38), fill=c)
    d.rounded_rectangle((x0 + 110, y0 + 16, x1 - 20, y0 + 46), radius=12, fill=(26, 5, 51), outline=(123, 47, 247))
    d.text((x0 + 126, y0 + 23), 'allandevbrazil.github.io/' + title.lower().replace(' ', '-'), fill=CYAN)
    img.paste(shot, (sx, sy))
    overlay = Image.new('L', (W, H), 0)
    od = ImageDraw.Draw(overlay)
    od.rounded_rectangle((x0 - 4, y0 - 4, x1 + 4, y1 + 4), radius=18, outline=255, width=6)
    glow = overlay.filter(ImageFilter.GaussianBlur(8))
    pink_layer = Image.new('RGB', (W, H), PINK)
    img = Image.composite(pink_layer, img, glow.point(lambda p: int(p * 0.55)))
    img.save(out_path, 'WEBP', quality=88)

count = 0
for shot in sorted(SRC.glob('*.png')):
    out = OUT / (shot.stem + '.webp')
    make_cover(shot, out, shot.stem)
    count += 1
    print('capa:', out)
print('total:', count)
