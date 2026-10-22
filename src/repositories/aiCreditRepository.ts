/**
 * aiCreditRepository — cliente HTTP do ecossistema de créditos do Creative AI.
 *
 * ANTES: um singleton em memória espelhado em `window.localStorage`, com pacotes
 * fixos no código e um saldo de 2500 créditos atribuído automaticamente a
 * qualquer organização desconhecida. Isso tornava impossível qualquer visão de
 * admin: cada browser tinha a sua própria verdade.
 *
 * AGORA: todos os métodos falam com `/api/ai-credits`, onde vive o livro-razão
 * em PostgreSQL. As assinaturas mantêm-se iguais, para que `studioService` e
 * `BackgroundGenerationContext` continuem a funcionar sem alterações profundas.
 *
 * Nota sobre saldos novos: uma organização sem conta passa a começar em 0 (e não
 * em 2500). O saldo inicial é agora um acto administrativo explícito — é
 * exactamente isso que o painel de admin serve para gerir.
 */
import { AICreditTransaction, AICreditPackage, CreditPurchaseRequest } from '../types/studio';

const BASE = '/api/ai-credits';

const enc = (v: string) => encodeURIComponent(v);

/** Erro com a mensagem legível devolvida pelo servidor. */
export class AICreditApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AICreditApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    throw new AICreditApiError(
      'Não foi possível contactar o servidor de créditos. Verifique se o backend está em execução.',
      0
    );
  }

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new AICreditApiError(
      data?.error || `Falha na operação de créditos (HTTP ${res.status}).`,
      res.status
    );
  }
  return data as T;
}

class AICreditRepository {
  /** Saldo actual da organização. */
  async getBalance(orgId: string): Promise<number> {
    try {
      const data = await request<{ balance: number }>(`/balance?organizationId=${enc(orgId)}`);
      return Number(data?.balance || 0);
    } catch {
      return 0;
    }
  }

  /** Resumo completo: saldo + totais para relatórios. */
  async getAccountSummary(orgId: string) {
    return request<{
      organizationId: string;
      balance: number;
      totalGranted: number;
      totalPurchased: number;
      totalConsumed: number;
      totalRefunded: number;
      lowBalanceThreshold: number;
      blocked: boolean;
      notes: string | null;
      updatedAt: string;
    }>(`/account?organizationId=${enc(orgId)}`);
  }

  /**
   * Regista uma transacção. O servidor recusa tipos que aumentem saldo sem
   * contrapartida (GRANT/PURCHASE/ADJUSTMENT) vindos do cliente.
   */
  async addTransaction(
    transaction: Omit<AICreditTransaction, 'id' | 'timestamp'>
  ): Promise<AICreditTransaction> {
    return request<AICreditTransaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  async getTransactions(orgId: string, limit = 200): Promise<AICreditTransaction[]> {
    const data = await request<{ transactions: AICreditTransaction[]; total: number }>(
      `/transactions?organizationId=${enc(orgId)}&limit=${limit}`
    );
    return data.transactions || [];
  }

  async getPackages(includeInactive = false): Promise<AICreditPackage[]> {
    const qs = includeInactive ? '?includeInactive=true' : '';
    return request<AICreditPackage[]>(`/packages${qs}`);
  }

  // ─── Pedidos de recarga ────────────────────────────────────────────────────

  async createPurchaseRequest(
    req: Omit<CreditPurchaseRequest, 'id' | 'status' | 'createdAt'>
  ): Promise<CreditPurchaseRequest> {
    return request<CreditPurchaseRequest>('/requests', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  /** Sem `orgId` devolve os pedidos de TODAS as organizações (painel de admin). */
  async getPurchaseRequests(orgId?: string): Promise<CreditPurchaseRequest[]> {
    const qs = orgId ? `?organizationId=${enc(orgId)}` : '';
    return request<CreditPurchaseRequest[]>(`/requests${qs}`);
  }

  async approvePurchaseRequest(
    requestId: string,
    reviewerName: string = 'Administrador'
  ): Promise<CreditPurchaseRequest> {
    const data = await request<{ request: CreditPurchaseRequest }>(
      `/admin/requests/${enc(requestId)}/approve`,
      { method: 'POST', body: JSON.stringify({ performedBy: reviewerName }) }
    );
    return data.request;
  }

  async rejectPurchaseRequest(
    requestId: string,
    reason: string = 'Comprovativo não reconhecido ou ilegível',
    reviewerName: string = 'Administrador'
  ): Promise<CreditPurchaseRequest> {
    return request<CreditPurchaseRequest>(`/admin/requests/${enc(requestId)}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, performedBy: reviewerName }),
    });
  }

  // ─── Fluxo de geração ──────────────────────────────────────────────────────

  /**
   * Verifica saldo, debita e regista o job — tudo numa só operação no servidor.
   * Devolve o `jobId` que deve ser reutilizado ao chamar o motor de geração.
   */
  async startGeneration(params: {
    organizationId: string;
    userId: string;
    type?: string;
    styleId?: string;
    model?: string;
    prompt?: string;
    aspectRatio?: string;
    resolution?: string;
    cost: number;
    campaignId?: string;
  }): Promise<{ jobId: string; balance: number; costInCredits: number; transactionId: string }> {
    return request('/generation/start', { method: 'POST', body: JSON.stringify(params) });
  }

  /** Fecha o job. Em caso de falha, o servidor devolve os créditos automaticamente. */
  async completeGeneration(
    jobId: string,
    status: 'COMPLETED' | 'FAILED' | 'CANCELLED',
    outputUrl?: string,
    error?: string
  ): Promise<{ job: any; refunded: number; balance: number | null }> {
    return request(`/generation/${enc(jobId)}/complete`, {
      method: 'POST',
      body: JSON.stringify({ status, outputUrl, error }),
    });
  }
}

export const aiCreditRepository = new AICreditRepository();
