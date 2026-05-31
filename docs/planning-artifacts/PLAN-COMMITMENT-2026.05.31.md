# Gojito plan — committed

**Committed:** 2026-05-31 (Jesse)  
**Policy:** Execute this plan; tweak later if evidence warrants.  
**Execution map:** [`gojito-roadmap-action-plan-2026.05.31.md`](./gojito-roadmap-action-plan-2026.05.31.md)

---

## Commitment statement

> Execute **flat-account wind test** and **save gate** now. Offer **Founder Pass at ~$12** after the gate, with **lifetime access to all current and future Gojito game content** (wording may refine; scope stands). **`demo_helper` = 6 months** guac for launch helpers who decline. **Burrito** parent/teacher accounts (3 free child slots, solo sign-up retained, home–school linking in v2) **deferred** until after Founder Pass. Plans may be adjusted without throwing away the staged sequence.

---

## Near-term sequence (committed)

| Phase | What | Gate |
|-------|------|------|
| **1 — Wind test** | Fake-door → `access_requests` → auto guac (`demo_interest`); Island Fleets gated | Now |
| **2 — Save gate** | 7-day log: ≤2 incidents, no repeat user, fix ASAP | Before Founder Pass |
| **3 — Founder Pass** | ~$12 one-time; `grant_source = founder_pass`; manual grant OK initially | After Phase 2 |
| **4 — Stripe** | Phase 3 backend when manual ops hurt | Optional scale |
| **5 — Subscription / burrito** | Gojito Plus + burrito v1/v2 | After 3+ games or parent dashboard |

---

## Product decisions (committed)

| Topic | Decision |
|-------|----------|
| Charge for | Game **content** and convenience — not “math access” |
| Account model (now) | **Flat** solo Supabase user = one tier |
| Wind-test click | Auto guac until **Founder Pass opens**; then disable auto-grant for new users |
| Save gate | ≤2 save-loss incidents / 7 days; no user twice; fix ASAP |
| Founder Pass price | **~$12** one-time (tweak ±$3 if needed at launch) |
| Founder Pass scope | **Lifetime** all current + **future Gojito game content** |
| Demo helper (declined founder) | **6 months** guac → beef |
| Guest tier name | **Bean** (account-less only) |
| Child content tiers | **Beef / guac** only |
| Burrito free slots | **3** children (2 remains a pre-launch tuning option) |
| Solo sign-up | **Always available** — burrito optional |
| Burrito v2 | Multi-burrito child membership + home–school links (Sarah / Jimmy / Mrs. Smith) |
| Social | **Parent/teacher-gated** — no open stranger graph |

---

## Active execution (not optional)

1. Apply Supabase SQL if not done: `access_requests`, `profiles_grant_source`, `access_requests_auto_grant`
2. Finish `docs/LOGIN-SAVES-MVP.md` acceptance matrix (rows 1–2, 5–7)
3. Start 7-day save incident log
4. Trust UX backlog (parent page, save status, fake-door copy) per roadmap Tracks 2–3

---

## Deferred (committed as “later” — not blockers)

- Burrito schema, child login model, teacher SKU, link consent UX
- Gojito Plus subscription pricing and timing
- Stripe automation (until manual founder fulfillment hurts)
- Exact burrito slot / bundle prices ($#.##)

---

## Document index

| Doc | Role |
|-----|------|
| [`PLAN-COMMITMENT-2026.05.31.md`](./PLAN-COMMITMENT-2026.05.31.md) | **This file** — what we committed to |
| [`gojito-roadmap-action-plan-2026.05.31.md`](./gojito-roadmap-action-plan-2026.05.31.md) | Step-by-step execution |
| [`demo-cohort-founder-pass-model-2026.05.31.md`](./demo-cohort-founder-pass-model-2026.05.31.md) | Cohort + SQL grants |
| [`parent-account-burrito-model-2026.05.31.md`](./parent-account-burrito-model-2026.05.31.md) | Future account shape |
| [`monetization-party-plan-2026.05.31.md`](./monetization-party-plan-2026.05.31.md) | Strategy + BMad roundtable archive |
