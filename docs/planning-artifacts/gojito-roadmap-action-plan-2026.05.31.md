# Gojito — actionable roadmap (current build → monetization-ready)

**Date:** 2026-05-31  
**Committed:** 2026-05-31 — see [`PLAN-COMMITMENT-2026.05.31.md`](./PLAN-COMMITMENT-2026.05.31.md)  
**Audience:** Jesse (solo operator)  
**Companion docs:** [`monetization-party-plan-2026.05.31.md`](./monetization-party-plan-2026.05.31.md) (strategy), [`../PROJECT-STATUS.md`](../PROJECT-STATUS.md) (last technical snapshot 2026-05-23)

This is the **execution map**. Strategy lives in the party plan; this doc says **what exists today**, **what “done” looks like**, **what’s already archived**, and **what to do next in order**.

**Tweak policy:** Adjust details as you learn; keep the **phase order** (wind test → save gate → Founder Pass → Stripe → subscription/burrito).

---

## 1. Where we are today (2026-05-31 build)

### What actually works

| Layer | Repo / path | Status |
|-------|-------------|--------|
| Hub shell | `gojito-platform/` — `index.html`, Vite app, `GojitoNav` | Live at `http://127.0.0.1:5173/` via `npm run build:combined && npm run dev:static` |
| Hub auth | `gojito-platform/src/platform/auth/AuthContext.tsx` | Google + email via Supabase; session key `gojito-auth` |
| Same-origin games | `/cakerybakery/`, `/calculatorcove/` embedded bundles | Combined build copies game `dist/` into hub |
| Account chrome | `@gojito/nav` → `GojitoGameChrome` in both games | Hub link, tier pill (Guest / Member / Full access), sign in/out |
| Cakery cloud saves | `cakery-bakery/src/lib/cloudGameSaves.js` | Upsert to `game_saves`; sync on login; rows 3–4 of acceptance matrix **passed** (2026-05-23) |
| Cove cloud settings | `calculator-cove/src/lib/coveCloudSave.ts` | Path exists; matrix row 5 **not formally signed off** |
| Tier system | `profiles.tier` — `beef` (free) / `guac` (full) | Manual SQL grant — see [`ENTITLEMENTS-SETUP.md`](../ENTITLEMENTS-SETUP.md) |
| Cakery free vs full gating | `cakery-bakery/src/lib/buildConfig.js` + `UpgradeModal.jsx` | Free build active; locked villages/features show upgrade modal |
| Cove premium gating | `calculator-cove/src/lib/betaGates.ts` | **`ISLAND_FLEETS_GATED = true`** — Island Fleets guac-locked; large boards still coming-soon |
| Beta disclosure | `gojito-platform/src/components/HubBetaBanner.tsx` | Dismissible “Beta preview” banner on hub |

### What is broken, incomplete, or missing

| Gap | Where it shows up | Impact |
|-----|-------------------|--------|
| **Save sync imperfect** | User-reported; investigation file in `_bmad-output` | Blocks monetization trust |
| **Story slot grid device-local** | `cakery-bakery/src/lib/storySlots.js` (`cakery_story_slots_v1`) | New device = empty slots even when save blobs synced |
| **No visible save status on cloud path** | Cakery has local “Saved!” in some modals only | Silent cloud failures possible |
| **Acceptance matrix incomplete** | `docs/LOGIN-SAVES-MVP.md` rows 1–2, 5–7 | Sprint `login-saves-mvp` still **in_progress** |
| **No parent / trust page** | Hub footer is copyright only | Parents can’t answer “what is this?” |
| **No fake-door analytics** | Upgrade modal says “Request full access” | No structured click/intent tracking by game + feature |
| **No Founder Pass / pricing UI** | By design — not built yet | OK for now |
| **No Stripe / checkout** | `gojito-backend/docs/DEPLOY-PHASE3.md` deferred | OK for now |
| **Entitlements manual only** | Supabase SQL update | Can’t scale past ~20 paying users |
| **Cove not monetization-shaped yet** | Premium modes in “coming soon” mode | Second game doesn’t test paid boundaries |

### Current “stage” (from party plan)

```
[✓ Stage 0] Playable hub + 2 games + auth + imperfect cloud saves
[→ Stage 1] Interest validation — fake-door, copy, measure intent     ← YOU ARE HERE
[  Stage 2] Pre-monetization beta — save gate + trust UX
[  Stage 3] Founder Pass (~$12) — manual guac grant
[  Stage 4] Stripe automation (Phase 3 backend)
[  Stage 5] Subscription — after 3+ games or parent dashboard
```

