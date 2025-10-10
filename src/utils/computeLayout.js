// computeLayout.js
// Pure utility to compute card and layout metrics based on viewport dimensions
// and a few designer-tunable percentages: edgePaddingPercent and logoPaddingPercent.
// Returns an object with cardW, cardH, radiusX, radiusY, wrapperW, wrapperH, scale, yOffsets

export function computeCardLayout(viewW, viewH, opts = {}) {
  // Percentage-based layout inputs. If not provided via opts, CSS vars on :root
  // will be read by name so the toolbar can control them at runtime.
  const getRootNum = (name, fallback) => {
    try {
      if (typeof window === 'undefined') return fallback;
      const v = getComputedStyle(document.documentElement).getPropertyValue(name);
      if (!v) return fallback;
      const parsed = parseFloat(v);
      return Number.isFinite(parsed) ? parsed : fallback;
    } catch (e) {
      return fallback;
    }
  };

  const {
    // base geometry (preserve original aspect and base radii so shapes remain familiar)
    baseCardWidth = 150,
    cardAspect = 4.75 / 2.75,
    baseRadiusX = 205,
    baseRadiusY = 240,
    baseYOffsets = [0, 20, 0, 20, 0],
    // percentage controls (prefer opts, otherwise read CSS vars, otherwise fallback)
    cardPercent = opts.cardPercent != null ? opts.cardPercent : getRootNum('--layout-card-percent', 22), // percent of viewport width
    logoPercent = opts.logoPercent != null ? opts.logoPercent : getRootNum('--layout-logo-percent', 8), // percent of viewport width (logo is square)
    logoPaddingPercent = opts.logoPaddingPercent != null ? opts.logoPaddingPercent : getRootNum('--layout-logo-padding-percent', 6), // percent of viewport height for extra space
    edgePaddingPercent = opts.edgePaddingPercent != null ? opts.edgePaddingPercent : getRootNum('--layout-edge-padding-percent', 4), // percent of viewport width per side
    // clamps and canvas
    maxCanvasWidth = opts.maxCanvasWidth != null ? opts.maxCanvasWidth : 900,
    minCardWidth = opts.minCardWidth != null ? opts.minCardWidth : 80,
    maxCardWidth = opts.maxCardWidth != null ? opts.maxCardWidth : 360,
  } = opts;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // compute paddings and canvas using viewport width
  const edgePaddingPx = (edgePaddingPercent / 100) * viewW;
  const canvasW = Math.max(200, Math.min(viewW - edgePaddingPx * 2, maxCanvasWidth));

  // card width is expressed as a percent of viewport width (so it's consistent across sizes)
  let cardW = Math.round((cardPercent / 100) * viewW);
  cardW = clamp(cardW, minCardWidth, maxCardWidth);
  const cardH = Math.round(cardW * cardAspect);

  // scale relative to the base card width so other geometry scales consistently
  const scale = cardW / baseCardWidth;

  // radii scale with the card
  const unclampedRadiusX = Math.round(baseRadiusX * scale);
  const safetyPx = opts.safetyPx != null ? opts.safetyPx : 8;
  // ensure cards fit horizontally: max radius so left/right cards stay inside canvasW
  const maxRadiusX = Math.floor(Math.max(0, (canvasW - cardW) / 2 - safetyPx));
  const radiusX = Math.min(unclampedRadiusX, Math.max(0, maxRadiusX));
  const radiusY = Math.round(baseRadiusY * scale);

  // apply a global radius percent modifier (read from root CSS var if present)
  const radiusPercent = getRootNum('--cardarc-radius-percent', 100); // percent
  const radiusScale = radiusPercent / 100;
  const radiusXFinal = Math.round(radiusX * radiusScale);
  const radiusYFinal = Math.round(radiusY * radiusScale);

  const yOffsets = baseYOffsets.map(v => Math.round(v * scale));

  // logo size: square, derived from viewport width percent
  const logoW = Math.round((logoPercent / 100) * viewW);
  const logoH = logoW;

  const logoPaddingPx = Math.round((logoPaddingPercent / 100) * viewH);

  const approxH = Math.round(radiusY * 2 + cardH * 0.6 + logoPaddingPx);
  const wrapperH = Math.max(240, approxH);

  return {
    cardW,
    cardH,
    radiusX: radiusXFinal,
    radiusY: radiusYFinal,
    yOffsets,
    wrapperW: canvasW,
    wrapperH,
    scale,
    edgePaddingPx,
    logoPaddingPx,
    logoW,
    logoH,
    // echo back the percent controls used so callers / debug HUDs can show them
    cardPercent,
    logoPercent,
    logoPaddingPercent,
    edgePaddingPercent,
    radiusPercent,
  };
}
