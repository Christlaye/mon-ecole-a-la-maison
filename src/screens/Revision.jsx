import React, { useEffect, useState } from 'react';
import { useStore } from '../lib/store.js';
import { allRevisions, getRevision, revisionsOfTheDay, revSubject, revisionActivityById, photoUrl, todayISO } from '../lib/revisions.js';
import { speak, stop } from '../lib/audio.js';
import { TopBar, Btn, LangToggle } from '../components/ui.jsx';
import { go } from '../router.js';

export const frDate = (iso) => {
  try { return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); } catch { return iso; }
};

/** Petite carte d'une révision (liste). */
export function RevisionCard({ r, big = false }) {
  const sub = revSubject(r.subject);
  return (
    <a href={`#/revision/${r.id}`} className={`flex items-center gap-3 rounded-3xl bg-white p-3 shadow ${big ? 'border-4 border-soleil' : ''}`}>
      <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl text-white ${sub.color}`}>{sub.icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-black uppercase tracking-wide text-slate-500">{frDate(r.date)} · {sub.label}</span>
        <span className="block truncate text-lg font-black leading-tight">{r.title}</span>
      </span>
      {r.photos?.length ? <span className="text-2xl">📷</span> : null}
    </a>
  );
}

function Photo({ k }) {
  const [url, setUrl] = useState(null);
  const [zoom, setZoom] = useState(false);
  useEffect(() => { let u; photoUrl(k).then((x) => { u = x; setUrl(x); }); return () => u && URL.revokeObjectURL(u); }, [k]);
  if (!url) return <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />;
  return (
    <>
      <button onClick={() => setZoom(true)} className="block w-full overflow-hidden rounded-2xl border-4 border-white shadow" aria-label="Agrandir la photo">
        <img src={url} alt="Photo du tableau" className="max-h-80 w-full object-contain bg-ink" />
      </button>
      {zoom && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/90 p-2" onClick={() => setZoom(false)}>
          <img src={url} alt="Photo du tableau" className="mx-auto w-full max-w-3xl" />
          <p className="mt-2 text-center font-bold text-white">Touche pour fermer</p>
        </div>
      )}
    </>
  );
}

const WORD = /([\p{L}\p{N}'’-]+)/u;

/** Une ligne de la leçon : 🔊 lit la ligne, chaque mot se lit en le touchant. */
function Line({ text }) {
  const [hot, setHot] = useState(-1);
  const parts = text.split(WORD);
  const sayWord = (w, k) => { setHot(k); speak(w, { rate: 0.8 }); setTimeout(() => setHot(-1), 900); };
  return (
    <li className="flex items-start gap-3 rounded-2xl bg-white p-3 shadow-sm">
      <button onClick={() => speak(text, { rate: 0.8 })} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-soleil text-2xl shadow" aria-label="Lire la ligne">🔊</button>
      <p className="flex-1 pt-1 text-2xl font-bold leading-relaxed" style={{ fontFamily: 'Andika, system-ui, sans-serif' }}>
        {parts.map((p, k) => (WORD.test(p)
          ? <button key={k} onClick={() => sayWord(p, k)} className={`-mx-0.5 rounded-lg px-0.5 ${hot === k ? 'bg-soleil' : 'active:bg-soleil-clair'}`}>{p}</button>
          : <span key={k}>{p}</span>))}
      </p>
    </li>
  );
}

function Detail({ r, s }) {
  const sub = revSubject(r.subject);
  const game = revisionActivityById(`rev-${r.id}`, s);
  const letters = (r.letters || '').split(/[\s,-]+/).filter(Boolean);
  useEffect(() => { if (s.settings.autoAudio) { const t = setTimeout(() => speak(`Révision : ${r.title}`), 300); return () => clearTimeout(t); } }, [r.id]);
  return (
    <div className="flex flex-col gap-4 px-4 pb-8">
      <section className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm">
        <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-4xl text-white ${sub.color}`}>{sub.icon}</span>
        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">{frDate(r.date)} · {sub.label}</p>
          <h2 className="text-2xl font-black leading-tight">{r.title}</h2>
        </div>
        <button onClick={() => speak(r.title)} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-soleil text-2xl shadow" aria-label="Écouter le titre">🔊</button>
      </section>

      {r.photos?.length > 0 && <section className="flex flex-col gap-3">{r.photos.map((k) => <Photo key={k} k={k} />)}</section>}

      {letters.length > 0 && (
        <section>
          <h3 className="mb-2 text-lg font-black">🔤 Les lettres</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {letters.map((L, k) => (
              <button key={k} onClick={() => speak(L.toLowerCase(), { rate: 0.7 })} className="grid h-20 w-20 place-items-center rounded-2xl bg-white text-5xl font-black shadow" style={{ fontFamily: 'Andika, system-ui' }}>
                {L}<span className="-mt-3 text-xl text-slate-500">{L.toLowerCase()}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {r.lines?.length > 0 && (
        <section>
          <h3 className="mb-2 text-lg font-black">👀 Je lis</h3>
          <p className="mb-2 text-sm text-slate-500">Touche 🔊 pour écouter la phrase, ou touche un mot.</p>
          <ul className="flex flex-col gap-2">{r.lines.map((l, k) => <Line key={k} text={l} />)}</ul>
        </section>
      )}

      {game && <Btn color="vert" className="text-2xl" onClick={() => { stop(); go(`#/activite/${game.id}`); }}>🎮 Je joue ({game.items.length} questions)</Btn>}

      {r.tip && (
        <div className="rounded-3xl border-2 border-violet/30 bg-violet-clair p-4">
          <p className="text-sm font-black uppercase tracking-wide text-violet">👨🏾‍👧🏾 Hors écran, pour le parent</p>
          <p className="mt-1 font-semibold">{r.tip}</p>
        </div>
      )}
    </div>
  );
}

export default function Revision({ id }) {
  const s = useStore();
  if (id) {
    const r = getRevision(id, s);
    return (
      <main className="mx-auto min-h-screen max-w-xl">
        <TopBar title="📝 Révision" back="#/revision" right={<LangToggle />} />
        {r ? <Detail r={r} s={s} /> : <p className="p-6 text-center">Cette révision n’existe plus.</p>}
      </main>
    );
  }
  const day = revisionsOfTheDay(s);
  const dayIds = day.map((r) => r.id);
  const older = allRevisions(s).filter((r) => !dayIds.includes(r.id) && r.date <= todayISO());
  return (
    <main className="mx-auto min-h-screen max-w-xl">
      <TopBar title="📝 Révision du jour" />
      <div className="flex flex-col gap-3 px-4 pb-8">
        {day.length === 0 && <p className="rounded-3xl bg-white p-4 text-center">Pas encore de révision. Le parent peut en ajouter dans l’Espace parent.</p>}
        {day.length === 1 ? <Detail r={day[0]} s={s} /> : day.map((r) => <RevisionCard key={r.id} r={r} big />)}
        {older.length > 0 && <>
          <h3 className="mt-3 text-lg font-black">📚 Révisions précédentes</h3>
          {older.map((r) => <RevisionCard key={r.id} r={r} />)}
        </>}
      </div>
    </main>
  );
}
