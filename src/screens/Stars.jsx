import React from 'react';
import { useStore, profileProgress, totalStars, currentProfile } from '../lib/store.js';
import { allActivities } from '../lib/content.js';
import { TopBar } from '../components/ui.jsx';

export default function Stars() {
  const s = useStore();
  const prog = profileProgress(s);
  const list = allActivities(s);
  const p = currentProfile(s);
  const weeks = [...new Set(list.map((a) => a.week))];
  const stars = totalStars(s);
  return (
    <main className="mx-auto max-w-md pb-8">
      <TopBar title="⭐ Mes étoiles" />
      <div className="px-4">
        <div className="flex flex-col items-center rounded-3xl bg-soleil p-5 text-center shadow">
          <span className="text-6xl">{p.avatar}</span>
          <span className="mt-1 text-6xl font-black">{stars} ⭐</span>
          <span className="text-lg font-bold">Bravo {p.name}, continue comme ça !</span>
        </div>
        <h2 className="mb-2 mt-5 text-lg font-black">Mes semaines</h2>
        <div className="grid grid-cols-3 gap-3">
          {weeks.map((w) => {
            const acts = list.filter((a) => a.week === w);
            const done = acts.filter((a) => prog[a.id]?.done).length;
            const full = done === acts.length;
            return (
              <div key={w} className={`flex flex-col items-center rounded-2xl p-2 ${full ? 'bg-vert text-white' : 'bg-white'}`}>
                <span className="text-3xl">{full ? '🏅' : done ? '🌱' : '⚪'}</span>
                <span className="text-sm font-black">Semaine {w}</span>
                <span className="flex gap-0.5 text-sm" aria-label={`${done} sur ${acts.length}`}>
                  {acts.map((a) => <span key={a.id}>{prog[a.id]?.done ? a.icon : '·'}</span>)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
