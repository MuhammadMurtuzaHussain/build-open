"use client";

import type { Project } from "./types";

// Projects live only in this browser (IndexedDB). No accounts, nothing in the cloud.
// If IndexedDB is unavailable (some private windows), we fall back to memory and
// tell the user their plan won't survive a refresh.

const DB_NAME = "build-open";
const STORE = "projects";
const VERSION = 1;

const memory = new Map<string, Project>();
let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function run<T>(db: IDBDatabase, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function isPersistent(): Promise<boolean> {
  return (await openDb()) !== null;
}

export async function listProjects(): Promise<Project[]> {
  const db = await openDb();
  const all = db ? await run<Project[]>(db, "readonly", (s) => s.getAll()) : [...memory.values()];
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await openDb();
  return db ? run<Project | undefined>(db, "readonly", (s) => s.get(id)) : memory.get(id);
}

export async function saveProject(p: Project): Promise<void> {
  const next = { ...p, updatedAt: Date.now() };
  const db = await openDb();
  if (db) await run(db, "readwrite", (s) => s.put(next));
  else memory.set(p.id, next);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDb();
  if (db) await run(db, "readwrite", (s) => s.delete(id));
  else memory.delete(id);
}

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
