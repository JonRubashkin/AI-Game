// reducer.js — single source of truth for state transitions. Pure function.
// Debug cheats go through the SAME reducer (DEBUG_* actions) so they can't corrupt invariants.

import { createInitialState, rollHiringMarket } from './state.js';
import { resolveTurn } from './resolve.js';
import { computeSummary } from './scoring.js';
import { getMods } from './mods.js';
import { applyEffects } from './effects.js';
import { drawEvents } from './deck.js';
import { getEvent, EVENTS } from '../data/events.js';
import { createRng } from './rng.js';
import { COMPUTE, FUNDING, STAFF, DIFFICULTY, REGULATION } from '../data/balance.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Run a function with an rng built from state, writing the rng state back onto the returned draft.
function withRng(state, fn) {
  const draft = structuredClone(state);
  const rng = createRng(draft.rngState);
  fn(draft, rng);
  draft.rngState = rng.getState();
  draft.rngCalls = (draft.rngCalls || 0) + rng.getCalls();
  return draft;
}

function harshnessOf(state) {
  return (DIFFICULTY[state.settings.difficulty] || DIFFICULTY.normal).eventHarshness;
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'NEW_GAME':
      return createInitialState(action.setup);

    case 'SET_DEPARTMENT': {
      if (state.turnPhase !== 'plan') return state;
      return {
        ...state,
        departments: { ...state.departments, [action.dept]: Math.max(0, action.value) },
      };
    }

    case 'SET_EVAL_FRACTION':
      return { ...state, evalFraction: clamp(action.value, 0, 1) };

    // ---- staff ----
    case 'HIRE': {
      const cand = state.hiringMarket.find((s) => s.uid === action.uid);
      if (!cand) return state;
      const signing = Math.round(cand.salary * STAFF.hireSigningMult);
      if (state.resources.cash < signing) return state;
      return {
        ...state,
        resources: { ...state.resources, cash: state.resources.cash - signing },
        staff: [...state.staff, { ...cand, hired: true }],
        hiringMarket: state.hiringMarket.filter((s) => s.uid !== action.uid),
        news: [{ turn: state.turn, text: `${cand.name} joins as ${cand.role}. Welcome aboard.`, kind: 'staff' }, ...state.news],
      };
    }
    case 'FIRE': {
      const s = state.staff.find((x) => x.uid === action.uid);
      if (!s) return state;
      return {
        ...state,
        staff: state.staff.filter((x) => x.uid !== action.uid),
        news: [{ turn: state.turn, text: `${s.name} departs the company.`, kind: 'staff' }, ...state.news],
      };
    }
    case 'RAISE': {
      const s = state.staff.find((x) => x.uid === action.uid);
      if (!s) return state;
      const cost = Math.round(s.salary * 0.5);
      if (state.resources.cash < cost) return state;
      return {
        ...state,
        resources: { ...state.resources, cash: state.resources.cash - cost },
        staff: state.staff.map((x) => (x.uid === action.uid ? { ...x, salary: x.salary + 2, recentRaise: true } : x)),
      };
    }

    // ---- compute ----
    case 'BUY_COMPUTE': {
      const units = action.units || 5;
      const passives = new Set(state.passives);
      const discount = passives.has('cheapCompute') ? 0.7 : 1;
      const cost = Math.round(units * COMPUTE.pricePerUnit * state.computePriceMult * discount);
      if (state.resources.cash < cost) return state;
      return {
        ...state,
        resources: {
          ...state.resources,
          cash: state.resources.cash - cost,
          compute: state.resources.compute + units,
        },
        news: [{ turn: state.turn, text: `Acquired ${units} units of compute for $${cost}M.`, kind: 'flavor' }, ...state.news],
      };
    }

    // ---- product release ----
    case 'RELEASE_PRODUCT': {
      if (state.turnPhase !== 'plan') return state;
      return withRng(state, (draft, rng) => {
        const mods = getMods(draft);
        draft.activeProducts = (draft.activeProducts || 0) + 1;
        draft.pendingMods.revenueMult = (draft.pendingMods.revenueMult ?? 1) * (1.18 * (mods.releaseSpeed ?? 1));
        // launch-day incident risk unless a hardliner protects you
        if (!mods.noLaunchIncidents) {
          const risk = clamp((100 - draft.resources.safetyTrue) / 260 + draft.resources.capability / 400, 0.02, 0.4);
          if (rng.chance(risk)) {
            const hit = rng.int(4, 10);
            draft.resources.trust = clamp(draft.resources.trust - hit, 0, 100);
            draft.resources.safetyTrue = clamp(draft.resources.safetyTrue - 2, 0, 100);
            draft.news.unshift({ turn: draft.turn, text: `Launch-day hiccup: the new release ships with an embarrassing bug (-${hit} trust).`, kind: 'incident' });
          } else {
            draft.news.unshift({ turn: draft.turn, text: `🚀 New model release ships. Early reception is positive.`, kind: 'flavor' });
          }
        } else {
          draft.news.unshift({ turn: draft.turn, text: `🚀 New model release ships — your safety lead made sure it was solid first.`, kind: 'flavor' });
        }
      });
    }

    // ---- research initiative ----
    case 'RESEARCH_INITIATIVE': {
      if (state.turnPhase !== 'plan') return state;
      const cashCost = 8;
      const computeCost = 5;
      if (state.resources.cash < cashCost || state.resources.compute < computeCost) return state;
      return withRng(state, (draft, rng) => {
        const mods = getMods(draft);
        draft.resources.cash -= cashCost;
        draft.resources.compute -= computeCost;
        const gain = rng.float(2, 5) * (mods.researchMult ?? 1) * (mods.researchEfficiency ? 1.2 : 1);
        draft.resources.capability = clamp(draft.resources.capability + gain, 0, 100);
        // a focused push can quietly outpace safety
        draft.resources.safetyTrue = clamp(draft.resources.safetyTrue - 1.5, 0, 100);
        draft.news.unshift({ turn: draft.turn, text: `Focused research initiative pushes capability forward (+${gain.toFixed(1)}).`, kind: 'flavor' });
      });
    }

    // ---- funding ----
    case 'FUNDING_ROUND': {
      const round = FUNDING.rounds.find((r) => r.id === action.roundId);
      if (!round) return state;
      if ((state.flags.fundingUsed || []).includes(round.id)) return state;
      const passives = new Set(state.passives);
      if (state.resources.trust < round.trustReq && !passives.has('easyFunding')) return state;
      const mult = passives.has('easyFunding') ? FUNDING.hypeFounderBonus : 1;
      const cash = Math.round(round.cash * mult);
      const trustHit = round.dilution === 'large' ? 4 : round.dilution === 'medium' ? 2 : 1;
      return {
        ...state,
        resources: {
          ...state.resources,
          cash: state.resources.cash + cash,
          trust: clamp(state.resources.trust - trustHit, 0, 100),
        },
        flags: { ...state.flags, fundingUsed: [...(state.flags.fundingUsed || []), round.id] },
        news: [{ turn: state.turn, text: `Closed ${round.label}: +$${cash}M raised.`, kind: 'flavor' }, ...state.news],
      };
    }

    // ---- poach a rival's talent ----
    case 'POACH_RIVAL': {
      const cost = 18;
      if (state.resources.cash < cost) return state;
      return withRng(state, (draft, rng) => {
        draft.resources.cash -= cost;
        draft.resources.trust = clamp(draft.resources.trust - 3, 0, 100);
        if (rng.chance(0.6)) {
          draft.resources.capability = clamp(draft.resources.capability + rng.float(1, 3), 0, 100);
          const r = rng.pick(draft.rivals.filter((x) => x.alive)) || draft.rivals[0];
          if (r) r.capability = clamp(r.capability - 2, 0, 100);
          draft.news.unshift({ turn: draft.turn, text: `You poach a senior researcher from ${r ? r.name : 'a rival'}. Capability up; some side-eye from the press.`, kind: 'staff' });
        } else {
          draft.news.unshift({ turn: draft.turn, text: `Your poaching attempt fails — the target re-ups with their lab. Awkward.`, kind: 'staff' });
        }
      });
    }

    // ---- phase transitions ----
    case 'PROCEED_TO_EVENTS': {
      if (state.turnPhase !== 'plan') return state;
      return withRng(state, (draft, rng) => {
        const drawn = drawEvents(draft, rng);
        draft.deck.current = drawn.map((e) => ({ id: e.id, resolved: false, chosenIndex: null }));
        draft.deck.drawnIds = [...draft.deck.drawnIds, ...drawn.map((e) => e.id)];
        draft.turnPhase = 'events';
        if (drawn.length === 0) {
          draft.news.unshift({ turn: draft.turn, text: 'A quiet quarter. No major events.', kind: 'flavor' });
        }
      });
    }

    case 'RESOLVE_EVENT': {
      const card = state.deck.current.find((c) => c.id === action.eventId && !c.resolved);
      if (!card) return state;
      const evt = getEvent(action.eventId);
      const choice = evt.choices[action.choiceIndex];
      if (!choice) return state;
      return withRng(state, (draft, rng) => {
        const log = [];
        applyEffects(draft, choice.effects, rng, log, { harshness: harshnessOf(draft) });
        const c = draft.deck.current.find((x) => x.id === action.eventId);
        c.resolved = true;
        c.chosenIndex = action.choiceIndex;
        c.resultText = choice.result;
        // attach to debug log
        draft.log = draft.log.concat([{ turn: draft.turn, entries: [{ type: 'eventChoice', msg: `Event "${evt.title}" -> "${choice.label}"`, data: choice.effects }, ...log] }]);
      });
    }

    case 'END_TURN': {
      if (state.gameOver) return state;
      // must resolve all drawn events first
      if (state.turnPhase === 'events' && state.deck.current.some((c) => !c.resolved)) return state;
      const { state: next } = resolveTurn(state);
      if (next.gameOver) {
        next.summary = computeSummary(next);
      }
      return next;
    }

    // ---- DEBUG (all go through reducer) ----
    case 'DEBUG_TOGGLE':
      return { ...state, debug: { ...state.debug, open: action.open ?? !state.debug.open } };

    case 'DEBUG_SET_FLAG':
      return { ...state, debug: { ...state.debug, [action.key]: action.value } };

    case 'DEBUG_SET_RESOURCE':
      return {
        ...state,
        resources: { ...state.resources, [action.key]: action.value },
      };

    case 'DEBUG_SET_STRIKES':
      return { ...state, ledger: { ...state.ledger, strikes: action.value } };

    case 'DEBUG_FORCE_EVENT': {
      const evt = getEvent(action.eventId);
      if (!evt) return state;
      if (state.turnPhase !== 'events') {
        return {
          ...state,
          turnPhase: 'events',
          deck: {
            ...state.deck,
            current: [{ id: evt.id, resolved: false, chosenIndex: null }],
            drawnIds: state.deck.drawnIds.includes(evt.id) ? state.deck.drawnIds : [...state.deck.drawnIds, evt.id],
          },
        };
      }
      return {
        ...state,
        deck: {
          ...state.deck,
          current: [...state.deck.current, { id: evt.id, resolved: false, chosenIndex: null }],
          drawnIds: state.deck.drawnIds.includes(evt.id) ? state.deck.drawnIds : [...state.deck.drawnIds, evt.id],
        },
      };
    }

    case 'DEBUG_TRIGGER_INCIDENT': {
      // run just the incident sub-step manually for testing
      return withRng(state, (draft, rng) => {
        const mods = getMods(draft);
        const sevRoll = rng.next();
        const preventRoll = rng.next();
        // force an incident regardless of chance
        const prevented = preventRoll < Math.min(0.92, draft.resources.safetyTrue / 110 + (mods.preventBonus ?? 0));
        if (prevented) {
          draft.ledger.incidentsPrevented.push({ turn: draft.turn, reason: 'debug-forced (prevented)' });
          draft.news.unshift({ turn: draft.turn, text: '[debug] An incident was prevented by your safety team.', kind: 'incident' });
        } else {
          const sev = sevRoll > 0.45 ? 'minor' : 'major';
          draft.ledger.incidentsCaused.push({ turn: draft.turn, severity: sev });
          if (sev === 'major') draft.ledger.strikes += 1;
          draft.resources.trust = clamp(draft.resources.trust - (sev === 'major' ? 15 : 6), 0, 100);
          draft.news.unshift({ turn: draft.turn, text: `[debug] Forced ${sev} incident.`, kind: 'incident' });
        }
      });
    }

    case 'DEBUG_REROLL_MARKET':
      return withRng(state, (draft, rng) => {
        const passives = new Set(draft.passives);
        draft.hiringMarket = rollHiringMarket(rng, STAFF.marketVisible, draft.staff.map((s) => s.id), passives);
      });

    case 'DEBUG_SKIP_TURNS': {
      let cur = state;
      const n = action.n || 1;
      for (let i = 0; i < n; i++) {
        if (cur.gameOver) break;
        if (cur.turnPhase === 'plan') cur = gameReducer(cur, { type: 'PROCEED_TO_EVENTS' });
        // auto-resolve all events with choice 0
        for (const c of cur.deck.current.filter((x) => !x.resolved)) {
          cur = gameReducer(cur, { type: 'RESOLVE_EVENT', eventId: c.id, choiceIndex: 0 });
        }
        cur = gameReducer(cur, { type: 'END_TURN' });
      }
      return cur;
    }

    case 'DEBUG_JUMP_SCORE': {
      const next = structuredClone(state);
      next.gameOver = next.gameOver || { reason: 'completed' };
      next.phase = 'gameover';
      next.summary = computeSummary(next);
      return next;
    }

    case 'LOAD_STATE':
      return action.state;

    default:
      return state;
  }
}

export { EVENTS, REGULATION };
