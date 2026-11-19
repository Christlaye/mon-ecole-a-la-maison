import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore, setSettings, profileProgress, selectProfile, removeProfile, resetProgress, exportData, importData, totalStars, currentProfile } from '../lib/store.js';
import { allActivities, subjects, subjectById, phrases } from '../lib/content.js';
import { clips } from '../lib/idb.js';
import { clipKey, startRecording, playUrl, speak, phraseSlots } from '../lib/audio.js';
import languages from '../data/languages.json';
import { TopBar, Btn, Card } from '../components/ui.jsx';
import { go } from '../router.js';
import Admin from './Admin.jsx';

const UNLOCK_KEY = 'mon-ecole-parent-unlock';
const isUnlocked = () => { try { return Number(sessionStorage.getItem(UNLOCK_KEY) || 0) > Date.now(); } catch { return false; } };
const unlock = () => { try { sessionStorage.setItem(UNLOCK_KEY, String(Date.now() + 15 * 60 * 1000)); } catch {} };

function Gate({ onOk }) {
  const code = useStore((s) => s.settings.parentCode);
  const [op] = useState(() => { const a = 3 + Math.floor(Math.random() * 7), b = 3 + Math.floor(Math.random() * 7); return { a, b }; });
  const [step, setStep] = useState('op');
  const [val, setVal] = useState('');
  const [val2, setVal2] = useState('');
  const [err, setErr] = useState('');

  const submit = (e) => {
    e.preventDefault(); setErr('');
    if (step === 'op') {
      if (Number(val) === op.a * op.b) { setVal(''); setStep(code ? 'code' : 'create'); } else { setErr('Ce n’est pas le bon résultat.'); setVal(''); }
    } else if (step === 'code') {
      if (val === code) { unlock(); onOk(); } else { setErr('Code incorrect.'); setVal(''); }
    } else {
      if (!/^\d{4}$/.test(val)) return setErr('Le code doit avoir 4 chiffres.');
      if (val !== val2) return setErr('Les deux codes sont différents.');
      setSettings({ parentCode: val }); unlock(); onOk();
    }
  };
  return (
    <main className="mx-auto max-w-sm">
      <TopBar title="🔒 Espace parent" />
      <form onSubmit={submit} className="mx-4 mt-6 flex flex-col gap-4 rounded-3xl bg-white p-5 shadow">
        {step === 'op' && <><p className="text-lg font-bold">Pour les parents : combien font</p><p className="text-center text-5xl font-black">{op.a} × {op.b} ?</p></>}
        {step === 'code' && <p className="text-lg font-bold">Entrez votre code parent (4 chiffres)</p>}
        {step === 'create' && <p className="text-lg font-bold">Première visite : choisissez un code parent à 4 chiffres. Il vous sera demandé à chaque fois.</p>}
        <input value={val} onChange={(e) => setVal(e.target.value.replace(/\D/g, '').slice(0, step === 'op' ? 3 : 4))} inputMode="numeric" autoFocus
          type={step === 'op' ? 'text' : 'password'} className="rounded-2xl border-4 border-slate-200 px-4 py-3 text-center text-3xl font-black tracking-[.4em]" aria-label="réponse" />
        {step === 'create' && <input value={val2} onChange={(e) => setVal2(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" type="password" placeholder="Répétez le code"
          className="rounded-2xl border-4 border-slate-200 px-4 py-3 text-center text-3xl font-black tracking-[.4em]" aria-label="confirmer le code" />}
        {err && <p className="font-bold text-terre">{err}</p>}
        <Btn type="submit">Valider</Btn>
        {step === 'code' && <p className="text-xs text-slate-500">Code oublié ? Effacez les données du site dans les réglages du navigateur (les progrès seront perdus) ou restaurez une sauvegarde.</p>}
      </form>
    </main>
  );
}

const TABS = [
  ['suivi', '📊 Suivi'], ['profils', '👧🏾 Profils'], ['fiches', '🖨️ Fiches'], ['voix', '🎙️ Voix'], ['admin', '✏️ Activités'], ['reglages', '⚙️ Réglages']
];

export default function ParentArea({ tab = 'suivi', editId }) {
  const [ok, setOk] = useState(isUnlocked());
  if (!ok) return <Gate onOk={() => setOk(true)} />;
  return (
    <main className="mx-auto max-w-2xl pb-10">
      <TopBar title="👨🏾‍👩🏾‍👧🏾 Espace parent" />
      <nav className="no-print flex gap-2 overflow-x-auto px-3 pb-3">
        {TABS.map(([k, l]) => (
          <a key={k} href={k === 'admin' ? '#/admin' : `#/parent/${k}`} className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${tab === k ? 'bg-vert text-white' : 'bg-white'}`}>{l}</a>
        ))}
      </nav>
      <div className="px-3">
        {tab === 'suivi' && <Dashboard />}
        {tab === 'profils' && <Profiles />}
        {tab === 'fiches' && <Sheets />}
        {tab === 'voix' && <Voices />}
        {tab === 'admin' && <Admin editId={editId} />}
        {tab === 'reglages' && <Settings />}
      </div>
    </main>
  );
}

function Dashboard() {
  const s = useStore();
  const p = currentProfile(s);
  const prog = profileProgress(s);
  const list = allActivities(s);
  if (!p) return <Card>Créez d’abord un profil enfant.</Card>;
  const done = list.filter((a) => prog[a.id]?.done);
  const mastered = done.filter((a) => (prog[a.id].lastRevealed || 0) === 0 && (prog[a.id].lastErrors || 0) <= Math.max(1, Math.floor((prog[a.id].total || 5) / 3)));
  const hard = done.filter((a) => !mastered.includes(a));
  const nextOnes = list.filter((a) => !prog[a.id]?.done).slice(0, 3);
  const suggestions = (hard.length ? hard : nextOnes).slice(0, 4);
  const last7 = done.filter((a) => prog[a.id].lastAt > Date.now() - 7 * 86400000).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3 text-center">
        <Card><div className="text-3xl font-black">{done.length}<span className="text-base text-slate-500">/{list.length}</span></div><div className="text-sm font-bold">activités faites</div></Card>
        <Card><div className="text-3xl font-black">{totalStars(s)}</div><div className="text-sm font-bold">étoiles ⭐</div></Card>
        <Card><div className="text-3xl font-black">{last7}</div><div className="text-sm font-bold">ces 7 jours</div></Card>
      </div>

      <Card>
        <h3 className="mb-2 text-lg font-black">Par matière</h3>
        {subjects.map((sub) => {
          const all = list.filter((a) => a.subject === sub.id); const d = all.filter((a) => prog[a.id]?.done).length;
          return (
            <div key={sub.id} className="mb-2">
              <div className="flex justify-between text-sm font-bold"><span>{sub.icon} {sub.label.fr}</span><span>{d}/{all.length}</span></div>
              <div className="h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-vert" style={{ width: `${(100 * d) / Math.max(1, all.length)}%` }} /></div>
            </div>
          );
        })}
      </Card>

      <Card>
        <h3 className="text-lg font-black">✅ Notions bien réussies</h3>
        {mastered.length ? <ul className="mt-2 flex flex-wrap gap-2">{mastered.map((a) => <li key={a.id} className="rounded-full bg-vert-clair px-3 py-1 text-sm font-bold">{a.icon} {a.notion}</li>)}</ul>
          : <p className="text-sm text-slate-500">Elles apparaîtront ici au fil des activités.</p>}
      </Card>

      <Card>
        <h3 className="text-lg font-black">🌱 À revoir doucement</h3>
        <p className="text-xs text-slate-500">Activités où l’enfant a eu besoin d’aide (plusieurs essais ou réponse montrée). Rien d’inquiétant : on rejoue un autre jour.</p>
        {hard.length ? (
          <ul className="mt-2 flex flex-col gap-2">{hard.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 rounded-2xl bg-soleil-clair px-3 py-2 text-sm">
              <span><b>{a.icon} {a.notion}</b><br /><span className="text-slate-600">{prog[a.id].lastErrors} essai(s) à refaire, {prog[a.id].lastRevealed} réponse(s) montrée(s)</span></span>
              <a href={`#/activite/${a.id}`} className="shrink-0 rounded-full bg-white px-3 py-1 font-bold">Rejouer</a>
            </li>))}
          </ul>
        ) : <p className="mt-1 text-sm text-slate-500">Rien pour l’instant 👍🏾</p>}
      </Card>

      <Card>
        <h3 className="text-lg font-black">🏡 Idées d’activités hors écran</h3>
        <ul className="mt-2 flex flex-col gap-2">{suggestions.map((a) => <li key={a.id} className="rounded-2xl bg-violet-clair px-3 py-2 text-sm"><b>{a.icon} {a.notion}</b> — {a.offscreen?.fr}</li>)}</ul>
      </Card>

      <Card>
        <h3 className="mb-2 text-lg font-black">Historique</h3>
        <ul className="divide-y text-sm">
          {done.sort((a, b) => prog[b.id].lastAt - prog[a.id].lastAt).slice(0, 15).map((a) => (
            <li key={a.id} className="flex justify-between py-1.5"><span>{a.icon} {a.title.fr} <span className="text-slate-500">({subjectById(a.subject)?.label.fr})</span></span><span className="text-slate-500">{new Date(prog[a.id].lastAt).toLocaleDateString('fr-FR')} · {prog[a.id].plays}×</span></li>
          ))}
          {!done.length && <li className="py-2 text-slate-500">Aucune activité terminée pour l’instant.</li>}
        </ul>
      </Card>
    </div>
  );
}

