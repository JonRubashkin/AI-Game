// balance.js — ALL tuning constants live here for easy balancing.
// Nothing else in the engine should hardcode a magic number that belongs to balance.

export const TOTAL_TURNS = 24; // 6 years × 4 quarters

export const DIFFICULTY = {
  easy: {
    label: 'Easy',
    startCashMult: 1.4,
    eventHarshness: 0.75, // multiplies negative effect magnitudes
    rivalAggression: 0.7,
    incidentMult: 0.7,
  },
  normal: {
    label: 'Normal',
    startCashMult: 1.0,
    eventHarshness: 1.0,
    rivalAggression: 1.0,
    incidentMult: 1.0,
  },
  hard: {
    label: 'Hard',
    startCashMult: 0.7,
    eventHarshness: 1.3,
    rivalAggression: 1.35,
    incidentMult: 1.4,
  },
};

// Baseline starting resources (before archetype/custom/difficulty modifiers).
export const START = {
  cash: 100, // $M
  compute: 20, // units
  capability: 10,
  trust: 55,
  safetyTrue: 60,
  // initial confidence interval half-width around the true value (player sees a range)
  safetyIntervalHalf: 22,
};

// --- Revenue model -------------------------------------------------------
export const REVENUE = {
  base: 8, // $M baseline scale
  capExponent: 1.15, // capability has slightly increasing returns on revenue
  capDivisor: 50, // capability/ capDivisor feeds the capability factor
  productWeight: 0.9, // how much product dept investment matters
  marketingWeight: 0.8,
  trustPivot: 50, // trust above this multiplies >1, below <1
  trustSwing: 0.012, // per trust point away from pivot
  openSourcePenalty: 0.7, // Priya / Commons revenue scaling
};

// --- Capability growth ---------------------------------------------------
export const CAPABILITY = {
  spendDivisor: 14, // research $ per capability-ish
  leadWeight: 0.12, // per skill point of research lead
  computeSoftCap: 0.9, // compute factor saturates
  computeDivisor: 40,
  diminishing: 0.85, // higher current capability slows growth
  breakthroughChance: 0.08, // base chance of a breakthrough on a good research turn
  breakthroughBonus: 8, // capability jump on breakthrough
  maxPerTurn: 14,
};

// --- Safety model --------------------------------------------------------
export const SAFETY = {
  spendDivisor: 16, // safety $ -> true safety gain
  redteamRaise: 0.35, // fraction of eval spend that also nudges true safety up
  decayPerTurn: 0.6, // natural drift down (entropy / capability outpacing safety)
  capabilityPressure: 0.04, // each capability point above safety pressures safety down
  // interval narrowing: each $ of eval spend shrinks the half-interval
  evalNarrowPerUnit: 1.6,
  evalSpendDivisor: 1, // eval spend is taken from safety dept allocation fraction
  intervalMin: 3, // never perfectly certain
  intervalWiden: 1.2, // interval widens a bit each turn if you don't evaluate
  intervalMax: 40,
};

// --- Incident model ------------------------------------------------------
export const INCIDENT = {
  // chance ≈ base × capFactor × unsafeFactor × exposure
  base: 0.10,
  capDivisor: 70, // capability/this feeds capFactor
  unsafePivot: 100, // (pivot - trueSafety)/100
  exposureFromProducts: 0.5, // each active product adds exposure
  exposureBase: 0.6,
  minorTrustHit: [4, 10],
  minorRevenueHit: 0.12,
  majorTrustHit: [12, 22],
  majorRevenueHit: 0.35,
  majorStrike: 1,
  // catastrophe only possible above this capability and below this true safety
  catastropheCapThreshold: 65,
  catastropheSafetyThreshold: 35,
  catastropheChanceWithin: 0.25, // conditional chance once thresholds crossed and an incident rolls major
  majorThreshold: 0.45, // of incident severity roll
};

// --- Compute market ------------------------------------------------------
export const COMPUTE = {
  pricePerUnit: 1.2, // $M per unit to buy outright
  leasePerUnit: 0.35, // $M per unit per turn to lease
  priceVolatility: 0.4, // swings driven by events/market
};

// --- Staff ---------------------------------------------------------------
export const STAFF = {
  marketRefreshEveryTurns: 3,
  marketVisible: 5,
  poachBaseChance: 0.12,
  poachTrustReduction: 0.003, // higher trust reduces poach chance
  raiseRetainBonus: 0.4, // a raise this turn reduces poach odds
  hireSigningMult: 0.5, // signing bonus = salary × this
  ideologyFrictionThreshold: 7, // spread (max-min ideology) above this risks conflict
  ideologyConflictChance: 0.18,
};

// --- Funding -------------------------------------------------------------
export const FUNDING = {
  rounds: [
    { id: 'seed', label: 'Seed extension', cash: 40, trustReq: 0, dilution: 'small' },
    { id: 'seriesA', label: 'Series A', cash: 90, trustReq: 35, dilution: 'medium' },
    { id: 'seriesB', label: 'Series B', cash: 180, trustReq: 50, dilution: 'large' },
  ],
  hypeFounderBonus: 1.3, // Jax raises more easily
  emergencyCash: 60, // bankruptcy lifeline
  emergencyTrustHit: 25,
};

// --- Scoring -------------------------------------------------------------
export const SCORING = {
  companyValue: {
    revenueWeight: 6,
    marketShareWeight: 12,
    capabilityWeight: 4,
    cashWeight: 0.5,
  },
  safetyMultiplier: {
    base: 0.6,
    trueSafetyWeight: 0.006, // per true safety point
    preventedBonus: 0.04, // per prevented incident
    causedPenalty: 0.06, // per incident caused
    trustWeight: 0.004,
    min: 0.15,
    max: 1.8,
  },
};

// --- Regulation ----------------------------------------------------------
export const REGULATION = {
  maxStrikes: 3,
};

// --- Events --------------------------------------------------------------
export const EVENTS = {
  minPerTurn: 1,
  maxPerTurn: 3,
  rareStyleWeightCap: 2, // rare cards keep low weight
};

// Number of rivals + player share normalization base
export const MARKET = {
  totalShare: 100,
};
