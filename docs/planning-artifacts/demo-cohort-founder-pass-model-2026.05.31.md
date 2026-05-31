# Gojito demo cohort & Founder Pass model

**Date:** 2026-05-31  
**Status:** **Committed** 2026-05-31 — see [`PLAN-COMMITMENT-2026.05.31.md`](./PLAN-COMMITMENT-2026.05.31.md)  
**Related:** [`gojito-roadmap-action-plan-2026.05.31.md`](./gojito-roadmap-action-plan-2026.05.31.md)

---

## Summary

Three **entitlement cohorts** on one technical stack (`profiles.tier` + `grant_source` + `guac_expires_at`):

| Cohort | `grant_source` | Access | When |
|--------|----------------|--------|------|
| **Wind-test click** | `demo_interest` | Full guac now (pre-founder) | User taps fake-door / “Unlock beta preview” |
| **Founder Pass buyer** | `founder_pass` | Lifetime guac — **all current + future Gojito game content** | Pays ~$12 at launch offer |
| **Launch helper (declined founder)** | `demo_helper` | Timed guac (**6 months** default) | Helped demo run but skips Founder Pass |
| **Everyone else** | `null` / beef | Free tier | Default |

After `demo_helper` expires → downgrade to **beef** like any free user (unless they buy later).

---

## Phase 1 — Pre-founder wind test (NOW)

**Goal:** Measure interest + pressure-test saves/entitlements without charging.

**Behavior:**

1. User hits locked content (Cakery village, Cove **Island Fleets**, nav “Request full access”).
2. Client upserts `access_requests` (source + context_note).
3. Supabase trigger [`access_requests_auto_grant.sql`](../../supabase/access_requests_auto_grant.sql) sets:
   - `profiles.tier = guac`
   - `profiles.grant_source = demo_interest`
   - `profiles.guac_expires_at = null` (full access during wind test)
4. Client polls tier; user sees **Full access** in nav (sign out/in if stale).

**SQL to apply (once, in order):**

1. `access_requests.sql`
2. `profiles_grant_source.sql`
3. `access_requests_auto_grant.sql`

**Not charging money in this phase.** Clicks = guac + row in `access_requests` for analytics.

---

## Phase 2 — Founder Pass offer (demo cohort only)

**Audience:** Everyone with `grant_source = demo_interest` (and anyone else you invite manually).

**Offer:**

- **Founder Pass ~$12** — lifetime full access to **all current and future Gojito game content** (offer copy may refine).
- Honest copy: early supporter, growing arcade, helps fund development.

**If they buy:**

```sql
update public.profiles
set tier = 'guac',
    grant_source = 'founder_pass',
    guac_expires_at = null,
    updated_at = now()
where id = '<uuid>';
```

**If they decline** (thank-you for helping launch):

```sql
update public.profiles
set tier = 'guac',
    grant_source = 'demo_helper',
    guac_expires_at = now() + interval '6 months',
    updated_at = now()
where id = '<uuid>';
```

**After `guac_expires_at`:** run downgrade (manual or scheduled):

```sql
update public.profiles
set tier = 'beef', grant_source = null, guac_expires_at = null, updated_at = now()
where grant_source = 'demo_helper'
  and guac_expires_at is not null
  and guac_expires_at < now();
```

---

## Phase 3 — Public launch (post gate)

- New users: **beef** default; fake-door available but **does not auto-grant** after Founder Pass opens (disable `access_requests_auto_grant` trigger or replace behavior).
- Founder Pass may stay open for a limited window or close.
- Subscription (`Gojito Plus`) and **burrito parent accounts** — see [`parent-account-burrito-model-2026.05.31.md`](./parent-account-burrito-model-2026.05.31.md) — only after 3+ games / parent dashboard foundation.

---

## Decisions locked (committed 2026-05-31)

| Decision | Value |
|----------|--------|
| `demo_helper` thank-you duration | **6 months** (default; personalize only if needed) |
| Founder Pass scope | **Lifetime** — all current + future **Gojito game content** |
| Founder Pass price | **~$12** one-time |
| Wind-test auto-grant | Until Founder Pass opens; then off for new signups |
| Plan commitment | [`PLAN-COMMITMENT-2026.05.31.md`](./PLAN-COMMITMENT-2026.05.31.md) |

---

## Current build changes (2026-05-31)

| Change | Location |
|--------|----------|
| Island Fleets guac gate (local) | `calculator-cove/src/lib/betaGates.ts` — `ISLAND_FLEETS_GATED = true` |
| Locked mode → request access | `MenuScreen.tsx` — tap locked Island Fleets |
| Shared fake-door client | `packages/gojito-shared/src/access.js` — `submitFullAccessRequest` |
| Auto-grant trigger | `supabase/access_requests_auto_grant.sql` |
| Cohort column | `supabase/profiles_grant_source.sql` |
| Cakery modal copy | `UpgradeModal.jsx` — “Unlock beta preview” |

**After pulling:** run Cove/Cakery changes, then `cd gojito-platform && npm run build:combined`.

---

## Cohort queries

```sql
-- Wind-test participants
select id, email, grant_source, guac_expires_at, created_at
from public.profiles
where grant_source = 'demo_interest';

-- All access requests with context
select * from public.access_requests order by created_at desc;

-- Helpers nearing expiry
select id, email, guac_expires_at
from public.profiles
where grant_source = 'demo_helper'
  and guac_expires_at is not null
order by guac_expires_at;
```
