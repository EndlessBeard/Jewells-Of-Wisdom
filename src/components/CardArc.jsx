import React, { useState, useRef, useEffect } from 'react';
import './CardArc.css';
import Logo from './Logo';

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
    return {
      gap: getNum('--base-logo-gap', -420),
      yAdjust: getNum('--base-logo-y-adjust', 0),
      baseMultiplier: getNum('--base-logo-base-multiplier', 1.3),
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
      setWrapperSize({ width: rect.width, height: rect.height });
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
    };
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

  // --- logo transform to watermark calculations ---
  // compute logo anchored position (same math as render)
  const { gap: BASE_LOGO_GAP, yAdjust: BASE_LOGO_Y_ADJUST } = getLogoVars();
  const logoY = - (rY + cardH / 2 + BASE_LOGO_GAP * scale) + BASE_LOGO_Y_ADJUST * scale;
      // initial center Y of logo in viewport coordinates
      const logoCenterViewportY = rect.top + wrapperH / 2 + logoY;
      // progress t: 0 => original logo, 1 => watermark
      const logoStartPx = BASE_LOGO_START * scale;
      const logoEndPx = BASE_LOGO_END * scale;
      // avoid division by zero
      const denom = (logoStartPx - logoEndPx) || 1;
      let tLogo = (logoStartPx - rect.top) / denom;
      tLogo = Math.max(0, Math.min(1, tLogo));

      // final watermark parameters (scaled where appropriate)
      const finalScale = BASE_LOGO_WM_SCALE;
      const finalOpacity = BASE_LOGO_WM_OPACITY;

      // compute translate to move logo's center to viewport center
      const viewportCenterY = window.innerHeight / 2;
      const deltaYToCenter = viewportCenterY - logoCenterViewportY;
      const logoTranslateY = deltaYToCenter * tLogo;

      const logoScale = 1 + (finalScale - 1) * tLogo;
      const logoOpacity = 1 * (1 - tLogo) + finalOpacity * tLogo;

      setLogoVisual({ opacity: logoOpacity, scale: logoScale, translateY: logoTranslateY });

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
    const wrapperW = wrapperSize.width || WRAPPER_WIDTH;
    const wrapperH = wrapperSize.height || WRAPPER_HEIGHT;
    const scale = wrapperW / IDEAL_WIDTH;

    const cardW = Math.round(BASE_CARD_WIDTH * scale);
    const cardH = Math.round(BASE_CARD_HEIGHT * scale);
    const radiusX = BASE_RADIUS_X * scale;
    const radiusY = BASE_RADIUS_Y * scale;
    // scaled yOffsets
    const yOffsets = BASE_Y_OFFSETS.map(v => v * scale);

    el.style.setProperty('--scale', String(scale));
    el.style.setProperty('--card-w', `${cardW}px`);
    el.style.setProperty('--card-h', `${cardH}px`);
    el.style.setProperty('--radius-x', `${radiusX}px`);
    el.style.setProperty('--radius-y', `${radiusY}px`);
    el.style.setProperty('--wrapper-h', `${wrapperH}px`);

    // store scaled metrics on ref for use in render positioning
    el.__cardMetrics = { cardW, cardH, radiusX, radiusY, yOffsets, wrapperW, wrapperH, scale };
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

          // compute initial logo position relative to wrapper center
          const { gap: BASE_LOGO_GAP, yAdjust: BASE_LOGO_Y_ADJUST, baseMultiplier: BASE_LOGO_BASE_MULTIPLIER } = getLogoVars();
          const logoY = - (rY + cardH / 2 + BASE_LOGO_GAP * scale) + BASE_LOGO_Y_ADJUST * scale;
          // compute logo width/height based on card width and the base multiplier
          // initial logo size (px) = metrics.cardW * BASE_LOGO_BASE_MULTIPLIER
          const logoW = (metrics && metrics.cardW) ? Math.round(metrics.cardW * BASE_LOGO_BASE_MULTIPLIER) : Math.round(BASE_CARD_WIDTH * BASE_LOGO_BASE_MULTIPLIER * scale);
          const logoH = logoW;

          // place logo relative to wrapper center like cards
          const leftFromCenter = 0 + wrapperSize.width / 2 - logoW / 2;
          const topFromCenter = logoY + wrapperSize.height / 2 - logoH / 2;

          // compose transform: apply translateY (computed from scroll) and scale (computed from scroll)
          const transform = `translateY(${logoVisual.translateY}px) scale(${logoVisual.scale})`;

          const logoStyle = {
            position: 'absolute',
            left: `${leftFromCenter}px`,
            top: `${topFromCenter}px`,
            width: `${logoW}px`,
            height: `${logoH}px`,
            zIndex: 40,
            opacity: logoVisual.opacity,
            transform,
            transformOrigin: 'center center',
            pointerEvents: 'none',
            transition: 'transform 220ms linear, opacity 220ms linear',
          };

          return <Logo style={logoStyle} label="JW" ref={logoRef} />;
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
