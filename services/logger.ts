import { LogEntry, LogLevel } from '../types';
import { addLogEntry, getAllLogs, clearAllLogs } from './indexedDB';

type LogListener = (logs: LogEntry[]) => void;
const listeners: Set<LogListener> = new Set();

/**
 * Notifies all subscribers (UI) that the logs have changed.
 */
const notifyListeners = async () => {
  try {
    const logs = await getAllLogs();
    listeners.forEach((listener) => listener(logs));
  } catch (e) {
    console.warn('Failed to notify listeners', e);
  }
};

/**
 * Core internal function to save logs to DB and notify UI.
 */
const saveLog = async (level: LogLevel, message: string, stackTrace?: string, metadata?: any) => {
  try {
    await addLogEntry({
      timestamp: Date.now(),
      level,
      message,
      stackTrace,
      metadata,
    });
    notifyListeners();
  } catch (error) {
    // Avoid infinite loop if logging fails
    const originalConsole = window.console as any;
    if (originalConsole._originalError) {
        originalConsole._originalError('Failed to save log to DB', error);
    }
  }
};

/**
 * Public Logger API
 */
export const Logger = {
  getHistory: getAllLogs,
  
  clear: async () => {
    await clearAllLogs();
    notifyListeners();
  },

  subscribe: (listener: LogListener) => {
    listeners.add(listener);
    // Immediately provide current state
    getAllLogs().then(listener);
    return () => listeners.delete(listener);
  },

  // Manual methods if needed internally
  internalError: (msg: string, stack?: string, meta?: any) => saveLog(LogLevel.ERROR, msg, stack, meta),
};

/**
 * Initializes global interceptors for console.log, console.warn, console.error
 */
export const initGlobalLogger = () => {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };

  // Store originals to avoid circular dependency if needed
  (console as any)._originalLog = originalConsole.log;
  (console as any)._originalError = originalConsole.error;

  console.log = (...args: any[]) => {
    originalConsole.log.apply(console, args);
    // Heuristic: First arg is message, rest is metadata
    const message = args[0] ? String(args[0]) : '';
    const metadata = args.length > 1 ? args.slice(1) : undefined;
    saveLog(LogLevel.INFO, message, undefined, metadata);
  };

  console.warn = (...args: any[]) => {
    originalConsole.warn.apply(console, args);
    const message = args[0] ? String(args[0]) : '';
    const metadata = args.length > 1 ? args.slice(1) : undefined;
    saveLog(LogLevel.WARN, message, undefined, metadata);
  };

  console.error = (...args: any[]) => {
    originalConsole.error.apply(console, args);
    
    const firstArg = args[0];
    let message = '';
    let stack = undefined;
    let metadata = args.length > 1 ? args.slice(1) : undefined;

    if (firstArg instanceof Error) {
      message = firstArg.message;
      stack = firstArg.stack;
    } else {
      message = String(firstArg);
    }

    saveLog(LogLevel.ERROR, message, stack, metadata);
  };

  console.info('Logger initialized: Console methods intercepted.');
};
