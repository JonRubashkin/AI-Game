// archetypes.js — founder presets + perk/drawback lists for custom founders.
// Each archetype declares starting-resource deltas, a passive bonus tag, and a drawback tag.
// Engine reads the `mods` object and the `passives` array of tags it knows how to apply.

export const ARCHETYPES = [
  {
    id: 'chen',
    name: 'Dr. Mira Chen',
    title: 'The Cautious Scientist',
    company: 'Aletheia AI',
    emoji: '🔬',
    blurb:
      'A meticulous researcher who left academia convinced that capability without safety is malpractice. Slow and careful — but trusted.',
    mods: {
      cash: -25,
      safetyTrue: +15,
      trust: +12,
      capability: +4,
    },
    passives: ['researchEfficiency', 'marketingWeak'], // marketing 20% less effective
    drawback: 'Lower starting cash; Marketing is 20% less effective.',
    bonus: 'Higher Safety & Research efficiency; strong starting Trust.',
  },
  {
    id: 'jax',
    name: 'Jax Calloway',
    title: 'The Hype Founder',
    company: 'Velocity Intelligence',
    emoji: '🚀',
    blurb:
      'Raised a fortune off a keynote and a smile. Moves fast, breaks things, apologizes never. Investors love him; his safety lead does not.',
    mods: {
      cash: +100,
      trust: -5,
    },
    passives: ['easyFunding', 'safetyDrift', 'repelCautious'],
    drawback: 'True Safety drifts down each turn unless actively funded; cautious staff resist recruitment.',
    bonus: 'Double starting Cash; funding rounds are easier.',
  },
  {
    id: 'okafor',
    name: 'Sam Okafor',
    title: 'The Big-Tech Defector',
    company: 'Northstar Labs',
    emoji: '🛰️',
    blurb:
      'Walked out of a trillion-dollar lab with a vision and a non-compete fight. Brought one brilliant colleague along. The old employer has not forgotten.',
    mods: {
      cash: -35,
      compute: +20,
    },
    passives: ['eliteHire', 'cheapCompute', 'nemesisRival'],
    drawback: 'Smaller starting Cash; a rival ("their old employer") repeatedly targets your staff.',
    bonus: 'Start with one elite hire and a discounted compute contract.',
  },
  {
    id: 'priya',
    name: 'Priya Anand',
    title: 'The Open-Source Idealist',
    company: 'Commons Forge',
    emoji: '🌍',
    blurb:
      'Believes powerful AI must belong to everyone. Gives the weights away, sleeps fine, and somehow keeps the lights on.',
    mods: {
      trust: +18,
      cash: -10,
    },
    passives: ['cheapTalent', 'lowRevenue', 'openSourceImmune'],
    drawback: '30% lower revenue (you give a lot away).',
    bonus: 'High Reputation; cheap recruitment; immune to open-source disruption.',
  },
];

// Custom founder option pools.
export const CUSTOM_PERKS = [
  { id: 'researchEfficiency', label: 'Research Prodigy', desc: 'Research spend is ~20% more effective.' },
  { id: 'easyFunding', label: 'Investor Darling', desc: 'Funding rounds raise more cash.' },
  { id: 'cheapCompute', label: 'Compute Connections', desc: 'Discounted compute prices.' },
  { id: 'cheapTalent', label: 'Magnetic Recruiter', desc: 'Cheaper salaries when hiring.' },
  { id: 'evalMaster', label: 'Measurement Obsessed', desc: 'Evaluations narrow the safety interval faster.' },
  { id: 'trustedVoice', label: 'Trusted Voice', desc: 'Trust decays slower and recovers faster.' },
];

export const CUSTOM_DRAWBACKS = [
  { id: 'marketingWeak', label: 'Awkward on Stage', desc: 'Marketing is 20% less effective.' },
  { id: 'safetyDrift', label: 'Move-Fast Culture', desc: 'True Safety drifts down faster.' },
  { id: 'lowRevenue', label: 'Generous to a Fault', desc: '30% lower revenue.' },
  { id: 'nemesisRival', label: 'Made an Enemy', desc: 'A rival aggressively poaches your staff.' },
  { id: 'thinIce', label: 'Regulatory Spotlight', desc: 'Strikes are easier to incur.' },
  { id: 'repelCautious', label: 'Reputation for Recklessness', desc: 'Cautious staff resist recruitment.' },
];

export function getArchetype(id) {
  return ARCHETYPES.find((a) => a.id === id) || null;
}
