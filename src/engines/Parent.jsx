import React, { useEffect, useState } from 'react';
import Visual from '../components/Visual.jsx';
import { Btn, Dots } from '../components/ui.jsx';
import { speak, stop, chime } from '../lib/audio.js';

/** Activité guidée par le parent (oral, motricité, hors écran). */
export default function Parent({ items, onFinish }) {
  const [i, setI] = useState(0);
  const item = items[i];
  useEffect(() => { const id = setTimeout(() => speak(item.text), 300); return () => clearTimeout(id); }, [i]);
  const next = () => {
    stop(); chime('ok');
    if (i + 1 < items.length) setI(i + 1);
    else onFinish({ errors: 0, revealed: 0, total: items.length, perItem: [] });
  };
  return (
    <div className="flex flex-col items-center px-3">
      <Dots n={items.length} i={i} />
      <div className="flex min-h-[150px] w-full max-w-md items-center justify-center rounded-3xl bg-white p-4 shadow-sm">
        <Visual v={item.v} size={64} />
      </div>
      <div className="mt-4 w-full max-w-md rounded-3xl border-2 border-violet/30 bg-violet-clair p-4">
        <p className="text-sm font-black uppercase tracking-wide text-violet">👨🏾‍👧🏾 Pour le parent</p>
        <p className="mt-1 text-lg font-semibold text-ink">{item.text}</p>
      </div>
      <div className="mt-4 flex gap-3">
        <button onClick={() => speak(item.text)} className="grid h-14 w-14 place-items-center rounded-full bg-soleil text-3xl shadow" aria-label="Écouter">🔊</button>
        <Btn color="vert" onClick={next}>C'est fait ✅</Btn>
      </div>
    </div>
  );
}
