import React from 'react';
import { useStore, currentProfile } from '../lib/store.js';
import { allActivities, getActivity, subjectById, drawings, fillName } from '../lib/content.js';
import Visual from '../components/Visual.jsx';

/** Fiches d'exercices imprimables (ou à enregistrer en PDF depuis le navigateur). */
export default function Print({ kind, id }) {
  const s = useStore();
  const acts = kind === 'semaine' ? allActivities(s).filter((a) => String(a.week) === String(id)) : [getActivity(id, s)].filter(Boolean);
  const name = currentProfile(s)?.name || '';
  return (
    <div className="min-h-screen bg-slate-100 pb-10 print:bg-white">
      <div className="no-print sticky top-0 z-10 flex items-center gap-2 bg-white p-3 shadow">
        <button onClick={() => history.back()} className="rounded-xl bg-slate-100 px-4 py-2 font-bold">⬅️ Retour</button>
        <span className="flex-1 text-center font-black">{kind === 'semaine' ? `Fiches – Semaine ${id}` : 'Fiche à imprimer'}</span>
        <button onClick={() => window.print()} className="rounded-xl bg-vert px-4 py-2 font-bold text-white">🖨️ Imprimer / PDF</button>
      </div>
      {acts.map((a, k) => <Sheet key={a.id} a={a} name={name} breakBefore={k > 0} />)}
      {!acts.length && <p className="p-6 text-center">Aucune fiche.</p>}
    </div>
  );
}

function Sheet({ a, name, breakBefore }) {
  const sub = subjectById(a.subject);
  return (
    <section className={`sheet my-4 shadow print:my-0 print:shadow-none ${breakBefore ? 'page-break' : ''}`}>
      <header className="flex items-start justify-between border-b-2 border-slate-800 pb-2 text-sm">
        <div><b>Mon École à la Maison · CI</b><br />{sub?.label.fr} · Semaine {a.week}</div>
        <div className="text-right">Prénom : <span className="inline-block min-w-[40mm] border-b border-slate-500">{name}</span><br />Date : <span className="inline-block min-w-[40mm] border-b border-slate-500">&nbsp;</span></div>
      </header>
      <h1 className="mt-3 text-3xl font-black">{a.icon} {a.title.fr}</h1>
      <p className="mt-1 text-lg"><b>Consigne :</b> {a.instruction.fr}</p>
      {a.instruction.wo && <p className="text-sm italic text-slate-600">Wolof : {a.instruction.wo}</p>}
      <p className="mt-1 text-xs text-slate-500">Le parent lit chaque consigne à voix haute. Pas de note : on encourage, on aide, on recommence.</p>
      <div className="mt-4 flex flex-col gap-4"><Body a={a} name={name} /></div>
      {a.offscreen?.fr && (
        <div className="avoid-break mt-6 rounded-xl border-2 border-dashed border-slate-500 p-3 text-sm">
          <b>🏡 Activité hors écran :</b> {a.offscreen.fr}
        </div>
      )}
      <footer className="mt-4 text-center text-xs text-slate-500">J’ai réussi : ☆ ☆ ☆ (colorie les étoiles)</footer>
    </section>
  );
}

const Box = ({ children, className = '' }) => <div className={`avoid-break rounded-xl border-2 border-slate-300 p-3 ${className}`}>{children}</div>;
const circle = 'flex min-h-[26mm] min-w-[26mm] items-center justify-center rounded-full border-2 border-slate-400 p-2';

