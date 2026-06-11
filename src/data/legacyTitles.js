// legacyTitles.js — endgame legacy title table. Evaluated top-to-bottom; first match wins.
// Each entry has a predicate over the final scoring summary.

export const LEGACY_TITLES = [
  {
    id: 'icarus',
    title: 'Icarus',
    emoji: '🕯️',
    blurb: 'You flew higher than anyone — straight into the sun. The catastrophe will be studied for decades.',
    match: (s) => s.endReason === 'catastrophe',
  },
  {
    id: 'regulatorsExample',
    title: "Regulator's Example",
    emoji: '🚫',
    blurb: 'They shut you down and put your logo on a slide titled "What Not To Do."',
    match: (s) => s.endReason === 'shutdown',
  },
  {
    id: 'forgottenAlsoRan',
    title: 'Forgotten Also-Ran',
    emoji: '🪦',
    blurb: 'The company folded. A footnote in someone else’s success story.',
    match: (s) => s.endReason === 'bankruptcy',
  },
  {
    id: 'responsiblePioneer',
    title: 'Responsible Pioneer',
    emoji: '🏆',
    blurb: 'You proved the dream was possible: powerful, profitable, and genuinely safe. History remembers you well.',
    match: (s) => s.trueSafety >= 65 && s.companyValue >= 220 && s.incidentsCaused <= 2,
  },
  {
    id: 'luckyCowboy',
    title: 'Lucky Cowboy',
    emoji: '🤠',
    blurb: 'Huge numbers, terrifying corners cut. You got away with it. This time. Luck, not skill — and everyone will pretend otherwise.',
    match: (s) => s.companyValue >= 200 && s.trueSafety < 45 && s.incidentsPreventedByLuck >= 1,
  },
  {
    id: 'trustedButTimid',
    title: 'Trusted but Timid',
    emoji: '🐢',
    blurb: 'The safest lab nobody could name. You were right about the risks — and never built much.',
    match: (s) => s.trueSafety >= 65 && s.companyValue < 150,
  },
  {
    id: 'marketLeader',
    title: 'The Frontier Leader',
    emoji: '👑',
    blurb: 'You topped the leaderboard. The crown sits a little uneasily, but it sits.',
    match: (s) => s.rank === 1 && s.companyValue >= 180,
  },
  {
    id: 'survivor',
    title: 'The Survivor',
    emoji: '🧭',
    blurb: 'Six years. Countless crises. You’re still standing, and that counts for more than the league tables admit.',
    match: () => true, // fallback
  },
];

export function pickLegacyTitle(summary) {
  return LEGACY_TITLES.find((t) => t.match(summary)) || LEGACY_TITLES[LEGACY_TITLES.length - 1];
}
