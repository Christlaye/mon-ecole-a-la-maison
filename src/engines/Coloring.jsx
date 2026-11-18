import React, { useEffect, useState } from 'react';
import { Btn, Dots, Feedback, praise } from '../components/ui.jsx';
import { speak, stop, chime } from '../lib/audio.js';
import { drawings } from '../lib/content.js';

const PALETTE = ['#DC2626', '#F97316', '#FACC15', '#16A34A', '#1D63C4', '#7C3AED', '#92400E', '#111827', '#F9A8D4', '#FFFFFF'];

/** Coloriage numérique : choisir une couleur puis toucher une zone. */
export default function Coloring({ items, onFinish }) {
  const [i, setI] = useState(0);
  const [color, setColor] = useState(PALETTE[0]);
  const [fills, setFills] = useState({});
  const [fb, setFb] = useState(null);
  const item = items[i];
  const d = drawings[item.drawing];

  useEffect(() => {
    setFills({}); setFb(null);
    const id = setTimeout(() => speak(item.say || 'Choisis une couleur et touche le dessin.'), 300);
    return () => clearTimeout(id);
  }, [i]);

  const done = () => {
    const p = praise(); chime('win'); setFb({ kind: 'ok', text: p.fr, wo: p.wo }); speak(p.fr);
    setTimeout(() => { stop(); if (i + 1 < items.length) setI(i + 1); else onFinish({ errors: 0, revealed: 0, total: items.length, perItem: [] }); }, 1400);
  };

  return (
    <div className="flex flex-col items-center px-3">
      <Dots n={items.length} i={i} />
      {item.model && (
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-600">Modèle :
          <svg viewBox={d.viewBox} className="h-12 rounded border border-slate-300 bg-white">
            {d.regions.map((r, k) => <path key={k} d={r.d} fill={r.target || '#fff'} stroke="#1F2933" strokeWidth="3" />)}
          </svg>
        </div>
      )}
      <svg viewBox={d.viewBox} className="w-full max-w-md rounded-3xl border-4 border-slate-200 bg-white" role="img" aria-label={`dessin à colorier : ${item.drawing}`}>
        {d.regions.map((r, k) => (
          <path key={k} d={r.d} fill={fills[k] || '#FFFFFF'} stroke="#1F2933" strokeWidth="3" strokeLinejoin="round"
            onClick={() => { setFills({ ...fills, [k]: color }); chime('ok'); }} style={{ cursor: 'pointer' }} />
        ))}
      </svg>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {PALETTE.map((c) => (
          <button key={c} onClick={() => setColor(c)} aria-label={`couleur ${c}`}
            className={`h-12 w-12 rounded-full border-4 ${color === c ? 'scale-110 border-ink' : 'border-white shadow'}`} style={{ background: c }} />
        ))}
      </div>
      <div className="mt-4 flex gap-3">
        <Btn color="blanc" onClick={() => setFills({})}>Effacer 🧽</Btn>
        <Btn color="vert" onClick={done}>J'ai fini ✅</Btn>
      </div>
      <Feedback fb={fb} />
    </div>
  );
}
