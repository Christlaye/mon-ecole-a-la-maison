import React, { useEffect, useRef, useState } from 'react';
import { useStore, saveCustomActivity, deleteCustomActivity, getState } from '../lib/store.js';
import { allActivities, subjects, isBuiltIn, builtInById, getActivity, LEVELS, actLevel, levelInfo } from '../lib/content.js';
import { engineLabels } from '../engines/index.js';
import Visual from '../components/Visual.jsx';
import { Card, Btn } from '../components/ui.jsx';
import { go } from '../router.js';

const blank = (type = 'choice') => ({
  id: 'perso-' + Date.now().toString(36), level: levelInfo(getState()).wanted, week: 1, subject: 'francais', icon: '⭐', notion: '',
  title: { fr: '', wo: '' }, type,
  instruction: { fr: '', wo: '' },
  items: type === 'count' ? [{ mode: 'tap', object: '🥭', n: 3, options: [2, 3, 4], label: 'mangues' }]
    : type === 'parent' ? [{ v: '🪨x5', text: '' }]
    : [{ say: '', prompt: '', label: '', options: ['', '', ''], answer: 0, hint: '', explain: '' }],
  offscreen: { fr: '' }
});

export default function Admin({ editId }) {
  const s = useStore();
  if (editId) return <Editor key={editId} id={editId} />;
  const list = allActivities(s, { allLevels: true });
  const exportCustom = () => {
    const blob = new Blob([JSON.stringify(Object.values(s.custom), null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mes-activites.json'; a.click();
  };
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <p className="text-sm">Créez ou modifiez une activité sans coder. Vos activités sont enregistrées sur ce téléphone. Les visuels utilisent des emojis (🥭, 🐑…) et quelques codes simples : <code>🥭x3</code> (3 mangues), <code>coin:100</code> (pièce), <code>shape:circle:#DC2626</code> (forme), <code>big:ma</code> (grosses lettres). Écrivez <code>{'{nom}'}</code> pour le prénom de l’enfant.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn color="vert" onClick={() => go('#/admin/nouveau-choice')}>➕ Questions à images</Btn>
          <Btn color="terre" onClick={() => go('#/admin/nouveau-count')}>➕ Comptage</Btn>
          <Btn color="violet" onClick={() => go('#/admin/nouveau-parent')}>➕ Hors écran</Btn>
        </div>
        {Object.keys(s.custom).length > 0 && <button onClick={exportCustom} className="mt-3 text-sm font-bold text-ciel underline">⬇️ Exporter mes activités (JSON)</button>}
      </Card>
      <ul className="flex flex-col gap-2">
        {list.map((a) => (
          <li key={a.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
            <span className="text-3xl">{a.icon}</span>
            <span className="flex-1 text-sm"><b>{a.title.fr || '(sans titre)'}</b><br /><span className="text-slate-500">{actLevel(a)} · S{a.week} · {subjects.find((x) => x.id === a.subject)?.label.fr} · {engineLabels[a.type]}{s.custom[a.id] ? (isBuiltIn(a.id) ? ' · modifiée' : ' · créée par vous') : ''}</span></span>
            <a href={`#/admin/${a.id}`} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">Modifier</a>
            <a href={`#/activite/${a.id}`} className="rounded-full bg-vert px-3 py-1 text-sm font-bold text-white">▶️</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="block text-sm font-bold">{label}<div className="mt-1 font-normal">{children}</div></label>;
}
const inp = 'w-full rounded-xl border-2 border-slate-200 p-2';

function Editor({ id }) {
  const s = useStore();
  const isNew = id.startsWith('nouveau-');
  const [a, setA] = useState(() => (isNew ? blank(id.replace('nouveau-', '')) : JSON.parse(JSON.stringify(getActivity(id, s, { raw: true }) || blank()))));
  const [json, setJson] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [msg, setMsg] = useState('');
  const set = (patch) => setA({ ...a, ...patch });
  const setItem = (k, patch) => set({ items: a.items.map((it, j) => (j === k ? { ...it, ...patch } : it)) });

  const save = () => {
    let obj = a;
    if (json) { try { obj = JSON.parse(jsonText); } catch { setMsg('JSON invalide : vérifiez les virgules et guillemets.'); return; } }
    if (!obj.title?.fr) { setMsg('Ajoutez un titre.'); return; }
    if (!obj.items?.length) { setMsg('Ajoutez au moins une question.'); return; }
    saveCustomActivity({ ...obj, week: Number(obj.week) || 1 });
    setMsg('Enregistré ✅');
    if (isNew) go(`#/admin/${obj.id}`);
  };

  return (
    <div className="flex flex-col gap-3">
      <a href="#/admin" className="text-sm font-bold text-ciel underline">⬅️ Toutes les activités</a>
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between"><h3 className="text-lg font-black">{isNew ? 'Nouvelle activité' : 'Modifier l’activité'}</h3>
          <button onClick={() => { if (!json) setJsonText(JSON.stringify(a, null, 2)); else { try { setA(JSON.parse(jsonText)); } catch { setMsg('JSON invalide'); return; } } setJson(!json); }} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{json ? 'Formulaire' : 'Mode JSON (avancé)'}</button>
        </div>
        {json ? (
          <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} rows={22} className={`${inp} font-mono text-xs`} spellCheck={false} />
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2">
              <Field label="Niveau"><select value={actLevel(a)} onChange={(e) => set({ level: e.target.value })} className={inp}>{LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}</select></Field>
              <Field label="Icône"><input value={a.icon} onChange={(e) => set({ icon: e.target.value })} className={`${inp} text-center text-2xl`} /></Field>
              <Field label="Semaine"><input type="number" min="1" max="52" value={a.week} onChange={(e) => set({ week: e.target.value })} className={inp} /></Field>
              <Field label="Matière"><select value={a.subject} onChange={(e) => set({ subject: e.target.value })} className={inp}>{subjects.map((x) => <option key={x.id} value={x.id}>{x.label.fr}</option>)}</select></Field>
            </div>
            <Field label="Titre (très court)"><input value={a.title.fr} onChange={(e) => set({ title: { ...a.title, fr: e.target.value } })} className={inp} /></Field>
            <Field label="Titre en wolof (optionnel)"><input value={a.title.wo || ''} onChange={(e) => set({ title: { ...a.title, wo: e.target.value } })} className={inp} /></Field>
            <Field label="Notion travaillée"><input value={a.notion} onChange={(e) => set({ notion: e.target.value })} className={inp} placeholder="ex. Compter jusqu'à 10" /></Field>
            <Field label="Consigne (lue à voix haute)"><input value={a.instruction.fr} onChange={(e) => set({ instruction: { ...a.instruction, fr: e.target.value } })} className={inp} /></Field>
            <Field label="Consigne en wolof"><input value={a.instruction.wo || ''} onChange={(e) => set({ instruction: { ...a.instruction, wo: e.target.value } })} className={inp} /></Field>
            <p className="text-xs text-slate-500">Type : {engineLabels[a.type]}</p>
            {a.type === 'choice' && <ChoiceItems a={a} set={set} setItem={setItem} />}
            {a.type === 'count' && <CountItems a={a} set={set} setItem={setItem} />}
            {a.type === 'parent' && <ParentItems a={a} set={set} setItem={setItem} />}
            {!['choice', 'count', 'parent'].includes(a.type) && <p className="rounded-xl bg-soleil-clair p-3 text-sm">Pour ce type de jeu, modifiez les questions en <b>mode JSON</b> (bouton en haut).</p>}
            <Field label="Activité hors écran conseillée au parent"><textarea value={a.offscreen?.fr || ''} onChange={(e) => set({ offscreen: { ...a.offscreen, fr: e.target.value } })} rows={2} className={inp} /></Field>
          </>
        )}
        {msg && <p className="font-bold text-vert">{msg}</p>}
        <div className="flex flex-wrap gap-2">
          <Btn onClick={save}>💾 Enregistrer</Btn>
          {!isNew && <Btn color="ciel" onClick={() => go(`#/activite/${a.id}`)}>▶️ Essayer</Btn>}
          {!isNew && s.custom[a.id] && <Btn color="blanc" onClick={() => { if (confirm(isBuiltIn(a.id) ? 'Revenir à la version d’origine ?' : 'Supprimer cette activité ?')) { deleteCustomActivity(a.id); go('#/admin'); } }}>{isBuiltIn(a.id) ? '↩️ Version d’origine' : '🗑️ Supprimer'}</Btn>}
        </div>
      </Card>
    </div>
  );
}

function ItemShell({ k, a, set, children }) {
  return (
    <div className="rounded-2xl border-2 border-slate-200 p-3">
      <div className="mb-2 flex items-center justify-between"><b>Question {k + 1}</b>
        {a.items.length > 1 && <button onClick={() => set({ items: a.items.filter((_, j) => j !== k) })} className="text-xs font-bold text-terre">Retirer</button>}</div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function ChoiceItems({ a, set, setItem }) {
  return (
    <div className="flex flex-col gap-3">
      {a.items.map((it, k) => (
        <ItemShell key={k} k={k} a={a} set={set}>
          <Field label="Phrase dite à voix haute"><input value={it.say || ''} onChange={(e) => setItem(k, { say: e.target.value })} className={inp} placeholder="ex. Touche la mangue." /></Field>
          <Field label="Image de la question (optionnel)"><input value={it.prompt || ''} onChange={(e) => setItem(k, { prompt: e.target.value })} className={inp} placeholder="ex. 🥭x3" /></Field>
          <div className="text-sm font-bold">Réponses (cochez la bonne)</div>
          {it.options.map((o, j) => (
            <div key={j} className="flex items-center gap-2">
              <input type="radio" checked={it.answer === j} onChange={() => setItem(k, { answer: j })} className="h-5 w-5" aria-label="bonne réponse" />
              <input value={o} onChange={(e) => setItem(k, { options: it.options.map((x, m) => (m === j ? e.target.value : x)) })} className={inp} placeholder="emoji ou big:mot" />
              <span className="w-16 text-center"><Visual v={o} size={32} /></span>
            </div>
          ))}
          <div className="flex gap-2 text-xs font-bold">
            {it.options.length < 4 && <button onClick={() => setItem(k, { options: [...it.options, ''] })}>+ réponse</button>}
            {it.options.length > 2 && <button onClick={() => setItem(k, { options: it.options.slice(0, -1), answer: Math.min(it.answer, it.options.length - 2) })}>− réponse</button>}
          </div>
          <Field label="Indice (après une erreur)"><input value={it.hint || ''} onChange={(e) => setItem(k, { hint: e.target.value })} className={inp} /></Field>
          <Field label="Explication (après 3 essais)"><input value={it.explain || ''} onChange={(e) => setItem(k, { explain: e.target.value })} className={inp} /></Field>
        </ItemShell>
      ))}
      {a.items.length < 6 && <button onClick={() => set({ items: [...a.items, { say: '', options: ['', '', ''], answer: 0, hint: '', explain: '' }] })} className="rounded-xl bg-slate-100 p-2 font-bold">+ Ajouter une question</button>}
    </div>
  );
}

function CountItems({ a, set, setItem }) {
  return (
    <div className="flex flex-col gap-3">
      {a.items.map((it, k) => (
        <ItemShell key={k} k={k} a={a} set={set}>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Objet"><input value={it.object} onChange={(e) => setItem(k, { object: e.target.value })} className={`${inp} text-center text-2xl`} /></Field>
            <Field label="Nombre"><input type="number" min="0" max="20" value={it.n} onChange={(e) => { const n = Number(e.target.value); setItem(k, { n, options: [Math.max(0, n - 1), n, n + 1] }); }} className={inp} /></Field>
            <Field label="Jeu"><select value={it.mode} onChange={(e) => setItem(k, { mode: e.target.value })} className={inp}><option value="tap">Compter</option><option value="make">Remplir le panier</option></select></Field>
          </div>
          <Field label="Nom des objets (pluriel)"><input value={it.label || ''} onChange={(e) => setItem(k, { label: e.target.value })} className={inp} /></Field>
        </ItemShell>
      ))}
      {a.items.length < 6 && <button onClick={() => set({ items: [...a.items, { mode: 'tap', object: '🥭', n: 3, options: [2, 3, 4], label: 'mangues' }] })} className="rounded-xl bg-slate-100 p-2 font-bold">+ Ajouter</button>}
    </div>
  );
}

function ParentItems({ a, set, setItem }) {
  return (
    <div className="flex flex-col gap-3">
      {a.items.map((it, k) => (
        <ItemShell key={k} k={k} a={a} set={set}>
          <Field label="Image (emojis)"><input value={it.v} onChange={(e) => setItem(k, { v: e.target.value })} className={inp} /></Field>
          <Field label="Consigne pour le parent"><textarea value={it.text} onChange={(e) => setItem(k, { text: e.target.value })} rows={2} className={inp} /></Field>
        </ItemShell>
      ))}
      {a.items.length < 6 && <button onClick={() => set({ items: [...a.items, { v: '⭐', text: '' }] })} className="rounded-xl bg-slate-100 p-2 font-bold">+ Ajouter une étape</button>}
    </div>
  );
}
