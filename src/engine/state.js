// state.js — initial game-state construction from the setup screen choices.

import { START, DIFFICULTY } from '../data/balance.js';
import { ARCHETYPES, getArchetype } from '../data/archetypes.js';
import { RIVALS } from '../data/rivals.js';
import { STAFF_POOL } from '../data/staff.js';
import { hashSeed, createRng } from './rng.js';

// Collect passive tags from archetype + custom perk/drawback into a flat set.
export function collectPassives(founder) {
  const set = new Set();
  if (founder.archetypeId) {
    const a = getArchetype(founder.archetypeId);
    if (a) a.passives.forEach((p) => set.add(p));
  }
  if (founder.perk) set.add(founder.perk);
  if (founder.drawback) set.add(founder.drawback);
  return set;
}

function buildRivals() {
  return RIVALS.map((r) => ({
    id: r.id,
    name: r.name,
    emoji: r.emoji,
    archetype: r.archetype,
    capability: r.start.capability,
    trust: r.start.trust,
    safety: r.start.safety,
    share: r.start.share,
    cash: r.start.cash,
    alive: true,
  }));
}

// Make a hiring-market draw of `count` candidates with small stat jitter, via rng.
export function rollHiringMarket(rng, count, excludeIds = [], passives = new Set()) {
  const pool = STAFF_POOL.filter((s) => !excludeIds.includes(s.id));
  const shuffled = rng.shuffle(pool).slice(0, count);
  return shuffled.map((s) => {
    const skillJitter = rng.int(-1, 1);
    const salaryJitter = rng.int(-1, 2);
    let salary = Math.max(3, s.salary + salaryJitter);
    if (passives.has('cheapTalent')) salary = Math.max(2, Math.round(salary * 0.75));
    return {
      ...s,
      uid: `${s.id}-${rng.int(1000, 9999)}`,
      skill: Math.max(1, Math.min(10, s.skill + skillJitter)),
      salary,
      hired: false,
    };
  });
}

export function createInitialState(setup) {
  const seedInt = hashSeed(setup.seed);
  const diff = DIFFICULTY[setup.difficulty] || DIFFICULTY.normal;
  const founder = setup.founder;
  const passives = collectPassives(founder);

  // base resources
  const res = {
    cash: START.cash,
    compute: START.compute,
    capability: START.capability,
    trust: START.trust,
    safetyTrue: START.safetyTrue,
    safetyIntervalHalf: START.safetyIntervalHalf,
  };

  // apply archetype mods
  let archetype = null;
  if (founder.archetypeId) {
    archetype = getArchetype(founder.archetypeId);
    if (archetype) {
      for (const [k, v] of Object.entries(archetype.mods)) {
        if (k in res) res[k] += v;
      }
    }
  }

  // apply custom bonus point allocation (custom founders)
  if (founder.alloc) {
    res.cash += (founder.alloc.cash || 0) * 12;
    res.capability += (founder.alloc.research || 0) * 4;
    res.safetyTrue += (founder.alloc.safety || 0) * 5;
    res.trust += (founder.alloc.reputation || 0) * 5;
  }

  // difficulty scaling on starting cash
  res.cash = Math.round(res.cash * diff.startCashMult);
  res.trust = Math.max(0, Math.min(100, res.trust));
  res.safetyTrue = Math.max(0, Math.min(100, res.safetyTrue));
  res.capability = Math.max(1, res.capability);

  // initial rng for setup-time draws (hiring market, etc.)
  const setupRng = createRng(seedInt);

  // starting staff: archetype eliteHire grants one strong researcher already hired
  const staff = [];
  if (passives.has('eliteHire')) {
    const elite = STAFF_POOL.find((s) => s.id === 's11'); // Dr. Erik Solberg, skill 10
    staff.push({ ...elite, uid: `${elite.id}-elite`, hired: true, leadOf: 'research' });
  }

  const hiringMarket = rollHiringMarket(
    setupRng,
    5,
    staff.map((s) => s.id),
    passives
  );

  const state = {
    schema: 1,
    phase: 'playing', // 'playing' | 'gameover'
    turnPhase: 'plan', // 'plan' (budget + actions) | 'events'
    turn: 1,
    seed: setup.seed,
    rngState: setupRng.getState(),
    rngCalls: setupRng.getCalls(),

    settings: {
      displayMode: setup.displayMode || 'hybrid', // stats | narrative | hybrid
      safetyMode: setup.safetyMode || 'hidden', // hidden | true | both
      difficulty: setup.difficulty || 'normal',
    },

    founder: {
      name: founder.name,
      company: founder.company,
      archetypeId: founder.archetypeId || null,
      archetypeName: archetype ? archetype.name : 'Custom Founder',
      emoji: archetype ? archetype.emoji : '🧑‍💼',
      perk: founder.perk || null,
      drawback: founder.drawback || null,
    },
    passives: Array.from(passives),

    resources: res,

    // department budgets in $M, allocated each quarter. Unspent cash simply stays as cash.
    departments: {
      research: 10,
      safety: 6,
      product: 9,
      marketing: 4,
      policy: 3,
    },
    evalFraction: 0.4, // fraction of the SAFETY dept budget spent on evaluations (narrows interval)

    staff,
    hiringMarket,

    rivals: buildRivals(),

    deck: {
      drawnIds: [], // event ids already drawn this run (no repeats)
      current: [], // events presented this turn awaiting resolution
    },

    delayedEffects: [], // [{ turn, effects, news }]
    pendingMods: {}, // mods that apply to next resolution (e.g. revenueMultThisTurn from events)

    ledger: {
      incidentsCaused: [], // {turn, severity}
      incidentsPrevented: [], // {turn, reason}
      strikes: 0,
      revenueTotal: 0,
      peakCapability: res.capability,
    },

    news: [
      { turn: 0, text: `${founder.company} is founded. ${founder.name} takes the helm.`, kind: 'flavor' },
    ],
    history: {
      capability: [{ turn: 0, player: res.capability, ...Object.fromEntries(RIVALS.map((r) => [r.id, r.start.capability])) }],
    },

    marketConditions: 1,
    computePriceMult: 1,
    activeProducts: 0,

    log: [], // [{ turn, entries: [...] }] structured turn log
    flags: {
      usedEmergencyFunding: false,
      lastMarketRefreshTurn: 1,
      releasedThisTurn: false,
    },

    debug: {
      open: false,
      godMoney: false,
      noIncidents: false,
    },

    gameOver: null, // { reason, summary }
  };

  return state;
}
