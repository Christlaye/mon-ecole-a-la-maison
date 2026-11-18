import React, { useEffect } from 'react';
import { useStore, currentProfile } from '../lib/store.js';
import { getActivity, allActivities, phrases } from '../lib/content.js';
import { speak, chime } from '../lib/audio.js';
import { Btn, Confetti } from '../components/ui.jsx';
import { go } from '../router.js';

export default function Bravo({ id }) {
  const s = useStore();
  const p = currentProfile(s);
  const a = getActivity(id, s);
  const lang = s.settings.audioLang;
  const list = allActivities(s);
  const next = list[list.findIndex((x) => x.id === id) + 1];

  useEffect(() => { chime('win'); const t = setTimeout(() => speak(`Bravo ${p?.name || ''} ! Tu as gagné trois étoiles !`), 400); return () => clearTimeout(t); }, []);
  if (!a) return null;
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-4 px-4 py-8 text-center">
      <Confetti />
      <div className="pop text-8xl">{p?.avatar || '🎉'}</div>
      <h1 className="text-4xl font-black text-vert">{phrases.bravoTitle.fr} {p?.name}</h1>
      {lang !== 'fr' && <p className="text-xl font-bold">{phrases.bravoTitle[lang]}</p>}
      <p className="text-xl font-bold">{phrases.bravoText.fr}</p>
      <div className="flex gap-2 text-6xl">{['⭐', '⭐', '⭐'].map((x, i) => <span key={i} className="pop" style={{ animationDelay: `${0.2 + i * 0.25}s` }}>{x}</span>)}</div>

      {a.offscreen?.fr && (
        <div className="w-full rounded-3xl border-2 border-violet/30 bg-violet-clair p-4 text-left">
          <p className="text-sm font-black uppercase tracking-wide text-violet">👨🏾‍👧🏾 Hors écran, pour le parent</p>
          <p className="mt-1 text-base font-semibold">{a.offscreen.fr}</p>
          {lang !== 'fr' && a.offscreen[lang] && <p className="mt-1 text-sm text-slate-600">{a.offscreen[lang]}</p>}
        </div>
      )}

      <div className="mt-2 grid w-full gap-3">
        {next && <Btn color="soleil" className="text-xl" onClick={() => go(`#/activite/${next.id}`)}>Activité suivante {next.icon} ➡️</Btn>}
        <div className="grid grid-cols-2 gap-3">
          <Btn color="blanc" onClick={() => go(`#/activite/${a.id}`)}>🔁 Rejouer</Btn>
          <Btn color="vert" onClick={() => go('#/')}>🏠 Accueil</Btn>
        </div>
        <a href={`#/fiche/activite/${a.id}`} className="font-bold text-ciel underline">🖨️ Fiche à imprimer</a>
      </div>
    </main>
  );
}
