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
    const onKey = (ev) => {
      // ignore if modifier keys are pressed
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      if (ev.key === 'd' || ev.key === 'D') {
        document.documentElement.classList.toggle('debug-outlines');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
