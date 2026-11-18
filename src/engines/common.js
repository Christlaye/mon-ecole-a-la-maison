import { useRef, useState } from 'react';
import { chime } from '../lib/audio.js';
import { praise, encourage } from '../components/ui.jsx';
import { phrases } from '../lib/content.js';
import { speak } from '../lib/audio.js';

export const MAX_TRIES = 3;

/** Gère la règle « 3 essais » : encourager + indice, puis montrer la réponse. */
export function useTries() {
  const [fb, setFb] = useState(null);
  const tries = useRef(0);
  const stats = useRef({ errors: 0, revealed: 0, perItem: [] });

  const success = (say = true) => {
    const p = praise();
    chime('ok');
    setFb({ kind: 'ok', text: p.fr, wo: p.wo });
    if (say) speak(p.fr, { rate: 1 });
    stats.current.perItem.push(tries.current);
    tries.current = 0;
  };
  /** retourne true si la réponse doit maintenant être montrée */
  const fail = (hint, explain, max = MAX_TRIES) => {
    tries.current += 1;
    stats.current.errors += 1;
    chime('no');
    if (tries.current >= max) {
      stats.current.revealed += 1;
      stats.current.perItem.push(tries.current);
      setFb({ kind: 'show', text: explain || phrases.reveal.fr, wo: phrases.reveal.wo });
      speak(explain || phrases.reveal.fr);
      tries.current = 0;
      return true;
    }
    const e = encourage();
    setFb({ kind: 'try', text: e.fr, wo: e.wo, hint: tries.current >= 1 ? hint : null });
    speak(e.fr + (hint ? ' ' + hint : ''));
    return false;
  };
  const clear = () => setFb(null);
  return { fb, setFb, success, fail, clear, stats, tries };
}
