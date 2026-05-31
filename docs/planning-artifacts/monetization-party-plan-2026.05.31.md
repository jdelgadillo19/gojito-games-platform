# Gojito monetization — BMad party plan

**Date:** 2026-05-31  
**Facilitator:** Cursor orchestrator (Party Mode)  
**Participants:** John (PM), Mary (Business Analyst), Winston (Architect), Samus Shepard (Game Designer), Sally (UX Designer)  
**Last updated:** 2026-05-31 (plan committed — [`PLAN-COMMITMENT-2026.05.31.md`](./PLAN-COMMITMENT-2026.05.31.md))  
**Input reference:** [`docs/user-input/monetization-chatgpt-conv-2026.05.31.md`](../user-input/monetization-chatgpt-conv-2026.05.31.md)  
**Project context:** [`docs/PROJECT-STATUS.md`](../PROJECT-STATUS.md) (last updated 2026-05-23)

---

## Executive summary

The room **largely concurs** with the ChatGPT monetization conversation: staged rollout (interest → beta → payments), fake-door before Stripe, charge for **game content and convenience** not "math access," and **Founder Pass before subscription**.

**Adjustments for Gojito's current state** (saves working but imperfect, manual `beef`/`guac` entitlements, two hub-visible games, no Stripe):

1. You are in **stage 1–2**, not ready for stage 3 (real payments).
2. Tighten benchmarks with **definitions and ops gates** — especially save integrity, entitlement automation, and parent-visible progress.
3. **Founder Pass ~$12 one-time** after fake-door + save gate; defer **$4.99/mo subscription** until game #3 or equivalent paid bundle.
4. Fix **story-slot continuity feel** before charging — empty slot grids on new devices erode trust even when blobs sync.

**Later account model (2026-05-31):** **Burrito** container accounts (parent/teacher) with **3 free child slots**, solo flat sign-up still available, multi-burrito child membership + home–school burrito linking — see [`parent-account-burrito-model-2026.05.31.md`](./parent-account-burrito-model-2026.05.31.md). **Bean** = guest only; child content tiers = **beef/guac**. Deferred until after Founder Pass.

**Demo cohort (2026-05-31):** See [`demo-cohort-founder-pass-model-2026.05.31.md`](./demo-cohort-founder-pass-model-2026.05.31.md) — `demo_helper` thank-you = **6 months** default.

---

## Source conversation (ChatGPT) — key claims

| Topic | ChatGPT recommendation |
|-------|------------------------|
| Stages | Interest validation → pre-monetization beta → actual payments |
| Readiness | Polished free loop, 2+ games, reliable saves, clear free/paid, parent page, refund path, no bugs in first 10 min |
| Go/no-go metrics | 95% account success, 80% first session, 95% save/refresh, 80% parent value comprehension, 2 replays/week, 0 breaking bugs, 5–10% CTA clicks |
| Pricing | Founder Pass $9.99 → later $4.99/mo or $39/yr; teacher pricing deferred |
| Positioning | "Growing math-game arcade kids replay" — not "pay to learn math" |
| Comps | Khan (free), Prodigy ~$59/yr, IXL ~$16–20/mo, SplashLearn ~$8–12/mo |

---

## Roundtable responses

### 📋 John (Product Manager)

Mostly yes on the *sequence* — interest → beta → money, fake-door before Stripe, sell convenience/content not "math access." Where I push back is treating the ChatGPT benchmarks and pricing ladder as if you're one sprint from launch. You're not. You're in **pre-monetization beta** with manual entitlements and saves that still flake.

**Concurs:** three stages, benchmark before charging, fake-door before Stripe, content/convenience pricing, Founder Pass before subscription.

**Pushes back:**

- Go/no-go table at 95%/80% is a north star, not today's gate — fix save failure modes first.
- "After 3+ games" for subscription is directionally right but wrong clock — two games on hub today.
- Teacher pricing only after B2B signal (home vs classroom fake-door).

**Adjusted benchmarks:**

| ChatGPT-ish gate | Adjustment |
|------------------|------------|
| 95% account success | Phase A: log drop-offs 2 weeks. Phase B: ≥90% signup → hub → playable game after 7-day save stability. |
| 80% first session | ≥70% reach meaningful progress (defined per game). |
| Reliable saves | **Binary gate** before any paid copy. |
| 2+ games visible | Met — now require **both polished in first 10 min**. |
| Clear free/paid | Parent answers "what's free?" in one sentence without reading SQL. |
| No bugs in 10 min | Add **save/load in minutes 8–10** explicitly. |

