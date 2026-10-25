/**
 * chatSessionSync — persistência dos chats do Estúdio no SERVIDOR.
 *
 * ─── Porque existe ───────────────────────────────────────────────────────────
 * Os chats viviam só em `localStorage`, que é POR NAVEGADOR. Resultado: abrir o
 * painel do anunciante (ou outro computador/telemóvel) mostrava a lista vazia —
 * "os chats não estão a ser salvos". Aqui as sessões passam a ser gravadas na
 * organização, por isso aparecem em qualquer painel onde o utilizador entre.
 *
 * O `localStorage` continua a ser a cache rápida (arranque instantâneo); o
 * servidor é a fonte de verdade, e a lista é sempre apresentada com os chats
 * MAIS RECENTES EM CIMA.
 */

export type ChatSessionKind = 'IMAGE' | 'VIDEO';

export interface RemoteChatSession {
  id: string;
  title?: string;
  agentId?: string;
  messages: any[];
  createdAt?: string;
  updatedAt?: string;
}

const ROTA = '/api/ai-chat-sessions';
const DELETED_SESSIONS_STORAGE_KEY = 'nexora_deleted_chat_session_ids_v1';

export function getDeletedSessionIds(): Set<string> {
  if (typeof window === 'undefined' || !window.localStorage) return new Set();
  try {
    const raw = window.localStorage.getItem(DELETED_SESSIONS_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function markSessionAsDeleted(sessionId: string): void {
  if (!sessionId) return;
  // Cancela qualquer gravação remota pendente imediatamente
  const pendente = pendentes.get(sessionId);
  if (pendente?.temporizador) {
    clearTimeout(pendente.temporizador);
  }
  pendentes.delete(sessionId);

  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const set = getDeletedSessionIds();
    set.add(sessionId);
    const arr = Array.from(set).slice(-300); // mantém últimos 300 IDs
    window.localStorage.setItem(DELETED_SESSIONS_STORAGE_KEY, JSON.stringify(arr));
  } catch {}
}

/** Lista as sessões guardadas no servidor (mais recentes primeiro). */
export async function fetchRemoteChatSessions(
  organizationId: string,
  kind: ChatSessionKind,
  limit = 50
): Promise<RemoteChatSession[]> {
  if (!organizationId) return [];
  try {
    const res = await fetch(
      `${ROTA}?organizationId=${encodeURIComponent(organizationId)}&kind=${kind}&limit=${limit}`
    );
    if (!res.ok) return [];
    const dados = await res.json();
    if (!Array.isArray(dados)) return [];
    const deletedIds = getDeletedSessionIds();
    return dados.filter((s) => s && s.id && !deletedIds.has(s.id));
  } catch {
    return [];
  }
}

/**
 * Fila de gravação com atraso (debounce) por sessão.
 *
 * Cada mensagem nova altera o estado do chat; gravar a cada tecla escrita
 * martelaria o servidor. Agrupa-se por sessão e grava-se a versão mais recente.
 */
const pendentes = new Map<string, { dados: any; temporizador: any }>();

export function pushRemoteChatSession(
  sessao: {
    id: string;
    title?: string;
    agentId?: string;
    messages?: any[];
    createdAt?: string;
    updatedAt?: string;
  },
  organizationId: string,
  userId: string | undefined,
  kind: ChatSessionKind
): void {
  if (!sessao?.id || !organizationId) return;

  // ⛔ Não persistir chats vazios ou mensagens de loading efémeras no servidor
  const mensagensPersistiveis = (sessao.messages || []).filter(
    (m: any) => m && m.type !== 'loading' && m.type !== 'storyboard_loading' && m.type !== 'prompt_loading'
  );
  if (mensagensPersistiveis.length === 0) return;

  const anterior = pendentes.get(sessao.id);
  if (anterior?.temporizador) clearTimeout(anterior.temporizador);

  const corpo = {
    id: sessao.id,
    organizationId,
    userId: userId || null,
    kind,
    title: sessao.title || 'Novo chat',
    agentId: sessao.agentId || null,
    messages: mensagensPersistiveis,
    createdAt: sessao.createdAt,
    updatedAt: sessao.updatedAt || new Date().toISOString(),
  };

  const temporizador = setTimeout(async () => {
    pendentes.delete(sessao.id);
    try {
      const res = await fetch(ROTA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });
      if (!res.ok && res.status !== 500 && res.status !== 503) {
        console.warn('⚠️ [Chat Sync] Não foi possível guardar o chat no servidor:', res.status);
      }
    } catch (e) {
      console.warn('⚠️ [Chat Sync] Falha de rede ao guardar o chat:', e);
    }
  }, 900);

  pendentes.set(sessao.id, { dados: corpo, temporizador });
}

/** Elimina uma sessão de chat no servidor. */
export async function deleteRemoteChatSession(sessionId: string): Promise<boolean> {
  if (!sessionId) return false;
  markSessionAsDeleted(sessionId);
  try {
    const res = await fetch(`${ROTA}/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (e) {
    console.warn('⚠️ [Chat Sync] Falha ao eliminar sessão no servidor:', e);
    return false;
  }
}

/** Junta sessões locais e remotas, ficando com a versão mais recente de cada e ignorando chats vazios ou eliminados. */
export function mergeChatSessions<T extends { id: string; messages?: any[]; updatedAt?: string; createdAt?: string }>(
  locais: T[],
  remotas: RemoteChatSession[]
): T[] {
  const deletedIds = getDeletedSessionIds();
  const porId = new Map<string, T>();

  // Guarda locais não eliminadas
  for (const s of locais) {
    if (s && s.id && !deletedIds.has(s.id)) {
      porId.set(s.id, s);
    }
  }

  // Remotas só entram se tiverem mensagens reais e não tiverem sido eliminadas
  for (const remota of remotas) {
    if (!remota || !remota.id || deletedIds.has(remota.id)) continue;
    if (!remota.messages || remota.messages.length === 0) continue;

    const local = porId.get(remota.id);
    /**
     * ⛔ `local` pode não existir — é o caso NORMAL de quem abre o painel num
     * dispositivo novo, sem cache local, e tem o histórico no servidor. Ler
     * `local.messages` sem esta guarda rebentava com TypeError dentro do
     * `.then(...)`: a exceção ficava como promise rejeitada e o histórico do
     * servidor NUNCA aparecia (a lista ficava vazia, sem aviso).
     */
    const localMessages: any[] = local?.messages || [];

    // Se a versão local já tem mensagens com vídeo gerado ou mais mensagens, NÃO apagar!
    const localHasVideo = localMessages.some((m: any) => m?.type === 'ai' && m?.videoUrl);
    const remotaHasVideo = (remota.messages || []).some((m: any) => m?.type === 'ai' && m?.videoUrl);

    const localMsgCount = localMessages.length;
    const remotaMsgCount = (remota.messages || []).length;

    // Se o local tem vídeo e a remota ainda não tem, preserva integralmente o local
    if (localHasVideo && !remotaHasVideo) {
      continue;
    }

    // Se o local tem mais mensagens que a remota, preserva o local
    if (localMsgCount > remotaMsgCount) {
      continue;
    }

    const dataRemota = new Date(remota.updatedAt || remota.createdAt || 0).getTime();
    const dataLocal = new Date((local as any)?.updatedAt || (local as any)?.createdAt || 0).getTime();

    // A versão remota só substitui se tiver estritamente mais mensagens ou for comprovadamente mais recente com >= mensagens
    const remotaMaisCompleta =
      remotaMsgCount > localMsgCount ||
      (remotaMsgCount === localMsgCount && dataRemota > dataLocal && (!localHasVideo || remotaHasVideo));

    if (remotaMaisCompleta) {
      const fixedMessages = Array.isArray(remota.messages)
        ? remota.messages
            .filter((m: any) => m && m.type !== 'loading' && m.type !== 'storyboard_loading' && m.type !== 'prompt_loading')
            .map((m: any) => ({
              ...m,
              timestamp: m?.timestamp
                ? m.timestamp instanceof Date
                  ? m.timestamp
                  : new Date(m.timestamp)
                : new Date(),
            }))
        : [];
      porId.set(remota.id, {
        ...local,
        ...(remota as unknown as T),
        messages: fixedMessages,
      });
    }
  }

  return Array.from(porId.values());
}

/**
 * Ordena por atividade em ordem decrescente: o chat mais recente ou com mensagem mais recente aparece sempre em primeiro lugar.
 */
export function sortSessionsByRecency<T extends { id?: string; updatedAt?: string; createdAt?: string; timestamp?: any; messages?: any[] }>(
  sessoes: T[]
): T[] {
  const getSessionTime = (s: T): number => {
    let latestMsgTime = 0;
    if (Array.isArray(s.messages) && s.messages.length > 0) {
      for (const m of s.messages) {
        if (m?.timestamp) {
          const t = new Date(m.timestamp).getTime();
          if (!isNaN(t) && t > latestMsgTime) {
            latestMsgTime = t;
          }
        }
      }
    }

    // Extrai timestamp contido no ID da sessão (ex: session-video-1792009268859)
    let idTime = 0;
    if (typeof s.id === 'string') {
      const match = s.id.match(/(\d{12,14})/);
      if (match) {
        idTime = parseInt(match[1], 10) || 0;
      }
    }

    const createdTime = s.createdAt
      ? new Date(s.createdAt).getTime()
      : (s.timestamp ? new Date(s.timestamp).getTime() : 0);

    const updatedTime = s.updatedAt ? new Date(s.updatedAt).getTime() : 0;

    return Math.max(
      isNaN(latestMsgTime) ? 0 : latestMsgTime,
      isNaN(idTime) ? 0 : idTime,
      isNaN(createdTime) ? 0 : createdTime,
      isNaN(updatedTime) ? 0 : updatedTime
    );
  };

  return [...sessoes].sort((a, b) => getSessionTime(b) - getSessionTime(a));
}

/**
 * Formata com segurança timestamps de mensagens (evita Uncaught TypeError se vier como string ou Date).
 */
export function formatMessageTime(ts: Date | string | undefined | null): string {
  if (!ts) return '';
  try {
    const d = ts instanceof Date ? ts : new Date(ts);
    return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}
