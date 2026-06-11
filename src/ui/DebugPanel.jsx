import React, { useState } from 'react';
import { EVENTS } from '../data/events.js';

function StateInspector({ state }) {
  // Surface the hidden bits prominently, then the full tree.
  return (
    <div>
      <div className="panel mb" style={{ padding: 10 }}>
        <div className="debug-row"><label>TRUE Safety</label><b className="bad">{state.resources.safetyTrue.toFixed(2)}</b> <span className="muted">(shown range hides this)</span></div>
        <div className="debug-row"><label>Interval ½</label><b>{state.resources.safetyIntervalHalf.toFixed(2)}</b></div>
        <div className="debug-row"><label>RNG state</label><code>{state.rngState >>> 0}</code></div>
        <div className="debug-row"><label>RNG calls</label><code>{state.rngCalls}</code></div>
        <div className="debug-row"><label>Prevented</label><b className="good">{state.ledger.incidentsPrevented.length}</b></div>
        <div className="debug-row"><label>Caused</label><b className="bad">{state.ledger.incidentsCaused.length}</b></div>
        <div className="debug-row"><label>Delayed queued</label><b>{state.delayedEffects.length}</b></div>
        <div className="debug-row"><label>pendingMods</label><code>{JSON.stringify(state.pendingMods)}</code></div>
      </div>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
}

function TurnLog({ state }) {
  if (!state.log || state.log.length === 0) return <div className="muted">No turns resolved yet.</div>;
  return (
    <div>
      {[...state.log].reverse().map((t, i) => (
        <details className="log-turn" key={i} open={i === 0}>
          <summary>Turn {t.turn} · {t.entries.length} entries</summary>
          {t.entries.map((e, j) => (
            <div className={'log-entry ' + e.type} key={j}>
              <b>[{e.type}]</b> {e.msg}
            </div>
          ))}
        </details>
      ))}
    </div>
  );
}

function Cheats({ state, dispatch }) {
  const [eventId, setEventId] = useState(EVENTS[0].id);
  const [skipN, setSkipN] = useState(1);
  const r = state.resources;

  const setRes = (key, value) => dispatch({ type: 'DEBUG_SET_RESOURCE', key, value: +value });

  return (
    <div>
      <h4>Edit resources</h4>
      {[['cash', r.cash], ['compute', r.compute], ['capability', r.capability], ['safetyTrue', r.safetyTrue], ['trust', r.trust]].map(([k, v]) => (
        <div className="debug-row" key={k}>
          <label>{k}</label>
          <input type="number" value={Math.round(v)} onChange={(e) => setRes(k, e.target.value)} />
        </div>
      ))}
      <div className="debug-row">
        <label>strikes</label>
        <input type="number" value={state.ledger.strikes} onChange={(e) => dispatch({ type: 'DEBUG_SET_STRIKES', value: +e.target.value })} />
      </div>

      <hr className="sep" />
      <h4>God modes</h4>
      <div className="debug-row">
        <label>Infinite money</label>
        <input type="checkbox" checked={state.debug.godMoney} onChange={(e) => dispatch({ type: 'DEBUG_SET_FLAG', key: 'godMoney', value: e.target.checked })} />
      </div>
      <div className="debug-row">
        <label>No incidents</label>
        <input type="checkbox" checked={state.debug.noIncidents} onChange={(e) => dispatch({ type: 'DEBUG_SET_FLAG', key: 'noIncidents', value: e.target.checked })} />
      </div>

      <hr className="sep" />
      <h4>Force event</h4>
      <div className="debug-row">
        <select value={eventId} onChange={(e) => setEventId(e.target.value)} style={{ flex: 1 }}>
          {EVENTS.map((e) => <option key={e.id} value={e.id}>{e.rare ? '✦ ' : ''}{e.title}</option>)}
        </select>
        <button className="small" onClick={() => dispatch({ type: 'DEBUG_FORCE_EVENT', eventId })}>Draw</button>
      </div>

      <hr className="sep" />
      <h4>Controls</h4>
      <div className="actions-row">
        <button className="small" onClick={() => dispatch({ type: 'DEBUG_TRIGGER_INCIDENT' })}>Trigger incident check</button>
        <button className="small" onClick={() => dispatch({ type: 'DEBUG_REROLL_MARKET' })}>Re-roll hiring market</button>
        <button className="small" onClick={() => dispatch({ type: 'DEBUG_JUMP_SCORE' })}>Jump to score screen</button>
      </div>
      <div className="debug-row mt">
        <label>Skip turns</label>
        <input type="number" min="1" max="24" value={skipN} onChange={(e) => setSkipN(+e.target.value)} />
        <button className="small" onClick={() => dispatch({ type: 'DEBUG_SKIP_TURNS', n: skipN })}>Skip (auto-default choices)</button>
      </div>
    </div>
  );
}

function DeckViewer({ state }) {
  const drawn = new Set(state.deck.drawnIds);
  return (
    <div>
      <div className="muted mb">{EVENTS.length} cards · {drawn.size} drawn this run</div>
      {EVENTS.map((e) => (
        <div className={'deck-row' + (drawn.has(e.id) ? ' drawn' : '') + (e.rare ? ' rare' : '')} key={e.id}>
          <span>{e.rare ? '✦ ' : ''}{e.title}</span>
          <span className="muted">
            w{e.weight} · T{e.minTurn || 1}-{e.maxTurn || 24}{e.prereq ? ' · prereq' : ''}{drawn.has(e.id) ? ' · ✓' : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DebugPanel({ state, dispatch }) {
  const [tab, setTab] = useState('state');
  const tabs = [
    ['state', 'State'],
    ['log', 'Turn Log'],
    ['cheats', 'Cheats'],
    ['deck', 'Deck'],
  ];

  return (
    <div className="debug-drawer">
      <div className="dh">
        <b>🐞 Debug</b>
        <span className="muted" style={{ fontSize: 11 }}>` to toggle</span>
        <div className="spacer" />
        <button className="small ghost" onClick={() => dispatch({ type: 'DEBUG_TOGGLE', open: false })}>✕</button>
      </div>
      <div className="debug-tabs">
        {tabs.map(([k, l]) => (
          <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      <div className="debug-body">
        {tab === 'state' && <StateInspector state={state} />}
        {tab === 'log' && <TurnLog state={state} />}
        {tab === 'cheats' && <Cheats state={state} dispatch={dispatch} />}
        {tab === 'deck' && <DeckViewer state={state} />}
      </div>
    </div>
  );
}
