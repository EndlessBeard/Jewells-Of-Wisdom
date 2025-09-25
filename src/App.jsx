import './App.css';
import { useState } from 'react';
import Toolbar from './components/Toolbar';
import CardArc from './components/CardArc';
import InfoPanel from './components/InfoPanel';

function App() {
  const [selectedCard, setSelectedCard] = useState(null);

  return (
    <>
      <Toolbar />
      <CardArc onCardClick={(i) => setSelectedCard(i)} />
      <InfoPanel selectedCard={selectedCard} />
    </>
  );
}

export default App;
