# Gojito entitlements — manual full access (no checkout UI)

Games read **`profiles.tier`** after sign-in (`beef` = free-only, `guac` = full access). Cakery maps guac → `full` build tier; Calculator Cove unlocks premium menu modes.

## 1. Apply Supabase schema

In the Supabase SQL editor for your project, run (in order):

1. [supabase/profiles.sql](../supabase/profiles.sql)
2. **[supabase/profiles_entitlement_sync_fix.sql](../supabase/profiles_entitlement_sync_fix.sql)** — required if `UPDATE ... SET tier = 'guac'` returns `beef` in `RETURNING` (legacy DB trigger).
3. **[supabase/profiles_grant_source.sql](../supabase/profiles_grant_source.sql)** — cohort tracking (`founder_pass`, `demo_helper`, `demo_interest`).
4. **[supabase/access_requests.sql](../supabase/access_requests.sql)** — fake-door / full-access request rows.
5. **[supabase/access_requests_auto_grant.sql](../supabase/access_requests_auto_grant.sql)** — wind-test: pending request → auto guac (disable before public launch).
6. Existing save migrations if not applied: `game_saves.sql`, `game_saves_rls_fix.sql`, `game_saves_drop_user_game_unique.sql`

## 2. Keep backend URL unset (Supabase-driven tier)

Until `gojito-backend` is deployed **and** you grant Guac via admin API, leave **`VITE_GOJITO_API_URL` empty** in:

- `gojito-platform/.env` (or omit the variable)
- `cakery-bakery/.env`
- `calculator-cove/.env`

If the API URL is set but KV has no grant, login sync will **overwrite** manual `guac` in Supabase with `beef`.

## 3. Grant full access manually

1. User signs in once (Google) on hub or a game — creates `profiles` row with `tier = beef`.
2. In Supabase Table Editor or SQL:

```sql
update public.profiles
set tier = 'guac', updated_at = now()
where id = '<supabase-auth-user-uuid>'
returning id, tier, guac_active, is_premium;
```

`RETURNING` must show `tier = guac`, `guac_active = true`, `is_premium = true`. If it shows `beef`, run `profiles_entitlement_sync_fix.sql` first.

**Note:** Many Gojito Supabase projects use enum `account_tier` for `profiles.tier` (not plain `text`). The fix script casts via `::text` and assigns `'guac'::account_tier` / `'beef'::account_tier`. If the enum type lives in another schema, change `public.account_tier` in the SQL to match (`select enum_range(null::account_tier);` in SQL editor).

3. User signs out and back in, or wait up to 5 minutes (games poll `profiles.tier` when `VITE_GOJITO_API_URL` is unset).

## 4. Verify

```bash
cd gojito-platform && npm run verify:profiles
```

Then in the browser:

- Top bar tier pill: **Guac**
- Cakery: packager / recipe book / extra villages unlocked
- Calculator Cove: Battleship and large boards unlocked

## 5. Hub embedded games

After changing game source:

```bash
cd gojito-platform && npm run build:combined
```

## Backend path (optional)

When ready for KV + admin API instead of SQL grants, see [gojito-backend/docs/DEPLOY-PHASE3.md](../../gojito-backend/docs/DEPLOY-PHASE3.md) and set `VITE_GOJITO_API_URL` on all three frontends together.
