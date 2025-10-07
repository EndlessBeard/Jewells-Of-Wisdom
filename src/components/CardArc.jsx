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

const CardArc = ({ onCardClick, fadeStart = 300, fadeEnd = 50 }) => {
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
  const BASE_LOGO_WM_OPACITY = 0.15; // final watermark opacity
  const BASE_LOGO_START = 200; // px (at scale=1) where logo transformation starts
  const BASE_LOGO_END = -240;  // px (at scale=1) where logo reaches watermark state

  const wrapperRef = useRef(null);
  const logoRef = useRef(null);
  const [wrapperSize, setWrapperSize] = useState({ width: WRAPPER_WIDTH, height: WRAPPER_HEIGHT });
  const [opacities, setOpacities] = useState(Array(CARD_DATA.length).fill(1));
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
      // position wrapper vertically: center in the area below the toolbar so cards remain on screen
      try {
        const toolbarEl = document.querySelector('.toolbar');
        const toolbarBottom = toolbarEl ? Math.round(toolbarEl.getBoundingClientRect().bottom) : 0;
        // Read tunable spacing vars from :root so designers can adjust without code edits
        const rootComputed = getComputedStyle(document.documentElement);
        const parseNum = (s, fallback) => {
          if (!s) return fallback;
          const p = parseFloat(s);
          return Number.isFinite(p) ? p : fallback;
        };
        const bottomPadding = parseNum(rootComputed.getPropertyValue('--cardarc-bottom-padding'), 12);
        const availableH = Math.max(0, window.innerHeight - toolbarBottom - bottomPadding);
        // center the wrapper in availableH, but clamp so it stays visible
  // Read toolbar gap: prefer percent-based var (percent of viewport height), fall back to legacy px var
  const toolbarGapPercent = parseNum(rootComputed.getPropertyValue('--layout-toolbar-gap-percent'), null);
  const legacyPxGap = parseNum(rootComputed.getPropertyValue('--cardarc-toolbar-gap'), 8);
  const minGap = (toolbarGapPercent != null && !Number.isNaN(toolbarGapPercent)) ? Math.round((toolbarGapPercent / 100) * window.innerHeight) : legacyPxGap;
  let topPos = toolbarBottom + Math.max(minGap, Math.round((availableH - wrapperH) / 2));
  // ensure wrapper doesn't overflow bottom
  if (topPos + wrapperH > window.innerHeight - bottomPadding) topPos = Math.max(toolbarBottom + minGap, window.innerHeight - bottomPadding - wrapperH);
        // apply top position to wrapper element
        try { el.style.top = `${topPos}px`; } catch (e) {}
      } catch (e) {
        /* ignore positioning failures */
      }
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
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let raf = null;
    let timeoutId = null;
    const DEBUG = false; // set to true to enable console.debug of measurements

    const setVar = (v) => {
      try {
        document.documentElement.style.setProperty('--panel-offset-from-logo', `${v}px`);
        // also set a measured gap var (logo bottom -> info panel top)
        document.documentElement.style.setProperty('--logo-to-panel-gap', `${Math.max(0, v)}px`);
      } catch (e) {
        // ignore
      }
    };

    const measureLogo = () => {
      const logoEl = logoRef.current;
      const infoEl = document.querySelector('.info-panel');
      if (!logoEl) {
        if (DEBUG) console.debug('measureLogo: no logoEl');
        return setVar(0);
      }
      const logoRect = logoEl.getBoundingClientRect();
      const padding = 12; // px of breathing room

      // If we can find the info panel, compute precise gap from logo bottom to info panel top
      if (infoEl) {
          const infoRect = infoEl.getBoundingClientRect();
          const gap = infoRect.top - logoRect.bottom;
          const measuredGap = Math.max(0, Math.round(gap));
          // Read desired padding from a CSS var so designers can tune without code edits
          const rootComputed = getComputedStyle(document.documentElement);
          const desiredStr = rootComputed.getPropertyValue('--desired-logo-panel-padding');
          let desiredPadding = 24; // default px
          if (desiredStr) {
            const parsed = parseFloat(desiredStr);
            if (Number.isFinite(parsed)) desiredPadding = parsed;
          }
          // Compute new offset so InfoPanel will be positioned at logo bottom + desiredPadding
          const offset = Math.max(0, Math.round(logoRect.bottom + desiredPadding));
          if (DEBUG) console.debug('measureLogo:', { logoRect, infoRect, gap, measuredGap, desiredPadding, offset });
          try {
            // set panel offset to logo bottom + desired padding
            document.documentElement.style.setProperty('--panel-offset-from-logo', `${offset}px`);
            // expose both the actual measured gap and the desired gap
            document.documentElement.style.setProperty('--logo-to-panel-gap', `${measuredGap}px`);
            document.documentElement.style.setProperty('--logo-to-panel-desired-gap', `${Math.round(desiredPadding)}px`);
          } catch (e) {
            /* ignore */
          }
        return;
      }

      // fallback: no info panel found; use logo bottom + padding
      const offset = Math.max(0, Math.round(logoRect.bottom + padding));
      if (DEBUG) console.debug('measureLogo fallback:', { logoRect, offset });
      setVar(offset);
    };

    const onResizeOrScroll = () => {
      if (raf != null) return;
      raf = requestAnimationFrame(() => {
        measureLogo();
        raf = null;
      });
    };

    // initial measure after a short delay to allow layout to settle
    timeoutId = setTimeout(() => {
      measureLogo();
    }, 80);

    window.addEventListener('resize', onResizeOrScroll);
    window.addEventListener('scroll', onResizeOrScroll, { passive: true });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(timeoutId);
      window.removeEventListener('resize', onResizeOrScroll);
      window.removeEventListener('scroll', onResizeOrScroll);
    };
  }, []);

  // Fade / scroll-driven visual calculations
  useEffect(() => {
    let rafId = null;

    const computeOpacities = () => {
      const el = wrapperRef.current;
      const metrics = (el && el.__cardMetrics) || {};
      const wrapperW = metrics.wrapperW || wrapperSize.width || WRAPPER_WIDTH;
      const wrapperH = metrics.wrapperH || wrapperSize.height || WRAPPER_HEIGHT;
      const cardW = metrics.cardW || BASE_CARD_WIDTH;
      const cardH = metrics.cardH || BASE_CARD_HEIGHT;
      const rX = metrics.radiusX || BASE_RADIUS_X;
      const rY = metrics.radiusY || BASE_RADIUS_Y;
      const yOffs = metrics.yOffsets || BASE_Y_OFFSETS;
      const scale = metrics.scale || (metrics.cardW ? metrics.cardW / BASE_CARD_WIDTH : 1);

      const rect = el ? el.getBoundingClientRect() : { top: 0, left: 0 };

      const fadeStartPx = (fadeStart || 320) * scale; // px from top of viewport
      const fadeEndPx = (fadeEnd || 80) * scale;

      const newOpacities = CARD_DATA.map((_, i) => {
        const total = CARD_DATA.length - 1;
        const angle = Math.PI - (i * Math.PI) / total;
        const x = rX * Math.cos(angle);
        const y = -rY * Math.sin(angle) + yOffs[i];
        const leftFromCenter = x + wrapperW / 2 - cardW / 2;
        const topFromCenter = y + wrapperH / 2 - cardH / 2;

        // Use the bottom-center of the card as the anchor for fading
        const cardBottomPageY = rect.top + topFromCenter + cardH; // card bottom relative to viewport top

        // opacity calculation: fully visible when card bottom >= fadeStartPx
        // fully transparent when card bottom <= fadeEndPx
        if (cardBottomPageY >= fadeStartPx) return 1;
        if (cardBottomPageY <= fadeEndPx) return 0;
        // interpolate between end and start
        const t = (cardBottomPageY - fadeEndPx) / (fadeStartPx - fadeEndPx);
        return Math.max(0, Math.min(1, t));
      });

      setOpacities(newOpacities);


  // Logo watermark/zoom/fade behavior intentionally disabled.
  // Previously we calculated a scroll-driven transform and opacity to morph the
  // logo into a watermark; that effect is bypassed and the logo remains static.
  setLogoVisual({ opacity: 1, scale: 1, translateY: 0 });

      rafId = null;
    };

    const onScroll = () => {
      if (rafId == null) rafId = requestAnimationFrame(computeOpacities);
    };

    // initial compute
    computeOpacities();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [wrapperSize, fadeStart, fadeEnd]);

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

  return (
    <div className="card-arc-container">
      <div className="card-arc-center-wrapper" ref={wrapperRef}>
        {/* Temporary circular logo centered on the same anchor as the arc */}
        {(() => {
          const el = wrapperRef.current;
          const metrics = (el && el.__cardMetrics) || {};
          const rY = metrics.radiusY || BASE_RADIUS_Y;
          const cardH = metrics.cardH || BASE_CARD_HEIGHT;
          const scale = metrics.scale || (metrics.cardW ? metrics.cardW / BASE_CARD_WIDTH : 1);

          // compute initial logo position relative to wrapper center using percent-driven vars
          const gv2 = getLogoVars();
          const BASE_LOGO_BASE_MULTIPLIER = (gv2.baseMultiplierPercent != null) ? (gv2.baseMultiplierPercent / 100) : gv2.baseMultiplier;
          // Treat gapPercent as a percentage of the viewport height so vertical
          // spacing behaves like other vertical padding controls (logoPaddingPercent)
          const gapPx2 = (gv2.gapPercent != null && !Number.isNaN(gv2.gapPercent)) ? (gv2.gapPercent / 100) * window.innerHeight : gv2.gapLegacyPx;
          const yAdjustPx2 = (gv2.yAdjustPercent != null && !Number.isNaN(gv2.yAdjustPercent)) ? (gv2.yAdjustPercent / 100) * cardH : 0;
          const logoY2 = - (rY + cardH / 2 + gapPx2 * scale) + yAdjustPx2 * scale;
          // compute logo width/height: prefer percent-driven logoW/logoH, fallback to multiplier
          const logoW = (metrics && metrics.logoW) ? metrics.logoW : ((metrics && metrics.cardW) ? Math.round(metrics.cardW * BASE_LOGO_BASE_MULTIPLIER) : Math.round(BASE_CARD_WIDTH * BASE_LOGO_BASE_MULTIPLIER * scale));
          const logoH = (metrics && metrics.logoH) ? metrics.logoH : logoW;

          // place logo relative to wrapper center like cards
          const leftFromCenter = (wrapperSize.width || metrics.wrapperW) / 2 - logoW / 2;
          const topFromCenter = logoY2 + (wrapperSize.height || metrics.wrapperH) / 2 - logoH / 2;

          // compose transform: apply translateY (computed from scroll) and scale (computed from scroll)
          const transform = `translateY(${logoVisual.translateY}px) scale(${logoVisual.scale})`;

          const logoStyle = {
            position: 'absolute',
            left: `${leftFromCenter}px`,
            top: `${topFromCenter}px`,
            width: `${logoW}px`,
            height: `${logoH}px`,
            zIndex: 0,
            opacity: logoVisual.opacity,
            transform,
            transformOrigin: 'center center',
            pointerEvents: 'none',
            transition: 'transform 220ms linear, opacity 220ms linear',
          };

          // Optional debug: set DEBUG to true to add a visible outline class on the logo
          // and print computed style info to the console for diagnosing stacking contexts.
          const DEBUG = false;

          return <Logo style={logoStyle} label="JW" ref={logoRef} className={DEBUG ? 'debug-temp-logo' : ''} />;
        })()}
        {CARD_DATA.map((card, i) => {
          // Distribute cards from 180deg (left) to 0deg (right) in equal steps
          const total = CARD_DATA.length - 1;
          const angle = Math.PI - (i * Math.PI) / total; // Math.PI (180deg) to 0 (0deg)
          // read scaled metrics from the wrapper element if available
          const el = wrapperRef.current;
          const metrics = (el && el.__cardMetrics) || {};
          const wrapperW = metrics.wrapperW || wrapperSize.width || WRAPPER_WIDTH;
          const wrapperH = metrics.wrapperH || wrapperSize.height || WRAPPER_HEIGHT;
          const cardW = metrics.cardW || BASE_CARD_WIDTH;
          const cardH = metrics.cardH || BASE_CARD_HEIGHT;
          const rX = metrics.radiusX || BASE_RADIUS_X;
          const rY = metrics.radiusY || BASE_RADIUS_Y;
          const yOffs = metrics.yOffsets || BASE_Y_OFFSETS;

          const x = rX * Math.cos(angle);
          const y = -rY * Math.sin(angle) + yOffs[i];
          // Place x/y relative to the center of the wrapper instead of its top-left
          const leftFromCenter = x + wrapperW / 2 - cardW / 2;
          const topFromCenter = y + wrapperH / 2 - cardH / 2;
          return (
            <Card
              key={card.label}
              label={card.label}
              content={card.content}
              style={{
                position: 'absolute',
                left: `${leftFromCenter}px`,
                top: `${topFromCenter}px`,
                zIndex: 10 + (hovered === i ? 1 : 0),
                opacity: opacities[i] ?? 1,
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
  );
};

export default CardArc;
