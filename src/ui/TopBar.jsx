import React from 'react';
import { fmtResource, fmtSafety, metricColor, quarterLabel, fmtRevenueEstimate, fmtCostEstimate, netWord } from './display.js';
import { REGULATION } from '../data/balance.js';
import { getMods } from '../engine/mods.js';
import { forecastRevenue, expectedCosts } from '../engine/formulas.js';

function Res({ label, value, sub, cls, title }) {
  return (
    <div className={'res' + (cls ? ' ' + cls : '')} title={title}>
      <div className="label">{label}</div>
      <div className="val">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

export default function TopBar({ state, dispatch, onGlossary, onToggleDebug, onAbandon }) {
  const { resources: r, settings } = state;
  const dm = settings.displayMode;
  const safety = fmtSafety(state);
  const canEnd = state.turnPhase === 'plan' || state.deck.current.every((c) => c.resolved);

  // Live financial estimates for this quarter. Recomputed every render, so costs update
  // immediately when budgets/staff/compute change; revenue is a ±5% forecast.
  const mods = getMods(state);
  const forecast = forecastRevenue(state, mods);
  const costs = expectedCosts(state);
  const net = forecast - costs.total;
  const netStr =
    dm === 'narrative'
      ? netWord(net)
      : `net ${net >= 0 ? '+' : '−'}$${Math.abs(Math.round(net))}M`;
  const costTitle = `Salaries $${Math.round(costs.salaries)}M · Departments $${Math.round(costs.dept)}M · Compute upkeep $${costs.upkeep.toFixed(1)}M`;

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
        <Res
          label="Est. Revenue"
          value={fmtRevenueEstimate(forecast, dm)}
          sub="this quarter (±5%)"
          cls="good"
        />
        <Res
          label="Est. Costs"
          value={fmtCostEstimate(costs.total, dm)}
          sub={<span style={{ color: net >= 0 ? 'var(--good)' : 'var(--bad)' }}>{netStr}</span>}
          title={costTitle}
        />
      </div>

      <div className="turn-box">
        <div className="q">{quarterLabel(state.turn)}</div>
        <div className="sub muted">Turn {state.turn} / 24</div>
      </div>

      <div className="flex">
        <button className="ghost small" onClick={onGlossary} title="Help & Glossary">❔ Help</button>
        <button className="ghost small debug-btn" onClick={onToggleDebug} title="Toggle debug (`)">🐞 Debug</button>
        {onAbandon && <button className="ghost small" onClick={onAbandon} title="Abandon run">⏏</button>}
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
