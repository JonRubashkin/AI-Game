import React from 'react';
import { fmtResource, fmtSafety, metricColor, quarterLabel } from './display.js';
import { REGULATION } from '../data/balance.js';

function Res({ label, value, sub, cls }) {
  return (
    <div className={'res' + (cls ? ' ' + cls : '')}>
      <div className="label">{label}</div>
      <div className="val">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

export default function TopBar({ state, dispatch, onGlossary, onToggleDebug }) {
  const { resources: r, settings } = state;
  const dm = settings.displayMode;
  const safety = fmtSafety(state);
  const canEnd = state.turnPhase === 'plan' || state.deck.current.every((c) => c.resolved);

  return (
    <div className="topbar">
      <div className="brand">
        🛰️ Frontier <small>{state.founder.company}</small>
      </div>

      <div className="res-strip">
        <Res label="Cash" value={fmtResource('cash', r.cash, dm)} cls={r.cash < 0 ? 'bad' : ''} />
        <Res label="Compute" value={fmtResource('compute', r.compute, dm)} />
        <Res label="Capability" value={fmtResource('capability', r.capability, dm)} />
        <Res label="Trust" value={fmtResource('trust', r.trust, dm)} cls={metricColor(r.trust)} />
        <Res label="Safety" value={safety.main} sub={safety.sub} cls="safety" />
        <Res
          label="Strikes"
          value={`${state.ledger.strikes}/${REGULATION.maxStrikes}`}
          cls={state.ledger.strikes >= 2 ? 'bad' : state.ledger.strikes === 1 ? 'ok' : ''}
        />
      </div>

      <div className="turn-box">
        <div className="q">{quarterLabel(state.turn)}</div>
        <div className="sub muted">Turn {state.turn} / 24</div>
      </div>

      <div className="flex">
        <button className="ghost small" onClick={onGlossary} title="Help & Glossary">❔ Help</button>
        <button className="ghost small debug-btn" onClick={onToggleDebug} title="Toggle debug (`)">🐞 Debug</button>
        {!state.gameOver && (
          state.turnPhase === 'plan' ? (
            <button className="primary" onClick={() => dispatch({ type: 'PROCEED_TO_EVENTS' })}>
              Proceed to events →
            </button>
          ) : (
            <button className="primary" disabled={!canEnd} onClick={() => dispatch({ type: 'END_TURN' })}>
              End turn ⏭
            </button>
          )
        )}
      </div>
    </div>
  );
}
