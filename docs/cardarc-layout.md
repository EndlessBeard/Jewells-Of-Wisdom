# CardArc Layout — logic and rules

This document describes how the CardArc component positions and scales the cards and the logo. It captures the math, inputs/outputs, CSS variables, runtime events, and tuning guidance so designers and engineers can reason about and modify layout consistently.

## Overview

CardArc arranges a set of cards along an arc (half-ellipse) and places a circular logo anchored above the arc. The layout is computed from viewport dimensions and a small set of designer-tunable percentages. There are two cooperating parts:

- `computeCardLayout(viewW, viewH, opts)` — pure utility that computes pixel metrics (card width/height, radii, wrapper size, logo size) from viewport dimensions and percentage inputs.
- `CardArc.jsx` (and `TestCardArc.jsx`) — consumes the computed metrics, measures the wrapper DOM, and places the cards and the logo using absolute positioning inside a center wrapper.

The runtime supports live adjustments via toolbar controls that write CSS variables on `:root` and dispatch a `layout:update` event so the UI updates immediately.

---

## Inputs (what affects layout)

1. Viewport size — `viewW` (window.innerWidth) and `viewH` (window.innerHeight).
2. Percentage controls (either passed via `opts` to the util or read from `:root` CSS variables):
   - `cardPercent` (`--layout-card-percent`) — card width as percent of viewport width (default ~22).
   - `logoPercent` (`--layout-logo-percent`) — logo width as percent of viewport width (default ~8).
   - `logoPaddingPercent` (`--layout-logo-padding-percent`) — vertical breathing room (percent of viewport height) used when computing wrapper height (default ~6).
   - `edgePaddingPercent` (`--layout-edge-padding-percent`) — left/right padding as percent of viewport width (default ~4).
   - `logoMultiplierPercent` (`--layout-logo-multiplier-percent`) — multiplier for computing logo from card width when `logoPercent` is not used (expressed as percent, e.g. `130` = 1.3× card width). Toolbar sets this var and a compatibility var is written for legacy consumers.
   - `logoGapPercent` (`--layout-logo-gap-percent`) — vertical gap between arc and logo expressed as percent of the card height (can be negative to overlap upward).
   - `logoYAdjustPercent` (`--layout-logo-yadjust-percent`) — small vertical adjustment for fine tuning expressed as percent of card height.

3. Legacy CSS vars (kept for compatibility):
   - `--base-logo-base-multiplier` (multiplier, e.g., 1.3)
   - `--base-logo-gap` (px)
   - `--base-logo-y-adjust` (px)
   These are still supported: the new percent vars are preferred, but the code falls back to legacy px values if percent vars are absent.

4. `maxCanvasWidth` — a cap on the layout canvas width (default 900) to avoid overly stretched layouts on very wide displays.

5. `baseCardWidth`, `cardAspect`, `baseRadiusX`, `baseRadiusY` — internal base geometry used to keep the shape familiar as scale changes. They are constant defaults in the util.

---

## computeCardLayout(viewW, viewH, opts)

This pure function returns an object with the main metrics used by the layout renderer.

Signature:
- computeCardLayout(viewW: number, viewH: number, opts?: object) => {
  cardW, cardH, radiusX, radiusY, yOffsets, wrapperW, wrapperH, scale,
  edgePaddingPx, logoPaddingPx, logoW, logoH,
  cardPercent, logoPercent, logoPaddingPercent, edgePaddingPercent
}

Core rules and formulas:
- edgePaddingPx = (edgePaddingPercent / 100) * viewW
- canvasW = clamp(viewW - 2 * edgePaddingPx, min=200, max=maxCanvasWidth)
- cardW = clamp(round((cardPercent / 100) * viewW), minCardWidth, maxCardWidth)
- cardH = round(cardW * cardAspect)
- scale = cardW / baseCardWidth
- radiusX = round(baseRadiusX * scale)
- radiusY = round(baseRadiusY * scale)
- yOffsets = baseYOffsets.map(v => round(v * scale))
- logoW = round((logoPercent / 100) * viewW)  // square logo
- logoH = logoW
- logoPaddingPx = round((logoPaddingPercent / 100) * viewH)
- wrapperH ≈ round(radiusY * 2 + cardH * 0.6 + logoPaddingPx) (clamped to a minimum)

Returned values include both pixel results and the percent values used (so UIs can show both).

Notes:
- The util is safe to call on the server (it will fall back to defaults if `window` is not available).
- If explicit percent values are passed in `opts`, those override CSS vars.

---

## CardArc rendering rules

1. Wrapper measurement
   - `CardArc` renders a centered wrapper (absolute-or-flex container with a measured width). The wrapper width generally equals the computed `wrapperW` (canvasW) but the code prefers the actual measured `getBoundingClientRect()` width when available.
   - The wrapper height uses `wrapperH` from the util.

2. Card placement along an arc
   - Cards are distributed from left (180°) to right (0°) across N cards in equal angular steps.
   - For each card at angle θ (radians), compute:
     - x = radiusX * cos(θ)
     - y = -radiusY * sin(θ) + yOffsets[i]
   - Convert to absolute positions relative to wrapper center:
     - left = x + wrapperW / 2 - cardW / 2
     - top = y + wrapperH / 2 - cardH / 2
   - Cards are absolutely positioned with computed left/top and have shadows, z-index adjustments on hover, and per-card opacity computed by scroll-based fade math.

