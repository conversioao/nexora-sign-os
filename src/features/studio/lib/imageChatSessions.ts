/**
 * imageChatSessions — motor de sessões do Estúdio de Imagem IA (Nexora Sign).
 *
 * Regra de ouro: **uma geração pertence a um e só um chat**.
 * Todo o histórico vive em `localStorage` e é reparado a cada arranque, para que
 * dados corrompidos por versões anteriores (gerações duplicadas e/ou agregadas
 * ao chat errado) não voltem a aparecer.
 *
 * Este módulo é 100% puro (sem React) de propósito: é a parte onde os bugs de
 * duplicação/fusão viviam e é totalmente testável.
 */

export interface ActiveCreationData {
  id: string;
  title: string;
  imageUrl: string;
  ratio: string;
  style: string;
  promptText?: string;
  /** Legenda pronta a publicar (fora da imagem) e hashtags sugeridas. */
  copy?: string;
  hashtags?: string;
  /** Combinação criativa usada — é o que a regra anti-repetição controla. */
  combination?: {
    tipo_ugc: string;
    sub_cena: string;
    angulo_camara: string;
    emocao_dominante: string;
    cenario: string;
  };
}

export interface ChatMessage {
  id: string;
  /**
   * `error` = a geração FALHOU. Existe para o chat dizer o motivo e oferecer
   * nova tentativa; antes a falha limitava-se a fazer desaparecer o balão de
   * espera, deixando o utilizador sem qualquer explicação.
   */
  type: 'user' | 'ai' | 'loading' | 'error';
  prompt?: string;
  agentName?: string;
  ratio?: string;
  resolution?: string;
  quantity?: number;
  images?: ActiveCreationData[];
  baseImageUrl?: string;
  /** Motivo legível da falha (vem do servidor/motor). */
  errorText?: string;
  /** Identificador do job que falhou — usado para tentar de novo. */
  failedJobId?: string;
  timestamp: Date | string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  agentId: string;
  messages: ChatMessage[];
}

/**
 * Chaves actuais (v5) — SEMPRE por organização.
 *
 * ⛔ Antes as chaves eram globais (`nexora_image_chat_sessions_v4`). O
 * `localStorage` é por NAVEGADOR, não por conta: uma organização nova — criada
 * no mesmo browser onde já tinha entrado outra — abria o painel com as
 * conversas da conta anterior e ainda as reenviava para o servidor como se
 * fossem suas. Agora cada organização tem o seu espaço e uma conta nova começa
 * vazia.
 */
const STORAGE_ROOT = 'nexora_image_chat_sessions_v5';

/** Chaves de cache do histórico desta organização (ou do utilizador, sem org). */
export function storageKeysFor(scope: string) {
  const sufixo = (scope || 'sem-organizacao').replace(/[^A-Za-z0-9_-]/g, '_');
  return {
    sessions: `${STORAGE_ROOT}:${sufixo}`,
    active: `${STORAGE_ROOT}_active:${sufixo}`,
    jobMap: `${STORAGE_ROOT}_jobs:${sufixo}`,
  };
}

let sessionSeq = 0;

export const createSession = (agentId: string): ChatSession => {
  sessionSeq += 1;
  return {
    id: `session-${Date.now()}-${sessionSeq}-${Math.random().toString(36).slice(2, 8)}`,
    title: 'Novo Chat',
    createdAt: new Date().toISOString(),
    agentId,
    messages: [],
  };
};

/** Remove bolhas de loading específicas (pura — segura em StrictMode). */
export const removeLoadingIds = (messages: ChatMessage[], ids: string[]): ChatMessage[] =>
  ids.length === 0 ? messages : messages.filter((m) => !ids.includes(m.id));

/** Remove apenas a bolha de loading mais antiga (pura — segura em StrictMode). */
export const removeOldestLoading = (messages: ChatMessage[]): ChatMessage[] => {
  const idx = messages.findIndex((m) => m.type === 'loading');
  if (idx === -1) return messages;
  return [...messages.slice(0, idx), ...messages.slice(idx + 1)];
};

/** Extrai o id do job a partir do id da mensagem de IA (`ai-<jobId>`). */
export const jobIdFromMessageId = (messageId: string): string | null =>
  messageId.startsWith('ai-') ? messageId.slice(3) : null;

/**
 * Normaliza e REPARA o histórico persistido:
 *  • descarta bolhas de loading órfãs (spinners que ficaram presos para sempre);
 *  • elimina a MESMA geração repetida em vários chats (duplicação);
 *  • devolve cada geração ao chat onde foi realmente pedida, usando o mapa antigo;
 *  • remove chats vazios.
 *
 * Nunca descarta uma geração por causa de um mapa obsoleto: se o dono indicado
 * pelo mapa já não existir, a geração fica onde está.
 */
