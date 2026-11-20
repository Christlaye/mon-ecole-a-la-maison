// « Révision du jour » : les leçons vues en classe, ajoutées par le parent (texte + photos du tableau).
// - Révisions d'exemple : src/data/revisions.json (texte seulement, aucune photo de la classe en ligne).
// - Révisions du parent : state.revisions (localStorage) ; photos dans IndexedDB (clé "photo:<id>:<n>").
import seed from '../data/revisions.json';
import { getState, setState, currentProfile } from './store.js';
import { clips } from './idb.js';
import { fillName, shuffle } from './content.js';

export const REV_SUBJECTS = [
  { id: 'lecture', label: 'Lecture', icon: '📖', color: 'bg-vert', app: 'lecture' },
  { id: 'oral', label: 'Communication orale', icon: '🗣️', color: 'bg-ciel', app: 'francais' },
  { id: 'ecriture', label: 'Écriture', icon: '✏️', color: 'bg-vert', app: 'lecture' },
  { id: 'maths', label: 'Activités numériques', icon: '🔢', color: 'bg-terre', app: 'maths' },
  { id: 'geometrie', label: 'Activités géométriques', icon: '📐', color: 'bg-terre', app: 'maths' },
  { id: 'histoire', label: 'Histoire', icon: '🕰️', color: 'bg-violet', app: 'decouverte' },
  { id: 'geographie', label: 'Géographie', icon: '🗺️', color: 'bg-violet', app: 'decouverte' },
  { id: 'ist', label: 'I.S.T. (sciences et techniques)', icon: '🔧', color: 'bg-violet', app: 'decouverte' },
  { id: 'autre', label: 'Autre', icon: '📝', color: 'bg-ciel', app: 'decouverte' }
];
export const revSubject = (id) => REV_SUBJECTS.find((x) => x.id === id) || REV_SUBJECTS[REV_SUBJECTS.length - 1];

export const todayISO = () => {
  const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

/** Toutes les révisions (exemples + parent), la plus récente d'abord, prénom de l'enfant inséré. */
export function allRevisions(s = getState()) {
  const map = new Map(seed.map((r) => [r.id, { ...r, seed: true }]));
  Object.values(s.revisions || {}).forEach((r) => map.set(r.id, r));
  const hidden = s.revisionsHidden || [];
  const name = currentProfile(s)?.name || 'Awa';
  return [...map.values()]
    .filter((r) => !hidden.includes(r.id))
    .map((r) => ({ ...r, title: fillName(r.title, name), lines: (r.lines || []).map((l) => fillName(l, name)) }))
    .sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0));
}
export const getRevision = (id, s) => allRevisions(s).find((r) => r.id === id);
/** Version brute (avec {nom}) pour l'éditeur du parent. */
export const rawRevision = (id, s = getState()) => (s.revisions || {})[id] || (seed.find((r) => r.id === id) && { ...seed.find((r) => r.id === id), seed: true });
export const newRevisionId = () => `p-${Date.now().toString(36)}`;

/** Révisions du jour : celles de la date la plus récente (jusqu'à aujourd'hui). */
export function revisionsOfTheDay(s = getState()) {
  const t = todayISO();
  const list = allRevisions(s).filter((r) => r.date <= t);
  if (!list.length) return [];
  return list.filter((r) => r.date === list[0].date);
}

export function saveRevision(r) {
  setState((s) => ({ revisions: { ...(s.revisions || {}), [r.id]: r } }));
}
export async function deleteRevision(r) {
  if (r.seed) setState((s) => ({ revisionsHidden: [...(s.revisionsHidden || []), r.id] }));
  setState((s) => { const rv = { ...(s.revisions || {}) }; delete rv[r.id]; return { revisions: rv }; });
  for (const k of r.photos || []) await clips.del(k);
}

/** Photo du tableau : réduite (1280 px max, JPEG) pour ne pas remplir le téléphone. */
export async function savePhoto(revId, file) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  const k = Math.min(1, 1280 / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(img.src);
  const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.78));
  const key = `photo:${revId}:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  await clips.set(key, blob);
  return key;
}
export async function photoUrl(key) {
  const b = await clips.get(key);
  return b ? URL.createObjectURL(b) : null;
}

const cleanWord = (w) => w.toLowerCase().replace(/^[ldcjmnst]'/, '').replace(/[^a-zàâäçéèêëîïôöùûüÿœ'-]/gi, '').replace(/^-+|-+$/g, '');

/** Mots lisibles d'une révision (pour le jeu « Touche le mot »). */
export function revisionWords(r) {
  const seen = new Set();
  const out = [];
  (r.lines || []).forEach((l) => l.split(/[\s,.;:!?«»()/]+/).forEach((raw) => {
    const w = cleanWord(raw);
    if (w.length >= 2 && !seen.has(w)) { seen.add(w); out.push(w); }
  }));
  return out;
}

/** Petit jeu généré : questions écrites par le parent / l'exemple, puis « touche le mot », puis lettres. */
export function revisionActivity(r) {
  if (!r) return null;
  const items = [...(r.items || [])];
  const words = revisionWords(r);
  if (words.length >= 3) {
    const targets = shuffle(words.filter((w) => w.length >= 3).length >= 3 ? words.filter((w) => w.length >= 3) : words).slice(0, Math.max(2, 5 - items.length));
    targets.forEach((w) => {
      const others = shuffle(words.filter((x) => x !== w)).slice(0, 2);
      const options = shuffle([w, ...others]);
      items.push({ say: `Touche le mot : ${w}.`, options: options.map((o) => `big:${o}`), answer: options.indexOf(w), hint: `Écoute bien : ${w}. Regarde la première lettre : ${w[0]}.` });
    });
  }
  const letters = (r.letters || '').split(/[\s,-]+/).filter((x) => /^\p{L}$/u.test(x));
  if (letters.length >= 3) {
    shuffle(letters).slice(0, 3).forEach((L) => {
      const others = shuffle(letters.filter((x) => x !== L)).slice(0, 2);
      const options = shuffle([L, ...others]);
      items.push({ say: `Touche la lettre ${L.toLowerCase()}.`, options: options.map((o) => `big:${o}`), answer: options.indexOf(L) });
    });
  }
  if (!items.length) return null;
  const sub = revSubject(r.subject);
  return {
    id: `rev-${r.id}`,
    revision: r.id,
    back: `#/revision/${r.id}`,
    type: 'choice',
    subject: sub.app,
    week: 0,
    icon: sub.icon,
    title: { fr: r.title },
    instruction: { fr: 'Écoute bien et touche la bonne réponse.', wo: 'Déglul bu baax te laal tontu bi baax.' },
    items: items.slice(0, 7),
    offscreen: r.tip ? { fr: r.tip } : undefined
  };
}

// Le jeu est tiré au hasard une seule fois par révision (sinon il changerait à chaque affichage).
const gameCache = new Map();
export function revisionActivityById(actId, s = getState()) {
  if (!actId?.startsWith('rev-')) return null;
  const r = getRevision(actId.slice(4), s);
  if (!r) return null;
  const key = JSON.stringify(r);
  const hit = gameCache.get(actId);
  if (hit && hit.key === key) return hit.a;
  const a = revisionActivity(r);
  gameCache.set(actId, { key, a });
  return a;
}
