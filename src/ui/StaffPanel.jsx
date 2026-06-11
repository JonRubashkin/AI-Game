import React, { useState } from 'react';
import { TRAITS } from '../data/staff.js';
import { STAFF } from '../data/balance.js';

function IdeologyBar({ ideology }) {
  // ideology -5..+5 -> 0..100%
  const pct = ((ideology + 5) / 10) * 100;
  const label = ideology <= -2 ? 'accelerationist' : ideology >= 2 ? 'cautious' : 'centrist';
  return (
    <div title={`Ideology: ${label} (${ideology > 0 ? '+' : ''}${ideology})`}>
      <div className="ideo-bar"><div className="dot" style={{ left: `${pct}%` }} /></div>
    </div>
  );
}

function StaffCard({ s, dispatch, editable }) {
  const trait = TRAITS[s.trait];
  return (
    <div className="staff-card">
      <div className="emoji">{s.emoji}</div>
      <div className="info">
        <div className="nm">{s.name}</div>
        <div className="role">{s.role} · skill {s.skill} · ${s.salary}M/q</div>
        {trait && <div className="trait" title={trait.desc}>✦ {trait.label}</div>}
        <IdeologyBar ideology={s.ideology} />
      </div>
      {editable && (
        <div className="acts">
          <button className="small" title="Give a raise (reduces poaching)" onClick={() => dispatch({ type: 'RAISE', uid: s.uid })}>＄</button>
          <button className="small danger" title="Let them go" onClick={() => dispatch({ type: 'FIRE', uid: s.uid })}>✕</button>
        </div>
      )}
    </div>
  );
}

function HiringModal({ state, dispatch, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close ghost small" onClick={onClose}>✕ Close</button>
        <h2>Hiring Market</h2>
        <p className="muted">Candidates refresh every few quarters. Signing bonus = {Math.round(STAFF.hireSigningMult * 100)}% of salary. Each trait is a real trade-off.</p>
        <div className="market-grid">
          {state.hiringMarket.map((c) => {
            const trait = TRAITS[c.trait];
            const signing = Math.round(c.salary * STAFF.hireSigningMult);
            const ideo = c.ideology <= -2 ? 'accelerationist' : c.ideology >= 2 ? 'cautious' : 'centrist';
            return (
              <div className="cand" key={c.uid}>
                <div className="top">
                  <span className="emoji">{c.emoji}</span>
                  <div>
                    <div className="nm" style={{ fontWeight: 600 }}>{c.name}</div>
                    <div className="role muted">{c.role}</div>
                  </div>
                </div>
                <div className="stat-line"><span>Skill</span><span>{c.skill}/10</span></div>
                <div className="stat-line"><span>Salary</span><span>${c.salary}M/q</span></div>
                <div className="stat-line"><span>Ideology</span><span>{ideo} ({c.ideology > 0 ? '+' : ''}{c.ideology})</span></div>
                {trait && <div className="trait" style={{ color: 'var(--gold)', fontSize: 11, margin: '6px 0' }} title={trait.desc}>✦ {trait.label}</div>}
                {trait && <div className="muted" style={{ fontSize: 11 }}>{trait.desc}</div>}
                <div className="muted" style={{ fontSize: 11, fontStyle: 'italic', margin: '6px 0' }}>“{c.bio}”</div>
                <button
                  className="primary small"
                  disabled={state.resources.cash < signing || state.gameOver}
                  onClick={() => dispatch({ type: 'HIRE', uid: c.uid })}
                >
                  Hire (−${signing}M)
                </button>
              </div>
            );
          })}
          {state.hiringMarket.length === 0 && <div className="muted">No candidates available right now.</div>}
        </div>
      </div>
    </div>
  );
}

export default function StaffPanel({ state, dispatch }) {
  const [showHire, setShowHire] = useState(false);
  const hired = state.staff.filter((s) => s.hired);
  const editable = !state.gameOver;

  return (
    <div className="panel">
      <div className="flex-between">
        <h3 style={{ margin: 0 }}>Team ({hired.length})</h3>
        <button className="small" onClick={() => setShowHire(true)}>＋ Hire</button>
      </div>
      <div className="mt">
        {hired.length === 0 && <div className="muted">No staff yet. Hire a department lead to boost output.</div>}
        {hired.map((s) => <StaffCard key={s.uid} s={s} dispatch={dispatch} editable={editable} />)}
      </div>
      {showHire && <HiringModal state={state} dispatch={dispatch} onClose={() => setShowHire(false)} />}
    </div>
  );
}
