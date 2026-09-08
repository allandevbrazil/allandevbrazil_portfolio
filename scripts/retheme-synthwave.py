"""Retheme scene textures to a synthwave/retrowave palette.

Hue-rotates colorful textures (+0.55) and boosts saturation slightly.
Grayscale images (alpha masks, shadows, text) are skipped automatically.
Handles: loose .webp/.png/.jpg files and images embedded in .glb files.
Usage: python scripts/retheme-synthwave.py [--apply]
"""
import io, sys, base64, pathlib, colorsys
from PIL import Image, ImageEnhance

HUE_SHIFT = 0.55
SAT_BOOST = 1.18
MIN_SAT = 0.14

def recolor(img):
    rgb = img.convert('RGB')
    small = rgb.resize((min(64, rgb.width), min(64, rgb.height)))
    px = list(small.getdata())
    sats = [colorsys.rgb_to_hsv(r/255, g/255, b/255)[1] for r, g, b in px]
    if sum(sats)/len(sats) < MIN_SAT:
        return None
    out = rgb.convert('HSV')
    h, s, v = out.split()
    h = h.point(lambda p: int((p/255 + HUE_SHIFT) % 1.0 * 255))
    s = s.point(lambda p: min(255, int(p * SAT_BOOST)))
    result = Image.merge('HSV', (h, s, v)).convert('RGB')
    if img.mode == 'RGBA':
        result.putalpha(img.getchannel('A'))
    return result

def process_image_bytes(data):
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
    except Exception:
        return None
    recolored = recolor(img)
    if recolored is None:
        return None
    buf = io.BytesIO()
    fmt = (img.format or 'PNG').upper()
    if fmt == 'WEBP':
        recolored.save(buf, 'WEBP', quality=92)
    elif fmt in ('JPEG', 'JPG'):
        recolored.convert('RGB').save(buf, 'JPEG', quality=92)
    else:
        recolored.save(buf, 'PNG')
    return buf.getvalue()

def main(dry):
    root = pathlib.Path('static')
    changed = skipped = 0
    for p in sorted(root.rglob('*')):
        if p.suffix.lower() not in ('.webp', '.png', '.jpg', '.jpeg'):
            continue
        data = p.read_bytes()
        new = process_image_bytes(data)
        if new is None:
            skipped += 1
            continue
        changed += 1
        print(f'  recolor: {p} ({len(data)} -> {len(new)})')
        if not dry:
            p.write_bytes(new)
    from pygltflib import GLTF2
    for p in sorted(root.rglob('*.glb')):
        glb = GLTF2().load_binary(str(p))
        if not glb.images:
            continue
        dirty = False
        blob = glb.binary_blob()
        for i, image in enumerate(glb.images):
            if image.bufferView is None:
                continue
            bv = glb.bufferViews[image.bufferView]
            offset = bv.byteOffset or 0
            raw = blob[offset: offset + bv.byteLength]
            new = process_image_bytes(raw)
            if new is None:
                continue
            dirty = True
            print(f'  glb recolor: {p} image[{i}] ({len(raw)} -> {len(new)})')
            image.bufferView = None
            image.uri = 'data:image/png;base64,' + base64.b64encode(new).decode()
        if dirty:
            changed += 1
            if not dry:
                glb.save_binary(str(p))
    print(f'{"DRY " if dry else ""}changed={changed} skipped={skipped}')

if __name__ == '__main__':
    main(dry='--apply' not in sys.argv)
