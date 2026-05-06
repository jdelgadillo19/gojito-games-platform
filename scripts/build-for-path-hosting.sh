#!/usr/bin/env bash
# Merge hub + both Vite games into one folder for a single Cloudflare Pages deploy.
set -euo pipefail
PORTAL="$(cd "$(dirname "$0")/.." && pwd)"
PROJECTS="$(cd "$PORTAL/.." && pwd)"

CAKERY="$PROJECTS/cakery-bakery"
COVE="$PROJECTS/calculator-cove"

echo "Building Cakery (base /cakerybakery/)..."
(cd "$CAKERY" && GOJITO_ASSET_BASE=/cakerybakery/ npm run build)

echo "Building Calculator Cove (base /calculatorcove/)..."
(cd "$COVE" && GOJITO_ASSET_BASE=/calculatorcove/ npm run build)

echo "Copying into portal..."
rm -rf "$PORTAL/cakerybakery" "$PORTAL/calculatorcove"
mkdir -p "$PORTAL/cakerybakery" "$PORTAL/calculatorcove"
cp -R "$CAKERY/dist/"* "$PORTAL/cakerybakery/"
cp -R "$COVE/dist/"* "$PORTAL/calculatorcove/"

echo "Done. Deploy with: wrangler pages deploy \"$PORTAL\" --project-name=gojito-games-portal --branch=main"
