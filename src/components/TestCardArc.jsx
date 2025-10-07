import React, { useState, useRef, useEffect } from 'react';
import Toolbar from './Toolbar';
import './TestCardArc.css';
import '../styles/debug-outlines.css';
import { computeCardLayout } from '../utils/computeLayout';
import Logo from './Logo';

// Reuse card data from CardArc to keep labels consistent; import directly to avoid circular deps
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
  { label: 'About Us', front: AboutUs_front, back: AboutUs_back },
  { label: 'Author', front: Author_front, back: Author_back },
  { label: 'Service', front: Services_front, back: Services_back },
  { label: 'Subscriptions', front: Subscriptions_front, back: Subscriptions_back },
  { label: 'Shop', front: Shop_front, back: Shop_back },
];

const IDEAL_WIDTH = 430;
const BASE_CARD_WIDTH = 150;
const BASE_CARD_HEIGHT = BASE_CARD_WIDTH * (4.75/2.75);
const BASE_RADIUS_X = 205;
const BASE_RADIUS_Y = 240;
const BASE_Y_OFFSETS = [0, 20, 0, 20, 0];

function TestCardArc() {
  const wrapperRef = useRef(null);
  const [wrapperSize, setWrapperSize] = useState({ width: 520, height: 320 });

  // Ensure debug outlines are visible by default on the test page (dev-only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return undefined;
    const root = document && document.documentElement;
    if (!root) return undefined;
    root.classList.add('debug-outlines');
    return () => { root.classList.remove('debug-outlines'); };
  }, []);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const layout = computeCardLayout(window.innerWidth, window.innerHeight, { maxCanvasWidth: 900 });
      const wrapperH = layout.wrapperH;
      try {
        const toolbarEl = document.querySelector('.toolbar');
        const toolbarBottom = toolbarEl ? Math.round(toolbarEl.getBoundingClientRect().bottom) : 0;
        const bottomPadding = 12;
        const availableH = Math.max(0, window.innerHeight - toolbarBottom - bottomPadding);
        // compute toolbar gap: prefer percent-based var, fallback to 8px
        const rootComputed = getComputedStyle(document.documentElement);
        const parseNum = (s, fallback) => {
          if (!s) return fallback;
          const p = parseFloat(s);
          return Number.isFinite(p) ? p : fallback;
        };
        const toolbarGapPercent = parseNum(rootComputed.getPropertyValue('--layout-toolbar-gap-percent'), NaN);
        const toolbarGapPx = Number.isFinite(toolbarGapPercent) ? Math.round((toolbarGapPercent / 100) * window.innerHeight) : 8;
        let topPos = toolbarBottom + Math.max(toolbarGapPx, Math.round((availableH - wrapperH) / 2));
        if (topPos + wrapperH > window.innerHeight - bottomPadding) topPos = Math.max(toolbarBottom + 8, window.innerHeight - bottomPadding - wrapperH);
        try { el.style.top = `${topPos}px`; } catch (e) {}
      } catch (e) {}
      setWrapperSize({ width: r.width || layout.wrapperW, height: wrapperH });
    };
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    const handler = () => measure();
    window.addEventListener('layout:update', handler);
    return () => {
      ro.disconnect();
      window.removeEventListener('layout:update', handler);
    };
  }, []);

  // compute layout using central util (allowing tuning via CSS vars later)
  const metrics = computeCardLayout(window.innerWidth, window.innerHeight, { maxCanvasWidth: 900 });

  return (
    <div>
      <Toolbar />
      <div className="test-card-arc-container">
        <div className="test-card-arc-center-wrapper" ref={wrapperRef}>
          <div className="test-center-dot" />
          {/* Render the real Logo at the computed center so the debug outline matches production positioning */}
          {(() => {
            try {
              const rootComputed = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null;
              const getNum = (name, fallback) => {
                if (!rootComputed) return fallback;
                const v = rootComputed.getPropertyValue(name);
                if (!v) return fallback;
                const parsed = parseFloat(v);
                return Number.isFinite(parsed) ? parsed : fallback;
              };
              // read percent-based logo controls (or fall back to legacy values)
              const layout = metrics; // already computed above
              const scale = layout.scale || 1;
              const cardH = layout.cardH;
              const rY = layout.radiusY;

              const multPercent = rootComputed ? parseFloat(rootComputed.getPropertyValue('--layout-logo-multiplier-percent') || '') : NaN;
              const gapPercent = rootComputed ? parseFloat(rootComputed.getPropertyValue('--layout-logo-gap-percent') || '') : NaN;
              const yAdjustPercent = rootComputed ? parseFloat(rootComputed.getPropertyValue('--layout-logo-yadjust-percent') || '') : NaN;

              const baseMultiplier = Number.isFinite(multPercent) ? (multPercent / 100) : getNum('--base-logo-base-multiplier', 1.3);
              // Use viewport height for gap percent so vertical controls are consistent
              const gapPx = Number.isFinite(gapPercent) ? (gapPercent / 100) * window.innerHeight : getNum('--base-logo-gap', -420);
              const yAdjustPx = Number.isFinite(yAdjustPercent) ? (yAdjustPercent / 100) * cardH : getNum('--base-logo-y-adjust', 0);

              const logoW = layout.logoW || Math.round((layout.cardW || 120) * baseMultiplier);
              const logoH = layout.logoH || logoW;
              const logoY = - (rY + cardH / 2 + gapPx * scale) + yAdjustPx * scale;

              const leftFromCenter = (wrapperSize.width || layout.wrapperW) / 2 - logoW / 2;
              const topFromCenter = logoY + (wrapperSize.height || layout.wrapperH) / 2 - logoH / 2;

              const logoStyle = {
                position: 'absolute',
                left: `${leftFromCenter}px`,
                top: `${topFromCenter}px`,
                width: `${logoW}px`,
                height: `${logoH}px`,
                zIndex: 0,
                pointerEvents: 'none',
              };

              return <Logo style={logoStyle} label="JW" />;
            } catch (e) {
              return null;
            }
          })()}
          {CARD_DATA.map((c, i) => {
            const total = CARD_DATA.length - 1;
            const angle = Math.PI - (i * Math.PI) / total;
            const x = metrics.radiusX * Math.cos(angle);
            const y = -metrics.radiusY * Math.sin(angle) + metrics.yOffsets[i];
            const leftFromCenter = x + wrapperSize.width / 2 - metrics.cardW / 2;
            const topFromCenter = y + wrapperSize.height / 2 - metrics.cardH / 2;

            const style = {
              left: `${leftFromCenter}px`,
              top: `${topFromCenter}px`,
              width: `${metrics.cardW}px`,
              height: `${metrics.cardH}px`,
            };

            return (
              <div key={c.label} className="test-card-outline" style={style}>
                {c.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TestCardArc;
