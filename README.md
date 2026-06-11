# 🛰️ Frontier — AI Company Tycoon

A single-player, turn-based management sim. Found and run an AI company over six in-game years
(24 quarterly turns), competing against rival labs to build the most **successful _and_ safest**
company. It teaches real AI-industry concepts — compute scarcity, red-teaming, race dynamics,
regulation, and alignment uncertainty — through its mechanics and 40+ event cards.

Built as a client-side **Vite + React** app. No backend; all state lives in the browser.

## Run it

```bash
npm install
npm run dev      # play at the printed localhost URL
npm test         # run the engine unit tests (Vitest)
npm run build    # production build into dist/
```

## How to play

Each quarter, in order:
1. **Budget** — allocate spend across 5 departments (Research, Safety, Product, Marketing, Policy).
2. **Actions** — hire/fire, buy compute, launch a release, run a research initiative, raise funding, poach a rival.
3. **Events** — resolve 1–3 drawn event cards, each posing a speed/profit vs. care/trust tension.
4. **End turn** — the sim resolves: revenue, costs, incidents, rivals, news.

The run ends at turn 24, or early via bankruptcy, a catastrophic incident, or a 3-strike regulatory
shutdown. **Final Score = Company Value × Safety Multiplier** — you can't win on raw value alone.

### The signature mechanic: hidden Safety

Your **true Safety is hidden**. You only ever see an estimated *range* (e.g. "Safety: 45–80").
Spending on **Evaluations / red-teaming** narrows that range toward reality (and nudges true safety up).
Incidents roll against the *true* value, and your safety team quietly prevents incidents you never
see — revealed in the endgame ledger. Switch the Safety Display to **Both (learning mode)** on the
setup screen to watch the interval narrow around the truth.

### Debug panel

Press the backtick key `` ` `` (or the 🐞 Debug button). Four tabs: live **State** (including the
hidden true Safety, the incident ledger, RNG seed + call count), a step-by-step **Turn Log** of every
formula and random roll, **Cheats** (edit resources, force events, god modes, skip turns), and a
**Deck** viewer. All debug actions go through the same reducer as normal play.

## Architecture

Everything is **data-driven** and **deterministic** (a seeded mulberry32 PRNG drives all randomness,
so identical seed + identical choices replay identically).

```
src/
  data/            content — add an event/staffer/rival by adding a data entry
    balance.js       ALL tuning constants (one file to balance the game)
    archetypes.js    founder presets + custom perk/drawback pools
    staff.js         hireable candidates + trait trade-offs
    rivals.js        4 rival-lab agents
    events.js        42 event cards (7 rare/absurd) with "Based on reality" footnotes
    legacyTitles.js  endgame legacy-title table
    glossary.js      in-game help / concept explanations
  engine/          pure, testable simulation
    rng.js           seeded PRNG (all randomness flows through it)
    state.js         initial-state construction from setup choices
    formulas.js      revenue / capability / safety / incident math (pure)
    mods.js          derives modifiers from passives + staff leads + traits
    effects.js       applies declarative event effect objects
    deck.js          event drawing (no repeats, turn windows, prereqs, weights)
    resolve.js       resolveTurn(state) -> { state, log }  (the turn engine)
    scoring.js       endgame scoring + legacy title
    reducer.js       single reducer for ALL state transitions (incl. debug)
    persistence.js   localStorage save/load + high scores
    *.test.js        23 unit tests (revenue, incidents, determinism, flow)
  ui/              React components (TopBar, panels, modals, debug drawer)
  App.jsx          wires reducer + autosave + keyboard + high scores
```

The turn engine emits a structured `log` array as part of its pure output — used by both the Debug
Turn Log and the unit tests.

## Tuning

All gameplay constants live in `src/data/balance.js`. On Normal difficulty a reasonable player
survives to the endgame but rarely tops the leaderboard (Macrohard, the big-tech giant, usually
holds the top market share). Adjust the constants there to retune.
