import builtIn from '../data/activities.json';
import subjects from '../data/subjects.json';
import phrases from '../data/phrases.json';
import drawings from '../data/drawings.json';
import { getState, profileProgress, currentProfile } from './store.js';
import { revisionActivityById } from './revisions.js';

export { subjects, phrases, drawings };

// Niveaux proposés. Une activité sans champ « level » est du CI.
export const LEVELS = ['CI', 'CP', 'CE1'];
export const normLevel = (l) => (LEVELS.includes(l) ? l : 'CI'); // ancien « Grande section » → CI
export const actLevel = (a) => normLevel(a.level);
/** Niveau dont on montre les activités : celui de l'enfant s'il a déjà du contenu, sinon le CI. */
export function levelInfo(s = getState()) {
  const wanted = normLevel(currentProfile(s)?.level);
  const ready = rawActivities(s).some((a) => actLevel(a) === wanted);
  return { wanted, shown: ready ? wanted : 'CI', ready };
}

function rawActivities(s) {
  const map = new Map(builtIn.map((a) => [a.id, a]));
  Object.values(s.custom || {}).forEach((a) => map.set(a.id, a));
  return [...map.values()].filter((a) => !a.hidden).sort((a, b) => a.week - b.week || order(a) - order(b));
}

// Le prénom de l'enfant remplace {nom} / {prenom} / {PRENOM} : l'enfant est le héros des histoires.
let cache = { key: null, list: null };
export function allActivities(s = getState(), { raw = false, allLevels = false } = {}) {
  if (raw) return rawActivities(s);
  const name = currentProfile(s)?.name || 'Awa';
  const level = allLevels ? '*' : levelInfo(s).shown;
  if (cache.key && cache.key[0] === name && cache.key[1] === s.custom && cache.key[2] === level) return cache.list;
  const safe = JSON.stringify(name).slice(1, -1); // échappe les guillemets éventuels
  const acts = rawActivities(s).filter((a) => level === '*' || actLevel(a) === level);
  const list = JSON.parse(fillName(JSON.stringify(acts), safe));
  cache = { key: [name, s.custom, level], list };
  return list;
}
const subjOrder = { francais: 0, maths: 1, lecture: 2, decouverte: 3 };
const order = (a) => subjOrder[a.subject] ?? 9;

export const isBuiltIn = (id) => builtIn.some((a) => a.id === id);
export const builtInById = (id) => builtIn.find((a) => a.id === id);
export const getActivity = (id, s, opts) => allActivities(s, { allLevels: true, ...opts }).find((a) => a.id === id) || revisionActivityById(id, s);
export const subjectById = (id) => subjects.find((x) => x.id === id);

/** Activité du jour : la première non terminée dans l'ordre des semaines. */
export function activityOfTheDay(s = getState()) {
  const prog = profileProgress(s);
  const list = allActivities(s);
  const next = list.find((a) => !prog[a.id]?.done);
  if (next) return next;
  // tout est fini : on propose une révision différente chaque jour
  const day = Math.floor(Date.now() / 86400000);
  return list[day % list.length];
}

export function currentWeek(s = getState()) {
  return activityOfTheDay(s)?.week || 1;
}

/** Remplace {prenom} / {PRENOM} par le prénom de l'enfant. */
export function fillName(text, name = 'Awa') {
  if (!text) return text;
  return text.replace(/\{nom\}/g, name).replace(/\{prenom\}/g, name.toLowerCase()).replace(/\{PRENOM\}/g, name.toUpperCase());
}

export function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
