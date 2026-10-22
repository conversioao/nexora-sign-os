/**
 * creativeAdminService — camada de dados do painel de admin do Creative AI.
 *
 * Todos os métodos falam com `/api/ai-credits/admin/*`. Nenhum deles toca em
 * `localStorage`: a razão de existir deste painel é precisamente ver o
 * ecossistema inteiro, o que só é possível com o servidor como fonte de verdade.
 *
 * As escritas enviam o cabeçalho `x-nexora-actor` para que o livro-razão registe
 * quem fez cada ajuste manual (auditoria).
 */
import {
  CreditOverview,
  CreditAccountRow,
  CreativeUserRow,
  StyleUsageRow,
  ConsumptionTrendPoint,
  AdminCreditPackage,
  AdminCreditTransaction,
  AdminPurchaseRequest,
  AdminJobRow,
  PackageInput,
} from '../types';
import type { AdminImageModel, AdminImageModelInput, GenerationCosts } from '../types';

const BASE = '/api/ai-credits';

const enc = (v: string) => encodeURIComponent(v);

export class CreativeAdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'CreativeAdminApiError';
    this.status = status;
  }
}

async function api<T>(path: string, init?: RequestInit, actor?: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(actor ? { 'x-nexora-actor': actor } : {}),
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new CreativeAdminApiError(
      'Não foi possível contactar o servidor. Confirme que o backend está em execução.',
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
    throw new CreativeAdminApiError(
      data?.error || `Operação falhou (HTTP ${res.status}).`,
      res.status
    );
  }
  return data as T;
}

export const creativeAdminService = {
  // ─── Leitura ───────────────────────────────────────────────────────────────

  getOverview(): Promise<CreditOverview> {
    return api<CreditOverview>('/admin/overview');
  },

  getAccounts(search?: string): Promise<CreditAccountRow[]> {
    const qs = search ? `?search=${enc(search)}` : '';
    return api<CreditAccountRow[]>(`/admin/accounts${qs}`);
  },

  getUsers(organizationId?: string): Promise<CreativeUserRow[]> {
    const qs = organizationId ? `?organizationId=${enc(organizationId)}` : '';
    return api<CreativeUserRow[]>(`/admin/users${qs}`);
  },

  getStyleUsage(organizationId?: string): Promise<StyleUsageRow[]> {
    const qs = organizationId ? `?organizationId=${enc(organizationId)}` : '';
    return api<StyleUsageRow[]>(`/admin/styles${qs}`);
  },

  getTrend(days = 30): Promise<ConsumptionTrendPoint[]> {
    return api<ConsumptionTrendPoint[]>(`/admin/trend?days=${days}`);
  },

  getPackages(includeInactive = true): Promise<AdminCreditPackage[]> {
    const qs = includeInactive ? '?includeInactive=true' : '';
    return api<AdminCreditPackage[]>(`/packages${qs}`);
  },

  getTransactions(filters: {
    organizationId?: string;
    type?: string;
    limit?: number;
  } = {}): Promise<{ transactions: AdminCreditTransaction[]; total: number }> {
    const params = new URLSearchParams();
    if (filters.organizationId) params.set('organizationId', filters.organizationId);
    if (filters.type) params.set('type', filters.type);
    params.set('limit', String(filters.limit || 200));
    return api<{ transactions: AdminCreditTransaction[]; total: number }>(
      `/transactions?${params.toString()}`
    );
  },

  getRequests(status?: string): Promise<AdminPurchaseRequest[]> {
    const qs = status ? `?status=${enc(status)}` : '';
    return api<AdminPurchaseRequest[]>(`/requests${qs}`);
  },

  getJobs(filters: { organizationId?: string; status?: string; limit?: number } = {}): Promise<AdminJobRow[]> {
    const params = new URLSearchParams();
    if (filters.organizationId) params.set('organizationId', filters.organizationId);
    if (filters.status) params.set('status', filters.status);
    params.set('limit', String(filters.limit || 100));
    return api<AdminJobRow[]>(`/admin/jobs?${params.toString()}`);
  },

  // ─── Custos de geração (storyboard e vídeo) ────────────────────────────────

  /** Custos de STORYBOARD (por estilo) e VÍDEO (por duração). 0 = não cobra. */
  getGenerationCosts(): Promise<GenerationCosts> {
    return api<GenerationCosts>('/generation-costs');
  },

  saveGenerationCosts(
    costs: Array<{ kind: 'STORYBOARD' | 'VIDEO'; variant: string; creditCost: number }>,
    performedBy: string
  ): Promise<{ saved: number }> {
    return api<{ saved: number }>(
      '/admin/generation-costs',
      { method: 'POST', body: JSON.stringify({ costs }) },
      performedBy
    );
  },

  // ─── Modelos de imagem & custos em créditos ────────────────────────────────

  /** Catálogo completo (inclui modelos desactivados) + grelha de custos. */
  getModels(): Promise<AdminImageModel[]> {
    return api<AdminImageModel[]>('/admin/models');
  },

  saveModel(input: AdminImageModelInput, performedBy: string): Promise<{ id: string }> {
    return api<{ id: string }>(
      '/admin/models',
      { method: 'POST', body: JSON.stringify(input) },
      performedBy
    );
  },

  /** Grava um ou vários preços. `styleId: '*'` define o custo base do modelo. */
  saveModelPricing(
    prices: Array<{ modelId: string; styleId: string; creditCost: number }>,
    performedBy: string
  ): Promise<{ saved: number }> {
    return api<{ saved: number }>(
      '/admin/models/pricing',
      { method: 'POST', body: JSON.stringify({ prices }) },
      performedBy
    );
  },

  // ─── Escrita ───────────────────────────────────────────────────────────────

  /** Ajuste manual. Valor positivo credita, negativo debita. Motivo obrigatório. */
  adjustCredits(params: {
    organizationId: string;
    amount: number;
    reason: string;
    userId?: string;
    performedBy: string;
  }): Promise<AdminCreditTransaction> {
    return api<AdminCreditTransaction>(
      '/admin/adjust',
      { method: 'POST', body: JSON.stringify(params) },
      params.performedBy
    );
  },

  setAccountOptions(params: {
    organizationId: string;
    lowBalanceThreshold?: number;
    blocked?: boolean;
    notes?: string;
    performedBy: string;
  }): Promise<any> {
    return api(
      '/admin/accounts/options',
      { method: 'POST', body: JSON.stringify(params) },
      params.performedBy
    );
  },

  savePackage(input: PackageInput, performedBy: string): Promise<AdminCreditPackage> {
    return api<AdminCreditPackage>(
      '/admin/packages',
      { method: 'POST', body: JSON.stringify(input) },
      performedBy
    );
  },

  archivePackage(id: string, performedBy: string): Promise<{ id: string; archived: boolean }> {
    return api<{ id: string; archived: boolean }>(
      `/admin/packages/${enc(id)}`,
      { method: 'DELETE' },
      performedBy
    );
  },

  approveRequest(id: string, performedBy: string): Promise<{ request: AdminPurchaseRequest; newBalance: number }> {
    return api<{ request: AdminPurchaseRequest; newBalance: number }>(
      `/admin/requests/${enc(id)}/approve`,
      { method: 'POST', body: JSON.stringify({ performedBy }) },
      performedBy
    );
  },

  rejectRequest(id: string, reason: string, performedBy: string): Promise<AdminPurchaseRequest> {
    return api<AdminPurchaseRequest>(
      `/admin/requests/${enc(id)}/reject`,
      { method: 'POST', body: JSON.stringify({ reason, performedBy }) },
      performedBy
    );
  },
};
