# Gojito parent account structure — “Burrito” model

**Date:** 2026-05-31  
**Last updated:** 2026-05-31 (multi-burrito linking, naming locked)  
**Status:** Planning sketch — **committed direction**, implementation deferred  
**Plan:** [`PLAN-COMMITMENT-2026.05.31.md`](./PLAN-COMMITMENT-2026.05.31.md)  
**Author:** Jesse  
**Related:** [`demo-cohort-founder-pass-model-2026.05.31.md`](./demo-cohort-founder-pass-model-2026.05.31.md), [`monetization-party-plan-2026.05.31.md`](./monetization-party-plan-2026.05.31.md)

---

## Why this exists

Today Gojito is **one Supabase auth user → one `profiles` row → one tier** (beef/guac). That works for the wind test and Founder Pass, but parents and teachers need:

- Multiple kids/students under one paying adult
- Progress visibility without sharing one login
- Volume pricing (cheaper than N separate founder accounts)
- **Home + school** — same child, multiple caring adults, coordinated progress
- **Parent-controlled social** — leaderboards and interaction without an open Roblox-style stranger box

Burrito is **one modality**, not the only one. Solo sign-up stays valid forever.

---

## Account modalities (all coexist)

| Modality | Who | Use case |
|----------|-----|----------|
| **Solo flat account** | Any individual | Adult plays alone, teen self-serve, Founder Pass holder without kids |
| **Burrito (home)** | Parent / guardian | Household container — kids, billing, progress |
| **Burrito (teacher)** | Teacher | Class container — roster, paid content for students, class-scoped social |

A person can hold **multiple roles**: Sarah has a home burrito *and* is linked to Mrs. Smith’s teacher burrito as Jimmy’s parent.

---

## Naming (locked)

| Term | Meaning |
|------|---------|
| **Bean** | **Account-less / guest player only** — no change to today’s nav (`Guest` state). Not a child profile name. |
| **Beef** | Free **content** tier on a signed-in profile (solo or child) |
| **Guac** | Premium **content** tier on a signed-in profile |
| **Burrito** | Paid **container** account (parent or teacher) — slots, billing, permissions |
| **Child / student profile** | Play identity under one or more burritos — has beef or guac **content** tier |

Child profiles use **beef/guac only**. Bean stays for unsigned visitors.

---

## Burrito baseline (free tier)

Each new burrito includes **3 free child slots** (default — Jesse leans 3; 2 feels too tight for many families but remains a tuning knob before launch).

Per included child:

- **Beef** content access — full free game loops
- Parent/teacher can **play with** the child (co-play UX TBD)
- Owner can **track progress** per child (dashboard TBD)
- No payment to create burrito + 3 kids

**Note:** 2 slots is still on the table if pricing research says so; **3 is the planning default**.

---

## Paid expansion (burrito pays, children benefit)

### 1. More child slots

- **3 included free**
- Additional slot: **$#.## / period per slot**
- Cheaper than the same number of **solo flat accounts**

### 2. Premium content on children

- One or more child profiles upgraded to **guac** under that burrito’s subscription
- **Bundle discount** vs guac × N on separate solo accounts

### 3. Burrito capacity / linking (subscription-sized)

Higher tiers may allow:

- More child slots
- **Multi-burrito membership** for the same child (see below)
- **Burrito-to-burrito links** for progress sharing (home ↔ school)

Exact SKUs TBD after Founder Pass data.

---

## Multi-burrito membership (same child, multiple containers)

A **child profile is not locked to one burrito.** With the right subscription / invites:

- Jimmy can belong to **Sarah’s home burrito** (free beef at home)
- Jimmy can also belong to **Mrs. Smith’s teacher burrito** (guac while in class context)

**Entitlement rule (conceptual):** When Jimmy plays in a context tied to Mrs. Smith’s burrito, **that burrito’s guac grants apply**. At home under Sarah’s burrito, Sarah’s tier rules apply (beef unless Sarah upgrades Jimmy or her burrito).

Existing child profiles can be **invited into additional burritos** if the target burrito has capacity and the owning adults approve.

```
Jimmy (child profile)
  ├── member of → Sarah's home burrito     (beef default, Sarah sees progress)
  └── member of → Mrs. Smith's class burrito (guac via teacher subscription)
```

---

## Burrito-to-burrito linking (home ↔ school)

Separate burrito accounts can **link** for coordination — not merging billing, but **sharing progress visibility** where permitted.

### Canonical scenario: Sarah, Jimmy, Mrs. Smith

| Actor | Account | Role |
|-------|---------|------|
| **Sarah** | Home burrito (free tier) | Mom; already set up; sees **Jimmy’s progress independently** |
| **Jimmy** | Child profile | Student; in Sarah’s household + Mrs. Smith’s class |
| **Mrs. Smith** | Teacher burrito (paid, room for Jimmy) | Adds Jimmy; **guac for all paid content** while he’s in her burrito |