3. Keep cards visible on screen (toolbar anchor — new behavior)
   - The wrapper's vertical placement is anchored relative to the bottom of the toolbar. The center of the arc will be computed so the arc area is generally visible in the viewport below the toolbar.
   - The measure code uses the toolbar bottom y-coordinate (if present) to determine available vertical space and positions wrapper center in the midpoint between the toolbar bottom and available viewport bottom, clamped so the cards are not pushed off-screen.
   - This ensures cards remain visible even when the toolbar height or viewport height changes.

4. Scroll-driven fading and logo watermark
   - Card opacity is computed from card bottom position relative to fadeStart and fadeEnd thresholds (these are scaled by the layout `scale` so thresholds work consistently across sizes).
   - The logo transitions into a watermark based on scroll: the code computes a progress t in [0,1] from two watermark anchor positions and interpolates scale/opacity/translate accordingly.

---

## Logo positioning and sizing

1. Primary sizing
   - If `logoPercent` (the percent-driven logo width) is present, `logoW` and `logoH` are taken directly from computeCardLayout.
   - Otherwise, fallback is `logoW = round(cardW * (logoMultiplierPercent / 100))` (multiplier expressed as percent in the toolbar).

2. Vertical anchor math
   - The logo center is anchored relative to the wrapper center by computing a vertical offset:
     - gapPx is taken from `logoGapPercent` (percent of `cardH`) if present; otherwise legacy `--base-logo-gap` px is used.
     - logoY = - (radiusY + cardH / 2 + gapPx * scale) + (yAdjustPx * scale)
     - This positions the logo above the arc (negative y) and supports overlap by using negative gap values.

3. Fine-tuning
   - `logoYAdjustPercent` adjusts the logo vertically by percent of card height (positive/negative). This enables fine-grain tuning independent of gap.
   - Toolbar controls write the percent values to `:root` CSS vars. `CardArc` reads them and converts to px at render time.

4. Watermark transform
   - On scroll, the logo animates via CSS transform: translateY and scale computed in JS and applied inline. Opacity is interpolated to the final watermark opacity.

---

## Runtime wiring and events

- Toolbar writes CSS variables on `document.documentElement` and persists values to localStorage (keys under `jow.layout.*`).
- When a toolbar control changes a layout variable, it dispatches two events:
  - `window.dispatchEvent(new Event('resize'))` (legacy compatibility)
  - `window.dispatchEvent(new CustomEvent('layout:update'))` (explicit, fast update)
- `CardArc` and `TestCardArc` listen for `layout:update` and re-run the wrapper measurement + recompute layout to update positions in real-time.
- Debug visuals: `:root.debug-outlines` (enabled by test page) shows bright outlines for quick visual debugging.

---

## CSS variables mapped to controls / keys

- `--layout-card-percent` (localStorage: `jow.layout.cardPercent`)
- `--layout-logo-percent` (localStorage: `jow.layout.logoPercent`)
- `--layout-logo-padding-percent` (localStorage: `jow.layout.logoPaddingPercent`)
- `--layout-edge-padding-percent` (localStorage: `jow.layout.edgePaddingPercent`)
- `--layout-logo-multiplier-percent` (localStorage: `jow.layout.logoMultiplierPercent`) — written also to legacy `--base-logo-base-multiplier` for compatibility
- `--layout-logo-gap-percent` (localStorage: `jow.layout.logoGapPercent`)
- `--layout-logo-yadjust-percent` (localStorage: `jow.layout.logoYAdjustPercent`)

Legacy vars (still supported): `--base-logo-base-multiplier`, `--base-logo-gap`, `--base-logo-y-adjust`.

---

## Edge cases and recommended defaults

- Very narrow viewports (phones): cardPercent should be low (8-18%) to avoid clipping. Minimum card width is clamped (default 80px).
- Very wide viewports: `maxCanvasWidth` prevents cards from spreading too far. Adjust `maxCanvasWidth` if you want bigger layouts on desktops.
- Toolbar height changes: the wrapper measure anchors to the toolbar bottom so layout remains visible without scroll.
- If you remove the debug outlines file, re-enable debug class only when needed or add a keyboard toggle to avoid visual noise.

---

## Tuning checklist

- To make cards smaller on mobile: reduce `--layout-card-percent` (Toolbar: Card width %).
- To make the logo larger relative to cards: increase `--layout-logo-multiplier-percent` or `--layout-logo-percent`.
- To move logo closer/further from arc: adjust `--layout-logo-gap-percent` (negative to overlap upwards).
- To nudge logo up/down: `--layout-logo-yadjust-percent`.
- For live interactive tuning: use the test page `/__cardarc_test` and the toolbar controls — changes are applied in realtime.

---

## Developer notes

- `computeCardLayout` is the authoritative place for layout math. Keep it pure and deterministic (inputs -> outputs).
- When adding new percent controls, ensure they are persisted to `localStorage` and exposed as `--layout-*` CSS vars so the util can read them.
- When changing the concept of vertical anchoring (e.g., attach to a different element than the toolbar), update both CardArc and TestCardArc measurement logic to keep them in sync.

---

If you'd like, I can also add a small debug HUD on the test page that prints the active percent values along with computed px values (cardW, cardH, radiusX, radiusY, logoW, logoH) to make visual tuning faster.
