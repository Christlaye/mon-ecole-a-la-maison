import React, { useEffect, useState } from 'react';
import Visual from '../components/Visual.jsx';
import { Btn, Dots } from '../components/ui.jsx';
import { speak, stop } from '../lib/audio.js';
import Choice from './Choice.jsx';

/** Mini-histoire audio : pages illustrées lues à voix haute, puis questions. */
export default function Story({ activity, onFinish }) {
  const pages = activity.pages || [];
  const [p, setP] = useState(0);
  const [phase, setPhase] = useState('story');

  useEffect(() => {
    if (phase !== 'story') return;
    const id = setTimeout(() => speak(pages[p].text), 300);
    return () => clearTimeout(id);
  }, [p, phase]);

  if (phase === 'questions') return <Choice items={activity.items} onFinish={onFinish} />;

  const page = pages[p];
  return (
    <div className="flex flex-col items-center px-3">
      <Dots n={pages.length} i={p} />
      <div className="flex min-h-[220px] w-full max-w-md flex-col items-center justify-center gap-4 rounded-3xl bg-white p-5 shadow-sm">
        <Visual v={page.v} size={84} />
        <p className="text-center text-2xl font-bold leading-snug text-ink">{page.text}</p>
      </div>
      <div className="mt-5 flex w-full max-w-md items-center justify-between gap-3">
        <Btn color="blanc" onClick={() => p > 0 && setP(p - 1)} disabled={p === 0} aria-label="Page précédente" className="text-2xl">⬅️</Btn>
        <button onClick={() => speak(page.text)} className="grid h-16 w-16 place-items-center rounded-full bg-soleil text-4xl shadow" aria-label="Réécouter">🔊</button>
        {p + 1 < pages.length
          ? <Btn color="vert" onClick={() => setP(p + 1)} aria-label="Page suivante" className="text-2xl">➡️</Btn>
          : <Btn color="terre" onClick={() => { stop(); setPhase('questions'); }}>Questions ❓</Btn>}
      </div>
      <button onClick={() => { stop(); setP(0); }} className="mt-4 text-base font-bold text-ciel underline">🔁 Réécouter depuis le début</button>
    </div>
  );
}
