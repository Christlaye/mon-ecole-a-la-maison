import React, { useEffect, useState } from 'react';
import { useStore, setSettings } from '../lib/store.js';
import { playInstruction, speak, stop } from '../lib/audio.js';
import { phrases } from '../lib/content.js';
import { go } from '../router.js';

export function Btn({ children, className = '', color = 'vert', ...p }) {
  const colors = {
    vert: 'bg-vert text-white', soleil: 'bg-soleil text-ink', terre: 'bg-terre text-white', ciel: 'bg-ciel text-white',
    violet: 'bg-violet text-white', blanc: 'bg-white text-ink border-2 border-ink/15', gris: 'bg-slate-200 text-ink'
  };
  return (
    <button {...p} className={`min-h-[56px] rounded-2xl px-5 py-3 text-lg font-extrabold shadow-[0_4px_0_rgba(0,0,0,.18)] active:translate-y-0.5 active:shadow-none disabled:opacity-40 ${colors[color] || color} ${className}`}>
      {children}
    </button>
  );
}

export function TopBar({ title, back = '#/', right }) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 bg-creme/95 px-3 py-2 backdrop-blur">
      <a href={back} onClick={stop} className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-3xl shadow" aria-label="Retour">⬅️</a>
      <h1 className="flex-1 truncate text-center text-xl font-black text-ink">{title}</h1>
      {right || <a href="#/" onClick={stop} className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-3xl shadow" aria-label="Accueil">🏠</a>}
    </header>
  );
}

/** Bouton haut-parleur : rejoue la consigne (ou un texte) dans la langue choisie. */
export function SpeakBtn({ activity, text, size = 'lg', className = '' }) {
  const lang = useStore((s) => s.settings.audioLang);
  const [showWo, setShowWo] = useState(false);
  const onClick = async () => {
    if (text) { speak(text); return; }
    const r = await playInstruction(activity, lang);
    setShowWo(r === 'text' && lang !== 'fr');
  };
  return (
    <span className={`inline-flex flex-col items-center ${className}`}>
      <button onClick={onClick} aria-label="Écouter la consigne"
        className={`grid place-items-center rounded-full bg-soleil shadow-[0_4px_0_rgba(0,0,0,.2)] active:translate-y-0.5 ${size === 'lg' ? 'h-16 w-16 text-4xl' : 'h-12 w-12 text-2xl'}`}>🔊</button>
      {showWo && activity?.instruction?.[lang] && (
        <span className="mt-2 max-w-xs rounded-xl bg-white px-3 py-2 text-center text-base font-bold text-ink shadow">
          {activity.instruction[lang]}<br /><span className="text-xs font-normal text-slate-500">(audio {lang} à venir : le parent lit la consigne)</span>
        </span>
      )}
    </span>
  );
}

export function LangToggle() {
  const lang = useStore((s) => s.settings.audioLang);
  return (
    <button onClick={() => setSettings({ audioLang: lang === 'fr' ? 'wo' : 'fr' })}
      className="h-14 min-w-14 shrink-0 rounded-2xl bg-white px-2 text-sm font-black text-ink shadow" aria-label="Changer la langue des consignes">
      {lang === 'fr' ? 'FR' : 'WO'}<span className="block text-[10px] font-semibold text-slate-500">🔊 langue</span>
    </button>
  );
}

export function Dots({ n, i }) {
  return (
    <div className="flex justify-center gap-2 py-2" aria-label={`Étape ${i + 1} sur ${n}`}>
      {Array.from({ length: n }, (_, k) => (
        <span key={k} className={`h-3 w-3 rounded-full ${k < i ? 'bg-vert' : k === i ? 'bg-soleil ring-2 ring-ink/30' : 'bg-slate-300'}`} />
      ))}
    </div>
  );
}

/** Bandeau de retour (bravo / encouragement / réponse) */
export function Feedback({ fb }) {
  const lang = useStore((s) => s.settings.audioLang);
  if (!fb) return <div className="h-16" />;
  const styles = { ok: 'bg-vert text-white', try: 'bg-soleil-clair text-ink border-2 border-soleil', show: 'bg-ciel-clair text-ink border-2 border-ciel' };
  return (
    <div className={`pop mx-auto my-2 max-w-md rounded-2xl px-4 py-3 text-center text-lg font-extrabold ${styles[fb.kind]}`} role="status" aria-live="polite">
      <span className="mr-1 text-2xl">{fb.kind === 'ok' ? '🌟' : fb.kind === 'try' ? '💪🏾' : '👀'}</span>
      {fb.text}
      {lang !== 'fr' && fb.wo && <div className="text-sm font-semibold opacity-80">{fb.wo}</div>}
      {fb.hint && <div className="mt-1 text-base font-semibold">💡 {fb.hint}</div>}
    </div>
  );
}

let pIdx = 0;
export const praise = () => phrases.praise[pIdx++ % phrases.praise.length];
let eIdx = 0;
export const encourage = () => phrases.encourage[eIdx++ % phrases.encourage.length];

export function Confetti() {
  const [items] = useState(() => Array.from({ length: 18 }, (_, i) => ({ left: Math.random() * 100, delay: Math.random() * 0.6, e: ['⭐', '🌟', '✨', '🎉'][i % 4] })));
  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden>
      {items.map((it, i) => <span key={i} className="fall absolute text-3xl" style={{ left: it.left + '%', animationDelay: it.delay + 's' }}>{it.e}</span>)}
    </div>
  );
}

export function useAutoSay(text, deps) {
  useEffect(() => { if (text) { const t = setTimeout(() => speak(text), 250); return () => clearTimeout(t); } }, deps);
}

export function Card({ children, className = '' }) {
  return <div className={`rounded-3xl bg-white p-4 shadow-sm ${className}`}>{children}</div>;
}

export function goHome() { go('#/'); }
