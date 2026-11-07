#!/bin/bash
# Puts the site online at ONE link that never changes: https://<project>.vercel.app
# Usage (from the site folder): bash tools/deploy.sh [project-name, default: the folder name]
# The first run opens a browser for the Vercel login; the person does that themselves.
set -e
cd "$(dirname "$0")/.."
PROJECT="${1:-$(basename "$PWD")}"
[ -f .vercel/project.json ] || npx -y vercel@latest link --yes --project "$PROJECT"
npx -y vercel@latest deploy --prod --yes
rm -f .env.local
echo "Live at the project's production link (shown above as Aliased). Share only that one."