function Profiles() {
  const s = useStore();
  return (
    <div className="flex flex-col gap-3">
      {s.profiles.map((p) => (
        <Card key={p.id} className="flex items-center gap-3">
          <span className="text-4xl">{p.avatar}</span>
          <div className="flex-1"><b className="text-lg">{p.name}</b><div className="text-sm text-slate-500">{p.level} · {Object.values(s.progress[p.id] || {}).length} activités</div></div>
          {s.currentProfile === p.id ? <span className="rounded-full bg-vert px-3 py-1 text-sm font-bold text-white">Actif</span>
            : <button onClick={() => selectProfile(p.id)} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">Choisir</button>}
          <button onClick={() => { if (confirm(`Supprimer le profil de ${p.name} et ses progrès ?`)) removeProfile(p.id); }} className="rounded-full bg-terre-clair px-3 py-1 text-sm font-bold text-terre">Supprimer</button>
        </Card>
      ))}
      <div className="grid grid-cols-2 gap-3">
        <Btn color="soleil" onClick={() => go('#/profil')}>✏️ Modifier le profil actif</Btn>
        <Btn color="vert" onClick={() => { selectProfile(null); go('#/'); }}>➕ Ajouter un enfant</Btn>
      </div>
    </div>
  );
}

function Sheets() {
  const list = allActivities();
  const weeks = [...new Set(list.map((a) => a.week))];
  return (
    <div className="flex flex-col gap-3">
      <Card><p className="text-sm">Ouvrez une fiche puis touchez « Imprimer / PDF ». Sur téléphone, choisissez « Enregistrer en PDF » pour la télécharger et l’imprimer plus tard.</p></Card>
      {weeks.map((w) => (
        <Card key={w}>
          <div className="mb-2 flex items-center justify-between"><h3 className="font-black">Semaine {w}</h3><a href={`#/fiche/semaine/${w}`} className="rounded-full bg-vert px-3 py-1 text-sm font-bold text-white">Fiches de la semaine</a></div>
          <div className="flex flex-wrap gap-2">{list.filter((a) => a.week === w).map((a) => <a key={a.id} href={`#/fiche/activite/${a.id}`} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">{a.icon} {a.title.fr}</a>)}</div>
        </Card>
      ))}
    </div>
  );
}

function useRecorder(lang, id, refresh) {
  const [rec, setRec] = useState(null);
  const [err, setErr] = useState('');
  const start = async () => { setErr(''); try { const stopFn = await startRecording(); setRec(() => stopFn); } catch { setErr('Micro indisponible ou refusé.'); } };
  const stopRec = async () => { const blob = await rec(); setRec(null); await clips.set(clipKey(lang, id), blob); refresh(); };
  const play = async () => { const b = await clips.get(clipKey(lang, id)); if (b) playUrl(URL.createObjectURL(b)); };
  const del = async () => { await clips.del(clipKey(lang, id)); refresh(); };
  return { rec, err, start, stopRec, play, del };
}

function VoiceRow({ id, label, text, lang, has, refresh }) {
  const r = useRecorder(lang, id, refresh);
  return (
    <li className="flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-sm sm:flex-row sm:items-center">
      <div className="flex-1 text-sm"><b>{has ? '✅ ' : ''}{label}</b><div className="text-vert">{text || <i className="text-slate-400">texte {lang} à compléter</i>}</div>{r.err && <div className="text-terre">{r.err}</div>}</div>
      <div className="flex gap-2">
        {r.rec ? <button onClick={r.stopRec} className="pulse rounded-full bg-terre px-4 py-2 font-bold text-white">⏹️ Stop</button>
          : <button onClick={r.start} className="rounded-full bg-soleil px-4 py-2 font-bold">🎙️ {has ? 'Refaire' : 'Enregistrer'}</button>}
        {has && <><button onClick={r.play} className="rounded-full bg-slate-100 px-3 py-2" aria-label="Écouter">▶️</button><button onClick={r.del} className="rounded-full bg-slate-100 px-3 py-2" aria-label="Supprimer">🗑️</button></>}
      </div>
    </li>
  );
}

/** Studio : une phrase à la fois, en grand, pour enregistrer toutes les voix à la suite. */
function Studio({ slots, lang, keys, refresh, onClose }) {
  const firstMissing = Math.max(0, slots.findIndex((x) => !keys.includes(clipKey(lang, x.id))));
  const [k, setK] = useState(firstMissing);
  const slot = slots[k];
  const has = keys.includes(clipKey(lang, slot.id));
  const r = useRecorder(lang, slot.id, refresh);
  const stopAndPlay = async () => { await r.stopRec(); setTimeout(r.play, 150); };
  const done = slots.filter((x) => keys.includes(clipKey(lang, x.id))).length;
  return (
    <Card>
      <div className="flex items-center justify-between text-sm"><b>🎙️ Studio – {k + 1} / {slots.length}</b><span className="text-slate-500">{done} enregistrée(s)</span><button onClick={onClose} className="rounded-full bg-slate-100 px-3 py-1 font-bold">Fermer</button></div>
      <div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-vert" style={{ width: `${(done / slots.length) * 100}%` }} /></div>
      <p className="mt-3 text-sm text-slate-500">{slot.label}{has ? ' · ✅ déjà enregistrée' : ''}</p>
      <p className="mt-1 text-3xl font-black leading-snug text-vert">{slot.text || <i className="text-slate-400">texte à compléter</i>}</p>
      <p className="mt-2 text-sm text-slate-500">En français : {slot.fr}</p>
      {r.err && <p className="mt-2 text-terre">{r.err}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <button disabled={k === 0 || !!r.rec} onClick={() => setK(k - 1)} className="rounded-full bg-slate-100 px-4 py-3 font-bold disabled:opacity-40">⬅️</button>
        {r.rec ? <button onClick={stopAndPlay} className="pulse rounded-full bg-terre px-6 py-4 text-xl font-black text-white">⏹️ Stop</button>
          : <button onClick={r.start} className="rounded-full bg-soleil px-6 py-4 text-xl font-black">🎙️ {has ? 'Refaire' : 'Enregistrer'}</button>}
        {has && !r.rec && <button onClick={r.play} className="rounded-full bg-slate-100 px-4 py-3 font-bold">▶️ Écouter</button>}
        <button disabled={k === slots.length - 1 || !!r.rec} onClick={() => setK(k + 1)} className="rounded-full bg-vert px-4 py-3 font-bold text-white disabled:opacity-40">Suivante ➡️</button>
      </div>
      <p className="mt-3 text-xs text-slate-500">Astuce : parlez lentement, avec le sourire, dans une pièce calme. Appuyez sur Stop juste après la phrase.</p>
    </Card>
  );
}

const blobToB64 = (b) => new Promise((res) => { const f = new FileReader(); f.onload = () => res(String(f.result).split(',')[1]); f.readAsDataURL(b); });
const b64ToBlob = (d, type) => new Blob([Uint8Array.from(atob(d), (c) => c.charCodeAt(0))], { type });

function Voices() {
  const s = useStore();
  const enabled = languages.filter((l) => l.enabled && l.code !== 'fr');
  const [lang, setLang] = useState(enabled[0]?.code || 'wo');
  const [keys, setKeys] = useState([]);
  const [studio, setStudio] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef();
  const refresh = () => clips.keys().then(setKeys);
  useEffect(() => { refresh(); }, []);
  const list = allActivities(s);
  const slots = [
    ...phraseSlots(phrases).map((x) => ({ id: x.id, label: x.label, text: x.p[lang], fr: x.p.fr })),
    ...list.map((a) => ({ id: a.id, label: `${a.icon} ${a.title.fr} (S${a.week})`, text: a.instruction[lang], fr: a.instruction.fr }))
  ];
  const mine = keys.filter((k) => k.startsWith(lang + ':'));

  const exportVoices = async () => {
    const out = { format: 'mon-ecole-voix', version: 1, lang, clips: {} };
    for (const key of mine) { const b = await clips.get(key); if (b) out.clips[key.slice(lang.length + 1)] = { type: b.type, data: await blobToB64(b) }; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: 'application/json' }));
    a.download = `voix-${lang}-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  };
  const importVoices = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (d.format !== 'mon-ecole-voix') throw new Error();
      for (const [id, c] of Object.entries(d.clips)) await clips.set(clipKey(d.lang, id), b64ToBlob(c.data, c.type));
      setMsg(`${Object.keys(d.clips).length} voix importée(s) ✅`); refresh();
    } catch { setMsg('Fichier non reconnu.'); }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <p className="text-sm">Enregistrez les consignes et les petites phrases (bravo, encouragements) avec une vraie voix, par exemple un grand-parent. Elles sont jouées quand la langue <b>{lang.toUpperCase()}</b> est choisie (bouton FR/WO). Sans enregistrement, la consigne reste écrite à l’écran.</p>
        <div className="mt-2 flex gap-2">{enabled.map((l) => <button key={l.code} onClick={() => setLang(l.code)} className={`rounded-full px-3 py-1 font-bold ${lang === l.code ? 'bg-vert text-white' : 'bg-slate-100'}`}>{l.label}</button>)}</div>
        <p className="mt-2 text-xs text-slate-500">{mine.length} enregistrée(s) sur {slots.length}.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {!studio && <button onClick={() => setStudio(true)} className="rounded-full bg-soleil px-4 py-2 font-black">🎙️ Ouvrir le studio</button>}
          <button disabled={!mine.length} onClick={exportVoices} className="rounded-full bg-ciel px-4 py-2 font-bold text-white disabled:opacity-40">⬇️ Partager mes voix</button>
          <button onClick={() => fileRef.current.click()} className="rounded-full bg-slate-100 px-4 py-2 font-bold">⬆️ Importer des voix</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importVoices} />
        </div>
        <p className="mt-2 text-xs text-slate-500">« Partager mes voix » crée un fichier à envoyer sur un autre téléphone, ou à ajouter au site pour que tous les appareils les aient.</p>
        {msg && <p className="mt-2 font-bold text-vert">{msg}</p>}
      </Card>
      {studio && <Studio slots={slots} lang={lang} keys={keys} refresh={refresh} onClose={() => setStudio(false)} />}
      {!studio && <>
        <h3 className="mt-1 font-black">Petites phrases</h3>
        <ul className="flex flex-col gap-2">{slots.slice(0, 11).map((x) => <VoiceRow key={x.id} {...x} lang={lang} has={keys.includes(clipKey(lang, x.id))} refresh={refresh} />)}</ul>
        <h3 className="mt-1 font-black">Consignes des activités</h3>
        <ul className="flex flex-col gap-2">{slots.slice(11).map((x) => <VoiceRow key={x.id} {...x} lang={lang} has={keys.includes(clipKey(lang, x.id))} refresh={refresh} />)}</ul>
      </>}
    </div>
  );
}

function Settings() {
  const s = useStore();
  const st = s.settings;
  const fileRef = useRef();
  const [msg, setMsg] = useState('');
  const [newCode, setNewCode] = useState('');
  const download = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `mon-ecole-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  };
  const onImport = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { importData(await f.text()); setMsg('Sauvegarde restaurée ✅'); } catch (err) { setMsg('Fichier non reconnu.'); }
  };
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <h3 className="font-black">🔊 Consignes audio</h3>
        <label className="mt-2 block text-sm font-bold">Langue des consignes
          <select value={st.audioLang} onChange={(e) => setSettings({ audioLang: e.target.value })} className="mt-1 block w-full rounded-xl border-2 border-slate-200 p-2">
            {languages.map((l) => <option key={l.code} value={l.code} disabled={!l.enabled}>{l.label}{l.enabled ? '' : ' (bientôt)'}</option>)}
          </select>
        </label>
        <label className="mt-3 block text-sm font-bold">Vitesse de la voix : {st.rate}
          <input type="range" min="0.6" max="1.2" step="0.1" value={st.rate} onChange={(e) => setSettings({ rate: Number(e.target.value) })} className="block w-full" />
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={st.autoAudio} onChange={(e) => setSettings({ autoAudio: e.target.checked })} className="h-5 w-5" /> Lire la consigne automatiquement</label>
        <button onClick={() => speak('Bonjour ! Prêt pour une petite activité ?')} className="mt-3 rounded-full bg-soleil px-4 py-2 font-bold">Tester la voix</button>
        {!('speechSynthesis' in window) && <p className="mt-2 text-sm text-terre">Ce navigateur ne propose pas de voix. Essayez Chrome à jour.</p>}
      </Card>
      <Card>
        <h3 className="font-black">🔒 Code parent</h3>
        <div className="mt-2 flex gap-2">
          <input value={newCode} onChange={(e) => setNewCode(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="Nouveau code" className="w-40 rounded-xl border-2 border-slate-200 p-2 text-center text-xl tracking-widest" />
          <button disabled={newCode.length !== 4} onClick={() => { setSettings({ parentCode: newCode }); setNewCode(''); setMsg('Code modifié ✅'); }} className="rounded-full bg-vert px-4 font-bold text-white disabled:opacity-40">Changer</button>
        </div>
      </Card>
      <Card>
        <h3 className="font-black">💾 Sauvegarde</h3>
        <p className="text-sm text-slate-600">Les progrès sont enregistrés uniquement sur ce téléphone. Téléchargez une sauvegarde pour les transférer sur un autre appareil.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button onClick={download} className="rounded-full bg-ciel px-4 py-2 font-bold text-white">⬇️ Télécharger</button>
          <button onClick={() => fileRef.current.click()} className="rounded-full bg-slate-100 px-4 py-2 font-bold">⬆️ Restaurer</button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImport} />
          <button onClick={() => { if (confirm('Effacer les progrès de l’enfant actif ?')) resetProgress(s.currentProfile); }} className="rounded-full bg-terre-clair px-4 py-2 font-bold text-terre">Remettre à zéro</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Compte en ligne pour synchroniser : prévu dans une prochaine version (optionnel).</p>
      </Card>
      <Card>
        <h3 className="font-black">🛡️ Confidentialité</h3>
        <ul className="mt-1 list-disc pl-5 text-sm text-slate-600">
          <li>Aucune publicité, aucun traceur, aucun compte obligatoire.</li>
          <li>Seuls le prénom, l’avatar et les progrès sont enregistrés, sur ce téléphone.</li>
          <li>Rien n’est envoyé sur internet. Les voix enregistrées restent sur l’appareil.</li>
        </ul>
      </Card>
      {msg && <p className="text-center font-bold text-vert">{msg}</p>}
    </div>
  );
}
