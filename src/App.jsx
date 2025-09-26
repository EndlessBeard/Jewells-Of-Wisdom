import './App.css';
import { useState, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import CardArc from './components/CardArc';
import InfoPanel from './components/InfoPanel';

function App() {
  const [selectedCard, setSelectedCard] = useState(null);
  const [TestCardArc, setTestCardArc] = useState(null);

  useEffect(() => {
    // Only load dev-only test page in non-production and only when the path matches
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined' && window.location.pathname === '/__cardarc_test') {
      // dynamic import keeps this out of production bundles
      import('./components/TestCardArc').then(mod => setTestCardArc(() => mod.default)).catch(() => {
        // ignore failures in case the file is absent
      });
    }
  }, []);

  useEffect(() => {
    // dev-only debug outlines toggle via pressing 'd'
    if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') return;

    let rafId = null;
    let overlay = null;

    const createOverlay = () => {
      overlay = document.getElementById('jow-debug-logo-outline');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'jow-debug-logo-outline';
        Object.assign(overlay.style, {
          position: 'fixed',
          pointerEvents: 'none',
          border: '3px solid rgba(0,128,255,0.95)',
          borderRadius: '9999px',
          boxShadow: '0 0 0 6px rgba(0,128,255,0.12)',
          transition: 'transform 120ms linear, width 120ms linear, height 120ms linear, left 120ms linear, top 120ms linear',
          zIndex: '2147483647',
          display: 'none',
        });
        document.body.appendChild(overlay);
      }
      return overlay;
    };

    const updateOverlay = () => {
      const ov = overlay || createOverlay();
      const logoEl = document.querySelector('.temp-logo');
      if (!logoEl) {
        ov.style.display = 'none';
        return;
      }
      const r = logoEl.getBoundingClientRect();
      // place overlay centered at logo rect; ensure circle by using max dimension
      const size = Math.max(r.width, r.height);
      const left = r.left + (r.width - size) / 2;
      const top = r.top + (r.height - size) / 2;
      ov.style.width = `${size}px`;
      ov.style.height = `${size}px`;
      ov.style.left = `${Math.round(left)}px`;
      ov.style.top = `${Math.round(top)}px`;
      ov.style.display = 'block';
    };

    const startLoop = () => {
      if (rafId != null) return;
      const loop = () => {
        updateOverlay();
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    };

    const stopLoop = () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      rafId = null;
      if (overlay) overlay.style.display = 'none';
    };

    const onKey = (ev) => {
      // ignore if modifier keys are pressed
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      if (ev.key === 'd' || ev.key === 'D') {
        const enabled = document.documentElement.classList.toggle('debug-outlines');
        if (enabled) {
          createOverlay();
          startLoop();
        } else {
          stopLoop();
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      stopLoop();
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };
  }, []);

  if (TestCardArc) {
    return <TestCardArc />;
  }

  return (
    <>
      <Toolbar />
      <CardArc onCardClick={(i) => setSelectedCard(i)} />
      <InfoPanel selectedCard={selectedCard} />
    </>
  );
}

export default App;
