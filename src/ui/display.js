// display.js — formatting helpers that respect the chosen Display Mode + Safety Display Mode.
import { safetyInterval } from '../engine/formulas.js';

// Narrative label buckets.
function bucket(value, labels, max = 100) {
  const idx = Math.min(labels.length - 1, Math.max(0, Math.floor((value / max) * labels.length)));
  return labels[idx];
}

export const NARRATIVE = {
  cash: (v) => (v < 0 ? 'in the red' : v < 30 ? 'tight' : v < 80 ? 'comfortable' : v < 200 ? 'flush' : 'awash in capital'),
  compute: (v) => (v < 15 ? 'starved' : v < 35 ? 'adequate' : v < 70 ? 'well-supplied' : 'abundant'),
  capability: (v) => bucket(v, ['nascent', 'developing', 'capable', 'advanced', 'frontier']),
  trust: (v) => bucket(v, ['distrusted', 'doubted', 'accepted', 'respected', 'revered']),
};

// Format a top-bar resource per display mode.
// kind: 'cash'|'compute'|'capability'|'trust'
export function fmtResource(kind, value, displayMode) {
  const rounded = Math.round(value);
  if (displayMode === 'stats') {
    return kind === 'cash' ? `$${rounded}M` : kind === 'compute' ? `${rounded}u` : `${rounded}`;
  }
  if (displayMode === 'narrative') {
    return NARRATIVE[kind] ? NARRATIVE[kind](value) : `${rounded}`;
  }
  // hybrid: top-bar numbers visible
  return kind === 'cash' ? `$${rounded}M` : kind === 'compute' ? `${rounded}u` : `${rounded}`;
}

// Safety display respects BOTH the display mode and the dedicated safety mode.
export function fmtSafety(state) {
  const { safetyMode } = state.settings;
  const trueVal = Math.round(state.resources.safetyTrue);
  const [lo, hi] = safetyInterval(state.resources.safetyTrue, state.resources.safetyIntervalHalf);

  if (safetyMode === 'true') {
    return { main: `${trueVal}`, sub: 'true value', showTrue: true };
  }
  if (safetyMode === 'both') {
    return { main: `${lo}–${hi}`, sub: `true: ${trueVal} (learning mode)`, showTrue: true };
  }
  // hidden (default)
  return { main: `${lo}–${hi}`, sub: 'estimated range', showTrue: false };
}

// --- financial estimates (top bar) ---------------------------------------
function moneyWord(v) {
  const x = Math.abs(v);
  return x < 10 ? 'minimal' : x < 30 ? 'modest' : x < 70 ? 'solid' : x < 140 ? 'strong' : 'major';
}

// Expected revenue shown as a ±5% band around the forecast (the real result lands inside it).
export function fmtRevenueEstimate(forecast, displayMode) {
  if (displayMode === 'narrative') return `${moneyWord(forecast)} inflow`;
  const lo = Math.round(forecast * 0.95);
  const hi = Math.round(forecast * 1.05);
  return `$${lo}–${hi}M`;
}

export function fmtCostEstimate(total, displayMode) {
  if (displayMode === 'narrative') return `${moneyWord(total)} outlay`;
  return `$${Math.round(total)}M`;
}

export function netWord(net) {
  return net > 1 ? 'profitable' : net < -1 ? 'burning cash' : 'break-even';
}

// color class by metric value (green/amber/red)
export function metricColor(value, { good = 66, ok = 40 } = {}) {
  if (value >= good) return 'good';
  if (value >= ok) return 'ok';
  return 'bad';
}

export function quarterLabel(turn) {
  const q = ((turn - 1) % 4) + 1;
  const y = Math.ceil(turn / 4);
  return `Q${q} — Year ${y}`;
}
