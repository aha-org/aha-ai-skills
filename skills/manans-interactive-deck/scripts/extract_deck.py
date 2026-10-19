#!/usr/bin/env python3
"""Unpack a slide deck so it can be rebuilt as an interactive presentation.

Usage:  python3 -I extract_deck.py <deck.pdf|deck.pptx|slide.svg> <out_dir>

Writes into out_dir:
  pages/pNN.png      every slide rendered (PDF via pdftoppm, or macOS PDFKit as a fallback)
  sheets/sheetN.png  4 slides per image, for looking at the whole deck quickly
  text.md            the text of every slide, in order
  images/            every embedded image once (deduplicated), as PNG with alpha kept
  images/sheet.png   all extracted images on one contact sheet with their names
  qr.txt             any QR codes found (page/image -> decoded URL), macOS only
PPTX is converted to PDF with LibreOffice when it is installed; otherwise export to PDF first.
SVG (e.g. a Google Slides "Download as SVG") gives images + a rendered preview.
"""
import sys, os, re, base64, hashlib, shutil, subprocess, glob

HERE = os.path.dirname(os.path.abspath(__file__))
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
for d in ('pages', 'sheets', 'images'): os.makedirs(os.path.join(out, d), exist_ok=True)

try:
    from PIL import Image, ImageDraw
except ImportError:
    sys.exit('Pillow is needed: python3 -m pip install pillow')


def sheet(paths, dest, cols=2, cell=(960, 540), label=False):
    if not paths: return
    rows = (len(paths) + cols - 1) // cols
    canvas = Image.new('RGB', (cols * cell[0], rows * (cell[1] + (24 if label else 0))), (205, 205, 210))
    d = ImageDraw.Draw(canvas)
    for k, p in enumerate(paths):
        im = Image.open(p).convert('RGBA'); im.thumbnail((cell[0] - 20, cell[1] - 20))
        bg = Image.new('RGBA', im.size, (120, 120, 140, 255)); bg.alpha_composite(im)
        x, y = (k % cols) * cell[0] + 10, (k // cols) * (cell[1] + (24 if label else 0)) + (22 if label else 10)
        canvas.paste(bg.convert('RGB'), (x, y))
        if label: d.text((x, y - 18), os.path.basename(p), fill=(0, 0, 0))
    canvas.save(dest)


def decode_qr(path):
    binp = os.path.join(out, '.decode_qr')
    if sys.platform != 'darwin': return None
    if not os.path.exists(binp):
        r = subprocess.run(['swiftc', '-O', os.path.join(HERE, 'decode_qr.swift'), '-o', binp], capture_output=True)
        if r.returncode: return None
    r = subprocess.run([binp, path], capture_output=True, text=True)
    return r.stdout.strip() or None


ext = os.path.splitext(src)[1].lower()
if ext in ('.pptx', '.ppt', '.key'):
    soffice = shutil.which('soffice') or '/Applications/LibreOffice.app/Contents/MacOS/soffice'
    if not os.path.exists(soffice):
        sys.exit('No LibreOffice found. Export the deck to PDF (File > Export > PDF) and run this on the PDF.')
    subprocess.run([soffice, '--headless', '--convert-to', 'pdf', '--outdir', out, src], check=True)
    src = os.path.join(out, os.path.splitext(os.path.basename(src))[0] + '.pdf'); ext = '.pdf'

images_seen = {}

if ext == '.svg':
    s = open(src).read()
    for i, m in enumerate(re.finditer(r'xlink:href="data:image/(\w+);base64,([A-Za-z0-9+/=]+)"', s)):
        data = base64.b64decode(m.group(2)); h = hashlib.md5(data).hexdigest()
        if h in images_seen: continue
        p = os.path.join(out, 'images', f'img{len(images_seen):02d}.png')
        tmp = p + '.' + m.group(1); open(tmp, 'wb').write(data)
        Image.open(tmp).save(p); os.remove(tmp); images_seen[h] = p
    if sys.platform == 'darwin':
        subprocess.run(['qlmanage', '-t', '-s', '1600', '-o', os.path.join(out, 'pages'), src], capture_output=True)
    open(os.path.join(out, 'text.md'), 'w').write('# ' + os.path.basename(src) + '\n\n' + '\n'.join(re.findall(r'>([^<>]{2,})</text', s)) + '\n')
elif ext == '.pdf':
    import importlib.util
    if importlib.util.find_spec('pypdf') is None: sys.exit('pypdf is needed: python3 -m pip install pypdf')
    import pypdf
    reader = pypdf.PdfReader(src)
    # text
    with open(os.path.join(out, 'text.md'), 'w') as f:
        for i, page in enumerate(reader.pages):
            f.write(f'## Slide {i + 1}\n\n{(page.extract_text() or "").strip()}\n\n')
    # renders
    if shutil.which('pdftoppm'):
        subprocess.run(['pdftoppm', '-png', '-r', '120', src, os.path.join(out, 'pages', 'p')], check=True)
        for p in glob.glob(os.path.join(out, 'pages', 'p-*.png')):
            n = int(re.search(r'-(\d+)\.png$', p).group(1)); os.rename(p, os.path.join(out, 'pages', f'p{n:02d}.png'))
    elif sys.platform == 'darwin':
        binp = os.path.join(out, '.render_pdf')
        subprocess.run(['swiftc', '-O', os.path.join(HERE, 'render_pdf.swift'), '-o', binp], check=True)
        subprocess.run([binp, src, os.path.join(out, 'pages'), '1.0'], check=True)
    else:
        print('No renderer (install poppler for pdftoppm); skipping page images.')
    # embedded images, deduplicated
    for i, page in enumerate(reader.pages):
        try:
            for im in page.images:
                h = hashlib.md5(im.data).hexdigest()
                if h in images_seen: continue
                p = os.path.join(out, 'images', f'img{len(images_seen):02d}_p{i + 1}.png')
                im.image.save(p); images_seen[h] = p
        except Exception as e:
            print('image extraction failed on slide', i + 1, e)
else:
    sys.exit(f'Unsupported file type: {ext}')

pages = sorted(glob.glob(os.path.join(out, 'pages', '*.png')))
for k in range(0, len(pages), 4):
    sheet(pages[k:k + 4], os.path.join(out, 'sheets', f'sheet{k // 4 + 1}.png'))
imgs = sorted(images_seen.values())
sheet(imgs, os.path.join(out, 'images', 'sheet.png'), cols=4, cell=(400, 300), label=True)

found = []
for p in imgs + pages:
    url = decode_qr(p)
    if url: found.append(f'{os.path.relpath(p, out)} -> {url}')
open(os.path.join(out, 'qr.txt'), 'w').write('\n'.join(found) + ('\n' if found else ''))

print(f'{len(pages)} slides rendered, {len(imgs)} unique images, {len(found)} QR codes')
print('look at:', os.path.join(out, 'sheets'), 'and', os.path.join(out, 'images', 'sheet.png'))
