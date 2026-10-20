import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/Toast';
import { studioService } from '../../../services/studioService';
import { useSession } from '../../../context/SessionContext';
import { useBgGeneration } from '../../../context/BackgroundGenerationContext';
import { AIGenerationJob } from '../../../types/studio';
import {
  Sparkles,
  Loader2,
  Check,
  ChevronRight,
  Download,
  X,
  Upload,
  Image as ImageIcon,
  RefreshCw,
  AlertTriangle,
  ArrowUp,
  Paperclip,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Utensils,
  Wine,
  ShoppingCart,
  Shirt,
  Cpu,
  Dumbbell,
  Car,
  Building2,
  Gem,
  Video,
  Layers,
  Eye,
  Maximize2,
  Zap,
  FolderHeart,
  Plus,
  MessageSquare,
  Copy,
  PanelLeftClose,
  PanelLeft,
  Pencil,
  Coins,
} from 'lucide-react';

import { CREATIVE_AGENTS_DEFINITIONS, AgentDefinition } from '../../../types/creativeAgents';

export const CREATIVE_AGENTS = CREATIVE_AGENTS_DEFINITIONS;
export type CreativeAgentOption = AgentDefinition;

// APENAS FORMATOS VERTICAL (9:16) E HORIZONTAL (16:9)
export const ASPECT_RATIOS = [
  { id: '9:16', label: 'Vertical (9:16)', short: '9:16', desc: 'Totem DOOH & Stories' },
  { id: '16:9', label: 'Horizontal (16:9)', short: '16:9', desc: 'Painéis & Displays LED' },
];

// --- MOTOR DE SESSOES (puro/testavel): historico, migracao e anti-duplicacao ---
import {
  ChatMessage,
  ChatSession,
  ActiveCreationData,
  storageKeysFor,
  createSession,
  removeLoadingIds,
  removeOldestLoading,
  loadChatBoot,
  toPersistableSessions,
  pruneJobSessionMap,
} from '../lib/imageChatSessions';
import {
  fetchRemoteChatSessions,
  pushRemoteChatSession,
  mergeChatSessions,
  sortSessionsByRecency,
  formatMessageTime,
} from '../lib/chatSessionSync';

export type { ChatMessage, ChatSession, ActiveCreationData };