**Pricing ladder:**

| Step | Offer | Price | When |
|------|--------|-------|------|
| 0 | Free beef — honest limits | $0 | Now |
| 1 | Founder Pass (lifetime guac on current catalog) | **$12 one-time** | After fake-door + save gate + parent blurb |
| 2 | Guac add-ons (worlds, cosmetics, dashboard lite) | $3–8 one-time per slice | As content ships |
| 3 | Guac subscription | $4.99/mo or $39/yr | After game 3 or equivalent bundle |
| 4 | Teacher / school | $29–49/yr | After B2B signal |

---

### 📊 Mary (Business Analyst)

**Mostly concurs** with readiness-first philosophy. **Does not** concur that benchmarks are complete or positioning is settled.

**Strong:**

- Benchmarks treat monetization as product truth, not marketing hope.
- Save/progress 95%+ is non-negotiable (hard blocker given imperfect sync).
- First session without help = parent-time ROI signal.
- Paid CTA 5–10% is useful early funnel probe.
- $39/yr sits below Prodigy/IXL — plausible "premium indie arcade" slot *if* value is clear.

**Weak:**

- "95% account success" underspecified — split into funnel stages.
- "Parent understands paid value" needs unaided recall protocol.
- "2 sessions/week" necessary but not sufficient — add session quality.
- "No bugs in 10 min" too narrow — add data-loss and entitlement mismatch.
- CTA clicks without comprehension = rage clicks later.
- Market positioning implied, not argued — must name parent/child jobs.

**Recommended positioning:**

- **Parent job:** "Guaranteed screen time I don't feel guilty about — kid asks to play again."
- **Child job:** "Arcade fun that still feels like *mine* (progress, unlocks, identity)."

**Added benchmarks:**

1. Entitlement integrity: 100% paid test accounts reflect access within 60s, zero manual SQL on happy path.
2. Parent value artifact: ≥70% see tangible progress after 3 sessions.
3. Child delight: ≥50% voluntarily start second game or replay same visit.
4. Support burden: <5% of sessions generate parent support contact in beta.
5. WTP probe: Founder Pass intent ≥3% of active families with price shown.
6. Week-4 retention proxy: ≥60% of week-2 families still active in week 4.

---

### 🏗️ Winston (System Architect)

**Largely concurs** with sequencing — fake-door first, Founder Pass when saves trustworthy, Stripe when entitlement automation exists.

**Technical gates before Stripe:**

| Gate | Why |
|------|-----|
| Entitlement source of truth | `profiles.tier` authoritative; RLS enforces |
| Automated tier mutation | Manual SQL fine for ~5 founders, not 500 checkouts |
| Idempotent payment → tier pipeline | Webhook replay safety |
| API boundary | `VITE_GOJITO_API_URL` / Phase 3 before production payments |
| Save integrity under tier changes | Upgrade/downgrade/refund paths |
| Operational runbook | Refund, dispute, "I paid but still beef" |
| Founder Pass semantics locked | Lifetime? All future games? Drives schema |

**Founder Pass → beef/guac mapping:**

- **Option A (recommended start):** Founder Pass *is* guac; add `grant_source` metadata later.
- **Option B:** Separate `is_founder` flag for perks beyond guac.
- **Option C:** Third tier — only if feature matrix truly differs.

**Rule:** Stripe goes live when staging purchase flips tier **without human SQL**.

---

### 🎲 Samus Shepard (Game Designer)

**Mostly concurs** on content boundaries — parents buy **more game**, not **permission to do math**.

**Free vs paid guardrails:**

1. **Free = identity, Paid = collection** — lock expansion, not closure.
2. **Hub must feel like an arcade**, not a menu of trials.

**Per-game:**

- **Cakery:** Free owns baker fantasy + growth loop. Paid = depth (villages, story, packager, recipe pages).
- **Cove:** Free owns one killer mode. Premium = arcade cabinets (variants, harder rulesets).

**Player-feel benchmarks before charging:**

| Benchmark | Pass condition |
|-----------|----------------|
| Voluntary return | Kid asks to play without parent prompt (2×/week floor) |
| Session has an ending | Free play ends on pride, not "ugh, locked" |
| Pride moment | Kid shows parent something concrete in 30s |
| "One more" pull | Natural stop still invites another round |
| Paywall emotion | "Whoa, there's MORE" not "they took my toy" |
| Parent trust | Story slots *look* continuous cross-device |

