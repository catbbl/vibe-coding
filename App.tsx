import React, { useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useLogHistory } from './hooks/useLogHistory';
import { LogLevel } from './types';
import { api } from './services/api';

// A component that intentionally throws an error to test the ErrorBoundary
const BuggyComponent = () => {
  throw new Error("I crashed!");
  return <div>I will never render</div>;
};

const LogDashboard: React.FC = () => {
  const { logs, clearLogs, isLoading } = useLogHistory();
  const [showBuggy, setShowBuggy] = useState(false);

  // 1. Standard Console Logging (Intercepted)
  const handleConsoleLog = () => {
    console.log("Standard console.log called", { someData: "exists" });
  };

  const handleConsoleWarn = () => {
    console.warn("Standard console.warn called", { user: "admin" });
  };

  // 2. Axios Error Logging (Intercepted)
  const handleApiError = async () => {
    try {
      // Intentionally requesting a non-existent endpoint
      await api.get('/force-404-error');
    } catch (e) {
      // We don't need to log here manually! 
      // The interceptor in services/api.ts handles it.
    }
  };

  // 3. Error Boundary (Intercepted)
  const handleCrash = () => {
    setShowBuggy(true);
  };

  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleString();

  const getLevelStyles = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR: return 'bg-red-50 border-red-200 text-red-800';
      case LogLevel.WARN: return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case LogLevel.INFO: return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Automatic Logger</h1>
            <p className="text-gray-500 mt-1">
              Logs <code>console.*</code>, <code>axios</code> errors, and <code>crashes</code> automatically.
            </p>
          </div>
          <button onClick={() => clearLogs()} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium">
            Clear DB
          </button>
        </div>

        {/* Action Buttons - These do NOT use a logger hook, they just use standard APIs */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">1. Console Interception</h3>
            <div className="flex gap-2">
              <button onClick={handleConsoleLog} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                Call console.log()
              </button>
              <button onClick={handleConsoleWarn} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm">
                Call console.warn()
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">These buttons just call the native browser console methods.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-3">2. Automatic Network Errors</h3>
             <button onClick={handleApiError} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm">
                Trigger Axios 404
              </button>
              <p className="text-xs text-gray-400 mt-2">Makes a failed request. The axios interceptor logs it automatically.</p>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-semibold text-gray-700 mb-3">3. Error Boundary</h3>
            {!showBuggy ? (
              <button onClick={handleCrash} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm">
                Crash Component
              </button>
            ) : (
              <ErrorBoundary>
                 <BuggyComponent />
              </ErrorBoundary>
            )}
             <p className="text-xs text-gray-400 mt-2">Renders a component that throws an error. The ErrorBoundary catches it and logs to console.error.</p>
          </div>

        </div>

        {/* Log Viewer */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span>IndexedDB Contents</span>
            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">{logs.length}</span>
          </h2>
          
          {isLoading ? (
             <div className="text-center py-8 text-gray-500">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
              No logs in database.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className={`p-4 rounded-lg border-l-4 ${getLevelStyles(log.level)} bg-white shadow-sm`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                        log.level === LogLevel.ERROR ? 'border-red-300 bg-red-100 text-red-800' :
                        log.level === LogLevel.WARN ? 'border-yellow-300 bg-yellow-100 text-yellow-800' :
                        'border-blue-300 bg-blue-100 text-blue-800'
                      }`}>{log.level}</span>
                      <span className="text-xs text-gray-400 font-mono">{formatDate(log.timestamp)}</span>
                    </div>
                  </div>
                  
                  <div className="text-sm font-medium text-gray-800 break-words">{log.message}</div>

                  {(log.metadata || log.stackTrace) && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      {log.metadata && (
                        <div className="mb-2">
                           <span className="text-[10px] font-bold text-gray-400 uppercase">Metadata</span>
                           <pre className="text-[10px] bg-gray-50 p-2 rounded text-gray-600 overflow-x-auto">
                             {JSON.stringify(log.metadata, null, 2)}
                           </pre>
                        </div>
                      )}
                      {log.stackTrace && (
                        <div>
                           <span className="text-[10px] font-bold text-gray-400 uppercase">Stack Trace</span>
                           <pre className="text-[10px] bg-gray-50 p-2 rounded text-red-900/70 overflow-x-auto whitespace-pre-wrap">
                             {log.stackTrace}
                           </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogDashboard;
