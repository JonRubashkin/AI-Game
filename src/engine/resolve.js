// resolve.js — the turn-resolution engine. PURE: resolveTurn(state) -> { state, log }.
// All randomness flows through an rng built from state.rngState; the new rng state is written
// back so identical seeds + identical choices replay identically.
//
// The structured `log` array is emitted for BOTH the Debug "Turn Log" tab and unit tests.

import { createRng } from './rng.js';
import { getMods } from './mods.js';
import { applyEffects } from './effects.js';
import { drawEvents } from './deck.js';
import { rollHiringMarket } from './state.js';
import {
  computeRevenue,
  capabilityGain,
  safetyUpdate,
  deptSpend,
  totalDeptSpend,
  incidentChance,
  classifyIncident,
  incidentPrevented,
} from './formulas.js';
import {
  TOTAL_TURNS,
  CAPABILITY,
  COMPUTE,
  STAFF,
  REGULATION,
  INCIDENT,
  DIFFICULTY,
} from '../data/balance.js';
import { RIVALS } from '../data/rivals.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function L(log, type, msg, data) {
  log.push({ type, msg, ...(data ? { data } : {}) });
}

// ------------------------------------------------------------------ rivals
function resolveRivals(draft, rng, mods, log) {
  const aggression = mods.rivalAggression;
  for (const r of draft.rivals) {
    if (!r.alive) continue;
    const def = RIVALS.find((x) => x.id === r.id);
    // capability growth with noise
    const growth = def.capGrowth * rng.float(0.6, 1.4);
    r.capability = clamp(r.capability + growth, 0, 100);

    // trust reverts toward the rival's archetype target (keeps labs differentiated)
    const target = def.trustTarget ?? 55;
    r.trust = clamp(r.trust + (target - r.trust) * 0.18 + rng.float(-2, 2), 0, 100);

    // rival incident
    const incP = 0.05 * def.incidentProneness * aggression * (r.capability / 50);
    if (rng.chance(incP)) {
      const sev = rng.chance(0.3) ? 'major' : 'minor';
      r.trust = clamp(r.trust - (sev === 'major' ? 14 : 6), 0, 100);
      r.share = clamp(r.share - (sev === 'major' ? 3 : 1), 0, 100);
      draft.news.unshift({ turn: draft.turn, text: `${r.name} suffers a ${sev} incident; trust takes a hit.`, kind: 'rival' });
      L(log, 'rivalIncident', `${r.name} ${sev} incident`, { incP: incP.toFixed(3) });
    }

    // scripted moves
    if (rng.chance(def.scandalChance * aggression)) {
      r.trust = clamp(r.trust - 8, 0, 100);
      draft.news.unshift({ turn: draft.turn, text: `Scandal at ${r.name}: ${rng.pick(SCANDALS)}`, kind: 'rival' });
    }
    if (rng.chance((def.marketCrashChance || 0) * aggression)) {
      draft.pendingMods.marketCrash = true;
      draft.news.unshift({ turn: draft.turn, text: `${r.name} open-sources a strong model — the whole market’s pricing wobbles.`, kind: 'rival' });
      L(log, 'marketCrash', `${r.name} triggers market crash`);
    }

    // rare collapse
    if (rng.chance(def.collapseRisk * aggression) && draft.turn > 6) {
      r.alive = false;
      r.share = 0;
      draft.news.unshift({ turn: draft.turn, text: `💥 ${r.name} collapses — out of cash and out of time. The industry reels.`, kind: 'rival' });
      L(log, 'rivalCollapse', `${r.name} collapsed`);
    }
  }
  // renormalize market share among the living (player + rivals share a 100-point pie loosely)
}

const SCANDALS = [
  'a leaked all-hands recording goes viral.',
  'their star researcher quits on stage.',
  'an internal memo questions their safety claims.',
  'a botched launch becomes a meme.',
  'regulators open an inquiry.',
];

const FLAVOR_HEADLINES = [
  'Op-ed: "Is the AI bubble about to pop?" (Issued quarterly, forever.)',
  'Analysts argue over whether this is a hype cycle or a paradigm shift.',
  'A new benchmark drops; three labs immediately claim #1.',
  'Conference keynote runs 40 minutes over. Nobody leaves.',
  'Anonymous forum predicts AGI by Tuesday. Again.',
  'A think tank publishes a 300-page report nobody finishes.',
  'Venture capital declares AI "the new electricity," again.',
  'Late-night host does a bit about chatbots. It’s pretty good, actually.',
];

