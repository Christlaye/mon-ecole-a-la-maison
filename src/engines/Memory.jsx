import React, { useEffect, useState } from 'react';
import Visual from '../components/Visual.jsx';
import { Dots, Feedback } from '../components/ui.jsx';
import { speak, stop, chime, sayPhrase } from '../lib/audio.js';
import { shuffle } from '../lib/content.js';
import { praise } from '../components/ui.jsx';

/** Jeu de mémoire : retrouver les paires. Pas d'erreur comptée : c'est un jeu. */
export default function Memory({ items, onFinish }) {
  const [i, setI] = useState(0);
  const [cards, setCards] = useState([]);
  const [open, setOpen] = useState([]);
  const [found, setFound] = useState([]);
  const [fb, setFb] = useState(null);
  const [flips, setFlips] = useState(0);
  const item = items[i];

  useEffect(() => {
    setCards(shuffle(item.pairs.flatMap((p, k) => [{ v: p[0], pair: k, id: k + 'a' }, { v: p[1], pair: k, id: k + 'b' }])));
    setOpen([]); setFound([]); setFb(null);
  }, [i]);

  const flip = (idx) => {
    if (open.length === 2 || open.includes(idx) || found.includes(cards[idx].pair)) return;
    const no = [...open, idx];
    setOpen(no); setFlips((f) => f + 1);
    if (no.length === 2) {
      const [a, b] = no.map((n) => cards[n]);
      if (a.pair === b.pair) {
        const nf = [...found, a.pair];
        setFound(nf); setOpen([]); chime('ok');
        const p = praise(); setFb({ kind: 'ok', text: p.fr, wo: p.wo });
        if (nf.length === item.pairs.length) {
          chime('win'); sayPhrase(p);
          setTimeout(() => {
            stop();
            if (i + 1 < items.length) setI(i + 1);
            else onFinish({ errors: 0, revealed: 0, total: items.length, perItem: [], flips });
          }, 1300);
        }
      } else {
        setTimeout(() => setOpen([]), 1000);
      }
    }
  };

  const cols = cards.length > 8 ? 'grid-cols-4' : cards.length > 6 ? 'grid-cols-4' : 'grid-cols-3';
  return (
    <div className="flex flex-col items-center px-3">
      <Dots n={items.length} i={i} />
      <div className={`grid w-full max-w-md gap-2 ${cols}`}>
        {cards.map((c, idx) => {
          const shown = open.includes(idx) || found.includes(c.pair);
          return (
            <button key={c.id} onClick={() => flip(idx)} aria-label={shown ? 'carte retournée' : 'carte cachée'}
              className={`flex aspect-[3/4] items-center justify-center rounded-2xl border-4 p-1 shadow-[0_4px_0_rgba(0,0,0,.12)] ${found.includes(c.pair) ? 'border-vert bg-vert-clair' : shown ? 'border-soleil bg-white' : 'border-violet bg-violet'}`}>
              {shown ? <Visual v={c.v} size={cards.length > 8 ? 36 : 46} /> : <span className="text-3xl">❔</span>}
            </button>
          );
        })}
      </div>
      <Feedback fb={fb} />
    </div>
  );
}
