// formulas.js — PURE functions for the core sim math. No randomness here except where a
// roll value is passed in; this keeps them trivially unit-testable.

import { REVENUE, CAPABILITY, SAFETY, INCIDENT } from '../data/balance.js';

// ---- Department helpers -------------------------------------------------
// dept budgets are stored directly as $M amounts the player allocates this quarter.
export function deptSpend(state, dept) {
  return Math.max(0, state.departments[dept] || 0);
}

export function totalDeptSpend(state) {
  return ['research', 'safety', 'product', 'marketing', 'policy'].reduce(
    (sum, d) => sum + deptSpend(state, d),
    0
  );
}

// ---- Revenue ------------------------------------------------------------
// Revenue ≈ base × capFactor × productFactor × marketingFactor × trustFactor × market
export function revenueFactors(state, mods = {}) {
  const cap = state.resources.capability;
  const trust = state.resources.trust;
  const capFactor = Math.pow(Math.max(0, cap) / REVENUE.capDivisor, REVENUE.capExponent) + REVENUE.capFloor;

  const productSpend = deptSpend(state, 'product');
  const marketingSpend = deptSpend(state, 'marketing');

  const productMult = mods.productMult || 1;
  const marketingMult = (mods.marketingMult || 1) * (mods.marketingWeak ? 0.8 : 1);

  const productFactor = 1 + (Math.sqrt(productSpend) * REVENUE.productWeight * productMult) / 10;
  // overhype guard: marketing only pays off in proportion to capability
  const capGate = Math.min(1, cap / 35 + 0.25);
  const marketingFactor = 1 + (Math.sqrt(marketingSpend) * REVENUE.marketingWeight * marketingMult * capGate) / 10;

  const trustFactor = 1 + (trust - REVENUE.trustPivot) * REVENUE.trustSwing;

  return { capFactor, productFactor, marketingFactor, trustFactor };
}

export function computeRevenue(state, mods = {}) {
  const f = revenueFactors(state, mods);
  const market = (state.marketConditions ?? 1) * (mods.revenueMult ?? 1);
  const openSource = mods.lowRevenue ? REVENUE.openSourcePenalty : 1;
  const raw =
    REVENUE.base * f.capFactor * f.productFactor * f.marketingFactor * f.trustFactor * market * openSource;
  return {
    revenue: Math.max(0, raw),
    factors: f,
    market,
    openSource,
  };
}

// ---- Capability growth --------------------------------------------------
export function capabilityGain(state, mods = {}) {
  const spend = deptSpend(state, 'research');
  const leadSkill = mods.researchLeadSkill ?? 5;
  const researchMult = mods.researchMult ?? 1;
  const efficiency = mods.researchEfficiency ? 1.2 : 1;

  const computeFactor = Math.min(
    CAPABILITY.computeSoftCap + 0.4,
    0.3 + state.resources.compute / CAPABILITY.computeDivisor
  );
  const leadFactor = 1 + leadSkill * CAPABILITY.leadWeight;
  const diminishing = Math.pow(1 - state.resources.capability / 130, CAPABILITY.diminishing);

  let gain =
    (spend / CAPABILITY.spendDivisor) * leadFactor * computeFactor * researchMult * efficiency * Math.max(0.1, diminishing);

  gain = Math.min(CAPABILITY.maxPerTurn, Math.max(0, gain));
  return gain;
}

// ---- Safety -------------------------------------------------------------
// Returns the new true-safety value and the new interval half-width.
export function safetyUpdate(state, evalSpend, mods = {}) {
  let trueSafety = state.resources.safetyTrue;
  const safetySpend = deptSpend(state, 'safety') - evalSpend; // remaining safety spend after evals
  const safetyMult = mods.safetyMult ?? 1;

  // direct safety investment raises true safety
  const gain = Math.max(0, safetySpend) / SAFETY.spendDivisor * safetyMult;

  // red-teaming (eval spend) also nudges true safety up a little
  const redteam = evalSpend * SAFETY.redteamRaise * (mods.evalMult ?? 1);

  // natural decay + capability pressure (capability outrunning safety pushes it down)
  const capPressure =
    Math.max(0, state.resources.capability - trueSafety) * SAFETY.capabilityPressure;
  const drift = SAFETY.decayPerTurn * (mods.safetyDrift ? 2.0 : 1) + capPressure;

  trueSafety = trueSafety + gain + redteam - drift;
  trueSafety = Math.max(0, Math.min(100, trueSafety));

  // interval narrows with eval spend, widens slightly otherwise
  let half = state.resources.safetyIntervalHalf;
  const narrow = evalSpend * SAFETY.evalNarrowPerUnit * (mods.evalMult ?? 1);
  if (evalSpend > 0) {
    half = half - narrow;
  } else {
    half = half + SAFETY.intervalWiden;
  }
  half = Math.max(SAFETY.intervalMin, Math.min(SAFETY.intervalMax, half));

  return { trueSafety, intervalHalf: half, gain, redteam, drift };
}

// Build the displayed interval [low, high] centered (with a touch of jitter-free bias) on true safety.
export function safetyInterval(trueSafety, half) {
  const low = Math.max(0, Math.round(trueSafety - half));
  const high = Math.min(100, Math.round(trueSafety + half));
  return [low, high];
}

// ---- Incidents ----------------------------------------------------------
// Probability an incident is *attempted* this turn.
export function incidentChance(state, mods = {}) {
  const cap = state.resources.capability;
  const trueSafety = state.resources.safetyTrue;
  const capFactor = cap / INCIDENT.capDivisor;
  const unsafeFactor = (INCIDENT.unsafePivot - trueSafety) / 100;
  const exposure =
    INCIDENT.exposureBase + (state.activeProducts ?? 0) * INCIDENT.exposureFromProducts;
  const traitRisk = mods.incidentRisk ?? 0;

  let p = INCIDENT.base * capFactor * Math.max(0, unsafeFactor) * exposure + traitRisk;
  p *= mods.incidentMult ?? 1;
  return Math.max(0, Math.min(0.95, p));
}

// Given an incident fired, classify severity from a [0,1) roll.
// Returns { severity: 'minor'|'major'|'catastrophe' }
export function classifyIncident(state, severityRoll) {
  const cap = state.resources.capability;
  const trueSafety = state.resources.safetyTrue;
  if (severityRoll > INCIDENT.majorThreshold) return { severity: 'minor' };
  // major or worse
  const catastropheEligible =
    cap >= INCIDENT.catastropheCapThreshold && trueSafety <= INCIDENT.catastropheSafetyThreshold;
  if (catastropheEligible && severityRoll < INCIDENT.catastropheChanceWithin * INCIDENT.majorThreshold) {
    return { severity: 'catastrophe' };
  }
  return { severity: 'major' };
}

// Whether high true safety / red-team work BLOCKS (prevents) an attempted incident.
// Returns true if prevented. This is the source of the endgame "prevented" reveal.
export function incidentPrevented(trueSafety, preventRoll, mods = {}) {
  // higher true safety -> higher chance to catch it before it ships
  const preventP = Math.min(0.92, trueSafety / 110 + (mods.preventBonus ?? 0));
  return preventRoll < preventP;
}
