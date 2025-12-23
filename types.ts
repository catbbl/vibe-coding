export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogEntry {
  id?: number;
  timestamp: number;
  level: LogLevel;
  message: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
}

export interface LoggerContextType {
  logs: LogEntry[];
  isLoading: boolean;
  logInfo: (message: string, metadata?: Record<string, any>) => Promise<void>;
  logWarn: (message: string, metadata?: Record<string, any>) => Promise<void>;
  logError: (error: Error | string, metadata?: Record<string, any>) => Promise<void>;
  refreshLogs: () => Promise<void>;
  clearLogs: () => Promise<void>;
}