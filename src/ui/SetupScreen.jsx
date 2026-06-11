import React, { useState } from 'react';
import { ARCHETYPES, CUSTOM_PERKS, CUSTOM_DRAWBACKS } from '../data/archetypes.js';
import { randomSeed } from '../engine/rng.js';
import { getHighScores } from '../engine/persistence.js';

const ALLOC_KEYS = [
  { key: 'cash', label: 'Cash' },
  { key: 'research', label: 'Research' },
  { key: 'safety', label: 'Safety' },
  { key: 'reputation', label: 'Reputation' },
];
const ALLOC_BUDGET = 6;

export default function SetupScreen({ onStart }) {
  const [mode, setMode] = useState('preset'); // preset | custom
  const [archetypeId, setArchetypeId] = useState('chen');
  const [customName, setCustomName] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [alloc, setAlloc] = useState({ cash: 2, research: 2, safety: 1, reputation: 1 });
  const [perk, setPerk] = useState(CUSTOM_PERKS[0].id);
  const [drawback, setDrawback] = useState(CUSTOM_DRAWBACKS[0].id);

  const [displayMode, setDisplayMode] = useState('hybrid');
  const [safetyMode, setSafetyMode] = useState('hidden');
  const [difficulty, setDifficulty] = useState('normal');
  const [seed, setSeed] = useState(String(randomSeed()));

  const allocUsed = Object.values(alloc).reduce((a, b) => a + b, 0);
  const allocLeft = ALLOC_BUDGET - allocUsed;

  const setAllocKey = (k, v) => {
    const nv = Math.max(0, Math.min(ALLOC_BUDGET, v));
    const others = allocUsed - alloc[k];
    if (others + nv > ALLOC_BUDGET) return;
    setAlloc({ ...alloc, [k]: nv });
  };

  const canStart =
    mode === 'preset'
      ? !!archetypeId
      : customName.trim() && customCompany.trim();

  const start = () => {
    let founder;
    if (mode === 'preset') {
      const a = ARCHETYPES.find((x) => x.id === archetypeId);
      founder = { name: a.name, company: a.company, archetypeId: a.id };
    } else {
      founder = {
        name: customName.trim(),
        company: customCompany.trim(),
        archetypeId: null,
        alloc,
        perk,
        drawback,
      };
    }
    onStart({ founder, displayMode, safetyMode, difficulty, seed: seed.trim() || String(randomSeed()) });
  };

  const highScores = getHighScores();

  return (
    <div className="setup">
      <h1>🛰️ Frontier</h1>
      <div className="tagline">
        Found and run an AI company over six years. Build the most successful — <i>and safest</i> — lab on the frontier.
        Survive the race. Watch the things you can’t see.
      </div>

      {/* Founder */}
      <div className="setup-section">
        <label>1 · Choose your founder</label>
        <div className="mode-row mb">
          <button className={mode === 'preset' ? 'active' : ''} onClick={() => setMode('preset')}>Preset archetype</button>
          <button className={mode === 'custom' ? 'active' : ''} onClick={() => setMode('custom')}>Custom founder</button>
        </div>

        {mode === 'preset' && (
          <div className="arch-grid">
            {ARCHETYPES.map((a) => (
              <div key={a.id} className={'arch-card' + (archetypeId === a.id ? ' sel' : '')} onClick={() => setArchetypeId(a.id)}>
                <div className="em">{a.emoji}</div>
                <div className="ttl">{a.name}</div>
                <div className="sub">{a.title}</div>
                <div className="blurb">{a.blurb}</div>
                <div className="b">▲ {a.bonus}</div>
                <div className="d">▼ {a.drawback}</div>
              </div>
            ))}
          </div>
        )}

        {mode === 'custom' && (
          <div className="panel">
            <div className="flex mb" style={{ flexWrap: 'wrap' }}>
              <input placeholder="Founder name" value={customName} onChange={(e) => setCustomName(e.target.value)} />
              <input placeholder="Company name" value={customCompany} onChange={(e) => setCustomCompany(e.target.value)} />
            </div>
            <div className="mb">
              <b>Distribute {ALLOC_BUDGET} bonus points</b> <span className="muted">({allocLeft} left)</span>
              {ALLOC_KEYS.map((a) => (
                <div className="alloc-row" key={a.key}>
                  <span className="nm">{a.label}</span>
                  <input type="range" min="0" max={ALLOC_BUDGET} value={alloc[a.key]} onChange={(e) => setAllocKey(a.key, +e.target.value)} />
                  <span style={{ width: 18 }}>{alloc[a.key]}</span>
                </div>
              ))}
            </div>
            <div className="flex" style={{ flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div className="muted mb">Perk</div>
                <select value={perk} onChange={(e) => setPerk(e.target.value)}>
                  {CUSTOM_PERKS.map((p) => <option key={p.id} value={p.id}>{p.label} — {p.desc}</option>)}
                </select>
              </div>
              <div>
                <div className="muted mb">Drawback</div>
                <select value={drawback} onChange={(e) => setDrawback(e.target.value)}>
                  {CUSTOM_DRAWBACKS.map((p) => <option key={p.id} value={p.id}>{p.label} — {p.desc}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Display mode */}
      <div className="setup-section">
        <label>2 · Display mode <span className="muted">(UI only — does not affect mechanics)</span></label>
        <div className="mode-row">
          {[['stats', 'Stats-forward'], ['narrative', 'Narrative'], ['hybrid', 'Hybrid (default)']].map(([v, l]) => (
            <button key={v} className={displayMode === v ? 'active' : ''} onClick={() => setDisplayMode(v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* Safety display mode */}
      <div className="setup-section">
        <label>3 · Safety display <span className="muted">(the signature mechanic)</span></label>
        <div className="mode-row">
          <button className={safetyMode === 'hidden' ? 'active' : ''} onClick={() => setSafetyMode('hidden')}>Hidden — range only (intended)</button>
          <button className={safetyMode === 'true' ? 'active' : ''} onClick={() => setSafetyMode('true')}>True value (easy)</button>
          <button className={safetyMode === 'both' ? 'active' : ''} onClick={() => setSafetyMode('both')}>Both (learning mode)</button>
        </div>
        <div className="muted mt" style={{ fontSize: 12 }}>
          You can never directly see your true Safety in Hidden mode — only an estimated range that Evaluations narrow toward reality.
        </div>
      </div>

      {/* Difficulty + seed */}
      <div className="setup-section">
        <label>4 · Difficulty</label>
        <div className="mode-row mb">
          {[['easy', 'Easy'], ['normal', 'Normal'], ['hard', 'Hard']].map(([v, l]) => (
            <button key={v} className={difficulty === v ? 'active' : ''} onClick={() => setDifficulty(v)}>{l}</button>
          ))}
        </div>
        <label>5 · Run seed <span className="muted">(type one to replay/share a run)</span></label>
        <div className="seed-row">
          <input value={seed} onChange={(e) => setSeed(e.target.value)} style={{ width: 200 }} />
          <button className="small" onClick={() => setSeed(String(randomSeed()))}>🎲 Random</button>
        </div>
      </div>

      <button className="primary" style={{ fontSize: 16, padding: '12px 28px' }} disabled={!canStart} onClick={start}>
        Found the company →
      </button>

      {highScores.length > 0 && (
        <div className="setup-section">
          <label>Hall of Fame</label>
          <table className="hs-table">
            <thead><tr><th>#</th><th>Score</th><th>Legacy</th><th>Founder</th><th>Seed</th><th>Date</th></tr></thead>
            <tbody>
              {highScores.map((h, i) => (
                <tr key={i}>
                  <td>{i + 1}</td><td>{h.score}</td><td>{h.title}</td><td>{h.founder} · {h.company}</td>
                  <td className="muted">{h.seed}</td><td className="muted">{h.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
