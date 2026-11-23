import React from 'react';
import { useStore, currentProfile, totalStars } from '../lib/store.js';
import { subjects, phrases, activityOfTheDay, levelInfo } from '../lib/content.js';
import { playPhrase } from '../lib/audio.js';
import { LangToggle } from '../components/ui.jsx';
import { revisionsOfTheDay, revSubject } from '../lib/revisions.js';
import { frDate } from './Revision.jsx';

const tile = {
  ciel: 'bg-ciel text-white', terre: 'bg-terre text-white', vert: 'bg-vert text-white', violet: 'bg-violet text-white'
};

export default function Home() {
  const s = useStore();
  const p = currentProfile(s);
  const lang = s.settings.audioLang;
  const today = activityOfTheDay(s);
  const stars = totalStars(s);
  const w = phrases.welcome;
  const revs = revisionsOfTheDay(s);
  const lv = levelInfo(s);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 px-4 pb-6 pt-3">
      <header className="flex items-center gap-2">
        <a href="#/profil" className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow" aria-label="Profil">
          <span className="text-3xl">{p.avatar}</span><span className="text-lg font-black">{p.name}</span>
        </a>
        <span className="flex-1" />
        <LangToggle />
      </header>

      <section className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm">
        <button onClick={() => playPhrase('_welcome', w, lang)} className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-soleil text-4xl shadow" aria-label="Écouter">🔊</button>
        <div>
          <p className="text-xl font-black leading-tight">{w.fr.replace('Bonjour !', `Bonjour ${p.name} !`)}</p>
          {lang !== 'fr' && <p className="text-base font-semibold text-slate-600">{w[lang]}</p>}
        </div>
      </section>

      {!lv.ready && (
        <p className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-600">📚 Les activités du {lv.wanted} arrivent bientôt. En attendant, {p.name} révise le CI.</p>
      )}

      {today && (
        <a href={`#/activite/${today.id}`} className="flex items-center gap-4 rounded-3xl bg-soleil p-4 shadow-[0_6px_0_rgba(0,0,0,.18)]">
          <span className="pulse grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white text-5xl">{today.icon}</span>
          <span>
            <span className="block text-sm font-black uppercase tracking-wide">☀️ {phrases.today.fr}</span>
            <span className="block text-2xl font-black leading-tight">{today.title.fr}</span>
            {lang !== 'fr' && <span className="block text-sm font-semibold">{phrases.today[lang]}</span>}
          </span>
        </a>
      )}

      {revs.length > 0 && (
        <a href="#/revision" className="flex items-center gap-4 rounded-3xl bg-ciel p-4 text-white shadow-[0_6px_0_rgba(0,0,0,.18)]">
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white text-5xl">📝</span>
          <span className="min-w-0">
            <span className="block text-sm font-black uppercase tracking-wide">Révision du jour · {frDate(revs[0].date)}</span>
            <span className="block text-2xl font-black leading-tight">{revs.length === 1 ? revs[0].title : revs.map((r) => revSubject(r.subject).icon).join(' ') + ` ${revs.length} leçons`}</span>
          </span>
        </a>
      )}

      <section className="grid grid-cols-2 gap-3">
        {subjects.map((sub) => (
          <a key={sub.id} href={`#/matiere/${sub.id}`} className={`flex aspect-square flex-col items-center justify-center rounded-3xl p-2 text-center shadow-[0_6px_0_rgba(0,0,0,.2)] active:translate-y-1 ${tile[sub.color]}`}>
            <span className="text-6xl">{sub.icon}</span>
            <span className="mt-2 text-lg font-black leading-tight">{sub.label.fr}</span>
            {lang !== 'fr' && <span className="text-sm font-semibold opacity-90">{sub.label[lang]}</span>}
          </a>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <a href="#/etoiles" className="flex items-center justify-center gap-2 rounded-3xl bg-white p-4 text-lg font-black shadow">
          <span className="text-3xl">⭐</span>{phrases.stars.fr}<span className="rounded-full bg-soleil px-2 text-base">{stars}</span>
        </a>
        <a href="#/parent" className="flex items-center justify-center gap-2 rounded-3xl bg-white p-4 text-lg font-black shadow">
          <span className="text-3xl">🔒</span>{phrases.parent.fr}
        </a>
      </section>
      <p className="text-center text-xs text-slate-500">10 à 20 minutes par jour suffisent. L’écran ne remplace pas le cahier ni les jeux avec de vrais objets.</p>
    </main>
  );
}
