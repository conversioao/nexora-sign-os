import { getApiUrl } from '../../../config/api';

export type WhatsAppAgentRole = 'nexora_bot' | 'billing' | 'marketing' | 'sales' | 'custom';

export interface WhatsAppInstance {
  id: string;
  name: string;
  role: WhatsAppAgentRole;
  phone?: string;
  status: 'open' | 'connecting' | 'close';
  qr_code?: string;
  pairing_code?: string;
  profile_name?: string;
  profile_pic_url?: string;
  is_active: boolean;
  updated_at?: string;
}

export interface QrResponse {
  base64?: string;
  code?: string;
  pairingCode?: string;
  count?: number;
  status?: string;
  message?: string;
}

export interface FollowUpLead {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  orgId: string;
  orgName: string;
  orgType: string;
  createdAt: string;
  displaysCount: number;
  onlineDisplaysCount: number;
  campaignsCount: number;
  draftCampaignsCount: number;
  behaviorStatus: 'NEW' | 'NO_DISPLAYS' | 'ACTIVE_DISPLAYS' | 'ABANDONED_CAMPAIGN' | 'TRIAL_EXPIRING' | 'REGULAR';
  lastFollowUp?: {
    agentName: string;
    triggerType: string;
    sentAt: string;
  };
}

export interface FollowUpLog {
  id: string;
  userId: string;
  phone: string;
  leadName: string;
  orgName?: string;
  agentName: string;
  triggerType: string;
  message: string;
  status: string;
  createdAt: string;
}

