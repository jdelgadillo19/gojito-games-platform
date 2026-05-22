# Gojito — startup prompt (next session)

Copy everything in the block below into a new Cursor chat to resume with context.

---

```
Gojito Games — resume after account-saves milestone (2026-05-23).

Read first:
- gojito-platform/docs/PROJECT-STATUS.md
- docs/LOGIN-SAVES-MVP.md (acceptance matrix)
- _bmad-output/implementation-artifacts/investigations/gojito-account-saves-investigation.md (if debugging saves)

What works now:
- Hub + games share gojito-auth; Cakery game_saves upsert/list/sync; user confirmed cross-browser save migration.
- Supabase: do NOT re-add UNIQUE (user_id, game_id). Migrations in gojito-platform/supabase/.
- GojitoGameChrome on all game routes (hub link + tier + sign in/out).
- Calculator Cove: vite base + BrowserRouter basename for /calculatorcove/.

Local test path:
  cd gojito-platform && npm run build:combined && npm run dev:static

Goal for this session (pick one with me):
1. Troubleshoot imperfect sync (merge conflicts, timing, story slots vs save blobs).
2. Finish LOGIN-SAVES-MVP acceptance rows 5–7 (Cove settings, guest path, document build path).
3. Production deploy smoke (Pages + env vars + redirect URLs).

Constraints:
- Four Gojito repos only (gojito-platform, gojito-backend, cakery-bakery, calculator-cove).
- No quick-dev churn on save layer without a failing matrix row.
- Do not commit .env or secrets.
```

---

## Suggested first message (short)

> Continue Gojito login/saves work. Read `gojito-platform/docs/PROJECT-STATUS.md` and help me troubleshoot remaining sync quirks / finish the acceptance matrix.
