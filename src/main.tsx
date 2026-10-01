import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Keep the app shell available offline in production builds.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW registration note:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// These classes let CSS reveal content only after JS starts and reduce effects on constrained devices.
document.documentElement.classList.add('js');
const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
const lowTier =
  (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) ||
  (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4) ||
  (nav.connection?.saveData === true);
if (lowTier) document.documentElement.classList.add('low-tier');

