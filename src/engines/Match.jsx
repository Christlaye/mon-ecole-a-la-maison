import React, { useEffect, useRef, useState } from 'react';
import Visual from '../components/Visual.jsx';
import { Dots, Feedback } from '../components/ui.jsx';
import { speak, stop, chime } from '../lib/audio.js';
import { shuffle } from '../lib/content.js';
import { useTries } from './common.js';

const PAIR_COLORS = ['#F5B700', '#1D63C4', '#C2410C', '#7C3AED', '#0E7C66'];

/** Jeu d'association : toucher un élément à gauche puis son partenaire à droite. */
export default function Match({ items, onFinish }) {
  const [i, setI] = useState(0);
  const [right, setRight] = useState([]);
  const [left, setLeft] = useState([]);
  const [sel, setSel] = useState(null);
  const [done, setDone] = useState({}); // leftIndex -> color index
  const [hl, setHl] = useState(null);
  const t = useTries();
  const item = items[i];
  const doneCount = useRef(0);

  useEffect(() => {
    setLeft(shuffle(item.pairs.map((_, k) => k)));
    setRight(shuffle(item.pairs.map((_, k) => k)));
    setDone({}); setSel(null); setHl(null); doneCount.current = 0; t.clear();
    if (item.say) { const id = setTimeout(() => speak(item.say), 300); return () => clearTimeout(id); }
  }, [i]);

  const link = (k) => {
    const nd = { ...done, [k]: doneCount.current++ % PAIR_COLORS.length };
    setDone(nd); setSel(null); setHl(null);
    if (Object.keys(nd).length === item.pairs.length) {
      chime('win');
      setTimeout(() => {
        stop();
        if (i + 1 < items.length) setI(i + 1);
        else onFinish({ errors: t.stats.current.errors, revealed: t.stats.current.revealed, total: items.length, perItem: t.stats.current.perItem });
      }, 1300);
    }
  };

  const tapRight = (r) => {
    if (sel === null) { speak('Touche d’abord une image à gauche.'); return; }
    if (done[r] !== undefined) return;
    if (r === sel) { t.success(Object.keys(done).length + 1 < item.pairs.length); link(r); }
    else if (t.fail('Regarde bien : ils vont ensemble.', 'Voici les deux qui vont ensemble.')) {
      setHl(sel);
      setTimeout(() => link(sel), 1800);
    }
  };

  const cell = (k, side) => {
    const isDone = done[k] !== undefined;
    const color = isDone ? PAIR_COLORS[done[k]] : null;
    const active = side === 'L' ? sel === k : hl === k;
    return (
      <button key={side + k} onClick={() => (side === 'L' ? !isDone && setSel(k) : tapRight(k))}
        className={`flex min-h-[84px] items-center justify-center rounded-3xl border-4 bg-white p-2 shadow-[0_4px_0_rgba(0,0,0,.1)] ${active ? 'pulse border-soleil' : 'border-transparent'}`}
        style={isDone ? { borderColor: color, background: color + '22' } : undefined}>
        <Visual v={item.pairs[k]?.[side === 'L' ? 0 : 1]} size={52} />
        {isDone && <span className="ml-1 text-xl">✔️</span>}
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center px-3">
      <Dots n={items.length} i={i} />
      {item.say && <button onClick={() => speak(item.say)} className="mb-2 grid h-12 w-12 place-items-center rounded-full bg-soleil text-2xl shadow" aria-label="Réécouter">🔊</button>}
      <div className="grid w-full max-w-md grid-cols-2 gap-x-8 gap-y-3">
        <div className="flex flex-col gap-3">{left.map((k) => cell(k, 'L'))}</div>
        <div className="flex flex-col gap-3">{right.map((k) => cell(k, 'R'))}</div>
      </div>
      <Feedback fb={t.fb} />
    </div>
  );
}
