#!/bin/bash
# Start a new interactive deck from the template.
# Usage: bash new_deck.sh <folder-name> "<Deck Title>" [parent-dir, default ~/Desktop] [port, default 4330]
# Copies assets/template to <parent>/<folder-name>, sets the title, and adds a preview entry
# (python http.server on 127.0.0.1:<port>) to <parent>/.claude/launch.json so preview_start can open it.
set -e
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
NAME="$1"; TITLE="${2:-$1}"; PARENT="${3:-$HOME/Desktop}"; PORT="${4:-4330}"
[ -z "$NAME" ] && { echo "usage: new_deck.sh <folder-name> \"<Deck Title>\" [parent] [port]"; exit 1; }
DEST="$PARENT/$NAME"
[ -e "$DEST" ] && { echo "$DEST already exists; pick another name or delete it yourself"; exit 1; }
cp -R "$SKILL/assets/template" "$DEST"
mkdir -p "$DEST/dist" "$DEST/deploy"
python3 -I - "$DEST/index.html" "$TITLE" <<'EOF'
import sys
p, t = sys.argv[1], sys.argv[2]
s = open(p).read().replace('<title>Deck Title</title>', f'<title>{t}</title>')
open(p, 'w').write(s)
EOF
python3 -I - "$PARENT/.claude/launch.json" "$NAME" "$DEST" "$PORT" <<'EOF'
import sys, json, os
path, name, dest, port = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
os.makedirs(os.path.dirname(path), exist_ok=True)
j = json.load(open(path)) if os.path.exists(path) else {"version": "0.0.1", "configurations": []}
j["configurations"] = [c for c in j["configurations"] if c.get("name") != name]
j["configurations"].append({"name": name, "runtimeExecutable": "python3", "runtimeArgs": ["-m", "http.server", str(port), "--bind", "127.0.0.1", "--directory", dest], "port": port})
json.dump(j, open(path, "w"), indent=2)
EOF
echo "Created $DEST"
echo "Preview: preview_start name=\"$NAME\" then open http://127.0.0.1:$PORT/index.html (localhost can fail; use 127.0.0.1)"
