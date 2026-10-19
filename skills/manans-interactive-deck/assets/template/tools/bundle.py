# Bundles the deck into ONE self-contained HTML file: CSS, JS, images, audio, the Satoshi font
# and only the Phosphor icons the deck uses are inlined. Only Google Fonts still load from outside.
#
# Usage (from the deck folder):  python3 -I tools/bundle.py . dist/deck.html
# Every `url(assets/...)` in styles.css, every `src="assets/..."` in index.html and every
# `'assets/...'` string in the JS files is turned into a data URI, so nothing needs listing here.
import re, base64, sys, os, subprocess

P, OUT = sys.argv[1], sys.argv[2]
MIME = {'.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
        '.gif': 'image/gif', '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.woff2': 'font/woff2'}

def fetch(u): return subprocess.run(['curl', '-sfL', u], capture_output=True, check=True).stdout
def b64(data, mime): return f"data:{mime};base64,{base64.b64encode(data).decode()}"
def asset(rel):
    path = os.path.join(P, rel)
    return b64(open(path, 'rb').read(), MIME[os.path.splitext(rel)[1].lower()])

html = open(f'{P}/index.html').read()
css = open(f'{P}/styles.css').read()
js = {n: open(f'{P}/{n}').read() for n in ('sound.js', 'milo.js', 'deck.js')}

# ---------- fonts: Satoshi (fontshare) + the Phosphor icons actually used ----------
sat = fetch('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,800,900&display=swap').decode()
sat = re.sub(r"url\('(//cdn\.fontshare\.com[^']+\.woff2)'\)\s*format\('woff2'\)", lambda m: f"url('{b64(fetch('https:' + m.group(1)), 'font/woff2')}') format('woff2')", sat)
sat = re.sub(r",\s*url\('//cdn\.fontshare\.com[^']+'\)\s*format\('[^']+'\)", "", sat)
srcs = html + ''.join(js.values())
phcss = ''
for weight, cls in (('bold', 'ph-bold'), ('fill', 'ph-fill')):
    sheet = fetch(f'https://unpkg.com/@phosphor-icons/web@2.1.1/src/{weight}/style.css').decode()
    names = set(re.findall(rf'\.{cls}\.ph-([a-z0-9-]+):before', sheet))
    # icons named directly (ph-x) or as plain strings in JS ('eye', sticker('hand-heart'))
    used = {n for n in names if f'ph-{n}' in srcs or f"'{n}'" in srcs}
    font = b64(fetch(f'https://unpkg.com/@phosphor-icons/web@2.1.1/src/{weight}/Phosphor-{weight.capitalize()}.woff2'), 'font/woff2')
    face = re.sub(r'src:.*?;', f'src: url("{font}") format("woff2");', re.search(r'@font-face\s*\{.*?\}', sheet, re.S).group(0), flags=re.S)
    base = re.search(rf'\.{cls}\s*\{{.*?\}}', sheet, re.S).group(0)
    rules = [m.group(0) for m in re.finditer(rf'\.{cls}\.ph-([a-z0-9-]+):before\s*\{{[^}}]*\}}', sheet) if m.group(1) in used]
    phcss += '\n'.join([face, base] + rules) + '\n'

# ---------- local assets -> data URIs ----------
css = re.sub(r'url\((assets/[^)"\']+)\)', lambda m: f'url("{asset(m.group(1))}")', css)
html = re.sub(r'src="(assets/[^"]+)"', lambda m: f'src="{asset(m.group(1))}"', html)
for n in js:
    js[n] = re.sub(r"'(assets/[^']+)'", lambda m: repr(asset(m.group(1))), js[n])

title = (re.search(r'<title>(.*?)</title>', html) or [None, 'Presentation'])[1]
body = html[html.index('<body>') + 6: html.index('</body>')]
body = re.sub(r'<script src="[^"]+"></script>', '', body)
left = re.findall(r'''["'(]assets/[\w./-]+''', body + css + ''.join(js.values()))   # real references only, not prose
assert not left, f'unbundled assets left: {left[:5]}'

out = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Hedvig+Letters+Serif:opsz@12..24&family=Schoolbell&display=swap" rel="stylesheet">
<style>
{sat}
{phcss}
{css}
:root {{ color-scheme: light; }}
@media (prefers-reduced-motion: reduce) {{ #progress .wave .flow {{ animation: none !important; }} }}
</style>
</head>
<body>
{body}
<script>
{js['sound.js']}
</script>
<script>
{js['milo.js']}
</script>
<script>
{js['deck.js']}
</script>
</body>
</html>
'''
os.makedirs(os.path.dirname(OUT) or '.', exist_ok=True)
open(OUT, 'w').write(out)
print('bundled', OUT, os.path.getsize(OUT), 'bytes')
