# GOJITO EXECUTIVE VISUAL STYLE GUIDE v1

## CORE PHILOSOPHY

Gojito is a stylized educational arcade universe.

Visuals should feel:
- warm
- playful
- readable
- adventurous
- game-first
- emotionally approachable

Visuals should NOT feel:
- corporate
- sterile
- hyper-babyish
- overly gender-coded
- photorealistic
- excessively detailed

The world should resemble an animated storybook arcade universe that can support multiple game genres while remaining visually cohesive.

---

# UNIVERSAL VISUAL RULES

## Readability First

All assets must prioritize:
- strong silhouettes
- immediate readability
- clean interaction clarity
- gameplay comprehension

Math gameplay should always remain visually understandable within 1–2 seconds.

---

## Rendering Style

Preferred rendering style:
- stylized illustration
- semi-flat shading
- simplified painterly texture
- bold readable forms
- moderate detail density

Avoid:
- hyper realism
- noisy textures
- excessive gradients
- muddy values
- over-rendering

---

## Character Proportions

Characters should use:
- expressive stylized anatomy
- moderate cartoon proportions
- approx 1:2.5 to 1:4 head/body ratio

Avoid:
- extreme chibi ratios
- doll-like anatomy
- overly tiny limbs
- infant-coded proportions

---

## Emotional Tone

Characters should feel:
- expressive
- friendly
- energetic
- curious
- adventurous

Avoid overuse of:
- blush
- sparkles
- bows
- frills
- overly soft/pastel emotional coding

Warmth is encouraged.
Over-cuteness is discouraged.

---

# UI DESIGN RULES

UI should feel:
- tactile
- game-like
- modular
- chunky
- readable

Preferred UI traits:
- rounded panels
- bold icons
- strong contrast
- clean hierarchy
- limited decoration

Avoid:
- excessive ornamentation
- tiny text
- thin borders
- clutter
- overly mobile-casual aesthetics

---

# COLOR RULES

Global palette philosophy:
- warm neutrals
- saturated accent colors
- controlled palette usage
- thematic color variation allowed per game

Core brand tones:
- cream
- warm white
- charcoal brown
- teal
- golden yellow
- leaf green
- sky blue

Pink may be used as an accent, but should not dominate the global visual identity.

---

# ASSET REUSABILITY

Assets should be designed for:
- modular reuse
- scalable UI systems
- animation compatibility
- cross-game ecosystem consistency

All generated assets should maintain compatibility with:
- future MMO hub integration
- avatar systems
- shared UI infrastructure

---

# PNG AND UI CHROME EXPORT RULES

Compositable UI art (panels, frames, banners, sliders, pattern overlays, icons) must ship as **true PNG-24 with alpha**.

**Required**
- Transparent background — no baked checkerboard or grey/white matte
- Clean alpha edges — no unintended **black** or **white** halos around frames (export from tools with transparency enabled, not “save for web” on a flat color)
- Motif-only overlays (e.g. claimed tile patterns) use **transparent cells**; color tints come from CSS or a separate layer in-engine

**Rejected**
- Flat rectangular borders baked into chrome that should be CSS (`border`, `box-shadow`) unless intentional carved frame art
- Opaque fills in the center of nine-slice panels meant to hold live HTML/UI
- Placeholder checkerboard visible in the file

**Integration**
- Prefer nine-slice or layered stacks (frame + HTML content) over single flattened mockups with fake buttons
- Document intended safe zones (inner rect) per asset in the game’s art-review folder

---

# DISTRICT VARIANCE (PER-GAME IDENTITY)

Gojito is one universe with multiple **districts** (games). Each district has its own theme, palette, and mood. The **platform layer** (hub, nav, account, shared UI, math HUD rules) must stay neutral and broad-appeal. District flavor must not become the default Gojito look.

## What stays shared (platform contract)

All districts and the hub must share:

- Executive rendering style (stylized illustration, semi-flat, bold silhouettes)
- Character proportion band (approx 1:2.5–1:4 head/body; no chibi, no infant coding)
- UI component geometry (chunky panels, rounded corners, strong contrast, readable type)
- Math/problem safe zone (largest type = active problem; no decorative competition)
- Icon stroke weight and button hierarchy
- Emotional baseline: warm, playful, adventurous — not corporate, not hyper-babyish

When in doubt, match the hub and shared chrome, not the cutest game in the roster.

## What varies per district (local only)

Each game may own:

- Primary palette and accent colors (see game style guides)
- Environment art, backgrounds, and props
- Mascots and mode-specific hero assets
- Motion accent (e.g. water splash vs oven warmth)
- Density of whimsy (cozier districts may be softer; exploration districts stay breezier)

District assets must still pass readability and proportion rules above.

## Cakery Bakery district

**Role:** Cozy dessert neighborhood — intentionally warmer and softer than other districts.

**May emphasize:** cream and cinnamon tones, bakery motifs, handcrafted props, cheerful workplace energy, slightly higher whimsy **inside the game view**.

**Must not export to platform:** hyper-feminized costumes, frills, bows, blush/sparkle vocabulary, doll posing, or pink-dominated global UI. Cakery’s style guide already caps this; those limits apply to hub and sibling games.

**Hub presence:** Game card and icon use Cakery palette **inside the card frame**; nav, account, and outer shell stay executive neutral.

## Calculator Cove district

**Role:** Tropical math adventure — exploration and arcade clarity.

**May emphasize:** ocean teal, sand, map/parchment UI accents, treasure and navigation motifs, bouncy environmental motion at the **edges** of the playfield.

**Must not export to platform:** pirate-horror grit, neon tropical overload, or survival/danger tone. Cute fauna stays peripheral (menu or margins), not on the math HUD.

**Hub presence:** Same card-frame rule as Cakery — district color inside the poster, shared chrome outside.

## Anti-patterns (universe-wide)

- One game’s gender or age coding becomes hub defaults (e.g. bakery softness on Cove menus).
- Per-mode full UI reskins before a shared component kit exists.
- Illustrations that reduce math readability below the 1–2 second executive standard.
- New districts that ignore executive proportions in favor of trend-chasing mobile-casual art.

## Hub (placeholder today)

Until hub world art ships, the hub should use **executive kit only**: neutral warm base, game cards as district posters, shared nav. Do not illustrate a full hub environment before at least two games share the same card and navigation system.

Game-specific style guides (Cakery Bakery, Calculator Cove, etc.) extend this document; they do not override universal rules or platform contract.

---

# GOJITO VISUAL NORTH STAR

"Playable Storybook Arcade"

The universe should feel:
- educational without feeling academic
- playful without feeling infantile
- stylized without feeling chaotic
- cozy without feeling fragile