**You are not charging yet.** You are finishing the save foundation and rigging wind-testing UX.

---

## 2. Where we want to be (targets)

### Target A — “Saves MVP done” (prerequisite for everything)

- All 7 rows in `docs/LOGIN-SAVES-MVP.md` marked **Pass** with date + build path.
- **7-day save incident log** running (see §4 Step 1).
- Jesse’s gate: **≤2 save-loss incidents in 7 days**, each fixed ASAP, **no user hit twice**.

### Target B — “Trust UX ready” (parents + kids believe progress sticks)

- User sees **Saved / Saving / Couldn’t save** on cloud write paths (Cakery + Cove).
- Story mode on new device: **clear empty state** (“Sign in to load your stories” / reassignment path), not blank grid of shame.
- Hub has a **short parent page** (`/about` or `/for-parents`): what Gojito is, free vs future paid, how saves work, no surprise charges.

### Target C — “Wind-testing live” (measure demand without money)

- Locked Cakery moments use **named content** + **“Notify me when this opens”** fake-door (not “pay now”).
- Events logged: `lock_view`, `fake_door_click`, `game`, `feature_id`.
- Hub line: **“Game content may be offered later; math stays free.”**
- Cove: decide **coming-soon vs guac-lock** for at least one premium mode so the suite tests two lock patterns.

### Target D — “Founder Pass ready” (first revenue — manual)

- Save gate **green** (7-day window passed).
- Founder Pass copy + price ($12) documented; grant = `profiles.tier = guac` + founder metadata (even if metadata is a spreadsheet at first).
- Refund line: email within 7 days.
- Optional: first ~20 sales via manual invoice / PayPal link before Stripe.

### Target E — “Payments automated” (later)

- `gojito-backend` deployed; Stripe webhook → guac; no manual SQL on happy path.
- See `gojito-backend/docs/DEPLOY-PHASE3.md`.

---

## 3. What is already in the planning archives

Use these as **reference**, not duplicate work:

| Document | Location | Role |
|----------|----------|------|
| **This roadmap** | `gojito-platform/docs/planning-artifacts/gojito-roadmap-action-plan-2026.05.31.md` | Execution steps (you are here) |
| Monetization party plan | `gojito-platform/docs/planning-artifacts/monetization-party-plan-2026.05.31.md` | Strategy, pricing ladder, Jesse save gate, Sally UX backlog |
| ChatGPT monetization input | `gojito-platform/docs/user-input/monetization-chatgpt-conv-2026.05.31.md` | Original external advice |
| Project status handoff | `gojito-platform/docs/PROJECT-STATUS.md` | Technical snapshot (2026-05-23) |
| Next session prompt | `gojito-platform/docs/NEXT-SESSION.md` | Resume template |
| Login + saves acceptance | `docs/LOGIN-SAVES-MVP.md` | **Sprint exit criteria** — finish this first |
| Entitlements manual grant | `gojito-platform/docs/ENTITLEMENTS-SETUP.md` | beef/guac SQL playbook |
| Architecture | `gojito-platform/docs/ARCHITECTURE.md` | Direct Supabase MVP vs future SDK |
| Chrome contract | `gojito-platform/docs/gojito-chrome-contract.md` | Nav / hub ↔ game UX rules |
| Sprint status YAML | `_bmad-output/planning-artifacts/sprint-status-login-saves-mvp.yaml` | Story-level save sprint tracker |
| Sprint change proposal | `_bmad-output/planning-artifacts/sprint-change-proposal-2026-05-23.md` | Why sprint was reset |
| Saves investigation | `_bmad-output/implementation-artifacts/investigations/gojito-account-saves-investigation.md` | Debug notes |
| Phase 3 backend + Stripe | `gojito-backend/docs/DEPLOY-PHASE3.md` | **Deferred** until Target D/E |

**Rule:** Do not start Stripe or subscription work until Targets A–C are met and save gate is green.

---

## 4. Step-by-step: from here to there

Each step lists **repo**, **concrete work**, and **how you know it’s done**.

---

### Track 1 — Saves foundation (do first)

#### Step 1 · Start the 7-day save incident log

**Repo:** `gojito-platform/docs/` (or a spreadsheet — your choice)  
**Work:** Create `save-incident-log.md` with columns:

```text
Date | User (id/email) | Game | What happened | Severity | Fixed? | User notified? | Notes
```

**Done when:** Log exists; you commit to counting incidents during all testing for the next 7 days.