export function ImageGeneratorPage({
  onBack,
  onNavigate,
}: {
  onBack: () => void;
  onNavigate: (path: string) => void;
}) {
  const { currentOrganization, currentUser } = useSession();
  const orgId = currentOrganization?.id || '';
  /**
   * Escopo do histórico guardado no navegador = ORGANIZAÇÃO real.
   *
   * `orgId` mantém o fallback antigo para as chamadas à API, mas a cache local
   * NUNCA pode usar um id fixo: é isso que fazia uma conta nova abrir com as
   * conversas de quem tinha entrado antes no mesmo navegador.
   */
  const storageScope = currentOrganization?.id || '';
  const storageKeys = useMemo(() => storageKeysFor(storageScope), [storageScope]);
  const userId = currentUser?.id || 'usr-1';
  const { showToast } = useToast();
  const { jobs: bgJobs, startJob, retryJob } = useBgGeneration();

  /** Nova tentativa em curso (bloqueia o botão enquanto arranca o job). */
  const [isRetrying, setIsRetrying] = useState(false);

  // ─── ESTADO INICIAL: HISTÓRICO PERSISTENTE (COM MIGRAÇÃO/REPARAÇÃO) ────────
  // O boot é lido UMA vez por montagem. Já não se cria um chat novo a cada
  // entrada na página — isso era o que fazia as gerações antigas caírem todas
  // no mesmo chat "Novo Chat".
  const [boot] = useState(() => loadChatBoot(CREATIVE_AGENTS[0].id, storageScope));

  const [sessions, setSessions] = useState<ChatSession[]>(boot.sessions);
  const [activeSessionId, setActiveSessionId] = useState<string>(boot.activeSessionId);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  // Mapa trackingId (job) → chat DONO. Só o chat dono recebe o resultado.
  const [jobSessionMap, setJobSessionMap] = useState<Record<string, string>>(boot.jobMap);
  const jobSessionMapRef = useRef<Record<string, string>>(boot.jobMap);

  /** Regista (de forma síncrona) a que chat pertence um job. */
  const registerJobSession = useCallback((jobId: string, sessionId: string) => {
    jobSessionMapRef.current = { ...jobSessionMapRef.current, [jobId]: sessionId };
    setJobSessionMap(jobSessionMapRef.current);
  }, []);

  // Persistir histórico: sem bolhas de loading efémeras, sem chats vazios e
  // sem entradas de jobs cujo chat já não existe. As chaves são da ORGANIZAÇÃO
  // activa — nunca partilhadas entre contas.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(
        storageKeys.sessions,
        JSON.stringify(toPersistableSessions(sessions))
      );
      window.localStorage.setItem(storageKeys.active, JSON.stringify(activeSessionId));
      window.localStorage.setItem(
        storageKeys.jobMap,
        JSON.stringify(pruneJobSessionMap(jobSessionMapRef.current, sessions))
      );
    } catch {}
  }, [sessions, activeSessionId, jobSessionMap, storageKeys]);

  // Obter a sessão ativa
  /**
   * CHATS NO SERVIDOR (por organização) — o histórico acompanha o utilizador
   * entre painéis e dispositivos; o `localStorage` fica como cache rápida.
   * Sem organização resolvida não se pede nada: pedir com um id fixo mostraria
   * o histórico de outra conta.
   */
  useEffect(() => {
    const scope = currentOrganization?.id;
    if (!scope) return;
    let activo = true;
    fetchRemoteChatSessions(scope, 'IMAGE').then((remotas) => {
      if (!activo || remotas.length === 0) return;
      setSessions((prev) => sortSessionsByRecency(mergeChatSessions(prev, remotas)));
    });
    return () => {
      activo = false;
    };
  }, [currentOrganization?.id]);

  useEffect(() => {
    if (!sessions || sessions.length === 0) return;
    const scope = currentOrganization?.id;
    if (!scope) return;
    for (const sessao of sessions) {
      pushRemoteChatSession(sessao, scope, userId, 'IMAGE');
    }
  }, [sessions, currentOrganization?.id, userId]);

  /** Chats recentes em cima. */
  const sessionsOrdenadas = useMemo(() => sortSessionsByRecency(sessions), [sessions]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const chatMessages = activeSession?.messages || [];

  // Form State
  const [prompt, setPrompt] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<CreativeAgentOption>(CREATIVE_AGENTS[0]);
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0]);
  const [resolutionDetail, setResolutionDetail] = useState<'Standard' | '2K Ultra' | '4K Master'>('2K Ultra');

  /**
   * MODELO DE GERAÇÃO DE IMAGEM
   *
   * O utilizador escolhe entre o GPT Image 2 (modelo que já estava em produção)
   * e o Nano Banana 2.1 (Google, via kie.ai). O custo em créditos de cada modelo
   * — e de cada estilo dentro desse modelo — é definido pelo administrador na
   * página "Modelos & Custos" do painel Nexora Creative AI; aqui apenas se lê.
   */
  const [imageModel, setImageModel] = useState<string>('gpt-image-2');
  const [imageModels, setImageModels] = useState<
    Array<{ id: string; label: string; description?: string; defaultCost: number; styleCosts?: Record<string, number> }>
  >([]);

  useEffect(() => {
    let ativo = true;
    fetch('/api/ai-credits/models')
      .then((r) => (r.ok ? r.json() : []))
      .then((lista) => {
        if (!ativo || !Array.isArray(lista) || lista.length === 0) return;
        setImageModels(lista);
        // Mantém a escolha do utilizador se ainda existir; senão usa o primeiro.
        setImageModel((atual) => (lista.some((m: any) => m.id === atual) ? atual : lista[0].id));
      })
      .catch(() => {
        /* sem catálogo: fica o modelo por omissão (GPT Image 2) */
      });
    return () => {
      ativo = false;
    };
  }, []);
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [baseImageSource, setBaseImageSource] = useState<'upload' | 'library' | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const chatEndRef = useRef<HTMLDivElement>(null);
  /** Contentor rolável da lista de mensagens (ver o auto-scroll). */
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Jobs já entregues (ou falhados) nesta montagem — evita reprocessamento
  const settledJobIds = useRef<Set<string>>(new Set());

  // Modais
  const [showAgentsModal, setShowAgentsModal] = useState(false);
  const [showRatioModal, setShowRatioModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [agentFilterCategory, setAgentFilterCategory] = useState<string>('TODOS');

  // Modal de visualização de imagem com Prompt completo
  const [previewData, setPreviewData] = useState<{
    url: string;
    title: string;
    ratio: string;
    promptText?: string;
    modelName?: string;
    resolution?: string;
    /** Legenda pronta a publicar e hashtags sugeridas pelo agente. */
    copy?: string;
    hashtags?: string;
    /** Combinação criativa usada (controlo anti-repetição). */
    combination?: {
      tipo_ugc: string;
      sub_cena: string;
      angulo_camara: string;
      emocao_dominante: string;
      cenario: string;
    };
  } | null>(null);

  // Galeria para seleção de produto
  const [libraryImages, setLibraryImages] = useState<AIGenerationJob[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  const loadLibraryImages = async () => {
    setLoadingLibrary(true);
    try {
      const data = await studioService.getRecentJobs(orgId, 30);
      const imagesOnly = data.filter((j) => (j.resultUrl || j.outputUrl) && j.type !== 'VIDEO');
      setLibraryImages(imagesOnly);
    } catch {}
    setLoadingLibrary(false);
  };

  /**
   * Auto-scroll do chat, LIMITADO à lista de mensagens.
   *
   * Antes usava `scrollIntoView`, que arrasta TODOS os contentores roláveis
   * acima — incluindo a área de conteúdo da moldura. Ao abrir um chat antigo, a
   * página aparecia já rolada e o cabeçalho (logotipo) saía do ecrã. Rolar
   * apenas o contentor do chat resolve isso na raiz.
   */
  useEffect(() => {
    const scroller = chatScrollRef.current;
    if (!scroller) return;
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
  }, [chatMessages]);

  // Criar Novo Chat — nasce sempre vazio e isolado
  const handleCreateNewSession = () => {
    const newSession = createSession(selectedAgent.id);
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setPrompt('');
    setBaseImage(null);
    setBaseImageSource(null);
    showToast('Novo Chat Aberto', 'Inicie uma nova criação.', 'info');
  };

  // ─── EDIÇÃO DO NOME DO CHAT ───────────────────────────────────────────────
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleStartEditSession = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveSessionTitle = (sessionId: string) => {
    const trimmed = editingTitle.trim();
    if (trimmed) {
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: trimmed } : s))
      );
      showToast('Nome Atualizado', 'Título da conversa alterado com sucesso.', 'success');
    }
    setEditingSessionId(null);
  };

  const handleCancelEditSession = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  // Eliminar Sessão de Chat
  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();

    // 1) Desliga este chat de TODOS os jobs que lhe pertenciam (inclusive os que
    //    ainda estão a gerar). Sem isto, uma geração em curso voltava a aparecer
    //    — no chat errado — assim que terminasse.
    const inFlight = bgJobs.filter(
      (j) =>
        (j.status === 'QUEUED' || j.status === 'PROCESSING') &&
        jobSessionMapRef.current[j.id] === sessionId
    ).length;

    jobSessionMapRef.current = Object.fromEntries(
      Object.entries(jobSessionMapRef.current).filter(([, owner]) => owner !== sessionId)
    );
    setJobSessionMap(jobSessionMapRef.current);

    // 2) Remove o chat e garante que existe sempre pelo menos um chat ativo
    const filtered = sessions.filter((s) => s.id !== sessionId);
    const nextSessions = filtered.length > 0 ? filtered : [createSession(selectedAgent.id)];
    setSessions(nextSessions);

    if (activeSessionId === sessionId) {
      setActiveSessionId(nextSessions[0].id);
    }

    if (editingSessionId === sessionId) {
      setEditingSessionId(null);
      setEditingTitle('');
    }

    showToast(
      'Chat Eliminado',
      inFlight > 0
        ? `Sessão removida. ${inFlight} geração(ões) em curso deixaram de estar associadas a este chat.`
        : 'Sessão removida do histórico.',
      'info'
    );
  };

  // ─── CORE: REAGIR A JOBS CONCLUÍDOS E ENTREGAR NO CHAT DONO ────────────────
  // Regras:
  //  • só o chat que PEDIU a geração recebe o resultado (nunca a sessão ativa);
  //  • o mesmo job nunca é adicionado duas vezes (mesmo após recarregar a página);
  //  • se o chat dono foi eliminado, o resultado é descartado — não migra de chat.
  // Tudo é aplicado numa ÚNICA atualização de estado.
  useEffect(() => {
    const settled = bgJobs.filter(
      (j) => (j.status === 'COMPLETED' || j.status === 'FAILED') && !settledJobIds.current.has(j.id)
    );
    if (settled.length === 0) return;

    // ownerSessionId → mensagens a acrescentar / bolhas a remover
    const deliveries: Record<string, ChatMessage[]> = {};
    const failures: Record<string, number> = {};
    let hasWork = false;

    settled.forEach((job) => {
      settledJobIds.current.add(job.id);

      const ownerSessionId = jobSessionMapRef.current[job.id];
      if (!ownerSessionId) return; // não pertence a nenhum chat desta página

      if (job.status === 'FAILED') {
        failures[ownerSessionId] = (failures[ownerSessionId] || 0) + 1;
        // Bolha de ERRO no chat com o motivo real devolvido pelo servidor.
        // ⛔ Antes, uma falha limitava-se a remover o balão de espera: o
        // utilizador ficava a olhar para um chat sem resposta e sem saber o que
        // se passou (nem que os créditos tinham sido devolvidos).
        (deliveries[ownerSessionId] ||= []).push({
          id: `erro-${job.id}`,
          type: 'error',
          prompt: job.request?.additionalInstructions || job.label,
          agentName: job.request?.styleId || job.label,
          ratio: job.request?.aspectRatio,
          resolution: job.request?.resolution,
          errorText:
            job.error ||
            'A geração falhou no servidor. Os créditos desta tentativa foram devolvidos automaticamente.',
          failedJobId: job.id,
          timestamp: new Date(),
        });
        hasWork = true;
        return;
      }

      const outUrl = job.resultJob?.outputUrl || job.resultJob?.resultUrl;
      if (!outUrl) return;

      const ratio = job.resultJob?.parameters?.aspectRatio || '9:16';
      const styleId = job.resultJob?.parameters?.styleId || job.label;
      const jobPrompt =
        job.resultJob?.prompt || 'Anúncio Publicitário com Inteligência Artificial Nexora';

      (deliveries[ownerSessionId] ||= []).push({
        id: `ai-${job.id}`,
        type: 'ai',
        prompt: jobPrompt,
        agentName: styleId,
        ratio,
        resolution: job.resultJob?.parameters?.resolution || '2K Ultra',
        images: [
          {
            id: job.id,
            title: jobPrompt,
            imageUrl: outUrl,
            ratio,
            style: styleId,
            promptText: jobPrompt,
            // Direcção criativa do agente: legenda, hashtags e a combinação usada
            copy: job.resultJob?.parameters?.generatedCopy,
            hashtags: job.resultJob?.parameters?.generatedHashtags,
            combination: job.resultJob?.parameters?.creativeCombination,
          },
        ],
        timestamp: new Date(),
      });
      hasWork = true;
    });

    if (!hasWork) return;

    setSessions((prevSessions) => {
      let touched = false;

      const next = prevSessions.map((session) => {
        const incoming = deliveries[session.id];
        const failedCount = failures[session.id] || 0;
        if (!incoming && !failedCount) return session;

        // Anti-duplicação: ignora gerações que este chat já mostra
        const fresh = (incoming || []).filter(
          (msg) => !session.messages.some((m) => m.id === msg.id)
        );

        let messages = session.messages;
        for (let i = 0; i < failedCount; i++) messages = removeOldestLoading(messages);
        if (fresh.length > 0) messages = [...messages, ...fresh];

        if (messages === session.messages) return session;
        touched = true;
        return { ...session, messages };
      });

      // Chat dono eliminado entretanto → descarta em vez de juntar a outro chat
      return touched ? next : prevSessions;
    });
  }, [bgJobs]);

  const handleDownloadImage = (url: string, filename?: string) => {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `nexora-criativo-${Date.now()}.png`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Download Concluído', 'Imagem transferida em alta resolução.', 'success');
    } catch {
      showToast('Erro no Download', 'Não foi possível baixar diretamente.', 'error');
    }
  };

  /**
   * Custo REAL de um criativo: preço do estilo no modelo escolhido → custo base
   * do modelo → 8 (o mesmo que o servidor debita quando não há preço definido).
   */
  const costForModel = (modelId: string): number => {
    const modelo = imageModels.find((m) => m.id === modelId);
    if (!modelo) return 8;
    const porEstilo = modelo.styleCosts?.[selectedAgent?.id || ''];
    return Number(porEstilo ?? modelo.defaultCost ?? 8);
  };

  const costPerImage = costForModel(imageModel);
  const totalCost = quantity * costPerImage;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target?.result as string;
        setBaseImage(dataUrl);
        setBaseImageSource('upload');
        showToast('Foto do Produto Anexada', 'O modelo usará este produto no anúncio.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectFromLibrary = (job: AIGenerationJob) => {
    const url = job.resultUrl || job.outputUrl;
    if (url) {
      setBaseImage(url);
      setBaseImageSource('library');
      setShowLibraryModal(false);
      showToast('Foto do Produto Vinculada', 'Imagem vinculada da galeria.', 'info');
    }
  };

  // ─── GERAÇÃO DE IMAGEM VINCULADA À SESSÃO ATIVA ───────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!baseImage) {
      showToast(
        'Imagem de Referência Obrigatória',
        'Carregue a foto do produto para o modelo criar o anúncio comercial.',
        'warning'
      );
      return;
    }

    const userInput = prompt.trim();
    const snapshotBase = baseImage;
    const currentSessionId = activeSessionId;

    // Mensagem do usuário no chat
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      prompt: userInput || `Gerar anúncio para o produto anexado com o ${selectedAgent.name}`,
      agentName: selectedAgent.name,
      ratio: selectedRatio.id,
      resolution: resolutionDetail,
      quantity,
      baseImageUrl: snapshotBase || undefined,
      timestamp: new Date(),
    };

    // Loading bubbles
    const loadingIds: string[] = [];
    for (let i = 0; i < quantity; i++) {
      const lid = `loading-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`;
      loadingIds.push(lid);
    }

    // Atualiza a sessão ativa imediatamente
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          const newMessages = [
            ...s.messages,
            userMsg,
            ...loadingIds.map((lid) => ({
              id: lid,
              type: 'loading' as const,
              agentName: selectedAgent.name,
              ratio: selectedRatio.id,
              timestamp: new Date(),
            })),
          ];
          const newTitle =
            s.title === 'Novo Chat' || s.title.startsWith('Nova Campanha')
              ? userInput.length > 25
                ? userInput.substring(0, 23) + '...'
                : (userInput || `${selectedAgent.shortName} Produto`)
              : s.title;

          return { ...s, messages: newMessages, title: newTitle };
        }
        return s;
      })
    );

    setPrompt('');

    try {
      const balance = await studioService.getBalance(orgId);
      if (balance < totalCost) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? { ...s, messages: removeLoadingIds(s.messages, loadingIds) }
              : s
          )
        );
        showToast('Créditos Insuficientes', `São necessários ${totalCost} créditos.`, 'error');
        return;
      }

      const cleanObjective = userInput || '';

      for (let i = 0; i < quantity; i++) {
        const jobLabel =
          quantity > 1
            ? `${selectedAgent.shortName} (${i + 1}/${quantity})`
            : `${selectedAgent.shortName}`;

        startJob({
          label: jobLabel,
          orgId,
          userId,
          styleId: selectedAgent.id,
          aspectRatio: selectedRatio.id as any,
          resolution: resolutionDetail === '4K Master' ? '4K' : '2K',
          objective: cleanObjective,
          additionalInstructions: cleanObjective,
          originalImageBase64Url: snapshotBase || undefined,
          imageModel,
        })
          .then((trackingId) => {
            if (trackingId) {
              // Regista que este job pertence a ESTE chat (e só a este)
              registerJobSession(trackingId, currentSessionId);
            }
          })
          .catch((err: any) => {
            console.error('Erro ao iniciar job:', err);
            setSessions((prev) =>
              prev.map((s) =>
                s.id === currentSessionId
                  ? { ...s, messages: removeOldestLoading(s.messages) }
                  : s
              )
            );
            // Sem este aviso, uma falha do servidor (por exemplo a base de dados
            // inacessível) limitava-se a fazer desaparecer o balão de geração
            // sem qualquer explicação para o utilizador.
            showToast(
              'Não foi possível iniciar a geração',
              err?.message || 'Falha ao contactar o servidor. Tente novamente.',
              'error'
            );
          });
      }

      showToast({
        type: 'ai',
        title: 'Criativo em Produção!',
        message: `${quantity} anúncio(s) enviado(s) para o ${selectedAgent.name}.`,
        duration: 4000,
      });
    } catch (e: any) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: removeLoadingIds(s.messages, loadingIds) }
            : s
        )
      );
      showToast('Erro', e.message || 'Falha ao processar criativo.', 'error');
    }
  }, [baseImage, selectedAgent, prompt, selectedRatio, resolutionDetail, quantity, orgId, userId, totalCost, startJob, showToast, activeSessionId, registerJobSession, imageModel]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  /**
   * Categorias do filtro, derivadas do catálogo activo.
   *
   * Estavam escritas à mão com as categorias dos 12 modelos retirados — com o
   * catálogo reduzido ao Nexora Apex, quase todos os botões filtravam para uma
   * lista vazia. Derivar daqui faz com que um modelo novo apareça sozinho.
   */
  const agentCategories = ['TODOS', ...Array.from(new Set(CREATIVE_AGENTS.map((a) => a.category)))];
  const filteredAgents = CREATIVE_AGENTS.filter((agent) => {
    if (agentFilterCategory === 'TODOS') return true;
    return agent.category === agentFilterCategory;
  });

  const userInitial = (currentUser?.name || 'U').substring(0, 2).toUpperCase();


  return (
    <div className="flex h-full min-h-0 w-full relative overflow-hidden bg-[#060A14]">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-30 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ─── SIDEBAR LATERAL COM LISTA DE CHATS (ESTILO CHATGPT) ─────────────── */}
      <aside
        className={`h-full border-r border-white/[0.06] bg-[#080D1A]/95 backdrop-blur-2xl flex flex-col transition-all duration-300 shrink-0 fixed md:relative top-0 bottom-0 left-0 z-40 md:z-20 ${
          isSidebarOpen
            ? 'w-72 sm:w-80 shadow-2xl md:shadow-none translate-x-0'
            : 'w-0 -translate-x-full md:translate-x-0 border-none overflow-hidden'
        }`}
      >
        {/* Topo da Sidebar: Botão Novo Chat */}
        <div className="p-3 border-b border-white/[0.06] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCreateNewSession}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF]/15 to-[#1677FF]/15 hover:from-[#00E5FF]/25 hover:to-[#1677FF]/25 border border-[#00E5FF]/30 text-xs font-bold text-[#00E5FF] transition-all cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.1)] active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Chat</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Fechar histórico"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Chats Salvos */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          <span className="text-[10px] font-mono text-slate-500 uppercase px-3 py-1.5 block tracking-wider">
            Conversas Anteriores
          </span>

          {sessionsOrdenadas.map((session) => {
            const isActive = session.id === activeSessionId;
            const isEditing = editingSessionId === session.id;
            const messageCount = session.messages.length;

            return (
              <div
                key={session.id}
                onClick={() => {
                  if (!isEditing) {
                    setActiveSessionId(session.id);
                    setPrompt('');
                  }
                }}
                onDoubleClick={(e) => handleStartEditSession(e, session)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#10172A] border border-[#00E5FF]/40 text-[#00E5FF] font-bold shadow-md'
                    : 'text-slate-300 hover:bg-white/[0.04] border border-transparent hover:text-white'
                }`}
              >
                {isEditing ? (
                  <div
                    className="flex items-center gap-1.5 flex-1 min-w-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      autoFocus
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveSessionTitle(session.id);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          handleCancelEditSession();
                        }
                      }}
                      className="flex-1 bg-[#060A14] border border-[#00E5FF]/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveSessionTitle(session.id)}
                      className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 cursor-pointer"
                      title="Salvar nome"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditSession}
                      className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#00E5FF]' : 'text-slate-500'}`} />
                      <span className="truncate text-left flex-1" title={session.title}>
                        {session.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {messageCount > 0 && (
                        <span className="text-[9px] font-mono text-slate-500 px-1.5 py-0.2 rounded bg-white/[0.03]">
                          {messageCount}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleStartEditSession(e, session)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-[#00E5FF] hover:bg-white/10 transition-all text-slate-500 cursor-pointer"
                        title="Renomear conversa"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-rose-400 hover:bg-white/10 transition-all text-slate-500 cursor-pointer"
                        title="Eliminar conversa"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Rodapé da Sidebar */}
        <div className="p-3 border-t border-white/[0.06] text-[10px] text-slate-500 text-center font-mono flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3 text-[#00E5FF]" />
          <span>Modelos Exclusivos Nexora</span>
        </div>
      </aside>

      {/* ─── ÁREA DO CHAT PRINCIPAL (IDENTICA EM ESTRUTURA AO VÍDEO) ──────────── */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">

        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0 bg-[#080D1A]/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer mr-1"
                title="Abrir histórico de chats"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00E5FF]/20 to-[#1677FF]/20 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF]">
              <ImageIcon className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white font-display">Estúdio de Imagem IA</h1>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[9px] font-mono font-bold text-[#00E5FF]">
                  <Zap className="w-2.5 h-2.5" /> {selectedAgent.name}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Anúncios com foto de produto em 9:16 e 16:9</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAgentsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-200 transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
              <span className="font-bold">{selectedAgent.shortName}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* ─── STREAM DO CHAT ─────────────────────────────────────────────── */}
        <div ref={chatScrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar">

          {/* Ecrã de Boas-Vindas Padrão (Idêntico ao Gerador de Vídeo) */}
          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-5 py-8 animate-in fade-in duration-300">
              
              <div className="relative">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#00E5FF]/20 to-[#1677FF]/10 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] shadow-[0_0_40px_rgba(0,229,255,0.12)]">
                  <ImageIcon className="w-7 h-7" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-tr from-[#00E5FF] to-[#1677FF] flex items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 text-slate-950" />
                </div>
              </div>

              <div className="space-y-2 max-w-md">
                <h2 className="text-base font-extrabold text-white font-display">Anúncios com Modelos Nexora</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Carregue a foto do seu produto e selecione o modelo ideal. O agente cria títulos comerciais e anúncios publicitários em alta definição.
                </p>
              </div>

              {/* Botão de Upload Rápido de Produto */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <label className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-dashed border-[#00E5FF]/50 hover:border-[#00E5FF] bg-[#00E5FF]/[0.05] hover:bg-[#00E5FF]/[0.1] transition-all cursor-pointer text-xs font-bold text-[#00E5FF] shadow-[0_0_25px_rgba(0,229,255,0.15)]">
                  <Upload className="w-4 h-4" />
                  <span>Carregar Foto do Produto (Obrigatório)</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={() => { loadLibraryImages(); setShowLibraryModal(true); }}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] transition-all cursor-pointer text-xs font-medium text-slate-300"
                >
                  <FolderHeart className="w-4 h-4 text-pink-400" />
                  <span>Escolher da Galeria</span>
                </button>
              </div>

              {/* Grid 2x2 de Modelos Recomendados (Idêntico ao Gerador de Vídeo) */}
              <div className="pt-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2 block">
                  Modelos Recomendados
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-lg">
                  {CREATIVE_AGENTS.slice(0, 4).map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => { setSelectedAgent(agent); }}
                      className={`relative rounded-xl overflow-hidden h-20 border transition-all cursor-pointer group text-left ${
                        selectedAgent.id === agent.id
                          ? 'border-[#00E5FF] ring-1 ring-[#00E5FF]'
                          : 'border-white/[0.08] hover:border-[#00E5FF]/50'
                      }`}
                    >
                      <img src={agent.previewUrl} alt={agent.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-1.5">
                        <span className="text-[10px] font-bold text-white truncate block">{agent.name}</span>
                        <span className="text-[8px] text-[#00E5FF] font-mono block">{agent.badge}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Renderização das Mensagens da Sessão Ativa */}
          {chatMessages.map((msg) => {
            if (msg.type === 'user') {
              return (
                <div key={msg.id} className="flex justify-end gap-3 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="max-w-[70%] space-y-1.5">
                    <div className="flex justify-end gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/20 text-[9px] font-mono text-[#00E5FF] font-bold">
                        {msg.agentName}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-[9px] font-mono text-slate-300">
                        {msg.ratio}
                      </span>
                    </div>

                    {msg.baseImageUrl && (
                      <div className="flex justify-end mb-1">
                        <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#00E5FF]/40 shadow-md">
                          <img src={msg.baseImageUrl} alt="Produto" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}

                    <div className="bg-[#1C2535] border border-white/[0.08] rounded-[20px] rounded-tr-sm px-4 py-3 text-xs text-slate-200 leading-relaxed">
                      {msg.prompt}
                    </div>
                    <div className="flex justify-end">
                      <span className="text-[9px] text-slate-500">
                        {formatMessageTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1677FF] to-[#00E5FF] flex items-center justify-center text-slate-950 font-bold text-[10px] shrink-0 mt-auto">
                    {userInitial}
                  </div>
                </div>
              );
            }

            if (msg.type === 'loading') {
              return (
                <div key={msg.id} className="flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00E5FF]/30 to-[#1677FF]/20 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] shrink-0 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-[#10172A] border border-white/[0.08] rounded-[20px] rounded-tl-sm px-5 py-4 flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-[#00E5FF]/40 border-t-[#00E5FF] animate-spin" />
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-300 font-medium block">
                        {msg.agentName} a conceber anúncio...
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Composição publicitária em {msg.ratio} com fidelidade estrita ao produto
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            /**
             * FALHA DA GERAÇÃO — aparece no chat imediatamente, com o motivo real
             * que o servidor devolveu, aviso de estorno e botão de nova tentativa
             * com os mesmos dados (estilo, formato, imagem e modelo).
             */
            if (msg.type === 'error') {
              return (
                <div key={msg.id} className="flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500/40 to-amber-500/30 border border-rose-400/50 flex items-center justify-center text-rose-300 shrink-0 shadow-[0_0_15px_rgba(244,63,94,0.25)]">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="max-w-[85%] space-y-2.5 bg-[#1A1016] border border-rose-500/40 rounded-[22px] rounded-tl-sm p-4 text-slate-200">
                    <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-[9px] font-mono font-bold text-rose-300">
                        ⛔ Geração falhou
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {msg.agentName} · {msg.ratio} · {msg.resolution}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-white leading-relaxed">{msg.errorText}</p>

                    <ul className="text-[11px] text-slate-400 space-y-1 leading-relaxed">
                      <li>• A geração foi interrompida automaticamente — nada continua a correr.</li>
                      <li>• Os créditos desta tentativa foram devolvidos ao seu saldo.</li>
                    </ul>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        disabled={isRetrying}
                        onClick={async () => {
                          if (!msg.failedJobId) return;
                          setIsRetrying(true);
                          try {
                            const novoId = await retryJob(msg.failedJobId);
                            if (novoId && activeSessionId) registerJobSession(novoId, activeSessionId);
                          } finally {
                            setIsRetrying(false);
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-extrabold text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        {isRetrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        <span>Tentar novamente</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            if (msg.type === 'ai') {
              return (
                <div key={msg.id} className="flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00E5FF]/30 to-[#1677FF]/20 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] shrink-0 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>

                  <div className="space-y-2 max-w-[85%]">
                    {/* Grid de Imagens Geradas nesta sessão */}
                    {msg.images && msg.images.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {msg.images.map((img) => (
                          <div
                            key={img.id}
                            className="relative rounded-[18px] overflow-hidden border border-white/[0.1] bg-[#10172A] shadow-xl group cursor-pointer transition-transform hover:scale-[1.01]"
                            style={{
                              aspectRatio: img.ratio === '16:9' ? '16/9' : '9/16',
                              maxWidth: img.ratio === '16:9' ? '360px' : '220px',
                              minWidth: '180px',
                            }}
                          >
                            <img
                              src={img.imageUrl}
                              alt={img.title}
                              onClick={() =>
                                setPreviewData({
                                  url: img.imageUrl,
                                  title: img.title,
                                  ratio: img.ratio,
                                  promptText: img.promptText || msg.prompt,
                                  modelName: msg.agentName,
                                  resolution: msg.resolution,
                                  copy: img.copy,
                                  hashtags: img.hashtags,
                                  combination: img.combination,
                                })
                              }
                              className="w-full h-full object-cover"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />

                            {/* Badges Topo */}
                            <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                              <span className="px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur text-[9px] font-mono text-[#00E5FF] border border-white/10 font-bold">
                                8K Master
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur text-[9px] font-mono text-slate-300 border border-white/10">
                                {img.ratio}
                              </span>
                            </div>

                            {/* Botões de Ação no Hover */}
                            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewData({
                                    url: img.imageUrl,
                                    title: img.title,
                                    ratio: img.ratio,
                                    promptText: img.promptText || msg.prompt,
                                    modelName: msg.agentName,
                                    resolution: msg.resolution,
                                    copy: img.copy,
                                    hashtags: img.hashtags,
                                    combination: img.combination,
                                  });
                                }}
                                className="p-2.5 rounded-full bg-black/70 hover:bg-[#00E5FF] text-white hover:text-slate-950 border border-white/20 transition-all cursor-pointer shadow-lg"
                                title="Visualizar Detalhes & Prompt"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadImage(img.imageUrl, `nexora-${img.id}.png`);
                                }}
                                className="p-2.5 rounded-full bg-black/70 hover:bg-[#00E5FF] text-white hover:text-slate-950 border border-white/20 transition-all cursor-pointer shadow-lg"
                                title="Baixar Imagem"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Feedback do Chat */}
                    <div className="flex items-center gap-2 pl-1">
                      <button
                        type="button"
                        onClick={() => showToast('Obrigado!', 'Feedback registado.', 'success')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-white/[0.05] transition-colors cursor-pointer"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => showToast('Feedback enviado', 'Ajustaremos a IA.', 'info')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/[0.05] transition-colors cursor-pointer"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[9px] text-slate-500 ml-1">
                        {formatMessageTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}

          <div ref={chatEndRef} />
        </div>

        {/* ─── BARRA DE INPUT FLUTUANTE ───────────────────────────────────── */}
        <div className="shrink-0 px-4 pb-4 pt-2">
          {/* Banner da Foto de Produto */}
          {baseImage ? (
            <div className="flex items-center justify-between gap-2 mb-2 px-3 py-1.5 rounded-2xl bg-[#10172A] border border-[#00E5FF]/40 text-xs text-[#00E5FF] shadow-lg animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-[#00E5FF]/60 shrink-0">
                  <img src={baseImage} alt="Produto" className="w-full h-full object-cover" />
                </div>
                <span className="font-bold text-white text-[11px] truncate">
                  Foto do Produto Vinculada ({baseImageSource === 'library' ? 'Galeria' : 'Upload'})
                </span>
              </div>
              <button
                type="button"
                onClick={() => { setBaseImage(null); setBaseImageSource(null); }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Remover foto do produto"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
              <Paperclip className="w-3.5 h-3.5 shrink-0" />
              <span>Anexe a foto do produto para gerar o anúncio publicitário.</span>
            </div>
          )}

          {/* Container do Input */}
          <div className="rounded-[22px] bg-[#1C2535]/90 border border-white/[0.09] backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Textarea */}
            <div className="flex items-center gap-3 px-4 pt-3 pb-1">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  baseImage
                    ? 'Instruções adicionais ou foco da campanha (opcional)...'
                    : 'Anexe a foto do produto abaixo para começar...'
                }
                rows={2}
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 resize-none outline-none leading-relaxed font-sans"
              />
            </div>

            {/* Controles da Barra */}
            <div className="flex items-center justify-between px-3 pb-3 pt-1 gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Seletor do Modelo */}
                <button
                  type="button"
                  onClick={() => setShowAgentsModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] text-slate-300 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span className="font-bold">{selectedAgent.name}</span>
                </button>

                {/* Formato: Apenas Vertical e Horizontal */}
                <button
                  type="button"
                  onClick={() => setShowRatioModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] text-slate-300 transition-colors cursor-pointer"
                >
                  <span className="font-mono font-bold text-[#00E5FF]">{selectedRatio.short}</span>
                  <span className="hidden sm:inline text-slate-400 text-[10px]">({selectedRatio.id === '9:16' ? 'Vertical' : 'Horizontal'})</span>
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                </button>

                {/* Modelo de geração de imagem: GPT Image 2 ou Nano Banana 2.1 */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08]"
                  title="Modelo que desenha a imagem. Os custos são definidos no painel Creative AI."
                >
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  <select
                    value={imageModel}
                    onChange={(e) => setImageModel(e.target.value)}
                    className="bg-transparent text-[11px] text-slate-200 outline-none cursor-pointer max-w-[190px]"
                    aria-label="Modelo de geração de imagem"
                  >
                    {(imageModels.length > 0
                      ? imageModels
                      : [{ id: 'gpt-image-2', label: 'GPT Image 2', defaultCost: 8, styleCosts: {} }]
                    ).map((m) => (
                      <option key={m.id} value={m.id} className="bg-[#0B1120] text-slate-100">
                        {m.label} · {costForModel(m.id)} créditos
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantidade */}
                <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl p-0.5">
                  {[1, 2, 4].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuantity(q)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        quantity === q ? 'bg-[#00E5FF] text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {q}x
                    </button>
                  ))}
                </div>

                {/* Botão de Upload da Imagem */}
                <label
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] transition-colors cursor-pointer ${
                    baseImage
                      ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300'
                  }`}
                  title="Carregar foto do produto (Obrigatório)"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span className="font-semibold">Foto Produto</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>

                {/* Galeria */}
                <button
                  type="button"
                  onClick={() => { loadLibraryImages(); setShowLibraryModal(true); }}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Escolher da Galeria"
                >
                  <FolderHeart className="w-3.5 h-3.5" />
                  <span>Galeria</span>
                </button>
              </div>

              {/* Botão de Envio com custo em créditos */}
              <div className="flex items-center gap-2">
                <span
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold shadow-sm"
                  title={`Custo total: ${totalCost} créditos (${costPerImage} por criativo • ${quantity}x)`}
                >
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>{totalCost} créditos</span>
                </span>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!baseImage}
                  className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00E5FF] to-[#1677FF] hover:brightness-110 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={baseImage ? `Gerar anúncio (${totalCost} créditos)` : 'Anexe a foto do produto para gerar'}
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="px-4 pb-2 text-[9px] text-slate-600 text-center">
              {selectedAgent.name} • {imageModels.find((m) => m.id === imageModel)?.label || 'GPT Image 2'} •{' '}
              {totalCost} créditos ({costPerImage} por criativo) • Resolução 2K/4K
            </div>
          </div>
        </div>

      </div>

      {/* ─── MODAL DE VISUALIZAÇÃO COM PROMPT COMPLETO E METADADOS ──────────── */}
      {previewData && (
        <Modal
          isOpen={Boolean(previewData)}
          onClose={() => setPreviewData(null)}
          title="Visualização do Criativo Publicitário"
          description={`Formato ${previewData.ratio} • Resolução Máxima 8K`}
          size="xl"
          accent="cyan"
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar">
            
            {/* Grid 2 Colunas: Imagem na Esquerda + Metadados e Prompt na Direita */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Coluna da Imagem */}
              <div className="md:col-span-6 flex items-center justify-center bg-black/90 rounded-2xl overflow-hidden p-2 border border-white/10 min-h-[350px]">
                <img
                  src={previewData.url}
                  alt={previewData.title}
                  className="max-h-[55vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
                />
              </div>

              {/* Coluna de Detalhes & Prompt */}
              <div className="md:col-span-6 flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  {/* Badges de Modelo e Formato */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/30 text-[#00E5FF] font-bold text-xs font-mono">
                      {previewData.modelName || 'Nexora Apex'}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-300 text-xs font-mono">
                      {previewData.ratio}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                      8K Ultra HD
                    </span>
                  </div>

                  {/* Caixa de Prompt Formatado */}
                  <div className="rounded-2xl border border-white/[0.08] bg-[#10172A] p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        Prompt do Anúncio
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (previewData.promptText) {
                            navigator.clipboard.writeText(previewData.promptText);
                            showToast('Copiado', 'Prompt copiado para a área de transferência.', 'success');
                          }
                        }}
                        className="flex items-center gap-1 text-[10px] text-[#00E5FF] hover:underline cursor-pointer font-bold"
                      >
                        <Copy className="w-3 h-3" /> Copiar Prompt
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed max-h-48 overflow-y-auto custom-scrollbar font-mono bg-black/40 p-2.5 rounded-xl border border-white/5">
                      {previewData.promptText || 'Anúncio Publicitário com Inteligência Artificial Nexora'}
                    </p>
                  </div>

                  {/* Legenda pronta a publicar + hashtags (saem do agente, fora da imagem) */}
                  {(previewData.copy || previewData.hashtags) && (
                    <div className="rounded-2xl border border-white/[0.08] bg-[#10172A] p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                          Legenda & Hashtags
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const text = [previewData.copy, previewData.hashtags]
                              .filter(Boolean)
                              .join('\n\n');
                            if (text) {
                              navigator.clipboard.writeText(text);
                              showToast('Copiado', 'Legenda copiada para a área de transferência.', 'success');
                            }
                          }}
                          className="flex items-center gap-1 text-[10px] text-[#00E5FF] hover:underline cursor-pointer font-bold"
                        >
                          <Copy className="w-3 h-3" /> Copiar Legenda
                        </button>
                      </div>
                      {previewData.copy && (
                        <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto custom-scrollbar bg-black/40 p-2.5 rounded-xl border border-white/5">
                          {previewData.copy}
                        </p>
                      )}
                      {previewData.hashtags && (
                        <p className="text-[11px] text-[#00E5FF] leading-relaxed font-mono break-words">
                          {previewData.hashtags}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Combinação criativa usada — o que a regra anti-repetição controla */}
                  {previewData.combination && (
                    <div className="rounded-2xl border border-[#7C3AED]/25 bg-[#7C3AED]/[0.07] p-3.5 space-y-1.5">
                      <span className="text-[10px] font-bold text-[#C084FC] uppercase tracking-wider font-mono">
                        Combinação Anti-Repetição
                      </span>
                      <div className="grid grid-cols-1 gap-1 text-[11px] font-mono text-slate-300">
                        <span><strong className="text-slate-500">Tipo:</strong> {previewData.combination.tipo_ugc}</span>
                        <span><strong className="text-slate-500">Sub-cena:</strong> {previewData.combination.sub_cena}</span>
                        <span><strong className="text-slate-500">Ângulo:</strong> {previewData.combination.angulo_camara}</span>
                        <span><strong className="text-slate-500">Emoção:</strong> {previewData.combination.emocao_dominante}</span>
                        <span><strong className="text-slate-500">Cenário:</strong> {previewData.combination.cenario}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setPreviewData(null)}
                    className="px-4 py-2.5 rounded-xl border border-white/10 text-xs text-slate-300 hover:bg-white/5 cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadImage(previewData.url)}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#1677FF] text-slate-950 font-extrabold text-xs shadow-lg hover:brightness-110 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Imagem</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </Modal>
      )}

      {/* ─── MODAL SELEÇÃO DE MODELOS EXCLUSIVOS NEXORA ────────────────────── */}
      {showAgentsModal && (
        <Modal
          isOpen={showAgentsModal}
          onClose={() => setShowAgentsModal(false)}
          title="Modelos Exclusivos Nexora"
          description="Selecione o modelo especializado para conceber a campanha do seu produto."
          size="xl"
          accent="cyan"
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
            {/* Categorias de Filtro */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
              {agentCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setAgentFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    agentFilterCategory === cat
                      ? 'bg-[#00E5FF] text-slate-950 font-bold'
                      : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Grid de Modelos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredAgents.map((agent) => {
                const isSelected = selectedAgent.id === agent.id;
                return (
                  <div
                    key={agent.id}
                    onClick={() => { setSelectedAgent(agent); setShowAgentsModal(false); }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                      isSelected
                        ? 'bg-[#00E5FF]/10 border-[#00E5FF] shadow-[0_0_25px_rgba(0,229,255,0.2)]'
                        : 'bg-[#10172A] border-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    <div className="relative h-28 rounded-xl overflow-hidden">
                      <img src={agent.previewUrl} alt={agent.name} className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur text-[9px] font-mono text-[#00E5FF] font-bold">
                        {agent.badge}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#00E5FF] text-slate-950 flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white">{agent.name}</h4>
                        <span className="text-[9px] font-mono text-slate-400">{agent.category}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {agent.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}

      {/* ─── MODAL FORMATO (APENAS VERTICAL E HORIZONTAL) ──────────────────── */}
      {showRatioModal && (
        <Modal
          isOpen={showRatioModal}
          onClose={() => setShowRatioModal(false)}
          title="Formato de Exibição"
          description="Selecione o formato ideal para as telas da sua campanha."
          accent="cyan"
          size="md"
        >
          <div className="space-y-3">
            {ASPECT_RATIOS.map((r) => {
              const isSelected = selectedRatio.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => { setSelectedRatio(r); setShowRatioModal(false); }}
                  className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-[#00E5FF]/10 border-[#00E5FF]'
                      : 'bg-[#10172A] border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{r.label}</span>
                      <span className="px-2 py-0.5 rounded bg-[#00E5FF]/20 text-[9px] font-mono text-[#00E5FF]">
                        {r.short}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{r.desc}</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#00E5FF] stroke-[3]" />}
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {/* ─── MODAL GALERIA PARA SELEÇÃO DE PRODUTO ─────────────────────────── */}
      {showLibraryModal && (
        <Modal
          isOpen={showLibraryModal}
          onClose={() => setShowLibraryModal(false)}
          title="Selecionar Foto da Galeria"
          description="Escolha uma imagem para usar como produto de referência."
          size="lg"
          accent="cyan"
        >
          <div className="space-y-4">
            {loadingLibrary ? (
              <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#00E5FF]" /> A carregar fotos...
              </div>
            ) : libraryImages.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 bg-white/[0.02] rounded-xl border border-white/5">
                Nenhuma imagem encontrada na galeria. Carregue uma foto pelo botão de anexo.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
                {libraryImages.map((job) => {
                  const url = job.resultUrl || job.outputUrl;
                  return (
                    <div
                      key={job.id}
                      onClick={() => handleSelectFromLibrary(job)}
                      className="group relative h-36 rounded-xl overflow-hidden border border-white/10 hover:border-[#00E5FF] cursor-pointer transition-all bg-black/60 shadow-md"
                    >
                      <img src={url} alt="Criativo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2">
                        <span className="px-3 py-1 rounded-lg bg-[#00E5FF] text-slate-950 text-[10px] font-bold">
                          Usar Produto
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Modal>
      )}

    </div>
  );
}
