// staff.js — pool of hireable candidates + trait definitions.
// The hiring market draws from this pool (with some randomized stat jitter) via the RNG.

// Traits create REAL trade-offs. Engine reads trait.effects tags.
export const TRAITS = {
  brilliantReckless: {
    id: 'brilliantReckless',
    label: 'Brilliant but Reckless',
    desc: '+30% research output, but raises incident risk.',
    effects: { researchMult: 1.3, incidentRisk: +0.05 },
  },
  safetyHardliner: {
    id: 'safetyHardliner',
    label: 'Safety Hardliner',
    desc: '+Safety output; releases are slower (revenue hit) but never trigger launch-day incidents.',
    effects: { safetyMult: 1.35, releaseSpeed: 0.8, noLaunchIncidents: true },
  },
  hypeMachine: {
    id: 'hypeMachine',
    label: 'Hype Machine',
    desc: '+Marketing; occasionally triggers overpromise events that gamble Trust.',
    effects: { marketingMult: 1.4, overpromiseRisk: +0.12 },
  },
  belovedMentor: {
    id: 'belovedMentor',
    label: 'Beloved Mentor',
    desc: '+Recruitment; reduces poaching odds across the whole team.',
    effects: { recruitBonus: +0.15, teamPoachReduction: 0.5 },
  },
  steadyHand: {
    id: 'steadyHand',
    label: 'Steady Hand',
    desc: 'Reliable across the board; slightly reduces incident risk.',
    effects: { incidentRisk: -0.03, uptime: +0.1 },
  },
  growthHacker: {
    id: 'growthHacker',
    label: 'Growth Hacker',
    desc: '+Revenue conversion, but burns Trust if capability is low.',
    effects: { productMult: 1.25, overhypeRisk: +0.08 },
  },
  policyWonk: {
    id: 'policyWonk',
    label: 'Policy Wonk',
    desc: '+Policy effectiveness; better outcomes on regulation events.',
    effects: { policyMult: 1.4 },
  },
  redTeamAce: {
    id: 'redTeamAce',
    label: 'Red-Team Ace',
    desc: 'Evaluations narrow the safety interval much faster and catch more would-be incidents.',
    effects: { evalMult: 1.6, preventBonus: +0.1 },
  },
};

// Role fit options align with the 5 departments.
export const ROLES = ['Research', 'Safety', 'Product', 'Marketing', 'Policy'];

// ~15 defined candidates. The market jitters skill/salary slightly per draw.
export const STAFF_POOL = [
  { id: 's1', name: 'Dr. Lena Yoshida', emoji: '👩‍🔬', role: 'Research', skill: 9, salary: 12, ideology: -3, trait: 'brilliantReckless', bio: 'Published three landmark papers and one retraction. Worth it.' },
  { id: 's2', name: 'Marcus Bell', emoji: '🧑‍💻', role: 'Research', skill: 7, salary: 8, ideology: -1, trait: 'steadyHand', bio: 'Never the fastest, never the one who breaks prod at 2am.' },
  { id: 's3', name: 'Dr. Amara Osei', emoji: '🦺', role: 'Safety', skill: 8, salary: 10, ideology: +4, trait: 'safetyHardliner', bio: 'Has a slide deck titled "Why We Are Not Shipping That."' },
  { id: 's4', name: 'Tobias Frank', emoji: '🔴', role: 'Safety', skill: 7, salary: 9, ideology: +3, trait: 'redTeamAce', bio: 'Broke your model in eleven ways before lunch.' },
  { id: 's5', name: 'Priyanka Rao', emoji: '📣', role: 'Marketing', skill: 8, salary: 9, ideology: -2, trait: 'hypeMachine', bio: 'Coined a tagline so good legal made her stop saying it.' },
  { id: 's6', name: 'Devon Park', emoji: '📈', role: 'Marketing', skill: 6, salary: 6, ideology: 0, trait: 'growthHacker', bio: 'Lives in the funnel. Dreams in conversion rates.' },
  { id: 's7', name: 'Grace Liu', emoji: '🛠️', role: 'Product', skill: 8, salary: 10, ideology: -1, trait: 'steadyHand', bio: 'Ships on Tuesdays. Always Tuesdays. Do not ask why.' },
  { id: 's8', name: 'Ravi Nair', emoji: '⚙️', role: 'Product', skill: 7, salary: 8, ideology: +1, trait: 'growthHacker', bio: 'Believes every feature is an A/B test waiting to happen.' },
  { id: 's9', name: 'Senator-in-exile Hong', emoji: '⚖️', role: 'Policy', skill: 9, salary: 11, ideology: +2, trait: 'policyWonk', bio: 'Knows which committee chair takes which meeting. Priceless.' },
  { id: 's10', name: 'Fatima Z.', emoji: '📜', role: 'Policy', skill: 6, salary: 6, ideology: +1, trait: 'policyWonk', bio: 'Reads proposed regulation for fun. Genuinely.' },
  { id: 's11', name: 'Dr. Erik Solberg', emoji: '🧠', role: 'Research', skill: 10, salary: 16, ideology: -4, trait: 'brilliantReckless', bio: 'Possibly a genius. Definitely a liability. The compute bill agrees.' },
  { id: 's12', name: 'Nadia Petrova', emoji: '🤝', role: 'Research', skill: 7, salary: 9, ideology: +1, trait: 'belovedMentor', bio: 'Half the team followed her here. The other half wishes they had.' },
  { id: 's13', name: 'Jamal Carter', emoji: '🧪', role: 'Safety', skill: 6, salary: 7, ideology: +2, trait: 'redTeamAce', bio: 'Maintains a wall of jailbreaks like other people keep a wine cellar.' },
  { id: 's14', name: 'Sofia Reyes', emoji: '🎤', role: 'Marketing', skill: 7, salary: 8, ideology: -2, trait: 'hypeMachine', bio: 'Went viral once on purpose, twice by accident.' },
  { id: 's15', name: 'Old Man Whittaker', emoji: '🧓', role: 'Product', skill: 8, salary: 9, ideology: 0, trait: 'belovedMentor', bio: 'Shipped software before some of your staff were born. Calm under fire.' },
];

export function getTrait(id) {
  return TRAITS[id] || null;
}

export function traitEffect(staff, key, fallback) {
  if (!staff) return fallback;
  const t = TRAITS[staff.trait];
  if (!t || !(key in t.effects)) return fallback;
  return t.effects[key];
}