**Gate (Jesse decision):** Proceed to Founder Pass planning only after a 7-day window with **≤2 incidents**, **no repeat user**, each **fixed ASAP**.

---

#### Step 2 · Finish LOGIN-SAVES-MVP acceptance matrix

**Repo:** all four Gojito repos  
**Test path (always):**

```bash
cd gojito-platform && npm run build:combined && npm run dev:static
# → http://127.0.0.1:5173/
```

**Work:** Run and record each row in `docs/LOGIN-SAVES-MVP.md`:

| Row | Action | Pass = |
|-----|--------|--------|
| 1 | Hub Google/email login | Session in `gojito-auth`; account menu shows user |
| 2 | Hub → Cakery → hub | Same email/tier; not Guest |
| 3 | Cakery cloud write | Already passed — re-verify if you changed saves |
| 4 | Cakery cross-browser | Already passed — re-verify |
| 5 | Cove settings | Change menu setting logged in → `game_saves` row for `calculator-cove` → incognito sees it |
| 6 | Guest path | Logged out play → local only; no new cloud rows |
| 7 | Build path | Document exact commands used |

**Files involved:**

- `calculator-cove/src/lib/coveCloudSave.ts`
- `calculator-cove/src/pages/MenuScreen.tsx` (calls save on settings change)
- `cakery-bakery/src/lib/cloudGameSaves.js`

**Done when:** All 7 rows = Pass + date; update `_bmad-output/planning-artifacts/sprint-status-login-saves-mvp.yaml` to `done`.

---

#### Step 3 · Fix top save pain points (from incidents + matrix failures)

**Repo:** `cakery-bakery` primary; `calculator-cove` if row 5 fails  
**Work (prioritize what the log/matrix shows):**

1. **Story slot continuity** — `cakery-bakery/src/lib/storySlots.js`  
   - Minimum: empty-state copy on Story welcome when logged in but slots empty on this device.  
   - Better: on login sync, rebuild slot assignments from cloud save list (deferred in sprint YAML as `story-slot-cloud-sync` — pick minimum vs full based on incident severity).

2. **Cloud save error surfacing** — `cloudGameSaves.js`, Cove save path  
   - Return `{ ok, error }` from upsert; show toast/banner on failure (never silent fail).

3. **Re-run 7-day log** after fixes — window **resets** if gate fails.

**Done when:** Step 2 still passes after fixes; incident log trends toward gate.

---

### Track 2 — Trust + clarity UX (parallel after Step 2 starts)

#### Step 4 · Parent trust page

**Repo:** `gojito-platform`  
**Work:**

- Add route or static page `/for-parents` (Vite route or `public/for-parents.html`).
- Content (~60 seconds read):
  - What Gojito is (math arcade, not worksheets)
  - What’s free today (core Cakery loop, Cove 6×6 hot-seat)
  - What might cost later (**extra game content**, not basic math)
  - How saves work + beta honesty
  - Contact / report issues
- Link from hub footer and `HubBetaBanner`.

**Done when:** You can send a parent the URL and they don’t ask “is this a subscription trap?”

---

#### Step 5 · Free vs paid copy pass (human labels)

**Repo:** `cakery-bakery`, `calculator-cove`, `@gojito/nav`  
**Work:**

| File | Change |
|------|--------|
| `UpgradeModal.jsx` | Title: content name (“Ming China village”), not “Full access”; add “Not for sale yet — get notified” |
| `buildConfig.js` FEATURE_REGISTRY | Ensure every gated feature has parent-readable description used in lock messages |
| `index.html` hub tagline | Add one line: “Game content may be offered later; math stays free.” |
| `GojitoNav` / access labels | Already uses Guest/Member/Full access — keep beef/guac out of kid-facing copy |

**Done when:** Locked tap shows **what** is locked + **why** + **not charging yet**.

---

#### Step 6 · Fake-door + intent capture

**Repo:** `cakery-bakery`, `gojito-platform`, optionally Supabase table  
**Work:**

1. Replace or augment “Request full access” button with **“Notify me when this opens”** in `UpgradeModal.jsx`.
2. Log intent with context: `{ source: 'cakery_bakery', feature: 'locale_ming_china', user_id, timestamp }`.
   - v0: Supabase table `interest_signals` or append to existing full-access request path.
   - v0 alt: console + spreadsheet if you want zero schema work this week.
3. Hub optional: “Support Gojito / Founder Pass coming soon” card → same capture.

**Done when:** You can answer “which locked feature gets the most clicks?” from data.

---

#### Step 7 · Cove premium mode decision

**Repo:** `calculator-cove/src/lib/betaGates.ts`  
**Work:** Choose one:

