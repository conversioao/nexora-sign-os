export type AIJobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type AIGenerationType = 'IMAGE' | 'VIDEO' | 'COPY' | 'ADAPTATION' | 'STORYBOARD';
export type AICreditTransactionType = 'PURCHASE' | 'GRANT' | 'USAGE' | 'REFUND' | 'ADJUSTMENT' | 'EXPIRATION';

export interface AIGenerationJob {
  id: string;
  organizationId: string;
  userId: string;
  type: AIGenerationType;
  prompt: string;
  model: string;
  parameters: Record<string, any>;
  costInCredits: number;
  status: AIJobStatus;
  createdAt: string;
  completedAt?: string;
  outputUrl?: string;
  resultUrl?: string;
  error?: string;
  campaignId?: string; // If generated within a context
}

export interface AICreditTransaction {
  id: string;
  organizationId: string;
  userId: string;
  type: AICreditTransactionType;
  amount: number;
  reason: string;
  generationId?: string;
  campaignId?: string;
  timestamp: string;
}

export interface AICreditPackage {
  id: string;
  name: string;
  credits: number;
  priceKz: number;
  validityDays: number;
  popular?: boolean;
  benefits: string[];
}

export interface IAIProvider {
  id: string;
  name: string;
  type: AIGenerationType;
  provider: string;
  baseCost: number;
  capabilities: string[];
  status: 'ACTIVE' | 'MAINTENANCE' | 'DEPRECATED';

  generateImage?(prompt: string, parameters: Record<string, any>): Promise<string>;
  generateVideo?(prompt: string, parameters: Record<string, any>): Promise<string>;
  generateCopy?(prompt: string, parameters: Record<string, any>): Promise<string[]>;
}

export type CreditPurchaseStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CreditPurchaseRequest {
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
  status: CreditPurchaseStatus;
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}