**Critical:** Device-local story slot grid (empty on new device) is a **monetization killer** — fix feel before tiers.

---

## Orchestrator concurrence (Cursor)

**Do I concur with the ChatGPT conversation?** **Yes, on strategy; partially on timing and precision.**

The ChatGPT advice is well-calibrated for an indie edu-game suite at Gojito's stage. The three-stage model, fake-door, content-not-math positioning, and Founder-before-subscription ladder match both market reality and Gojito's codebase (`beef`/`guac` tiers already exist; Stripe is explicitly deferred in Phase 3).

**Where I'd push back or refine:**

1. **Benchmark precision without instrumentation** — The 95%/80% table is aspirational until you have analytics and a defined funnel. Gojito should run a 2-week **qualitative + lightweight event** pass before treating percentages as gates.
2. **"Two games visible" is already met** — The real gate is **Cove polish parity** and **cross-device save feel** (story slots), not game count.
3. **$9.99 vs $12 Founder Pass** — Either works; $12 better signals "real product" if saves are trustworthy. Don't go to $15 until both games pass the 10-minute unaided test.
4. **Subscription at $4.99/mo** — Correct long-term anchor vs SplashLearn; premature until the hub feels like an arcade with 3+ cabinets or a deep parent dashboard.
5. **Competitive framing** — Khan (free) sets the guilt floor; Prodigy sets engagement expectations. Gojito's wedge is **short-burst replayable arcade + no ads + honest progress** — not cheaper IXL.

---

## Consolidated monetization plan

### Phase 0 — Now (interest validation)

- [ ] Add hub **"Support Gojito / Founder Pass coming soon"** fake-door CTA with click tracking.
- [ ] Optional email capture for waitlist.
- [ ] Instrument events: `cta_view`, `cta_click`, `game_session_start`, `save_success`, `save_fail`.
- [ ] Run 5 parent interviews: *"What would you pay $10–12 for here?"*

**Exit criteria:** 5–15% CTR among signed-in users who see CTA; qualitative clarity on paid promise.

### Phase 1 — Pre-monetization beta (4–8 weeks)

- [ ] **Save reliability sprint** — cross-device restore, hub-embedded path, story-slot UX continuity.
- [ ] **Acceptance matrix** — complete rows in `LOGIN-SAVES-MVP.md` including save/load in minutes 8–10.
- [ ] **Parent landing blurb** — one page: what Gojito is, free vs guac, refund email.
- [ ] **Free loop contract** per game (Samus) — document what stays free forever.
- [ ] **Progress artifact for parents** — streak, minutes, level map, or printable summary.
- [ ] 5–10 unaided playtests — no founder explanation in first session.

**Exit criteria (go/no-go for payments):**

