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

inject_portal_chrome() {
  local html="$1"
  python3 - "$html" <<'PY'
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
text = path.read_text(encoding="utf-8")
if "portal-chrome.css" not in text:
    text = text.replace(
        "</head>",
        '    <link rel="stylesheet" href="/portal-chrome.css" />\n  </head>',
        1,
    )
if "portal-brand" not in text:
    chip = (
        '    <a class="portal-brand" href="/" aria-label="Gojito Games — home">\n'
        '      <img src="/gojito-games-hub-icon.svg" width="26" height="26" alt="" decoding="async" />\n'
        "    </a>\n"
    )
    text = text.replace('<div id="root"></div>', chip + '    <div id="root"></div>', 1)
path.write_text(text, encoding="utf-8")
PY
}

echo "Injecting static portal chrome into game index.html..."
inject_portal_chrome "$PORTAL/cakerybakery/index.html"
inject_portal_chrome "$PORTAL/calculatorcove/index.html"

echo "Done. Deploy with: wrangler pages deploy \"$PORTAL\" --project-name=gojito-games-portal --branch=main"
