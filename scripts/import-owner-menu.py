"""Extract the restaurant's embedded Excel pictures without generated content.

Usage: python scripts/import-owner-menu.py path/to/menu.xlsx [owner-photo-directory]
The row/column selections were checked against the September 27 owner workbook.
"""
from io import BytesIO
from pathlib import Path
import sys

from openpyxl import load_workbook
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/menu-owner-2026-09-27-v2'
# Item ID: embedded image anchor (Excel row, column). Some pictures float above
# their product row; this mapping was visually inspected in the owner workbook.
SOURCE = {
    **{f'm{i-5:03d}': (i, 5) for i in range(6, 9)},
    'm004': (9, 59),
    **{f'm{i-5:03d}': (i, 5) for i in range(11, 16)},
    'm011': (16, 3), 'm012': (16, 5), 'm013': (18, 3),
    **{f'm{i-5:03d}': (i, 5) for i in range(19, 30)},
    'm024': (29, 4), 'm025': (30, 5, 1), 'm027': (32, 5), 'm028': (33, 5),
    'm029': (34, 5), 'm030': (35, 4), 'm031': (36, 4),
    'm035': (43, 5), 'm036': (45, 4), 'm037': (47, 4),
    'm038': (49, 4), 'm039': (50, 4), 'm040': (51, 3),
    'm041': (52, 3), 'm042': (53, 3), 'm043': (55, 3),
    'm044': (56, 3),
    **{f'm{i-12:03d}': (i, 5) for i in range(57, 64)},
    **{f'm{i-12:03d}': (i, 5) for i in range(69, 75)},
    'm063': (74, 5, 1),
}
PLATTER_PHOTOS = {
    'm034': 'image.png',       # Medium platter, SAR 300
    'm033': 'image(1).png',    # Chef platter, SAR 500
    'm032': 'image(2).png',    # Shrimp Fins platter, SAR 600
    'm035': 'image(3).png',    # Mazagangia platter, SAR 250
    'm064': 'image(4).png',    # Gathering platter, SAR 400
    'm036': 'image(5).png',    # Saving platter, SAR 150
    'm039': 'image(6).png',    # Sea bream and potato tray, SAR 120
    'm038': 'image(7).png',    # Al Arees tray, SAR 250
}

def main():
    sheet = load_workbook(sys.argv[1]).active
    images = {}
    for image in sheet._images:
        key = image.anchor._from.row + 1, image.anchor._from.col + 1
        images.setdefault(key, []).append(image)
    OUT.mkdir(parents=True, exist_ok=True)
    for item, key in SOURCE.items():
        row, col, *ordinal = key
        entries = images.get((row, col), [])
        number = ordinal[0] if ordinal else 0
        if number >= len(entries):
            raise ValueError(f'{item}: no picture at {key}')
        im = Image.open(BytesIO(entries[number]._data())).convert('RGB')
        if item == 'm004':
            # The source graphic contains a different restaurant's masthead.
            # Keep only the owner's embedded picture of the red salad.
            im = im.crop((210, 318, 850, 608))
        # The owner workbook stores many dishes as compressed, very wide strips.
        # Restore them to a 4:3 viewing shape and use a solid neutral frame.
        if im.width / im.height > 2.5:
            im = im.resize((720, 540), Image.Resampling.LANCZOS)
        else:
            im = ImageOps.contain(im, (720, 720), Image.Resampling.LANCZOS)
        canvas = Image.new('RGB', (720, 720), '#edf1f2')
        canvas.paste(im, ((720-im.width)//2, (720-im.height)//2))
        target = OUT / f'{item}.webp'
        temp = target.with_suffix('.webp.tmp')
        canvas.save(temp, 'WEBP', quality=86)
        if temp.stat().st_size < 100:
            raise ValueError(f'{item}: failed to encode owner photo')
        temp.replace(target)
    if len(sys.argv) > 2:
        platter_dir = Path(sys.argv[2])
        for item, filename in PLATTER_PHOTOS.items():
            im = Image.open(platter_dir / filename).convert('RGB')
            if item == 'm032':
                im = im.crop((0, 240, im.width, 1010))
            if item == 'm035':
                im = im.crop((0, 340, im.width, 945))
            im = ImageOps.contain(im, (720, 720), Image.Resampling.LANCZOS)
            canvas = Image.new('RGB', (720, 720), '#edf1f2')
            canvas.paste(im, ((720-im.width)//2, (720-im.height)//2))
            target = OUT / f'{item}.webp'
            temp = target.with_suffix('.webp.tmp')
            canvas.save(temp, 'WEBP', quality=86)
            if temp.stat().st_size < 100:
                raise ValueError(f'{item}: failed to encode platter photo')
            temp.replace(target)
    for item in set(SOURCE) | (set(PLATTER_PHOTOS) if len(sys.argv) > 2 else set()):
        target = OUT / f'{item}.webp'
        with Image.open(target) as check:
            check.verify()
    print(f'Wrote {len(set(SOURCE)|set(PLATTER_PHOTOS))} owner photos to {OUT}')

if __name__ == '__main__':
    main()
