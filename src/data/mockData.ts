import {
  Display,
  DisplayCommercialEvent,
  Campaign,
  Client,
  AICreditBalance,
  SystemActivity,
  DashboardKPIs
} from '../types/domain';

export const mockKPIs: DashboardKPIs = {
  totalDisplays: 48,
  onlineDisplays: 45,
  offlineDisplays: 3,
  activeCampaigns: 14,
  totalMonthlyRevenueKz: 18450000, // 18.450.000 Kz
  estimatedDailyImpressions: 485000,
  networkOccupancyRate: 88.5,
  aiCreditsRemaining: 3420,
};

export const mockDisplays: any[] = [];

export const mockCommercialEvents: any = {};

export const mockClients: Client[] = [
  {
    id: 'clt-01',
    name: 'Unitel Angola S.A.',
    tradeName: 'Unitel',
    nif: '5401123490',
    contactEmail: 'marketing.indoor@unitel.co.ao',
    phone: '+244 923 100 200',
    city: 'Luanda (Talatona)',
    assignedDisplaysCount: 32,
    activeContractsCount: 3,
    tier: 'ENTERPRISE',
  },
  {
    id: 'clt-02',
    name: 'Banco Angolano de Investimentos',
    tradeName: 'Banco BAI',
    nif: '5402987110',
    contactEmail: 'comunicacao@bancobai.ao',
    phone: '+244 912 345 678',
    city: 'Luanda (Mutamba)',
    assignedDisplaysCount: 24,
    activeContractsCount: 2,
    tier: 'ENTERPRISE',
  },
  {
    id: 'clt-03',
    name: 'Grupo Zahara ComÃ©rcio S.A.',
    tradeName: 'Kero Hipermercados',
    nif: '5403345892',
    contactEmail: 'midia.kero@zahara.ao',
    phone: '+244 944 888 999',
    city: 'Luanda (Kilamba)',
    assignedDisplaysCount: 15,
    activeContractsCount: 1,
    tier: 'PRO',
  }
];

export const mockAICredits: AICreditBalance = {
  totalCredits: 5000,
  usedCredits: 1580,
  remainingCredits: 3420,
  monthlyAllocation: 5000,
  renewalDate: '01/09/2026',
};

export const mockActivities: SystemActivity[] = [
  {
    id: 'act-01',
    timestamp: 'HÃ¡ 4 minutos',
    type: 'CAMPAIGN_APPROVED',
    title: 'Campanha "Unitel 5G" Publicada',
    description: 'VeiculaÃ§Ã£o iniciada em 32 displays da provÃ­ncia de Luanda.',
    severity: 'success',
    actor: 'MÃ¡rio Silva (Admin)',
    targetLocation: 'Luanda Geral'
  },
  {
    id: 'act-02',
    timestamp: 'HÃ¡ 22 minutos',
    type: 'DISPLAY_CONNECTED',
    title: 'Display Reconectado',
    description: 'NX-TLT-001 (Shopping Avennida) restabeleceu heartbeat 4K.',
    severity: 'info',
    actor: 'Sistema AutomÃ¡tico',
    targetLocation: 'Talatona'
  },
  {
    id: 'act-03',
    timestamp: 'HÃ¡ 1 hora',
    type: 'CREDIT_USED',
    title: 'GeraÃ§Ã£o de VÃ­deo IA ConcluÃ­da',
    description: '35 crÃ©ditos debitados para renderizaÃ§Ã£o de spot vertical 15s.',
    severity: 'info',
    actor: 'AgÃªncia Criativa Destaque',
    targetLocation: 'Studio IA'
  },
  {
    id: 'act-04',
    timestamp: 'HÃ¡ 4 horas',
    type: 'DISPLAY_DISCONNECTED',
    title: 'Queda de ConexÃ£o Detectada',
    description: 'NX-VIA-005 (Viana Hub) sem resposta de rede hÃ¡ mais de 3 horas.',
    severity: 'danger',
    actor: 'Monitor de Hardware',
    targetLocation: 'Viana'
  },
];
export const mockCampaigns: any[] = [];
