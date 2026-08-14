#!/usr/bin/env bash
# Keep Vite's HTML entry as source (/src/main.tsx). publish-hub-build.sh rewrites
# index.html to a hashed bundle for static hosting; that rewrite must never become
# the next vite/dev input (that silently serves a stale hub).
set -euo pipefail
PORTAL="$(cd "$(dirname "$0")/.." && pwd)"
INDEX="$PORTAL/index.html"
SNAP="$PORTAL/.vite-index.html"

if [[ ! -f "$INDEX" ]]; then
  echo "Missing $INDEX" >&2
  exit 1
fi

if grep -q 'src/main.tsx' "$INDEX"; then
  cp "$INDEX" "$SNAP"
  exit 0
fi

if [[ -f "$SNAP" ]] && grep -q 'src/main.tsx' "$SNAP"; then
  cp "$SNAP" "$INDEX"
  echo "Restored Vite source index.html (replaced a published hashed hub bundle)."
  exit 0
fi

cat >&2 <<'EOF'
index.html is a published hub bundle (hashed /assets/index-*.js) and no Vite
source snapshot exists at .vite-index.html.

Vite must compile src/main.tsx. Restore index.html so it contains:
  <script type="module" src="/src/main.tsx"></script>
Then re-run npm run build / npm run dev.
EOF
exit 1