| Benchmark | Target |
|-----------|--------|
| Onboarding funnel complete (account → profile → first game → clean exit) | ≥90% |
| Meaningful progress without adult help | ≥70% |
| Save-loss incidents (7-day window) | **≤2 total**; each addressed ASAP; **no user hit twice** (see [Save gate — Jesse decision](#save-gate--jesse-decision)) |
| Parent unaided recall of paid value | ≥80% |
| Child voluntary return (2+ sessions / 7 days) | ≥50% of test cohort |
| Critical / data-loss defects in 30-min playtest | 0 |
| Fake-door CTR (signed-in) | 5–15% |
| Founder intent with price shown | ≥3% of active families |
| Support contacts per session (beta) | <5% |

### Phase 2 — Founder Pass (first revenue)

- [ ] **Founder Pass: $12 one-time** — lifetime guac on current catalog + founder badge/cosmetic.
- [ ] Manual grant via Supabase SQL (documented) until Phase 3 automation.
- [ ] Honest copy: early access, growing library, supports development.
- [ ] Refund policy: email within 7 days.
- [ ] Stripe **not required** for first ~20 founders if manual fulfillment is acceptable.

**Exit criteria:** Zero "I paid but nothing changed" tickets; ≥85% purchasers launch game within 24h.

### Phase 3 — Payment automation (Phase 3 backend)

- [ ] Deploy `gojito-backend` Worker + Stripe webhooks.
- [ ] Idempotent `payment → profiles.tier = guac` with `grant_source = founder_pass`.
- [ ] Set `VITE_GOJITO_API_URL` on hub + both games together.
- [ ] Staging: full purchase simulation without manual SQL.

### Phase 4 — Subscription (suite maturity)

- [ ] **Gojito Plus: $4.99/mo or $39/yr** when 3+ polished games OR deep parent tools exist.
- [ ] Do not exceed $6.99/mo until dashboard + regular content cadence.

### Phase 5 — Classroom (B2B signal only)

- [ ] Teacher Lite $29–49/yr only after classroom fake-door or pilot teacher commits.
- [ ] Roster/class management before school pricing.

---

## Pricing summary

| Offer | Price | Timing |
|-------|-------|--------|
| Free (beef) | $0 | Now |
| Founder Pass | **$12 one-time** | After Phase 1 gates |
| Guac add-ons | $3–8 one-time | Per content slice |
| Gojito Plus | $4.99/mo · $39/yr | After 3+ games or equivalent |
| Teacher Lite | $29–49/yr | After B2B validation |

---

## Save gate — Jesse decision

**Question (from John):** What save reliability makes you comfortable taking $12 for Founder Pass?

**Jesse's answer (2026-05-31):** Incident-based gate, not a percentage.

| Rule | Detail |
|------|--------|
| **Window** | Rolling 7 days of real usage / deliberate testing |
| **Max incidents** | **2 save-loss events** total in that window |
| **Response** | Each incident **addressed as soon as possible** (root cause + user communication) |
| **Repeat victims** | **None** — no user may experience two save-loss incidents in the same window |
| **Ideal** | Zero losses; Jesse expects not to be there yet |

**What counts as an incident:** User believed progress was saved; after refresh, re-login, or new device, meaningful progress was missing or UI showed broken continuity (e.g. empty story slots with no explanation).

**Go/no-go:** Founder Pass (Phase 2) opens only after a 7-day window passes this gate. If incident #3 occurs, or any user is hit twice, the window resets.

---

## UX wind-testing — Sally (2026-05-31)

Jesse is not charging yet — **testing winds, rigging sails.** Sally's priority stack while saves prove out:

### Build now (before money)

1. **Save trust UX** — visible Saved/Saving/Error states; no silent failure; recovery path; no repeat victim without acknowledgment.
2. **Free vs paid clarity** — human labels (not beef/guac alone); locked = named content pack; math never feels gated.
3. **Fake-door on locked game moments** — "Tell me when this opens"; tag game + content + moment; honest "not for sale yet" copy.
4. **Parent trust page (short)** — what Gojito is, free vs future paid, how saves work, no surprise charges yet.
5. **Tier chrome simplification** — hub banner + locked CTAs first; tier pill only if orienting; fix empty story-slot framing on new device.
6. **Founder Pass narrative** — design the story, don't sell until save gate is green.

### "Not there yet" audit checklist

- [ ] New visitor can't answer "What is Gojito?" in one breath
- [ ] Save failures invisible or repeatable for same user
- [ ] Free vs paid boundaries fuzzy
- [ ] Locked moments lack what/why/not-yet-for-sale
- [ ] New device = empty slots with no explanation
- [ ] No parent calm briefing
- [ ] No fake-door funnel by game/content

### This-week slice (optional backlog)

1. Parent trust page (short)
2. Locked-content component: what's locked + why + fake-door (both games)
3. Save status + failure messaging pass
4. New-device empty state for story slots
5. Hub line: "Game content may be offered later; math stays free."

---

## Open questions for Jesse

All near-term questions **resolved at commit** (2026-05-31). See [`PLAN-COMMITMENT-2026.05.31.md`](./PLAN-COMMITMENT-2026.05.31.md).

1. ~~7-day save gate~~ → ≤2 incidents / 7 days, no repeat user
2. ~~Founder Pass scope~~ → lifetime all current + future Gojito game content
3. ~~Home vs classroom first~~ → home-first for wind test; classroom via burrito v2

---

## Related docs

- [`docs/ENTITLEMENTS-SETUP.md`](../ENTITLEMENTS-SETUP.md)
- [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md)
- [`gojito-backend/docs/DEPLOY-PHASE3.md`](../../../gojito-backend/docs/DEPLOY-PHASE3.md)
- Workspace: [`docs/LOGIN-SAVES-MVP.md`](../../../docs/LOGIN-SAVES-MVP.md)
