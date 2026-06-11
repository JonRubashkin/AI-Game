// effects.js — applies declarative event/delayed effect objects to a state draft.
// Mutates the passed draft. Records log entries. Uses rng for chance-gated delayed effects.

import { REGULATION } from '../data/balance.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function fmtNews(text, state) {
  return (text || '').replace(/%COMPANY%/g, state.founder.company);
}

// Apply an effects object to the draft. `harshness` scales negative magnitudes (difficulty).
export function applyEffects(draft, effects, rng, log, opts = {}) {
  if (!effects) return;
  const harsh = opts.harshness ?? 1;
  const res = draft.resources;
  const scaleNeg = (v) => (v < 0 ? v * harsh : v);

  if ('cash' in effects) res.cash += scaleNeg(effects.cash);
  if ('compute' in effects) res.compute = Math.max(0, res.compute + effects.compute);
  if ('capability' in effects) res.capability = clamp(res.capability + effects.capability, 0, 100);
  if ('trust' in effects) res.trust = clamp(res.trust + scaleNeg(effects.trust), 0, 100);

  // HIDDEN: true safety changes — never surfaced directly in hidden mode.
  if ('safetyTrue' in effects) {
    res.safetyTrue = clamp(res.safetyTrue + scaleNeg(effects.safetyTrue), 0, 100);
    log && log.push({ type: 'hiddenSafety', delta: scaleNeg(effects.safetyTrue), msg: `(hidden) true safety ${effects.safetyTrue >= 0 ? '+' : ''}${scaleNeg(effects.safetyTrue).toFixed(1)}` });
  }
  if ('safetyInterval' in effects) {
    res.safetyIntervalHalf = clamp(res.safetyIntervalHalf + effects.safetyInterval, 3, 40);
  }

  if ('strike' in effects && effects.strike) {
    draft.ledger.strikes += effects.strike;
    log && log.push({ type: 'strike', msg: `Regulatory strike +${effects.strike} (now ${draft.ledger.strikes}/${REGULATION.maxStrikes})` });
  }

  if ('revenueMultThisTurn' in effects) {
    draft.pendingMods.revenueMult = (draft.pendingMods.revenueMult ?? 1) * effects.revenueMultThisTurn;
  }
  if (effects.marketCrash) {
    draft.pendingMods.marketCrash = true;
  }
  if ('computePrice' in effects) {
    draft.computePriceMult = clamp(draft.computePriceMult * effects.computePrice, 0.5, 3);
  }

  if (effects.news) {
    draft.news.unshift({ turn: draft.turn, text: fmtNews(effects.news, draft), kind: 'consequence' });
  }

  // Queue delayed effects. chance-gated ones are rolled NOW for determinism.
  if (Array.isArray(effects.delayed)) {
    for (const d of effects.delayed) {
      if (typeof d.chance === 'number' && !rng.chance(d.chance)) continue;
      draft.delayedEffects.push({
        turn: draft.turn + (d.turnsAhead || 1),
        effects: d.effects || {},
        news: d.news || null,
      });
    }
  }
}
