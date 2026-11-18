import React, { useEffect, useRef, useState } from 'react';
import Visual from '../components/Visual.jsx';
import { Btn, Dots, Feedback } from '../components/ui.jsx';
import { speak, stop, chime } from '../lib/audio.js';
import { shuffle } from '../lib/content.js';
import { useTries } from './common.js';

/** Jeu de tri : toucher un objet, puis la boîte qui lui correspond. */
export default function Sort({ items, onFinish }) {
  const [i, setI] = useState(0);
  const [objs, setObjs] = useState([]);
  const [sel, setSel] = useState(null);
  const [placed, setPlaced] = useState({}); // objIndex -> bin
  const [hl, setHl] = useState(null);
  const errs = useRef({});
  const t = useTries();
  const item = items[i];

  useEffect(() => {
    setObjs(shuffle(item.objects.map((o, k) => ({ ...o, k }))));
    setPlaced({}); setSel(null); setHl(null); errs.current = {}; t.clear();
    const id = setTimeout(() => speak(item.say || 'Range chaque image dans la bonne boîte.'), 300);
    return () => clearTimeout(id);
  }, [i]);

  const finishRound = (np) => {
    if (Object.keys(np).length === item.objects.length) {
      chime('win');
      setTimeout(() => {
        stop();
        if (i + 1 < items.length) setI(i + 1);
        else onFinish({ errors: t.stats.current.errors, revealed: t.stats.current.revealed, total: items.length, perItem: t.stats.current.perItem });
      }, 1400);
    }
  };

  const drop = (b) => {
    if (sel === null) { speak('Touche d’abord une image.'); return; }
    const o = item.objects[sel];
    if (o.bin === b) {
      const np = { ...placed, [sel]: b };
      setPlaced(np); setSel(null); setHl(null); t.success(Object.keys(np).length === item.objects.length);
      finishRound(np);
    } else {
      errs.current[sel] = (errs.current[sel] || 0) + 1;
      const label = item.bins[o.bin].label;
      if (t.fail(`Regarde bien la boîte : elle montre ce qui va ensemble.`, `Celui-ci va dans la boîte « ${label} ».`)) {
        setHl(o.bin);
        const np = { ...placed, [sel]: o.bin };
        setTimeout(() => { setPlaced(np); setSel(null); setHl(null); finishRound(np); }, 1800);
      }
    }
  };

  return (
    <div className="flex flex-col items-center px-3">
      <Dots n={items.length} i={i} />
      <button onClick={() => speak(item.say)} className="mb-2 grid h-12 w-12 place-items-center rounded-full bg-soleil text-2xl shadow" aria-label="Réécouter">🔊</button>
      <div className="flex min-h-[96px] w-full max-w-md flex-wrap justify-center gap-3 rounded-3xl bg-white p-3 shadow-sm">
        {objs.filter((o) => placed[o.k] === undefined).map((o) => (
          <button key={o.k} onClick={() => setSel(o.k)} aria-label="objet à ranger"
            className={`grid h-20 min-w-20 place-items-center rounded-2xl border-4 bg-creme px-1 ${sel === o.k ? 'scale-110 border-soleil shadow-lg' : 'border-transparent'}`}>
            <Visual v={o.v} size={52} />
          </button>
        ))}
        {objs.length > 0 && Object.keys(placed).length === item.objects.length && <span className="self-center text-4xl">🎉</span>}
      </div>
      <p className="my-2 text-base font-bold text-slate-600">{sel === null ? '1. Touche une image' : '2. Touche la bonne boîte 👇🏾'}</p>
      <div className={`grid w-full max-w-md gap-3 ${item.bins.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {item.bins.map((b, k) => (
          <button key={k} onClick={() => drop(k)}
            className={`flex min-h-[170px] flex-col items-center rounded-3xl border-4 border-dashed bg-white p-2 ${hl === k ? 'pulse border-vert' : sel !== null ? 'border-soleil' : 'border-slate-300'}`}>
            <span className="rounded-2xl bg-slate-100 p-2"><Visual v={b.v} size={44} /></span>
            <span className="mt-1 text-sm font-black uppercase text-slate-600">{b.label}</span>
            <span className="mt-1 flex flex-wrap justify-center gap-1">
              {Object.entries(placed).filter(([, bin]) => bin === k).map(([ok]) => <Visual key={ok} v={item.objects[ok]?.v} size={30} />)}
            </span>
          </button>
        ))}
      </div>
      <Feedback fb={t.fb} />
    </div>
  );
}
