import React, { useEffect, useState } from 'react';
import { useStore, recordResult } from '../lib/store.js';
import { getActivity, subjectById } from '../lib/content.js';
import { playInstruction, stop } from '../lib/audio.js';
import { engines } from '../engines/index.js';
import { TopBar, Btn, LangToggle } from '../components/ui.jsx';
import { go } from '../router.js';

export default function Activity({ id }) {
  const s = useStore();
  const a = getActivity(id, s);
  const lang = s.settings.audioLang;
  const [phase, setPhase] = useState('intro');
  const [audioMode, setAudioMode] = useState(null);

  const play = async () => setAudioMode(await playInstruction(a, lang));
  useEffect(() => { if (a && s.settings.autoAudio) { const t = setTimeout(play, 300); return () => clearTimeout(t); } }, [id, lang]);

  if (!a) return (<main><TopBar title="Activité introuvable" /><p className="p-6 text-center">Cette activité n’existe plus.</p></main>);
  const Engine = engines[a.type];
  const sub = subjectById(a.subject);

  const finish = (stats) => {
    stop();
    recordResult(a.id, stats);
    go(`#/bravo/${a.id}`);
  };

  return (
    <main className="mx-auto min-h-screen max-w-xl pb-8">
      <TopBar title={`${a.icon} ${a.title.fr}`} back={`#/matiere/${a.subject}`} right={<LangToggle />} />
      {phase === 'intro' ? (
        <div className="flex flex-col items-center gap-5 px-4 pt-4 text-center">
          <span className="grid h-32 w-32 place-items-center rounded-[2rem] bg-white text-7xl shadow">{a.icon}</span>
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-slate-500">{sub?.label.fr} • Semaine {a.week}</p>
            <h2 className="text-3xl font-black">{a.title.fr}</h2>
            {lang !== 'fr' && a.title[lang] && <p className="text-lg font-semibold text-slate-600">{a.title[lang]}</p>}
          </div>
          <button onClick={play} className="flex items-center gap-3 rounded-3xl bg-white p-4 text-left shadow" aria-label="Écouter la consigne">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-soleil text-4xl">🔊</span>
            <span>
              <span className="block text-xl font-bold">{a.instruction.fr}</span>
              {lang !== 'fr' && a.instruction[lang] && <span className="mt-1 block text-lg font-semibold text-vert">{a.instruction[lang]}</span>}
              {lang !== 'fr' && audioMode === 'text' && <span className="mt-1 block text-xs text-slate-500">Audio en {lang === 'wo' ? 'wolof' : lang} pas encore enregistré : le parent lit la consigne.</span>}
            </span>
          </button>
          <Btn onClick={() => { stop(); setPhase('play'); }} color="vert" className="w-full max-w-xs text-2xl">C’est parti ! ▶️</Btn>
          <a href={`#/fiche/activite/${a.id}`} className="text-sm font-bold text-ciel underline">🖨️ Fiche à imprimer</a>
        </div>
      ) : (
        Engine ? <Engine activity={a} items={a.items} onFinish={finish} /> : <p className="p-6">Type d’activité inconnu : {a.type}</p>
      )}
    </main>
  );
}
