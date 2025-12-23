import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { LoggerContextType, LogEntry, LogLevel } from '../types';
import { initDB, addLogEntry, getAllLogs, clearAllLogs } from '../services/indexedDB';

const LoggerContext = createContext<LoggerContextType | undefined>(undefined);

export const useLogger = () => {
  const context = useContext(LoggerContext);
  if (!context) {
    throw new Error('useLogger must be used within a LoggerProvider');
  }
  return context;
};

interface LoggerProviderProps {
  children: React.ReactNode;
}

export const LoggerProvider: React.FC<LoggerProviderProps> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshLogs = useCallback(async () => {
    try {
      const fetchedLogs = await getAllLogs();
      setLogs(fetchedLogs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  }, []);

  // Initialize DB on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        await initDB();
        await refreshLogs();
      } catch (error) {
        console.error('Failed to initialize Logger DB:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [refreshLogs]);

  const persistLog = async (level: LogLevel, message: string, stackTrace?: string, metadata?: Record<string, any>) => {
    const entry: Omit<LogEntry, 'id'> = {
      timestamp: Date.now(),
      level,
      message,
      stackTrace,
      metadata,
    };

    try {
      await addLogEntry(entry);
      // Refresh logs to keep UI in sync
      await refreshLogs();
    } catch (error) {
      // Fallback if IDB fails
      console.error('CRITICAL: Failed to persist log to IndexedDB', error);
    }
  };

  const logInfo = useCallback(async (message: string, metadata?: Record<string, any>) => {
    await persistLog(LogLevel.INFO, message, undefined, metadata);
  }, [refreshLogs]);

  const logWarn = useCallback(async (message: string, metadata?: Record<string, any>) => {
    await persistLog(LogLevel.WARN, message, undefined, metadata);
  }, [refreshLogs]);

  const logError = useCallback(async (error: Error | string, metadata?: Record<string, any>) => {
    let message = '';
    let stack = undefined;

    if (error instanceof Error) {
      message = error.message;
      stack = error.stack;
    } else {
      message = error as string;
    }

    await persistLog(LogLevel.ERROR, message, stack, metadata);
  }, [refreshLogs]);

  const clearLogs = useCallback(async () => {
    try {
      await clearAllLogs();
      await refreshLogs();
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }, [refreshLogs]);

  const value: LoggerContextType = {
    logs,
    isLoading,
    logInfo,
    logWarn,
    logError,
    refreshLogs,
    clearLogs,
  };

  return <LoggerContext.Provider value={value}>{children}</LoggerContext.Provider>;
};