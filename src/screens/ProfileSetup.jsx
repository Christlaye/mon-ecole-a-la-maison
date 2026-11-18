import React, { useState } from 'react';
import { addProfile, updateProfile, useStore, currentProfile, selectProfile } from '../lib/store.js';
import { Btn } from '../components/ui.jsx';
import { go } from '../router.js';
import { speak } from '../lib/audio.js';

export const AVATARS = ['🦁', '🐘', '🦒', '🐢', '🐟', '🐓', '🐑', '🦋', '🌞', '🥭', '⚽', '🚀'];
export const LEVELS = ['CI', 'Grande section', 'CP'];

export default function ProfileSetup({ edit }) {
  const profiles = useStore((s) => s.profiles);
  const cur = useStore(currentProfile);
  const editing = edit && cur;
  const [name, setName] = useState(editing ? cur.name : '');
  const [avatar, setAvatar] = useState(editing ? cur.avatar : '🦁');
  const [level, setLevel] = useState(editing ? cur.level : 'CI');

  const save = () => {
    if (!name.trim()) return;
    if (editing) updateProfile(cur.id, { name: name.trim(), avatar, level });
    else addProfile({ name, avatar, level });
    speak(`Bienvenue ${name.trim()} !`);
    go('#/');
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-4 py-6">
      <div className="text-center">
        <div className="text-6xl">🏫</div>
        <h1 className="mt-2 text-2xl font-black">Mon École à la Maison</h1>
        <p className="text-slate-600">{editing ? 'Modifier le profil' : 'Créons le profil de l’enfant (avec le parent).'}</p>
      </div>

      {!edit && profiles.length > 0 && (
        <div className="rounded-3xl bg-white p-4">
          <p className="mb-2 font-bold">Qui joue ?</p>
          <div className="flex flex-wrap gap-3">
            {profiles.map((p) => (
              <button key={p.id} onClick={() => { selectProfile(p.id); go('#/'); }} className="flex flex-col items-center rounded-2xl bg-creme px-4 py-2">
                <span className="text-4xl">{p.avatar}</span><span className="font-bold">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="block">
        <span className="text-lg font-bold">Prénom de l’enfant</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} autoComplete="off"
          className="mt-1 w-full rounded-2xl border-4 border-slate-200 bg-white px-4 py-3 text-2xl font-bold focus:border-vert" placeholder="ex. Awa" />
        <span className="text-xs text-slate-500">Seul le prénom est demandé. Il reste sur ce téléphone.</span>
      </label>

      <div>
        <span className="text-lg font-bold">Choisis ton animal</span>
        <div className="mt-2 grid grid-cols-6 gap-2">
          {AVATARS.map((a) => (
            <button key={a} onClick={() => setAvatar(a)} aria-label={`avatar ${a}`}
              className={`grid aspect-square place-items-center rounded-2xl text-3xl ${avatar === a ? 'bg-soleil ring-4 ring-ink/20' : 'bg-white'}`}>{a}</button>
          ))}
        </div>
      </div>

      <div>
        <span className="text-lg font-bold">Niveau</span>
        <div className="mt-2 flex gap-2">
          {LEVELS.map((l) => (
            <button key={l} onClick={() => setLevel(l)} className={`flex-1 rounded-2xl px-2 py-3 font-bold ${level === l ? 'bg-vert text-white' : 'bg-white'}`}>{l}</button>
          ))}
        </div>
      </div>

      <Btn onClick={save} disabled={!name.trim()} className="mt-2 text-xl">{editing ? 'Enregistrer' : 'C’est parti ! 🚀'}</Btn>
      {editing && <a href="#/" className="text-center font-bold text-ciel underline">Annuler</a>}
    </main>
  );
}
