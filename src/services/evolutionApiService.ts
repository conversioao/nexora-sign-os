import fetch from 'node-fetch'; // Standard fetch or globalThis.fetch in Node 18+

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
  /**
   * Marca temporal do último aviso de falha.
   *
   * Sem o serviço de WhatsApp acessível (o caso em desenvolvimento, onde o
   * endereço é `localhost:8080`), cada evento de display gerava um erro completo
   * no log. Aqui limita-se a um aviso curto por minuto, para os erros a sério não
   * ficarem escondidos no meio do ruído.
   */
  private ultimoAvisoDeFalha = 0;

  private config: EvolutionApiConfig = {
    baseUrl: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
    apiKey: process.env.EVOLUTION_API_KEY || 'NEXORA_EVOLUTION_API_KEY_2026',
    instanceName: process.env.EVOLUTION_INSTANCE || 'nexora-bot',
    adminWhatsappNumber: process.env.EVOLUTION_ADMIN_PHONE || '244923000000',
    displayAlertsWhatsappNumber: process.env.EVOLUTION_DISPLAY_ALERTS_PHONE || '244923111111',
    enabled: process.env.EVOLUTION_ENABLED === 'true' || true,
  };

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

  private formatPhoneNumber(phone: string): string {
    let clean = phone.replace(/\D/g, '');
    if (!clean) return '';
    // If Angola local number (9 digits starting with 9)
    if (clean.length === 9 && clean.startsWith('9')) {
      clean = `244${clean}`;
    }
    return clean;
  }

  /**
   * Envia uma mensagem de texto simples via Evolution API
   */
  public async sendMessage(toPhone: string, message: string): Promise<boolean> {
    if (!this.config.enabled) {
      console.log(`💬 [Evolution API Disabled] Simulação envio de mensagem para ${toPhone}:\n${message}`);
      return true;
    }

    const recipient = this.formatPhoneNumber(toPhone);
    if (!recipient) {
      console.warn('⚠️ [Evolution API] Número de WhatsApp inválido:', toPhone);
      return false;
    }

    try {
      const url = `${this.config.baseUrl.replace(/\/$/, '')}/message/sendText/${this.config.instanceName}`;
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
        /**
         * Falha HTTP do serviço de WhatsApp: registo curto e limitado (antes
         * imprimia a resposta inteira a cada evento de display).
         */
        const agora = Date.now();
        if (agora - this.ultimoAvisoDeFalha > 60000) {
          this.ultimoAvisoDeFalha = agora;
          const errText = await response.text().catch(() => '');
          console.warn(`⚠️ [Evolution API] HTTP ${response.status} em ${this.config.baseUrl}: ${String(errText).slice(0, 120)}`);
        }
        return false;
      }

      console.log(`✅ [Evolution API Success] Mensagem entregue com sucesso para ${recipient}`);
      return true;
    } catch (error: any) {
      /**
       * ⛔ Uma falha do serviço de WhatsApp não pode encher o log do servidor.
       *
       * Sem `EVOLUTION_API_URL` configurado, o endereço é `localhost:8080` — que
       * não existe em desenvolvimento. Cada evento de display (online/offline)
       * gerava um erro completo com stack, e num servidor com vários ecrãs isso
       * são dezenas de linhas por hora que escondem erros verdadeiros.
       *
       * Aqui avisa-se UMA vez por minuto, com uma linha curta.
       */
      const agora = Date.now();
      if (agora - this.ultimoAvisoDeFalha > 60000) {
        this.ultimoAvisoDeFalha = agora;
        console.warn(
          `⚠️ [Evolution API] Sem ligação a ${this.config.baseUrl} (${error?.code || error?.message || 'erro'}). ` +
            'As notificações de WhatsApp ficam em modo simulação. Configure EVOLUTION_API_URL para as enviar a sério.'
        );
      }
      return false;
    }
  }

  /**
   * Envia Alerta em Tempo Real para o WhatsApp Principal do Admin
   */
  public async notifyAdmin(title: string, details: string, extraInfo?: Record<string, any>): Promise<boolean> {
    const formattedTitle = `🚨 *[NEXORA OS - ALERTA ADMIN]*\n📌 *${title.toUpperCase()}*\n`;
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
    const msg = `🟢 *[NEXORA SIGN - DISPLAY ONLINE]*\n\n📺 *Display:* ${displayInfo.name} (${displayInfo.id})\n📍 *Localização:* ${displayInfo.location}\n🌐 *IP:* ${displayInfo.ip || '192.168.100.162'}\n⚡ *Status:* ONLINE & Sincronizado\n⏰ *Hora:* ${new Date().toLocaleString('pt-AO')}`;
    
    // Notifica o número dedicado a monitores de display
    const targetPhone = this.config.displayAlertsWhatsappNumber || this.config.adminWhatsappNumber;
    return this.sendMessage(targetPhone, msg);
  }

  /**
   * Envia Alerta para o WhatsApp do Admin quando Display Fica OFFLINE
   */
  public async notifyDisplayOffline(displayInfo: { id: string; name: string; location: string }): Promise<boolean> {
    const msg = `🔴 *[NEXORA SIGN - DISPLAY OFFLINE]*\n\n📺 *Display:* ${displayInfo.name} (${displayInfo.id})\n📍 *Localização:* ${displayInfo.location}\n⚠️ *Atenção:* O terminal perdeu a conexão telemétrica ou sinal heartbeat!\n⏰ *Hora:* ${new Date().toLocaleString('pt-AO')}`;
    
    return this.notifyAdmin(`Display Desconectado: ${displayInfo.name}`, msg);
  }

  /**
   * Notificação de Novo Registros no Sistema (Anunciante / Parceiro)
   */
  public async notifyNewRegistration(type: 'ANUNCIANTE' | 'PARCEIRO', data: { name: string; phone: string; email: string; nif?: string; company?: string }): Promise<boolean> {
    const icon = type === 'ANUNCIANTE' ? '📢' : '🤝';
    const msg = `${icon} *[NOVO REGISTRO DE ${type}]*\n\n👤 *Nome/Empresa:* ${data.name}\n📱 *WhatsApp:* ${data.phone}\n📧 *E-mail:* ${data.email}\n📑 *NIF:* ${data.nif || 'N/A'}\n⏰ *Data:* ${new Date().toLocaleString('pt-AO')}`;

    return this.notifyAdmin(`Novo ${type} Cadastrado`, msg);
  }

  /**
   * Notificação de Nova Campanha Criada
   */
  public async notifyNewCampaign(data: { id: string; name: string; advertiserName: string; budget: number; durationDays: number }): Promise<boolean> {
    const budgetFormatted = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(data.budget);
    const msg = `🎬 *[NOVA CAMPANHA CRIADA]*\n\n🏷️ *Campanha:* ${data.name}\n🏢 *Anunciante:* ${data.advertiserName}\n💰 *Orçamento:* ${budgetFormatted}\n⏱️ *Duração:* ${data.durationDays} dias\n⏰ *Data de Solicitação:* ${new Date().toLocaleString('pt-AO')}`;

    return this.notifyAdmin(`Nova Campanha Criada - ${data.name}`, msg);
  }

  /**
   * Notificação de Pagamento Efetuado / Comprovativo Enviado
   */
  public async notifyPaymentSubmitted(data: { invoiceNumber: string; advertiserName: string; amountKz: number; campaignName: string; receiptUrl?: string }): Promise<boolean> {
    const amountFormatted = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(data.amountKz);
    let msg = `💳 *[PAGAMENTO / COMPROVATIVO EFETUADO]*\n\n📄 *Fatura:* ${data.invoiceNumber}\n🏢 *Anunciante:* ${data.advertiserName}\n🎯 *Campanha:* ${data.campaignName}\n💵 *Valor:* ${amountFormatted}\n⏰ *Recebido em:* ${new Date().toLocaleString('pt-AO')}`;

    if (data.receiptUrl) {
      msg += `\n\n📎 *Link do Comprovativo:* ${data.receiptUrl}`;
    }

    return this.notifyAdmin(`Pagamento Efetuado (${data.invoiceNumber})`, msg);
  }

  /**
   * Gera e envia código de verificação via WhatsApp para novo anunciante / parceiro
   */
  public async sendWhatsAppVerificationCode(phone: string, entityName: string): Promise<{ success: boolean; code?: string; message: string }> {
    const recipient = this.formatPhoneNumber(phone);
    if (!recipient) {
      return { success: false, message: 'Número de WhatsApp inválido' };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutos

    verificationCodes.set(recipient, { phone: recipient, code, expiresAt });

    const msg = `🔐 *[NEXORA OS - CÓDIGO DE VERIFICAÇÃO]*\n\nOlá *${entityName}*!\nSeu código de verificação do WhatsApp é:\n\n👉 *${code}*\n\nEste código é válido por 10 minutos. Insira no painel Nexora para validar sua conta e receber notificações em tempo real.`;

    const sent = await this.sendMessage(recipient, msg);
    
    // Sempre retorna sucesso e o código em ambiente local para facilidade de testes do usuário
    return {
      success: true,
      code, // exposto para facilidade de teste no modo dev
      message: sent ? 'Código de verificação enviado via WhatsApp!' : 'Código gerado com sucesso (simulação WhatsApp).'
    };
  }

  /**
   * Valida código de verificação enviado pelo anunciante / parceiro
   */
  public verifyWhatsAppCode(phone: string, inputCode: string): { valid: boolean; message: string } {
    const recipient = this.formatPhoneNumber(phone);
    const stored = verificationCodes.get(recipient);

    if (!stored) {
      return { valid: false, message: 'Nenhum código de verificação encontrado para este número. Solicite um novo.' };
    }

    if (Date.now() > stored.expiresAt) {
      verificationCodes.delete(recipient);
      return { valid: false, message: 'Código de verificação expirado. Solicite um novo código.' };
    }

    if (stored.code.trim() !== inputCode.trim()) {
      return { valid: false, message: 'Código de verificação incorreto. Verifique no seu WhatsApp.' };
    }

    verificationCodes.delete(recipient);
    return { valid: true, message: 'Número de WhatsApp verificado com sucesso!' };
  }
}

export const evolutionApiService = new EvolutionApiService();
