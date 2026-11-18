import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Btn, Dots, Feedback, praise, encourage } from '../components/ui.jsx';
import { speak, stop, chime } from '../lib/audio.js';
import { fillName } from '../lib/content.js';
import { useStore, currentProfile } from '../lib/store.js';

const FONT = (px) => `bold ${px}px Andika, "Comic Sans MS", "Trebuchet MS", system-ui, sans-serif`;

/** Tracer avec le doigt : lettres, prénom, dessins guidés (mode trace) ou copie libre (mode copy). */
export default function Trace({ items, onFinish }) {
  const name = useStore((s) => currentProfile(s)?.name || 'Awa');
  const [i, setI] = useState(0);
  const [fb, setFb] = useState(null);
  const [tries, setTries] = useState(0);
  const item = items[i];
  const mode = item.mode || 'trace';
  const guide = item.guide ? fillName(item.guide, name) : null;

  const wrap = useRef(null);
  const canvas = useRef(null);
  const mask = useRef(null);   // pixels du modèle
  const ink = useRef(null);    // pixels tracés par l'enfant
  const drawing = useRef(false);
  const last = useRef(null);
  const [size, setSize] = useState({ w: 320, h: 220 });

  useLayoutEffect(() => {
    const w = Math.min(wrap.current.clientWidth, 520);
    const h = item.path ? Math.min(w, 380) : Math.round(w * 0.62);
    setSize({ w, h });
  }, [i]);

  useEffect(() => {
    setFb(null); setTries(0);
    const id = setTimeout(() => speak(item.say || 'Suis les pointillés avec ton doigt.'), 300);
    return () => clearTimeout(id);
  }, [i]);

  const drawGuide = (ctx, w, h, forMask) => {
    ctx.save();
    if (item.path) {
      const s = Math.min(w, h) / 100;
      ctx.translate((w - 100 * s) / 2, (h - 100 * s) / 2);
      ctx.scale(s, s);
      const p = new Path2D(item.path);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (forMask) { ctx.lineWidth = 16 / s * 1.0; ctx.strokeStyle = '#000'; ctx.stroke(p); }
      else {
        ctx.lineWidth = 12 / s; ctx.strokeStyle = '#E2E8F0'; ctx.stroke(p);
        ctx.setLineDash([3, 3]); ctx.lineWidth = 2.2 / s * 1.4; ctx.strokeStyle = '#64748B'; ctx.stroke(p);
      }
    } else if (guide && mode === 'trace') {
      let px = h * 0.78;
      ctx.font = FONT(px);
      while (ctx.measureText(guide).width > w * 0.92 && px > 24) { px -= 4; ctx.font = FONT(px); }
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      const y = h * 0.5 + px * 0.33;
      if (forMask) { ctx.fillStyle = '#000'; ctx.fillText(guide, w / 2, y); ctx.lineWidth = 10; ctx.strokeStyle = '#000'; ctx.strokeText(guide, w / 2, y); }
      else {
        ctx.fillStyle = '#EEF2F7'; ctx.fillText(guide, w / 2, y);
        ctx.setLineDash([6, 6]); ctx.lineWidth = 3; ctx.strokeStyle = '#64748B'; ctx.strokeText(guide, w / 2, y);
      }
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
  useEffect(paintBase, [size, i, guide]);

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
      setFb({ kind: 'try', text: e.fr, wo: e.wo, hint: 'Suis bien les pointillés gris, du début à la fin.' });
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
