// rivals.js — 4 fictional rival labs. Each is a weighted-random agent archetype.
// Engine simulates them on a simplified metric set each turn.

export const RIVALS = [
  {
    id: 'nimbus',
    name: 'Nimbus Labs',
    emoji: '⛈️',
    archetype: 'reckless',
    blurb: 'Fast capability growth, frequent incidents. Lives by the demo, dies by the demo.',
    start: { capability: 14, trust: 50, safety: 40, share: 22, cash: 120 },
    weights: { research: 0.55, safety: 0.05, product: 0.2, marketing: 0.15, policy: 0.05 },
    shareMult: 1.0, trustTarget: 45,
    capGrowth: 2.7,
    incidentProneness: 1.7,
    poachChance: 0.12,
    scandalChance: 0.14,
    collapseRisk: 0.05,
  },
  {
    id: 'aegis',
    name: 'Aegis Research',
    emoji: '🛡️',
    archetype: 'cautious',
    blurb: 'Slow, deliberate, very high trust. The lab regulators hold up as the good example.',
    start: { capability: 11, trust: 72, safety: 78, share: 18, cash: 100 },
    weights: { research: 0.25, safety: 0.4, product: 0.15, marketing: 0.05, policy: 0.15 },
    shareMult: 1.1, trustTarget: 86,
    capGrowth: 1.7,
    incidentProneness: 0.4,
    poachChance: 0.05,
    scandalChance: 0.03,
    collapseRisk: 0.01,
  },
  {
    id: 'macrohard',
    name: 'Macrohard AI',
    emoji: '🏢',
    archetype: 'biggetech',
    blurb: 'Enormous cash, mediocre focus, aggressive poaching. Wins by attrition and acquisition.',
    start: { capability: 13, trust: 58, safety: 55, share: 30, cash: 400 },
    weights: { research: 0.3, safety: 0.15, product: 0.25, marketing: 0.2, policy: 0.1 },
    shareMult: 2.3, trustTarget: 60,
    capGrowth: 2.3,
    incidentProneness: 0.8,
    poachChance: 0.28,
    scandalChance: 0.07,
    collapseRisk: 0.005,
  },
  {
    id: 'commons',
    name: 'The Commons Collective',
    emoji: '🌐',
    archetype: 'opensource',
    blurb: 'Gives models away. Periodically crashes market prices and erodes everyone’s revenue moat.',
    start: { capability: 12, trust: 64, safety: 50, share: 15, cash: 70 },
    weights: { research: 0.4, safety: 0.2, product: 0.2, marketing: 0.05, policy: 0.15 },
    shareMult: 0.7, trustTarget: 68,
    capGrowth: 2.2,
    incidentProneness: 0.7,
    poachChance: 0.06,
    scandalChance: 0.06,
    collapseRisk: 0.03,
    marketCrashChance: 0.18, // erodes everyone's revenue when it fires
  },
];

export function getRival(id) {
  return RIVALS.find((r) => r.id === id) || null;
}
