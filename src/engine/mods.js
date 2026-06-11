// mods.js — derive the active modifier bundle from passives + staff leads + traits + difficulty.
// Pure: same state -> same mods. Consumed by formulas and resolution.

import { TRAITS } from '../data/staff.js';
import { DIFFICULTY } from '../data/balance.js';

const DEPTS = ['research', 'safety', 'product', 'marketing', 'policy'];

// The lead of a department = highest-skill hired staff whose role matches it.
export function departmentLead(state, dept) {
  const roleName = dept.charAt(0).toUpperCase() + dept.slice(1);
  const candidates = state.staff.filter((s) => s.hired && s.role === roleName);
  if (candidates.length === 0) return null;
  return candidates.reduce((best, s) => (s.skill > best.skill ? s : best), candidates[0]);
}

export function getMods(state) {
  const passives = new Set(state.passives || []);
  const diff = DIFFICULTY[state.settings.difficulty] || DIFFICULTY.normal;

  const leads = {};
  for (const d of DEPTS) leads[d] = departmentLead(state, d);

  const traitOf = (lead, key, fallback) => {
    if (!lead) return fallback;
    const t = TRAITS[lead.trait];
    if (!t || !(key in t.effects)) return fallback;
    return t.effects[key];
  };

  // team-wide incident risk = sum of trait incidentRisk across ALL hired staff
  let incidentRisk = 0;
  let teamPoachReduction = 1;
  let recruitBonus = 0;
  for (const s of state.staff.filter((x) => x.hired)) {
    const t = TRAITS[s.trait];
    if (!t) continue;
    if (t.effects.incidentRisk) incidentRisk += t.effects.incidentRisk;
    if (t.effects.teamPoachReduction) teamPoachReduction *= t.effects.teamPoachReduction;
    if (t.effects.recruitBonus) recruitBonus += t.effects.recruitBonus;
  }

  return {
    leads,
    // research
    researchLeadSkill: leads.research ? leads.research.skill : 4,
    researchMult: traitOf(leads.research, 'researchMult', 1),
    researchEfficiency: passives.has('researchEfficiency'),
    // safety
    safetyMult: traitOf(leads.safety, 'safetyMult', 1),
    evalMult:
      traitOf(leads.safety, 'evalMult', 1) * (passives.has('evalMaster') ? 1.4 : 1),
    preventBonus: traitOf(leads.safety, 'preventBonus', 0),
    safetyDrift: passives.has('safetyDrift'),
    // product / marketing
    productMult: traitOf(leads.product, 'productMult', 1),
    marketingMult: traitOf(leads.marketing, 'marketingMult', 1),
    marketingWeak: passives.has('marketingWeak'),
    releaseSpeed: traitOf(leads.product, 'releaseSpeed', 1),
    // policy
    policyMult: traitOf(leads.policy, 'policyMult', 1),
    // revenue passives
    lowRevenue: passives.has('lowRevenue'),
    // incidents
    incidentRisk,
    incidentMult: diff.incidentMult * (state.debug?.noIncidents ? 0 : 1),
    noLaunchIncidents: !!(leads.product && TRAITS[leads.product.trait]?.effects.noLaunchIncidents) ||
      !!(leads.safety && TRAITS[leads.safety.trait]?.effects.noLaunchIncidents),
    // staff
    teamPoachReduction,
    recruitBonus,
    // founder passives
    easyFunding: passives.has('easyFunding'),
    cheapCompute: passives.has('cheapCompute'),
    cheapTalent: passives.has('cheapTalent'),
    nemesisRival: passives.has('nemesisRival'),
    openSourceImmune: passives.has('openSourceImmune'),
    trustedVoice: passives.has('trustedVoice'),
    repelCautious: passives.has('repelCautious'),
    // difficulty
    eventHarshness: diff.eventHarshness,
    rivalAggression: diff.rivalAggression,
  };
}