function Body({ a, name }) {
  switch (a.type) {
    case 'story':
      return (<>
        <Box><b>L’histoire (à lire à l’enfant) :</b>{a.pages.map((p, k) => <p key={k} className="mt-2 flex items-center gap-3"><Visual v={p.v} size={30} /> {p.text}</p>)}</Box>
        <ChoiceList items={a.items} />
      </>);
    case 'choice': return <ChoiceList items={a.items} />;
    case 'count':
      return a.items.map((it, k) => (
        <Box key={k}>
          {it.mode === 'make'
            ? <><p className="font-bold">{k + 1}. Dessine {it.n} {it.label} dans le panier.</p><div className="mt-2 h-[35mm] rounded-[10mm] border-4 border-amber-700" /></>
            : <><p className="font-bold">{k + 1}. Compte les {it.label}. Écris le nombre dans la case.</p>
              <div className="mt-2 flex items-center gap-4"><span className="flex flex-wrap gap-1 text-4xl">{Array.from({ length: it.n }, (_, j) => <span key={j}>{it.object}</span>)}</span><span className="ml-auto h-[18mm] w-[18mm] shrink-0 rounded border-2 border-slate-600" /></div></>}
        </Box>
      ));
    case 'sort':
      return a.items.map((it, k) => (
        <Box key={k}>
          <p className="font-bold">{k + 1}. {it.say} Relie chaque image à sa boîte.</p>
          <div className="mt-2 flex flex-wrap justify-around gap-3">{it.objects.map((o, j) => <span key={j} className="flex flex-col items-center"><Visual v={o.v} size={44} /><span>●</span></span>)}</div>
          <div className="mt-8 flex justify-around gap-3">{it.bins.map((b, j) => <span key={j} className="flex w-[40mm] flex-col items-center rounded-xl border-2 border-dashed border-slate-500 p-2"><span>●</span><Visual v={b.v} size={40} /><b className="text-sm">{b.label}</b></span>)}</div>
        </Box>
      ));
    case 'match':
      return a.items.map((it, k) => {
        const right = [...it.pairs.map((_, j) => j)].sort((x, y) => ((x * 7 + 3) % it.pairs.length) - ((y * 7 + 3) % it.pairs.length));
        return (
          <Box key={k}>
            <p className="font-bold">{k + 1}. Relie avec un trait.</p>
            <div className="mt-2 grid grid-cols-2 gap-x-[30mm] gap-y-3">
              {it.pairs.map((p, j) => (
                <React.Fragment key={j}>
                  <span className="flex items-center justify-end gap-2"><Visual v={p[0]} size={40} /> ●</span>
                  <span className="flex items-center gap-2">● <Visual v={it.pairs[right[j]][1]} size={40} /></span>
                </React.Fragment>
              ))}
            </div>
          </Box>
        );
      });
    case 'memory':
      return (<Box><p className="font-bold">Découpe les cartes, retourne-les et joue au mémory en famille.</p>
        <div className="mt-2 grid grid-cols-4 gap-0">{a.items.flatMap((it) => it.pairs.flat()).map((v, j) => <div key={j} className="flex h-[32mm] items-center justify-center border-2 border-dashed border-slate-400"><Visual v={v} size={36} /></div>)}</div></Box>);
    case 'trace':
      return a.items.map((it, k) => (
        <Box key={k}>
          <p className="font-bold">{k + 1}. {it.say || 'Repasse sur les pointillés.'}</p>
          {it.path
            ? <svg viewBox="0 0 100 100" className="mx-auto mt-2 h-[60mm]"><path d={it.path} fill="none" stroke="#9CA3AF" strokeWidth="1.6" strokeDasharray="3 2.5" strokeLinecap="round" /></svg>
            : <>
              <div className="trace-letter mt-2 text-[22mm] leading-none">{(() => { const g = fillName(it.guide, name || 'prénom'); return Array.from({ length: g.length > 8 ? 1 : g.length > 3 ? 2 : 4 }, () => g).join('  '); })()}</div>
              <div className="mt-3 h-[18mm] border-b-2 border-t border-dashed border-slate-400" />
            </>}
        </Box>
      ));
    case 'coloring':
      return a.items.map((it, k) => { const d = drawings[it.drawing]; return (
        <Box key={k}><p className="font-bold">{k + 1}. {it.say}</p>
          <svg viewBox={d.viewBox} className="mx-auto mt-2 h-[80mm]">{d.regions.map((r, j) => <path key={j} d={r.d} fill="#fff" stroke="#111" strokeWidth="2.5" />)}</svg></Box>); });
    case 'parent':
      return a.items.map((it, k) => <Box key={k} className="flex items-center gap-3"><span className="text-2xl">☐</span><Visual v={it.v} size={34} /><span>{it.text}</span></Box>);
    default: return null;
  }
}

function ChoiceList({ items }) {
  return items.map((it, k) => (
    <Box key={k}>
      <p className="font-bold">{k + 1}. {it.say || 'Entoure la bonne réponse.'} <span className="font-normal text-slate-500">(entoure)</span></p>
      {it.prompt && <div className="mt-2 flex justify-center"><Visual v={it.prompt} size={it.prompt.startsWith('t:') ? 80 : 46} /></div>}
      <div className="mt-2 flex flex-wrap justify-around gap-3">{it.options.map((o, j) => <span key={j} className={circle}><Visual v={o} size={44} /></span>)}</div>
    </Box>
  ));
}
