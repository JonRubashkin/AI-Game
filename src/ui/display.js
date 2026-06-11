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
