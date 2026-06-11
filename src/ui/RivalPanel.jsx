import React, { useState } from 'react';

const RIVAL_COLORS = {
  player: '#4f8cff',
  nimbus: '#f85149',
  aegis: '#3fb950',
  macrohard: '#d29922',
  commons: '#c9a0ff',
};

function CapabilityChart({ history, rivals }) {
  const data = history.capability;
  if (!data || data.length < 2) {
    return <div className="muted" style={{ fontSize: 12 }}>Chart appears after the first turn.</div>;
  }
  const W = 280, H = 130, pad = 6;
  const maxT = data[data.length - 1].turn || 1;
  const series = ['player', ...rivals.map((r) => r.id)];
  const x = (t) => pad + (t / Math.max(1, maxT)) * (W - pad * 2);
  const y = (v) => H - pad - (v / 100) * (H - pad * 2);

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`}>
        {[0, 50, 100].map((g) => (
          <line key={g} x1={pad} x2={W - pad} y1={y(g)} y2={y(g)} stroke="#2d3748" strokeWidth="0.5" />
        ))}
        {series.map((key) => {
          const pts = data
            .filter((d) => key in d)
            .map((d) => `${x(d.turn).toFixed(1)},${y(d[key]).toFixed(1)}`)
            .join(' ');
          return <polyline key={key} points={pts} fill="none" stroke={RIVAL_COLORS[key] || '#888'} strokeWidth={key === 'player' ? 2 : 1} opacity={key === 'player' ? 1 : 0.7} />;
        })}
      </svg>
      <div className="legend">
        <span><i style={{ background: RIVAL_COLORS.player }} /> You</span>
        {rivals.map((r) => <span key={r.id}><i style={{ background: RIVAL_COLORS[r.id] }} /> {r.name.split(' ')[0]}</span>)}
      </div>
    </div>
  );
}

export default function RivalPanel({ state }) {
  const [sortBy, setSortBy] = useState('share');

  const playerEntry = {
    id: 'player',
    name: `${state.founder.company} (You)`,
    emoji: state.founder.emoji,
    capability: state.resources.capability,
    trust: state.resources.trust,
    share: state.playerShare ?? 10,
    alive: true,
    you: true,
  };
  const entries = [playerEntry, ...state.rivals];
  const metric = (e) => (sortBy === 'share' ? e.share : sortBy === 'capability' ? e.capability : e.trust);
  const sorted = [...entries].sort((a, b) => (b.alive - a.alive) || (metric(b) - metric(a)));

  return (
    <>
      <div className="panel">
        <h3>Leaderboard</h3>
        <div className="lead-tabs">
          {[['share', 'Market'], ['capability', 'Capability'], ['trust', 'Trust']].map(([k, l]) => (
            <button key={k} className={sortBy === k ? 'active' : ''} onClick={() => setSortBy(k)}>{l}</button>
          ))}
        </div>
        {sorted.map((e, i) => (
          <div key={e.id} className={'rival-row' + (e.alive ? '' : ' dead')} style={e.you ? { fontWeight: 700 } : {}}>
            <span className="muted" style={{ width: 14 }}>{i + 1}</span>
            <span className="em">{e.emoji}</span>
            <span className="nm">{e.name}</span>
            <span className="metric" style={{ color: RIVAL_COLORS[e.id] }}>
              {sortBy === 'share' ? `${metric(e).toFixed(0)}%` : metric(e).toFixed(0)}
            </span>
          </div>
        ))}
      </div>

      <div className="panel">
        <h3>Capability Over Time</h3>
        <CapabilityChart history={state.history} rivals={state.rivals} />
      </div>
    </>
  );
}
