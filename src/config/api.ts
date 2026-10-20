/**
 * Configuração centralizada de endpoints para o Frontend Nexora OS.
 *
 * Em produção na Vercel:
 *   - VITE_BACKEND_URL: URL permanente do backend no EasyPanel (ex: https://nexora-backend.yccdt2.easypanel.host)
 *   - VITE_SOCKET_URL: URL do servidor WebSocket (normalmente o mesmo que VITE_BACKEND_URL)
 *
 * Em desenvolvimento local:
 *   - Vazio por defeito: o Vite proxy encaminha /api e /socket.io para localhost:3001 / localhost:3002.
 */

const metaEnv = (typeof import.meta !== 'undefined' ? (import.meta as any).env : {}) || {};

const RAW_BACKEND_URL: string = (metaEnv.VITE_BACKEND_URL || metaEnv.VITE_API_URL || '').trim();
export const BACKEND_URL = RAW_BACKEND_URL.replace(/\/+$/, '');

const RAW_SOCKET_URL: string = (metaEnv.VITE_SOCKET_URL || BACKEND_URL || '').trim();
export const SOCKET_URL = RAW_SOCKET_URL.replace(/\/+$/, '');

/**
 * Retorna a URL absoluta para qualquer endpoint da API ou mídias.
 */
export function getApiUrl(path: string): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return BACKEND_URL ? `${BACKEND_URL}${normalized}` : normalized;
}

/**
 * Retorna o endpoint para ligação Socket.IO.
 * Na Vercel (onde serverless não suporta WebSockets permanentes),
 * liga-se directamente ao backend no EasyPanel por WSS/HTTPS.
 */
export function getSocketServerUrl(): string {
  if (SOCKET_URL) return SOCKET_URL;
  return typeof window !== 'undefined' ? window.location.origin : '';
}
