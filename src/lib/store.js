// Stockage local (localStorage) : profils, progrès, réglages, activités créées par le parent.
// Aucune donnée n'est envoyée sur internet. Le module `sync` est un point d'extension
// pour une future synchronisation par compte.
import { useSyncExternalStore } from 'react';

const KEY = 'mon-ecole-v1';
const listeners = new Set();

const defaults = () => ({
  profiles: [],
  currentProfile: null,
  progress: {}, // { profileId: { activityId: {...} } }
  settings: { audioLang: 'fr', autoAudio: true, rate: 0.9, parentCode: null },
  custom: {} // activités créées/modifiées : { id: activity }
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const d = JSON.parse(raw);
    // « Grande section » n'existe plus : ces profils passent au CI.
    const profiles = (d.profiles || []).map((p) => (['CI', 'CP', 'CE1'].includes(p.level) ? p : { ...p, level: 'CI' }));
    return { ...defaults(), ...d, profiles, settings: { ...defaults().settings, ...(d.settings || {}) } };
  } catch {
    return defaults();
  }
}

let state = load();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* stockage plein ou bloqué */ }
  listeners.forEach((l) => l());
}

export function getState() { return state; }
export function setState(fn) { state = { ...state, ...fn(state) }; persist(); }
export function useStore(selector = (s) => s) {
  return selector(useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => state));
}

// Profils
export function addProfile({ name, avatar, level }) {
  const id = 'p' + Date.now().toString(36);
  setState((s) => ({ profiles: [...s.profiles, { id, name: name.trim(), avatar, level }], currentProfile: id }));
  return id;
}
export function updateProfile(id, patch) {
  setState((s) => ({ profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
}
export function removeProfile(id) {
  setState((s) => {
    const profiles = s.profiles.filter((p) => p.id !== id);
    const progress = { ...s.progress }; delete progress[id];
    return { profiles, progress, currentProfile: profiles[0]?.id || null };
  });
}
export function selectProfile(id) { setState(() => ({ currentProfile: id })); }
export function currentProfile(s = state) { return s.profiles.find((p) => p.id === s.currentProfile) || null; }

// Progrès
export function profileProgress(s = state) { return s.progress[s.currentProfile] || {}; }
export function recordResult(activityId, { errors = 0, revealed = 0, total = 0, perItem = [] }) {
  const pid = state.currentProfile;
  if (!pid) return;
  setState((s) => {
    const prev = (s.progress[pid] || {})[activityId] || { plays: 0, stars: 0 };
    const entry = {
      done: true,
      plays: prev.plays + 1,
      stars: 3, // jamais de note : finir une activité rapporte toujours 3 étoiles
      lastErrors: errors,
      lastRevealed: revealed,
      total,
      perItem,
      best: Math.min(prev.best ?? Infinity, errors + revealed * 2),
      firstAt: prev.firstAt || Date.now(),
      lastAt: Date.now()
    };
    return { progress: { ...s.progress, [pid]: { ...(s.progress[pid] || {}), [activityId]: entry } } };
  });
}
export function totalStars(s = state) {
  return Object.values(profileProgress(s)).reduce((n, e) => n + (e.stars || 0), 0);
}
export function resetProgress(pid) {
  setState((s) => { const progress = { ...s.progress }; delete progress[pid]; return { progress }; });
}

// Réglages
export function setSettings(patch) { setState((s) => ({ settings: { ...s.settings, ...patch } })); }

// Activités du parent
export function saveCustomActivity(a) { setState((s) => ({ custom: { ...s.custom, [a.id]: a } })); }
export function deleteCustomActivity(id) {
  setState((s) => { const custom = { ...s.custom }; delete custom[id]; return { custom }; });
}

// Sauvegarde / restauration (fichier JSON)
export function exportData() { return JSON.stringify({ app: 'mon-ecole', version: 1, data: state }, null, 2); }
export function importData(text) {
  const obj = JSON.parse(text);
  if (obj.app !== 'mon-ecole' || !obj.data) throw new Error('Fichier non reconnu');
  state = { ...defaults(), ...obj.data };
  persist();
}

// Point d'extension pour une synchronisation future (compte optionnel).
export const sync = {
  enabled: false,
  async push() { /* à brancher plus tard (ex. Supabase) */ },
  async pull() { /* à brancher plus tard */ }
};
