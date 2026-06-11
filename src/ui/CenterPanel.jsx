import React, { useState } from 'react';
import EventCard from './EventCard.jsx';
import FundingModal from './FundingModal.jsx';
import { COMPUTE } from '../data/balance.js';

function ActionBar({ state, dispatch, onFunding }) {
  const editable = state.turnPhase === 'plan' && !state.gameOver;
  const passives = new Set(state.passives);
  const computeCost = Math.round(5 * COMPUTE.pricePerUnit * state.computePriceMult * (passives.has('cheapCompute') ? 0.7 : 1));
  return (
    <div className="panel">
      <h3>Actions</h3>
      <div className="actions-row">
        <button disabled={!editable || state.resources.cash < computeCost} onClick={() => dispatch({ type: 'BUY_COMPUTE', units: 5 })}>
          🖥️ Buy 5 compute (−${computeCost}M)
        </button>
        <button disabled={!editable} onClick={() => dispatch({ type: 'RELEASE_PRODUCT' })} title="Boosts revenue; small launch-incident risk">
          🚀 Launch release
        </button>
        <button disabled={!editable || state.resources.cash < 8 || state.resources.compute < 5} onClick={() => dispatch({ type: 'RESEARCH_INITIATIVE' })} title="−$8M, −5 compute → capability">
          🧪 Research initiative
        </button>
        <button disabled={!editable} onClick={onFunding}>💰 Funding round</button>
        <button disabled={!editable || state.resources.cash < 18} onClick={() => dispatch({ type: 'POACH_RIVAL' })} title="−$18M, −trust → poach a rival's researcher">
          🎯 Poach a rival
        </button>
      </div>
      <div className="muted mt" style={{ fontSize: 12 }}>
        {editable
          ? 'Set your budget, take one-off actions, then proceed to events.'
          : 'Actions are locked during the events phase. Resolve your cards, then end the turn.'}
      </div>
    </div>
  );
}

export default function CenterPanel({ state, dispatch }) {
  const [showFunding, setShowFunding] = useState(false);

  return (
    <>
      {state.turnPhase === 'plan' && <ActionBar state={state} dispatch={dispatch} onFunding={() => setShowFunding(true)} />}

      {state.turnPhase === 'events' && (
        <div className="panel">
          <h3>This Quarter’s Events</h3>
          {state.deck.current.length === 0 && (
            <div className="muted">A quiet quarter — no events drawn. End the turn when ready.</div>
          )}
          {state.deck.current.map((card) => (
            <EventCard key={card.id} card={card} state={state} dispatch={dispatch} />
          ))}
        </div>
      )}

      <div className="panel" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <h3>News Feed</h3>
        <ul className="news scroll-y" style={{ flex: 1 }}>
          {state.news.slice(0, 40).map((n, i) => (
            <li key={i} className={n.kind}>
              <span className="k">
                {n.kind === 'incident' ? '⚠️' : n.kind === 'rival' ? '🏷️' : n.kind === 'staff' ? '👤' : n.kind === 'consequence' ? '🔔' : '📰'}
              </span>
              {n.text}
            </li>
          ))}
        </ul>
      </div>

      {showFunding && <FundingModal state={state} dispatch={dispatch} onClose={() => setShowFunding(false)} />}
    </>
  );
}
