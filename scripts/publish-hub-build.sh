#!/usr/bin/env bash
# Copy a freshly compiled Vite hub build to the portal root for static hosting.
# npm run build restores the Vite source index.html first, so this copy cannot
# republish a leftover hashed bundle. The rewrite of index.html is for static
# serve only; the next npm run dev / npm run build restores /src/main.tsx.
set -euo pipefail
PORTAL="$(cd "$(dirname "$0")/.." && pwd)"

if [[ ! -f "$PORTAL/dist/index.html" ]]; then
  echo "Missing $PORTAL/dist/index.html — run npm run build in gojito-platform first." >&2
  exit 1
fi

if grep -q 'src/main.tsx' "$PORTAL/dist/index.html"; then
  echo "dist/index.html still points at /src/main.tsx — vite build did not emit a hashed hub bundle." >&2
  exit 1
fi

HUB_JS="$(ls -1 "$PORTAL/dist/assets"/index-*.js 2>/dev/null | head -n 1 || true)"
if [[ -z "$HUB_JS" ]]; then
  echo "No hashed hub JS under dist/assets/index-*.js" >&2
  exit 1
fi
if ! grep -q 'gojitoRefreshEntitlements' "$HUB_JS" || ! grep -q 'id, display_name, email, tier' "$HUB_JS"; then
  echo "Refusing to publish: $HUB_JS is missing current Supabase entitlement-read logic." >&2
  exit 1
fi

cp "$PORTAL/dist/index.html" "$PORTAL/index.html"
mkdir -p "$PORTAL/assets"
rm -f "$PORTAL/assets"/index-*.js "$PORTAL/assets"/index-*.css
cp -R "$PORTAL/dist/assets/." "$PORTAL/assets/"
echo "Hub bundle published to portal root from current vite build ($(basename "$HUB_JS"))."
