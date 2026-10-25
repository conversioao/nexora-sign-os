import { pool } from '../db/db';
import { evolutionApiService } from './evolutionApiService';

export type FollowUpTriggerType =
  | 'WELCOME_15MIN'
  | 'TIPS_DAY_2'
  | 'CART_RECOVERY_NO_DISPLAYS'
  | 'CART_RECOVERY_ABANDONED_CAMPAIGN'
  | 'TRIAL_EXPIRING'
  | 'CUSTOM';

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

export const FOLLOWUP_AGENTS = [
  {
    id: 'sofia',
    name: 'Sofia — Relacionamento & Boas-Vindas',
    role: 'Onboarding Humanizado',
    avatar: '🤝',
    description: 'Recepciona novos cadastros nos primeiros 15 minutos de forma calorosa, amigável e prestativa.',
  },
  {
    id: 'marcos',
    name: 'Marcos — Consultor de Mídia & Dicas',
    role: 'Dicas Práticas & Crescimento',
    avatar: '💡',
    description: 'Envia dicas curtas de 2 linhas sobre IA criativa, audiência e melhores práticas no 2º dia.',
  },
  {
    id: 'lucas',
    name: 'Lucas — Recuperação & Ativação de Telas',
    role: 'Recuperação de Funil',
    avatar: '🛒',
    description: 'Ajuda quem criou conta mas não conectou telas ou quem abandonou rascunho de campanha.',
  },
  {
    id: 'clara',
    name: 'Clara — Lembretes Cordiais & Pós-Venda',
    role: 'Pós-Venda & Retenção',
    avatar: '⏰',
    description: 'Envia lembretes gentis de término de teste grátis (15 dias) e disponibilidade de planos.',
  },
];

class WhatsAppFollowUpService {
  private tableEnsured = false;

  constructor() {
    this.ensureTable().catch((err) => {
      console.warn('⚠️ [WhatsApp FollowUp] Nota na tabela whatsapp_followups:', err.message);
    });
  }

