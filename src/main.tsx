import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BACKEND_URL } from './config/api';

// Em produção na Vercel: se VITE_BACKEND_URL estiver configurada,
// redireciona automaticamente pedidos relativos (/api e /uploads) para o backend no EasyPanel
if (typeof window !== 'undefined' && BACKEND_URL) {
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    if (typeof input === 'string') {
      if (input.startsWith('/api') || input.startsWith('/uploads')) {
        return originalFetch(`${BACKEND_URL}${input}`, init);
      }
    } else if (input instanceof URL) {
      if (input.pathname.startsWith('/api') || input.pathname.startsWith('/uploads')) {
        return originalFetch(`${BACKEND_URL}${input.pathname}${input.search}`, init);
      }
    }
    return originalFetch(input, init);
  };
}

// Register PWA Service Worker
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('✅ [PWA] Service Worker registrado com sucesso no escopo:', reg.scope);
      })
      .catch((err) => {
        console.warn('⚠️ [PWA] Falha ao registrar Service Worker:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
