import React, { useEffect, useState } from 'react';
import { Btn, Dots, Feedback } from '../components/ui.jsx';
import { speak, sayNumber, stop } from '../lib/audio.js';
import { useTries } from './common.js';

/** Jeu de comptage : toucher chaque objet (mode tap) ou remplir le panier (mode make). */
export default function Count({ items, onFinish }) {
  const [i, setI] = useState(0);
  const [tapped, setTapped] = useState([]);
  const [made, setMade] = useState(0);
  const [state, setState] = useState('ask');
  const [wrong, setWrong] = useState([]);
  const t = useTries();
  const item = items[i];

  useEffect(() => {
    setTapped([]); setMade(0); setState('ask'); setWrong([]); t.clear();
    const say = item.say || (item.mode === 'make' ? `Mets ${item.n} ${item.label} dans le panier.` : `Combien de ${item.label} ? Touche chaque objet pour compter.`);
    const id = setTimeout(() => speak(say), 300);
    return () => clearTimeout(id);
  }, [i]);

  const next = () => {
    stop();
    if (i + 1 < items.length) setI(i + 1);
    else onFinish({ errors: t.stats.current.errors, revealed: t.stats.current.revealed, total: items.length, perItem: t.stats.current.perItem });
  };

  const tap = (k) => {
    if (state !== 'ask' || tapped.includes(k)) return;
    const nt = [...tapped, k];
    setTapped(nt);
    sayNumber(nt.length);
  };
  const answer = (n) => {
    if (state !== 'ask' || wrong.includes(n)) return;
    if (n === item.n) { setState('ok'); setTapped(Array.from({ length: item.n }, (_, k) => k)); t.success(); setTimeout(next, 1600); }
    else {
      setWrong([...wrong, n]);
      setTapped([]);
      if (t.fail('Recompte en touchant chaque objet, un par un.', `Il y en a ${item.n}. Comptons ensemble !`, Math.min(3, item.options.length - 1))) {
        setState('shown');
        setTapped(Array.from({ length: item.n }, (_, k) => k));
      }
    }
  };
  const check = () => {
    if (made === item.n) { setState('ok'); t.success(); setTimeout(next, 1600); }
    else if (t.fail(made < item.n ? 'Il en manque. Ajoute encore.' : 'Il y en a trop. Enlève-en.', `Il en faut ${item.n}. Regarde !`)) { setState('shown'); setMade(item.n); }
  };

  const objSize = item.n > 12 ? 'text-3xl' : item.n > 6 ? 'text-4xl' : 'text-5xl';
  return (
    <div className="flex flex-col items-center px-3">
      <Dots n={items.length} i={i} />
      {item.mode === 'make' ? (
        <>
          <div className="mb-2 flex items-center gap-3">
            <span className="rounded-2xl bg-white px-5 py-2 text-5xl font-black text-ink shadow">{item.n}</span>
            <button onClick={() => speak(item.say || '')} className="grid h-14 w-14 place-items-center rounded-full bg-soleil text-3xl shadow" aria-label="Réécouter">🔊</button>
          </div>
          <div className="relative mt-2 flex min-h-[170px] w-full max-w-md flex-wrap content-start items-start justify-center gap-1 rounded-[2.5rem] border-4 border-amber-700 bg-amber-100 p-4" aria-label="panier">
            {Array.from({ length: made }, (_, k) => <span key={k} className={`pop ${objSize}`}>{item.object}</span>)}
            {made === 0 && <span className="self-center text-6xl opacity-30">🧺</span>}
          </div>
          <div className="mt-4 flex items-center gap-4">
            <Btn color="blanc" onClick={() => { if (state === 'ask' && made > 0) { setMade(made - 1); sayNumber(made - 1); } }} className="text-3xl" aria-label="Enlever">➖</Btn>
            <span className="w-14 text-center text-4xl font-black">{made}</span>
            <Btn color="soleil" onClick={() => { if (state === 'ask' && made < 20) { setMade(made + 1); sayNumber(made + 1); } }} className="text-3xl" aria-label="Ajouter">➕ {item.object}</Btn>
          </div>
          {state === 'ask' && <Btn onClick={check} className="mt-4">C'est bon ! ✅</Btn>}
        </>
      ) : (
        <>
          <div className="flex w-full max-w-md flex-wrap justify-center gap-2 rounded-3xl bg-white p-3 shadow-sm">
            {Array.from({ length: item.n }, (_, k) => {
              const idx = tapped.indexOf(k);
              return (
                <button key={k} onClick={() => tap(k)} className={`relative grid h-16 w-16 place-items-center rounded-2xl ${idx >= 0 ? 'bg-vert-clair' : 'bg-creme'} ${objSize}`} aria-label="objet à compter">
                  {item.object}
                  {idx >= 0 && <span className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-vert text-sm font-black text-white">{idx + 1}</span>}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-lg font-bold text-ink">Combien ? 👇🏾</p>
          <div className="mt-2 grid w-full max-w-md grid-cols-3 gap-3">
            {item.options.map((n) => (
              <button key={n} onClick={() => answer(n)} disabled={wrong.includes(n)}
                className={`min-h-[84px] rounded-3xl border-4 bg-white text-5xl font-black shadow-[0_5px_0_rgba(0,0,0,.12)] ${state !== 'ask' && n === item.n ? 'pulse border-vert bg-vert-clair' : wrong.includes(n) ? 'shake border-slate-200 opacity-40' : 'border-transparent'}`}>{n}</button>
            ))}
          </div>
        </>
      )}
      <Feedback fb={t.fb} />
      {state === 'shown' && <Btn onClick={next} color="ciel" className="mb-4">On continue ➡️</Btn>}
    </div>
  );
}
