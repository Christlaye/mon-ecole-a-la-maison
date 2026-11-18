// Petit utilitaire IndexedDB pour stocker les enregistrements audio du parent.
const DB = 'mon-ecole-audio';
const STORE = 'clips';

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function tx(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const r = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(r && 'result' in r ? r.result : undefined);
    t.onerror = () => reject(t.error);
  });
}
export const clips = {
  get: (key) => tx('readonly', (s) => s.get(key)).catch(() => undefined),
  set: (key, blob) => tx('readwrite', (s) => s.put(blob, key)),
  del: (key) => tx('readwrite', (s) => s.delete(key)),
  keys: () => tx('readonly', (s) => s.getAllKeys()).catch(() => [])
};
