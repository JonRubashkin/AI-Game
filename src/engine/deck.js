// deck.js — event drawing. No repeats within a run. Respects turn windows + prereqs + weights.

import { EVENTS } from '../data/events.js';
import { EVENTS as EVENT_CFG } from '../data/balance.js';

export function eligibleEvents(state) {
  return EVENTS.filter((e) => {
    if (state.deck.drawnIds.includes(e.id)) return false;
    if (e.minTurn && state.turn < e.minTurn) return false;
    if (e.maxTurn && state.turn > e.maxTurn) return false;
    if (e.prereq && !e.prereq(state)) return false;
    return true;
  });
}

// Draw 1..3 events this turn via the rng. Returns the drawn event objects.
export function drawEvents(state, rng) {
  const pool = eligibleEvents(state);
  if (pool.length === 0) return [];
  const count = Math.min(
    pool.length,
    rng.int(EVENT_CFG.minPerTurn, EVENT_CFG.maxPerTurn)
  );
  const drawn = [];
  let available = pool.slice();
  for (let i = 0; i < count; i++) {
    if (available.length === 0) break;
    const chosen = rng.weighted(available, (e) => e.weight);
    drawn.push(chosen);
    available = available.filter((e) => e.id !== chosen.id);
  }
  return drawn;
}
