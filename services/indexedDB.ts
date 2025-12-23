import { LogEntry, LogLevel } from '../types';

const DB_NAME = 'AppLoggerDB';
const DB_VERSION = 1;
const STORE_NAME = 'logs';

/**
 * Singleton State
 * We keep the connection open in this module-level variable.
 */
let dbInstance: IDBDatabase | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialize the Database.
 * Returns a promise that resolves when the DB is ready.
 * Handles the singleton logic to prevent multiple opens.
 */
export const initDB = (): Promise<void> => {
  if (dbInstance) {
    return Promise.resolve();
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      reject('Failed to open database');
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      
      // Generic error handler for the DB
      dbInstance.onerror = (e) => {
        console.error('Database error:', (e.target as any).error);
      };

      resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        // Create an index on timestamp for faster sorting/querying
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        objectStore.createIndex('level', 'level', { unique: false });
      }
    };
  });

  return initPromise;
};

/**
 * Helper to ensure DB is initialized before performing actions.
 */
const getDB = async (): Promise<IDBDatabase> => {
  if (!dbInstance) {
    await initDB();
  }
  if (!dbInstance) {
    throw new Error('Database not initialized');
  }
  return dbInstance;
};

export const addLogEntry = async (entry: Omit<LogEntry, 'id'>): Promise<number> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(entry);

    request.onsuccess = () => {
      resolve(request.result as number);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const getAllLogs = async (): Promise<LogEntry[]> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    // Use the timestamp index to get logs in order (optional, but good practice)
    const index = store.index('timestamp');
    const request = index.openCursor(null, 'prev'); // 'prev' for newest first

    const results: LogEntry[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const clearAllLogs = async (): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};