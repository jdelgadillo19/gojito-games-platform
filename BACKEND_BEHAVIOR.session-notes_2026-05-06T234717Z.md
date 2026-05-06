# Session notes (timestamped companion)

**File:** `BACKEND_BEHAVIOR.session-notes_2026-05-06T234717Z.md`  
**UTC:** 2026-05-06T23:47:17Z  

This document **does not replace** [`BACKEND_BEHAVIOR.md`](./BACKEND_BEHAVIOR.md). It preserves working-session decisions and UI parameters so work can be recreated after a repo reset.

---

## A. Backend / platform behavior (session recap)

Aligned with (and expanding slightly on) `BACKEND_BEHAVIOR.md`:

- **Tier source of truth:** Backend profile tier (e.g. Stripe → Workers → persisted profile). Games may mirror tier into Firebase `users/{uid}.tier` via **`GET /api/entitlements/me`** (Bearer Firebase ID token). Canonical short tiers: **bean** (no account), **beef**, **guac**; normalize legacy `mvp` / `gold` / `paid` on read.
- **Guac is global** across `gojitogames.com` for paywalled *product* gates; **gameplay skill thresholds** remain separate (AND gate where required).
- **Refresh UX:** After login and periodically while authenticated, re-sync entitlements; surface clear copy when stale (“refresh access”, re-login).
- **Admin sandbox:** Portal hub admin tools use browser **dummy profiles** and **`gojito.admin.v1.*`** namespaced `localStorage` keys shared with games for view-as-user testing.
- **Cakery / entitlement wiring (separate repos):** Runtime **free vs full** build tier should follow profile Guac (maps to `full` in build config), not only static `BUILD_VERSION`. Arcade locale gates incorrectly keyed off debug-only flags were identified as a bug pattern—paid tier must use the same **`isFeatureUnlocked`-style path** as story flows.

---

## B. Gojito hub portal — Admin & Account modal UX parameters

**Goal:** Scrollable body with **fixed footer “Close”**, predictable **scroll-to-top** on open, **no focus scroll-jump** to bottom, **edge fades** at top/bottom of scroll viewport without hiding the **scrollbar thumb**, scrollbar visually meeting the **footer seam**.

### B.1 DOM shape (footer-fixed panels)

Use for **`#portal-admin-modal`** and **`#portal-account-modal`**:

```html
<div class="portal-modal__panel portal-modal__panel--footer-fixed" role="dialog" …>
  <div class="portal-modal__scroll-clip">
    <div id="portal-admin-modal-scroll" class="portal-modal__panel-scroll">
      <!-- scrollable content -->
    </div>
  </div>
  <button type="button" class="portal-modal__close portal-modal__close--panel-footer" id="portal-admin-close">Close</button>
</div>
```

**Critical:** Close button **outside** `#portal-admin-modal-scroll` so focusing it does not scroll the panel.

### B.2 CSS variables & layout tokens

| Token | Role |
| ----- | ---- |
| `--portal-scroll-offset-top` (`11px`) | Top margin on `.portal-modal__scroll-clip` so scrollbar clears rounded panel corner |
| `--portal-scrollbar-track-margin-block-end` (`-14px`, tweakable) | WebKit: `margin-block-end` on `#portal-*::-webkit-scrollbar-track` to nudge track toward footer seam |

**`.portal-modal__panel--footer-fixed`**

- `display: flex; flex-direction: column; padding: 0`
- `overflow: visible` (avoid clipping native scrollbar thumb at seam)
- `position: relative; isolation: isolate`

**`.portal-modal__scroll-clip`**

- `flex: 1 1 auto; min-height: 0` (required for flex scroll)
- `margin-top: var(--portal-scroll-offset-top)`
- `overflow: visible; position: relative; z-index: 30; transform: translateZ(0)`
- Bottom corner radius: `0 0 calc(var(--radius) - 6px) calc(var(--radius) - 6px)`

**`.portal-modal__panel-scroll`**

- `flex: 1 1 auto; min-height: 0`
- `overflow-x: hidden; overflow-y: auto`
- `padding: 1.15rem 1.75rem 1rem`
- `position: relative; z-index: 0` — **below** fade overlays so gradients show through transparent padding areas

**Edge fades** (`.portal-modal__scroll-clip::before` / `::after`)

- `position: absolute; pointer-events: none; z-index: 2`
- `left: 0; right: 14px` — inset from right so scrollbar gutter stays crisp
- Top strip default height `22px`; bottom `28px` with gradient stops tuned to `--surface`
- Hidden by default `opacity: 0`; transition ~`0.2s`

**Footer**

- `.portal-modal__close--panel-footer`: `flex-shrink: 0`, `z-index: 0`, top border, surface background, bottom panel radius

**Scrollbar styling** (`#portal-admin-modal-scroll`, `#portal-account-modal-scroll`)

- `scrollbar-width: thin`; WebKit width `10px`, transparent track, thumb `rgba(255,255,255,0.32)` rounded
- Thumb: `border-width: 3px 3px 0 3px` transparent + `background-clip: content-box` so thumb reaches bottom of track (no phantom gap above Close)

### B.3 JS hooks (`index.html` inline, before `portal-admin-tools.js`)

- **`window.portalRefreshModalScrollFades()`** — dispatches `portal-sync-scroll-fade` on both scroll roots.
- **`bindPortalModalScrollFade(id)`** — finds `.portal-modal__scroll-clip`, toggles:
  - `--show-top-fade` when `scrollHeight > clientHeight + 2` **and** `scrollTop > 4`
  - `--show-bot-fade` when overflow (`can`) — keeps seam hint above Close even at scroll end
- Observers: `scroll`, `resize`, `ResizeObserver` on element, `MutationObserver` on subtree + `requestAnimationFrame(sync)`.

**Admin script** (`portal-admin-tools.js`): after open / tab switch / `renderAdminForm`, call `scrollAdminPanelToTop()` (`scrollTop = 0` + rAF) and **`portalRefreshModalScrollFades`**; focus primary tab with **`focus({ preventScroll: true })`**.

**Account modal:** same fade refresh after open; focus first game link with `preventScroll`.

### B.4 Z-index / stacking summary

- Scroll clip raised (`z-index: 30`) vs footer (`0`) so scrollbar paints correctly at seam.
- Fades at `z-index: 2`, scroll layer at `0` — fades above scroll **content**, scrollbar still visible in right gutter via `right: 14px` on fades.

---

## C. Files touched in this workstream (for re-application post-reset)

- `gojito-platform/index.html` — modal structure, inline fade script order (before deferred admin script)
- `gojito-platform/styles.css` — classes above
- `gojito-platform/scripts/portal-admin-tools.js` — scroll-to-top, fade refresh, tab focus

---

## D. Post-reset reality check (`origin/main` @ 2026-05-06)

After `git fetch origin && git reset --hard origin/main`, **`gojito-platform`** matched remote commit **`c7e48e9`**. That tree’s `index.html` is still the **minimal** hub (game cards + footer only): it does **not** include Account / Admin modals or inline fade scripts. The modal implementation existed only in **uncommitted local work**; restoring it means reapplying **section B** (and wiring `scripts/portal-admin-tools.js` + matching `styles.css`) or recovering those edits from another clone/backup. This file’s **section B** is the specification source.

---

*End of timestamped notes.*
