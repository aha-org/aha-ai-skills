#!/bin/bash
# Renders a page to a PNG at 2x (for mailers, social posts, anything sent as an image).
# Usage: bash export_png.sh <url> <width> <height> <out.png>
# e.g.   bash export_png.sh http://127.0.0.1:4750/mailer.html 880 3200 mailer.png
# Uses Google Chrome if it's installed; otherwise Playwright's Chromium (downloaded once).
set -e
URL="$1"; W="${2:-880}"; H="${3:-2400}"; OUT="${4:-export.png}"
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ -x "$CH" ]; then
  "$CH" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=2 --window-size=$W,$H \
    --virtual-time-budget=8000 --screenshot="$(cd "$(dirname "$OUT")" && pwd)/$(basename "$OUT")" "$URL" 2>/dev/null
else
  npx -y playwright@1.47.2 install chromium >/dev/null
  npx -y playwright@1.47.2 screenshot --viewport-size="$W,$H" --wait-for-timeout=4000 "$URL" "$OUT"
  echo "(Playwright renders at 1x; set the page's CSS to double size if you need 2x.)"
fi
ls -lh "$OUT"
