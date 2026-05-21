# Gojito Backend Implementation Checklist

This checklist operationalizes the confirmed backend behavior decisions for Bean/Beef/Guac.

## Scope and naming

- [ ] Standardize tier identifiers across all repos:
  - `bean` (no account / cookie-only)
  - `beef` (free registered account; legacy `mvp` / `free` normalized away)
  - `guac` (paid entitlement; legacy `gold` / `paid` normalized away)
- [ ] Standardize display labels in UI copy:
  - Bean — Gojito’s bean burrito buddies
  - Beef — Gojito’s Beefy Supreme Team
  - Guac — Gojito’s Guacamole Gang

## Phase 1: Identity and save backbone

### Platform auth

- [ ] Implement platform-level auth entry points in `gojito-platform`.
- [ ] Enable Supabase auth providers:
  - [ ] email/password
  - [ ] Google
- [ ] Add account modal contract usable from embedded game top bars.
- [ ] Add account state endpoint for current session identity/tier.

### Save schema

- [ ] Define save schema `v1` with explicit `schemaVersion`.
- [ ] Include fields for:
  - [ ] progression metrics
  - [ ] unlock progress
  - [ ] achievements
  - [ ] settings
  - [ ] stats (`win/loss/draw/quit`)
- [ ] Implement Bean local persistence adapter (IndexedDB primary).
- [ ] Implement Beef/Guac account persistence adapter (backend/cloud).

### Bean migration

- [ ] Implement Bean -> Beef/Guac migration trigger at login/create-account.
- [ ] Implement merge resolver with default policy: max progression wins.
- [ ] Add idempotency guard so duplicate migrations do not corrupt data.
- [ ] Log migration result metadata for support/debugging.

## Phase 2: Entitlements and unlocks

### Stripe -> backend entitlement sync

- [ ] Add webhook endpoint for Stripe events.
- [ ] Verify webhook signature with `STRIPE_WEBHOOK_SECRET`.
- [ ] Process at minimum:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.paid`
  - [ ] `invoice.payment_failed`
- [ ] Persist normalized entitlement state (`guacActive`, renewal/expiry metadata).
- [ ] Add webhook idempotency handling by event ID.

### Entitlement refresh UX

- [ ] Refresh entitlements on login.
- [ ] Add periodic entitlement refresh while app is active.
- [ ] Add explicit "refresh access" path and clear relog guidance when stale.

### Unlock engine (AND gate)

- [ ] Implement unlock rule evaluator:
  - [ ] Guac entitlement condition
  - [ ] gameplay threshold condition
- [ ] Evaluate on:
  - [ ] round/match completion
  - [ ] login
  - [ ] entitlement update
- [ ] Ensure Bean/Beef progress tracking still accrues for future Guac-gated unlocks.

## Phase 3: Achievements, prompts, and game UX safety

### Achievements and notifications

- [ ] Define achievement catalog structure (ID, condition, metadata).
- [ ] Implement achievement award service with dedupe.
- [ ] Implement first-unlock popup.
- [ ] Implement achievement-earned popup.

### Bean conversion prompts

- [ ] Trigger Bean prompt on first unlock/achievement event.
- [ ] Enforce prompt cooldown: max once per 24 hours.
- [ ] Implement CTA set:
  - [ ] Log in
  - [ ] Create account
  - [ ] Later

### Safe-state account actions

- [ ] Define per-game safe substates where modal is allowed inline.
- [ ] Define per-game blocked states requiring confirmation.
- [ ] Define per-game safe return checkpoint/menu target.
- [ ] Add shared interruption dialog contract across games.

## Phase 4: Leaderboards, multiplayer integrity, and moderation

### Stats and leaderboard rules

- [ ] Store stats in `win/loss/draw/quit` format.
- [ ] Track quit separately and do not auto-convert quit to loss.
- [ ] Implement separate leaderboard namespaces by mode type.
- [ ] Enforce global board eligibility for Beef/Guac accounts only.
- [ ] Implement Bean local leaderboard only.
- [ ] Implement Bean "would-rank" read-only global comparison.

### Multiplayer communication safety

- [ ] Keep emoji whitelist constrained to approved set.
- [ ] Implement launch mute/hide control for opponent emoji output.

### Integrity controls

- [ ] Validate online result submissions server-side.
- [ ] Add replay/duplicate submission protection.
- [ ] Add basic anomaly flags for suspicious score patterns.

## Phase 5: Environments, migrations, and operations

### Environment topology

- [ ] Configure dev environment.
- [ ] Configure staging environment.
- [ ] Configure production environment.
- [ ] Separate Supabase/Stripe/Cloudflare config and secrets per environment.

### Schema migration policy

- [ ] Implement strict versioned migration registry.
- [ ] Run migration on load before data use.
- [ ] Log migration failures with fallback handling.
- [ ] Add migration test fixtures for legacy save versions.

### Observability and support

- [ ] Add structured logs for:
  - [ ] auth transitions
  - [ ] migration events
  - [ ] entitlement updates
  - [ ] unlock decisions
- [ ] Add admin-safe support view for entitlement and migration state.

## Minimum go-live gate

- [ ] Platform auth works end-to-end for Bean -> Beef and Bean -> Guac transitions.
- [ ] Stripe webhook to entitlement sync verified in staging.
- [ ] AND-gated unlock logic validated with real test cases.
- [ ] Bean local progress migrates successfully to account on login.
- [ ] Leaderboard rules enforced exactly (Bean local-only, Beef/Guac global).
- [ ] Prompt cooldown and CTA behavior verified.
- [ ] Save migrations verified with at least one older schema fixture.
