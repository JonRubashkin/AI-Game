import React, { useReducer, useEffect, useRef, useState } from 'react';
import { gameReducer } from './engine/reducer.js';
import { saveGame, loadGame, clearSave, addHighScore, getDebugPref, setDebugPref } from './engine/persistence.js';
import SetupScreen from './ui/SetupScreen.jsx';
import TopBar from './ui/TopBar.jsx';
import DepartmentPanel from './ui/DepartmentPanel.jsx';
import StaffPanel from './ui/StaffPanel.jsx';
import CenterPanel from './ui/CenterPanel.jsx';
import RivalPanel from './ui/RivalPanel.jsx';
import ScoreScreen from './ui/ScoreScreen.jsx';
import DebugPanel from './ui/DebugPanel.jsx';
import GlossaryModal from './ui/GlossaryModal.jsx';

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => loadGame());
  const [showGlossary, setShowGlossary] = useState(false);
  const savedScoreRef = useRef(null);

  // autosave the active run
  useEffect(() => {
    if (state) saveGame(state);
  }, [state]);

  // restore debug-open preference once a game exists
  useEffect(() => {
    if (state && getDebugPref() && !state.debug.open) {
      dispatch({ type: 'DEBUG_TOGGLE', open: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state ? state.seed : null]);

  // backtick toggles debug drawer
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '`' && state) {
        const next = !state.debug.open;
        setDebugPref(next);
        dispatch({ type: 'DEBUG_TOGGLE', open: next });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state]);

  // record high score once when a run ends
  useEffect(() => {
    if (state && state.summary && savedScoreRef.current !== state.seed) {
      savedScoreRef.current = state.seed;
      addHighScore({
        score: state.summary.finalScore,
        title: state.summary.legacy.title,
        founder: state.founder.name,
        company: state.founder.company,
        seed: state.seed,
        date: new Date().toISOString().slice(0, 10),
      });
    }
  }, [state && state.summary]);

  if (!state) {
    return <SetupScreen onStart={(setup) => { savedScoreRef.current = null; dispatch({ type: 'NEW_GAME', setup }); }} />;
  }

  const newRun = () => {
    clearSave();
    savedScoreRef.current = null;
    // force back to setup by reloading reducer with null
    dispatch({ type: 'LOAD_STATE', state: null });
  };

  return (
    <div className="app">
      <TopBar
        state={state}
        dispatch={dispatch}
        onGlossary={() => setShowGlossary(true)}
        onToggleDebug={() => { const n = !state.debug.open; setDebugPref(n); dispatch({ type: 'DEBUG_TOGGLE', open: n }); }}
        onAbandon={() => { if (window.confirm('Abandon this run and return to setup? Your progress will be lost (your score will not be recorded).')) newRun(); }}
      />
      <div className="main-grid">
        <div className="col">
          <DepartmentPanel state={state} dispatch={dispatch} />
          <StaffPanel state={state} dispatch={dispatch} />
        </div>
        <div className="col">
          <CenterPanel state={state} dispatch={dispatch} />
        </div>
        <div className="col">
          <RivalPanel state={state} />
        </div>
      </div>

      {state.summary && <ScoreScreen state={state} onNewRun={newRun} />}
      {state.debug.open && <DebugPanel state={state} dispatch={dispatch} />}
      {showGlossary && <GlossaryModal onClose={() => setShowGlossary(false)} />}
    </div>
  );
}
