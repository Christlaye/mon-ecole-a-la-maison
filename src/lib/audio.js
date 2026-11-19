// Consignes audio.
// - Français : synthèse vocale du navigateur (aucun fichier à télécharger).
// - Wolof et autres langues nationales : enregistrement du parent (IndexedDB)
//   ou fichier déclaré dans data/audio-manifest.json. Sinon, on renvoie false
//   et l'interface affiche le texte pour que le parent le lise.
import manifest from '../data/audio-manifest.json';
import languages from '../data/languages.json';
import { clips } from './idb.js';
import { getState } from './store.js';

let current = null;

export function stop() {
  try { window.speechSynthesis?.cancel(); } catch {}
  if (current) { current.pause(); current = null; }
}

let frVoice = null;
function pickVoice() {
  const vs = window.speechSynthesis?.getVoices?.() || [];
  frVoice = vs.find((v) => /fr[-_]FR/i.test(v.lang)) || vs.find((v) => /^fr/i.test(v.lang)) || null;
}
if (typeof window !== 'undefined' && window.speechSynthesis) {
  pickVoice();
  window.speechSynthesis.onvoiceschanged = pickVoice;
}

export function canSpeak() { return typeof window !== 'undefined' && 'speechSynthesis' in window; }

export function speak(text, { rate } = {}) {
  if (!text || !canSpeak()) return Promise.resolve(false);
  stop();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ''));
    u.lang = 'fr-FR';
    if (frVoice) u.voice = frVoice;
    u.rate = rate ?? getState().settings.rate ?? 0.9;
    u.pitch = 1.05;
    u.onend = () => resolve(true);
    u.onerror = () => resolve(false);
    window.speechSynthesis.speak(u);
  });
}

function playUrl(url) {
  stop();
  return new Promise((resolve) => {
    const a = new Audio(url);
    current = a;
    a.onended = () => resolve(true);
    a.onerror = () => resolve(false);
    a.play().catch(() => resolve(false));
  });
}

export const clipKey = (lang, id) => `${lang}:${id}`;

/** Cherche un audio enregistré/déclaré pour (langue, id). */
export async function findClip(lang, id, activity) {
  const blob = await clips.get(clipKey(lang, id));
  if (blob) return URL.createObjectURL(blob);
  const fromActivity = activity?.audio?.[lang];
  if (fromActivity) return fromActivity;
  const fromManifest = manifest[lang]?.[id];
  return fromManifest || null;
}

/**
 * Joue la consigne d'une activité dans la langue choisie.
 * Retourne 'audio' | 'tts' | 'text' (texte seulement : pas d'audio dispo).
 */
export async function playInstruction(activity, lang = getState().settings.audioLang) {
  const lg = languages.find((l) => l.code === lang) || languages[0];
  if (lang !== 'fr') {
    const url = await findClip(lang, activity.id, activity);
    if (url && (await playUrl(url))) return 'audio';
    if (!lg.tts) return 'text';
  }
  const ok = await speak(activity.instruction?.fr);
  return ok ? 'tts' : 'text';
}

export async function playPhrase(id, phrase, lang = getState().settings.audioLang) {
  if (lang !== 'fr') {
    const url = await findClip(lang, id);
    if (url && (await playUrl(url))) return 'audio';
    return 'text';
  }
  return (await speak(phrase.fr)) ? 'tts' : 'text';
}

/**
 * Dit une petite phrase (bravo, encouragement…) : la voix wolof enregistrée si
 * la langue choisie est le wolof et qu'elle existe, sinon la voix française.
 */
export async function sayPhrase(phrase, { extraFr = '', rate } = {}) {
  const lang = getState().settings.audioLang;
  if (lang !== 'fr' && phrase.id) {
    const url = await findClip(lang, phrase.id);
    if (url && (await playUrl(url))) return 'audio';
  }
  return (await speak(phrase.fr + (extraFr ? ' ' + extraFr : ''), { rate })) ? 'tts' : 'text';
}

/** Liste de toutes les phrases à enregistrer dans une langue (studio). */
export function phraseSlots(phrases) {
  return [
    { id: '_welcome', label: 'Accueil', p: phrases.welcome },
    { id: '_bravo', label: 'Fin d’activité', p: phrases.bravoText },
    ...phrases.praise.map((p, k) => ({ id: `_praise-${k}`, label: `Bravo n°${k + 1}`, p })),
    ...phrases.encourage.map((p, k) => ({ id: `_encourage-${k}`, label: `Encouragement n°${k + 1}`, p })),
    { id: '_reveal', label: 'Réponse montrée', p: phrases.reveal }
  ];
}

const NUMS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf', 'vingt'];
export const sayNumber = (n) => speak(NUMS[n] ?? String(n), { rate: 1 });

// Petits sons (sans fichier) pour le retour immédiat
let ctx = null;
export function chime(kind = 'ok') {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = kind === 'ok' ? [660, 880] : kind === 'win' ? [523, 659, 784, 1046] : [330];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      const t = ctx.currentTime + i * 0.12;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.3);
    });
  } catch {}
}

/** Enregistrement micro (MediaRecorder) */
export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream);
  const chunks = [];
  rec.ondataavailable = (e) => chunks.push(e.data);
  rec.start();
  return () => new Promise((resolve) => {
    rec.onstop = () => { stream.getTracks().forEach((t) => t.stop()); resolve(new Blob(chunks, { type: rec.mimeType || 'audio/webm' })); };
    rec.stop();
  });
}
export { playUrl };
