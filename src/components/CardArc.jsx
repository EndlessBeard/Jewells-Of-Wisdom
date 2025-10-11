import React, { useState, useRef, useEffect } from 'react';
import './CardArc.css';
import Logo from './Logo';
import { computeCardLayout } from '../utils/computeLayout';

// card images (front/back) — imported from assets folder
import AboutUs_front from '../assets/AboutUs_front.png';
import AboutUs_back from '../assets/AboutUs_back.png';
import Author_front from '../assets/Author_front.png';
import Author_back from '../assets/Author_back.png';
import Services_front from '../assets/Services_front.png';
import Services_back from '../assets/Services_back.png';
import Subscriptions_front from '../assets/Subscriptions_front.png';
import Subscriptions_back from '../assets/Subscriptions_back.png';
import Shop_front from '../assets/Shop_front.png';
import Shop_back from '../assets/Shop_back.png';

const CARD_DATA = [
  { label: 'About Us', content: 'About Us content...', front: AboutUs_front, back: AboutUs_back },
  { label: 'Author', content: 'Author content...', front: Author_front, back: Author_back },
  { label: 'Service', content: 'Service content...', front: Services_front, back: Services_back },
  { label: 'Subscriptions', content: 'Subscriptions content...', front: Subscriptions_front, back: Subscriptions_back },
  { label: 'Shop', content: 'Shop content...', front: Shop_front, back: Shop_back },
];

