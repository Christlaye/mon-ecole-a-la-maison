import React, { useEffect, useState } from 'react';
import Visual from '../components/Visual.jsx';
import { Btn, Dots, Feedback } from '../components/ui.jsx';
import { speak, stop } from '../lib/audio.js';
import { shuffle } from '../lib/content.js';
import { useTries } from './common.js';

/** QCM visuel : écouter / regarder, puis toucher la bonne image. */
export default function Choice({ items, onFinish, startSay = true }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState([]); // index des mauvaises réponses déjà touchées
  const [state, setState] = useState('ask'); // ask | ok | shown
  const t = useTries();
  const item = items[i];

  // options mélangées une fois par question (on garde l'index d'origine)
  const [order, setOrder] = useState([]);
  useEffect(() => {
    setOrder(item.shuffle === false ? item.options.map((_, k) => k) : shuffle(item.options.map((_, k) => k)));
    setPicked([]); setState('ask'); t.clear();
    if (startSay && item.say && item.autoSay !== false) { const id = setTimeout(() => speak(item.say), 350); return () => clearTimeout(id); }
  }, [i]);

  const next = () => {
    stop();
    if (i + 1 < items.length) setI(i + 1);
    else onFinish({ errors: t.stats.current.errors, revealed: t.stats.current.revealed, total: items.length, perItem: t.stats.current.perItem });
  };

  const choose = (k) => {
    if (state !== 'ask' || picked.includes(k)) return;
    if (k === item.answer) {
      setState('ok'); t.success();
      setTimeout(next, 1500);
    } else {
      setPicked([...picked, k]);
      if (t.fail(item.hint, item.explain, Math.min(3, item.options.length - 1))) setState('shown');
    }
  };

  const many = item.options.length > 3;
  return (
    <div className="flex flex-col items-center">
      <Dots n={items.length} i={i} />
      <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 px-2 text-center">
        {item.prompt && <Visual v={item.prompt} size={item.prompt.startsWith('t:') ? 90 : 64} />}
        <div className="flex items-center gap-3">
          {item.say && (
            <button onClick={() => speak(item.say)} className="grid h-14 w-14 place-items-center rounded-full bg-soleil text-3xl shadow" aria-label="Réécouter">🔊</button>
          )}
          {item.label && <span className="rounded-xl bg-white px-3 py-1 text-xl font-black text-ink">{item.label}</span>}
        </div>
      </div>
      <div className={`mt-3 grid w-full max-w-md gap-3 px-3 ${many ? 'grid-cols-2' : item.options.length === 2 ? 'grid-cols-2' : 'grid-cols-1 xs:grid-cols-3 sm:grid-cols-3'}`}>
        {order.map((k) => {
          const isAnswer = k === item.answer;
          const wrong = picked.includes(k);
          const highlight = (state === 'ok' || state === 'shown') && isAnswer;
          return (
            <button key={k} onClick={() => choose(k)} disabled={wrong}
              className={`flex min-h-[96px] items-center justify-center rounded-3xl border-4 bg-white p-3 shadow-[0_5px_0_rgba(0,0,0,.12)] transition active:translate-y-1
                ${highlight ? 'pulse border-vert bg-vert-clair' : wrong ? 'shake border-slate-200 opacity-40' : 'border-transparent'}`}
              aria-label={`Réponse ${k + 1}`}>
              <Visual v={item.options[k]} size={60} />
            </button>
          );
        })}
      </div>
      <Feedback fb={t.fb} />
      {state === 'shown' && <Btn onClick={next} color="ciel" className="mb-4">On continue ➡️</Btn>}
    </div>
  );
}
