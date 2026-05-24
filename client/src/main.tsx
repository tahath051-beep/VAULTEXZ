import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

async function enableMocking() {
  if (import.meta.env.PROD) return;
  const { worker } = await import('./mocks/browser');
  return worker.start({
    serviceWorker: { url: '/mockServiceWorker.js' },
    onUnhandledRequest: 'bypass',
  });
}

function registerPWA() {
  if (!import.meta.env.PROD) return;
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      immediate: false,
      onNeedRefresh() {},
      onOfflineReady() {},
    });
  }).catch(() => {});
}

enableMocking()
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    registerPWA();
  })
  .catch((err) => {
    console.warn('[MSW] Failed to start, rendering without mocks:', err);
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    registerPWA();
  });
