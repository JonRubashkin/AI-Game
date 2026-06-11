import React from 'react';
import { GLOSSARY } from '../data/glossary.js';

export default function GlossaryModal({ onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close ghost small" onClick={onClose}>✕ Close</button>
        <h2>❔ Help & Glossary</h2>
        <p className="muted">
          Run an AI company for 24 quarters. Each turn: set your budget, take actions, resolve events, end the turn.
          The goal is the highest <b>Final Score = Company Value × Safety Multiplier</b> — you cannot win on raw
          value alone. Watch your <b>true Safety</b>, which you can only ever estimate.
        </p>
        <hr className="sep" />
        {GLOSSARY.map((g) => (
          <div key={g.term} className="mb">
            <b style={{ color: 'var(--safety)' }}>{g.term}</b>
            <div style={{ fontSize: 13 }}>{g.body}</div>
          </div>
        ))}
        <hr className="sep" />
        <div className="muted" style={{ fontSize: 12 }}>
          Tip: press the backtick key <code>`</code> to open the Debug drawer — inspect true Safety, the incident
          ledger, every formula in the turn log, and cheat freely. It’s a single-player game; experiment.
        </div>
      </div>
    </div>
  );
}
