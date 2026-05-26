#!/usr/bin/env bash
# Copy Vite hub build output to portal root for static hosting / combined deploy.
set -euo pipefail
PORTAL="$(cd "$(dirname "$0")/.." && pwd)"

if [[ ! -f "$PORTAL/dist/index.html" ]]; then
  echo "Missing $PORTAL/dist/index.html — run npm run build in gojito-platform first." >&2
  exit 1
fi

cp "$PORTAL/dist/index.html" "$PORTAL/index.html"
rm -rf "$PORTAL/assets"
cp -R "$PORTAL/dist/assets" "$PORTAL/assets"
echo "Hub bundle published to portal root (index.html + assets/)."
