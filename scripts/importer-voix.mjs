// Ajoute au site les voix enregistrées dans l'application (Espace parent > Voix > « Partager mes voix »).
// Usage : node scripts/importer-voix.mjs voix-wo-2026-11-20.json
// Chaque voix devient public/audio/<langue>/<id>.<ext> et est déclarée dans src/data/audio-manifest.json,
// pour que tous les appareils l'aient (hors ligne compris).
import fs from 'node:fs';
import path from 'node:path';

const file = process.argv[2];
if (!file) { console.error('Usage : node scripts/importer-voix.mjs <fichier.json>'); process.exit(1); }
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
if (data.format !== 'mon-ecole-voix') { console.error('Ce fichier n’est pas un export de voix.'); process.exit(1); }

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const manifestPath = path.join(root, 'src/data/audio-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const lang = data.lang;
const dir = path.join(root, 'public/audio', lang);
fs.mkdirSync(dir, { recursive: true });
manifest[lang] ||= {};

const ext = (type) => (/ogg/.test(type) ? 'ogg' : /mp4|m4a|aac/.test(type) ? 'm4a' : /mpeg|mp3/.test(type) ? 'mp3' : 'webm');
let n = 0;
for (const [id, clip] of Object.entries(data.clips)) {
  if (!/^[\w-]+$/.test(id)) { console.warn('Identifiant ignoré :', id); continue; }
  const name = `${id}.${ext(clip.type)}`;
  fs.writeFileSync(path.join(dir, name), Buffer.from(clip.data, 'base64'));
  manifest[lang][id] = `audio/${lang}/${name}`;
  n++;
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`${n} voix ajoutée(s) dans public/audio/${lang}/`);
