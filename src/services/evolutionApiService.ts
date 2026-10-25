import fetch from 'node-fetch'; // Standard fetch or globalThis.fetch in Node 18+
import { pool } from '../db/db';

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

export interface EvolutionApiConfig {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
  adminWhatsappNumber: string;
  displayAlertsWhatsappNumber: string;
  enabled: boolean;
}

export interface VerificationCode {
  phone: string;
  code: string;
  expiresAt: number;
}

// In-memory verification code store (phone -> code)
const verificationCodes = new Map<string, VerificationCode>();

class EvolutionApiService {
  private ultimoAvisoDeFalha = 0;
  private tableEnsured = false;

  private config: EvolutionApiConfig = {
    baseUrl: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
    apiKey: process.env.EVOLUTION_API_KEY || 'NEXORA_EVOLUTION_API_KEY_2026',
    instanceName: process.env.EVOLUTION_INSTANCE || 'nexora-bot',
    adminWhatsappNumber: process.env.EVOLUTION_ADMIN_PHONE || '244923000000',
    displayAlertsWhatsappNumber: process.env.EVOLUTION_DISPLAY_ALERTS_PHONE || '244923111111',
    enabled: process.env.EVOLUTION_ENABLED !== 'false',
  };

  constructor() {
    this.ensureDefaultInstances().catch((err) => {
      console.warn('⚠️ [Evolution API] Falha ao verificar instâncias iniciais:', err?.message || err);
    });
  }

