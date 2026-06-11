import React from 'react';
import { FUNDING } from '../data/balance.js';

export default function FundingModal({ state, dispatch, onClose }) {
  const passives = new Set(state.passives);
  const easy = passives.has('easyFunding');
  const used = state.flags.fundingUsed || [];

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close ghost small" onClick={onClose}>✕ Close</button>
        <h2>Seek a Funding Round</h2>
        <p className="muted">Raising capital dilutes ownership (a small Trust cost) but extends your runway. {easy && <b>Your investor reputation raises {Math.round((FUNDING.hypeFounderBonus - 1) * 100)}% more.</b>}</p>
        {FUNDING.rounds.map((r) => {
          const cash = Math.round(r.cash * (easy ? FUNDING.hypeFounderBonus : 1));
          const isUsed = used.includes(r.id);
          const locked = state.resources.trust < r.trustReq && !easy;
          return (
            <div className="cand mb" key={r.id}>
              <div className="flex-between">
                <b>{r.label}</b>
                <span className="good">+${cash}M</span>
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                Requires Trust ≥ {r.trustReq} · Dilution: {r.dilution}
              </div>
              <button
                className="primary small mt"
                disabled={isUsed || locked || state.gameOver}
                onClick={() => { dispatch({ type: 'FUNDING_ROUND', roundId: r.id }); onClose(); }}
              >
                {isUsed ? 'Already raised' : locked ? `Trust too low (${state.resources.trust}/${r.trustReq})` : `Close ${r.label}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
