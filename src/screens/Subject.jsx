import React from 'react';
import { useStore, profileProgress } from '../lib/store.js';
import { allActivities, subjectById, currentWeek } from '../lib/content.js';
import { TopBar } from '../components/ui.jsx';

export default function Subject({ id }) {
  const s = useStore();
  const sub = subjectById(id);
  const prog = profileProgress(s);
  const list = allActivities(s).filter((a) => a.subject === id);
  const cw = currentWeek(s);
  const weeks = [...new Set(list.map((a) => a.week))];
  if (!sub) return <TopBar title="?" />;
  return (
    <main className="mx-auto max-w-md pb-8">
      <TopBar title={`${sub.icon} ${sub.label.fr}`} />
      <div className="flex flex-col gap-4 px-4">
        {weeks.map((w) => (
          <section key={w}>
            <h2 className={`mb-2 inline-block rounded-full px-3 py-1 text-sm font-black ${w === cw ? 'bg-soleil' : 'bg-white'}`}>Semaine {w}{w === cw ? ' • en ce moment' : ''}</h2>
            <div className="grid grid-cols-1 gap-3">
              {list.filter((a) => a.week === w).map((a) => {
                const done = prog[a.id]?.done;
                return (
                  <a key={a.id} href={`#/activite/${a.id}`} className="flex items-center gap-3 rounded-3xl bg-white p-3 shadow-[0_4px_0_rgba(0,0,0,.08)] active:translate-y-0.5">
                    <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-creme text-4xl">{a.icon}</span>
                    <span className="flex-1 text-xl font-black leading-tight">{a.title.fr}</span>
                    <span className="text-2xl" aria-label={done ? 'terminée' : 'à faire'}>{done ? '⭐⭐⭐' : '▶️'}</span>
                  </a>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
