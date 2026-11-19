import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Btn, Dots, Feedback, praise, encourage } from '../components/ui.jsx';
import { speak, stop, chime } from '../lib/audio.js';
import { fillName } from '../lib/content.js';
import { useStore, currentProfile } from '../lib/store.js';

const FONT = (px) => `bold ${px}px Andika, "Comic Sans MS", "Trebuchet MS", system-ui, sans-serif`;
const DASH = '#334155';     // pointillés bien visibles
const FILL = '#FEF3C7';     // intérieur des lettres (jaune pâle)

/** Un prénom composé (« Marie Angélique ») devient une étape par mot : lettres plus grandes. */
function expand(items, name) {
  return items.flatMap((it) => {
    const g = it.guide ? fillName(it.guide, name) : null;
    const words = g && (it.mode || 'trace') === 'trace' ? g.split(' ').filter(Boolean) : [];
    if (words.length < 2) return [{ ...it, guide: g }];
    return words.map((w, k) => ({ ...it, guide: w, say: k === 0 ? it.say : `Et maintenant : ${w}.` }));
  });
}

/** Squelette d'un texte (amincissement Zhang-Suen) puis points régulièrement espacés :
 *  donne de vraies lettres en pointillés sur une seule ligne, comme dans un cahier. */
function dotsForText(text, font, w, h, x, y, gap) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.font = font; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = '#000';
  g.fillText(text, x, y);
  const d = g.getImageData(0, 0, w, h).data;
  const im = new Uint8Array(w * h);
  for (let k = 0; k < w * h; k++) im[k] = d[k * 4 + 3] > 127 ? 1 : 0;
  const at = (i, j) => im[j * w + i];
  let changed = true;
  const del = [];
  while (changed) {
    changed = false;
    for (let pass = 0; pass < 2; pass++) {
      del.length = 0;
      for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) {
        if (!at(i, j)) continue;
        const P = [at(i, j - 1), at(i + 1, j - 1), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1), at(i - 1, j + 1), at(i - 1, j), at(i - 1, j - 1)];
        const B = P.reduce((a, b) => a + b, 0);
        if (B < 2 || B > 6) continue;
        let A = 0; for (let k = 0; k < 8; k++) if (!P[k] && P[(k + 1) % 8]) A++;
        if (A !== 1) continue;
        if (pass === 0 ? (P[0] * P[2] * P[4] || P[2] * P[4] * P[6]) : (P[0] * P[2] * P[6] || P[0] * P[4] * P[6])) continue;
        del.push(j * w + i);
      }
      if (del.length) { changed = true; del.forEach((k) => { im[k] = 0; }); }
    }
  }
  // suivre chaque trait pour poser les points à intervalle régulier
  const pts = [];
  const seen = new Uint8Array(w * h);
  const far = (px, py) => pts.every(([a, b]) => (a - px) ** 2 + (b - py) ** 2 >= gap * gap * 0.7);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (!im[j * w + i] || seen[j * w + i]) continue;
    const stack = [[i, j, gap]];
    while (stack.length) {
      const [ci, cj, acc] = stack.pop();
      if (seen[cj * w + ci]) continue;
      seen[cj * w + ci] = 1;
      let a = acc;
      if (a >= gap && far(ci, cj)) { pts.push([ci, cj]); a = 0; }
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const ni = ci + di, nj = cj + dj;
        if ((di || dj) && ni >= 0 && nj >= 0 && ni < w && nj < h && im[nj * w + ni] && !seen[nj * w + ni]) stack.push([ni, nj, a + Math.hypot(di, dj)]);
      }
    }
  }
  return pts;
}

/** Un mot long (« ANGÉLIQUE ») est coupé en deux lignes pour garder de grandes lettres. */
const splitWord = (t) => { if (t.length <= 6) return [t]; const k = Math.ceil(t.length / 2) - (t.length % 2 ? 1 : 0); return [t.slice(0, k) + '-', t.slice(k)]; };

