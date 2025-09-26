// computeLayout.js
// Pure utility to compute card and layout metrics based on viewport dimensions
// and a few designer-tunable percentages: edgePaddingPercent and logoPaddingPercent.
// Returns an object with cardW, cardH, radiusX, radiusY, wrapperW, wrapperH, scale, yOffsets

export function computeCardLayout(viewW, viewH, opts = {}) {
  const {
    idealWidth = 430,
    baseCardWidth = 150,
    cardAspect = 4.75 / 2.75, // original app ratio (height / width)
    baseRadiusX = 205,
    baseRadiusY = 240,
    baseYOffsets = [0, 20, 0, 20, 0],
    edgePaddingPercent = 4, // percent of viewport width reserved as left/right padding
    logoPaddingPercent = 8, // percent of viewport height to leave around logo
    maxCanvasWidth = 900,
    minCardWidth = 80,
    maxCardWidth = 260,
  } = opts;

  // clamp helper
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const edgePaddingPx = (edgePaddingPercent / 100) * viewW;
  const canvasW = Math.max(200, Math.min(viewW - edgePaddingPx * 2, maxCanvasWidth));

  // scale relative to ideal width so the layout preserves proportions
  const scale = canvasW / idealWidth;

  // card size derived from base and clamped to reasonable limits
  let cardW = Math.round(baseCardWidth * scale);
  cardW = clamp(cardW, minCardWidth, maxCardWidth);
  const cardH = Math.round(cardW * cardAspect);

  // radius derived by scaling the base radii
  const radiusX = Math.round(baseRadiusX * scale);
  const radiusY = Math.round(baseRadiusY * scale);

  const yOffsets = baseYOffsets.map(v => Math.round(v * scale));

  // wrapper height should accommodate the arc and cards; include some breathing room
  // use logoPaddingPercent to ensure there's space above/below for the logo
  const logoPaddingPx = Math.round((logoPaddingPercent / 100) * viewH);
  // the arc vertical span roughly equals radiusY*2 plus card height; reserve some top room
  const approxH = Math.round(radiusY * 2 + cardH * 0.6 + logoPaddingPx);
  const wrapperH = Math.max(240, approxH);

  return {
    cardW,
    cardH,
    radiusX,
    radiusY,
    yOffsets,
    wrapperW: canvasW,
    wrapperH,
    scale,
    edgePaddingPx,
    logoPaddingPx,
  };
}
