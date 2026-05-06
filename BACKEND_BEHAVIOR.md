# Backend behavior

## Brand and mascot

- **Gojito Games** is the umbrella brand.
- **Mascot:** **Gojito the Burrito Bandito** — a DJ whose head is a burrito oriented horizontally (the flat circular ends read as “ears”). He wears over-ear headphones on those ears and sunglasses (lenses only, no arms) where his eyes would be.

## Account tiers (canonical names)

Short names are used in UI and internal enums; full phrases are marketing copy.

| Short | Full name |
| ----- | --------- |
| **Bean** | Gojito’s bean burrito buddies |
| **Beef** | Gojito’s Beefy Supreme Team |
| **Guac** | Gojito’s Guacamole Gang |

Internal IDs: `bean` (no account), `beef` (free account), `guac` (paid entitlement). Legacy storage may still contain `mvp` / `gold` / `paid` — normalize to **Beef** / **Guac** on read.

## Authentication scope

- Login happens at the Gojito Games platform level.
- There is no unique login requirement per game (for example, no separate login for Cakery Bakery or Calculator Cove).
- Launch auth methods:
  - email/password
  - Google sign-in

## In-game account management UX

- Each game should expose account controls at the top of the game page (for example, the top rim display bar pattern in Cakery Bakery).
- Account actions include at least: log in, log out, and settings.
- Clicking an account icon should open a popup/modal so the player can authenticate without leaving the current page.
- If an account action would be game-breaking during active gameplay, the game should allow inline auth/settings only in safe substates and otherwise must:
  - warn the player,
  - explain that continuing will return them to a safe menu point,
  - require confirmation before proceeding.
- Some advanced account management flows may navigate to a dedicated `gojitogames.com` route branch outside any game directory.

## Save data behavior

### Bean (logged out)

- Bean game data (including saves/progress) is stored locally in browser storage.
- IndexedDB is the primary local storage layer.
- Clearing local browser storage deletes Bean local save data.

### Beef / Guac (logged in)

- Beef and Guac game data is saved to account-backed storage.
- Data is accessible whenever the player logs in.
- Players manage account data in profile settings.
- Bean → Beef/Guac migration policy:
  - default merge behavior is max progression wins.

## Paywall and entitlement model

- Guac entitlements are global across all of `gojitogames.com`.
- If a Guac player logs in, paid content is unlocked sitewide.
- Global Guac entitlement does not automatically bypass game-specific gameplay unlock thresholds.
- Entitlement source of truth is backend state synchronized from Stripe webhooks (and optional **admin API** for manual Guac grant/revoke).
- Guac entitlement UX behavior:
  - refresh entitlement on login,
  - auto-check entitlement while user is active in app,
  - if stale, show clear instruction to log out/in or refresh access.

Example:

- In Cakery Bakery, hard mode can be Guac-only.
- Hard mode should also require a gameplay threshold (example: `100% accuracy on 10 rounds of medium with a minimum of 5 transactions`).
- Guac access grants the right to unlock hard mode, not automatic immediate access.

## Unlock gating logic (AND gate)

- Unlocks that require both monetization and skill/progression should use an AND gate:
  - entitlement condition (Guac), and
  - gameplay threshold condition.
- Beef and Bean users still track threshold progress.
- If a player later purchases membership after already meeting the threshold, the feature unlocks immediately upon purchase/login sync.

## Notifications

- Show a popup the first time a player unlocks a new feature.
- Implement achievements.
- Show a popup when a player earns an achievement.

## Prompting and migration for non-logged-in users

- For Bean users, if the player has just unlocked something or earned an achievement, trigger prompt on the first such event.
- Prompt frequency cap is once every 24 hours if dismissed.
- Prompt CTA includes:
  - Log in
  - Create account
  - Later
- If the player has existing local progress (cookies/storage) when creating/logging into an account, copy/merge that data into account data so progress is not lost.

## Leaderboards and integrity rules

- Maintain separate leaderboards by mode type.
- Bean scores are local-device only and do not write to global leaderboards.
- Bean players can see where their local result would rank relative to global leaderboard stats.
- Global leaderboard writes require account identity (Beef/Guac).
- Quit is tracked separately and does not automatically count as loss.

## Online communication safety

- Online emoji communication uses strict whitelist.
- Include emoji mute/hide control at launch.

## Environment and compatibility policy

- Use three environments:
  - dev
  - staging
  - production
- Preserve compatibility of old save data via strict versioned migrations.

## Open product decisions (remaining TBD)

- Define exact safe substates and safe return checkpoints per game mode.
- Define final dedicated account route map outside game directories.
- Define exact anti-abuse rules for online leaderboard submissions.
