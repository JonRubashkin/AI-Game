// glossary.js — in-game Help/Glossary content. Explains mechanics + real-world concepts.

export const GLOSSARY = [
  {
    term: 'Compute',
    body:
      'The processing power (GPUs/TPUs) used to train and serve models. In the real industry it is scarce, expensive, and subject to export controls. Here it gates research speed and product capacity, and its price swings with the market.',
  },
  {
    term: 'Capability',
    body:
      'A rough measure of how good your model is. Grows from research spend × talent × compute, with diminishing returns and occasional breakthroughs (a nod to scaling laws — predictable gains from more compute/data, punctuated by surprises).',
  },
  {
    term: 'True Safety vs. the Confidence Interval',
    body:
      'Your real safety level is hidden. You only see an estimated RANGE. Spending on Evaluations / red-teaming narrows that range toward the truth (and red-teaming nudges true safety up a little). This mirrors reality: nobody knows exactly how safe a model is — you can only measure and reduce your uncertainty.',
  },
  {
    term: 'Red-teaming',
    body:
      'Deliberately attacking your own model to find failures (jailbreaks, harmful outputs) before users do. In the game it narrows your safety interval and catches incidents that would otherwise fire — some of which you never even see.',
  },
  {
    term: 'Alignment',
    body:
      'The open problem of making a model reliably do what its designers intend, especially as it grows more capable. The core tension of the game: capability can outrun safety, and the gap is where incidents live.',
  },
  {
    term: 'Incidents',
    body:
      'Things going wrong in deployment. Chance rises with capability and falls with true safety and exposure. Minor incidents bruise trust; major ones add a regulatory strike; a catastrophic one (only possible at high capability + low safety) ends your run.',
  },
  {
    term: 'Race Dynamics',
    body:
      'When rivals ship fast, the pressure to cut corners rises for everyone. Many event choices pit speed/profit against care/trust — there is rarely a strictly dominant option, which is the point.',
  },
  {
    term: 'Regulatory Strikes',
    body:
      'Serious violations and major incidents draw the regulator’s attention. Three strikes and you are shut down. The Policy/Legal department mitigates damage and can let you help shape the rules.',
  },
  {
    term: 'Trust / Reputation',
    body:
      'How much the public, customers, and regulators believe in you. Multiplies revenue, cools regulator hostility, and eases recruitment. Slow to build, fast to lose.',
  },
  {
    term: 'Open Weights',
    body:
      'Releasing a model’s parameters publicly so anyone can run or modify it. Democratizing but hard to recall — the real debate the Commons Collective embodies, and a recurring source of market-crashing events.',
  },
  {
    term: 'Ideology Spread',
    body:
      'Your staff range from accelerationist (-5) to cautious (+5). A wide spread risks internal conflict — resignations and leaks. Your founder archetype shifts who you attract.',
  },
  {
    term: 'Final Score',
    body:
      'Company Value × Safety Multiplier. You cannot win on raw value alone: a low-safety empire is heavily discounted, and prevented incidents (the safety work nobody saw) give a real bonus.',
  },
];
