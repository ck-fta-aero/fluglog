import type { Flight } from './types';

const DB_NAME = 'fluglog';
const STORE = 'flights';
let dbPromise: Promise<IDBDatabase> | undefined;

function open(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(req.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
  );
}

export const loadFlights = () => run<Flight[]>('readonly', (s) => s.getAll());

// Schreibvorgänge laufen strikt nacheinander
let kette: Promise<unknown> = Promise.resolve();
const queue = <T>(fn: () => Promise<T>): Promise<T> => {
  const next = kette.then(fn, fn);
  kette = next.catch(() => undefined);
  return next;
};

export const saveFlight = (f: Flight) => queue(() => run('readwrite', (s) => s.put(f)));
export const removeFlight = (id: string) => queue(() => run('readwrite', (s) => s.delete(id)));
