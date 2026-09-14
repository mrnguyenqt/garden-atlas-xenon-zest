const DB_NAME = "rung-photo-blobs-v1";
const STORE = "blobs";

const urls = new Map<string, string>();

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function photoRef(id: string) {
  return `blobid:${id}`;
}

export function isPhotoRef(src: string) {
  return src.startsWith("blobid:");
}

export function photoRefId(src: string) {
  return src.slice(7);
}

export async function savePhotoBlob(id: string, blob: Blob) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function photoObjectUrl(id: string) {
  const hit = urls.get(id);
  if (hit) return hit;
  const db = await openDb();
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const q = tx.objectStore(STORE).get(id);
    q.onsuccess = () => resolve(q.result as Blob | undefined);
    q.onerror = () => reject(q.error);
  });
  if (!blob) return "";
  const url = URL.createObjectURL(blob);
  urls.set(id, url);
  return url;
}

export async function deletePhotoBlob(id: string) {
  const url = urls.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    urls.delete(id);
  }
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* ignore */
  }
}
