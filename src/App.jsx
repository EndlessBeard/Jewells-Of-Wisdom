import './App.css';
import { useState, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import CardArc from './components/CardArc';
import InfoPanel from './components/InfoPanel';

function App() {
  const [selectedCard, setSelectedCard] = useState(null);
  const [showCardArc, setShowCardArc] = useState(() => {
    try { const v = localStorage.getItem('jow.ui.showCardArc'); return v == null ? true : v === 'true'; } catch { return true; }
  });
  const [showInfoPanel, setShowInfoPanel] = useState(() => {
    try { const v = localStorage.getItem('jow.ui.showInfoPanel'); return v == null ? true : v === 'true'; } catch { return true; }
  });

  // debug outline tooling removed for production cleanliness
  useEffect(() => {
    const handler = () => {
      try { setShowCardArc(localStorage.getItem('jow.ui.showCardArc') !== 'false'); } catch { setShowCardArc(true); }
      try { setShowInfoPanel(localStorage.getItem('jow.ui.showInfoPanel') !== 'false'); } catch { setShowInfoPanel(true); }
    };
    window.addEventListener('layout:update', handler);
    return () => window.removeEventListener('layout:update', handler);
  }, []);
  return (
    <>
      <Toolbar />
      {showCardArc && <CardArc onCardClick={(i) => setSelectedCard(i)} />}
      {showInfoPanel && <InfoPanel selectedCard={selectedCard} />}
    </>
  );
}

export default App;