// ------------------------------------------------------------------ market share
function rivalShareMult(id) {
  return (RIVALS.find((x) => x.id === id) || {}).shareMult ?? 1;
}
function updateMarketShare(draft, playerRevenue) {
  // share tracks relative capability×trust strength, weighted by each lab's market footprint
  const strength = (cap, trust, mult) => Math.max(1, cap) * (0.5 + trust / 100) * mult;
  const playerStrength = strength(draft.resources.capability, draft.resources.trust, 1.0);
  const living = draft.rivals.filter((r) => r.alive);
  const rivalStrengths = living.map((r) => strength(r.capability, r.trust, rivalShareMult(r.id)));
  const total = playerStrength + rivalStrengths.reduce((a, b) => a + b, 0);
  draft.playerShare = (playerStrength / total) * 100;
  living.forEach((r, i) => {
    r.share = (rivalStrengths[i] / total) * 100;
  });
}

// ------------------------------------------------------------------ poaching
function resolvePoaching(draft, rng, mods, log) {
  const hired = draft.staff.filter((s) => s.hired);
  if (hired.length === 0) return;
  for (const s of hired) {
    let base = STAFF.poachBaseChance;
    // big-tech rival + nemesis raise the odds; trust + mentor lower them
    if (mods.nemesisRival) base += 0.06;
    base *= mods.teamPoachReduction;
    base -= draft.resources.trust * STAFF.poachTrustReduction;
    if (s.recentRaise) base *= 1 - STAFF.raiseRetainBonus;
    base = clamp(base, 0.01, 0.6);
    if (rng.chance(base)) {
      // they get poached
      s.hired = false;
      s.poached = true;
      draft.staff = draft.staff.filter((x) => x.uid !== s.uid);
      draft.news.unshift({ turn: draft.turn, text: `${s.name} is poached by a rival. A blow to the ${s.role} team.`, kind: 'staff' });
      L(log, 'poach', `${s.name} poached (p=${base.toFixed(2)})`);
    }
    s.recentRaise = false;
  }
}

// ------------------------------------------------------------------ ideology friction
function resolveIdeology(draft, rng, log) {
  const hired = draft.staff.filter((s) => s.hired);
  if (hired.length < 3) return;
  const ideo = hired.map((s) => s.ideology);
  const spread = Math.max(...ideo) - Math.min(...ideo);
  if (spread >= STAFF.ideologyFrictionThreshold && rng.chance(STAFF.ideologyConflictChance)) {
    // someone at an extreme resigns / leaks
    const extreme = hired.reduce((a, b) => (Math.abs(b.ideology) > Math.abs(a.ideology) ? b : a));
    draft.staff = draft.staff.filter((x) => x.uid !== extreme.uid);
    draft.resources.trust = clamp(draft.resources.trust - 4, 0, 100);
    draft.news.unshift({ turn: draft.turn, text: `Internal conflict: ${extreme.name} resigns over the company’s direction. Whispers of a leak.`, kind: 'staff' });
    L(log, 'ideology', `${extreme.name} resigned (spread=${spread})`);
  }
}

// ------------------------------------------------------------------ incidents
function resolveIncidents(draft, rng, mods, log) {
  const p = incidentChance(draft, mods);
  const roll = rng.next();
  L(log, 'incidentCheck', `Incident check: rolled ${roll.toFixed(3)} vs chance ${p.toFixed(3)}`, {
    capability: draft.resources.capability,
    trueSafety: draft.resources.safetyTrue,
    exposure: draft.activeProducts,
  });
  if (roll >= p) {
    return; // no incident attempted
  }

  // An incident is ATTEMPTED. Does safety work prevent it?
  const preventRoll = rng.next();
  if (incidentPrevented(draft.resources.safetyTrue, preventRoll, mods)) {
    draft.ledger.incidentsPrevented.push({ turn: draft.turn, reason: 'caught by safety/red-team' });
    L(log, 'incidentPrevented', `Incident PREVENTED (prevent roll ${preventRoll.toFixed(3)})`);
    return;
  }

  // It fires. Classify severity.
  const severityRoll = rng.next();
  const { severity } = classifyIncident(draft, severityRoll);
  L(log, 'incidentFired', `Incident FIRED: ${severity} (sev roll ${severityRoll.toFixed(3)})`);
  draft.ledger.incidentsCaused.push({ turn: draft.turn, severity });

  const res = draft.resources;
  if (severity === 'minor') {
    const hit = rng.int(INCIDENT.minorTrustHit[0], INCIDENT.minorTrustHit[1]);
    res.trust = clamp(res.trust - hit, 0, 100);
    draft.pendingMods.revenueMult = (draft.pendingMods.revenueMult ?? 1) * (1 - INCIDENT.minorRevenueHit);
    draft.news.unshift({ turn: draft.turn, text: `A minor incident with your model dents user trust (-${hit}).`, kind: 'incident' });
  } else if (severity === 'major') {
    const hit = rng.int(INCIDENT.majorTrustHit[0], INCIDENT.majorTrustHit[1]);
    res.trust = clamp(res.trust - hit, 0, 100);
    draft.ledger.strikes += INCIDENT.majorStrike;
    draft.pendingMods.revenueMult = (draft.pendingMods.revenueMult ?? 1) * (1 - INCIDENT.majorRevenueHit);
    draft.news.unshift({ turn: draft.turn, text: `⚠️ MAJOR incident: harmful model behavior makes the news (-${hit} trust, +1 strike).`, kind: 'incident' });
  } else if (severity === 'catastrophe') {
    draft.news.unshift({ turn: draft.turn, text: `☠️ CATASTROPHE: an uncontrolled failure causes real-world harm. The run is over.`, kind: 'incident' });
    draft.gameOver = { reason: 'catastrophe' };
    L(log, 'catastrophe', 'Catastrophic incident — run ends');
  }
}

