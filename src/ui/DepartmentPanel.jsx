import React from 'react';
import { departmentLead } from '../engine/mods.js';
import { totalDeptSpend } from '../engine/formulas.js';

const DEPTS = [
  { key: 'research', label: 'Research', icon: '🔬', desc: 'Raises Capability' },
  { key: 'safety', label: 'Safety', icon: '🦺', desc: 'Raises true Safety; Evals narrow the range' },
  { key: 'product', label: 'Product/Eng', icon: '🛠️', desc: 'Turns Capability into Revenue' },
  { key: 'marketing', label: 'Marketing', icon: '📣', desc: 'Revenue multiplier & share' },
  { key: 'policy', label: 'Policy/Legal', icon: '⚖️', desc: 'Cuts regulatory damage' },
];

export default function DepartmentPanel({ state, dispatch }) {
  const editable = state.turnPhase === 'plan' && !state.gameOver;
  const total = totalDeptSpend(state);
  const salaries = state.staff.filter((s) => s.hired).reduce((a, s) => a + s.salary, 0);

  return (
    <div className="panel">
      <h3>Quarterly Budget</h3>
      {DEPTS.map((d) => {
        const lead = departmentLead(state, d.key);
        const amt = state.departments[d.key];
        return (
          <div className="dept" key={d.key}>
            <div className="dept-head">
              <span className="name">{d.icon} {d.label}</span>
              <span className="amt">${amt}M</span>
            </div>
            <div className="lead">
              {lead ? `Lead: ${lead.name} (skill ${lead.skill})` : <span className="muted">No lead — {d.desc}</span>}
            </div>
            <input
              type="range" min="0" max="50" value={amt} disabled={!editable}
              onChange={(e) => dispatch({ type: 'SET_DEPARTMENT', dept: d.key, value: +e.target.value })}
            />
            {d.key === 'safety' && (
              <div style={{ marginTop: 4 }}>
                <div className="lead">
                  Evaluations / red-teaming: <b>${Math.round(amt * state.evalFraction)}M</b> ({Math.round(state.evalFraction * 100)}% of safety) — narrows the range
                </div>
                <input
                  type="range" min="0" max="100" value={Math.round(state.evalFraction * 100)} disabled={!editable}
                  onChange={(e) => dispatch({ type: 'SET_EVAL_FRACTION', value: +e.target.value / 100 })}
                />
              </div>
            )}
          </div>
        );
      })}
      <div className="budget-summary">
        <span>Dept spend: <b>${total}M</b></span>
        <span>Salaries: <b>${salaries}M</b></span>
      </div>
      <div className="budget-summary" style={{ borderTop: 'none', paddingTop: 0 }}>
        <span className="muted">Est. quarterly outlay</span>
        <span className={state.resources.cash < total + salaries ? 'bad' : ''}>~${total + salaries}M</span>
      </div>
    </div>
  );
}
