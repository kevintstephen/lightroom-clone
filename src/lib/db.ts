import type { ImageAdjustments, Photo, Preset } from '../types';

export interface StoredPhoto {
  id: string;
  name: string;
  dateAdded: Date;
  adjustments: ImageAdjustments;
  blob: Blob;
}

const DB_NAME = 'lightroom-clone';
const PHOTO_STORE = 'photos';
const PRESET_STORE = 'presets';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(PRESET_STORE)) {
        db.createObjectStore(PRESET_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function waitFor(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function getAll<T>(store: string): Promise<T[]> {
  const db = await openDB();
  try {
    return await new Promise<T[]>((resolve, reject) => {
      const request = db.transaction(store, 'readonly').objectStore(store).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

async function put(store: string, value: unknown): Promise<void> {
  const db = await openDB();
  try {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value);
    await waitFor(tx);
  } finally {
    db.close();
  }
}

async function remove(store: string, id: string): Promise<void> {
  const db = await openDB();
  try {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(id);
    await waitFor(tx);
  } finally {
    db.close();
  }
}

export function toStoredPhoto(photo: Photo): StoredPhoto {
  const { id, name, dateAdded, adjustments, blob } = photo;
  return { id, name, dateAdded, adjustments, blob };
}

export async function loadPhotos(): Promise<StoredPhoto[]> {
  const photos = await getAll<StoredPhoto>(PHOTO_STORE);
  return photos.sort(
    (a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()
  );
}

export function savePhoto(photo: StoredPhoto): Promise<void> {
  return put(PHOTO_STORE, photo);
}

export function deletePhotoRecord(id: string): Promise<void> {
  return remove(PHOTO_STORE, id);
}

export function loadPresets(): Promise<Preset[]> {
  return getAll<Preset>(PRESET_STORE);
}

export function savePreset(preset: Preset): Promise<void> {
  return put(PRESET_STORE, preset);
}

export function deletePresetRecord(id: string): Promise<void> {
  return remove(PRESET_STORE, id);
}
