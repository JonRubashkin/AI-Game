import React from 'react';
import { getEvent } from '../data/events.js';

// Brief human-readable hint of an effect set (kept vague for hidden safety).
function effectHint(effects, safetyHidden) {
  const parts = [];
  const sign = (n) => (n >= 0 ? `+${n}` : `${n}`);
  if (effects.cash) parts.push(`${sign(effects.cash)} cash`);
  if (effects.compute) parts.push(`${sign(effects.compute)} compute`);
  if (effects.capability) parts.push(`${sign(effects.capability)} capability`);
  if (effects.trust) parts.push(`${sign(effects.trust)} trust`);
  if (effects.strike) parts.push(`${sign(effects.strike)} strike`);
  if (effects.revenueMultThisTurn) parts.push(effects.revenueMultThisTurn > 1 ? 'revenue ↑' : 'revenue ↓');
  if (effects.safetyTrue && !safetyHidden) parts.push(`${sign(effects.safetyTrue)} safety`);
  if (effects.safetyInterval) parts.push(effects.safetyInterval < 0 ? 'clearer safety read' : 'fuzzier safety read');
  if (effects.delayed) parts.push('…and consequences later');
  if (effects.marketCrash) parts.push('market shock');
  return parts.join(', ');
}

export default function EventCard({ card, state, dispatch }) {
  const evt = getEvent(card.id);
  if (!evt) return null;
  const safetyHidden = state.settings.safetyMode === 'hidden';
  const resolved = card.resolved;

  return (
    <div className={'event-card' + (evt.rare ? ' rare' : '')}>
      <div className="tag">{evt.rare ? '✦ Rare Event' : evt.tag || 'Event'}</div>
      <h2>{evt.title}</h2>
      <div className="flavor">{evt.flavor}</div>

      {evt.choices.map((choice, i) => {
        const chosen = card.chosenIndex === i;
        const hint = effectHint(choice.effects, safetyHidden);
        return (
          <button
            key={i}
            className={'choice' + (resolved ? (chosen ? ' chosen' : ' dimmed') : '')}
            disabled={resolved}
            onClick={() => dispatch({ type: 'RESOLVE_EVENT', eventId: card.id, choiceIndex: i })}
          >
            <b>{choice.label}</b>
            {hint && <span className="muted" style={{ display: 'block', fontSize: 11, marginTop: 2 }}>{hint}</span>}
          </button>
        );
      })}

      {resolved && card.resultText && <div className="result-box">{card.resultText}</div>}
      {resolved && (
        <div className="footnote">
          <b>Based on reality:</b> {evt.footnote}
        </div>
      )}
    </div>
  );
}
