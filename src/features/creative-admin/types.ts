/**
 * Tipos do painel de administração do Nexora Creative AI.
 *
 * Espelham exactamente o que `/api/ai-credits/admin/*` devolve. Estão declarados
 * aqui (e não inferidos) para que a camada de dados do painel seja verificável
 * de tipos, independentemente do resto da aplicação.
 */

export interface CreditOverview {
  credits: {
    inCirculation: number;
    consumed: number;
    purchased: number;
    granted: number;
    refunded: number;
    consumedLast30d: number;
    accounts: number;
    lowBalanceAccounts: number;
    blockedAccounts: number;
  };
  generations: {
    total: number;
    completed: number;
    failed: number;
    running: number;
    last30d: number;
    distinctUsers: number;
    creditsSpent: number;
    successRate: number | null;
  };
  requests: {
    pending: number;
    pendingCredits: number;
    pendingRevenueKz: number;
    approved: number;
    rejected: number;
    approvedRevenueKz: number;
  };
}

export interface CreditAccountRow {
  organizationId: string;
  organizationName: string;
  organizationType: string | null;
  balance: number;
  totalGranted: number;
  totalPurchased: number;
  totalConsumed: number;
  totalRefunded: number;
  lowBalanceThreshold: number;
  blocked: boolean;
  notes: string | null;
  generations: number;
  pendingRequests: number;
  updatedAt: string;
}

export interface CreativeUserRow {
  userId: string;
  userName: string;
  userEmail: string | null;
  userRole: string | null;
  organizationId: string;
  organizationName: string;
  generations: number;
  completed: number;
  failed: number;
  creditsSpent: number;
  lastGenerationAt: string | null;
  organizationBalance: number | null;
  organizationConsumed: number | null;
}

export interface StyleUsageRow {
  styleId: string;
  model: string;
  generations: number;
  distinctUsers: number;
  creditsSpent: number;
  completed: number;
  failed: number;
  lastUsedAt: string | null;
}

export interface ConsumptionTrendPoint {
  day: string;
  consumed: number;
  added: number;
  generations: number;
}

export interface AdminCreditPackage {
  id: string;
  name: string;
  description: string;
  credits: number;
  priceKz: number;
  validityDays: number;
  benefits: string[];
  popular: boolean;
  status: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminCreditTransaction {
  id: string;
  organizationId: string;
  organizationName: string | null;
  userId: string | null;
  userName: string;
  type: string;
  amount: number;
  balanceAfter: number | null;
  reason: string;
  performedBy?: string;
  timestamp: string;
}

export interface AdminPurchaseRequest {
  id: string;
  organizationId: string;
  organizationName?: string;
  userId: string;
  userName?: string;
  packageId: string;
  packageName: string;
  credits: number;
  priceKz: number;
  paymentMethod: string;
  receiptUrl?: string;
  receiptFileName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface AdminJobRow {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  type: string;
  styleId: string | null;
  model: string | null;
  prompt: string | null;
  aspectRatio: string | null;
  resolution: string | null;
  status: string;
  costInCredits: number;
  outputUrl?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

/** Payload de criação/edição de pacote. */
export interface PackageInput {
  id?: string;
  name: string;
  description?: string;
  credits: number;
  priceKz: number;
  validityDays: number;
  benefits: string[];
  popular: boolean;
  status: string;
  sortOrder?: number;
}

/**
 * Modelo de geração de imagem (GPT Image 2, Nano Banana 2.1, …) com o custo em
 * créditos que lhe é aplicado. `defaultCost` é o custo base; `styleCosts` contém
 * preços específicos por estilo/agente quando o administrador os definir.
 */
export interface AdminImageModel {
  id: string;
  label: string;
  provider: string;
  apiModel: string;
  description: string;
  supportsImageInput: boolean;
  active: boolean;
  sortOrder: number;
  defaultCost: number;
  styleCosts: Record<string, number>;
}

/** Payload de criação/edição de modelo. */
export interface AdminImageModelInput {
  id: string;
  label: string;
  apiModel: string;
  provider?: string;
  description?: string;
  supportsImageInput?: boolean;
  active?: boolean;
  sortOrder?: number;
}

/**
 * Custos de geração de STORYBOARD e VÍDEO, definidos pelo administrador.
 * A chave `'*'` é o custo base; as outras chaves são estilos (storyboard) ou
 * durações em segundos (vídeo). Custo 0 significa "não cobra".
 */
export interface GenerationCosts {
  storyboard: Record<string, number>;
  video: Record<string, number>;
}
