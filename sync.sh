#!/bin/bash
# Sync Yahoo rosters for all postdraft leagues, rebuild, and deploy.
# Run from the repo root: bash sync.sh
set -e

cd "$(dirname "$0")/dynasty-draft"

echo "==> Syncing SouthOssetian..."
python3 data/build.py --skip-zar --league south_ossetian

echo "==> Syncing Spaghett..."
python3 data/build.py --skip-zar --league spaghett

echo "==> Building..."
npm run build

echo "==> Committing..."
cd ..
git add dynasty-draft/data/targets_south_ossetian.json \
        dynasty-draft/data/targets_spaghett.json \
        dynasty-draft/data/yahoo_data_south_ossetian.json \
        dynasty-draft/data/yahoo_data_spaghett.json \
        dynasty-draft/dist/

git diff --cached --quiet && echo "Nothing changed." && exit 0

git commit -m "Yahoo sync $(date '+%Y-%m-%d %H:%M')"
git push
echo "==> Done — Vercel deploying."