**What linking enables:**

1. **Jimmy** uses paid features under **Mrs. Smith’s burrito** (class / school context).
2. **Sarah** still has her own burrito view of Jimmy — does not need to pay for guac if school provides it.
3. **Sarah’s burrito ↔ Mrs. Smith’s burrito** can **share progress data** so both adults track the same learner (privacy rules + consent TBD, but goal is aligned parent–teacher visibility).

**Not required:** Sarah and Mrs. Smith share one login or one bill. Each keeps a separate burrito; **links** express trust and data share edges.

```
Sarah (home burrito)  ←—— link ——→  Mrs. Smith (class burrito)
         │                                    │
         └──────── both see ──────── Jimmy (child profile)
```

---

## Social & safety (parent / teacher gate)

Social features are **off by default** and **controlled by burrito owners**:

- Leaderboards scoped to **household or class burrito**, not global open lobbies
- Cross-account interaction only where **owners enable** it
- Explicit goal: **avoid Roblox-esque stranger black box**
- Teacher burritos: class-scoped boards; home burritos: family-scoped

Linked burritos do **not** automatically open social between unrelated children — only progress/coordination unless owners opt in.

---

## How this relates to current work

| Phase | Account model |
|-------|----------------|
| **Now — wind test** | Flat solo account; fake-door → guac |
| **Founder Pass** | Flat solo; `grant_source = founder_pass` |
| **Demo helper** | Flat solo; guac **6 months** then beef |
| **Burrito v1** | Container + child profiles; 3 free slots; solo sign-up still available |
| **Burrito v2** | Multi-burrito child membership + burrito linking (Sarah / Jimmy / Mrs. Smith) |

**Do not build burrito schema before:**

1. Save gate green (7-day incident rule)
2. Founder Pass cohort complete
3. Minimal **parent progress view** prototype

Suggested epics: `burrito-accounts-v1` (container + slots), `burrito-linking-v2` (multi-membership + home–school links).

---

## Rough schema direction (future — not migrated)

```text
burrito_accounts
  id, owner_user_id, type (home|teacher), slot_limit, subscription_tier, ...

child_profiles
  id, primary_display_name, ...   -- global play identity (Jimmy)

burrito_memberships
  burrito_id, child_profile_id, content_tier (beef|guac), role (child|...),
  guac_source (burrito_subscription|inherited|none), ...

burrito_links
  burrito_a_id, burrito_b_id, link_type (progress_share|...),
  consent_by_a, consent_by_b, ...

profiles (auth.users extension)
  may map to burrito owner OR link to child_profile_id for play sessions

game_saves
  keyed by child_profile_id (target) — not just auth user_id
```

Open for architecture spike:

- Child **login**: own credentials vs profile picker under parent session?
- **Context switch**: how Jimmy “plays as class” vs “plays at home” in UI
- **Roster**: teacher invite by email, class code, or school SSO (far future)

---

## Pricing summary (TBD numbers)

| Item | Default |
|------|---------|
| Included child slots per burrito | **3** (2 possible if data says tighten) |
| Extra child slot | $#.## / slot / period |
| Guac on children | Bundle via burrito checkout |
| **Solo flat account** | **Always available** — Founder Pass / future solo tier |
| Multi-burrito + linking | Higher subscription tier or teacher class pack |
| Demo helper (flat) | **6 months** guac, then beef |

---

## Decisions locked (committed 2026-05-31)

| Decision | Value |
|----------|--------|
| Guest naming | **Bean** = account-less only |
| Child content tiers | **Beef / guac** only |
| Free child slots | **3** (2 = optional pre-launch tighten) |
| Solo accounts | **Remain first-class** — burrito optional |
| Same child, multiple burritos | **Yes** — when subscription + invites allow |
| Home ↔ school | **Burrito links** for progress share; guac via teacher burrito |
| Social | **Owner-gated** — non-negotiable |
| `demo_helper` duration | **6 months** |

---

## Deferred at implementation (does not block commit)

1. **Child login model:** separate credentials vs profile picker under parent?
2. **Teacher SKU:** same burrito product with `type=teacher` or separate “class pack”?
3. **Link consent UX:** both burrito owners must approve link, or teacher invite + parent accept?
4. **Guac precedence:** if Jimmy is guac in class burrito but beef at home, confirm context-switch rules in UI.

---

## References in codebase (today)

| Today | File |
|-------|------|
| Flat tier on profile | `gojito-platform/supabase/profiles.sql` |
| Bean = guest | `gojito-platform/packages/gojito-nav/src/access.js` |
| Manual guac grant | `docs/ENTITLEMENTS-SETUP.md` |
| Flat cohort grants | `demo-cohort-founder-pass-model-2026.05.31.md` |
