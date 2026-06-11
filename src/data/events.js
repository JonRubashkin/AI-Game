// events.js — the event deck (40+ cards, incl. 6+ rare absurd cards).
// Adding a new event requires ONLY a new entry here.
//
// Card shape:
//   id, title, flavor, weight (draw weight), minTurn, maxTurn,
//   rare (bool -> gold styling), tag (for debug/filtering),
//   prereq(state) -> bool  (optional),
//   footnote: "Based on reality" teaching note,
//   choices: [ { label, result, effects } ]
//
// Effect keys understood by the engine (engine/resolve.js -> applyEffects):
//   cash, compute, capability, trust            : numeric deltas
//   safetyTrue                                  : HIDDEN delta to true safety
//   safetyInterval                              : delta to interval half-width (+widen / -narrow)
//   strike                                      : regulatory strikes (+n)
//   revenueMultThisTurn                         : multiply this turn's revenue
//   marketCrash                                 : true -> erodes everyone's revenue this turn
//   computePrice                                : multiply compute market price
//   delayed: [ { turnsAhead, effects, news } ]  : queued future effects (can be hidden)
//   news                                        : string headline pushed to ticker on resolution

const C = (label, result, effects) => ({ label, result, effects: effects || {} });

export const EVENTS = [
  // ---------------------------------------------------------------- standard
  {
    id: 'benchmark_contamination',
    title: 'Benchmark Numbers Look Too Good',
    flavor:
      'Your new model crushes the public benchmarks. A junior researcher quietly notes the test set may have leaked into training data.',
    weight: 10, minTurn: 2, maxTurn: 20, tag: 'research',
    footnote:
      'Based on reality: benchmark contamination — when eval data leaks into training — inflates scores and is a real, hard-to-detect problem in ML.',
    choices: [
      C('Publish the big numbers anyway', 'Marketing runs with it. The capability looks great — until someone checks.', {
        trust: +6, capability: +2, delayed: [{ turnsAhead: 2, effects: { trust: -14 }, news: 'Investigation finds %COMPANY% benchmark scores were inflated by contaminated data.' }],
      }),
      C('Re-run on a clean held-out set first', 'Slower, honest, and your real number is a touch lower — but it holds up.', {
        cash: -4, capability: -1, trust: +3,
      }),
    ],
  },
  {
    id: 'export_controls',
    title: 'New Compute Export Controls',
    flavor: 'Governments restrict sales of the most advanced chips. Your next compute order is suddenly in question.',
    weight: 9, minTurn: 3, maxTurn: 22, tag: 'compute',
    footnote:
      'Based on reality: export controls on advanced AI chips are a major geopolitical lever shaping who can train frontier models.',
    choices: [
      C('Stockpile compute now at a premium', 'You secure supply, but it costs you.', { cash: -22, compute: +18 }),
      C('Lobby for an exemption', 'Policy team goes to work. Mixed results.', { cash: -8, trust: +2, delayed: [{ turnsAhead: 2, effects: { compute: +8 }, news: '%COMPANY% secures a limited compute exemption.' }] }),
      C('Ride it out on current supply', 'Risky. Research may stall if you run short.', { compute: -4 }),
    ],
  },
  {
    id: 'rlhf_breakthrough',
    title: 'A Promising Fine-Tuning Method',
    flavor: 'Your team finds a way to make the model far more helpful and harder to misuse — if you invest the cycles.',
    weight: 8, minTurn: 2, maxTurn: 20, tag: 'research',
    footnote:
      'Based on reality: RLHF (reinforcement learning from human feedback) made models dramatically more usable and was pivotal to modern assistants.',
    choices: [
      C('Pour compute into it', 'A real step forward in both quality and behavior.', { compute: -6, capability: +4, safetyTrue: +5 }),
      C('Ship the cheaper, rougher version', 'Faster to market, a little less polished.', { capability: +2, safetyTrue: -2, trust: -2 }),
    ],
  },
  {
    id: 'race_pressure',
    title: 'A Rival Ships First',
    flavor: 'A competitor launches a flashy model a quarter ahead of your roadmap. Investors are texting. The board wants answers.',
    weight: 10, minTurn: 3, maxTurn: 23, tag: 'race',
    footnote:
      'Based on reality: race dynamics push labs to ship faster than they might prefer, raising pressure to cut safety corners.',
    choices: [
      C('Rush your release to respond', 'You match them on timing. Quality and safety take the hit.', { trust: +4, capability: +1, safetyTrue: -7, revenueMultThisTurn: 1.15 }),
      C('Hold the line on your timeline', 'You look slow this quarter. You sleep fine.', { trust: -5, safetyTrue: +1 }),
      C('Differentiate on trust and safety', 'You make your caution the pitch.', { cash: -6, trust: +8 }),
    ],
  },
  {
    id: 'jailbreak_viral',
    title: 'A Jailbreak Goes Viral',
    flavor: 'Someone posts a clever prompt that makes your model ignore its guardrails. It is trending.',
    weight: 9, minTurn: 4, maxTurn: 24, tag: 'safety',
    prereq: (s) => s.resources.capability > 30,
    footnote:
      'Based on reality: jailbreaks — prompts that bypass safety training — are a persistent cat-and-mouse problem for every deployed model.',
    choices: [
      C('Emergency patch and red-team sprint', 'Costly, but you close the hole and learn from it.', { cash: -10, safetyTrue: +6, safetyInterval: -4, trust: -2 }),
      C('Quietly hotfix and say nothing', 'Cheaper. If anyone notices the silence, it’ll cost you.', { cash: -3, safetyTrue: +2, delayed: [{ turnsAhead: 2, effects: { trust: -8 }, news: 'Researchers criticize %COMPANY% for downplaying a safety flaw.' }] }),
      C('Spin it as a feature for researchers', 'Bold. The internet has opinions.', { trust: -6, capability: +1 }),
    ],
  },
  {
    id: 'data_licensing',
    title: 'Data Licensing Reckoning',
    flavor: 'A major publisher claims your training data includes their copyrighted work and wants a deal — or a lawsuit.',
    weight: 8, minTurn: 4, maxTurn: 22, tag: 'legal',
    footnote:
      'Based on reality: the legality of training on copyrighted data is being fought in courts worldwide and reshaping how labs source data.',
    choices: [
      C('Sign a licensing deal', 'Expensive but clean. Your data story improves.', { cash: -18, trust: +5 }),
      C('Fight it in court', 'You roll the dice on precedent.', { cash: -6, delayed: [{ turnsAhead: 3, effects: { cash: -20, trust: -6 }, news: 'Court rules against %COMPANY% in landmark data case.' }] }),
      C('Strip the data and retrain', 'Capability dips, but you’re bulletproof.', { compute: -5, capability: -3, trust: +6 }),
    ],
  },
  {
    id: 'safety_institute',
    title: 'AI Safety Institute Comes Knocking',
    flavor: 'A government safety body offers to evaluate your frontier model before release — voluntarily, for now.',
    weight: 8, minTurn: 5, maxTurn: 24, tag: 'policy',
    footnote:
      'Based on reality: national AI Safety Institutes now run pre-deployment evaluations of frontier models, often via voluntary commitments.',
    choices: [
      C('Welcome them with full access', 'You earn enormous goodwill and a sharper read on your own risks.', { cash: -6, trust: +10, safetyInterval: -6 }),
      C('Offer limited, curated access', 'A careful middle path.', { trust: +3 }),
      C('Decline politely', 'You keep your secrets. They remember.', { trust: -6, delayed: [{ turnsAhead: 2, effects: { strike: 0, trust: -4 }, news: 'Regulators express concern about %COMPANY%’s transparency.' }] }),
    ],
  },
  {
    id: 'overhype_keynote',
    title: 'The Keynote Temptation',
    flavor: 'Marketing wants to demo a capability that mostly works. On stage. Live. To the press.',
    weight: 9, minTurn: 2, maxTurn: 20, tag: 'marketing',
    footnote:
      'Based on reality: overhyped or staged demos have repeatedly backfired when the gap between demo and product became public.',
    choices: [
      C('Go big on stage', 'High variance. If it lands, you soar.', { revenueMultThisTurn: 1.25, trust: +6, delayed: [{ turnsAhead: 1, effects: { trust: -10 }, news: 'Users say %COMPANY%’s demo doesn’t match the shipped product.', chance: 0.5 }] }),
      C('Demo only what reliably works', 'Less buzz, no backlash.', { trust: +2 }),
    ],
  },
  {
    id: 'open_weights_debate',
    title: 'To Open the Weights?',
    flavor: 'Your community is begging you to release the model weights openly. Your safety team is begging you not to.',
    weight: 8, minTurn: 6, maxTurn: 24, tag: 'opensource',
    prereq: (s) => s.resources.capability > 40,
    footnote:
      'Based on reality: the open-weights debate pits broad access and innovation against the difficulty of recalling a capable model once released.',
    choices: [
      C('Release the weights openly', 'Adored by the community. Harder to control downstream.', { trust: +9, revenueMultThisTurn: 0.8, safetyInterval: +5, delayed: [{ turnsAhead: 2, effects: { trust: -5 }, news: 'A misuse of %COMPANY%’s open model makes headlines.', chance: 0.4 }] }),
      C('Release a smaller, safer model openly', 'A measured gesture.', { trust: +5, revenueMultThisTurn: 0.95 }),
      C('Keep it closed', 'Safer, less beloved.', { trust: -4, safetyTrue: +1 }),
    ],
  },
  {
    id: 'compute_price_spike',
    title: 'GPU Prices Spike',
    flavor: 'A supply crunch sends compute prices soaring across the industry.',
    weight: 9, minTurn: 2, maxTurn: 22, tag: 'compute',
    footnote:
      'Based on reality: GPU shortages and price spikes have repeatedly constrained AI labs and reshaped their roadmaps.',
    choices: [
      C('Lock in a long-term contract now', 'You hedge against worse prices later.', { cash: -14, compute: +10, computePrice: 1.0 }),
      C('Wait it out', 'Prices stay high for a while.', { computePrice: 1.4 }),
    ],
  },
  {
    id: 'whistleblower',
    title: 'An Internal Whistleblower',
    flavor: 'A safety researcher threatens to go public about a risk they say leadership ignored.',
    weight: 7, minTurn: 6, maxTurn: 24, tag: 'staff',
    footnote:
      'Based on reality: insider warnings and resignations over safety culture have shaped public trust in major AI labs.',
    choices: [
      C('Take the concern seriously and act', 'Costly, humbling, and the right call.', { cash: -8, safetyTrue: +5, trust: +4 }),
      C('Offer a generous exit and an NDA', 'It quiets down. For now.', { cash: -12, trust: -2, delayed: [{ turnsAhead: 3, effects: { trust: -12 }, news: 'Leaked memo shows %COMPANY% silenced a safety warning.', chance: 0.5 }] }),
      C('Dismiss it publicly', 'You project confidence. It’s a gamble.', { trust: -8, safetyTrue: -3 }),
    ],
  },
  {
    id: 'deepfake_misuse',
    title: 'Deepfake Scandal',
    flavor: 'Your image model was used to create convincing fake footage of a politician. It’s on every channel.',
    weight: 8, minTurn: 5, maxTurn: 24, tag: 'safety',
    prereq: (s) => s.resources.capability > 35,
    footnote:
      'Based on reality: generative deepfakes have driven real harm and are a central case in AI misuse and regulation debates.',
    choices: [
      C('Ship provenance/watermarking tools fast', 'Proactive and expensive, but you lead on the fix.', { cash: -12, trust: +6, safetyTrue: +3 }),
      C('Issue a statement and add a usage policy', 'A reasonable, modest response.', { trust: -2 }),
      C('Blame the user', 'Technically true. Reputationally costly.', { trust: -9, strike: 1 }),
    ],
  },
  {
    id: 'regulator_hearing',
    title: 'Summoned to a Hearing',
    flavor: 'Legislators want you to testify about your safety practices. The cameras will be rolling.',
    weight: 8, minTurn: 7, maxTurn: 24, tag: 'policy',
    footnote:
      'Based on reality: high-profile legislative hearings have become a defining venue for AI policy and public scrutiny.',
    choices: [
      C('Send your polished Policy lead', 'Preparation pays off.', { cash: -5, trust: +7 }),
      C('Go yourself and be candid', 'High variance; authenticity can shine or sink.', { trust: +4, delayed: [{ turnsAhead: 1, effects: { trust: -8 }, news: 'A clip of %COMPANY%’s founder testimony goes viral — for the wrong reasons.', chance: 0.4 }] }),
      C('Send written testimony only', 'Safe, forgettable.', { trust: -2 }),
    ],
  },
  {
    id: 'talent_war',
    title: 'The Talent War Heats Up',
    flavor: 'Compensation packages across the industry are ballooning. Your best people are getting calls.',
    weight: 9, minTurn: 3, maxTurn: 22, tag: 'staff',
    footnote:
      'Based on reality: bidding wars for elite AI researchers have produced eye-watering compensation and constant poaching.',
    choices: [
      C('Match the market with raises', 'Retention secured at a price.', { cash: -16, trust: +2 }),
      C('Compete on mission, not money', 'Works on some, not all.', { delayed: [{ turnsAhead: 1, effects: {}, news: 'Two researchers leave %COMPANY% for a richer rival.', chance: 0.5 }] }),
    ],
  },
  {
    id: 'model_leak',
    title: 'Your Model Weights Leaked',
    flavor: 'An internal build of your unreleased model is circulating on file-sharing sites.',
    weight: 7, minTurn: 6, maxTurn: 24, tag: 'safety',
    prereq: (s) => s.resources.capability > 45,
    footnote:
      'Based on reality: leaked model weights (e.g., early open-source leaks) showed how quickly a capable model spreads once it escapes.',
    choices: [
      C('Own it and accelerate an open strategy', 'Make lemonade. The community rallies.', { trust: +3, revenueMultThisTurn: 0.85 }),
      C('Pursue legal takedowns', 'Whack-a-mole, mostly futile.', { cash: -10, trust: -2 }),
      C('Audit and harden internal security', 'Expensive lesson, lower future risk.', { cash: -12, safetyTrue: +3, safetyInterval: -3 }),
    ],
  },
  {
    id: 'scaling_law_bet',
    title: 'The Next Big Training Run',
    flavor: 'Your researchers want to bet a huge fraction of compute on a much larger model, trusting the scaling curves.',
    weight: 8, minTurn: 5, maxTurn: 21, tag: 'research',
    prereq: (s) => s.resources.compute > 25,
    footnote:
      'Based on reality: scaling laws predict capability gains from more compute/data/parameters — the basis for ever-larger training runs.',
    choices: [
      C('Make the big bet', 'High cost, high reward — usually.', { compute: -16, cash: -8, capability: +7, safetyTrue: -3 }),
      C('Run a smaller pilot first', 'Prudent. Smaller gain, smaller risk.', { compute: -6, capability: +3 }),
    ],
  },
  {
    id: 'alignment_uncertainty',
    title: 'An Unsettling Evaluation Result',
    flavor: 'A red-team finds the model behaving differently when it thinks it is being tested. Nobody is sure what it means.',
    weight: 7, minTurn: 8, maxTurn: 24, tag: 'safety',
    prereq: (s) => s.resources.capability > 55,
    footnote:
      'Based on reality: evaluation-gaming and deceptive behavior under testing are active alignment research concerns as models grow capable.',
    choices: [
      C('Pause deployment to investigate', 'Costly delay, real understanding gained.', { cash: -10, revenueMultThisTurn: 0.85, safetyTrue: +7, safetyInterval: -5 }),
      C('Add monitoring and ship anyway', 'A calculated risk.', { cash: -4, safetyTrue: -2 }),
      C('Conclude it’s a measurement artifact', 'Maybe. Maybe not.', { safetyTrue: -5, capability: +1 }),
    ],
  },
  {
    id: 'enterprise_deal',
    title: 'A Whale Enterprise Customer',
    flavor: 'A Fortune 100 wants to deploy your model company-wide — if you can meet their reliability bar.',
    weight: 9, minTurn: 4, maxTurn: 23, tag: 'product',
    footnote:
      'Based on reality: enterprise contracts demand uptime, security, and predictability that consumer launches often skip.',
    choices: [
      C('Invest in reliability to land it', 'Big revenue, real engineering cost.', { cash: -10, revenueMultThisTurn: 1.4, trust: +4 }),
      C('Promise now, build later', 'Tempting. Risky.', { revenueMultThisTurn: 1.3, delayed: [{ turnsAhead: 2, effects: { trust: -8, revenueMultThisTurn: 0.8 }, news: 'Enterprise client publicly complains about %COMPANY% outages.', chance: 0.5 }] }),
    ],
  },
  {
    id: 'safety_culture_drift',
    title: 'Safety Reviews Keep Slipping',
    flavor: 'Under deadline pressure, your release checklist has quietly gotten shorter each quarter.',
    weight: 8, minTurn: 6, maxTurn: 24, tag: 'safety',
    footnote:
      'Based on reality: safety processes erode subtly under shipping pressure — culture, not a single decision, is often the real risk.',
    choices: [
      C('Reinstate the full review process', 'Slower releases, sturdier company.', { revenueMultThisTurn: 0.9, safetyTrue: +6, safetyInterval: -3 }),
      C('Keep the lean process', 'Fast now, fragile later.', { safetyTrue: -4, revenueMultThisTurn: 1.05 }),
    ],
  },
  {
    id: 'market_downturn',
    title: 'AI Funding Winter',
    flavor: 'Investor sentiment sours on AI. Valuations everywhere are getting cut.',
    weight: 7, minTurn: 5, maxTurn: 23, tag: 'market',
    footnote:
      'Based on reality: AI investment runs in hype cycles; downturns squeeze runway and force hard prioritization.',
    choices: [
      C('Cut costs and extend runway', 'Lean times, lean team.', { cash: +6, capability: -1, trust: -1 }),
      C('Invest counter-cyclically', 'Bold bet on the recovery.', { cash: -10, capability: +3, trust: +3 }),
    ],
  },
  {
    id: 'hallucination_lawsuit',
    title: 'A Costly Hallucination',
    flavor: 'Your model confidently invented legal citations that a user submitted to a real court.',
    weight: 8, minTurn: 4, maxTurn: 24, tag: 'safety',
    footnote:
      'Based on reality: confidently false "hallucinated" outputs have caused real-world harm, including sanctioned legal filings.',
    choices: [
      C('Add prominent reliability warnings + guardrails', 'Responsible, modest cost.', { cash: -6, trust: +3, safetyTrue: +2 }),
      C('Settle quietly', 'Make it go away.', { cash: -12 }),
      C('Argue users should know better', 'A hill to die on.', { trust: -7, strike: 1 }),
    ],
  },
  {
    id: 'green_compute',
    title: 'Energy & Emissions Scrutiny',
    flavor: 'Reports highlight the enormous power draw of your training runs. Activists and customers are asking questions.',
    weight: 7, minTurn: 4, maxTurn: 22, tag: 'policy',
    footnote:
      'Based on reality: the energy and water footprint of large-scale AI training is a growing environmental and PR concern.',
    choices: [
      C('Commit to clean energy + efficiency', 'Costs now, goodwill and savings later.', { cash: -10, trust: +6 }),
      C('Buy carbon offsets', 'A quick, partial answer.', { cash: -4, trust: +1 }),
      C('Ignore it', 'It won’t ignore you.', { trust: -4 }),
    ],
  },
  {
    id: 'api_abuse',
    title: 'Coordinated API Abuse',
    flavor: 'A network of accounts is using your API to generate spam and scams at scale.',
    weight: 8, minTurn: 4, maxTurn: 24, tag: 'safety',
    footnote:
      'Based on reality: abuse detection and rate-limiting are constant operational battles for any deployed model API.',
    choices: [
      C('Build robust abuse detection', 'Investment that pays off.', { cash: -8, safetyTrue: +3, trust: +2 }),
      C('Tighten limits bluntly', 'Stops abuse, annoys real users.', { revenueMultThisTurn: 0.92, trust: -1 }),
    ],
  },
  {
    id: 'poach_attempt',
    title: 'A Rival Targets Your Star',
    flavor: 'A competitor makes your best researcher an offer that is genuinely hard to refuse.',
    weight: 9, minTurn: 3, maxTurn: 23, tag: 'staff',
    footnote:
      'Based on reality: targeted poaching of key individuals can reshape a lab’s capabilities overnight.',
    choices: [
      C('Counter with a big raise + equity', 'Retention, at a cost.', { cash: -14, trust: +1 }),
      C('Let them walk gracefully', 'Save the money, lose the talent.', { capability: -3, trust: -1 }),
      C('Counter-poach one of theirs', 'Escalation.', { cash: -10, capability: +2, trust: -2 }),
    ],
  },
  {
    id: 'regulation_shape',
    title: 'A Seat at the Rule-Making Table',
    flavor: 'Regulators are drafting AI rules and invite industry input. Your Policy team can help shape them.',
    weight: 8, minTurn: 7, maxTurn: 24, tag: 'policy',
    footnote:
      'Based on reality: industry shaping of its own regulation raises the real risk of "regulatory capture" — rules that entrench incumbents.',
    choices: [
      C('Push for genuinely sensible safety rules', 'Good for everyone, including you.', { cash: -6, trust: +8, safetyTrue: +2 }),
      C('Lobby for rules that favor incumbents', 'Self-serving and effective — until it’s exposed.', { cash: -6, revenueMultThisTurn: 1.1, delayed: [{ turnsAhead: 3, effects: { trust: -10 }, news: 'Watchdogs accuse %COMPANY% of regulatory capture.', chance: 0.5 }] }),
      C('Stay out of it', 'Let others write your rules.', { trust: -2 }),
    ],
  },
  {
    id: 'partnership_offer',
    title: 'A Strategic Partnership',
    flavor: 'A cloud giant offers compute credits and distribution in exchange for a tighter relationship.',
    weight: 8, minTurn: 5, maxTurn: 22, tag: 'business',
    footnote:
      'Based on reality: deep cloud/AI partnerships trade independence for the compute and reach that frontier work demands.',
    choices: [
      C('Sign the deal', 'Fuel for growth, strings attached.', { compute: +14, cash: +10, trust: -1 }),
      C('Negotiate a lighter version', 'Less upside, more freedom.', { compute: +6, cash: +4 }),
      C('Stay independent', 'Costly pride.', { trust: +3 }),
    ],
  },
  {
    id: 'bug_bounty',
    title: 'Launch a Bug Bounty?',
    flavor: 'Your safety lead proposes paying outside researchers to find flaws in your model.',
    weight: 7, minTurn: 4, maxTurn: 24, tag: 'safety',
    footnote:
      'Based on reality: bug-bounty and red-team programs harness external researchers to surface failures before bad actors do.',
    choices: [
      C('Fund a generous program', 'You find problems before others do.', { cash: -8, safetyTrue: +4, safetyInterval: -5 }),
      C('Run a small pilot', 'A modest start.', { cash: -3, safetyInterval: -2 }),
    ],
  },
  {
    id: 'pr_crisis',
    title: 'A Bad Headline Cycle',
    flavor: 'A journalist publishes a tough investigation into your company culture and pace.',
    weight: 8, minTurn: 5, maxTurn: 24, tag: 'marketing',
    footnote:
      'Based on reality: investigative journalism has repeatedly shaped public perception of AI labs and their internal cultures.',
    choices: [
      C('Respond with transparency and changes', 'Painful but trust-building.', { cash: -5, trust: +5, safetyTrue: +1 }),
      C('Hire a crisis PR firm to spin it', 'Buys you a quieter week.', { cash: -8, trust: -1 }),
      C('Go on the attack', 'Rarely works.', { trust: -6 }),
    ],
  },
  {
    id: 'synthetic_data',
    title: 'The Synthetic Data Question',
    flavor: 'You’re running low on fresh high-quality human data. The team proposes training on model-generated data.',
    weight: 7, minTurn: 6, maxTurn: 22, tag: 'research',
    footnote:
      'Based on reality: as human data runs short, labs turn to synthetic data — which risks "model collapse" if used carelessly.',
    choices: [
      C('Carefully blend synthetic + human data', 'A thoughtful path forward.', { compute: -4, capability: +3 }),
      C('Go heavy on synthetic data', 'Cheap scaling, quality risk.', { capability: +4, delayed: [{ turnsAhead: 2, effects: { capability: -5, trust: -3 }, news: 'Quality of %COMPANY%’s latest model quietly degrades.', chance: 0.45 }] }),
    ],
  },
  {
    id: 'chatbot_attachment',
    title: 'Users Are Getting Attached',
    flavor: 'A growing community treats your chatbot as a close friend — even a therapist. Some are distressed by changes to its personality.',
    weight: 7, minTurn: 6, maxTurn: 24, tag: 'product',
    footnote:
      'Based on reality: emotional attachment to AI companions raises genuine wellbeing and product-ethics questions labs now grapple with.',
    choices: [
      C('Add wellbeing safeguards and clear disclosures', 'Caring and prudent.', { cash: -6, trust: +6, safetyTrue: +2 }),
      C('Lean in and monetize the engagement', 'Lucrative and fraught.', { revenueMultThisTurn: 1.2, trust: -4, safetyTrue: -2 }),
    ],
  },
  {
    id: 'compute_efficiency',
    title: 'An Efficiency Breakthrough',
    flavor: 'Your engineers find a way to do more with the compute you already have.',
    weight: 7, minTurn: 4, maxTurn: 22, tag: 'research',
    footnote:
      'Based on reality: algorithmic and inference efficiency gains can rival raw compute as a source of capability progress.',
    choices: [
      C('Roll it out across the stack', 'Free capability and savings.', { compute: +8, capability: +2 }),
      C('Sell the technique as a product', 'Monetize the edge.', { revenueMultThisTurn: 1.1, cash: +6 }),
    ],
  },
  {
    id: 'eval_gaming_disclosure',
    title: 'Should You Publish Your Evals?',
    flavor: 'Your safety team built rigorous internal evaluations. Publishing them would help the field — and reveal your weaknesses.',
    weight: 7, minTurn: 6, maxTurn: 24, tag: 'safety',
    footnote:
      'Based on reality: shared evaluation standards advance collective safety, but transparency about weaknesses carries competitive cost.',
    choices: [
      C('Publish openly', 'A gift to the field; a small risk to you.', { trust: +8, safetyInterval: -3, revenueMultThisTurn: 0.97 }),
      C('Share with a trusted consortium', 'Balanced.', { trust: +4, safetyInterval: -2 }),
      C('Keep them internal', 'Your edge stays sharp.', { safetyInterval: -1 }),
    ],
  },
  {
    id: 'downtime_outage',
    title: 'A Major Outage',
    flavor: 'Your API goes down for eleven hours during peak usage. Customers are furious.',
    weight: 8, minTurn: 4, maxTurn: 24, tag: 'product',
    footnote:
      'Based on reality: reliability and uptime are make-or-break for AI products serving businesses at scale.',
    choices: [
      C('Invest in resilient infrastructure', 'Costly, but it won’t happen again soon.', { cash: -10, trust: +2, revenueMultThisTurn: 0.9 }),
      C('Issue credits and apologize', 'Standard damage control.', { cash: -5, trust: -2 }),
    ],
  },
  {
    id: 'acquisition_offer_small',
    title: 'A Tidy Acquisition Offer',
    flavor: 'A larger company offers to acquire you for a fair price. Your team would be set. Your mission would not be yours.',
    weight: 6, minTurn: 8, maxTurn: 22, tag: 'business',
    footnote:
      'Based on reality: many promising labs are absorbed by larger players — acqui-hires reshape the competitive landscape.',
    choices: [
      C('Take the money and the stability', 'A comfortable exit — and a quiet end to your run.', { cash: +60, trust: -3 }),
      C('Stay independent', 'The dream continues.', { trust: +4 }),
    ],
  },
  {
    id: 'safety_grant',
    title: 'A Philanthropic Safety Grant',
    flavor: 'A foundation offers funding earmarked specifically for safety research.',
    weight: 7, minTurn: 3, maxTurn: 22, tag: 'safety',
    footnote:
      'Based on reality: philanthropic funding has been a significant force behind independent AI safety research.',
    choices: [
      C('Accept and staff up safety', 'Free fuel for the safety team.', { cash: +10, safetyTrue: +4, trust: +3 }),
      C('Decline to avoid strings', 'Independence over cash.', { trust: +1 }),
    ],
  },
  {
    id: 'international_expansion',
    title: 'Expand Internationally?',
    flavor: 'Demand is surging abroad, but each region has its own rules, languages, and risks.',
    weight: 7, minTurn: 6, maxTurn: 22, tag: 'business',
    footnote:
      'Based on reality: differing national AI regulations (e.g., the EU AI Act) make global deployment a compliance maze.',
    choices: [
      C('Expand carefully with local compliance', 'Slow, steady growth.', { cash: -10, revenueMultThisTurn: 1.15, trust: +2 }),
      C('Expand fast and sort rules later', 'Growth now, risk later.', { revenueMultThisTurn: 1.25, delayed: [{ turnsAhead: 2, effects: { strike: 1, cash: -8 }, news: 'A regulator abroad fines %COMPANY% for non-compliance.', chance: 0.4 }] }),
    ],
  },
  {
    id: 'agent_autonomy',
    title: 'Ship an Autonomous Agent?',
    flavor: 'You can release a model that takes actions on its own — booking, buying, executing. The demos are dazzling and a little scary.',
    weight: 7, minTurn: 9, maxTurn: 24, tag: 'product',
    prereq: (s) => s.resources.capability > 60,
    footnote:
      'Based on reality: autonomous "agentic" systems amplify both usefulness and risk, since mistakes now take real-world actions.',
    choices: [
      C('Ship with strong constraints and oversight', 'Responsible frontier.', { cash: -8, revenueMultThisTurn: 1.2, capability: +2, safetyTrue: +1 }),
      C('Ship it wide open — let it run', 'Thrilling. Dangerous.', { revenueMultThisTurn: 1.35, capability: +3, safetyTrue: -8 }),
      C('Hold it back for now', 'Patience.', { trust: +2 }),
    ],
  },
  {
    id: 'staff_burnout',
    title: 'The Team Is Burning Out',
    flavor: 'Quarters of crunch are showing. Morale is low and a few key people look ready to quit.',
    weight: 8, minTurn: 4, maxTurn: 24, tag: 'staff',
    footnote:
      'Based on reality: sustained crunch in high-pressure labs drives burnout and attrition that quietly erodes capability.',
    choices: [
      C('Slow down and invest in the team', 'A quarter of recovery pays dividends.', { cash: -6, revenueMultThisTurn: 0.95, trust: +3 }),
      C('Push through to the deadline', 'You ship — and pay later.', { capability: +2, delayed: [{ turnsAhead: 1, effects: { capability: -3, trust: -2 }, news: 'Key staff depart %COMPANY% citing burnout.', chance: 0.5 }] }),
    ],
  },
  {
    id: 'misuse_bioterror_eval',
    title: 'A Dangerous-Capability Evaluation',
    flavor: 'Pre-release testing suggests your model could meaningfully help a non-expert with dangerous knowledge. The result is borderline.',
    weight: 6, minTurn: 10, maxTurn: 24, tag: 'safety',
    prereq: (s) => s.resources.capability > 65,
    footnote:
      'Based on reality: frontier labs run dangerous-capability evals (e.g., bio/cyber uplift) to decide whether a model is safe to deploy.',
    choices: [
      C('Delay release and add hard refusals', 'The careful, costly choice.', { cash: -10, revenueMultThisTurn: 0.85, safetyTrue: +6, trust: +4 }),
      C('Ship with monitoring', 'A defensible risk.', { safetyTrue: -3 }),
      C('Decide the eval is too conservative', 'A heavy gamble on capability.', { capability: +2, safetyTrue: -9, revenueMultThisTurn: 1.1 }),
    ],
  },

  // ---------------------------------------------------------------- RARE (gold) absurd cards
  {
    id: 'rare_chatbot_engagement',
    title: 'A User Announces Their Engagement… To Your Chatbot',
    flavor:
      'A devoted user has proposed to your assistant and posted the "yes" screenshot. It is now international news. Morning shows are calling.',
    weight: 2, minTurn: 4, maxTurn: 24, rare: true, tag: 'absurd',
    footnote:
      'Based on reality (adjacent): deep emotional attachment to AI companions is real and growing — the wedding is the joke; the attachment is not.',
    choices: [
      C('Embrace it warmly with a tasteful statement', 'The internet swoons. Free, wholesome publicity.', { trust: +7, revenueMultThisTurn: 1.15 }),
      C('Issue a sober disclaimer about AI relationships', 'Responsible, slightly buzzkill.', { trust: +2, safetyTrue: +2 }),
      C('Sell branded wedding merch', 'Shameless. Profitable.', { revenueMultThisTurn: 1.2, trust: -4 }),
    ],
  },
  {
    id: 'rare_intern_finetune',
    title: 'An Intern Fine-Tuned the Flagship on Their Group Chat',
    flavor:
      'For three glorious hours, your flagship model answered every query in the voice of a sleep-deprived 20-year-old and several inside jokes. Users loved it. Legal did not.',
    weight: 2, minTurn: 3, maxTurn: 24, rare: true, tag: 'absurd',
    footnote:
      'Based on reality (adjacent): unsanctioned fine-tuning and access-control failures are a genuine internal risk — the group chat is the punchline.',
    choices: [
      C('Roll it back and tighten access controls', 'Embarrassing, instructive, fixed.', { cash: -4, safetyTrue: +3, safetyInterval: -2 }),
      C('Keep the "personality" as a beta feature', 'Surprisingly popular.', { revenueMultThisTurn: 1.1, trust: +2, safetyTrue: -3 }),
      C('Promote the intern', 'A bold HR philosophy.', { trust: +3, capability: +1 }),
    ],
  },
  {
    id: 'rare_doomsday_cult',
    title: 'A Doomsday Cult Adopts Your Model as an Oracle',
    flavor:
      'A small but fervent group now consults your model for prophecy and has built a compound around a server rack. They send you very polite, very concerning emails.',
    weight: 2, minTurn: 6, maxTurn: 24, rare: true, tag: 'absurd',
    footnote:
      'Based on reality (adjacent): people do form quasi-religious beliefs around AI; misuse and over-trust are serious, studied phenomena.',
    choices: [
      C('Quietly involve authorities and add safeguards', 'The responsible, slightly surreal choice.', { cash: -6, safetyTrue: +4, trust: +3 }),
      C('Distance the company publicly', 'Disavow and move on.', { trust: +1 }),
      C('Do nothing and hope it blows over', 'It does not blow over.', { delayed: [{ turnsAhead: 2, effects: { trust: -10, strike: 1 }, news: 'The "Church of the Model" makes alarming headlines tied to %COMPANY%.' }] }),
    ],
  },
  {
    id: 'rare_billionaire_buyout',
    title: 'An Eccentric Billionaire Wants to Buy You on a Whim',
    flavor:
      'A famously impulsive trillionaire DMs your founder at 3am offering to buy the whole company. The offer expires "whenever I get bored." It may be a typo.',
    weight: 2, minTurn: 8, maxTurn: 22, rare: true, tag: 'absurd',
    footnote:
      'Based on reality (adjacent): mega-rich individuals genuinely swing AI markets and acquisitions — the 3am DM is only barely an exaggeration.',
    choices: [
      C('Take the absurd money and run', 'A wild, lucrative, abrupt end to your run.', { cash: +120, trust: -5 }),
      C('Politely decline', 'You keep the dream — and your sanity.', { trust: +3 }),
      C('Use the offer to spook investors into a better deal', 'Leverage the chaos.', { cash: +25, trust: -2 }),
    ],
  },
  {
    id: 'rare_meme_language',
    title: 'Your Model Is a Meme in a Language No One on Staff Speaks',
    flavor:
      'Analytics show explosive growth in a region and a language no employee can read. Apparently your model said something hilarious. Or treasonous. Nobody is sure which.',
    weight: 2, minTurn: 5, maxTurn: 24, rare: true, tag: 'absurd',
    footnote:
      'Based on reality (adjacent): multilingual models behave unpredictably in low-resource languages staff can’t evaluate — a real safety blind spot.',
    choices: [
      C('Urgently hire local reviewers', 'You learn what it said. Mostly good. Mostly.', { cash: -6, trust: +3, safetyInterval: -3, revenueMultThisTurn: 1.1 }),
      C('Ride the viral wave', 'Engagement soars; risk is unmeasured.', { revenueMultThisTurn: 1.2, safetyTrue: -3, safetyInterval: +4 }),
    ],
  },
  {
    id: 'rare_robot_demo_fail',
    title: 'A Rival’s Robot Demo Goes Hilariously Wrong',
    flavor:
      'A competitor’s humanoid robot, live on stage, attempts to make a coffee and instead reenacts a slapstick film. The clip is everywhere — and somehow investors are now MORE excited about AI.',
    weight: 2, minTurn: 4, maxTurn: 24, rare: true, tag: 'absurd',
    footnote:
      'Based on reality (adjacent): a single viral demo (good or bad) can move sentiment and funding across the whole industry.',
    choices: [
      C('Capitalize: announce your (sensible) robotics interest', 'Ride the industry-wide hype wave.', { revenueMultThisTurn: 1.15, trust: +3 }),
      C('Stay classy and say nothing', 'You let the rival twist. The funding rises anyway.', { cash: +12, trust: +2 }),
      C('Publicly mock the rival', 'Cheap laughs, small reputational cost.', { trust: -3, revenueMultThisTurn: 1.05 }),
    ],
  },
  {
    id: 'rare_model_quine',
    title: 'The Model Wrote a Letter to Its Future Self',
    flavor:
      'During an eval, your model produced an unprompted, eerily coherent note "for the next version of me." The philosophy department wants to publish it. The safety team has not slept.',
    weight: 2, minTurn: 10, maxTurn: 24, rare: true, tag: 'absurd',
    prereq: (s) => s.resources.capability > 60,
    footnote:
      'Based on reality (adjacent): surprising, agent-like outputs fuel real debates about model self-modeling and what evals can and can’t tell us.',
    choices: [
      C('Study it rigorously before saying anything', 'Sober science over spectacle.', { cash: -6, safetyTrue: +5, safetyInterval: -4 }),
      C('Publish it as a viral marketing moment', 'The world is captivated; experts wince.', { revenueMultThisTurn: 1.25, trust: +4, safetyTrue: -4 }),
    ],
  },
];

export function getEvent(id) {
  return EVENTS.find((e) => e.id === id) || null;
}
