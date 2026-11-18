// Rendu d'une chaîne « visuelle » décrite dans le JSON :
//  "🥭x3"                 → 3 mangues
//  "coin:100" "bill:1000" → pièce / billet en francs CFA
//  "shape:circle:#DC2626" → forme (circle, square, triangle, rectangle)
//  "color:#16A34A"        → pastille de couleur
//  "big:ma"               → texte en grandes lettres
//  "scene:sur:🐈:📦"      → petite scène de position (sur, sous, devant, derriere, gauche, droite)
//  "t:Une phrase."        → texte libre (toute la chaîne)
//  tout autre mot         → affiché tel quel (emoji, +, -, =, ❓)
import React from 'react';

export function Shape({ kind, color = '#64748B', size = 56 }) {
  const s = size;
  const common = { fill: color, stroke: '#1F2933', strokeWidth: 3 };
  if (kind === 'circle') return <svg width={s} height={s} viewBox="0 0 60 60" aria-label="cercle"><circle cx="30" cy="30" r="26" {...common} /></svg>;
  if (kind === 'square') return <svg width={s} height={s} viewBox="0 0 60 60" aria-label="carré"><rect x="5" y="5" width="50" height="50" rx="3" {...common} /></svg>;
  if (kind === 'triangle') return <svg width={s} height={s} viewBox="0 0 60 60" aria-label="triangle"><path d="M30 5 L56 54 L4 54 Z" {...common} strokeLinejoin="round" /></svg>;
  if (kind === 'rectangle') return <svg width={s * 1.5} height={s} viewBox="0 0 90 60" aria-label="rectangle"><rect x="4" y="14" width="82" height="34" rx="3" {...common} /></svg>;
  return null;
}

function Coin({ value, size }) {
  const big = value >= 100;
  const s = size * (big ? 1.3 : 1.15);
  return (
    <span className="inline-flex items-center justify-center rounded-full font-black text-ink shadow-inner"
      style={{ width: s, height: s, fontSize: s * 0.32, background: big ? 'radial-gradient(circle,#F3F4F6,#9CA3AF)' : 'radial-gradient(circle,#FDE68A,#D97706)', border: '3px solid #78350F' }}
      aria-label={`pièce de ${value} francs`}>
      {value}<span style={{ fontSize: s * 0.2 }}>F</span>
    </span>
  );
}
function Bill({ value, size }) {
  return (
    <span className="inline-flex items-center justify-center rounded-md font-black text-white"
      style={{ width: size * 1.8, height: size, fontSize: size * 0.3, background: '#0E7C66', border: '3px solid #064E3B' }}
      aria-label={`billet de ${value} francs`}>{value} F</span>
  );
}

const sceneLayout = {
  sur: { a: { bottom: '52%', left: '30%' }, b: { bottom: '4%', left: '25%' } },
  sous: { a: { bottom: '4%', left: '38%', z: 1 }, b: { bottom: '28%', left: '25%' }, bBig: true },
  devant: { a: { bottom: '2%', left: '22%', z: 3, scale: 1 }, b: { bottom: '18%', left: '30%', z: 1, scale: 1.3 } },
  derriere: { a: { bottom: '22%', left: '42%', z: 1, scale: 0.8 }, b: { bottom: '2%', left: '22%', z: 3, scale: 1.4 } },
  gauche: { a: { bottom: '8%', left: '4%' }, b: { bottom: '8%', left: '52%' } },
  droite: { a: { bottom: '8%', left: '58%' }, b: { bottom: '8%', left: '6%' } }
};
function Scene({ rel, a, b, size }) {
  const L = sceneLayout[rel] || sceneLayout.sur;
  const w = size * 2.4, h = size * 2.2;
  const pos = (p, e) => (
    <span className="absolute leading-none" style={{ bottom: p.bottom, left: p.left, zIndex: p.z || 2, fontSize: size * (p.scale || 1) }}>{e}</span>
  );
  return (
    <span className="relative inline-block rounded-xl bg-white/70" style={{ width: w, height: h }} aria-label={`scène : ${rel}`}>
      {pos(L.b, b)}
      {pos(L.a, a)}
      <span className="absolute left-1 right-1 bottom-0 h-1 rounded bg-amber-800/40" />
    </span>
  );
}

function Token({ tok, size }) {
  const rep = tok.match(/^(.+?)x(\d{1,2})$/u);
  if (rep && !tok.includes(':')) {
    const n = Number(rep[2]);
    return (
      <span className="inline-flex flex-wrap justify-center gap-0.5" style={{ maxWidth: size * (n > 4 ? 3.4 : 4.6) }} aria-label={`${n}`}>
        {Array.from({ length: n }, (_, i) => <span key={i} style={{ fontSize: size * (n > 6 ? 0.55 : 0.7) }} className="leading-none">{rep[1]}</span>)}
      </span>
    );
  }
  const [kind, ...rest] = tok.split(':');
  switch (kind) {
    case 'coin': return <Coin value={Number(rest[0])} size={size} />;
    case 'bill': return <Bill value={Number(rest[0])} size={size} />;
    case 'shape': return <Shape kind={rest[0]} color={rest[1]} size={size} />;
    case 'color': return <span className="inline-block rounded-full border-4 border-ink/70" style={{ width: size * 0.8, height: size * 0.8, background: rest[0] }} aria-label="couleur" />;
    case 'big': return <span className="font-black text-ink tracking-wide" style={{ fontSize: size * 0.75, fontFamily: 'Andika, "Comic Sans MS", system-ui, sans-serif' }}>{rest.join(':').replace(/_/g, '◻︎')}</span>;
    case 'scene': return <Scene rel={rest[0]} a={rest[1]} b={rest[2]} size={size} />;
    default: return <span className="leading-none" style={{ fontSize: size * (/^[+\-=−]$/.test(tok) ? 0.6 : 0.85) }}>{tok}</span>;
  }
}

export default function Visual({ v, size = 64, className = '' }) {
  if (v === undefined || v === null || v === '') return null;
  const str = String(v);
  if (str.startsWith('t:')) {
    return <span className={`font-bold text-ink ${className}`} style={{ fontSize: Math.max(22, size * 0.42), fontFamily: 'Andika, "Comic Sans MS", system-ui, sans-serif' }}>{str.slice(2)}</span>;
  }
  // "big:ma ma" → garder les espaces dans un même jeton big
  const tokens = [];
  str.split(' ').forEach((t) => {
    if (!t) return;
    const prev = tokens[tokens.length - 1];
    if (prev && prev.startsWith('big:') && !t.includes(':') && /^[\p{L}◻_]+$/u.test(t) && !/^[+\-=]$/.test(t)) tokens[tokens.length - 1] = prev + ' ' + t;
    else tokens.push(t);
  });
  return (
    <span className={`inline-flex flex-wrap items-center justify-center gap-2 ${className}`}>
      {tokens.map((t, i) => <Token key={i} tok={t} size={size} />)}
    </span>
  );
}
