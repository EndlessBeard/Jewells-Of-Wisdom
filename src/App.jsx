import './App.css';
import { useState } from 'react';
import Toolbar from './components/Toolbar';
import CardArc from './components/CardArc';
import InfoPanel from './components/InfoPanel';

// Dev-only test page
let TestCardArc = null;
if (process.env.NODE_ENV !== 'production') {
  // lazy-require to avoid bundling in production builds
  // eslint-disable-next-line global-require
  TestCardArc = require('./components/TestCardArc').default;
}

function App() {
  const [selectedCard, setSelectedCard] = useState(null);

  // If this path matches our dev-only test route, render the TestCardArc page
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined' && window.location.pathname === '/__cardarc_test') {
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
