#!/bin/bash
# Start a fresh Aha app prototype (Expo, React Native) with the Aha kit.
# Use this only when the person can't use the team prototype (github.com/aha-org/aha-app-prototype).
# Usage: bash new_app.sh <folder-name> [parent-dir, default ~/Desktop]
set -e
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
NAME="$1"; PARENT="${2:-$HOME/Desktop}"
[ -z "$NAME" ] && { echo "usage: new_app.sh <folder-name> [parent]"; exit 1; }
DEST="$PARENT/$NAME"
[ -e "$DEST" ] && { echo "$DEST already exists; pick another name"; exit 1; }
cd "$PARENT"
npx -y create-expo-app@latest "$NAME" --template blank-typescript --yes
cd "$DEST"
# the libraries the kit uses, at the versions that match this Expo SDK
npx expo install @shopify/react-native-skia react-native-reanimated react-native-worklets react-native-svg \
  react-native-gesture-handler react-native-safe-area-context expo-haptics expo-font expo-status-bar \
  @expo-google-fonts/schoolbell react-native-web react-dom @expo/metro-runtime
# the kit
cp -R "$SKILL/assets/kit/src" ./src
cp "$SKILL/assets/kit/App.tsx" ./App.tsx
cp "$SKILL/assets/kit/index.web.ts" ./index.web.ts
# Skia on the web: CanvasKit must be served from public/ and loaded before the app (index.web.ts does that)
mkdir -p public && cp node_modules/canvaskit-wasm/bin/full/canvaskit.wasm public/
# entry "index" (not "index.ts") so the web build picks index.web.ts
node -e 'const f="package.json",p=require("./"+f);p.main="index";require("fs").writeFileSync(f,JSON.stringify(p,null,2)+"\n")'
# Satoshi, downloaded from Fontshare for this machine (its licence doesn't let us ship the files)
mkdir -p assets/fonts .tmp-fonts
curl -sfL -o .tmp-fonts/satoshi.zip https://api.fontshare.com/v2/fonts/download/satoshi
unzip -q -o .tmp-fonts/satoshi.zip -d .tmp-fonts
for w in Regular Medium Bold; do cp ".tmp-fonts/Satoshi_Complete/Fonts/OTF/Satoshi-$w.otf" assets/fonts/; done
rm -rf .tmp-fonts
echo "assets/fonts/Satoshi-*" >> .gitignore
echo
echo "Created $DEST"
echo "Run it:  cd \"$DEST\" && npx expo start   (w = browser, or scan the QR with Expo Go on a phone)"
