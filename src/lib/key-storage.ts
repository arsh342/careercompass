/**
 * Key Storage Utilities
 * Stores encryption keys securely in IndexedDB
 */

const DB_NAME = "careercompass-keys";
const DB_VERSION = 1;
const STORE_NAME = "encryption-keys";

interface StoredKeys {
  id: string; // user ID
  publicKey: string;
  privateKey: string;
  createdAt: number;
}

/**
 * Open the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open key database"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

/**
 * Store keys in IndexedDB
 */
export async function storeKeys(
  userId: string,
  publicKey: string,
  privateKey: string
): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const data: StoredKeys = {
      id: userId,
      publicKey,
      privateKey,
      createdAt: Date.now(),
    };

    const request = store.put(data);

    request.onerror = () => {
      reject(new Error("Failed to store keys"));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Retrieve keys from IndexedDB
 */
export async function getKeys(userId: string): Promise<StoredKeys | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.get(userId);

    request.onerror = () => {
      reject(new Error("Failed to retrieve keys"));
    };

    request.onsuccess = () => {
      resolve(request.result || null);
    };
  });
}

/**
 * Check if keys exist for a user
 */
export async function hasKeys(userId: string): Promise<boolean> {
  const keys = await getKeys(userId);
  return keys !== null;
}

/**
 * Delete keys for a user
 */
export async function deleteKeys(userId: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.delete(userId);

    request.onerror = () => {
      reject(new Error("Failed to delete keys"));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Export keys for backup (encrypted with a password)
 * Returns a JSON string that can be saved
 */
export async function exportKeysForBackup(userId: string): Promise<string | null> {
  const keys = await getKeys(userId);
  if (!keys) return null;

  // In production, you'd encrypt this with a user-provided password
  // For now, just return the JSON
  return JSON.stringify({
    version: 1,
    userId: keys.id,
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
    exportedAt: Date.now(),
  });
}

/**
 * Import keys from backup
 */
export async function importKeysFromBackup(backupJson: string): Promise<boolean> {
  try {
    const backup = JSON.parse(backupJson);
    
    if (!backup.userId || !backup.publicKey || !backup.privateKey) {
      return false;
    }

    await storeKeys(backup.userId, backup.publicKey, backup.privateKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBSupported(): boolean {
  return typeof indexedDB !== "undefined";
}