  private async ensureTable() {
    if (this.tableEnsured) return;
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS whatsapp_followups (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100),
          organization_id VARCHAR(100),
          phone VARCHAR(50) NOT NULL,
          lead_name VARCHAR(100),
          org_name VARCHAR(150),
          org_type VARCHAR(50),
          agent_name VARCHAR(100) NOT NULL,
          trigger_type VARCHAR(100) NOT NULL,
          message TEXT NOT NULL,
          status VARCHAR(50) DEFAULT 'sent',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      this.tableEnsured = true;
    } catch (e: any) {
      console.warn('⚠️ [WhatsApp FollowUp] Erro ao criar tabela whatsapp_followups:', e.message);
    }
  }

  /**
   * Lista todos os leads/usuários registrados com análise de comportamento em tempo real
   */
  public async listLeadsWithBehavior(): Promise<FollowUpLead[]> {
    await this.ensureTable();

    try {
      const query = `
        SELECT 
          u.id as user_id,
          u.full_name,
          u.email,
          COALESCE(u.phone, o.phone, '') as phone,
          o.id as org_id,
          o.name as org_name,
          o.type as org_type,
          u.created_at,
          (SELECT COUNT(*) FROM displays d WHERE d.organization_id = o.id) as displays_count,
          (SELECT COUNT(*) FROM displays d WHERE d.organization_id = o.id AND d.status = 'ONLINE') as online_displays_count,
          (SELECT COUNT(*) FROM campaigns c WHERE c.organization_id = o.id) as campaigns_count,
          (SELECT COUNT(*) FROM campaigns c WHERE c.organization_id = o.id AND c.status = 'DRAFT') as draft_campaigns_count,
          (
            SELECT json_build_object(
              'agentName', f.agent_name,
              'triggerType', f.trigger_type,
              'sentAt', f.created_at
            )
            FROM whatsapp_followups f 
            WHERE f.user_id = u.id 
            ORDER BY f.created_at DESC 
            LIMIT 1
          ) as last_followup
        FROM users u
        LEFT JOIN organizations o ON o.id = u.organization_id
        WHERE u.role != 'NEXORA_ADMIN'
        ORDER BY u.created_at DESC
        LIMIT 100;
      `;

      const res = await pool.query(query);

      return res.rows.map((r: any) => {
        const dCount = parseInt(r.displays_count || '0', 10);
        const onCount = parseInt(r.online_displays_count || '0', 10);
        const draftCount = parseInt(r.draft_campaigns_count || '0', 10);
        const daysSinceCreation = (Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24);

        let behaviorStatus: FollowUpLead['behaviorStatus'] = 'REGULAR';
        if (daysSinceCreation < 1) {
          behaviorStatus = 'NEW';
        } else if (r.org_type === 'DISPLAY_OWNER' && dCount === 0) {
          behaviorStatus = 'NO_DISPLAYS';
        } else if (draftCount > 0) {
          behaviorStatus = 'ABANDONED_CAMPAIGN';
        } else if (daysSinceCreation >= 12 && daysSinceCreation <= 15 && r.org_type === 'DISPLAY_OWNER') {
          behaviorStatus = 'TRIAL_EXPIRING';
        } else if (dCount > 0) {
          behaviorStatus = 'ACTIVE_DISPLAYS';
        }

        return {
          userId: r.user_id,
          fullName: r.full_name || 'Usuário',
          email: r.email,
          phone: r.phone || '',
          orgId: r.org_id,
          orgName: r.org_name || 'Organização',
          orgType: r.org_type || 'CLIENT',
          createdAt: r.created_at,
          displaysCount: dCount,
          onlineDisplaysCount: onCount,
          campaignsCount: parseInt(r.campaigns_count || '0', 10),
          draftCampaignsCount: draftCount,
          behaviorStatus,
          lastFollowUp: r.last_followup || undefined,
        };
      });
    } catch (err: any) {
      console.error('❌ [WhatsApp FollowUp] Erro ao listar leads:', err.message);
      return [];
    }
  }

  /**
   * Gera a mensagem personalizada, curta e humana de acordo com o gatilho e o lead
   */
  public generateHumanMessage(
    triggerType: FollowUpTriggerType,
    lead: { fullName: string; orgName: string; orgType: string }
  ): { agentName: string; message: string } {
    const firstName = (lead.fullName || 'amigo').trim().split(' ')[0];
    const org = lead.orgName || 'sua empresa';

    switch (triggerType) {
      case 'WELCOME_15MIN':
        return {
          agentName: 'Sofia — Relacionamento',
          message:
            `Olá ${firstName}, tudo bem? 😊\n\n` +
            `Aqui é a Sofia da equipa da Nexora. Vi que acabou de criar a conta da *${org}* na nossa plataforma.\n\n` +
            `Já conseguiu dar uma olhada no painel ou quer uma ajuda rápida para começar? Se tiver qualquer dúvida, pode me responder diretamente por aqui!`,
        };

      case 'TIPS_DAY_2':
        if (lead.orgType === 'DISPLAY_OWNER') {
          return {
            agentName: 'Marcos — Consultor de Mídia',
            message:
              `Oi ${firstName}! Marcos da Nexora aqui 👋\n\n` +
              `Uma dica rápida: no nosso *Creative AI*, você consegue gerar anúncios e spots em vídeo inteligentes para suas telas em menos de 1 minuto.\n\n` +
              `Já testou essa função no seu painel? Qualquer dúvida estou por aqui!`,
          };
        } else if (lead.orgType === 'ADVERTISER') {
          return {
            agentName: 'Marcos — Consultor de Mídia',
            message:
              `Olá ${firstName}, Marcos da Nexora por aqui!\n\n` +
              `Se precisar de uma consultoria rápida para mapear os pontos de telas com maior audiência em Luanda para a *${org}*, é só me avisar aqui que te ajudo a montar o plano ideal.`,
          };
        } else {
          return {
            agentName: 'Marcos — Consultor de Mídia',
            message:
              `Olá ${firstName}, tudo bem? Marcos da Nexora por aqui.\n\n` +
              `Passando só para saber como estão os primeiros passos da *${org}* na rede Nexora. Se precisar de qualquer suporte, estou à disposição!`,
          };
        }

      case 'CART_RECOVERY_NO_DISPLAYS':
        return {
          agentName: 'Lucas — Suporte & Ativação',
          message:
            `Oi ${firstName}! Lucas da Nexora aqui 😊\n\n` +
            `Notei que a *${org}* ainda não sincronizou nenhuma tela no sistema. Teve alguma dificuldade técnica com o player ou com a TV Box?\n\n` +
            `Se quiser, me responde aqui que te ajudo a colocar o primeiro display no ar agora mesmo!`,
        };

      case 'CART_RECOVERY_ABANDONED_CAMPAIGN':
        return {
          agentName: 'Lucas — Suporte & Ativação',
          message:
            `Olá ${firstName}! Lucas da Nexora por aqui.\n\n` +
            `Vi que você começou a configurar uma campanha para a *${org}* mas não chegou a finalizar.\n\n` +
            `Ficou alguma dúvida sobre os pontos de exibição ou valores? Posso te ajudar a revisar os detalhes por aqui!`,
        };

      case 'TRIAL_EXPIRING':
        return {
          agentName: 'Clara — Pós-Venda',
          message:
            `Olá ${firstName}, tudo bem? Clara da Nexora por aqui 👋\n\n` +
            `Passando para lembrar que o período de avaliação gratuita de 15 dias da *${org}* está quase a terminar.\n\n` +
            `Como tem sido a experiência? Se quiser manter as suas telas ativas sem nenhuma interrupção, posso te passar as opções de planos disponíveis.`,
        };

      default:
        return {
          agentName: 'Sofia — Relacionamento',
          message:
            `Olá ${firstName}, tudo bem? Sofia da equipa Nexora por aqui. Como vão os projetos da *${org}*? Qualquer coisa que precisar na plataforma, pode contar comigo por aqui!`,
        };
    }
  }

  /**
   * Dispara um follow-up manual ou automático para um lead específico
   */
  public async sendFollowUp(
    userId: string,
    triggerType: FollowUpTriggerType,
    customMessage?: string
  ): Promise<{ success: boolean; message: string; log?: FollowUpLog }> {
    await this.ensureTable();

    try {
      // 1. Busca dados do usuário
      const res = await pool.query(
        `SELECT u.id, u.full_name, u.email, COALESCE(u.phone, o.phone, '') as phone, o.name as org_name, o.type as org_type
         FROM users u
         LEFT JOIN organizations o ON o.id = u.organization_id
         WHERE u.id = $1 LIMIT 1`,
        [userId]
      );

      if (res.rows.length === 0) {
        return { success: false, message: 'Usuário não encontrado.' };
      }

      const user = res.rows[0];
      const cleanPhone = evolutionApiService.formatPhoneNumber(user.phone || '');
      if (!cleanPhone || cleanPhone.length < 9) {
        return { success: false, message: `O usuário ${user.full_name} não possui um número de WhatsApp válido cadastrado.` };
      }

      const generated = this.generateHumanMessage(triggerType, {
        fullName: user.full_name,
        orgName: user.org_name,
        orgType: user.org_type,
      });

      const messageToSend = customMessage?.trim() || generated.message;
      const agentName = generated.agentName;

      // 2. Dispara a mensagem via WhatsApp usando o número/agente vinculado
      const sent = await evolutionApiService.sendByRole('marketing', cleanPhone, messageToSend);

      // 3. Registra no histórico de follow-ups
      const logId = `fup-${Date.now()}`;
      await pool.query(
        `INSERT INTO whatsapp_followups (id, user_id, phone, lead_name, org_name, org_type, agent_name, trigger_type, message, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
        [
          logId,
          user.id,
          cleanPhone,
          user.full_name,
          user.org_name,
          user.org_type,
          agentName,
          triggerType,
          messageToSend,
          sent ? 'sent' : 'failed',
        ]
      );

      return {
        success: sent,
        message: sent
          ? `Mensagem humana de ${agentName} enviada com sucesso para +${cleanPhone}!`
          : `Falha ao entregar mensagem no WhatsApp de +${cleanPhone}. Verifique a instância.`,
        log: {
          id: logId,
          userId: user.id,
          phone: cleanPhone,
          leadName: user.full_name,
          orgName: user.org_name,
          agentName,
          triggerType,
          message: messageToSend,
          status: sent ? 'sent' : 'failed',
          createdAt: new Date().toISOString(),
        },
      };
    } catch (err: any) {
      console.error('❌ [WhatsApp FollowUp] Erro ao enviar follow-up:', err.message);
      return { success: false, message: err.message };
    }
  }

  /**
   * Retorna os últimos envios de follow-up
   */
  public async listRecentFollowUps(limit = 40): Promise<FollowUpLog[]> {
    await this.ensureTable();
    try {
      const res = await pool.query(
        `SELECT id, user_id, phone, lead_name, org_name, agent_name, trigger_type, message, status, created_at
         FROM whatsapp_followups
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit]
      );

      return res.rows.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        phone: r.phone,
        leadName: r.lead_name,
        orgName: r.org_name,
        agentName: r.agent_name,
        triggerType: r.trigger_type,
        message: r.message,
        status: r.status,
        createdAt: r.created_at,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Executa verificações automáticas com respeito a limites (não envia mais de 1 msg a cada 48h por lead)
   */
  public async runAutomatedBehaviorChecks(): Promise<{ processed: number; sent: number }> {
    const leads = await this.listLeadsWithBehavior();
    let sentCount = 0;

    for (const lead of leads) {
      // Ignora quem já recebeu follow-up nas últimas 48h
      if (lead.lastFollowUp?.sentAt) {
        const hoursSinceLast = (Date.now() - new Date(lead.lastFollowUp.sentAt).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLast < 48) continue;
      }

      if (!lead.phone || lead.phone.length < 9) continue;

      let triggerToFire: FollowUpTriggerType | null = null;
      if (lead.behaviorStatus === 'NEW') {
        triggerToFire = 'WELCOME_15MIN';
      } else if (lead.behaviorStatus === 'NO_DISPLAYS') {
        triggerToFire = 'CART_RECOVERY_NO_DISPLAYS';
      } else if (lead.behaviorStatus === 'ABANDONED_CAMPAIGN') {
        triggerToFire = 'CART_RECOVERY_ABANDONED_CAMPAIGN';
      } else if (lead.behaviorStatus === 'TRIAL_EXPIRING') {
        triggerToFire = 'TRIAL_EXPIRING';
      }

      if (triggerToFire) {
        const res = await this.sendFollowUp(lead.userId, triggerToFire);
        if (res.success) sentCount++;
      }
    }

    return { processed: leads.length, sent: sentCount };
  }
}

export const whatsappFollowUpService = new WhatsAppFollowUpService();