- **A)** Keep `PREMIUM_MODES_COMING_SOON = true` until Cakery wind-testing is learned — document as intentional.
- **B)** Set `false` for one mode (e.g. Island Fleets) so suite has live guac-lock UX to test with manual grants.

**Done when:** Decision recorded in this doc or party plan; Cove behavior matches choice.

---

### Track 3 — Save gate window (7 days)

#### Step 8 · Run the gate

**Work:**

- Normal play + deliberate save checks (refresh, second browser, hub embed path).
- Log every incident in Step 1 log.
- No Founder Pass marketing until window passes.

**Done when:**

- ≤2 incidents total
- No user appears twice
- Each incident has fix + notification notes

**If fail:** Back to Step 3; reset window.

---

### Track 4 — Founder Pass (only after Step 8 passes)

#### Step 9 · Founder Pass offer (manual fulfillment)

**Repo:** copy in hub + `UpgradeModal`; grants via `ENTITLEMENTS-SETUP.md`  
**Work:**

- Price: **$12 one-time** (party plan consensus).
- Copy: early supporter, current catalog guac, growing library, honest beta.
- Fulfillment: payment via link you choose → manual `update profiles set tier = 'guac'`.
- Track founders in spreadsheet (`user_id`, `paid_at`, `grant_source`).

**Done when:** 1 test purchase end-to-end with zero “I paid but nothing changed.”

---

#### Step 10 · Stripe automation (optional scale)

**Repo:** `gojito-backend`  
**Work:** Follow `DEPLOY-PHASE3.md` — KV, webhooks, set `VITE_GOJITO_API_URL` on all three frontends.

**Done when:** Staging purchase flips tier without SQL.

---

### Track 5 — Later (explicitly not now)

| Item | Trigger |
|------|---------|
| Gojito Plus $4.99/mo · $39/yr | 3+ polished games OR parent dashboard |
| Teacher Lite $29–49/yr | Classroom fake-door or pilot teacher |
| **Burrito parent accounts** | After Founder Pass + minimal parent progress UI — v1 container + slots; v2 multi-membership + home–school links — [`parent-account-burrito-model-2026.05.31.md`](./parent-account-burrito-model-2026.05.31.md) |
| Story slot full cloud sync | If Step 3 minimum UX isn’t enough from incident data |
| Platform save SDK | Architecture doc long-term; not blocking Founder Pass |

---

## 5. Recommended order (your next 4 sessions)

| Session | Focus | Steps |
|---------|-------|-------|
| **1** | Prove saves | 1, 2 (rows 1–2, 5–7) |
| **2** | Fix what failed | 3 (top incidents + Cove row 5 if needed) |
| **3** | Trust UX | 4, 5 |
| **4** | Wind-testing | 6, 7 — then start 7-day gate (8) |

Do **not** skip to Step 9 until Step 8 passes.

---

## 6. Quick reference commands

```bash
# Canonical local test (hub + embedded games)
cd gojito-platform && npm run build:combined && npm run dev:static

# After any game source change
cd gojito-platform && npm run build:combined

# Verify profile tier grant
cd gojito-platform && npm run verify:profiles

# Grant guac manually (see ENTITLEMENTS-SETUP.md)
# update public.profiles set tier = 'guac' where id = '<uuid>';
```

---

## 7. Deferred decisions (post-commit — tweak at build time)

Plan committed 2026-05-31. These remain open for **burrito v1/v2** or **public launch** — they do **not** block Tracks 1–4.

1. Burrito child login: separate credentials vs profile picker — [`parent-account-burrito-model-2026.05.31.md`](./parent-account-burrito-model-2026.05.31.md)
2. Teacher SKU vs home burrito product
3. Home–school link consent UX
4. Free child slots: **3 committed**; revert to 2 only if launch data says tighten

### Resolved (committed)

- Founder Pass scope: **lifetime all current + future Gojito game content**
- Founder Pass price: **~$12**
- Wind-test auto-grant: until Founder Pass opens, then off for new users
- `demo_helper`: **6 months**
- Fake-door: `access_requests` + auto-grant SQL
- Cove: Island Fleets gated locally
- Bean = guest; beef/guac = content tiers; solo accounts stay

---

## 8. Document maintenance

When a step completes, update:

- `docs/LOGIN-SAVES-MVP.md` (matrix)
- `docs/PROJECT-STATUS.md` (snapshot)
- `_bmad-output/planning-artifacts/sprint-status-login-saves-mvp.yaml`
- This file — check off steps in §4
