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
   */
  public async verifyWhatsAppCode(phone: string, inputCode: string): Promise<{ valid: boolean; message: string }> {
    const recipient = this.formatPhoneNumber(phone);
    const cleanInput = (inputCode || '').trim();

    if (!cleanInput) {
      return { valid: false, message: 'Por favor, insira o código de verificação.' };
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
  public async notifyDisplayOffline(displayInfo: { id: string; name: string; location: string }): Promise<boolean> {
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
}

export const evolutionApiService = new EvolutionApiService();

