import { useState, useEffect } from 'react';
import { LogEntry } from '../types';
import { Logger } from '../services/logger';

/**
 * Hook to subscribe to the global log history.
 * Used only for DISPLAYING logs, not for creating them.
 */
export const useLogHistory = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Subscribe returns a cleanup function
    const unsubscribe = Logger.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { 
    logs, 
    isLoading, 
    clearLogs: Logger.clear 
  };
};
