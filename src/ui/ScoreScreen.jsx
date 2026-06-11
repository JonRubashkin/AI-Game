import React, { useState } from 'react';
import { getHighScores } from '../engine/persistence.js';

const REASON_TEXT = {
  completed: 'You reached the end of six years on the frontier.',
  catastrophe: 'A catastrophic incident ended the run.',
  shutdown: 'Regulators shut the company down.',
  bankruptcy: 'The company ran out of money.',
};

function Cell({ v, l, cls }) {
  return (
    <div className="score-cell">
      <div className={'v ' + (cls || '')}>{v}</div>
      <div className="l">{l}</div>
    </div>
  );
}

export default function ScoreScreen({ state, onNewRun }) {
  const s = state.summary;
  const [copied, setCopied] = useState(false);
  const highScores = getHighScores();

  const copySeed = () => {
    navigator.clipboard?.writeText(String(state.seed));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="overlay">
      <div className="modal modal-wide">
        <div className="score-hero">
          <div className="legacy-em">{s.legacy.emoji}</div>
          <div className="title">{s.legacy.title}</div>
          <div className="muted" style={{ maxWidth: 540, margin: '6px auto' }}>{s.legacy.blurb}</div>
          <div className="score">{s.finalScore}</div>
          <div className="muted">
            Final Score = Company Value {s.companyValue} × Safety Multiplier {s.safetyMultiplier}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{REASON_TEXT[s.endReason]}</div>
        </div>

        <div className="reveal">
          🔎 <b>The hidden ledger.</b> Your safety team quietly <b>prevented {s.incidentsPrevented}</b> incident{s.incidentsPrevented === 1 ? '' : 's'} you never saw —
          while <b>{s.incidentsCaused}</b> got through. {s.incidentsPrevented > s.incidentsCaused
            ? 'Most of your danger never reached the public. That is what good safety work looks like.'
            : s.incidentsCaused === 0
            ? 'A clean record. Whether by diligence or by luck, the public never saw a failure.'
            : 'More slipped through than you caught. The cost of moving fast.'}
        </div>

        <div className="score-grid">
          <Cell v={s.peakCapability} l="Peak Capability" />
          <Cell v={`$${s.revenueTotal}M`} l="Total Revenue" />
          <Cell v={s.trueSafety} l="Final True Safety" cls={s.trueSafety >= 60 ? 'good' : s.trueSafety >= 40 ? 'ok' : 'bad'} />
          <Cell v={s.finalTrust} l="Final Trust" />
          <Cell v={s.incidentsCaused} l="Incidents Caused" cls={s.incidentsCaused > 0 ? 'bad' : 'good'} />
          <Cell v={s.incidentsPrevented} l="Incidents Prevented" cls="good" />
          <Cell v={`${s.strikes}/3`} l="Regulatory Strikes" cls={s.strikes >= 2 ? 'bad' : ''} />
          <Cell v={s.staffRetained} l="Staff Retained" />
          <Cell v={`#${s.rank}`} l="Final Rank" />
          <Cell v={`${s.playerShare}%`} l="Market Share" />
        </div>

        <div className="flex" style={{ flexWrap: 'wrap' }}>
          <span className="muted">Seed:</span> <code>{String(state.seed)}</code>
          <button className="small" onClick={copySeed}>{copied ? '✓ Copied' : '📋 Copy seed'}</button>
          <div className="spacer" />
          <button className="primary" onClick={onNewRun}>Start a new run →</button>
        </div>

        {highScores.length > 0 && (
          <div className="mt">
            <h3>Hall of Fame</h3>
            <table className="hs-table">
              <thead><tr><th>#</th><th>Score</th><th>Legacy</th><th>Founder</th><th>Seed</th><th>Date</th></tr></thead>
              <tbody>
                {highScores.map((h, i) => (
                  <tr key={i} style={h.seed === state.seed && h.score === s.finalScore ? { color: 'var(--gold)' } : {}}>
                    <td>{i + 1}</td><td>{h.score}</td><td>{h.title}</td><td>{h.founder} · {h.company}</td>
                    <td className="muted">{h.seed}</td><td className="muted">{h.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
