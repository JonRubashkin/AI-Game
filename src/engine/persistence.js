// persistence.js — localStorage save/load for the active run + high-score table + debug pref.

const SAVE_KEY = 'frontier_save_v1';
const SCORES_KEY = 'frontier_highscores_v1';
const DEBUG_PREF_KEY = 'frontier_debug_open_v1';

export function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    /* ignore quota errors */
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    /* ignore */
  }
}

export function getHighScores() {
  try {
    const raw = localStorage.getItem(SCORES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function addHighScore(entry) {
  try {
    const scores = getHighScores();
    scores.push(entry);
    scores.sort((a, b) => b.score - a.score);
    const trimmed = scores.slice(0, 10);
    localStorage.setItem(SCORES_KEY, JSON.stringify(trimmed));
    return trimmed;
  } catch (e) {
    return getHighScores();
  }
}

export function getDebugPref() {
  try {
    return localStorage.getItem(DEBUG_PREF_KEY) === '1';
  } catch (e) {
    return false;
  }
}

export function setDebugPref(open) {
  try {
    localStorage.setItem(DEBUG_PREF_KEY, open ? '1' : '0');
  } catch (e) {
    /* ignore */
  }
}