/** Dessine un mot en gros points sur lignes de cahier (écran et fiche imprimée). */
export function drawTextGuide(ctx, text, w, h, forMask, rows = [text], maxR = 8) {
  const rowH = h / rows.length;
  let px = rowH * (text.length === 1 ? 0.8 : rows.length > 1 ? 0.62 : 0.7);
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.font = FONT(px);
  while (Math.max(...rows.map((t) => ctx.measureText(t).width)) > w * 0.94 && px > 28) { px -= 2; ctx.font = FONT(px); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const line = Math.max(2, px / 60);
  rows.forEach((t, k) => {
    const y = rowH * k + rowH * 0.5 + px * 0.3;
    if (forMask) { ctx.fillStyle = '#000'; ctx.fillText(t, w / 2, y); ctx.lineWidth = Math.max(16, px * 0.2); ctx.strokeStyle = '#000'; ctx.strokeText(t, w / 2, y); return; }
    // lignes de cahier : ligne d'écriture + hauteur des petites lettres
    ctx.strokeStyle = '#BFDBFE'; ctx.lineWidth = line;
    [y, y - px * 0.5, y - px * 0.72].forEach((ly, n) => { ctx.setLineDash(n ? [line * 3, line * 3] : []); ctx.beginPath(); ctx.moveTo(8, ly); ctx.lineTo(w - 8, ly); ctx.stroke(); });
    ctx.setLineDash([]);
    // lettre en fond jaune pâle, puis gros points sur le milieu du trait
    ctx.lineWidth = Math.max(10, px * 0.14); ctx.strokeStyle = FILL; ctx.strokeText(t, w / 2, y);
    ctx.fillStyle = FILL; ctx.fillText(t, w / 2, y);
    const r = Math.max(4, Math.min(maxR, px * 0.05));
    const pts = dotsForText(t, ctx.font, Math.round(w), Math.round(h), w / 2, y, r * 3.4);
    ctx.fillStyle = DASH;
    pts.forEach(([u, v]) => { ctx.beginPath(); ctx.arc(u + 0.5, v + 0.5, r, 0, Math.PI * 2); ctx.fill(); });
  });
  ctx.restore();
}

/** Image (data URL) d'un mot en pointillés, pour les fiches à imprimer. */
export function guideImage(text, w = 1800, h = 300) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
  drawTextGuide(ctx, text, w, h, false, [text], 14);
  return c.toDataURL('image/png');
}

/** Premier point d'un chemin SVG (pour la pastille verte de départ). */
const startOf = (d) => { const m = d.match(/M\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/); return m ? [+m[1], +m[2]] : null; };

