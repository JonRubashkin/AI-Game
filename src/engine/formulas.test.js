import { describe, it, expect } from 'vitest';
import {
  computeRevenue,
  revenueFactors,
  capabilityGain,
  safetyUpdate,
  safetyInterval,
  incidentChance,
  classifyIncident,
  incidentPrevented,
} from './formulas.js';

function baseState(overrides = {}) {
  const { resources, departments, ...rest } = overrides;
  return {
    resources: {
      cash: 100,
      compute: 20,
      capability: 30,
      trust: 50,
      safetyTrue: 60,
      safetyIntervalHalf: 20,
      ...(resources || {}),
    },
    departments: { research: 12, safety: 8, product: 12, marketing: 6, policy: 4, ...(departments || {}) },
    evalFraction: 0.4,
    marketConditions: 1,
    activeProducts: 1,
    ...rest,
  };
}

describe('revenue formula', () => {
  it('is non-negative and scales up with capability', () => {
    const low = computeRevenue(baseState({ resources: { capability: 10 } }));
    const high = computeRevenue(baseState({ resources: { capability: 70 } }));
    expect(low.revenue).toBeGreaterThanOrEqual(0);
    expect(high.revenue).toBeGreaterThan(low.revenue);
  });

  it('trust above pivot increases revenue, below decreases it', () => {
    const lowTrust = computeRevenue(baseState({ resources: { trust: 20 } }));
    const highTrust = computeRevenue(baseState({ resources: { trust: 90 } }));
    expect(highTrust.revenue).toBeGreaterThan(lowTrust.revenue);
  });

  it('revenueMult modifier multiplies output', () => {
    const normal = computeRevenue(baseState());
    const boosted = computeRevenue(baseState(), { revenueMult: 1.5 });
    expect(boosted.revenue).toBeCloseTo(normal.revenue * 1.5, 4);
  });

  it('lowRevenue passive (open-source) reduces revenue', () => {
    const normal = computeRevenue(baseState());
    const open = computeRevenue(baseState(), { lowRevenue: true });
    expect(open.revenue).toBeLessThan(normal.revenue);
  });

  it('marketingWeak reduces the marketing factor', () => {
    const normal = revenueFactors(baseState());
    const weak = revenueFactors(baseState(), { marketingWeak: true });
    expect(weak.marketingFactor).toBeLessThan(normal.marketingFactor);
  });
});

describe('capability growth', () => {
  it('returns more growth with more research spend', () => {
    const a = capabilityGain(baseState({ departments: { research: 5 } }));
    const b = capabilityGain(baseState({ departments: { research: 25 } }));
    expect(b).toBeGreaterThan(a);
  });

  it('is bounded and never negative', () => {
    const g = capabilityGain(baseState({ resources: { capability: 99, compute: 100 }, departments: { research: 100 } }));
    expect(g).toBeGreaterThanOrEqual(0);
    expect(g).toBeLessThanOrEqual(14);
  });
});

describe('safety update', () => {
  it('eval spend narrows the interval', () => {
    const s = baseState();
    const noEval = safetyUpdate(s, 0);
    const withEval = safetyUpdate(s, 5);
    expect(withEval.intervalHalf).toBeLessThan(noEval.intervalHalf);
  });

  it('safetyDrift passive accelerates decay', () => {
    const normal = safetyUpdate(baseState(), 0, {});
    const drifting = safetyUpdate(baseState(), 0, { safetyDrift: true });
    expect(drifting.trueSafety).toBeLessThan(normal.trueSafety);
  });

  it('interval is centered on true safety and clamped 0..100', () => {
    const [lo, hi] = safetyInterval(95, 20);
    expect(lo).toBeGreaterThanOrEqual(0);
    expect(hi).toBeLessThanOrEqual(100);
    expect(lo).toBeLessThan(hi);
  });
});

describe('incident model', () => {
  it('chance rises with capability and falls with safety', () => {
    const dangerous = incidentChance(baseState({ resources: { capability: 90, safetyTrue: 20 } }));
    const safe = incidentChance(baseState({ resources: { capability: 90, safetyTrue: 95 } }));
    expect(dangerous).toBeGreaterThan(safe);
  });

  it('chance is bounded between 0 and 0.95', () => {
    const p = incidentChance(baseState({ resources: { capability: 100, safetyTrue: 0 }, activeProducts: 10 }));
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(0.95);
  });

  it('catastrophe only possible at high capability AND low safety', () => {
    const safeState = baseState({ resources: { capability: 90, safetyTrue: 80 } });
    expect(classifyIncident(safeState, 0.01).severity).not.toBe('catastrophe');

    const dangerState = baseState({ resources: { capability: 90, safetyTrue: 20 } });
    // a low severity roll in the catastrophe window
    expect(classifyIncident(dangerState, 0.01).severity).toBe('catastrophe');
  });

  it('low capability never yields catastrophe even at low safety', () => {
    const lowCap = baseState({ resources: { capability: 20, safetyTrue: 10 } });
    expect(classifyIncident(lowCap, 0.001).severity).not.toBe('catastrophe');
  });

  it('high true safety prevents more incidents', () => {
    // with a fixed roll of 0.3, high safety prevents but low safety does not
    expect(incidentPrevented(90, 0.3)).toBe(true);
    expect(incidentPrevented(10, 0.3)).toBe(false);
  });
});
