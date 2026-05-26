# Gojito chrome contract

Shared navigation shell for hub and all games. Visual source of truth: `packages/gojito-nav/portal-chrome.css` (copied to `gojito-platform/portal-chrome.css` on combined build).

## Component

- **`GojitoNav`** (`@gojito/nav`) — single React component used on hub and in every game
- Hub wrapper: `gojito-platform/src/components/HubGojitoNav.tsx`
- Games: thin wrappers in `GojitoGameChrome` re-exporting `GojitoNav`

## Props

| Prop | Hub | Game |
|------|-----|------|
| `surface` | `'hub'` | `'game'` |
| `showGameSwitcher` | via surface (Games ▾) | — |
| `gameTitle` | — | e.g. `"Cakery Bakery"` |

## CSS tokens

- `--gojito-chrome-height` — content offset (`gojito-nav-offset` / `body.gojito-has-nav .wrap`)
- `--gojito-chrome-z` — 50 (menus at +10)

## Legacy removed

- `portal-brand` fixed chip
- Hub entitlement hero block (`entitlement-status`)
- Build-time injected hub icon in game `index.html`

## Acceptance

See LOGIN-SAVES-MVP row 2: same account chrome hub ↔ game, no Guest flash after hub login.
