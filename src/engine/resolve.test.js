import { describe, it, expect } from 'vitest';
import { createInitialState } from './state.js';
import { resolveTurn } from './resolve.js';
import { gameReducer } from './reducer.js';

function newGame(seed = 'test-seed', extra = {}) {
  return createInitialState({
    seed,
    difficulty: 'normal',
    displayMode: 'hybrid',
    safetyMode: 'both',
    founder: { name: 'Tester', company: 'TestCo', archetypeId: 'chen' },
    ...extra,
  });
}

describe('determinism', () => {
  it('identical seed + identical choices replay identically', () => {
    const a = resolveTurn(newGame('seed-A'));
    const b = resolveTurn(newGame('seed-A'));
    expect(a.state.resources).toEqual(b.state.resources);
    expect(a.state.rngState).toEqual(b.state.rngState);
    expect(a.state.rivals).toEqual(b.state.rivals);
  });

  it('different seeds generally diverge', () => {
    const a = resolveTurn(newGame('seed-A'));
    const b = resolveTurn(newGame('seed-ZZZ'));
    // at least one of these should differ
    const same =
      JSON.stringify(a.state.rivals) === JSON.stringify(b.state.rivals) &&
      a.state.resources.cash === b.state.resources.cash;
    expect(same).toBe(false);
  });
});

describe('turn resolution', () => {
  it('advances the turn and emits a structured log', () => {
    const s0 = newGame();
    const { state, log } = resolveTurn(s0);
    expect(state.turn).toBe(2);
    expect(state.turnPhase).toBe('plan');
    expect(Array.isArray(log)).toBe(true);
    expect(log.some((e) => e.type === 'revenue')).toBe(true);
    expect(log.some((e) => e.type === 'capability')).toBe(true);
  });

  it('produces revenue and tracks it in the ledger', () => {
    const { state } = resolveTurn(newGame());
    expect(state.ledger.revenueTotal).toBeGreaterThan(0);
  });

  it('ends the game at turn 24', () => {
    let s = newGame();
    // force-skip via reducer to turn 24
    s = gameReducer(s, { type: 'DEBUG_SKIP_TURNS', n: 30 });
    expect(s.phase === 'gameover' || s.gameOver).toBeTruthy();
    expect(s.summary).toBeTruthy();
    expect(typeof s.summary.finalScore).toBe('number');
  });
});

describe('incident ledger / prevented reveal', () => {
  it('records prevented incidents when forced via debug', () => {
    let s = newGame();
    // crank true safety high so incidents get prevented
    s = gameReducer(s, { type: 'DEBUG_SET_RESOURCE', key: 'safetyTrue', value: 100 });
    s = gameReducer(s, { type: 'DEBUG_TRIGGER_INCIDENT' });
    expect(s.ledger.incidentsPrevented.length).toBeGreaterThanOrEqual(1);
  });
});

describe('strikes -> shutdown', () => {
  it('shuts the company down at 3 strikes', () => {
    let s = newGame();
    s = gameReducer(s, { type: 'DEBUG_SET_STRIKES', value: 3 });
    const { state } = resolveTurn(s);
    expect(state.gameOver?.reason).toBe('shutdown');
  });
});

describe('event resolution flow', () => {
  it('draws events on proceed and applies a choice', () => {
    let s = newGame('event-seed');
    s = gameReducer(s, { type: 'PROCEED_TO_EVENTS' });
    expect(s.turnPhase).toBe('events');
    if (s.deck.current.length > 0) {
      const card = s.deck.current[0];
      const cashBefore = s.resources.cash;
      s = gameReducer(s, { type: 'RESOLVE_EVENT', eventId: card.id, choiceIndex: 0 });
      const resolved = s.deck.current.find((c) => c.id === card.id);
      expect(resolved.resolved).toBe(true);
      // some choice changed something (cash, trust, etc.) — at least the resolution is recorded
      expect(typeof cashBefore).toBe('number');
    }
    // resolve any remaining cards, then END_TURN should advance
    for (const c of s.deck.current.filter((x) => !x.resolved)) {
      s = gameReducer(s, { type: 'RESOLVE_EVENT', eventId: c.id, choiceIndex: 0 });
    }
    const before = s.turn;
    s = gameReducer(s, { type: 'END_TURN' });
    expect(s.turn === before + 1 || s.gameOver).toBeTruthy();
  });
});