function Card({ label, content, style, flipped, onClick, onMouseEnter, onMouseLeave }) {
  return (
    <div
      className={`card-arc-card${flipped ? ' flipped' : ''}`}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="card-arc-inner">
        <div className="card-arc-back" aria-hidden>
          {style && style['--back-img'] ? (
            <img src={style['--back-img']} alt={`${label} back`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
          ) : (
            <div className="card-back-content">
              <h3 className="card-back-title">{label}</h3>
              <p className="card-back-sub">Tap or hover to reveal</p>
            </div>
          )}
        </div>
        <div className="card-arc-front" role="region" aria-label={`${label} details`}>
          {style && style['--front-img'] ? (
            <img src={style['--front-img']} alt={`${label} front`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
          ) : (
            <div className="card-front-content">{content}</div>
          )}
        </div>
      </div>
    </div>
  );
}

const CardArc = ({ onCardClick }) => {
  const [hovered, setHovered] = useState(null);
  const [flipped, setFlipped] = useState(Array(CARD_DATA.length).fill(false));

  // Arc and offset settings
  // Base (ideal) metrics for 430px wide canvas
  const IDEAL_WIDTH = 430;
  const BASE_CARD_WIDTH = 150;
  const BASE_CARD_HEIGHT = BASE_CARD_WIDTH * (4.75/2.75);
  const BASE_RADIUS_X = 205;
  const BASE_RADIUS_Y = 240;
  const BASE_Y_OFFSETS = [0, 20, 0, 20, 0];
  //const centerX = 0;
  //const centerY = 0;
  // Layout constants (kept as fallbacks; CSS makes wrapper responsive)
  const WRAPPER_WIDTH = 520; // max-width in CSS (fallback)
  const WRAPPER_HEIGHT = 320;

  // Logo base constants (moved here so scroll effect can read them)
  // Helper to read logo-related CSS variables at call time (so toolbar sliders update immediately)
  const getLogoVars = () => {
    if (typeof window === 'undefined') return { gap: -420, yAdjust: 0, baseMultiplier: 1.3 };
    const computed = getComputedStyle(document.documentElement);
    const getNum = (name, fallback) => {
      const v = computed.getPropertyValue(name);
      if (!v) return fallback;
      const parsed = parseFloat(v);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    // read percent-based vars (fallback to legacy vars if percent not present)
    const multPercent = getNum('--layout-logo-multiplier-percent', null);
    const gapPercent = getNum('--layout-logo-gap-percent', null);
    const yAdjustPercent = getNum('--layout-logo-yadjust-percent', null);

    const legacyMult = getNum('--base-logo-base-multiplier', 1.3);
    const legacyGap = getNum('--base-logo-gap', -420);
    const legacyY = getNum('--base-logo-y-adjust', 0);

    return {
      baseMultiplierPercent: multPercent != null ? multPercent : legacyMult * 100,
      // don't set gapPercent to a legacy px value; callers should check gapLegacyPx when gapPercent is null
      gapPercent: gapPercent != null ? gapPercent : null,
      yAdjustPercent: yAdjustPercent != null ? yAdjustPercent : null,
      // keep legacy numeric fallbacks too
      gapLegacyPx: legacyGap,
      baseMultiplier: legacyMult,
    };
  };
  // Watermark target values (tweakable)
  const BASE_LOGO_WM_SCALE = 4; // final watermark scale (times original)
  // watermark opacity constant retained for reference but not used
  const BASE_LOGO_WM_OPACITY = 0.15; // final watermark opacity (unused)
  const BASE_LOGO_START = 200; // px (at scale=1) where logo transformation starts
  const BASE_LOGO_END = -240;  // px (at scale=1) where logo reaches watermark state

  const wrapperRef = useRef(null);
  const logoRef = useRef(null);
  const arcRef = useRef(null);
  const [wrapperSize, setWrapperSize] = useState({ width: WRAPPER_WIDTH, height: WRAPPER_HEIGHT });
  const [logoVisual, setLogoVisual] = useState({ opacity: 1, scale: 1, translateY: 0 });

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    // initial measure
    const measure = () => {
      const rect = el.getBoundingClientRect();
      // compute a more robust layout based on viewport and rect
      const layout = computeCardLayout(window.innerWidth, window.innerHeight, { maxCanvasWidth: 900 });
      // prefer the wrapper width but trust computeCardLayout's wrapperW for consistent scaling
      const wrapperH = layout.wrapperH;
      // Positioning is handled by CSS flow; do not mutate element.style.top here.
      setWrapperSize({ width: rect.width || layout.wrapperW, height: wrapperH });
    };

    measure();

    // Prefer ResizeObserver for the wrapper
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => measure());
      ro.observe(el);
    } else {
      // fallback to window resize
      window.addEventListener('resize', measure);
    }

    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', measure);
      try { window.removeEventListener('layout:update', measure); } catch {}
    };
  }, []);

  // respond to live layout updates from the toolbar controls
  useEffect(() => {
    const handler = () => {
      const el = wrapperRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const layout = computeCardLayout(window.innerWidth, window.innerHeight, { maxCanvasWidth: 900 });
      setWrapperSize({ width: r.width || layout.wrapperW, height: layout.wrapperH });
    };
    window.addEventListener('layout:update', handler);
    return () => window.removeEventListener('layout:update', handler);
  }, []);

  // Measure the rendered Logo element and publish a CSS variable so InfoPanel can avoid overlap.
  // Logo measurement and info-panel overlap management removed.

  // Fade / scroll-driven visual calculations
  // Opacity/fade-on-scroll removed — cards are fully opaque at all times.

  // Whenever wrapperSize changes, update CSS variables for responsive scaling
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    // Use the computeCardLayout util to derive stable metrics
    const layout = computeCardLayout(window.innerWidth, window.innerHeight, { maxCanvasWidth: 900 });
    const wrapperW = wrapperSize.width || layout.wrapperW;
    const wrapperH = wrapperSize.height || layout.wrapperH;
    const cardW = layout.cardW;
    const cardH = layout.cardH;
    const radiusX = layout.radiusX;
    const radiusY = layout.radiusY;
    const yOffsets = layout.yOffsets;
    const scale = layout.scale;

    el.style.setProperty('--scale', String(scale));
    el.style.setProperty('--card-w', `${cardW}px`);
    el.style.setProperty('--card-h', `${cardH}px`);
    el.style.setProperty('--radius-x', `${radiusX}px`);
    el.style.setProperty('--radius-y', `${radiusY}px`);
    el.style.setProperty('--wrapper-h', `${wrapperH}px`);

    // store scaled metrics on ref for use in render positioning
    el.__cardMetrics = { cardW, cardH, radiusX, radiusY, yOffsets, wrapperW, wrapperH, scale, logoW: layout.logoW, logoH: layout.logoH };
  }, [wrapperSize]);

  // Ensure the arc container height matches the visual bottom of the cards
  // so the container bottom aligns with the lowest visual point.
  // This computes the max bottom across all cards (more robust than using index 2 only),
  // reads a CSS var for bottom padding, and publishes two CSS vars on :root so other
  // components (InfoPanel) can read the visual bottom if desired.
  useEffect(() => {
    const adjustArcHeight = () => {
      const el = wrapperRef.current;
      const arcEl = arcRef.current || wrapperRef.current;
      const logoEl = logoRef.current && (logoRef.current.firstElementChild || logoRef.current);
      if (!el || !arcEl || !logoEl) return;
      const metrics = el.__cardMetrics || {};
      const cardH = metrics.cardH || BASE_CARD_HEIGHT;
      const wrapperH = metrics.wrapperH || wrapperSize.height || WRAPPER_HEIGHT;

      try {
        const ar = arcEl.getBoundingClientRect();

        // read breathing-room padding from CSS var --cardarc-bottom-padding (fallback 8px)
        const rootStyle = getComputedStyle(document.documentElement);
        const padRaw = rootStyle.getPropertyValue('--cardarc-bottom-padding') || '';
        let padding = 8;
        if (padRaw) {
          const p = parseFloat(padRaw.replace('px',''));
          if (!Number.isNaN(p)) padding = p;
        }

        // Robust approach: measure actual rendered card DOM elements inside arc
        const cardEls = (arcEl.querySelectorAll && arcEl.querySelectorAll('.card-arc-card')) ? Array.from(arcEl.querySelectorAll('.card-arc-card')) : [];
        let maxBottom = -Infinity;
        if (cardEls.length > 0) {
          for (const c of cardEls) {
            try {
              const r = c.getBoundingClientRect();
              // bottom relative to arc top
              const bottomRel = (r.bottom - ar.top);
              if (bottomRel > maxBottom) maxBottom = bottomRel;
            } catch (e) {}
          }
        }

        // If no cards found or measurement failed, fall back to computed arc math
        if (!isFinite(maxBottom) || maxBottom < 0) {
          // fall back to previous math based on computed metrics and logo origin
          const lr = logoEl.getBoundingClientRect();
          const originY = (lr.top - ar.top) + lr.height / 2;
          const total = CARD_DATA.length - 1;
          for (let i = 0; i <= total; i++) {
            const baseAngle = Math.PI - (i * Math.PI) / total;
            const degAdjustRaw = getComputedStyle(document.documentElement).getPropertyValue(`--card-degree-adjust-${i}`) || '0deg';
            const degAdjust = parseFloat(degAdjustRaw) || 0;
            const angle = baseAngle + (degAdjust * Math.PI / 180);
            const rXBase = metrics.radiusX || BASE_RADIUS_X;
            const rYBase = metrics.radiusY || BASE_RADIUS_Y;
            const rAdjRaw = getComputedStyle(document.documentElement).getPropertyValue(`--card-radius-adjust-${i}`) || '100%';
            const rAdj = parseFloat(rAdjRaw.replace('%','')) || 100;
            const rX = Math.round(rXBase * (rAdj / 100));
            const rY = Math.round(rYBase * (rAdj / 100));
            const yOffs = (metrics.yOffsets && metrics.yOffsets[i]) || BASE_Y_OFFSETS[i] || 0;
            const y = rY * Math.sin(angle) + yOffs;
            const topFromCenter = y + originY - cardH / 2;
            const bottomPoint = topFromCenter + cardH;
            if (bottomPoint > maxBottom) maxBottom = bottomPoint;
          }
        }

  // Prefer the measured visual bottom of the cards (plus padding).
  // Keep a small minimum so the arc never collapses too far.
  const MIN_WRAPPER_H = 120;
  const desiredHeight = Math.max(MIN_WRAPPER_H, Math.ceil(maxBottom + padding));

        // apply to arc container so absolute-positioned cards have the correct box
        arcEl.style.height = `${desiredHeight}px`;
        // also publish to the wrapper's CSS var for diagnostics/UI
        try { el.style.setProperty('--wrapper-h', `${desiredHeight}px`); } catch {}

        // publish helpful globals so other components can align to the visual bottom
        try {
          // visual bottom offset inside the arc container
          const prevOffset = getComputedStyle(document.documentElement).getPropertyValue('--cardarc-visual-bottom-offset') || '';
          const newOffset = `${desiredHeight}px`;
          if (prevOffset !== newOffset) {
            document.documentElement.style.setProperty('--cardarc-visual-bottom-offset', newOffset);
          }

          // visual bottom page Y coordinate (useful for absolute positioning)
          // ar.top is viewport-relative; convert to page Y by adding scrollY
          const pageBottomY = Math.round(ar.top + desiredHeight + (window.scrollY || 0));
          const prevPageY = getComputedStyle(document.documentElement).getPropertyValue('--cardarc-visual-bottom-page-y') || '';
          const newPageY = `${pageBottomY}px`;
          if (prevPageY !== newPageY) {
            document.documentElement.style.setProperty('--cardarc-visual-bottom-page-y', newPageY);
          }

          // Only dispatch layout:update if the computed height/pageY changed to avoid recursion
          const last = arcEl.__lastDesiredHeight || 0;
          if (last !== desiredHeight) {
            arcEl.__lastDesiredHeight = desiredHeight;
            try { window.dispatchEvent(new CustomEvent('layout:update', { detail: { source: 'cardarc' } })); } catch (e) {}
          }
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // ignore measurement errors
      }
    };

    // run once after a layout pass to allow images/fonts to settle
    requestAnimationFrame(() => setTimeout(adjustArcHeight, 0));
    window.addEventListener('resize', adjustArcHeight);
    // Add a guarded layout:update listener that ignores events originated by this component
    const onLayoutUpdate = (ev) => {
      try {
        if (ev && ev.detail && ev.detail.source === 'cardarc') return; // ignore our own dispatch
      } catch (e) {}
      adjustArcHeight();
    };
    try { window.addEventListener('layout:update', onLayoutUpdate); } catch {}

    // if the logo contains an <img>, re-run after it loads to avoid undershoot
    try {
      const logoImg = logoRef.current && logoRef.current.querySelector ? logoRef.current.querySelector('img') : null;
      if (logoImg && !logoImg.complete) {
        const onLoad = () => { adjustArcHeight(); logoImg.removeEventListener('load', onLoad); };
        logoImg.addEventListener('load', onLoad);
      }
    } catch (e) {}
    return () => {
      window.removeEventListener('resize', adjustArcHeight);
      try { window.removeEventListener('layout:update', onLayoutUpdate); } catch {}
    };
  }, [wrapperSize]);

  const handleMouseEnter = idx => {
    setHovered(idx);
    setFlipped(f => f.map((v, i) => (i === idx ? true : v)));
  };
  const handleMouseLeave = idx => {
    setHovered(null);
    setFlipped(f => f.map((v, i) => (i === idx ? false : v)));
  };
  const handleClick = idx => {
    if (onCardClick) onCardClick(idx);
  };

  // Render logo at the top and arc container below it. Cards are absolutely positioned inside the arc container.
  return (
    <div className="card-arc-container">
      <div className="card-arc-center-wrapper" ref={wrapperRef}>
        {/* Logo row: centered at top */}
        {(() => {
          const el = wrapperRef.current;
          const metrics = (el && el.__cardMetrics) || {};
          const scale = metrics.scale || (metrics.cardW ? metrics.cardW / BASE_CARD_WIDTH : 1);
          // compute logo width/height: prefer measured logoW/logoH, fallback to multiplier
          const gv2 = getLogoVars();
          const BASE_LOGO_BASE_MULTIPLIER = (gv2.baseMultiplierPercent != null) ? (gv2.baseMultiplierPercent / 100) : gv2.baseMultiplier;
          const computedLogoMultiplier = (() => {
            try {
              const v = getComputedStyle(document.documentElement).getPropertyValue('--logo-size-multiplier');
              if (v) return Number(v.replace('%',''))/100;
            } catch {}
            return 1;
          })();
          const logoW = (metrics && metrics.logoW) ? Math.round(metrics.logoW * computedLogoMultiplier) : ((metrics && metrics.cardW) ? Math.round(metrics.cardW * BASE_LOGO_BASE_MULTIPLIER * computedLogoMultiplier) : Math.round(BASE_CARD_WIDTH * BASE_LOGO_BASE_MULTIPLIER * scale * computedLogoMultiplier));
          const logoH = (metrics && metrics.logoH) ? Math.round(metrics.logoH * computedLogoMultiplier) : logoW;

          const transform = `translateY(${logoVisual.translateY}px) scale(${logoVisual.scale})`;
          const logoStyleInner = {
            width: `${logoW}px`,
            height: `${logoH}px`,
            transform,
            transformOrigin: 'center center',
            pointerEvents: 'none',
            transition: 'transform 220ms linear',
          };

          return (
            <div className={`card-arc-logo`} ref={logoRef}>
              <Logo style={logoStyleInner} label="JW" />
            </div>
          );
        })()}

        {/* Arc container: cards positioned inside here */}
  <div
    className="card-arc-arc"
    ref={arcRef}
    style={{
      position: 'relative',
      width: '100%',
      // use the published visual-bottom offset CSS var so height changes persist
      height: `var(--cardarc-visual-bottom-offset, ${(wrapperRef.current && wrapperRef.current.__cardMetrics ? wrapperRef.current.__cardMetrics.wrapperH : wrapperSize.height) || WRAPPER_HEIGHT}px)`,
    }}
  >
        {CARD_DATA.map((card, i) => {
          // Distribute cards from 180deg (left) to 0deg (right) in equal steps
          const total = CARD_DATA.length - 1;
          // base angle in radians
          const baseAngle = Math.PI - (i * Math.PI) / total; // Math.PI (180deg) to 0 (0deg)
          // read per-card degree adjustment (deg) from CSS var and convert to radians
          const degAdjustRaw = getComputedStyle(document.documentElement).getPropertyValue(`--card-degree-adjust-${i}`) || '0deg';
          const degAdjust = parseFloat(degAdjustRaw) || 0;
          const angle = baseAngle + (degAdjust * Math.PI / 180);
          // read scaled metrics from the wrapper element if available
          const el = wrapperRef.current;
          const metrics = (el && el.__cardMetrics) || {};
          const wrapperW = metrics.wrapperW || wrapperSize.width || WRAPPER_WIDTH;
          const wrapperH = metrics.wrapperH || wrapperSize.height || WRAPPER_HEIGHT;
          const cardW = metrics.cardW || BASE_CARD_WIDTH;
          const cardH = metrics.cardH || BASE_CARD_HEIGHT;
          // per-card radius adjustment multiplier (percent)
          const rXBase = metrics.radiusX || BASE_RADIUS_X;
          const rYBase = metrics.radiusY || BASE_RADIUS_Y;
          const rAdjRaw = getComputedStyle(document.documentElement).getPropertyValue(`--card-radius-adjust-${i}`) || '100%';
          const rAdj = parseFloat(rAdjRaw.replace('%','')) || 100;
          const rX = Math.round(rXBase * (rAdj / 100));
          const rY = Math.round(rYBase * (rAdj / 100));
          const yOffs = metrics.yOffsets || BASE_Y_OFFSETS;

          const x = rX * Math.cos(angle);
          // Use positive sin to place the arc below the origin (9 o'clock -> 6 o'clock -> 3 o'clock)
          const y = rY * Math.sin(angle) + yOffs[i];
          // Place x/y relative to the logo center if available, otherwise wrapper center
          let originX = wrapperW / 2;
          let originY = wrapperH / 2;
          try {
            const logoEl = logoRef.current && logoRef.current.firstElementChild ? logoRef.current.firstElementChild : logoRef.current;
            // prefer computing logo center relative to the arc container (the element that
            // the cards are absolutely positioned within). Previously this used the
            // wrapperRef bounding rect which caused offsets when the logo sits above
            // the arc container.
            const arcEl = (arcRef && arcRef.current) ? arcRef.current : wrapperRef.current;
            if (logoEl && arcEl) {
              const lr = logoEl.getBoundingClientRect();
              const ar = arcEl.getBoundingClientRect();
              // compute logo center relative to arc container top-left
              originX = (lr.left - ar.left) + lr.width / 2;
              originY = (lr.top - ar.top) + lr.height / 2;
            }
          } catch {}

          const leftFromCenter = x + originX - cardW / 2;
          const topFromCenter = y + originY - cardH / 2;
          return (
            <Card
              key={card.label}
              label={card.label}
              content={card.content}
              style={{
                position: 'absolute',
                left: `${leftFromCenter}px`,
                top: `${topFromCenter}px`,
                width: `${cardW}px`,
                height: `${cardH}px`,
                zIndex: 10 + (hovered === i ? 1 : 0),
                opacity: 1,
                // pass front/back image urls for the card faces
                '--front-img': card.front || '',
                '--back-img': card.back || '',
              }}
              flipped={flipped[i]}
              onClick={() => handleClick(i)}
              onMouseEnter={() => handleMouseEnter(i)}
              onMouseLeave={() => handleMouseLeave(i)}
            />
          );
        })}
        </div>
      </div>
    </div>
  );
};

export default CardArc;
