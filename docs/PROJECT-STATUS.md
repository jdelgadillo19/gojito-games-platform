# Gojito Games — project status

**Last updated:** 2026-05-23  
**Workspace:** `Projects/` (four repos: `gojito-platform`, `gojito-backend`, `cakery-bakery`, `calculator-cove`)  
**Canonical copy:** this file (also mirrored at `docs/PROJECT-STATUS.md` under the workspace root for local discovery)

Use this as the **session handoff**. Detailed acceptance checks: [`docs/LOGIN-SAVES-MVP.md`](../../docs/LOGIN-SAVES-MVP.md) (workspace). Investigation case file: `_bmad-output/implementation-artifacts/investigations/gojito-account-saves-investigation.md`.

---

## Milestone: account saves working (major hurdle cleared)

**User-verified (2026-05-23):** Logged-in progress **stores in Supabase and syncs across browsers/sessions** for Cakery (imperfect but functional). Hub login + embedded games share `gojito-auth`.

This is the first reliable end-to-end proof of the login/saves MVP — not production-polished, but no longer blocked on “saves never reach the cloud.”

---

## Current state (what works)

| Area | Status |
|------|--------|
| **Hub auth** | Google / email via Supabase; `HubAccountButton` + entitlement banner on hub |
| **Same-origin session** | `gojito-auth` storage key (`@gojito/shared`) shared by hub + `/cakerybakery/` + `/calculatorcove/` |
| **Cakery cloud saves** | `game_saves` rows per save id; upsert on create/update; sync on login (`cloudGameSaves.js`) |
| **Cakery cross-session read** | Incognito / second browser shows migrated saves (user confirmed) |
| **Cove settings cloud** | One row per user (`coveCloudSave.ts`); menu settings sync path exists |
| **Supabase schema fix** | Dropped erroneous `UNIQUE (user_id, game_id)` — see `supabase/game_saves_drop_user_game_unique.sql` |
| **Game portal chrome** | `GojitoGameChrome` top bar: hub link, tier, email/Guest, sign in/out on all routes |
| **Cove on hub** | Fixed `vite` `base` + `BrowserRouter` `basename` for `/calculatorcove/` (was blank screen) |
| **Combined hub build** | `npm run build:combined` copies games + injects static `portal-brand` |

---

## Known issues & follow-up (troubleshoot later)

| Item | Severity | Notes |
|------|----------|--------|
| **Sync imperfection** | Medium | User reports saves sync but not perfect — schedule dedicated troubleshooting pass |
| **Story slot layout** | Expected | `cakery_story_slots_v1` device-local; save blobs sync but slot grid may look empty on new device |
| **Architecture drift** | Doc | Games call Supabase direct for MVP; long-term target is platform SDK (`docs/ARCHITECTURE.md` interim note) |
| **Acceptance matrix incomplete** | Process | Rows 1–2, 5–7 in `LOGIN-SAVES-MVP.md` not all formally signed off |
| **Cove AccountToolbar** | Low | Replaced by minimal chrome; full account modal / “Refresh Guac” deferred |
| **Phase 3 backend** | Deferred | Worker KV, Stripe, Guac tier — `gojito-backend/docs/DEPLOY-PHASE3.md` |
| **Hub `npm run dev` vs static** | Ops | Embedded games need `build:combined` for latest bundles; Vite hub dev alone serves stale embeds |

---

## Supabase migrations (apply once per project)

1. `supabase/game_saves.sql`
2. `supabase/game_saves_rls_fix.sql` (if upsert RLS errors)
3. `supabase/game_saves_drop_user_game_unique.sql` (**required** for multi-save Cakery)

**Never re-add** `UNIQUE (user_id, game_id)` on `game_saves`.

---

## Local dev (quick reference)

```bash
# Hub + embedded games (recommended for saves + chrome testing)
cd gojito-platform && npm run build:combined && npm run dev:static
# → http://127.0.0.1:5173/

# Game repos alone (set VITE_GOJITO_HUB_URL=http://127.0.0.1:5173 in game .env)
cd cakery-bakery && npm run dev
cd calculator-cove && npm run dev
```

Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in hub + both games (same project). Optional: `VITE_GOJITO_API_URL`, `VITE_GOJITO_HUB_URL`.

---

## Repo map (this push)

| Repo | Remote | What changed in this milestone |
|------|--------|--------------------------------|
| `gojito-platform` | `gojito-games-platform` | Supabase SQL, combined build inject, hub auth UI, embedded bundles, ARCHITECTURE MVP note |
| `cakery-bakery` | `cakery-bakery-build` | Cloud saves, `GojitoGameChrome`, shared auth |
| `calculator-cove` | `calculator_cove` | Cove cloud settings, chrome, router basename + vite base |

`packages/gojito-shared` lives under workspace root (not a separate git repo); consumed via `file:` deps.

---

## Git branches

- `main` = publish / integration baseline per `WORKSPACE.md`
- Feature work has been landing on `main` for this MVP spike

---

## Related artifacts

- **Plan commitment (2026-05-31):** [`docs/planning-artifacts/PLAN-COMMITMENT-2026.05.31.md`](./planning-artifacts/PLAN-COMMITMENT-2026.05.31.md)
- Sprint change proposal: `_bmad-output/planning-artifacts/sprint-change-proposal-2026-05-23.md`
- Sprint status YAML: `_bmad-output/planning-artifacts/sprint-status-login-saves-mvp.yaml`
- Next session prompt: [`NEXT-SESSION.md`](./NEXT-SESSION.md)