/** Tracer avec le doigt : lettres, prénom, dessins guidés (mode trace) ou copie libre (mode copy). */
export default function Trace({ items: raw, onFinish }) {
  const name = useStore((s) => currentProfile(s)?.name || 'Awa');
  const items = useMemo(() => expand(raw, name), [raw, name]);
  const [i, setI] = useState(0);
  const [fb, setFb] = useState(null);
  const [tries, setTries] = useState(0);
  const item = items[i];
  const mode = item.mode || 'trace';
  const guide = item.guide || null;

  const wrap = useRef(null);
  const canvas = useRef(null);
  const mask = useRef(null);   // pixels du modèle
  const ink = useRef(null);    // pixels tracés par l'enfant
  const drawing = useRef(false);
  const last = useRef(null);
  const [size, setSize] = useState({ w: 320, h: 220 });

  useLayoutEffect(() => {
    const w = Math.min(wrap.current.clientWidth, 520);
    const h = item.path ? Math.min(w, 420) : Math.round(w * (mode !== 'trace' ? 0.62 : guide && splitWord(guide).length > 1 ? 0.95 : 0.66));
    setSize({ w, h });
  }, [i, guide]);
  // la police d'écolier doit être chargée avant de dessiner les pointillés
  const [fontOk, setFontOk] = useState(0);
  useEffect(() => { document.fonts?.load(FONT(60), guide || 'a').then(() => setFontOk((n) => n + 1)).catch(() => {}); }, [guide]);

  useEffect(() => {
    setFb(null); setTries(0);
    const id = setTimeout(() => speak(item.say || 'Suis les pointillés avec ton doigt.'), 300);
    return () => clearTimeout(id);
  }, [i]);

  const drawGuide = (ctx, w, h, forMask) => {
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (item.path) {
      const s = Math.min(w, h) / 100;
      ctx.translate((w - 100 * s) / 2, (h - 100 * s) / 2);
      ctx.scale(s, s);
      const p = new Path2D(item.path);
      if (forMask) { ctx.lineWidth = 26 / s; ctx.strokeStyle = '#000'; ctx.stroke(p); }
      else {
        ctx.lineWidth = 24 / s; ctx.strokeStyle = FILL; ctx.stroke(p);
        ctx.setLineDash([0.01, 13 / s]); ctx.lineWidth = 9 / s; ctx.strokeStyle = DASH; ctx.stroke(p);
        const st = startOf(item.path);
        if (st) { ctx.setLineDash([]); ctx.fillStyle = '#16A34A'; ctx.beginPath(); ctx.arc(st[0], st[1], 11 / s, 0, Math.PI * 2); ctx.fill(); }
      }
    } else if (guide && mode === 'trace') {
      drawTextGuide(ctx, guide, w, h, forMask, splitWord(guide));
    }
    ctx.restore();
  };

  const paintBase = () => {
    const c = canvas.current; if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = size.w * dpr; c.height = size.h * dpr;
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size.w, size.h);
    if (mode === 'copy') {
      ctx.strokeStyle = '#BFDBFE'; ctx.lineWidth = 2;
      [0.3, 0.55, 0.8].forEach((r) => { ctx.beginPath(); ctx.moveTo(10, size.h * r); ctx.lineTo(size.w - 10, size.h * r); ctx.stroke(); });
    }
    drawGuide(ctx, size.w, size.h, false);
    // masques (résolution réduite)
    const m = document.createElement('canvas'); m.width = size.w; m.height = size.h;
    drawGuide(m.getContext('2d'), size.w, size.h, true);
    mask.current = m;
    const k = document.createElement('canvas'); k.width = size.w; k.height = size.h;
    ink.current = k;
  };
  useEffect(paintBase, [size, i, guide, fontOk]);

  const pos = (e) => {
    const r = canvas.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const line = (a, b) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const [ctx, scale] of [[canvas.current.getContext('2d'), dpr], [ink.current.getContext('2d'), 1]]) {
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.strokeStyle = '#1D63C4'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  };
  const down = (e) => { e.preventDefault(); canvas.current.setPointerCapture?.(e.pointerId); drawing.current = true; last.current = pos(e); line(last.current, { x: last.current.x + 0.1, y: last.current.y }); };
  const move = (e) => { if (!drawing.current) return; const p = pos(e); line(last.current, p); last.current = p; };
  const up = () => { drawing.current = false; };

  const coverage = () => {
    const w = size.w, h = size.h;
    const m = mask.current.getContext('2d').getImageData(0, 0, w, h).data;
    const k = ink.current.getContext('2d').getImageData(0, 0, w, h).data;
    let g = 0, hit = 0, inked = 0;
    for (let p = 3; p < m.length; p += 4 * 3) {
      if (k[p] > 0) inked++;
      if (m[p] > 0) { g++; if (k[p] > 0) hit++; }
    }
    return { cov: g ? hit / g : 1, inked };
  };

  const next = () => {
    stop();
    if (i + 1 < items.length) setI(i + 1);
    else onFinish({ errors: 0, revealed: 0, total: items.length, perItem: [] });
  };

  const finish = () => {
    const { cov, inked } = coverage();
    if (inked < 20) { setFb({ kind: 'try', text: 'Trace avec ton doigt sur l’écran.' }); speak('Trace avec ton doigt sur l’écran.'); return; }
    const needed = mode === 'copy' ? 0 : 0.35;
    if (cov >= needed || tries >= 2) {
      const p = praise(); chime('ok'); setFb({ kind: 'ok', text: p.fr, wo: p.wo }); speak(p.fr);
      setTimeout(next, 1400);
    } else {
      setTries(tries + 1);
      const e = encourage();
      setFb({ kind: 'try', text: e.fr, wo: e.wo, hint: 'Suis bien les pointillés, du début à la fin.' });
      speak('Continue de suivre les pointillés.');
    }
  };

  return (
    <div className="flex flex-col items-center px-3">
      <Dots n={items.length} i={i} />
      {mode === 'copy' && guide && (
        <div className="mb-2 rounded-2xl bg-white px-6 py-2 text-5xl font-black tracking-wider text-ink shadow-sm" style={{ fontFamily: 'Andika, "Comic Sans MS", system-ui' }}>{guide}</div>
      )}
      {item.label && <p className="mb-1 text-lg font-bold">{item.label}</p>}
      <div ref={wrap} className="w-full max-w-[520px]">
        <canvas ref={canvas} style={{ width: size.w, height: size.h, touchAction: 'none' }}
          className="mx-auto block rounded-3xl border-4 border-ciel/30 bg-white"
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up} aria-label="zone de tracé" />
      </div>
      <div className="mt-3 flex gap-3">
        <Btn color="blanc" onClick={paintBase}>Effacer 🧽</Btn>
        <Btn color="vert" onClick={finish}>J'ai fini ✅</Btn>
      </div>
      <button onClick={() => speak(item.say)} className="mt-3 grid h-12 w-12 place-items-center rounded-full bg-soleil text-2xl shadow" aria-label="Réécouter">🔊</button>
      <Feedback fb={fb} />
    </div>
  );
}