export function normalizeSessions(raw: any, legacyMap?: Record<string, string> | null): ChatSession[] {
  if (!Array.isArray(raw)) return [];

  const knownSessionIds = new Set<string>();
  raw.forEach((s: any) => {
    if (s && typeof s.id === 'string') knownSessionIds.add(s.id);
  });

  const seenSessionIds = new Set<string>();
  const claimedJobIds = new Set<string>();
  const result: ChatSession[] = [];

  for (const rawSession of raw) {
    if (!rawSession || typeof rawSession.id !== 'string') continue;
    if (seenSessionIds.has(rawSession.id)) continue;
    seenSessionIds.add(rawSession.id);

    const kept: ChatMessage[] = [];
    const rawMessages = Array.isArray(rawSession.messages) ? rawSession.messages : [];

    for (const rawMsg of rawMessages) {
      if (!rawMsg || typeof rawMsg.id !== 'string') continue;
      if (rawMsg.type === 'loading') continue;

      const jobId = jobIdFromMessageId(rawMsg.id);
      if (jobId) {
        if (claimedJobIds.has(jobId)) continue; // já reclamada por outro chat → duplicado
        const realOwner = legacyMap?.[jobId];
        const ownerIsAlive = typeof realOwner === 'string' && knownSessionIds.has(realOwner);
        if (ownerIsAlive && realOwner !== rawSession.id) continue; // estava no chat errado
        claimedJobIds.add(jobId);
      }

      kept.push({ ...rawMsg, timestamp: new Date(rawMsg.timestamp) });
    }

    if (kept.length === 0) continue;
    result.push({ ...rawSession, messages: kept });
  }

  return result;
}

/** Reconstrói o mapa job → chat a partir das mensagens (sem entradas mortas). */
export function deriveJobSessionMap(sessions: ChatSession[]): Record<string, string> {
  const map: Record<string, string> = {};
  sessions.forEach((session) =>
    session.messages.forEach((message) => {
      const jobId = jobIdFromMessageId(message.id);
      if (jobId) map[jobId] = session.id;
    })
  );
  return map;
}

const safeReadJSON = (key: string): any => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export interface ImageChatBoot {
  sessions: ChatSession[];
  activeSessionId: string;
  jobMap: Record<string, string>;
}

/**
 * Lê o estado inicial do chat DESTA organização, migrando/reparando o formato
 * guardado. `defaultAgentId` evita que este módulo dependa da lista de agentes.
 *
 * O histórico antigo (chaves globais v3/v4) NÃO é migrado de propósito: sem
 * organização na chave não há forma de saber a quem pertence, e importá-lo para
 * a conta que abriu o painel era exactamente o vazamento que originou este
 * ajuste. O servidor guarda o histórico por organização e é de lá que ele volta.
 */
export function loadChatBoot(defaultAgentId: string, scope: string): ImageChatBoot {
  const keys = storageKeysFor(scope);

  const storedSessions = safeReadJSON(keys.sessions);
  const storedJobMap = safeReadJSON(keys.jobMap);
  const jobMap = storedJobMap && typeof storedJobMap === 'object' ? storedJobMap : {};

  let sessions = normalizeSessions(storedSessions, jobMap);
  if (sessions.length === 0) sessions = [createSession(defaultAgentId)];

  // Preserva o vínculo de jobs ainda em curso (sem mensagem criada) cujo chat vive
  const resolvedMap = deriveJobSessionMap(sessions);
  Object.entries(jobMap as Record<string, string>).forEach(([jobId, sessionId]) => {
    if (typeof sessionId === 'string' && sessions.some((s) => s.id === sessionId)) {
      resolvedMap[jobId] = sessionId;
    }
  });

  const storedActive = safeReadJSON(keys.active);
  const activeSessionId = sessions.some((s) => s.id === storedActive)
    ? storedActive
    : sessions[0].id;

  return { sessions, activeSessionId, jobMap: resolvedMap };
}

/** Payload a persistir: sem bolhas de loading efémeras e sem chats vazios. */
export function toPersistableSessions(sessions: ChatSession[]): ChatSession[] {
  return sessions
    .map((s) => ({ ...s, messages: s.messages.filter((m) => m.type !== 'loading') }))
    .filter((s) => s.messages.length > 0);
}

/** Mapa de jobs a persistir: descarta entradas cujo chat já não existe. */
export function pruneJobSessionMap(
  jobMap: Record<string, string>,
  sessions: ChatSession[]
): Record<string, string> {
  const live = new Set(sessions.map((s) => s.id));
  return Object.fromEntries(Object.entries(jobMap).filter(([, sid]) => live.has(sid)));
}