export const ROLE_LABELS: Record<WhatsAppAgentRole, { title: string; category: string; description: string; color: string; iconBg: string }> = {
  nexora_bot: {
    title: 'Nexora Bot (Central & OTP)',
    category: 'Agente Interno 1',
    description: 'Validação de códigos OTP de registro, alertas centrais e autenticação de usuários.',
    color: 'emerald',
    iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  billing: {
    title: 'Cobranças & Faturamento',
    category: 'Agente Interno 2',
    description: 'Envio de faturas, avisos de vencimento, comprovativos e alertas financeiros.',
    color: 'amber',
    iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  marketing: {
    title: 'Campanhas & Marketing',
    category: 'Agente Interno 3',
    description: 'Disparo de novidades, novas campanhas publicitárias e reengajamento da rede.',
    color: 'purple',
    iconBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  sales: {
    title: 'Agente de Vendas WhatsApp',
    category: 'Agente de Vendas 1',
    description: 'Prospecção comercial, atendimento receptivo a anunciantes e fechamento de vendas.',
    color: 'cyan',
    iconBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  },
  custom: {
    title: 'Instância Personalizada',
    category: 'Instância Adicional',
    description: 'Número dedicado para operações e fluxos adicionais do sistema.',
    color: 'blue',
    iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
};

export const whatsappAdminService = {
  async getInstances(): Promise<WhatsAppInstance[]> {
    const res = await fetch(getApiUrl('/api/evolution/instances'));
    if (!res.ok) throw new Error('Não foi possível carregar as instâncias do WhatsApp.');
    return res.json();
  },

  async createInstance(name: string, role: WhatsAppAgentRole, profileName?: string): Promise<{ success: boolean; instance?: WhatsAppInstance; error?: string }> {
    const res = await fetch(getApiUrl('/api/evolution/instances'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, role, profileName }),
    });
    return res.json();
  },

  async getInstanceQr(name: string): Promise<QrResponse> {
    const res = await fetch(getApiUrl(`/api/evolution/instances/${encodeURIComponent(name)}/qr`));
    if (!res.ok) throw new Error('Falha ao obter QR code.');
    return res.json();
  },

  async connectInstance(name: string, phone?: string): Promise<QrResponse> {
    const res = await fetch(getApiUrl(`/api/evolution/instances/${encodeURIComponent(name)}/connect`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) throw new Error('Falha ao gerar conexão.');
    return res.json();
  },

  async getAgentBindings(): Promise<Record<string, string>> {
    const res = await fetch(getApiUrl('/api/evolution/bindings'));
    if (!res.ok) return {};
    return res.json();
  },

  async bindAgent(role: string, instanceName: string): Promise<boolean> {
    const res = await fetch(getApiUrl('/api/evolution/bindings'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, instanceName }),
    });
    return res.ok;
  },

  async restartInstance(name: string): Promise<boolean> {
    const res = await fetch(getApiUrl(`/api/evolution/instances/${encodeURIComponent(name)}/restart`), {
      method: 'POST',
    });
    return res.ok;
  },

  async logoutInstance(name: string): Promise<boolean> {
    const res = await fetch(getApiUrl(`/api/evolution/instances/${encodeURIComponent(name)}/logout`), {
      method: 'POST',
    });
    return res.ok;
  },

  async deleteInstance(name: string): Promise<boolean> {
    const res = await fetch(getApiUrl(`/api/evolution/instances/${encodeURIComponent(name)}`), {
      method: 'DELETE',
    });
    return res.ok;
  },

  async assignRole(name: string, role: WhatsAppAgentRole): Promise<boolean> {
    const res = await fetch(getApiUrl(`/api/evolution/instances/${encodeURIComponent(name)}/assign-role`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    return res.ok;
  },

  async sendTestMessage(to: string, message: string, instanceName?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(getApiUrl('/api/evolution/send-message'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message, instanceName }),
    });
    return res.json();
  },

  async sendVerificationCode(phone: string, name: string): Promise<{ success: boolean; code?: string; message: string }> {
    const res = await fetch(getApiUrl('/api/whatsapp/send-verification'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name }),
    });
    return res.json();
  },

  async verifyCode(phone: string, code: string): Promise<{ valid: boolean; message: string }> {
    const res = await fetch(getApiUrl('/api/whatsapp/verify-code'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    return res.json();
  },

  // ── CRM Leads & Follow-up de Usuários ──
  async getLeads(): Promise<FollowUpLead[]> {
    const res = await fetch(getApiUrl('/api/whatsapp/leads'));
    if (!res.ok) return [];
    return res.json();
  },

  async sendFollowUp(userId: string, triggerType: string, customMessage?: string): Promise<{ success: boolean; message: string; log?: FollowUpLog }> {
    const res = await fetch(getApiUrl('/api/whatsapp/followup/send'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, triggerType, customMessage }),
    });
    return res.json();
  },

  async getFollowUpHistory(): Promise<FollowUpLog[]> {
    const res = await fetch(getApiUrl('/api/whatsapp/followup/history'));
    if (!res.ok) return [];
    return res.json();
  },

  async runAutomatedFollowUps(): Promise<{ processed: number; sent: number }> {
    const res = await fetch(getApiUrl('/api/whatsapp/followup/run-automated'), {
      method: 'POST',
    });
    return res.json();
  },

  // ── Conselho de Agentes IA & Sala de Decisões em Tempo Real ──
  async getDiscussions(): Promise<AgentDiscussion[]> {
    const res = await fetch(getApiUrl('/api/agent-war-room/discussions'));
    if (!res.ok) return [];
    return res.json();
  },

  async triggerDiscussion(topic?: string): Promise<AgentDiscussion> {
    const res = await fetch(getApiUrl('/api/agent-war-room/discussions/trigger'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    });
    if (!res.ok) throw new Error('Falha ao convocar conselho de agentes.');
    return res.json();
  },

  async approveActionPlan(planId: string): Promise<boolean> {
    const res = await fetch(getApiUrl(`/api/agent-war-room/plans/${encodeURIComponent(planId)}/approve`), {
      method: 'POST',
    });
    return res.ok;
  },
};

export interface AgentMessage {
  id: string;
  discussionId: string;
  agentName: string;
  agentRole: string;
  agentAvatar?: string;
  message: string;
  sentiment: 'INSIGHT' | 'ALERT' | 'PROPOSAL' | 'APPROVAL' | 'SUMMARY';
  createdAt: string;
}

export interface AgentActionPlan {
  id: string;
  discussionId: string;
  title: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  diagnosis: string;
  decisions: string[];
  actionsTaken: {
    action: string;
    target: string;
    agent: string;
    status: 'DONE' | 'PENDING' | 'SCHEDULED';
  }[];
  adminRecommendations: {
    id: string;
    action: string;
    impact: string;
    suggestedBy: string;
  }[];
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'EXECUTED';
  createdAt: string;
}

export interface AgentDiscussion {
  id: string;
  topic: string;
  category: string;
  status: 'ACTIVE' | 'COMPLETED';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  participants: string[];
  dataSnapshot: any;
  messages: AgentMessage[];
  actionPlan?: AgentActionPlan;
  createdAt: string;
}