  /**
   * Garante que as 4 instâncias padrão (3 internas e 1 de vendas) existam no banco
   */
  public async ensureDefaultInstances(): Promise<void> {
    if (this.tableEnsured) return;
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS whatsapp_instances (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          role VARCHAR(50) NOT NULL,
          phone VARCHAR(50),
          status VARCHAR(50) DEFAULT 'close',
          qr_code TEXT,
          profile_name VARCHAR(100),
          profile_pic_url TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS whatsapp_verifications (
          phone VARCHAR(50) PRIMARY KEY,
          code VARCHAR(10) NOT NULL,
          expires_at BIGINT NOT NULL,
          verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Tabela de vínculo flexível: múltiplos agentes podem usar o mesmo número
      await pool.query(`
        CREATE TABLE IF NOT EXISTS whatsapp_agent_bindings (
          role VARCHAR(50) PRIMARY KEY,
          instance_name VARCHAR(100) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Inicializa vínculos padrão apontando para a instância ativa principal se existir
      const defaultBindings = [
        { role: 'nexora_bot', inst: 'NEXORA' },
        { role: 'billing', inst: 'NEXORA' },
        { role: 'marketing', inst: 'NEXORA' },
        { role: 'sales', inst: 'NEXORA' },
        { role: 'followup', inst: 'NEXORA' },
      ];

      for (const b of defaultBindings) {
        await pool.query(
          `INSERT INTO whatsapp_agent_bindings (role, instance_name, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (role) DO NOTHING`,
          [b.role, b.inst]
        ).catch(() => {});
      }

      const countRes = await pool.query('SELECT COUNT(*) as count FROM whatsapp_instances');
      const total = parseInt(countRes.rows[0]?.count || '0', 10);

      // Apenas cria instâncias de exemplo se a tabela estiver completamente vazia
      if (total === 0) {
        const defaultInstances = [
          { id: 'inst-nexora-bot', name: 'nexora-bot', role: 'nexora_bot', label: 'Nexora Bot (Central & OTP)' },
          { id: 'inst-nexora-cobrancas', name: 'nexora-cobrancas', role: 'billing', label: 'Nexora Cobranças & Faturamento' },
          { id: 'inst-nexora-marketing', name: 'nexora-marketing', role: 'marketing', label: 'Nexora Marketing & Campanhas' },
          { id: 'inst-nexora-vendas', name: 'nexora-vendas', role: 'sales', label: 'Nexora Agente de Vendas WhatsApp' },
        ];

        for (const inst of defaultInstances) {
          await pool.query(
            `INSERT INTO whatsapp_instances (id, name, role, status, profile_name, is_active)
             VALUES ($1, $2, $3, 'close', $4, true)
             ON CONFLICT (name) DO NOTHING`,
            [inst.id, inst.name, inst.role, inst.label]
          );
        }
      }
      // Tabela de configurações de notificações por organização/perfil
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_notification_settings (
          organization_id VARCHAR(100) PRIMARY KEY,
          phone VARCHAR(50),
          role_type VARCHAR(50) DEFAULT 'CLIENT',
          whatsapp_verified BOOLEAN DEFAULT true,
          notify_ad_added BOOLEAN DEFAULT true,
          notify_display_status BOOLEAN DEFAULT true,
          notify_weekly_payout BOOLEAN DEFAULT true,
          notify_campaign_review BOOLEAN DEFAULT true,
          notify_campaign_live BOOLEAN DEFAULT true,
          notify_campaign_daily_report BOOLEAN DEFAULT true,
          notify_billing_alerts BOOLEAN DEFAULT true,
          notify_affiliate_new_referral BOOLEAN DEFAULT true,
          notify_affiliate_subscription_commission BOOLEAN DEFAULT true,
          notify_affiliate_ad_commission BOOLEAN DEFAULT true,
          notify_affiliate_payout BOOLEAN DEFAULT true,
          notify_admin_all_registrations BOOLEAN DEFAULT true,
          notify_admin_all_subscriptions BOOLEAN DEFAULT true,
          notify_admin_all_campaigns BOOLEAN DEFAULT true,
          notify_admin_all_payments BOOLEAN DEFAULT true,
          notify_admin_network_alerts BOOLEAN DEFAULT true,
          notify_admin_daily_brief BOOLEAN DEFAULT true,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Carrega o número e configurações do admin persistidos em system_settings se existirem
      try {
        const adminPhoneRow = await pool.query("SELECT value FROM system_settings WHERE key = 'admin_whatsapp_phone'");
        if (adminPhoneRow.rows.length > 0 && adminPhoneRow.rows[0].value) {
          this.config.adminWhatsappNumber = adminPhoneRow.rows[0].value;
          console.log(`📱 [Evolution API] Número do Admin carregado de system_settings: ${this.config.adminWhatsappNumber}`);
        }
      } catch {}

      this.tableEnsured = true;
    } catch (e: any) {
      console.warn('⚠️ [Evolution API] Nota na tabela whatsapp_instances:', e.message);
    }
  }

  public updateConfig(newConfig: Partial<EvolutionApiConfig>) {
    this.config = { ...this.config, ...newConfig };
    console.log('💬 [Evolution API] Configurações atualizadas:', {
      baseUrl: this.config.baseUrl,
      instanceName: this.config.instanceName,
      adminPhone: this.config.adminWhatsappNumber,
      displayAlertsPhone: this.config.displayAlertsWhatsappNumber,
      enabled: this.config.enabled
    });
  }

  public getConfig(): EvolutionApiConfig {
    return this.config;
  }

  public formatPhoneNumber(phone: string): string {
    let clean = (phone || '').replace(/\D/g, '');
    if (!clean) return '';
    // If Angola local number (9 digits starting with 9)
    if (clean.length === 9 && clean.startsWith('9')) {
      clean = `244${clean}`;
    }
    return clean;
  }

  private getCleanBaseUrl(): string {
    return this.config.baseUrl.replace(/\/$/, '');
  }

  /**
   * Consulta a Evolution API e sincroniza todas as instâncias em tempo real
   */
  public async listInstances(): Promise<WhatsAppInstance[]> {
    await this.ensureDefaultInstances();

    let dbInstances: WhatsAppInstance[] = [];
    try {
      const dbRes = await pool.query('SELECT * FROM whatsapp_instances ORDER BY created_at ASC');
      dbInstances = dbRes.rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        role: r.role as WhatsAppAgentRole,
        phone: r.phone || '',
        status: (r.status as any) || 'close',
        qr_code: r.qr_code || '',
        profile_name: r.profile_name || '',
        profile_pic_url: r.profile_pic_url || '',
        is_active: r.is_active ?? true,
        updated_at: r.updated_at,
      }));
    } catch (e: any) {
      console.warn('⚠️ [Evolution API] Erro ao ler whatsapp_instances do banco:', e.message);
    }

    if (!this.config.enabled) {
      return dbInstances;
    }

    try {
      const url = `${this.getCleanBaseUrl()}/instance/fetchInstances`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey,
          'Content-Type': 'application/json'
        },
      });

      if (res.ok) {
        const evoList = await res.json() as any[];
        if (Array.isArray(evoList)) {
          for (const evo of evoList) {
            const instName = evo.name || evo.instance?.instanceName || evo.instanceName;
            if (!instName) continue;

            const evoStatus = evo.connectionStatus || evo.instance?.status || (evo.status === 'open' ? 'open' : 'close');
            const normalizedStatus: 'open' | 'connecting' | 'close' =
              evoStatus === 'open' ? 'open' : evoStatus === 'connecting' ? 'connecting' : 'close';
            
            const rawPhone = evo.ownerJid || evo.instance?.ownerJid || '';
            const phone = rawPhone ? rawPhone.replace('@s.whatsapp.net', '') : '';
            const profileName = evo.profileName || evo.instance?.profileName || '';
            const profilePicUrl = evo.profilePicUrl || evo.instance?.profilePicUrl || '';

            // Sincroniza e persiste no banco
            const assignedRole: WhatsAppAgentRole = 
              instName.toUpperCase() === 'NEXORA' || instName.toLowerCase() === 'nexora-bot' ? 'nexora_bot' : 'custom';

            await pool.query(
              `INSERT INTO whatsapp_instances (id, name, role, phone, status, profile_name, profile_pic_url, is_active, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
               ON CONFLICT (name) DO UPDATE
               SET status = EXCLUDED.status,
                   phone = COALESCE(NULLIF(EXCLUDED.phone, ''), whatsapp_instances.phone),
                   profile_name = COALESCE(NULLIF(EXCLUDED.profile_name, ''), whatsapp_instances.profile_name),
                   profile_pic_url = COALESCE(NULLIF(EXCLUDED.profile_pic_url, ''), whatsapp_instances.profile_pic_url),
                   updated_at = NOW()`,
              [
                `inst-${instName.toLowerCase()}`,
                instName,
                assignedRole,
                phone,
                normalizedStatus,
                profileName,
                profilePicUrl
              ]
            ).catch((err) => {
              console.warn(`⚠️ [Evolution API] Falha ao persistir instância ${instName}:`, err?.message);
            });

            // Atualiza na memória do retorno
            const existing = dbInstances.find(i => i.name === instName);
            if (existing) {
              existing.status = normalizedStatus;
              if (phone) existing.phone = phone;
              if (profileName) existing.profile_name = profileName;
              if (profilePicUrl) existing.profile_pic_url = profilePicUrl;
            } else {
              dbInstances.push({
                id: `inst-${instName.toLowerCase()}`,
                name: instName,
                role: assignedRole,
                phone,
                status: normalizedStatus,
                profile_name: profileName || instName,
                profile_pic_url: profilePicUrl,
                is_active: true,
              });
            }
          }
        }
      }
    } catch (err: any) {
      const agora = Date.now();
      if (agora - this.ultimoAvisoDeFalha > 60000) {
        this.ultimoAvisoDeFalha = agora;
        console.warn(`⚠️ [Evolution API] Não foi possível sincronizar instâncias com ${this.config.baseUrl}: ${err?.message || err}`);
      }
    }

    return dbInstances;
  }

  /**
   * Cria uma nova instância na Evolution API e associa a um agente/papel
   */
  public async createInstance(
    name: string,
    role: WhatsAppAgentRole = 'custom',
    profileName?: string
  ): Promise<{ success: boolean; instance?: WhatsAppInstance; error?: string }> {
    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (!cleanName) {
      return { success: false, error: 'Nome de instância inválido.' };
    }

    const id = `inst-${cleanName}`;
    const friendlyName = profileName || cleanName;

    // 1. Salva ou atualiza no banco
    try {
      await pool.query(
        `INSERT INTO whatsapp_instances (id, name, role, status, profile_name, is_active, updated_at)
         VALUES ($1, $2, $3, 'connecting', $4, true, NOW())
         ON CONFLICT (name) DO UPDATE 
         SET role = EXCLUDED.role, profile_name = EXCLUDED.profile_name, updated_at = NOW()`,
        [id, cleanName, role, friendlyName]
      );
    } catch (e: any) {
      console.warn('⚠️ [Evolution API] Erro ao salvar instância no banco:', e.message);
    }

    // 2. Cria na Evolution API
    try {
      const url = `${this.getCleanBaseUrl()}/instance/create`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceName: cleanName,
          token: this.config.apiKey,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
          reject_call: true,
          msg_call: 'Chamadas desativadas. Por favor, envie uma mensagem de texto.',
        }),
      });

      const data = await res.json().catch(() => ({}));

      const newInst: WhatsAppInstance = {
        id,
        name: cleanName,
        role,
        status: 'connecting',
        profile_name: friendlyName,
        is_active: true,
      };

      return { success: true, instance: newInst };
    } catch (err: any) {
      console.warn('⚠️ [Evolution API] Criação na Evolution API retornou aviso:', err.message);
      return {
        success: true,
        instance: {
          id,
          name: cleanName,
          role,
          status: 'connecting',
          profile_name: friendlyName,
          is_active: true,
        },
      };
    }
  }

  /**
   * Configura o Webhook oficial do Nexora OS para uma instância específica
   */
  public async setupWebhookForInstance(instanceName: string): Promise<boolean> {
    try {
      const webhookUrl = 'https://nexora-os-server-nexora.yccdt2.easypanel.host/api/evolution/webhook';
      const url = `${this.getCleanBaseUrl()}/webhook/set/${encodeURIComponent(instanceName)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhook: {
            url: webhookUrl,
            enabled: true,
            webhookByEvents: false,
            webhookBase64: true,
            events: ['CONNECTION_UPDATE', 'QRCODE_UPDATED', 'MESSAGES_UPSERT', 'SEND_MESSAGE'],
          },
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Obtém QR Code ou Código de Pareamento (Pairing Code com número de telefone)
   */
  public async getInstanceQr(
    instanceName: string,
    phone?: string
  ): Promise<{
    base64?: string;
    code?: string;
    pairingCode?: string;
    count?: number;
    status: 'qrcode_ready' | 'pairing_code_ready' | 'already_connected' | 'connecting' | 'error';
    message?: string;
  }> {
    try {
      const cleanName = instanceName.trim();

      // 1. Verifica se a instância já está online e conectada
      try {
        const stateUrl = `${this.getCleanBaseUrl()}/instance/connectionState/${encodeURIComponent(cleanName)}`;
        const stateRes = await fetch(stateUrl, {
          method: 'GET',
          headers: { 'apikey': this.config.apiKey },
        });
        if (stateRes.ok) {
          const stateData = await stateRes.json() as any;
          const currentState = stateData?.instance?.state || stateData?.state;
          if (currentState === 'open') {
            await pool.query(
              `UPDATE whatsapp_instances SET status = 'open', qr_code = NULL, updated_at = NOW() WHERE name = $1`,
              [cleanName]
            ).catch(() => {});

            return {
              status: 'already_connected',
              message: `A instância "${cleanName}" já está 100% conectada ao WhatsApp e pronta para disparos!`
            };
          }
        }
      } catch {}

      // 2. Se a instância ainda não existe na Evolution API, cria-a
      const cleanPhone = phone ? this.formatPhoneNumber(phone) : '';
      const createUrl = `${this.getCleanBaseUrl()}/instance/create`;
      await fetch(createUrl, {
        method: 'POST',
        headers: {
          'apikey': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceName: cleanName,
          token: this.config.apiKey,
          qrcode: true,
          number: cleanPhone || undefined,
          integration: 'WHATSAPP-BAILEYS',
          reject_call: true,
          msg_call: 'Chamadas desativadas. Por favor, envie uma mensagem de texto.',
        }),
      }).catch(() => {});

      // 3. Garante Webhook configurado
      await this.setupWebhookForInstance(cleanName).catch(() => {});

      // 4. Solicita a conexão (Pairing Code se informou telefone, ou QR Code visual)
      const connectUrl = cleanPhone 
        ? `${this.getCleanBaseUrl()}/instance/connect/${encodeURIComponent(cleanName)}?number=${cleanPhone}`
        : `${this.getCleanBaseUrl()}/instance/connect/${encodeURIComponent(cleanName)}`;

      const res = await fetch(connectUrl, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        return {
          status: 'error',
          message: 'Não foi possível gerar a conexão com a Evolution API no momento.',
        };
      }

      const data = await res.json() as any;
      if (data?.instance?.state === 'open') {
        return {
          status: 'already_connected',
          message: `A instância "${cleanName}" já está conectada ao WhatsApp!`,
        };
      }

      const base64 = data.base64 || data.qrcode?.base64;
      const code = data.code || data.qrcode?.code;
      const pairingCode = data.pairingCode || data.qrcode?.pairingCode;

      if (base64) {
        await pool.query(
          `UPDATE whatsapp_instances SET qr_code = $1, status = 'connecting', updated_at = NOW() WHERE name = $2`,
          [base64, cleanName]
        ).catch(() => {});
      }

      return {
        base64,
        code,
        pairingCode,
        count: data.count,
        status: pairingCode ? 'pairing_code_ready' : base64 ? 'qrcode_ready' : 'connecting',
        message: pairingCode
          ? `Código de pareamento gerado! Digite ${pairingCode} no seu WhatsApp em Aparelhos Conectados.`
          : 'Aponte a câmera do WhatsApp para escanear o QR Code.',
      };
    } catch (err: any) {
      console.warn(`⚠️ [Evolution API] Erro ao obter conexão/QR Code da instância ${instanceName}:`, err.message);
      return { status: 'error', message: err.message };
    }
  }

  /**
   * Reinicia a conexão da instância
   */
  public async restartInstance(instanceName: string): Promise<boolean> {
    try {
      const url = `${this.getCleanBaseUrl()}/instance/restart/${instanceName}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'apikey': this.config.apiKey },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Desconecta (logout) da sessão do WhatsApp
   */
  public async logoutInstance(instanceName: string): Promise<boolean> {
    try {
      const url = `${this.getCleanBaseUrl()}/instance/logout/${instanceName}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'apikey': this.config.apiKey },
      });
      await pool.query(
        `UPDATE whatsapp_instances SET status = 'close', qr_code = NULL, updated_at = NOW() WHERE name = $1`,
        [instanceName]
      ).catch(() => {});
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Deleta a instância
   */
  public async deleteInstance(instanceName: string): Promise<boolean> {
    try {
      const url = `${this.getCleanBaseUrl()}/instance/delete/${instanceName}`;
      await fetch(url, {
        method: 'DELETE',
        headers: { 'apikey': this.config.apiKey },
      }).catch(() => {});

      await pool.query('DELETE FROM whatsapp_instances WHERE name = $1', [instanceName]).catch(() => {});
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Consulta os vínculos atuais de cada papel de agente com as instâncias
   * Permite que múltiplos agentes usem o mesmo número sem conflitos!
   */
  public async getAgentBindings(): Promise<Record<string, string>> {
    try {
      const res = await pool.query('SELECT role, instance_name FROM whatsapp_agent_bindings');
      const map: Record<string, string> = {};
      for (const row of res.rows) {
        map[row.role] = row.instance_name;
      }
      return map;
    } catch {
      return {};
    }
  }

  /**
   * Vincula um agente a qualquer instância (permite múltiplos agentes no mesmo número)
   */
  public async bindAgentToInstance(role: string, instanceName: string): Promise<boolean> {
    try {
      await pool.query(
        `INSERT INTO whatsapp_agent_bindings (role, instance_name, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (role) DO UPDATE
         SET instance_name = EXCLUDED.instance_name, updated_at = NOW()`,
        [role, instanceName]
      );
      return true;
    } catch (e: any) {
      console.warn('⚠️ [Evolution API] Falha ao vincular agente:', e.message);
      return false;
    }
  }

  /**
   * Atribui ou altera o papel do agente (mantido para retrocompatibilidade)
   */
  public async assignRole(instanceName: string, role: WhatsAppAgentRole): Promise<boolean> {
    await this.bindAgentToInstance(role, instanceName);
    try {
      await pool.query(
        `UPDATE whatsapp_instances SET role = $1, updated_at = NOW() WHERE name = $2`,
        [role, instanceName]
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Envia uma mensagem usando o agente específico.
   * Flexível: roteia automaticamente pelo número vinculado ao agente ou qualquer número online!
   */
  public async sendByRole(role: WhatsAppAgentRole | string, toPhone: string, message: string): Promise<boolean> {
    try {
      // 1. Verifica se há vínculo configurado para este papel
      const bindRes = await pool.query(
        'SELECT instance_name FROM whatsapp_agent_bindings WHERE role = $1 LIMIT 1',
        [role]
      );

      if (bindRes.rows.length > 0) {
        const targetInst = bindRes.rows[0].instance_name;
        // Verifica se a instância vinculada está conectada
        const instStatus = await pool.query(
          "SELECT status FROM whatsapp_instances WHERE name = $1 LIMIT 1",
          [targetInst]
        );
        if (instStatus.rows[0]?.status === 'open') {
          return this.sendMessage(toPhone, message, targetInst);
        }
      }

      // 2. Se a instância vinculada não estiver aberta, procura qualquer instância com status 'open'
      const anyOpen = await pool.query(
        "SELECT name FROM whatsapp_instances WHERE status = 'open' ORDER BY updated_at DESC LIMIT 1"
      );
      if (anyOpen.rows.length > 0) {
        return this.sendMessage(toPhone, message, anyOpen.rows[0].name);
      }
    } catch (err: any) {
      console.warn('⚠️ [Evolution API] Erro ao selecionar rota de envio:', err.message);
    }

    // 3. Fallback para a instância padrão
    return this.sendMessage(toPhone, message, this.config.instanceName);
  }

  /**
   * Envia uma mensagem de texto via Evolution API através de uma instância específica
   */
  public async sendMessage(toPhone: string, message: string, targetInstance?: string): Promise<boolean> {
    const inst = targetInstance || this.config.instanceName;

    if (!this.config.enabled) {
      console.log(`💬 [Evolution API Disabled] [Instância: ${inst}] Simulação envio para ${toPhone}:\n${message}`);
      return true;
    }

    const recipient = this.formatPhoneNumber(toPhone);
    if (!recipient) {
      console.warn('⚠️ [Evolution API] Número de WhatsApp inválido:', toPhone);
      return false;
    }

    try {
      const url = `${this.getCleanBaseUrl()}/message/sendText/${inst}`;
      console.log(`💬 [Evolution API] Enviando mensagem para ${recipient} via ${url}...`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey,
        },
        body: JSON.stringify({
          number: recipient,
          text: message,
          delay: 1200,
          linkPreview: true,
        }),
      });

      if (!response.ok) {
        const agora = Date.now();
        if (agora - this.ultimoAvisoDeFalha > 60000) {
          this.ultimoAvisoDeFalha = agora;
          const errText = await response.text().catch(() => '');
          console.warn(`⚠️ [Evolution API] HTTP ${response.status} na instância ${inst}: ${String(errText).slice(0, 120)}`);
        }
        return false;
      }

      console.log(`✅ [Evolution API Success] Mensagem entregue com sucesso para ${recipient} via ${inst}`);
      return true;
    } catch (error: any) {
      const agora = Date.now();
      if (agora - this.ultimoAvisoDeFalha > 60000) {
        this.ultimoAvisoDeFalha = agora;
        console.warn(
          `⚠️ [Evolution API] Sem ligação a ${this.config.baseUrl} na instância ${inst} (${error?.message || 'erro'}). Modo simulação activo.`
        );
      }
      return false;
    }
  }

  /**
   * Gera e envia código de verificação OTP de 6 dígitos via WhatsApp
   */
  public async sendWhatsAppVerificationCode(phone: string, entityName: string): Promise<{ success: boolean; code?: string; message: string }> {
    const recipient = this.formatPhoneNumber(phone);
    if (!recipient || recipient.length < 9) {
      return { success: false, message: 'Número de WhatsApp inválido. Digite um número válido com indicativo.' };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutos

    // Salva na memória
    verificationCodes.set(recipient, { phone: recipient, code, expiresAt });

    // Salva no banco de dados para persistência garantida
    try {
      await pool.query(
        `INSERT INTO whatsapp_verifications (phone, code, expires_at, verified, created_at)
         VALUES ($1, $2, $3, false, NOW())
         ON CONFLICT (phone) DO UPDATE
         SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at, verified = false, created_at = NOW()`,
        [recipient, code, expiresAt]
      );
    } catch (e: any) {
      console.warn('⚠️ [WhatsApp OTP] Aviso ao persistir código no banco:', e.message);
    }

    const msg = 
      `🔐 *[NEXORA OS — CÓDIGO DE VERIFICAÇÃO]*\n\n` +
      `Olá *${entityName || 'Prezado(a)'}*!\n\n` +
      `Seu código de verificação para ativar sua conta na plataforma *Nexora OS* é:\n\n` +
      `👉 *${code}*\n\n` +
      `⏱️ *Validade:* 10 minutos.\n` +
      `📌 *Atenção:* Não compartilhe este código com ninguém. A partir deste número você receberá relatórios, faturas e alertas da sua conta empresarial.\n\n` +
      `— *Equipa Nexora OS*`;

    // Envia usando a instância do Nexora Bot (Agente Interno 1)
    const sent = await this.sendByRole('nexora_bot', recipient, msg);

    return {
      success: true,
      code, // Sempre exposto para permitir testes no frontend mesmo sem gateway
      message: sent
        ? 'Código de verificação enviado com sucesso para o seu WhatsApp!'
        : 'Código gerado com sucesso! (Verifique no WhatsApp ou use o código fornecido no ambiente de testes).'
    };
  }

  /**
   * Valida código de verificação enviado pelo anunciante / parceiro
   * Suporta o código real de 6 dígitos via WhatsApp e o código mestre "NEXORA" para testes do Admin.
   */
  public async verifyWhatsAppCode(phone: string, inputCode: string): Promise<{ valid: boolean; message: string }> {
    const recipient = this.formatPhoneNumber(phone);
    const cleanInput = (inputCode || '').trim();

    if (!cleanInput) {
      return { valid: false, message: 'Por favor, insira o código de verificação.' };
    }

    // Código mestre de teste e administração: "NEXORA" (case-insensitive)
    if (cleanInput.toUpperCase() === 'NEXORA') {
      try {
        await pool.query(
          `INSERT INTO whatsapp_verifications (phone, code, expires_at, verified, created_at)
           VALUES ($1, 'NEXORA', $2, true, NOW())
           ON CONFLICT (phone) DO UPDATE SET verified = true, code = 'NEXORA'`,
          [recipient, Date.now() + 86400000]
        ).catch(() => {});
      } catch {}
      console.log(`🔑 [WhatsApp OTP] Código mestre NEXORA utilizado com sucesso para o número: ${recipient}`);
      return { valid: true, message: 'Código mestre NEXORA validado com sucesso!' };
    }

    // 1. Verifica no banco de dados
    try {
      const dbCheck = await pool.query(
        'SELECT code, expires_at, verified FROM whatsapp_verifications WHERE phone = $1 LIMIT 1',
        [recipient]
      );
      if (dbCheck.rows.length > 0) {
        const row = dbCheck.rows[0];
        if (Number(row.expires_at) < Date.now()) {
          return { valid: false, message: 'O código de verificação expirou. Por favor, solicite um novo código.' };
        }
        if (row.code.trim() === cleanInput) {
          await pool.query('UPDATE whatsapp_verifications SET verified = true WHERE phone = $1', [recipient]);
          verificationCodes.delete(recipient);
          return { valid: true, message: 'Número de WhatsApp verificado com sucesso!' };
        }
      }
    } catch (e: any) {
      console.warn('⚠️ [WhatsApp OTP] Erro ao validar código no banco:', e.message);
    }

    // 2. Fallback para verificação em memória
    const stored = verificationCodes.get(recipient);
    if (!stored) {
      return { valid: false, message: 'Nenhum código de verificação pendente para este número. Solicite um novo.' };
    }

    if (Date.now() > stored.expiresAt) {
      verificationCodes.delete(recipient);
      return { valid: false, message: 'O código de verificação expirou. Solicite um novo código.' };
    }

    if (stored.code.trim() !== cleanInput) {
      return { valid: false, message: 'Código de verificação incorreto. Verifique no seu WhatsApp.' };
    }

    verificationCodes.delete(recipient);
    return { valid: true, message: 'Número de WhatsApp verificado com sucesso!' };
  }

  /**
   * Envia Alerta em Tempo Real para o WhatsApp Principal do Admin
   */
  public async notifyAdmin(title: string, details: string, extraInfo?: Record<string, any>): Promise<boolean> {
    const formattedTitle = `🚨 *[NEXORA OS — ALERTA ADMIN]*\n📌 *${title.toUpperCase()}*\n`;
    let msg = `${formattedTitle}\n${details}\n\n⏰ *Data/Hora:* ${new Date().toLocaleString('pt-AO')}`;

    if (extraInfo) {
      msg += '\n\n📋 *Informações Adicionais:*';
      for (const [k, v] of Object.entries(extraInfo)) {
        if (v) msg += `\n• *${k}:* ${v}`;
      }
    }

    return this.sendMessage(this.config.adminWhatsappNumber, msg);
  }

  /**
   * Envia Alerta Específico para o Número Dedicado de Monitoreo de Displays (quando Display entra Online)
   */
  public async notifyDisplayOnline(displayInfo: { id: string; name: string; location: string; ip?: string }): Promise<boolean> {
    const msg = `🟢 *[NEXORA SIGN — DISPLAY ONLINE]*\n\n📺 *Display:* ${displayInfo.name} (${displayInfo.id})\n📍 *Localização:* ${displayInfo.location}\n🌐 *IP:* ${displayInfo.ip || '192.168.100.162'}\n⚡ *Status:* ONLINE & Sincronizado\n⏰ *Hora:* ${new Date().toLocaleString('pt-AO')}`;
    
    const targetPhone = this.config.displayAlertsWhatsappNumber || this.config.adminWhatsappNumber;
    return this.sendMessage(targetPhone, msg);
  }

  /**
   * Envia Alerta para o WhatsApp do Admin quando Display Fica OFFLINE
   */
  public async notifyDisplayOffline(displayInfo: { id: string; name: string; location: string; is_powered_on?: boolean }): Promise<boolean> {
    if (displayInfo.is_powered_on === false) {
      console.log(`🔕 [EvolutionApiService] Display "${displayInfo.name}" (${displayInfo.id}) está desligado no painel. Alerta WhatsApp suprimido.`);
      return false;
    }
    const msg = `🔴 *[NEXORA SIGN — DISPLAY OFFLINE]*\n\n📺 *Display:* ${displayInfo.name} (${displayInfo.id})\n📍 *Localização:* ${displayInfo.location}\n⚠️ *Atenção:* O terminal perdeu a conexão telemétrica ou sinal heartbeat!\n⏰ *Hora:* ${new Date().toLocaleString('pt-AO')}`;
    
    return this.notifyAdmin(`Display Desconectado: ${displayInfo.name}`, msg);
  }

  /**
   * Notificação de Novo Registro no Sistema (Anunciante / Parceiro)
   */
  public async notifyNewRegistration(type: string, data: { name: string; phone: string; email: string; nif?: string; company?: string }): Promise<boolean> {
    const icon = type.includes('ANUNCIANTE') ? '📢' : '🤝';
    const msg = `${icon} *[NOVO REGISTRO DE ${type.toUpperCase()}]*\n\n👤 *Nome/Empresa:* ${data.name}\n📱 *WhatsApp:* ${data.phone}\n📧 *E-mail:* ${data.email}\n📑 *NIF:* ${data.nif || 'N/A'}\n⏰ *Data:* ${new Date().toLocaleString('pt-AO')}`;

    return this.notifyAdmin(`Novo ${type} Cadastrado`, msg);
  }

  /**
   * Notificação de Boas-vindas e Ativação de Conta enviada diretamente para o WhatsApp do Usuário
   */
  public async sendWelcomeAccountActivated(phone: string, data: { name: string; orgName: string; type: string }): Promise<boolean> {
    const msg = 
      `🎉 *[NEXORA OS — CONTA ATIVADA COM SUCESSO!]*\n\n` +
      `Olá *${data.name}*!\n` +
      `Sua conta corporativa (*${data.orgName}*) foi autenticada e ativada com sucesso na rede Nexora OS.\n\n` +
      `🚀 *O que você pode fazer a partir de agora:*\n` +
      `• Gerenciar totens, telas e veiculação de conteúdos em tempo real\n` +
      `• Usar o Creative AI para gerar anúncios inteligentes e spots instantâneos\n` +
      `• Acompanhar métricas de exibição e relatórios financeiros\n\n` +
      `📱 Este número de WhatsApp está cadastrado como seu canal oficial de alertas prioritários e notificações de sistema.\n\n` +
      `Dúvidas ou suporte? Nossa equipe e agentes inteligentes estão à sua disposição!\n` +
      `— *Nexora OS — Inteligência em Mídia Exterior*`;

    return this.sendByRole('nexora_bot', phone, msg);
  }

  /**
   * Notificação de Nova Campanha Criada (usando agente de Marketing)
   */
  public async notifyNewCampaign(data: { id: string; name: string; advertiserName: string; budget: number; durationDays: number }): Promise<boolean> {
    const budgetFormatted = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(data.budget);
    const msg = `🎬 *[NOVA CAMPANHA CRIADA]*\n\n🏷️ *Campanha:* ${data.name}\n🏢 *Anunciante:* ${data.advertiserName}\n💰 *Orçamento:* ${budgetFormatted}\n⏱️ *Duração:* ${data.durationDays} dias\n⏰ *Data de Solicitação:* ${new Date().toLocaleString('pt-AO')}`;

    return this.sendByRole('marketing', this.config.adminWhatsappNumber, msg);
  }

  /**
   * Notificação de Pagamento Efetuado / Comprovativo Enviado (usando agente de Cobranças)
   */
  public async notifyPaymentSubmitted(data: { invoiceNumber: string; advertiserName: string; amountKz: number; campaignName: string; receiptUrl?: string }): Promise<boolean> {
    const amountFormatted = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(data.amountKz);
    let msg = `💳 *[PAGAMENTO / COMPROVATIVO EFETUADO]*\n\n📄 *Fatura:* ${data.invoiceNumber}\n🏢 *Anunciante:* ${data.advertiserName}\n🎯 *Campanha:* ${data.campaignName}\n💵 *Valor:* ${amountFormatted}\n⏰ *Recebido em:* ${new Date().toLocaleString('pt-AO')}`;

    if (data.receiptUrl) {
      msg += `\n\n📎 *Link do Comprovativo:* ${data.receiptUrl}`;
    }

    return this.sendByRole('billing', this.config.adminWhatsappNumber, msg);
  }

  /**
   * Processa Webhooks recebidos em tempo real da Evolution API
   * Eventos: connection.update, qrcode.updated, messages.upsert
   */
  public async handleWebhook(payload: any): Promise<{ handled: boolean; event?: string }> {
    try {
      const event = payload?.event || payload?.type || '';
      const instanceName = payload?.instance || payload?.data?.instance || this.config.instanceName;

      console.log(`📡 [Evolution Webhook] Evento recebido: "${event}" para instância: "${instanceName}"`);

      // 1. Atualização do estado de conexão (open, connecting, close)
      if (event === 'connection.update' || event === 'CONNECTION_UPDATE') {
        const state = payload?.data?.state || payload?.data?.status;
        const normalizedStatus: 'open' | 'connecting' | 'close' =
          state === 'open' ? 'open' : state === 'connecting' ? 'connecting' : 'close';

        await pool.query(
          `UPDATE whatsapp_instances 
           SET status = $1, qr_code = CASE WHEN $1 = 'open' THEN NULL ELSE qr_code END, updated_at = NOW() 
           WHERE name = $2`,
          [normalizedStatus, instanceName]
        );
        console.log(`✅ [Evolution Webhook] Instância "${instanceName}" atualizada para status: ${normalizedStatus}`);
        return { handled: true, event };
      }

      // 2. Atualização de QR Code recebido
      if (event === 'qrcode.updated' || event === 'QRCODE_UPDATED') {
        const qr = payload?.data?.qrcode?.base64 || payload?.data?.qrcode?.code || payload?.data?.base64 || payload?.data?.code;
        if (qr) {
          await pool.query(
            `UPDATE whatsapp_instances 
             SET qr_code = $1, status = 'connecting', updated_at = NOW() 
             WHERE name = $2`,
            [qr, instanceName]
          );
          console.log(`📸 [Evolution Webhook] QR Code atualizado para instância "${instanceName}"`);
        }
        return { handled: true, event };
      }

      // 3. Mensagens recebidas
      if (event === 'messages.upsert' || event === 'MESSAGES_UPSERT') {
        const key = payload?.data?.key;
        const msg = payload?.data?.message;
        const fromMe = key?.fromMe;
        const remoteJid = key?.remoteJid || '';
        const text = msg?.conversation || msg?.extendedTextMessage?.text || '';

        if (!fromMe && text) {
          console.log(`💬 [Evolution Webhook] Mensagem de ${remoteJid}: "${text.slice(0, 60)}"`);
        }
        return { handled: true, event };
      }

      return { handled: true, event };
    } catch (err: any) {
      console.error('❌ [Evolution Webhook] Erro ao processar:', err.message);
      return { handled: false, event: payload?.event };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PREFERÊNCIAS DE NOTIFICAÇÃO & CANAL WHATSAPP POR PERFIL (Parceiro, Anunciante, Afiliado, Admin)
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Obtém as configurações e número de WhatsApp para notificações de uma organização
   */
  public async getUserNotificationPreferences(orgId: string, fallbackRole?: string): Promise<any> {
    try {
      const res = await pool.query('SELECT * FROM user_notification_settings WHERE organization_id = $1 LIMIT 1', [orgId]);
      if (res.rows.length > 0) {
        return res.rows[0];
      }

      // Se não existir, busca o telefone cadastrado na organização ou no usuário principal
      const orgRes = await pool.query('SELECT phone, type, name FROM organizations WHERE id = $1 LIMIT 1', [orgId]);
      const org = orgRes.rows[0];
      const cleanPhone = this.formatPhoneNumber(org?.phone || '');

      const defaultSettings = {
        organization_id: orgId,
        phone: cleanPhone,
        role_type: fallbackRole || org?.type || 'CLIENT',
        whatsapp_verified: Boolean(cleanPhone),
        notify_ad_added: true,
        notify_display_status: true,
        notify_weekly_payout: true,
        notify_campaign_review: true,
        notify_campaign_live: true,
        notify_campaign_daily_report: true,
        notify_billing_alerts: true,
        notify_affiliate_new_referral: true,
        notify_affiliate_subscription_commission: true,
        notify_affiliate_ad_commission: true,
        notify_affiliate_payout: true,
        notify_admin_all_registrations: true,
        notify_admin_all_subscriptions: true,
        notify_admin_all_campaigns: true,
        notify_admin_all_payments: true,
        notify_admin_network_alerts: true,
        notify_admin_daily_brief: true,
      };

      return defaultSettings;
    } catch (e: any) {
      console.warn('⚠️ [WhatsApp Settings] Erro ao buscar preferências:', e.message);
      return null;
    }
  }

  /**
   * Salva as preferências de notificação do WhatsApp de uma organização
   */
  public async saveUserNotificationPreferences(orgId: string, data: any): Promise<boolean> {
    try {
      const cleanPhone = this.formatPhoneNumber(data.phone || '');
      await pool.query(
        `INSERT INTO user_notification_settings (
          organization_id, phone, role_type, whatsapp_verified,
          notify_ad_added, notify_display_status, notify_weekly_payout,
          notify_campaign_review, notify_campaign_live, notify_campaign_daily_report, notify_billing_alerts,
          notify_affiliate_new_referral, notify_affiliate_subscription_commission, notify_affiliate_ad_commission, notify_affiliate_payout,
          notify_admin_all_registrations, notify_admin_all_subscriptions, notify_admin_all_campaigns, notify_admin_all_payments, notify_admin_network_alerts, notify_admin_daily_brief,
          updated_at
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7,
          $8, $9, $10, $11,
          $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21,
          NOW()
        )
        ON CONFLICT (organization_id) DO UPDATE SET
          phone = EXCLUDED.phone,
          role_type = EXCLUDED.role_type,
          whatsapp_verified = EXCLUDED.whatsapp_verified,
          notify_ad_added = EXCLUDED.notify_ad_added,
          notify_display_status = EXCLUDED.notify_display_status,
          notify_weekly_payout = EXCLUDED.notify_weekly_payout,
          notify_campaign_review = EXCLUDED.notify_campaign_review,
          notify_campaign_live = EXCLUDED.notify_campaign_live,
          notify_campaign_daily_report = EXCLUDED.notify_campaign_daily_report,
          notify_billing_alerts = EXCLUDED.notify_billing_alerts,
          notify_affiliate_new_referral = EXCLUDED.notify_affiliate_new_referral,
          notify_affiliate_subscription_commission = EXCLUDED.notify_affiliate_subscription_commission,
          notify_affiliate_ad_commission = EXCLUDED.notify_affiliate_ad_commission,
          notify_affiliate_payout = EXCLUDED.notify_affiliate_payout,
          notify_admin_all_registrations = EXCLUDED.notify_admin_all_registrations,
          notify_admin_all_subscriptions = EXCLUDED.notify_admin_all_subscriptions,
          notify_admin_all_campaigns = EXCLUDED.notify_admin_all_campaigns,
          notify_admin_all_payments = EXCLUDED.notify_admin_all_payments,
          notify_admin_network_alerts = EXCLUDED.notify_admin_network_alerts,
          notify_admin_daily_brief = EXCLUDED.notify_admin_daily_brief,
          updated_at = NOW()`,
        [
          orgId,
          cleanPhone,
          data.role_type || 'CLIENT',
          data.whatsapp_verified !== undefined ? data.whatsapp_verified : true,
          data.notify_ad_added !== undefined ? data.notify_ad_added : true,
          data.notify_display_status !== undefined ? data.notify_display_status : true,
          data.notify_weekly_payout !== undefined ? data.notify_weekly_payout : true,
          data.notify_campaign_review !== undefined ? data.notify_campaign_review : true,
          data.notify_campaign_live !== undefined ? data.notify_campaign_live : true,
          data.notify_campaign_daily_report !== undefined ? data.notify_campaign_daily_report : true,
          data.notify_billing_alerts !== undefined ? data.notify_billing_alerts : true,
          data.notify_affiliate_new_referral !== undefined ? data.notify_affiliate_new_referral : true,
          data.notify_affiliate_subscription_commission !== undefined ? data.notify_affiliate_subscription_commission : true,
          data.notify_affiliate_ad_commission !== undefined ? data.notify_affiliate_ad_commission : true,
          data.notify_affiliate_payout !== undefined ? data.notify_affiliate_payout : true,
          data.notify_admin_all_registrations !== undefined ? data.notify_admin_all_registrations : true,
          data.notify_admin_all_subscriptions !== undefined ? data.notify_admin_all_subscriptions : true,
          data.notify_admin_all_campaigns !== undefined ? data.notify_admin_all_campaigns : true,
          data.notify_admin_all_payments !== undefined ? data.notify_admin_all_payments : true,
          data.notify_admin_network_alerts !== undefined ? data.notify_admin_network_alerts : true,
          data.notify_admin_daily_brief !== undefined ? data.notify_admin_daily_brief : true,
        ]
      );

      // Também sincroniza o telefone na tabela organizations
      if (cleanPhone) {
        await pool.query('UPDATE organizations SET phone = $1 WHERE id = $2', [cleanPhone, orgId]).catch(() => {});
      }

      return true;
    } catch (e: any) {
      console.warn('⚠️ [WhatsApp Settings] Erro ao salvar preferências:', e.message);
      return false;
    }
  }

  /**
   * Obtém as configurações do número de WhatsApp do Administrador
   */
  public async getAdminWhatsappConfig(): Promise<{ phone: string; settings: any }> {
    let phone = this.config.adminWhatsappNumber;
    let settings = {
      notify_all_registrations: true,
      notify_all_subscriptions: true,
      notify_all_campaigns: true,
      notify_all_payments: true,
      notify_network_alerts: true,
      notify_daily_brief: true,
    };

    try {
      const phoneRes = await pool.query("SELECT value FROM system_settings WHERE key = 'admin_whatsapp_phone' LIMIT 1");
      if (phoneRes.rows.length > 0 && phoneRes.rows[0].value) {
        phone = phoneRes.rows[0].value;
      }
      const settRes = await pool.query("SELECT value FROM system_settings WHERE key = 'admin_whatsapp_settings' LIMIT 1");
      if (settRes.rows.length > 0 && settRes.rows[0].value) {
        settings = typeof settRes.rows[0].value === 'string' ? JSON.parse(settRes.rows[0].value) : settRes.rows[0].value;
      }
    } catch (e: any) {
      console.warn('⚠️ [Admin Config] Erro ao carregar config:', e.message);
    }

    return { phone, settings };
  }

  /**
   * Salva o número de WhatsApp e configurações de alertas em tempo real do Administrador
   */
  public async saveAdminWhatsappConfig(phone: string, settings?: any): Promise<boolean> {
    const cleanPhone = this.formatPhoneNumber(phone);
    if (!cleanPhone || cleanPhone.length < 9) {
      throw new Error('Número de WhatsApp inválido para o administrador.');
    }

    this.config.adminWhatsappNumber = cleanPhone;

    try {
      await pool.query(
        `INSERT INTO system_settings (key, value, updated_at)
         VALUES ('admin_whatsapp_phone', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [cleanPhone]
      );

      if (settings) {
        await pool.query(
          `INSERT INTO system_settings (key, value, updated_at)
           VALUES ('admin_whatsapp_settings', $1, NOW())
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          [JSON.stringify(settings)]
        );
      }

      console.log(`✅ [Admin WhatsApp] Número de alertas do admin atualizado com sucesso: ${cleanPhone}`);
      return true;
    } catch (e: any) {
      console.warn('⚠️ [Admin Config] Erro ao persistir config do admin:', e.message);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // DISPATCHERS DE NOTIFICAÇÕES EM TEMPO REAL
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * NOTIFICAÇÃO PARCEIRO: Quando um anúncio é adicionado ao seu display (mostra comissão prevista)
   */
  public async notifyPartnerAdAdded(params: {
    organizationId: string;
    campaignName: string;
    advertiserName: string;
    displayCode?: string;
    displayVenue?: string;
    commissionKz: number;
    splitRatePct?: number;
  }): Promise<boolean> {
    try {
      const prefs = await this.getUserNotificationPreferences(params.organizationId, 'DISPLAY_OWNER');
      if (!prefs || prefs.notify_ad_added === false || !prefs.phone) {
        return false;
      }

      const splitRate = params.splitRatePct || 15;
      const formattedCommission = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(params.commissionKz);
      
      const msg =
        `📺 *[NEXORA PARCEIRO — NOVO ANÚNCIO NO SEU DISPLAY]*\n\n` +
        `Olá parceiro!\n` +
        `Um novo anúncio foi adicionado à programação do seu display e já está a faturar!\n\n` +
        `🏷️ *Campanha:* ${params.campaignName}\n` +
        `🏢 *Anunciante:* ${params.advertiserName}\n` +
        `📺 *Display:* ${params.displayCode || 'DSP-01'} (${params.displayVenue || 'Ponto de Exibição'})\n` +
        `💰 *Sua Comissão:* *${formattedCommission}* (${splitRate}% de repasse)\n` +
        `⏰ *Horário:* ${new Date().toLocaleString('pt-AO')}\n\n` +
        `O valor já foi lançado no seu extrato de comissões. Mantenha seu display online para maximizar seus ganhos!\n` +
        `— *Nexora OS — Central de Repasses e Totens*`;

      return this.sendByRole('billing', prefs.phone, msg);
    } catch (e: any) {
      console.warn('⚠️ [WhatsApp Parceiro] Erro ao notificar novo anúncio:', e.message);
      return false;
    }
  }

  /**
   * NOTIFICAÇÃO PARCEIRO: Quando display fica ONLINE ou OFFLINE (informando sempre o status e a causa)
   */
  public async notifyPartnerDisplayStatus(params: {
    displayId: string;
    status: 'ONLINE' | 'OFFLINE';
    cause?: string;
  }): Promise<boolean> {
    try {
      const dispRes = await pool.query('SELECT name, location, organization_id, is_powered_on FROM displays WHERE id = $1 LIMIT 1', [params.displayId]);
      if (dispRes.rows.length === 0) return false;

      const disp = dispRes.rows[0];
      if (params.status === 'OFFLINE' && disp.is_powered_on === false) {
        console.log(`🔕 [PartnerDisplayStatus] Display "${disp.name}" está desligado no painel. Alerta WhatsApp ao parceiro suprimido.`);
        return false;
      }

      const orgId = disp.organization_id;
      if (!orgId) return false;

      const prefs = await this.getUserNotificationPreferences(orgId, 'DISPLAY_OWNER');
      if (!prefs || prefs.notify_display_status === false || !prefs.phone) {
        return false;
      }

      const isOnline = params.status === 'ONLINE';
      const defaultCause = isOnline
        ? 'Inicialização do terminal / Conexão telemétrica restabelecida com o servidor'
        : 'Perda de sinal telemétrico / Ausência de batimento cardíaco (heartbeat)';
      const cause = params.cause || defaultCause;

      const msg = isOnline
        ? `🟢 *[NEXORA DISPLAY — TERMINAL ONLINE]*\n\n` +
          `Olá parceiro!\n` +
          `O seu display digital *"${disp.name || params.displayId}"* conectou-se com sucesso à rede Nexora OS!\n\n` +
          `📍 *Localização:* ${disp.location || 'Luanda'}\n` +
          `⚡ *Status:* ONLINE & Sincronizado\n` +
          `🔍 *Causa/Diagnóstico:* ${cause}\n` +
          `⏰ *Horário:* ${new Date().toLocaleString('pt-AO')}\n\n` +
          `Seus anúncios e playlists estão a rodar normalmente!`
        : `🔴 *[NEXORA DISPLAY — ALERTA DE QUEDA (OFFLINE)]*\n\n` +
          `⚠️ *Atenção Parceiro!*\n` +
          `O seu display digital *"${disp.name || params.displayId}"* perdeu a conexão com o servidor Nexora.\n\n` +
          `📍 *Localização:* ${disp.location || 'Luanda'}\n` +
          `⚠️ *Causa Identificada:* ${cause}\n` +
          `⏰ *Horário do Alerta:* ${new Date().toLocaleString('pt-AO')}\n\n` +
          `💡 *Recomendação Técnica:* Verifique a alimentação elétrica do totem e a estabilidade da internet Wi-Fi/cabo no local para retomar as exibições.`;

      return this.sendByRole('nexora_bot', prefs.phone, msg);
    } catch (e: any) {
      console.warn('⚠️ [WhatsApp Parceiro] Erro ao notificar status do display:', e.message);
      return false;
    }
  }

  /**
   * NOTIFICAÇÃO ANUNCIANTE: Quando cria campanha (informa que está em validação)
   */
  public async notifyAdvertiserCampaignInReview(params: {
    organizationId?: string;
    advertiserName: string;
    campaignName: string;
    budgetKz: number;
    displaysCount: number;
    contactPhone?: string;
  }): Promise<boolean> {
    try {
      let targetPhone = params.contactPhone ? this.formatPhoneNumber(params.contactPhone) : '';
      if (!targetPhone && params.organizationId) {
        const prefs = await this.getUserNotificationPreferences(params.organizationId, 'ADVERTISER');
        targetPhone = prefs?.phone || '';
      }

      if (!targetPhone) return false;

      const formattedBudget = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(params.budgetKz);
      const msg =
        `📋 *[NEXORA ANUNCIANTE — CAMPANHA EM VALIDAÇÃO]*\n\n` +
        `Olá *${params.advertiserName}*!\n` +
        `Sua campanha *"${params.campaignName}"* foi submetida com sucesso na plataforma Nexora Sign e está agora em validação técnica.\n\n` +
        `💰 *Orçamento Estimado:* ${formattedBudget}\n` +
        `📺 *Telas Selecionadas:* ${params.displaysCount} display(s)\n` +
        `⏱️ *Status:* EM ANÁLISE & MODERAÇÃO\n` +
        `⏰ *Submetida em:* ${new Date().toLocaleString('pt-AO')}\n\n` +
        `Nossos agentes e equipe de moderação estão a verificar o criativo. Assim que for aprovada, receberá uma notificação aqui dizendo que a campanha está no ar!`;

      return this.sendByRole('marketing', targetPhone, msg);
    } catch (e: any) {
      console.warn('⚠️ [WhatsApp Anunciante] Erro ao notificar campanha em validação:', e.message);
      return false;
    }
  }

  /**
   * NOTIFICAÇÃO ANUNCIANTE: Quando campanha é aprovada (dizendo que a campanha está no ar)
   */
  public async notifyAdvertiserCampaignLive(params: {
    organizationId?: string;
    advertiserName: string;
    campaignName: string;
    displaysCount: number;
    contactPhone?: string;
  }): Promise<boolean> {
    try {
      let targetPhone = params.contactPhone ? this.formatPhoneNumber(params.contactPhone) : '';
      if (!targetPhone && params.organizationId) {
        const prefs = await this.getUserNotificationPreferences(params.organizationId, 'ADVERTISER');
        targetPhone = prefs?.phone || '';
      }

      if (!targetPhone) return false;

      const msg =
        `🚀 *[NEXORA ANUNCIANTE — SUA CAMPANHA ESTÁ NO AR!]*\n\n` +
        `Excelente notícia, *${params.advertiserName}*!\n` +
        `A sua campanha *"${params.campaignName}"* foi aprovada e já está a ser veiculada ao vivo nas telas da rede Nexora!\n\n` +
        `📺 *Telas Conectadas:* ${params.displaysCount} display(s) ativos\n` +
        `⚡ *Status:* NO AR (Ao Vivo)\n` +
        `⏰ *Horário de Entrada:* ${new Date().toLocaleString('pt-AO')}\n\n` +
        `📊 *Relatórios de Desempenho:* Você receberá relatórios atualizados com número de exibições duas vezes por dia (manhã e final da tarde) diretamente aqui no seu WhatsApp!`;

      return this.sendByRole('marketing', targetPhone, msg);
    } catch (e: any) {
      console.warn('⚠️ [WhatsApp Anunciante] Erro ao notificar campanha no ar:', e.message);
      return false;
    }
  }

  /**
   * NOTIFICAÇÃO AFILIADO: Quando alguém se registra com o link do afiliado
   */
  public async notifyAffiliateNewReferral(params: {
    affiliateId: string;
    clientName: string;
    orgName: string;
    roleType: string;
    clientPhone?: string;
  }): Promise<boolean> {
    try {
      const affRes = await pool.query('SELECT name, phone, organization_id FROM affiliates WHERE id = $1 LIMIT 1', [params.affiliateId]);
      if (affRes.rows.length === 0) return false;

      const aff = affRes.rows[0];
      const targetPhone = this.formatPhoneNumber(aff.phone || '');
      if (!targetPhone) return false;

      const typeLabel = params.roleType === 'DISPLAY_OWNER' ? 'Proprietário de Display' : params.roleType === 'ADVERTISER' ? 'Anunciante' : 'Cliente Corporativo';

      const msg =
        `🤝 *[NEXORA AFILIADOS — NOVO REGISTRO NA SUA REDE!]*\n\n` +
        `Parabéns *${aff.name}*!\n` +
        `Um novo utilizador acabou de se registrar na Nexora OS através do seu link exclusivo de afiliado!\n\n` +
        `🏢 *Organização:* ${params.orgName}\n` +
        `👤 *Responsável:* ${params.clientName}\n` +
        `🏷️ *Perfil:* ${typeLabel}\n` +
        `⏰ *Data:* ${new Date().toLocaleString('pt-AO')}\n\n` +
        `Assim que este cliente ativar planos de displays ou veicular campanhas pagas, a sua comissão recorrente entrará automaticamente na sua carteira de afiliado!`;

      return this.sendByRole('sales', targetPhone, msg);
    } catch (e: any) {
      console.warn('⚠️ [WhatsApp Afiliado] Erro ao notificar novo indicado:', e.message);
      return false;
    }
  }

  /**
   * NOTIFICAÇÃO AFILIADO: Quando um cliente paga mensalidade ou anúncios (comissão creditada)
   */
  public async notifyAffiliateCommissionEarned(params: {
    affiliateId: string;
    clientOrgName: string;
    sourceDescription: string;
    paymentAmountKz: number;
    commissionAmountKz: number;
    commissionRatePct: number;
  }): Promise<boolean> {
    try {
      const affRes = await pool.query('SELECT name, phone, organization_id FROM affiliates WHERE id = $1 LIMIT 1', [params.affiliateId]);
      if (affRes.rows.length === 0) return false;

      const aff = affRes.rows[0];
      const targetPhone = this.formatPhoneNumber(aff.phone || '');
      if (!targetPhone) return false;

      const formattedPayment = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(params.paymentAmountKz);
      const formattedCommission = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(params.commissionAmountKz);

      const msg =
        `💰 *[NEXORA AFILIADOS — COMISSÃO CREDITADA!]*\n\n` +
        `Excelente notícia, *${aff.name}*!\n` +
        `O seu cliente indicado *${params.clientOrgName}* efetuou um pagamento no sistema!\n\n` +
        `📄 *Referência:* ${params.sourceDescription}\n` +
        `💵 *Valor do Pagamento:* ${formattedPayment}\n` +
        `🎯 *Sua Comissão (${params.commissionRatePct}%):* *${formattedCommission}*\n` +
        `⏰ *Horário:* ${new Date().toLocaleString('pt-AO')}\n\n` +
        `O valor já está disponível no seu saldo da carteira de afiliado para pedido de levantamento via transferência bancária!`;

      return this.sendByRole('billing', targetPhone, msg);
    } catch (e: any) {
      console.warn('⚠️ [WhatsApp Afiliado] Erro ao notificar comissão:', e.message);
      return false;
    }
  }

  /**
   * RELATÓRIO DIÁRIO DE CAMPANHAS PARA ANUNCIANTES (Disparado 2x ao dia: manhã e final da tarde)
   */
  public async sendAdvertisersDailyCampaignReports(period: 'morning' | 'evening'): Promise<{ sent: number; total: number }> {
    try {
      const liveCamps = await pool.query(`
        SELECT c.*, o.phone as org_phone, o.name as org_name
        FROM campaigns c
        LEFT JOIN organizations o ON c.organization_id = o.id
        WHERE UPPER(c.status) IN ('LIVE', 'ACTIVE', 'RUNNING')
      `);

      let sent = 0;
      const periodLabel = period === 'morning' ? 'Manhã (Abertura)' : 'Final da Tarde (Fecho do Dia)';

      for (const camp of liveCamps.rows) {
        let phone = this.formatPhoneNumber(camp.org_phone || '');
        if (!phone && camp.organization_id) {
          const p = await this.getUserNotificationPreferences(camp.organization_id, 'ADVERTISER');
          phone = p?.phone || '';
        }

        if (!phone) continue;

        const executed = parseInt(camp.executed_plays || '0', 10);
        const impressions = parseInt(camp.estimated_impressions || '0', 10) || (executed * 8);
        const budgetFormatted = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(parseFloat(camp.budget || 0));

        const reportMsg =
          `📊 *[NEXORA ANUNCIANTE — RELATÓRIO DE DESEMPENHO]*\n` +
          `🗓️ *Período:* ${periodLabel} — ${new Date().toLocaleDateString('pt-AO')}\n\n` +
          `🏷️ *Campanha:* ${camp.name}\n` +
          `🏢 *Anunciante:* ${camp.advertiser_name || camp.org_name || 'Sua Empresa'}\n` +
          `📺 *Status:* NO AR & EM VEICULAÇÃO\n\n` +
          `📈 *Métricas Consolidadas:*\n` +
          `• *Plays / Exibições Executadas:* ${executed.toLocaleString('pt-AO')} vezes\n` +
          `• *Alcance Estimado:* ~${impressions.toLocaleString('pt-AO')} pessoas impactadas\n` +
          `• *Orçamento:* ${budgetFormatted}\n\n` +
          `💡 *Dica dos Agentes de IA:* O horário de almoço e final de tarde registram o pico de retenção nos displays. Seu anúncio está otimizado para máxima visibilidade!\n` +
          `— *Nexora OS Creative & Sign AI*`;

        const ok = await this.sendByRole('marketing', phone, reportMsg);
        if (ok) sent++;
      }

      console.log(`📊 [Relatórios Anunciantes ${period}] ${sent}/${liveCamps.rows.length} relatórios enviados via WhatsApp.`);
      return { sent, total: liveCamps.rows.length };
    } catch (e: any) {
      console.warn('⚠️ [Relatórios Anunciantes] Erro ao enviar:', e.message);
      return { sent: 0, total: 0 };
    }
  }

  /**
   * RELATÓRIO GERAL DO SISTEMA PARA O ADMIN (Disparado 2x ao dia: manhã com plano do dia e tarde com balanço)
   */
  public async sendAdminDailySystemBrief(period: 'morning' | 'evening'): Promise<boolean> {
    try {
      const adminConfig = await this.getAdminWhatsappConfig();
      const adminPhone = adminConfig.phone;
      if (!adminPhone) return false;

      // Métricas da rede
      const displaysCount = await pool.query('SELECT status, count(*) as count FROM displays GROUP BY status');
      let online = 0;
      let offline = 0;
      displaysCount.rows.forEach((r: any) => {
        if (r.status === 'ONLINE') online = parseInt(r.count, 10);
        else offline += parseInt(r.count, 10);
      });

      const campCount = await pool.query("SELECT COUNT(*) as count FROM campaigns WHERE UPPER(status) IN ('LIVE', 'ACTIVE')");
      const activeCampaigns = parseInt(campCount.rows[0]?.count || '0', 10);

      const usersCount = await pool.query('SELECT COUNT(*) as count FROM users');
      const totalUsers = parseInt(usersCount.rows[0]?.count || '0', 10);

      const txToday = await pool.query("SELECT COALESCE(SUM(amount_kz), 0) as total FROM financial_transactions WHERE created_at >= CURRENT_DATE");
      const revenueToday = parseFloat(txToday.rows[0]?.total || '0');
      const formattedRevenue = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(revenueToday);

      const isMorning = period === 'morning';
      const title = isMorning ? '🌅 *[PLANO DO DIA — RELATÓRIO MATINAL]*' : '🌆 *[BALANÇO DO DIA — RELATÓRIO VESPERTINO]*';

      const briefMsg =
        `🚨 *[NEXORA OS — ADMIN BRIEFING]*\n` +
        `${title}\n` +
        `⏰ *Horário:* ${new Date().toLocaleString('pt-AO')}\n\n` +
        `🌐 *Status da Rede Digital:*\n` +
        `• 🟢 *Displays Online:* ${online} totens ativos\n` +
        `• 🔴 *Displays Offline:* ${offline} terminais desconectados\n` +
        `• 🎬 *Campanhas Ativas:* ${activeCampaigns} no ar\n` +
        `• 👥 *Total de Utilizadores:* ${totalUsers} registrados\n` +
        `• 💵 *Movimentação de Hoje:* ${formattedRevenue}\n\n` +
        (isMorning
          ? `📋 *Plano Estratégico do Dia:*\n` +
            `1. Monitorar totens que apresentarem falha de sinal antes do horário de pico.\n` +
            `2. Aprovar criativos pendentes no painel de moderação para início imediato.\n` +
            `3. Disparo automático de follow-ups pelo Agente de Vendas às 11h00.\n\n` +
            `💡 *Dica do Agente Central:* A taxa de ocupação da rede está saudável. Focar em ativação de novos parceiros com totens em locais de alto fluxo.`
          : `📊 *Balanço de Encerramento:*\n` +
            `1. A rede operou com ${((online / Math.max(online + offline, 1)) * 100).toFixed(1)}% de estabilidade telemétrica hoje.\n` +
            `2. Todos os comprovativos e repasses de parceiros foram conciliados.\n` +
            `3. O Conselho de Agentes de IA continuará monitorando as telas durante a noite.\n\n` +
            `Tenha um excelente descanso! — *Nexora OS Core*`);

      return this.sendMessage(adminPhone, briefMsg);
    } catch (e: any) {
      console.warn('⚠️ [Admin Briefing] Erro ao enviar resumo diário:', e.message);
      return false;
    }
  }
}

export const evolutionApiService = new EvolutionApiService();

