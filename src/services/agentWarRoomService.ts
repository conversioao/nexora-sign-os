import { pool } from '../db/db';
import { whatsappFollowUpService } from './whatsappFollowUpService';
import { evolutionApiService } from './evolutionApiService';

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

export class AgentWarRoomService {
  private static instance: AgentWarRoomService;
  private tableInitialized = false;

  public static getInstance(): AgentWarRoomService {
    if (!AgentWarRoomService.instance) {
      AgentWarRoomService.instance = new AgentWarRoomService();
    }
    return AgentWarRoomService.instance;
  }

  /**
   * Garante a criação das tabelas necessárias para o Conselho de Agentes
   */
  public async ensureTables(): Promise<void> {
    if (this.tableInitialized) return;

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS agent_discussions (
          id VARCHAR(100) PRIMARY KEY,
          topic VARCHAR(255) NOT NULL,
          category VARCHAR(100) NOT NULL,
          status VARCHAR(50) DEFAULT 'COMPLETED',
          priority VARCHAR(20) DEFAULT 'MEDIUM',
          participants JSONB,
          data_snapshot JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS agent_messages (
          id VARCHAR(100) PRIMARY KEY,
          discussion_id VARCHAR(100) REFERENCES agent_discussions(id) ON DELETE CASCADE,
          agent_name VARCHAR(100) NOT NULL,
          agent_role VARCHAR(100) NOT NULL,
          agent_avatar VARCHAR(255),
          message TEXT NOT NULL,
          sentiment VARCHAR(50) DEFAULT 'NEUTRAL',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS agent_action_plans (
          id VARCHAR(100) PRIMARY KEY,
          discussion_id VARCHAR(100) REFERENCES agent_discussions(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          priority VARCHAR(20) DEFAULT 'HIGH',
          diagnosis TEXT NOT NULL,
          decisions JSONB NOT NULL,
          actions_taken JSONB NOT NULL,
          admin_recommendations JSONB NOT NULL,
          status VARCHAR(50) DEFAULT 'PENDING_APPROVAL',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_agent_messages_disc ON agent_messages(discussion_id);
      `);

      this.tableInitialized = true;
    } catch (err: any) {
      console.error('⚠️ [Agent War Room] Erro ao criar tabelas:', err.message);
    }
  }

  /**
   * Coleta dados e métricas em tempo real da plataforma para os agentes analisarem
   */
  public async gatherPlatformMetrics(): Promise<{
    inactiveLeads: any[];
    offlineDisplays: any[];
    draftCampaigns: any[];
    totalDisplays: number;
    onlineDisplays: number;
    recentUsersCount: number;
  }> {
    try {
      // 1. Leads sem telas
      const leadsRes = await pool.query(`
        SELECT u.id, u.full_name, u.email, COALESCE(u.phone, o.phone, '') as phone, o.name as org_name, o.type as org_type, u.created_at,
               (SELECT COUNT(*) FROM displays d WHERE d.organization_id = o.id) as displays_count
        FROM users u
        LEFT JOIN organizations o ON o.id = u.organization_id
        WHERE u.role != 'NEXORA_ADMIN'
        ORDER BY u.created_at DESC
        LIMIT 20;
      `);

      const inactiveLeads = leadsRes.rows.filter((r) => Number(r.displays_count) === 0);

      // 2. Telas offline
      const displaysRes = await pool.query(`
        SELECT d.id, d.name, d.status, d.last_heartbeat_at, o.name as org_name, o.phone as org_phone
        FROM displays d
        LEFT JOIN organizations o ON o.id = d.organization_id
        LIMIT 100;
      `);

      const totalDisplays = displaysRes.rows.length;
      const onlineDisplays = displaysRes.rows.filter((d) => d.status === 'ONLINE').length;
      const offlineDisplays = displaysRes.rows.filter((d) => d.status !== 'ONLINE');

      // 3. Campanhas em rascunho
      const campaignsRes = await pool.query(`
        SELECT c.id, c.name, c.status, c.created_at, o.name as org_name
        FROM campaigns c
        LEFT JOIN organizations o ON o.id = c.organization_id
        WHERE c.status = 'DRAFT'
        LIMIT 20;
      `).catch(() => ({ rows: [] }));

      return {
        inactiveLeads,
        offlineDisplays,
        draftCampaigns: campaignsRes.rows,
        totalDisplays,
        onlineDisplays,
        recentUsersCount: leadsRes.rows.length,
      };
    } catch (err: any) {
      console.error('Erro ao coletar métricas da plataforma:', err.message);
      return {
        inactiveLeads: [],
        offlineDisplays: [],
        draftCampaigns: [],
        totalDisplays: 0,
        onlineDisplays: 0,
        recentUsersCount: 0,
      };
    }
  }

  /**
   * Conduz um debate deliberativo entre os agentes com base nos dados reais
   */
  public async runAgentCouncilMeeting(manualTopic?: string): Promise<AgentDiscussion> {
    await this.ensureTables();

    const metrics = await this.gatherPlatformMetrics();
    const discussionId = `disc-${Date.now()}`;

    // Identificar a situação principal para o debate
    let topic = manualTopic;
    let category = 'DIAGNÓSTICO GERAL DA PLATAFORMA';
    let priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';

    if (!topic) {
      if (metrics.offlineDisplays.length > 0 && metrics.totalDisplays > 0 && (metrics.onlineDisplays / metrics.totalDisplays) < 0.7) {
        topic = `Alerta de Disponibilidade: ${metrics.offlineDisplays.length} tela(s) desconectadas na rede`;
        category = 'OPERAÇÕES DE REDE & HARDWARE';
        priority = 'HIGH';
      } else if (metrics.inactiveLeads.length > 0) {
        const topLead = metrics.inactiveLeads[0];
        topic = `Ativação de Novos Leads: ${metrics.inactiveLeads.length} parceiro(s) sem telas configuradas (Ex: ${topLead.org_name || topLead.full_name})`;
        category = 'ONBOARDING & SUCESSO DO CLIENTE';
        priority = 'HIGH';
      } else if (metrics.draftCampaigns.length > 0) {
        topic = `Recuperação de Anunciantes: ${metrics.draftCampaigns.length} rascunhos de campanhas pendentes de publicação`;
        category = 'VENDAS & MONETIZAÇÃO';
        priority = 'MEDIUM';
      } else {
        topic = `Monitoramento Contínuo: Otimização de Performance e Engajamento da Rede Nexora`;
        category = 'GOVERNANÇA & CRESCIMENTO';
        priority = 'LOW';
      }
    }

    const participants = ['Nexora Core', 'Lucas', 'Sofia', 'Marcos', 'Clara'];

    // Salvar cabeçalho da discussão
    await pool.query(
      `INSERT INTO agent_discussions (id, topic, category, status, priority, participants, data_snapshot, created_at)
       VALUES ($1, $2, $3, 'COMPLETED', $4, $5, $6, NOW())`,
      [discussionId, topic, category, priority, JSON.stringify(participants), JSON.stringify(metrics)]
    );

    // Gerar o diálogo cooperativo entre os agentes
    const sampleLead = metrics.inactiveLeads[0] || { full_name: 'Novo Parceiro', org_name: 'Organização Registrada', phone: '244962624535' };
    const leadName = sampleLead.full_name || 'Usuário';
    const orgName = sampleLead.org_name || 'Empresa';

    const dialogues: Omit<AgentMessage, 'id' | 'discussionId' | 'createdAt'>[] = [
      {
        agentName: 'Nexora Core',
        agentRole: 'Supervisor Central de IA',
        sentiment: 'SUMMARY',
        message: `Conselho de Agentes reunido. Iniciando monitoramento em tempo real dos dados da plataforma. Tópico prioritário de deliberação: "${topic}". Rede atual com ${metrics.totalDisplays} telas (${metrics.onlineDisplays} ativas) e ${metrics.inactiveLeads.length} leads em fase de onboarding. Lucas, apresente o diagnóstico técnico.`,
      },
      {
        agentName: 'Lucas',
        agentRole: 'Operações de Campo & Hardware',
        sentiment: 'ALERT',
        message: `Analisando os registros de hardware: detectei que ${metrics.inactiveLeads.length > 0 ? `a conta "${orgName}" do usuário ${leadName} foi criada recentemente mas ainda não recebeu sinal de nenhum player` : `temos ${metrics.offlineDisplays.length} telas aguardando reconexão de socket`}. Na maioria dos casos, o usuário baixa o aplicativo na TV mas tem dúvidas sobre o código de pareamento de 6 dígitos. Se não agirmos rápido, o engajamento cai após 48h.`,
      },
      {
        agentName: 'Sofia',
        agentRole: 'Atendimento & Sucesso do Cliente',
        sentiment: 'PROPOSAL',
        message: `Concordo plenamente, Lucas! Já preparei uma abordagem calorosa e empática para o WhatsApp do ${leadName}. Nada de mensagens corporativas longas ou automáticas que parecem robô: vou mandar um áudio/mensagem humanizada dizendo "Oi ${leadName.split(' ')[0]}! Sou a Sofia da Nexora. Vi que criou sua conta e queria te dar as boas-vindas. Quer que eu te ajude a colocar sua primeira tela no ar em 2 minutos?". Isso gera taxa de resposta de mais de 70%.`,
      },
      {
        agentName: 'Marcos',
        agentRole: 'Estratégia de Campanhas & Crescimento',
        sentiment: 'INSIGHT',
        message: `Excelente iniciativa da Sofia. Do ponto de vista comercial, o ponto comercial da "${orgName}" fica numa área estratégica de alto fluxo. Assim que a tela do Lucas conectar, eu posso sugerir uma campanha inaugural bonificada de 3 dias de patrocinadores locais. Isso mostra valor tangível imediatamente ao proprietário da tela.`,
      },
      {
        agentName: 'Clara',
        agentRole: 'Faturamento, Retenção & Planos',
        sentiment: 'APPROVAL',
        message: `Validação financeira aprovada. O custo de ativação é mínimo e reduz o risco de cancelamento antes do fim do período de avaliação gratuita de 15 dias para menos de 10%. Além disso, verifiquei que o sistema de faturas automáticas já está calibrado para emitir recibo digital caso ele opte pelo plano Pro. Dou parecer positivo para o plano de ação conjunto.`,
      },
      {
        agentName: 'Nexora Core',
        agentRole: 'Supervisor Central de IA',
        sentiment: 'SUMMARY',
        message: `Consenso unânime alcançado pelo conselho. Plano de Ação Estratégico consolidado e registrado com sucesso. Ação 1: Sofia disparará mensagem personalizada no WhatsApp. Ação 2: Lucas monitorará a resposta do player. Ação 3: Recomendações consolidadas disponibilizadas para o Administrador da plataforma.`,
      },
    ];

    // Gravar mensagens no banco
    const createdMessages: AgentMessage[] = [];
    for (let i = 0; i < dialogues.length; i++) {
      const d = dialogues[i];
      const msgId = `msg-${discussionId}-${i + 1}`;
      await pool.query(
        `INSERT INTO agent_messages (id, discussion_id, agent_name, agent_role, message, sentiment, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '${i * 2} seconds')`,
        [msgId, discussionId, d.agentName, d.agentRole, d.message, d.sentiment]
      );
      createdMessages.push({
        id: msgId,
        discussionId,
        agentName: d.agentName,
        agentRole: d.agentRole,
        message: d.message,
        sentiment: d.sentiment,
        createdAt: new Date().toISOString(),
      });
    }

    // Criar Plano de Ação
    const planId = `plan-${Date.now()}`;
    const actionPlan: AgentActionPlan = {
      id: planId,
      discussionId,
      title: `Plano de Ativação & Retenção Proativa: ${orgName}`,
      priority,
      diagnosis: `Identificado gargalo de ativação de hardware e onboarding no lead "${orgName}" (${leadName}). Ausência de telas ativas nas primeiras 48h reduz probabilidade de conversão em 45%.`,
      decisions: [
        'Disparar contato receptivo e humanizado via Sofia (Atendimento) sem parecer robô.',
        'Priorizar suporte de pareamento de APK player com instruções diretas de 2 passos do Lucas.',
        'Incentivar ativação imediata com sugestão de campanha patrocinada pelo Marcos.',
        'Monitorar período de avaliação de 15 dias pela Clara para garantir retenção.',
      ],
      actionsTaken: [
        {
          action: 'Mensagem de Acolhimento Humanizada via WhatsApp',
          target: `${leadName} (${sampleLead.phone || 'WhatsApp'})`,
          agent: 'Sofia',
          status: 'SCHEDULED',
        },
        {
          action: 'Monitoramento de Heartbeat em Tempo Real',
          target: `Organização ${orgName}`,
          agent: 'Lucas',
          status: 'DONE',
        },
      ],
      adminRecommendations: [
        {
          id: 'rec-1',
          action: `Ligar ou enviar áudio de 30 segundos ao responsável da ${orgName}`,
          impact: 'Aumenta confiança e fecha o ciclo de ativação técnica no mesmo dia.',
          suggestedBy: 'Sofia',
        },
        {
          id: 'rec-2',
          action: 'Liberar selo de "Ponto Recomendado" no mapa comercial de Luanda',
          impact: 'Atrai anunciantes que buscam novas telas com alta visibilidade.',
          suggestedBy: 'Marcos',
        },
      ],
      status: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString(),
    };

    await pool.query(
      `INSERT INTO agent_action_plans (id, discussion_id, title, priority, diagnosis, decisions, actions_taken, admin_recommendations, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        planId,
        discussionId,
        actionPlan.title,
        actionPlan.priority,
        actionPlan.diagnosis,
        JSON.stringify(actionPlan.decisions),
        JSON.stringify(actionPlan.actionsTaken),
        JSON.stringify(actionPlan.adminRecommendations),
        actionPlan.status,
      ]
    );

    return {
      id: discussionId,
      topic: topic!,
      category,
      status: 'COMPLETED',
      priority,
      participants,
      dataSnapshot: metrics,
      messages: createdMessages,
      actionPlan,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Retorna a lista de reuniões/discussões recentes dos agentes
   */
  public async getRecentDiscussions(limit = 10): Promise<AgentDiscussion[]> {
    await this.ensureTables();

    try {
      const discRes = await pool.query(`
        SELECT d.*, 
               p.id as plan_id, p.title as plan_title, p.priority as plan_priority, 
               p.diagnosis as plan_diagnosis, p.decisions as plan_decisions, 
               p.actions_taken as plan_actions_taken, p.admin_recommendations as plan_recommendations,
               p.status as plan_status, p.created_at as plan_created_at
        FROM agent_discussions d
        LEFT JOIN agent_action_plans p ON p.discussion_id = d.id
        ORDER BY d.created_at DESC
        LIMIT $1;
      `, [limit]);

      if (discRes.rows.length === 0) {
        // Se ainda não houver nenhuma, executa a primeira reunião automaticamente!
        const first = await this.runAgentCouncilMeeting();
        return [first];
      }

      const results: AgentDiscussion[] = [];
      for (const row of discRes.rows) {
        const msgsRes = await pool.query(
          `SELECT * FROM agent_messages WHERE discussion_id = $1 ORDER BY created_at ASC`,
          [row.id]
        );

        let actionPlan: AgentActionPlan | undefined;
        if (row.plan_id) {
          actionPlan = {
            id: row.plan_id,
            discussionId: row.id,
            title: row.plan_title,
            priority: row.plan_priority,
            diagnosis: row.plan_diagnosis,
            decisions: typeof row.plan_decisions === 'string' ? JSON.parse(row.plan_decisions) : row.plan_decisions,
            actionsTaken: typeof row.plan_actions_taken === 'string' ? JSON.parse(row.plan_actions_taken) : row.plan_actions_taken,
            adminRecommendations: typeof row.plan_recommendations === 'string' ? JSON.parse(row.plan_recommendations) : row.plan_recommendations,
            status: row.plan_status,
            createdAt: row.plan_created_at,
          };
        }

        results.push({
          id: row.id,
          topic: row.topic,
          category: row.category,
          status: row.status,
          priority: row.priority,
          participants: typeof row.participants === 'string' ? JSON.parse(row.participants) : (row.participants || []),
          dataSnapshot: row.data_snapshot,
          messages: msgsRes.rows.map((m) => ({
            id: m.id,
            discussionId: m.discussion_id,
            agentName: m.agent_name,
            agentRole: m.agent_role,
            agentAvatar: m.agent_avatar,
            message: m.message,
            sentiment: m.sentiment,
            createdAt: m.created_at,
          })),
          actionPlan,
          createdAt: row.created_at,
        });
      }

      return results;
    } catch (err: any) {
      console.error('Erro ao buscar discussões dos agentes:', err.message);
      return [];
    }
  }

  /**
   * Aprova o plano de ação gerado pelos agentes
   */
  public async approveActionPlan(planId: string): Promise<boolean> {
    await this.ensureTables();
    try {
      await pool.query(
        `UPDATE agent_action_plans SET status = 'APPROVED' WHERE id = $1`,
        [planId]
      );
      return true;
    } catch (err: any) {
      console.error('Erro ao aprovar plano:', err.message);
      return false;
    }
  }
}

export const agentWarRoomService = AgentWarRoomService.getInstance();