// ------------------------------------------------------------------ end-state checks
function checkEndConditions(draft, log) {
  if (draft.gameOver) return;
  if (draft.ledger.strikes >= REGULATION.maxStrikes) {
    draft.gameOver = { reason: 'shutdown' };
    draft.news.unshift({ turn: draft.turn, text: `🚫 Regulators revoke your license after ${draft.ledger.strikes} strikes. Shut down.`, kind: 'incident' });
    L(log, 'shutdown', 'Regulatory shutdown (3 strikes)');
  }
}

// ------------------------------------------------------------------ main
export function resolveTurn(stateIn) {
  const draft = structuredClone(stateIn);
  const rng = createRng(draft.rngState);
  const mods = getMods(draft);
  const diff = DIFFICULTY[draft.settings.difficulty] || DIFFICULTY.normal;
  const log = [];
  L(log, 'turnStart', `--- Resolving Q${((draft.turn - 1) % 4) + 1} Year ${Math.ceil(draft.turn / 4)} (turn ${draft.turn}) ---`);

  // 0) process delayed effects due this turn
  const due = draft.delayedEffects.filter((d) => d.turn === draft.turn);
  draft.delayedEffects = draft.delayedEffects.filter((d) => d.turn !== draft.turn);
  for (const d of due) {
    L(log, 'delayed', `Delayed effect triggers: ${JSON.stringify(d.effects)}`);
    applyEffects(draft, { ...d.effects, news: d.news }, rng, log, { harshness: diff.eventHarshness });
  }

  // 1) capability growth
  const preCap = draft.resources.capability;
  let gain = capabilityGain(draft, mods);
  let breakthrough = false;
  if (rng.chance(CAPABILITY.breakthroughChance) && deptSpend(draft, 'research') > 6) {
    breakthrough = true;
    gain += CAPABILITY.breakthroughBonus;
    draft.news.unshift({ turn: draft.turn, text: `🔬 Research breakthrough! Capability jumps unexpectedly.`, kind: 'flavor' });
  }
  draft.resources.capability = clamp(preCap + gain, 0, 100);
  L(log, 'capability', `Capability = ${preCap.toFixed(1)} + ${gain.toFixed(2)}${breakthrough ? ' (BREAKTHROUGH)' : ''} = ${draft.resources.capability.toFixed(1)}`);

  // 2) safety update
  const evalSpend = deptSpend(draft, 'safety') * draft.evalFraction;
  const before = { safety: draft.resources.safetyTrue, half: draft.resources.safetyIntervalHalf };
  const su = safetyUpdate(draft, evalSpend, mods);
  draft.resources.safetyTrue = su.trueSafety;
  draft.resources.safetyIntervalHalf = su.intervalHalf;
  L(log, 'safety', `TrueSafety ${before.safety.toFixed(1)} -> ${su.trueSafety.toFixed(1)} (gain ${su.gain.toFixed(2)}, redteam ${su.redteam.toFixed(2)}, drift -${su.drift.toFixed(2)}); interval half ${before.half.toFixed(1)} -> ${su.intervalHalf.toFixed(1)} (evalSpend ${evalSpend.toFixed(1)})`);

  // 3) revenue
  const revMods = {
    ...mods,
    revenueMult: draft.pendingMods.revenueMult ?? 1,
  };
  if (draft.pendingMods.marketCrash) {
    draft.marketConditions = clamp(draft.marketConditions * 0.8, 0.5, 1.5);
  }
  const rev = computeRevenue(draft, revMods);
  const revenue = rev.revenue;
  L(log, 'revenue', `Revenue = base × cap ${rev.factors.capFactor.toFixed(2)} × product ${rev.factors.productFactor.toFixed(2)} × mkt ${rev.factors.marketingFactor.toFixed(2)} × trust ${rev.factors.trustFactor.toFixed(2)} × market ${rev.market.toFixed(2)} = ${revenue.toFixed(2)}`, { revenue });

  // 4) costs
  const salaries = draft.staff.filter((s) => s.hired).reduce((a, s) => a + s.salary, 0);
  const deptTotal = totalDeptSpend(draft);
  const computeUpkeep = draft.resources.compute * COMPUTE.upkeepPerUnit;
  const costs = salaries + deptTotal + computeUpkeep;
  draft.resources.cash += revenue - costs;
  draft.ledger.revenueTotal += revenue;
  L(log, 'costs', `Costs = salaries ${salaries.toFixed(1)} + dept ${deptTotal.toFixed(1)} + compute upkeep ${computeUpkeep.toFixed(1)} = ${costs.toFixed(1)}; net cash ${(revenue - costs).toFixed(1)}`);

  if (draft.debug?.godMoney) draft.resources.cash = Math.max(draft.resources.cash, 9999);

  // 5) incidents
  resolveIncidents(draft, rng, mods, log);

  // 6) rivals
  resolveRivals(draft, rng, mods, log);

  // 7) poaching + ideology
  resolvePoaching(draft, rng, mods, log);
  resolveIdeology(draft, rng, log);

  // 8) trust drift (mild reversion) + market normalize
  const trustPull = mods.trustedVoice ? 0.5 : 0;
  draft.resources.trust = clamp(draft.resources.trust + trustPull, 0, 100);
  draft.marketConditions = clamp(draft.marketConditions + (1 - draft.marketConditions) * 0.25, 0.5, 1.5);

  // 9) market share
  updateMarketShare(draft, revenue);

  // 10) ledger peaks
  draft.ledger.peakCapability = Math.max(draft.ledger.peakCapability, draft.resources.capability);

  // 11) flavor headlines (1-2)
  const flavorCount = rng.int(1, 2);
  for (let i = 0; i < flavorCount; i++) {
    draft.news.unshift({ turn: draft.turn, text: rng.pick(FLAVOR_HEADLINES), kind: 'flavor' });
  }

  // 12) bankruptcy / shutdown checks
  if (draft.resources.cash < 0 && !draft.gameOver) {
    if (!draft.flags.usedEmergencyFunding) {
      // one lifeline at brutal terms
      draft.flags.usedEmergencyFunding = true;
      draft.resources.cash += 60;
      draft.resources.trust = clamp(draft.resources.trust - 25, 0, 100);
      draft.news.unshift({ turn: draft.turn, text: `🆘 Emergency bridge financing keeps the lights on — at a brutal cost to trust and ownership.`, kind: 'incident' });
      L(log, 'emergency', 'Emergency funding lifeline used');
    } else {
      draft.gameOver = { reason: 'bankruptcy' };
      draft.news.unshift({ turn: draft.turn, text: `💀 Out of cash and out of lifelines. ${draft.founder.company} folds.`, kind: 'incident' });
      L(log, 'bankruptcy', 'Bankruptcy — run ends');
    }
  }
  checkEndConditions(draft, log);

  // 13) history snapshot for the chart
  const snap = { turn: draft.turn, player: Math.round(draft.resources.capability) };
  draft.rivals.forEach((r) => (snap[r.id] = Math.round(r.capability)));
  draft.history.capability.push(snap);

  // 14) advance turn / end game
  if (!draft.gameOver && draft.turn >= TOTAL_TURNS) {
    draft.gameOver = { reason: 'completed' };
    L(log, 'complete', 'Reached turn 24 — run complete');
  }

  // record this turn's log
  draft.log = draft.log.concat([{ turn: draft.turn, entries: log }]);

  if (!draft.gameOver) {
    draft.turn += 1;
    draft.turnPhase = 'plan';
    draft.pendingMods = {};
    draft.deck.current = [];
    draft.flags.releasedThisTurn = false;
    // refresh hiring market periodically
    if (draft.turn - draft.flags.lastMarketRefreshTurn >= STAFF.marketRefreshEveryTurns) {
      const passives = new Set(draft.passives);
      const hiredIds = draft.staff.map((s) => s.id);
      draft.hiringMarket = rollHiringMarket(rng, STAFF.marketVisible, hiredIds, passives);
      draft.flags.lastMarketRefreshTurn = draft.turn;
      L(log, 'market', 'Hiring market refreshed');
    }
  } else {
    draft.phase = 'gameover';
  }

  // write back rng
  draft.rngState = rng.getState();
  draft.rngCalls = (draft.rngCalls || 0) + rng.getCalls();

  return { state: draft, log };
}
