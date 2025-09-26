import React, { useState, useRef, useEffect } from 'react';
import Toolbar from './Toolbar';
import './TestCardArc.css';

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

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setWrapperSize({ width: r.width, height: r.height });
    };
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // compute minimal outline positions using same math as CardArc but without detailed CSS
  const metrics = (() => {
    const scale = (wrapperSize.width || 520) / IDEAL_WIDTH;
    const cardW = Math.round(BASE_CARD_WIDTH * scale);
    const cardH = Math.round(BASE_CARD_HEIGHT * scale);
    const radiusX = BASE_RADIUS_X * scale;
    const radiusY = BASE_RADIUS_Y * scale;
    const yOffsets = BASE_Y_OFFSETS.map(v => v * scale);
    return { cardW, cardH, radiusX, radiusY, yOffsets, scale };
  })();

  return (
    <div>
      <Toolbar />
      <div className="test-card-arc-container">
        <div className="test-card-arc-center-wrapper" ref={wrapperRef}>
          <div className="test-center-dot" />
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
