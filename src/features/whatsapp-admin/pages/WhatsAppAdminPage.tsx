import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageSquare,
  Bot,
  QrCode,
  RefreshCw,
  Plus,
  Power,
  RotateCcw,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Smartphone,
  PhoneCall,
  Send,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  DollarSign,
  Megaphone,
  Briefcase,
  Users,
  ExternalLink,
  Sparkles,
  HeartHandshake,
  Lightbulb,
  ShoppingCart,
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCheck,
  Radio,
  Activity,
  Mic,
  ThumbsUp,
  Target,
  ArrowRight,
  Sliders,
  Bell,
  Sun,
  Moon,
  FileText,
  CheckCircle,
} from 'lucide-react';
import {
  whatsappAdminService,
  WhatsAppInstance,
  WhatsAppAgentRole,
  ROLE_LABELS,
  QrResponse,
  FollowUpLead,
  FollowUpLog,
  AgentDiscussion,
  AgentMessage,
  AgentActionPlan,
  AdminWhatsappConfig,
} from '../services/whatsappAdminService';
import { useToast } from '../../../components/ui/Toast';

export const WhatsAppAdminPage: React.FC = () => {
  const { showToast } = useToast();

  // Active Tab: 1. Instâncias, 2. Alertas & Briefings do Admin, 3. CRM Follow-Up, 4. War Room (Conselho de Decisões)
  const [activeTab, setActiveTab] = useState<'instances' | 'alerts' | 'crm' | 'war-room'>('instances');

  // Admin WhatsApp Alerts & Daily Briefing Configuration State
  const [adminPhone, setAdminPhone] = useState('');
  const [adminSettings, setAdminSettings] = useState({
    notifyNewUser: true,
    notifyNewSubscription: true,
    notifyNewCampaign: true,
    notifyPaymentReceived: true,
    notifyDisplayStatus: true,
    dailyBriefMorning: true,
    dailyBriefEvening: true,
  });
  const [loadingAdminConfig, setLoadingAdminConfig] = useState(false);
  const [savingAdminConfig, setSavingAdminConfig] = useState(false);
  const [sendingAdminTest, setSendingAdminTest] = useState(false);
  const [triggeringMorning, setTriggeringMorning] = useState(false);
  const [triggeringEvening, setTriggeringEvening] = useState(false);

  // Instances & Bindings State
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [bindings, setBindings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Evolution API Gateway State
  const [gatewayUrl, setGatewayUrl] = useState('');
  const [gatewayApiKey, setGatewayApiKey] = useState('');
  const [gatewayInstance, setGatewayInstance] = useState('');
  const [gatewayTesting, setGatewayTesting] = useState(false);
  const [gatewaySaving, setGatewaySaving] = useState(false);
  const [gatewayTestResult, setGatewayTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Connection & QR Code Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedInstanceName, setSelectedInstanceName] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [qrData, setQrData] = useState<QrResponse | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [copiedPairing, setCopiedPairing] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // New Instance Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newInstanceRole, setNewInstanceRole] = useState<WhatsAppAgentRole>('custom');
  const [newInstanceProfile, setNewInstanceProfile] = useState('');
  const [creating, setCreating] = useState(false);

  // Test Message Modal State
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testTargetPhone, setTestTargetPhone] = useState('');
  const [testMessage, setTestMessage] = useState(
    'Olá! Esta é uma mensagem de teste oficial enviada via Evolution API do ecossistema Nexora OS.'
  );
  const [testInstance, setTestInstance] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  // CRM Follow-Up State
  const [leads, setLeads] = useState<FollowUpLead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [followUpLogs, setFollowUpLogs] = useState<FollowUpLog[]>([]);
  const [runningAutomated, setRunningAutomated] = useState(false);
  const [leadFilter, setLeadFilter] = useState<'ALL' | 'NEW' | 'NO_DISPLAYS' | 'ABANDONED_CAMPAIGN' | 'TRIAL_EXPIRING'>('ALL');
  const [leadSearch, setLeadSearch] = useState('');

  // Follow-Up Send Modal State
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<FollowUpLead | null>(null);
  const [selectedTrigger, setSelectedTrigger] = useState<string>('WELCOME_15M');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [sendingFollowUp, setSendingFollowUp] = useState(false);

  // ── Agent War Room & Inter-communication State ──
  const [discussions, setDiscussions] = useState<AgentDiscussion[]>([]);
  const [activeDiscussion, setActiveDiscussion] = useState<AgentDiscussion | null>(null);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [runningDiscussion, setRunningDiscussion] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [approvingPlan, setApprovingPlan] = useState(false);

  // Load instances & bindings
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [instancesData, bindingsData, gatewayConfigData] = await Promise.all([
        whatsappAdminService.getInstances(),
        whatsappAdminService.getAgentBindings().catch(() => ({})),
        whatsappAdminService.getGatewayConfig().catch(() => null),
      ]);
      setInstances(instancesData);
      setBindings(bindingsData);
      if (gatewayConfigData) {
        setGatewayUrl(gatewayConfigData.baseUrl || '');
        setGatewayApiKey(gatewayConfigData.apiKey || '');
        setGatewayInstance(gatewayConfigData.instanceName || 'NEXORA');
      }
    } catch (err: any) {
      if (!isSilent) showToast(err?.message || 'Erro ao carregar instâncias do WhatsApp.', 'danger');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  // Load CRM Leads & History
  const loadCrmData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLeadsLoading(true);
    try {
      const [leadsData, historyData] = await Promise.all([
        whatsappAdminService.getLeads(),
        whatsappAdminService.getFollowUpHistory().catch(() => []),
      ]);
      setLeads(leadsData);
      setFollowUpLogs(historyData);
    } catch (err: any) {
      if (!isSilent) showToast('Erro ao carregar lista de leads e histórico.', 'danger');
    } finally {
      setLeadsLoading(false);
    }
  }, [showToast]);

  // Load War Room Discussions
  const loadWarRoomData = useCallback(async (isSilent = false) => {
    if (!isSilent) setDiscussionsLoading(true);
    try {
      const list = await whatsappAdminService.getDiscussions();
      setDiscussions(list);
      if (list.length > 0) {
        setActiveDiscussion((prev) => (prev ? list.find((d) => d.id === prev.id) || list[0] : list[0]));
      }
    } catch (err: any) {
      if (!isSilent) showToast('Erro ao carregar reuniões do conselho de agentes.', 'danger');
    } finally {
      setDiscussionsLoading(false);
    }
  }, [showToast]);

  // Load Admin WhatsApp Config
  const loadAdminConfig = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoadingAdminConfig(true);
    try {
      const cfg = await whatsappAdminService.getAdminWhatsappConfig();
      setAdminPhone(cfg.phone || '');
      if (cfg.settings) {
        setAdminSettings((prev) => ({ ...prev, ...cfg.settings }));
      }
    } catch (err: any) {
      if (!isSilent) showToast('Não foi possível carregar as configurações do WhatsApp do Admin.', 'danger');
    } finally {
      if (!isSilent) setLoadingAdminConfig(false);
    }
  }, [showToast]);

  const handleSaveAdminConfig = async () => {
    setSavingAdminConfig(true);
    try {
      const ok = await whatsappAdminService.saveAdminWhatsappConfig(adminPhone.trim(), adminSettings);
      if (ok) {
        showToast('Configurações do WhatsApp do Administrador salvas com sucesso! 🛡️', 'success');
      } else {
        showToast('Erro ao salvar configurações do Admin.', 'danger');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro ao conectar à API.', 'danger');
    } finally {
      setSavingAdminConfig(false);
    }
  };

  const handleSendAdminTest = async () => {
    if (!adminPhone.trim()) {
      showToast('Informe um número de WhatsApp válido para o Administrador.', 'warning');
      return;
    }
    setSendingAdminTest(true);
    try {
      const res = await whatsappAdminService.sendAdminTestMessage(adminPhone.trim());
      if (res.success) {
        showToast('Mensagem de teste enviada com sucesso para o WhatsApp do Admin! 🚀', 'success');
      } else {
        showToast(res.error || 'Falha ao enviar mensagem de teste.', 'danger');
      }
    } catch (err: any) {
      showToast('Erro de conexão ao enviar teste.', 'danger');
    } finally {
      setSendingAdminTest(false);
    }
  };

  const handleTestGateway = async () => {
    setGatewayTesting(true);
    setGatewayTestResult(null);
    try {
      const res = await whatsappAdminService.testGatewayConnection(gatewayUrl, gatewayApiKey);
      setGatewayTestResult({ success: res.success, message: res.message });
      if (res.success) {
        showToast(res.message, 'success');
        loadData(true);
      } else {
        showToast(res.message, 'danger');
      }
    } catch (err: any) {
      const msg = err?.message || 'Falha ao conectar ao gateway.';
      setGatewayTestResult({ success: false, message: msg });
      showToast(msg, 'danger');
    } finally {
      setGatewayTesting(false);
    }
  };

  const handleSaveGateway = async () => {
    setGatewaySaving(true);
    try {
      const ok = await whatsappAdminService.saveGatewayConfig({
        baseUrl: gatewayUrl.trim(),
        apiKey: gatewayApiKey.trim(),
        instanceName: gatewayInstance.trim() || 'NEXORA',
      });
      if (ok) {
        showToast('Configurações do Gateway salvas no banco com sucesso! 🌐', 'success');
        await handleTestGateway();
      } else {
        showToast('Erro ao salvar configurações do Gateway.', 'danger');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro ao conectar à API.', 'danger');
    } finally {
      setGatewaySaving(false);
    }
  };

  const handleTriggerBriefing = async (period: 'morning' | 'evening') => {
    if (period === 'morning') setTriggeringMorning(true);
    else setTriggeringEvening(true);

    try {
      const res = await whatsappAdminService.triggerDailyReport(period, adminPhone.trim() || undefined);
      if (res.success) {
        showToast(
          `Relatório de ${period === 'morning' ? 'Manhã (08h00 - Plano do Dia)' : 'Final da Tarde (18h00 - Fecho)'} disparado com sucesso! 📊`,
          'success'
        );
      } else {
        showToast(res.error || 'Falha ao disparar relatório diário.', 'danger');
      }
    } catch (err: any) {
      showToast('Erro ao processar relatório diário.', 'danger');
    } finally {
      if (period === 'morning') setTriggeringMorning(false);
      else setTriggeringEvening(false);
    }
  };

  useEffect(() => {
    loadData();
    loadAdminConfig(true);
    const interval = setInterval(() => {
      loadData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [loadData, loadAdminConfig]);

  useEffect(() => {
    if (activeTab === 'crm') {
      loadCrmData();
    } else if (activeTab === 'war-room') {
      loadWarRoomData();
    } else if (activeTab === 'alerts') {
      loadAdminConfig();
    }
  }, [activeTab, loadCrmData, loadWarRoomData, loadAdminConfig]);

  // Open QR / Connection modal
  const handleOpenConnect = async (instanceName: string) => {
    setSelectedInstanceName(instanceName);
    setQrModalOpen(true);
    setQrLoading(true);
    setQrData(null);

    const inst = instances.find((i) => i.name === instanceName);
    const existingPhone = inst?.phone || '';
    setPhoneInput(existingPhone);

    try {
      const data = await whatsappAdminService.connectInstance(instanceName, existingPhone || undefined);
      setQrData(data);
    } catch (err: any) {
      showToast('Não foi possível gerar QR Code para esta instância.', 'danger');
    } finally {
      setQrLoading(false);
    }

    // Polling connection status
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(async () => {
      try {
        const list = await whatsappAdminService.getInstances();
        setInstances(list);
        const current = list.find((i) => i.name === instanceName);
        if (current && current.status === 'open') {
          showToast(`WhatsApp conectado com sucesso na instância ${instanceName}! 🎉`, 'success');
          clearInterval(pollTimerRef.current!);
          setQrModalOpen(false);
          loadData(true);
        }
      } catch {}
    }, 4000);
  };

  const handleGeneratePairingOrQr = async () => {
    if (!selectedInstanceName) return;
    setQrLoading(true);
    try {
      const data = await whatsappAdminService.connectInstance(
        selectedInstanceName,
        phoneInput.trim() || undefined
      );
      setQrData(data);
      if (data.status === 'already_connected') {
        showToast('Instância já está conectada ao WhatsApp!', 'info');
      } else {
        showToast('Novo código gerado com sucesso!', 'success');
      }
    } catch (err: any) {
      showToast('Falha ao gerar conexão na Evolution API.', 'danger');
    } finally {
      setQrLoading(false);
    }
  };

  const handleCloseQr = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setQrModalOpen(false);
    setSelectedInstanceName(null);
    setQrData(null);
    loadData(true);
  };

  // Bind Agent to Instance
  const handleBindAgent = async (role: string, instanceName: string) => {
    try {
      const ok = await whatsappAdminService.bindAgent(role, instanceName);
      if (ok) {
        setBindings((prev) => ({ ...prev, [role]: instanceName }));
        showToast(`Agente vinculado com sucesso à instância ${instanceName || 'Desvinculado'}!`, 'success');
        loadData(true);
      } else {
        showToast('Erro ao vincular agente.', 'danger');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro ao vincular agente.', 'danger');
    }
  };

  // Create Instance
  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstanceName.trim()) {
      showToast('O identificador da instância é obrigatório.', 'warning');
      return;
    }

    setCreating(true);
    try {
      const res = await whatsappAdminService.createInstance(
        newInstanceName.trim(),
        newInstanceRole,
        newInstanceProfile.trim() || undefined
      );

      if (res.success) {
        showToast('Instância criada com sucesso! Conecte agora o QR Code.', 'success');
        setCreateModalOpen(false);
        setNewInstanceName('');
        setNewInstanceProfile('');
        await loadData();
        if (res.instance?.name) {
          handleOpenConnect(res.instance.name);
        }
      } else {
        showToast(res.error || 'Erro ao criar instância.', 'danger');
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao criar instância.', 'danger');
    } finally {
      setCreating(false);
    }
  };

  // Restart Instance
  const handleRestart = async (name: string) => {
    showToast(`Reiniciando conexão da instância ${name}...`, 'info');
    const ok = await whatsappAdminService.restartInstance(name);
    if (ok) {
      showToast(`Instância ${name} reiniciada!`, 'success');
      loadData(true);
    } else {
      showToast('Falha ao reiniciar instância.', 'danger');
    }
  };

  // Logout Instance
  const handleLogout = async (name: string) => {
    if (!confirm(`Deseja realmente desconectar a sessão do WhatsApp da instância "${name}"?`)) return;
    const ok = await whatsappAdminService.logoutInstance(name);
    if (ok) {
      showToast(`Sessão desconectada da instância ${name}.`, 'warning');
      loadData();
    } else {
      showToast('Falha ao desconectar sessão.', 'danger');
    }
  };

  // Delete Instance
  const handleDelete = async (name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a instância "${name}"? Esta ação removerá a conexão da Evolution API.`)) return;
    const ok = await whatsappAdminService.deleteInstance(name);
    if (ok) {
      showToast(`Instância ${name} removida com sucesso.`, 'success');
      loadData();
    } else {
      showToast('Falha ao excluir instância.', 'danger');
    }
  };

  // Send Test Message
  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTargetPhone.trim() || !testMessage.trim()) {
      showToast('Preencha o número de destino e a mensagem de teste.', 'warning');
      return;
    }

    setSendingTest(true);
    try {
      const res = await whatsappAdminService.sendTestMessage(
        testTargetPhone.trim(),
        testMessage.trim(),
        testInstance || undefined
      );

      if (res.success) {
        showToast(res.message || 'Mensagem de teste enviada com sucesso!', 'success');
        setTestModalOpen(false);
      } else {
        showToast(res.message || 'Não foi possível entregar a mensagem.', 'warning');
      }
    } catch (err: any) {
      showToast(err.message || 'Falha ao enviar mensagem de teste.', 'danger');
    } finally {
      setSendingTest(false);
    }
  };

  // Copy Pairing Code
  const handleCopyPairing = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPairing(true);
    showToast('Código de pareamento copiado para a área de transferência!', 'info');
    setTimeout(() => setCopiedPairing(false), 3000);
  };

  // Run Automated Follow-Ups
  const handleRunAutomatedFollowUps = async () => {
    setRunningAutomated(true);
    showToast('Iniciando análise de comportamento e follow-ups automáticos...', 'info');
    try {
      const res = await whatsappAdminService.runAutomatedFollowUps();
      showToast(`Automação concluída: ${res.processed} leads analisados, ${res.sent} mensagens enviadas!`, 'success');
      loadCrmData(true);
    } catch (err: any) {
      showToast('Erro ao executar automação de follow-up.', 'danger');
    } finally {
      setRunningAutomated(false);
    }
  };

  // Trigger New Agent Council Meeting / Discussion
  const handleTriggerWarRoomMeeting = async () => {
    setRunningDiscussion(true);
    showToast('Convocando reunião de conselho dos agentes... analisando dados em tempo real!', 'info');
    try {
      const disc = await whatsappAdminService.triggerDiscussion(customTopic.trim() || undefined);
      showToast(`Conselho de Agentes reuniu-se com sucesso! Novo Plano de Ação gerado.`, 'success');
      setCustomTopic('');
      setActiveDiscussion(disc);
      await loadWarRoomData(true);
    } catch (err: any) {
      showToast(err.message || 'Erro ao convocar conselho de agentes.', 'danger');
    } finally {
      setRunningDiscussion(false);
    }
  };

  // Approve Action Plan
  const handleApprovePlan = async (planId: string) => {
    setApprovingPlan(true);
    try {
      const ok = await whatsappAdminService.approveActionPlan(planId);
      if (ok) {
        showToast('Plano de Ação aprovado com sucesso! Ações operacionais executadas.', 'success');
        await loadWarRoomData(true);
      } else {
        showToast('Erro ao aprovar plano de ação.', 'danger');
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao aprovar plano.', 'danger');
    } finally {
      setApprovingPlan(false);
    }
  };

  // Open Follow-up Modal for specific Lead
  const handleOpenFollowUpModal = (lead: FollowUpLead) => {
    setSelectedLead(lead);
    const firstName = lead.fullName?.split(' ')[0] || 'parceiro';
    let defaultTrigger = 'WELCOME_15M';
    let msg = `Olá ${firstName}! Tudo bem? Sou a Sofia da Nexora OS. Vi que você criou sua conta recentemente e queria te desejar boas-vindas. Se precisar de ajuda para configurar telas ou iniciar anúncios, estou à disposição aqui!`;

    if (lead.behaviorStatus === 'NO_DISPLAYS') {
      defaultTrigger = 'CART_RECOVERY';
      msg = `Oi ${firstName}, aqui é o Lucas da Nexora. Notei que você ainda não conectou sua primeira tela no painel. Quer que eu te envie o link do app para TV ou precisa de ajuda técnica?`;
    } else if (lead.behaviorStatus === 'ABANDONED_CAMPAIGN') {
      defaultTrigger = 'CART_RECOVERY';
      msg = `Oi ${firstName}, tudo bem? É o Lucas da Nexora. Vi que você iniciou o rascunho de uma campanha mas não finalizou. Ficou com alguma dúvida sobre o público ou locais? Posso te ajudar por aqui.`;
    } else if (lead.behaviorStatus === 'TRIAL_EXPIRING') {
      defaultTrigger = 'TRIAL_REMINDER';
      msg = `Olá ${firstName}, como vai? Aqui é a Clara da Nexora. Passando para lembrar que faltam 2 dias para o término do seu período de avaliação. Precisa de suporte com seu plano?`;
    } else if (lead.behaviorStatus === 'ACTIVE_DISPLAYS') {
      defaultTrigger = 'TIPS_DAY_2';
      msg = `Oi ${firstName}! É o Marcos da Nexora. Parabéns pelas telas ativas! Sabia que telas com fotos reais do ponto atraem 3x mais anunciantes? Se quiser dicas de otimização, só me avisar.`;
    }

    setSelectedTrigger(defaultTrigger);
    setCustomMessage(msg);
    setFollowUpModalOpen(true);
  };

  const handleTriggerChange = (trigger: string) => {
    setSelectedTrigger(trigger);
    if (!selectedLead) return;
    const firstName = selectedLead.fullName?.split(' ')[0] || 'parceiro';

    switch (trigger) {
      case 'WELCOME_15M':
        setCustomMessage(`Olá ${firstName}! Tudo bem? Sou a Sofia da Nexora OS. Vi que você criou sua conta recentemente e queria te desejar boas-vindas. Se precisar de ajuda para configurar telas ou iniciar anúncios, estou à disposição aqui!`);
        break;
      case 'TIPS_DAY_2':
        setCustomMessage(`Oi ${firstName}! É o Marcos da Nexora. Passando com uma dica rápida: anunciantes preferem pontos com fluxo comercial comprovado. Já atualizou as fotos e endereço das suas telas no painel?`);
        break;
      case 'CART_RECOVERY':
        setCustomMessage(`Oi ${firstName}, aqui é o Lucas da Nexora. Notei que você começou a configurar sua conta mas ainda não ativou sua primeira tela/campanha. Posso te dar uma força por aqui para colocar tudo no ar hoje?`);
        break;
      case 'TRIAL_REMINDER':
        setCustomMessage(`Olá ${firstName}, como vai? Aqui é a Clara da Nexora. Passando para lembrar que o seu teste gratuito encerra em breve. Quer agendar uma demonstração rápida com nossa equipe?`);
        break;
    }
  };

  const handleSendLeadFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    setSendingFollowUp(true);
    try {
      const res = await whatsappAdminService.sendFollowUp(
        selectedLead.userId,
        selectedTrigger,
        customMessage.trim() || undefined
      );

      if (res.success) {
        showToast(res.message || 'Mensagem humanizada enviada com sucesso!', 'success');
        setFollowUpModalOpen(false);
        loadCrmData(true);
      } else {
        showToast(res.message || 'Não foi possível entregar a mensagem.', 'warning');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro ao enviar follow-up.', 'danger');
    } finally {
      setSendingFollowUp(false);
    }
  };

  // 4 Primary Agents overview
  const agentRoles: { role: WhatsAppAgentRole; defaultName: string }[] = [
    { role: 'nexora_bot', defaultName: 'nexora-bot' },
    { role: 'billing', defaultName: 'nexora-cobrancas' },
    { role: 'marketing', defaultName: 'nexora-marketing' },
    { role: 'sales', defaultName: 'nexora-vendas' },
  ];

  // Helper to resolve an agent's assigned instance and online status
  const getAgentInstance = (role: WhatsAppAgentRole, defaultName: string) => {
    const boundName = bindings[role];
    if (boundName) {
      const found = instances.find((i) => i.name.toLowerCase() === boundName.toLowerCase());
      if (found) return found;
    }
    return (
      instances.find((i) => i.role === role && i.status === 'open') ||
      instances.find((i) => i.role === role) ||
      instances.find((i) => i.name.toLowerCase() === defaultName.toLowerCase()) ||
      instances.find((i) => i.name.toUpperCase() === 'NEXORA')
    );
  };

  // Filtered Leads
  const filteredLeads = leads.filter((lead) => {
    if (leadFilter !== 'ALL' && lead.behaviorStatus !== leadFilter) return false;
    if (leadSearch.trim()) {
      const q = leadSearch.toLowerCase();
      const matchName = lead.fullName?.toLowerCase().includes(q);
      const matchEmail = lead.email?.toLowerCase().includes(q);
      const matchPhone = lead.phone?.includes(q);
      const matchOrg = lead.orgName?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone && !matchOrg) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                WhatsApp Business & Inteligência Coletiva dos Agentes
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Conselho de agentes deliberando em tempo real, monitoramento da plataforma e CRM humanizado.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              loadData();
              if (activeTab === 'crm') loadCrmData();
              if (activeTab === 'war-room') loadWarRoomData();
            }}
            disabled={refreshing || leadsLoading || discussionsLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-sm font-medium transition-all text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing || leadsLoading || discussionsLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={() => setTestModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 text-sm font-medium transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Disparar Teste</span>
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Instância</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs (4 Tabs) */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('instances')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'instances'
              ? 'border-emerald-400 text-emerald-300 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Instâncias & Conexões ({instances.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'alerts'
              ? 'border-amber-400 text-amber-300 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4 text-amber-400" />
          <span>Alertas & Briefings do Admin</span>
          <span className="text-[10px] bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-200 px-2 py-0.5 rounded-full border border-amber-500/40 font-semibold">
            Tempo Real + 2x/dia
          </span>
        </button>

        <button
          onClick={() => setActiveTab('crm')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'crm'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Equipa de Agentes & CRM Follow-up ({leads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('war-room')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap relative ${
            activeTab === 'war-room'
              ? 'border-purple-400 text-purple-300 bg-purple-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
          <span>🎙️ Sala de Decisões dos Agentes (Em Tempo Real)</span>
          <span className="text-[10px] bg-gradient-to-r from-purple-500/30 to-cyan-500/30 text-purple-200 px-2 py-0.5 rounded-full border border-purple-500/40 font-semibold">
            Debate & Ação
          </span>
        </button>
      </div>

      {/* ── TAB 1: INSTÂNCIAS E AGENTES VINCULADOS ── */}
      {activeTab === 'instances' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Evolution API Gateway Connection Card */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Gateway & Servidor Evolution API
                  </h3>
                  <p className="text-xs text-slate-400">
                    Defina a rota do servidor Evolution API (Docker EasyPanel ou HTTPS público).
                  </p>
                </div>
              </div>

              {gatewayTestResult ? (
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    gatewayTestResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {gatewayTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{gatewayTestResult.message}</span>
                </div>
              ) : gatewayUrl ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-mono">
                  <span>Ativo: {gatewayUrl}</span>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  URL da Evolution API
                </label>
                <input
                  type="text"
                  value={gatewayUrl}
                  onChange={(e) => setGatewayUrl(e.target.value)}
                  placeholder="Ex: http://evolution-api:8080 ou https://evolution.dominio.com"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                />
                <p className="text-[10px] text-slate-500">
                  EasyPanel interno: <code className="text-cyan-400">http://evolution-api:8080</code>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Chave API (Global apikey)
                </label>
                <input
                  type="password"
                  value={gatewayApiKey}
                  onChange={(e) => setGatewayApiKey(e.target.value)}
                  placeholder="NEXORA_EVOLUTION_API_KEY_2026"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                />
                <p className="text-[10px] text-slate-500">
                  Chave global configurada na Evolution API
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Instância Padrão
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={gatewayInstance}
                    onChange={(e) => setGatewayInstance(e.target.value)}
                    placeholder="NEXORA"
                    className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                  />
                  <button
                    onClick={handleTestGateway}
                    disabled={gatewayTesting}
                    className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {gatewayTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>Testar</span>
                  </button>
                  <button
                    onClick={handleSaveGateway}
                    disabled={gatewaySaving}
                    className="px-3.5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {gatewaySaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Salvar</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Instância principal usada para disparos OTP
                </p>
              </div>
            </div>
          </div>
          {/* 4 Core Agents Overview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Bot className="w-4 h-4 text-cyan-400" />
                <span>Mapeamento dos 4 Agentes Oficiais (Pode usar o MESMO número para todos)</span>
              </h2>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Multi-Agente Flexível
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {agentRoles.map(({ role, defaultName }) => {
                const roleInfo = ROLE_LABELS[role];
                const matchedInst = getAgentInstance(role, defaultName);
                const isOnline = matchedInst?.status === 'open';
                const isConnecting = matchedInst?.status === 'connecting';
                const boundValue = bindings[role] || (matchedInst?.name || '');

                return (
                  <div
                    key={role}
                    className={`relative rounded-2xl bg-slate-900/90 border p-5 flex flex-col justify-between transition-all shadow-lg overflow-hidden group ${
                      isOnline
                        ? 'border-emerald-500/40 ring-1 ring-emerald-500/20'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md">
                          {roleInfo.category}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isOnline
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isConnecting
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isOnline ? 'bg-emerald-400 animate-pulse' : isConnecting ? 'bg-amber-400' : 'bg-rose-400'
                            }`}
                          />
                          {isOnline ? 'ONLINE' : isConnecting ? 'AGUARDANDO QR' : 'OFFLINE'}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                          {role === 'nexora_bot' && <Bot className="w-5 h-5 text-emerald-400" />}
                          {role === 'billing' && <DollarSign className="w-5 h-5 text-amber-400" />}
                          {role === 'marketing' && <Megaphone className="w-5 h-5 text-purple-400" />}
                          {role === 'sales' && <Briefcase className="w-5 h-5 text-cyan-400" />}
                          {roleInfo.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{roleInfo.description}</p>
                      </div>
                    </div>

                    <div className="space-y-3 mt-4 pt-4 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-slate-500 block">Número Ativo:</span>
                          <span className="font-mono text-slate-200 font-medium">
                            {matchedInst?.phone ? `+${matchedInst.phone}` : 'Não conectado'}
                          </span>
                        </div>

                        {matchedInst && (
                          <button
                            onClick={() => handleOpenConnect(matchedInst.name)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              isOnline
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>{isOnline ? 'Ver Conexão' : 'Conectar'}</span>
                          </button>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-800/50">
                        <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                          Vincular ao Número/Instância:
                        </label>
                        <select
                          value={boundValue}
                          onChange={(e) => handleBindAgent(role, e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700/80 hover:border-slate-600 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-500 transition-colors"
                        >
                          <option value="">-- Automático / Padrão --</option>
                          {instances.map((inst) => (
                            <option key={inst.name} value={inst.name}>
                              {inst.name} {inst.status === 'open' ? '🟢 Online' : '⚪ Offline'} {inst.phone ? `(+${inst.phone})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instances Real-Time Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <span>Instâncias Registadas ({instances.length})</span>
              </h2>
              <span className="text-xs text-slate-400">Verificação em tempo real com Evolution API</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-400 mb-3" />
                <p className="text-sm">Consultando instâncias na Evolution API...</p>
              </div>
            ) : instances.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800 space-y-4">
                <MessageSquare className="w-12 h-12 text-slate-600 mx-auto" />
                <div className="max-w-md mx-auto">
                  <h3 className="font-semibold text-slate-300">Nenhuma instância cadastrada</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Crie a sua primeira instância para conectar o WhatsApp da sua empresa.
                  </p>
                </div>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Instância</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...instances]
                  .sort((a, b) => {
                    if (a.status === 'open' && b.status !== 'open') return -1;
                    if (b.status === 'open' && a.status !== 'open') return 1;
                    return a.name.localeCompare(b.name);
                  })
                  .map((inst) => {
                    const isOnline = inst.status === 'open';
                    const isConnecting = inst.status === 'connecting';

                    return (
                      <div
                        key={inst.id || inst.name}
                        className={`rounded-2xl bg-slate-900/80 border p-5 space-y-4 shadow-xl transition-all relative overflow-hidden ${
                          isOnline
                            ? 'border-emerald-500/50 ring-1 ring-emerald-500/20 shadow-emerald-500/5'
                            : 'border-slate-800 hover:border-slate-700/80'
                        }`}
                      >
                        <div
                          className={`absolute top-0 left-0 right-0 h-1 ${
                            isOnline ? 'bg-emerald-500' : isConnecting ? 'bg-amber-500' : 'bg-slate-700'
                          }`}
                        />

                        {/* Top info */}
                        <div className="flex items-start justify-between gap-3 pt-1">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-sm overflow-hidden">
                              {inst.profile_pic_url ? (
                                <img src={inst.profile_pic_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Bot className="w-6 h-6 text-emerald-400" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                                <span>{inst.profile_name || inst.name}</span>
                              </h4>
                              <span className="text-[11px] font-mono text-slate-400">{inst.name}</span>
                            </div>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                              isOnline
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : isConnecting
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isOnline ? 'bg-emerald-400 animate-pulse' : isConnecting ? 'bg-amber-400' : 'bg-slate-500'
                              }`}
                            />
                            {isOnline ? 'ONLINE' : isConnecting ? 'CONECTANDO' : 'DESCONECTADO'}
                          </span>
                        </div>

                        {/* Phone & Status Details */}
                        <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">WhatsApp Conectado:</span>
                            <span className="font-mono text-slate-200 font-semibold">
                              {inst.phone ? `+${inst.phone}` : 'Nenhum número pareado'}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800/70">
                          <button
                            onClick={() => handleOpenConnect(inst.name)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>{isOnline ? 'Status / Reconectar' : 'Conectar QR/Código'}</span>
                          </button>

                          <button
                            onClick={() => handleRestart(inst.name)}
                            title="Reiniciar Sessão"
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          {isOnline && (
                            <button
                              onClick={() => handleLogout(inst.name)}
                              title="Desconectar Sessão (Logout)"
                              className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all"
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(inst.name)}
                            title="Excluir Instância"
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: ALERTAS & BRIEFINGS DO ADMIN (TEMPO REAL + 2X AO DIA) ── */}
      {activeTab === 'alerts' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Header Card */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 p-6 rounded-3xl border border-amber-500/30 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Bell className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">Central de Alertas em Tempo Real & Briefings Diários</h2>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Mantenha controle total do ecossistema Nexora OS. O conselho de agentes envia alertas instantâneos no seu WhatsApp para qualquer evento crítico e dispara 2 relatórios executivos diários (08h00 e 18h00).
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-amber-300 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Horários Oficiais de Briefing: <strong>08:00 (Plano do Dia)</strong> e <strong>18:00 (Balanço de Fecho)</strong></span>
              </div>
            </div>

            <button
              onClick={() => loadAdminConfig()}
              disabled={loadingAdminConfig}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer self-start md:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAdminConfig ? 'animate-spin text-amber-400' : ''}`} />
              <span>Recarregar Configurações</span>
            </button>
          </div>

          {/* Configuração do Destino do WhatsApp do Admin */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-400" />
                  <span>Número de WhatsApp do Administrador</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Número oficial onde você (Super Admin) receberá todas as mensagens e briefings automatizados.
                </p>
              </div>

              {adminPhone ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Configurado: {adminPhone}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Pendente de Configuração</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span>Número de Telefone com Código do País (Ex: Angola +244)</span>
                  <span className="text-[11px] text-slate-500 font-normal">Ex: 244962624535 ou +244 962 624 535</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-medium text-sm">
                    📱
                  </div>
                  <input
                    type="text"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    placeholder="244962624535"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveAdminConfig}
                  disabled={savingAdminConfig}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingAdminConfig ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Salvar Número</span>
                </button>

                <button
                  onClick={handleSendAdminTest}
                  disabled={sendingAdminTest || !adminPhone.trim()}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 hover:text-amber-200 font-bold text-xs transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  {sendingAdminTest ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Testar Alerta</span>
                </button>
              </div>
            </div>
          </div>

          {/* Eventos Críticos em Tempo Real */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  <span>Notificações Críticas em Tempo Real (Disparadas no WhatsApp)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Selecione quais eventos da rede devem enviar uma mensagem imediata para o seu WhatsApp.
                </p>
              </div>
              <span className="text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full font-semibold">
                Tempo Real (Zero Delay)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1. Novo Usuário */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-3 hover:border-slate-700 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Novo Usuário Registrado</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Nome, e-mail, telefone, organização e perfil (anunciante, parceiro, afiliado) no ato do cadastro.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={adminSettings.notifyNewUser}
                  onChange={(e) => setAdminSettings({ ...adminSettings, notifyNewUser: e.target.checked })}
                  className="mt-1 w-5 h-5 rounded accent-amber-500 cursor-pointer"
                />
              </div>

              {/* 2. Novo Plano Subscrito */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-3 hover:border-slate-700 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <DollarSign className="w-4 h-4 text-cyan-400" />
                    <span>Novo Plano Subscrito / Upgrade</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Notifica quando um cliente assina ou renova um plano SaaS de telas, com valor e modalidade.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={adminSettings.notifyNewSubscription}
                  onChange={(e) => setAdminSettings({ ...adminSettings, notifyNewSubscription: e.target.checked })}
                  className="mt-1 w-5 h-5 rounded accent-amber-500 cursor-pointer"
                />
              </div>

              {/* 3. Nova Campanha Criada */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-3 hover:border-slate-700 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <Megaphone className="w-4 h-4 text-purple-400" />
                    <span>Nova Campanha Criada</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Alerta instantâneo para aprovação de anúncios submetidos por anunciantes com orçamento e displays.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={adminSettings.notifyNewCampaign}
                  onChange={(e) => setAdminSettings({ ...adminSettings, notifyNewCampaign: e.target.checked })}
                  className="mt-1 w-5 h-5 rounded accent-amber-500 cursor-pointer"
                />
              </div>

              {/* 4. Novos Pagamentos / Comprovativos */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-3 hover:border-slate-700 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Pagamentos & Comprovativos</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Notifica envio de comprovativos bancários ou pagamentos confirmados na plataforma para liberação.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={adminSettings.notifyPaymentReceived}
                  onChange={(e) => setAdminSettings({ ...adminSettings, notifyPaymentReceived: e.target.checked })}
                  className="mt-1 w-5 h-5 rounded accent-amber-500 cursor-pointer"
                />
              </div>

              {/* 5. Falhas de Conexão (Displays Offline / Online) */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-3 hover:border-slate-700 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <Activity className="w-4 h-4 text-rose-400" />
                    <span>Falhas de Telas (Offline & Online)</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Alerta com causa técnica detalhada quando qualquer display cair ou se reconectar à rede.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={adminSettings.notifyDisplayStatus}
                  onChange={(e) => setAdminSettings({ ...adminSettings, notifyDisplayStatus: e.target.checked })}
                  className="mt-1 w-5 h-5 rounded accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Save changes helper card */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="text-amber-300 font-bold text-xs uppercase tracking-wider">
                    Atualização em Tempo Real
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Clique abaixo para salvar suas preferências de alertas críticos do Administrador.
                  </p>
                </div>
                <button
                  onClick={handleSaveAdminConfig}
                  disabled={savingAdminConfig}
                  className="mt-3 w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {savingAdminConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Salvar Preferências</span>
                </button>
              </div>
            </div>
          </div>

          {/* Relatórios Diários de Briefing (2 Vezes ao Dia) */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span>Relatórios Diários de Inteligência Executiva (2x por Dia no WhatsApp)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Receba um relatório estratégico no início da manhã e um fechamento consolidado no final do dia.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Manhã: 08h00 */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-950 border border-amber-500/30 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Sun className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-base flex items-center gap-2">
                        <span>Briefing Matinal — 08:00</span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
                          Plano do Dia
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Enviado pontualmente às 08h00 com o plano estratégico do dia.
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={adminSettings.dailyBriefMorning}
                    onChange={(e) => setAdminSettings({ ...adminSettings, dailyBriefMorning: e.target.checked })}
                    className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>Conteúdo do Briefing Matinal:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400">
                    <li>Total de displays ativos e online na rede nacional.</li>
                    <li>Campanhas publicitárias ativas e faturamento previsto do dia.</li>
                    <li>Novos clientes em onboarding e leads prioritários para contato.</li>
                    <li>Diretrizes de ação recomendadas pelo Conselho de Agentes de IA.</li>
                  </ul>
                </div>

                <button
                  onClick={() => handleTriggerBriefing('morning')}
                  disabled={triggeringMorning}
                  className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className={`w-3.5 h-3.5 ${triggeringMorning ? 'animate-spin' : ''}`} />
                  <span>{triggeringMorning ? 'Gerando e Enviando...' : 'Testar Briefing da Manhã Agora (08h)'}</span>
                </button>
              </div>

              {/* Tarde: 18h00 */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-slate-950 to-slate-950 border border-indigo-500/30 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      <Moon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-base flex items-center gap-2">
                        <span>Fecho Vespertino — 18:00</span>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-semibold">
                          Balanço do Dia
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Enviado pontualmente às 18h00 com o consolidado da plataforma.
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={adminSettings.dailyBriefEvening}
                    onChange={(e) => setAdminSettings({ ...adminSettings, dailyBriefEvening: e.target.checked })}
                    className="w-5 h-5 rounded accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
                  <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Conteúdo do Balanço de Fecho:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400">
                    <li>Novos usuários cadastrados e assinaturas fechadas hoje.</li>
                    <li>Volume total de impressões e horas de exibição entregues.</li>
                    <li>Status de estabilidade da rede e incidentes resolvidos.</li>
                    <li>Receita total do dia e faturas pendentes de liquidação.</li>
                  </ul>
                </div>

                <button
                  onClick={() => handleTriggerBriefing('evening')}
                  disabled={triggeringEvening}
                  className="w-full py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 hover:text-indigo-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className={`w-3.5 h-3.5 ${triggeringEvening ? 'animate-spin' : ''}`} />
                  <span>{triggeringEvening ? 'Gerando e Enviando...' : 'Testar Balanço da Tarde Agora (18h)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: CRM FOLLOW-UP & EQUIPA DEDICADA ── */}
      {activeTab === 'crm' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Header Action & Presentation */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-6 rounded-3xl border border-slate-800 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold text-white">Equipa Inteligente de Relacionamento & Follow-Up</h2>
              </div>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                Mensagens humanas, naturais e pontuais enviadas com base nas ações reais de cada usuário na plataforma (telas conectadas, rascunhos de campanhas, período de avaliação e dicas de sucesso).
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-cyan-300 font-medium">
                <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Rotina Automática Diária: <strong>08:00</strong> e <strong>18:00</strong> (ou sob demanda pelo botão ao lado)</span>
              </div>
            </div>

            <button
              onClick={handleRunAutomatedFollowUps}
              disabled={runningAutomated}
              className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <Zap className={`w-4 h-4 ${runningAutomated ? 'animate-bounce text-amber-300' : ''}`} />
              <span>{runningAutomated ? 'Processando Leads...' : 'Executar Automação Agora'}</span>
            </button>
          </div>

          {/* 4 Dedicated Specialized Agents Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Sofia */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  15 min pós-cadastro
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Sofia — Boas-Vindas & Acolhimento</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Saúda o novo usuário pelo primeiro nome, tira dúvidas iniciais e coloca-se à disposição de forma humana e leve.
                </p>
              </div>
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 italic">
                "Olá João! Sou a Sofia da Nexora. Vi que acabou de criar sua conta e queria te desejar boas-vindas..."
              </div>
            </div>

            {/* 2. Marcos */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full">
                  Dicas do 2º Dia
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Marcos — Dicas & Crescimento</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Envia dicas práticas específicas para o perfil (Dono de Telas, Anunciante ou Afiliado) para acelerar resultados.
                </p>
              </div>
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 italic">
                "Oi Ana! Sabia que telas com fotos reais do ponto atraem 3x mais anunciantes? Dica rápida de sucesso..."
              </div>
            </div>

            {/* 3. Lucas */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                  Recuperação
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Lucas — Recuperação & Telas</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Detecta se o usuário não cadastrou telas em 24h ou deixou campanhas em rascunho, e oferece ajuda amigável.
                </p>
              </div>
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 italic">
                "Oi Carlos, aqui é o Lucas. Vi que ainda não conectou sua tela. Quer que eu te envie o link do app para TV?"
              </div>
            </div>

            {/* 4. Clara */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-purple-500/30 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full">
                  Retenção & Trial
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Clara — Lembretes & Prazos</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Lembra com 2 dias de antecedência o término dos 15 dias de teste grátis, esclarecendo planos e suporte.
                </p>
              </div>
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 italic">
                "Olá Maria! Faltam apenas 2 dias para encerrar seu teste na Nexora. Gostaria de tirar dúvidas com nosso time?"
              </div>
            </div>
          </div>

          {/* CRM Leads Filter & Table */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setLeadFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    leadFilter === 'ALL'
                      ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Todos ({leads.length})
                </button>
                <button
                  onClick={() => setLeadFilter('NO_DISPLAYS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    leadFilter === 'NO_DISPLAYS'
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  ⚠️ Sem Telas Cadastradas
                </button>
                <button
                  onClick={() => setLeadFilter('ABANDONED_CAMPAIGN')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    leadFilter === 'ABANDONED_CAMPAIGN'
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  🛒 Rascunhos Parados
                </button>
                <button
                  onClick={() => setLeadFilter('NEW')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    leadFilter === 'NEW'
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  🌟 Novos Registros
                </button>
                <button
                  onClick={() => setLeadFilter('TRIAL_EXPIRING')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    leadFilter === 'TRIAL_EXPIRING'
                      ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  ⏳ Avaliação a Expirar
                </button>
              </div>

              {/* Search */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar lead por nome, telefone, email..."
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Leads Table */}
            {leadsLoading ? (
              <div className="p-12 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-3" />
                <p className="text-sm">Carregando leads registrados e dados de comportamento...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800 space-y-2">
                <Users className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="font-semibold text-slate-300">Nenhum lead encontrado</h4>
                <p className="text-xs text-slate-500">
                  {leadSearch ? 'Tente alterar os termos da busca.' : 'Ainda não há registros nesta categoria.'}
                </p>
              </div>
            ) : (
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4">Lead / Usuário</th>
                        <th className="py-3.5 px-4">WhatsApp</th>
                        <th className="py-3.5 px-4">Status de Atividade</th>
                        <th className="py-3.5 px-4">Telas / Campanhas</th>
                        <th className="py-3.5 px-4">Último Contato</th>
                        <th className="py-3.5 px-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredLeads.map((lead) => {
                        const hasPhone = Boolean(lead.phone);
                        const cleanPhone = lead.phone ? lead.phone.replace(/\D/g, '') : '';

                        return (
                          <tr key={lead.userId} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-100">{lead.fullName}</div>
                              <div className="text-[11px] text-slate-400">{lead.email}</div>
                              {lead.orgName && (
                                <div className="text-[10px] text-cyan-400/80 font-mono mt-0.5">
                                  {lead.orgName} ({lead.orgType})
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              {hasPhone ? (
                                <a
                                  href={`https://wa.me/${cleanPhone}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                                >
                                  <span>+{cleanPhone}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-slate-500 italic">Sem WhatsApp cadastrado</span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              {lead.behaviorStatus === 'NO_DISPLAYS' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  <AlertTriangle className="w-3 h-3" /> Sem Telas (24h+)
                                </span>
                              )}
                              {lead.behaviorStatus === 'ABANDONED_CAMPAIGN' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  <ShoppingCart className="w-3 h-3" /> Rascunho Parado
                                </span>
                              )}
                              {lead.behaviorStatus === 'NEW' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  <Sparkles className="w-3 h-3" /> Novo Cadastro
                                </span>
                              )}
                              {lead.behaviorStatus === 'TRIAL_EXPIRING' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  <Clock className="w-3 h-3" /> Avaliação a Expirar
                                </span>
                              )}
                              {lead.behaviorStatus === 'ACTIVE_DISPLAYS' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                  <CheckCircle2 className="w-3 h-3" /> Telas Ativas
                                </span>
                              )}
                              {lead.behaviorStatus === 'REGULAR' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                  Ativo
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-200">{lead.displaysCount} Telas</span>
                              <span className="text-slate-500 block text-[11px]">{lead.campaignsCount} Campanhas</span>
                            </td>

                            <td className="py-3 px-4">
                              {lead.lastFollowUp ? (
                                <div>
                                  <span className="font-semibold text-slate-300 block">{lead.lastFollowUp.agentName}</span>
                                  <span className="text-[10px] text-slate-500">
                                    {new Date(lead.lastFollowUp.sentAt).toLocaleDateString('pt-PT', {
                                      day: '2-digit',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-500 italic">Nunca contactado</span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleOpenFollowUpModal(lead)}
                                disabled={!hasPhone}
                                className={`px-3 py-1.5 rounded-xl font-semibold text-xs inline-flex items-center gap-1.5 transition-all ${
                                  hasPhone
                                    ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                    : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-800'
                                }`}
                              >
                                <Send className="w-3 h-3" />
                                <span>Mensagem</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Follow-up Logs / History */}
          {followUpLogs.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Histórico de Mensagens Enviadas pela Equipa ({followUpLogs.length})</span>
              </h3>

              <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
                  {followUpLogs.map((log) => (
                    <div key={log.id} className="p-3.5 flex items-start justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{log.leadName}</span>
                          <span className="font-mono text-slate-400 text-[11px]">+{log.phone}</span>
                          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-cyan-300 font-semibold">
                            {log.agentName}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed max-w-2xl bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                          {log.message}
                        </p>
                      </div>

                      <div className="text-right whitespace-nowrap text-slate-500 text-[11px]">
                        <div>
                          {new Date(log.createdAt).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <span className="text-emerald-400 font-semibold inline-flex items-center gap-1 mt-0.5">
                          <CheckCheck className="w-3 h-3" /> Enviada
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: SALA DE DECISÕES DOS AGENTES (EM TEMPO REAL) ── */}
      {activeTab === 'war-room' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* War Room Header & Trigger */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-purple-950/30 to-slate-900 p-6 rounded-3xl border border-purple-500/30 shadow-2xl relative overflow-hidden">
            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30">
                  <Radio className="w-5 h-5 animate-pulse text-purple-400" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  Conselho Coletivo de Decisões dos Agentes Nexora IA
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  SALA ATIVA 🟢
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                Os agentes comunicam entre si em tempo real para cruzar dados de telas offline, novos leads sem ativação, rascunhos de campanhas e risco de cancelamento. Eles debatem, chegam a consenso unânime e apresentam um <strong>Plano de Ação Estratégico</strong> consolidado.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-purple-300 font-medium">
                <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Reunião e Deliberação Automática: <strong>08:00</strong> e <strong>18:00</strong> todos os dias (ou sob demanda pelo botão ao lado)</span>
              </div>
            </div>

            {/* Quick Trigger Form */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 relative z-10 min-w-[320px]">
              <input
                type="text"
                placeholder="Tema ou situação personalizada (opcional)..."
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="bg-slate-950/80 border border-purple-500/40 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400 flex-1"
              />
              <button
                onClick={handleTriggerWarRoomMeeting}
                disabled={runningDiscussion}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                {runningDiscussion ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                ) : (
                  <Mic className="w-4 h-4 text-purple-200" />
                )}
                <span>{runningDiscussion ? 'Agentes Deliberando...' : 'Reunir Agentes Agora'}</span>
              </button>
            </div>
          </div>

          {/* Active Discussion Session & Plan */}
          {discussionsLoading ? (
            <div className="p-16 text-center text-slate-400 bg-slate-900/50 rounded-3xl border border-slate-800 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-400" />
              <p className="text-sm font-medium">Sintonizando o canal de comunicação entre os agentes...</p>
            </div>
          ) : !activeDiscussion ? (
            <div className="p-16 text-center bg-slate-900/50 rounded-3xl border border-slate-800 space-y-4">
              <Bot className="w-12 h-12 text-slate-600 mx-auto" />
              <div>
                <h3 className="font-bold text-slate-200 text-base">Nenhuma reunião recente registrada</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Clique no botão acima para iniciar a primeira deliberação coletiva dos agentes.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Live Dialogue Stream (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
                      {activeDiscussion.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span>{activeDiscussion.topic}</span>
                    </h3>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      activeDiscussion.priority === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : activeDiscussion.priority === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}
                  >
                    Prioridade {activeDiscussion.priority}
                  </span>
                </div>

                {/* Speech Stream / Dialogue Cards */}
                <div className="space-y-3 bg-slate-900/60 p-4 rounded-3xl border border-slate-800/80 max-h-[640px] overflow-y-auto">
                  {activeDiscussion.messages.map((msg, idx) => {
                    const isCore = msg.agentName.includes('Core');
                    const isLucas = msg.agentName.includes('Lucas');
                    const isSofia = msg.agentName.includes('Sofia');
                    const isMarcos = msg.agentName.includes('Marcos');
                    const isClara = msg.agentName.includes('Clara');

                    const badgeColor = isCore
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : isSofia
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : isLucas
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : isMarcos
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40';

                    return (
                      <div
                        key={msg.id || idx}
                        className={`p-4 rounded-2xl border transition-all space-y-2 ${
                          isCore
                            ? 'bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border-purple-500/40'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700/80'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white">
                              {isCore ? '⚡' : msg.agentName[0]}
                            </div>
                            <div>
                              <span className="font-bold text-slate-100 mr-2">{msg.agentName}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${badgeColor}`}>
                                {msg.agentRole}
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono text-slate-500">
                            {new Date(msg.createdAt).toLocaleTimeString('pt-PT', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed pl-9">
                          {msg.message}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Consolidated Action Plan (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                {activeDiscussion.actionPlan ? (
                  <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-6 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-5">
                    {/* Plan Top Header */}
                    <div className="space-y-1 border-b border-slate-800 pb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5" />
                          <span>Plano de Ação Estratégico</span>
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            activeDiscussion.actionPlan.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {activeDiscussion.actionPlan.status === 'APPROVED' ? '✓ Aprovado' : 'Aguardando Aprovação'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white pt-1">
                        {activeDiscussion.actionPlan.title}
                      </h3>
                    </div>

                    {/* Diagnosis */}
                    <div className="space-y-1.5 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-xs">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Diagnóstico Unânime dos Agentes:
                      </span>
                      <p className="text-slate-300 leading-relaxed">
                        {activeDiscussion.actionPlan.diagnosis}
                      </p>
                    </div>

                    {/* Decisions Made by the Team */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-300 block">
                        Decisões Consensuais da Equipa:
                      </span>
                      <div className="space-y-1.5">
                        {activeDiscussion.actionPlan.decisions.map((dec, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{dec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions Taken / In Progress */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <span className="text-xs font-bold text-slate-300 block">
                        Ações Executadas Automaticamente:
                      </span>
                      <div className="space-y-2">
                        {activeDiscussion.actionPlan.actionsTaken.map((act, i) => (
                          <div
                            key={i}
                            className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div className="space-y-0.5">
                              <span className="font-semibold text-slate-200 block">{act.action}</span>
                              <span className="text-[11px] text-slate-500">
                                Alvo: {act.target} • Agente: <strong className="text-cyan-400">{act.agent}</strong>
                              </span>
                            </div>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-bold">
                              {act.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendations for Administrator */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <span className="text-xs font-bold text-slate-300 block">
                        Recomendações Práticas para o Administrador:
                      </span>
                      <div className="space-y-2">
                        {activeDiscussion.actionPlan.adminRecommendations.map((rec) => (
                          <div
                            key={rec.id}
                            className="bg-purple-950/30 p-3 rounded-xl border border-purple-500/20 space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-purple-200">{rec.action}</span>
                              <span className="text-[10px] text-slate-400 font-mono">Por {rec.suggestedBy}</span>
                            </div>
                            <p className="text-[11px] text-slate-400">{rec.impact}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Approval Button */}
                    <div className="pt-2">
                      <button
                        onClick={() => activeDiscussion.actionPlan && handleApprovePlan(activeDiscussion.actionPlan.id)}
                        disabled={approvingPlan || activeDiscussion.actionPlan.status === 'APPROVED'}
                        className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                          activeDiscussion.actionPlan.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                            : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-emerald-500/20 cursor-pointer'
                        }`}
                      >
                        {approvingPlan ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <ThumbsUp className="w-4 h-4" />
                        )}
                        <span>
                          {activeDiscussion.actionPlan.status === 'APPROVED'
                            ? '✓ Plano Aprovado & Executado com Sucesso'
                            : 'Aprovar & Confirmar Plano de Ação'}
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-900 rounded-3xl border border-slate-800 text-slate-500 text-xs">
                    Plano de ação em processamento pelos agentes...
                  </div>
                )}

                {/* Session History Picker */}
                {discussions.length > 1 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Outras Sessões de Deliberação Recentes:
                    </span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {discussions.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => setActiveDiscussion(d)}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                            activeDiscussion.id === d.id
                              ? 'bg-purple-500/20 border-purple-500/50 text-purple-200'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="truncate max-w-[240px] font-medium">{d.topic}</span>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            {new Date(d.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL 1: CONECTAR INSTÂNCIA (QR CODE + NÚMERO / PAIRING CODE) ── */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md p-6 shadow-2xl relative space-y-5 text-center">
            <button
              onClick={handleCloseQr}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition-all"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 mb-2">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Conectar WhatsApp Business</h3>
              <p className="text-xs text-slate-400">
                Instância: <span className="font-mono text-cyan-400 font-semibold">{selectedInstanceName}</span>
              </p>
            </div>

            {/* Check if already connected */}
            {qrData?.status === 'already_connected' ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-emerald-300 text-sm">Instância Conectada e Ativa!</h4>
                <p className="text-xs text-slate-300">
                  Esta sessão do WhatsApp já está autenticada na Evolution API e pronta para disparos e recebimento de mensagens.
                </p>
                {phoneInput && (
                  <div className="font-mono text-xs text-emerald-400 bg-emerald-950/60 py-1.5 px-3 rounded-lg border border-emerald-500/20 inline-block">
                    +{phoneInput}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Phone number input to request pairing code or tailored QR */}
                <div className="space-y-2 text-left bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Número do Celular (com DDI do país):</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ex: 244962624535 ou 5511999999999"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleGeneratePairingOrQr}
                      disabled={qrLoading}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      {qrLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>Gerar</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Opcional: preencha para gerar Código de Pareamento de 8 dígitos para parear direto sem câmera.
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="bg-white p-4 rounded-2xl shadow-inner mx-auto w-64 h-64 flex items-center justify-center relative overflow-hidden">
                  {qrLoading ? (
                    <div className="flex flex-col items-center gap-2 text-slate-800">
                      <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                      <span className="text-xs font-semibold">Carregando QR Code...</span>
                    </div>
                  ) : qrData?.base64 ? (
                    <img
                      src={
                        qrData.base64.startsWith('data:')
                          ? qrData.base64
                          : `data:image/png;base64,${qrData.base64}`
                      }
                      alt="QR Code WhatsApp"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-600 p-4 text-center">
                      <AlertTriangle className="w-8 h-8 text-amber-500" />
                      <span className="text-xs font-semibold">
                        {qrData?.message || 'Aguardando sincronização do WhatsApp...'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Pairing Code alternative if returned */}
                {qrData?.pairingCode && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div className="text-left">
                      <span className="text-slate-400 block text-[10px]">Código de Pareamento (Telefone):</span>
                      <span className="font-mono font-bold text-cyan-300 text-base tracking-widest">{qrData.pairingCode}</span>
                    </div>
                    <button
                      onClick={() => handleCopyPairing(qrData.pairingCode!)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 font-semibold transition-all"
                    >
                      {copiedPairing ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPairing ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                )}

                {/* Instruction steps */}
                <div className="text-left text-xs text-slate-300 bg-slate-950/70 p-4 rounded-xl border border-slate-800/70 space-y-1.5">
                  <p className="font-semibold text-slate-200">Como conectar:</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400">
                    <li>Abra o WhatsApp no seu smartphone</li>
                    <li>Toque em <strong className="text-slate-200">Aparelhos Conectados</strong></li>
                    <li>Toque em <strong className="text-slate-200">Conectar um Aparelho</strong></li>
                    <li>Aponte a câmera para o QR Code acima</li>
                  </ol>
                </div>
              </>
            )}

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleGeneratePairingOrQr}
                disabled={qrLoading}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Atualizar</span>
              </button>
              <button
                onClick={handleCloseQr}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition-all"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ASSOCIAR NOVO NÚMERO / INSTÂNCIA ── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md p-6 shadow-2xl relative space-y-5">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition-all"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Criar Nova Instância WhatsApp</h3>
                <p className="text-xs text-slate-400">Configurada automaticamente na Evolution API</p>
              </div>
            </div>

            <form onSubmit={handleCreateInstance} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Identificador da Instância (Slug) *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: vendas-luanda, cobranca-suporte"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[11px] text-slate-500">Sem espaços nem caracteres especiais.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Papel Inicial do Agente</label>
                <select
                  value={newInstanceRole}
                  onChange={(e) => setNewInstanceRole(e.target.value as WhatsAppAgentRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="custom">⚙️ Instância Adicional / Flexível</option>
                  <option value="sales">💼 Agente de Vendas WhatsApp</option>
                  <option value="billing">💳 Cobranças & Faturamento</option>
                  <option value="marketing">📢 Campanhas & Marketing</option>
                  <option value="nexora_bot">🤖 Nexora Bot (Central & OTP)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Nome de Apresentação (Perfil)</label>
                <input
                  type="text"
                  placeholder="ex: Nexora Comercial — Luanda"
                  value={newInstanceProfile}
                  onChange={(e) => setNewInstanceProfile(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2"
                >
                  {creating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Criar & Conectar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: DISPARAR MENSAGEM DE TESTE ── */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md p-6 shadow-2xl relative space-y-5">
            <button
              onClick={() => setTestModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition-all"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Disparar Mensagem de Teste</h3>
                <p className="text-xs text-slate-400">Valide a entrega imediata via Evolution API</p>
              </div>
            </div>

            <form onSubmit={handleSendTestMessage} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Instância Emissora</label>
                <select
                  value={testInstance}
                  onChange={(e) => setTestInstance(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Instância Padrão do Sistema (NEXORA)</option>
                  {instances.map((i) => (
                    <option key={i.name} value={i.name}>
                      {i.profile_name || i.name} ({i.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Número de Destino (WhatsApp) *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: 244962624535"
                  value={testTargetPhone}
                  onChange={(e) => setTestTargetPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Mensagem *</label>
                <textarea
                  required
                  rows={3}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setTestModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sendingTest}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2"
                >
                  {sendingTest && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Enviar Mensagem Agora</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: ENVIAR FOLLOW-UP PERSONALIZADO AO LEAD ── */}
      {followUpModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative space-y-5">
            <button
              onClick={() => setFollowUpModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition-all"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Enviar Mensagem Humanizada</h3>
                <p className="text-xs text-slate-400">
                  Lead: <strong className="text-slate-200">{selectedLead.fullName}</strong> (+{selectedLead.phone})
                </p>
              </div>
            </div>

            <form onSubmit={handleSendLeadFollowUp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Agente Emissor & Tipo de Contato</label>
                <select
                  value={selectedTrigger}
                  onChange={(e) => handleTriggerChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="WELCOME_15M">Sofia (Boas-Vindas & Acolhimento)</option>
                  <option value="TIPS_DAY_2">Marcos (Dicas Práticas de Sucesso)</option>
                  <option value="CART_RECOVERY">Lucas (Recuperação de Telas / Campanhas)</option>
                  <option value="TRIAL_REMINDER">Clara (Lembrete de Avaliação & Planos)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Mensagem (Pode editar livremente antes de enviar):
                </label>
                <textarea
                  required
                  rows={4}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 leading-relaxed resize-none"
                />
                <p className="text-[10px] text-slate-500">
                  Tom amigável, direto e prestativo. Mensagens curtas geram 4x mais resposta no WhatsApp.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFollowUpModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sendingFollowUp}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2"
                >
                  {sendingFollowUp && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Enviar via WhatsApp Agora</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
