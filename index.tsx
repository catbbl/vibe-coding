import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initGlobalLogger } from './services/logger';

// 1. Initialize the console interceptor before React mounts
initGlobalLogger();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
