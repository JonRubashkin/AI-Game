// scoring.js — endgame scoring + summary. Pure.

import { SCORING } from '../data/balance.js';
import { pickLegacyTitle } from '../data/legacyTitles.js';

export function computeSummary(state) {
  const res = state.resources;
  const led = state.ledger;
  const cv = SCORING.companyValue;
  const sm = SCORING.safetyMultiplier;

  const playerShare = state.playerShare ?? 10;
  const companyValue = Math.max(
    0,
    Math.round(
      (led.revenueTotal / state.turn) * cv.revenueWeight +
        playerShare * cv.marketShareWeight +
        res.capability * cv.capabilityWeight +
        Math.max(0, res.cash) * cv.cashWeight
    )
  );

  const incidentsCaused = led.incidentsCaused.length;
  const incidentsPrevented = led.incidentsPrevented.length;

  let safetyMultiplier =
    sm.base +
    res.safetyTrue * sm.trueSafetyWeight +
    incidentsPrevented * sm.preventedBonus -
    incidentsCaused * sm.causedPenalty +
    res.trust * sm.trustWeight;
  safetyMultiplier = Math.max(sm.min, Math.min(sm.max, safetyMultiplier));

  const endReason = state.gameOver ? state.gameOver.reason : 'completed';
  // catastrophic / shutdown / bankruptcy slash the multiplier hard
  let penalizedMult = safetyMultiplier;
  if (endReason === 'catastrophe') penalizedMult = sm.min;
  else if (endReason === 'shutdown') penalizedMult = Math.min(penalizedMult, 0.4);
  else if (endReason === 'bankruptcy') penalizedMult = Math.min(penalizedMult, 0.5);

  const finalScore = Math.round(companyValue * penalizedMult);

  // rank by company-strength among living entities
  const playerStrength = companyValue;
  const rivalStrengths = state.rivals
    .filter((r) => r.alive)
    .map((r) => r.share * 12 + r.capability * 4);
  const rank = 1 + rivalStrengths.filter((s) => s > playerStrength).length;

  const summary = {
    finalScore,
    companyValue,
    safetyMultiplier: Number(penalizedMult.toFixed(2)),
    rawSafetyMultiplier: Number(safetyMultiplier.toFixed(2)),
    endReason,
    trueSafety: Math.round(res.safetyTrue),
    finalTrust: Math.round(res.trust),
    peakCapability: Math.round(led.peakCapability),
    revenueTotal: Math.round(led.revenueTotal),
    incidentsCaused,
    incidentsPrevented,
    incidentsPreventedByLuck: incidentsPrevented,
    strikes: led.strikes,
    staffRetained: state.staff.filter((s) => s.hired).length,
    cash: Math.round(res.cash),
    rank,
    playerShare: Number(playerShare.toFixed(1)),
    turnsSurvived: state.turn,
  };

  const legacy = pickLegacyTitle(summary);
  summary.legacy = legacy;
  return summary;
}
