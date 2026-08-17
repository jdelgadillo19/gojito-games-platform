#!/usr/bin/env bash
# Merge hub + both Vite games into one folder for static path-hosted deploy.
set -euo pipefail
PORTAL="$(cd "$(dirname "$0")/.." && pwd)"
PROJECTS="$(cd "$PORTAL/.." && pwd)"

CAKERY="$PROJECTS/cakery-bakery"
COVE="$PROJECTS/calculator-cove"
NAV_PKG="$PORTAL/packages/gojito-nav"

echo "Syncing portal-chrome.css from @gojito/nav..."
cp "$NAV_PKG/portal-chrome.css" "$PORTAL/portal-chrome.css"

echo "Building hub (GojitoNav + auth)..."
(cd "$PORTAL" && npm run publish:hub)

echo "Building Cakery (base /cakerybakery/)..."
(cd "$CAKERY" && GOJITO_ASSET_BASE=/cakerybakery/ npm run build)

echo "Building Calculator Cove (base /calculatorcove/)..."
(cd "$COVE" && GOJITO_ASSET_BASE=/calculatorcove/ npm run build)

echo "Copying into portal..."
rm -rf "$PORTAL/cakerybakery" "$PORTAL/calculatorcove"
mkdir -p "$PORTAL/cakerybakery" "$PORTAL/calculatorcove"
cp -R "$CAKERY/dist/"* "$PORTAL/cakerybakery/"
cp -R "$COVE/dist/"* "$PORTAL/calculatorcove/"

inject_portal_chrome_css() {
  local html="$1"
  node - "$html" <<'NODE'
const fs = require("node:fs");
const file = process.argv[2];
const text = fs.readFileSync(file, "utf8");
if (!text.includes("portal-chrome.css")) {
  fs.writeFileSync(
    file,
    text.replace(
      "</head>",
      '    <link rel="stylesheet" href="/portal-chrome.css" />\n  </head>',
    ),
    "utf8",
  );
}
NODE
}

echo "Ensuring game shells load shared portal-chrome.css..."
inject_portal_chrome_css "$PORTAL/cakerybakery/index.html"
inject_portal_chrome_css "$PORTAL/calculatorcove/index.html"

echo "Done. Portal bundle is ready at: $PORTAL"
echo "Deploy the portal directory to your static host (e.g. Supabase Storage + CDN or any static file host)."
