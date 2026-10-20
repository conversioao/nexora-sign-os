import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/Toast';
import { studioService } from '../../../services/studioService';
import { useSession } from '../../../context/SessionContext';
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Video as VideoIcon,
  Check,
  ChevronRight,
  Download,
  X,
  Play,
  Pause,
  Upload,
  Film,
  Image as ImageIcon,
  FolderHeart,
  ArrowUp,
  Paperclip,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Clapperboard,
  Eye,
  ShieldCheck,
  Plus,
  MessageSquare,
  Copy,
  PanelLeftClose,
  PanelLeft,
  Pencil,
  Trash2,
  Tv,
  ShoppingBag,
  Sparkle,
  Coins,
} from 'lucide-react';
import { AIGenerationJob } from '../../../types/studio';

// ─── 3 AGENTES ESPECIALISTAS EM VÍDEO PUBLICITÁRIO ───────────────────────────
export interface VideoSpecialistAgent {
  id: string;
  name: string;
  shortName: string;
  category: string;
  description: string;
  previewUrl: string;
  badge: string;
  motionDirective: string;
}

export const VIDEO_AGENTS: VideoSpecialistAgent[] = [
  {
    id: 'nexora_motion_graphics',
    name: 'Nexora Motion Vision Pro',
    shortName: 'Motion Graphics',
    category: 'Motion & Efeitos',
    description: 'Especialista em motion graphics moderno de alto impacto para telas DOOH (sem áudio). Segue estritamente a identidade da imagem carregada (sem inventar), com tipografia cinética marcante, letras e efeitos na tela que prendem a atenção do público.',
    previewUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800',
    badge: 'Motion & Textos DOOH',
    motionDirective: 'Ultra-modern high-impact commercial motion graphics for soundless DOOH screens, bold kinetic on-screen typography in Portuguese, sleek glowing particle effects, vibrant brand-aligned accents, zero product distortion, irresistible visual hook, ultra-fluid 60fps.',
  },
  {
    id: 'nexora_brand_commercial',
    name: 'Nexora Brand Master',
    shortName: 'Grandes Marcas',
    category: 'Comercial Global',
    description: 'Especialista em comerciais de prestígio no padrão Apple, Nike e Coca-Cola. Cinematografia de luxo, profundidade de campo seletiva, iluminação volumétrica e prestígio de marca.',
    previewUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=800',
    badge: 'Grandes Marcas',
    motionDirective: 'Prestigious global commercial cinematography, luxury brand standard, soft golden studio rim-lighting, shallow depth of field focus rack, volumetric lighting rays, 60fps elegant camera drift.',
  },
  {
    id: 'nexora_food_restaurant',
    name: 'Nexora Food & Restaurants',
    shortName: 'Comida & Restaurantes',
    category: 'Restaurantes & Fast-Food',
    description: 'Especialista em comida: hamburgarias, restaurantes, cafés e take-away. Sizzling na grelha, queijo a derreter, vapor, molhos brilhantes, nome do prato e preço com CTA de pedido/delivery.',
    previewUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800',
    badge: 'Comida & Delivery',
    motionDirective: 'Mouth-watering food commercial, macro sizzle and steam, slow-motion cheese pull and sauce drip, warm restaurant ambience with bokeh lights, dish name and price animated in, inviting order/delivery call to action, 60fps.',
  },
];

const VIDEO_DURATIONS = [
  { id: '10', label: '10s (5 Cenas de 2s • Padrão DOOH)', short: '10s' },
  { id: '5', label: '5s (Vinheta Rápida)', short: '5s' },
  { id: '15', label: '15s (Spot Comercial)', short: '15s' },
];

const SAMPLE_VIDEOS = [
  {
    id: 'sample-v1',
    poster: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    title: 'Spot Comercial de Perfume com Movimento Suave em 60fps',
    ratio: '9:16',
    style: 'Grandes Marcas',
    duration: '10s',
  },
  {
    id: 'sample-v2',
    poster: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    title: 'Tênis Esportivo com Rotação 3D em Painel de Totem',
    ratio: '9:16',
    style: 'Motion Graphics',
    duration: '10s',
  },
  {
    id: 'sample-v3',
    poster: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    title: 'Bebida Refrescante de Supermercado em 4K',
    ratio: '9:16',
    style: 'Supermercado & Varejo',
    duration: '10s',
  },
];

// ─── Tipos do Storyboard (5 Cenas de 2s cada, Total 10s) ────────────────────
export interface StoryboardData {
  product_identified: string;
  visual_style: string;
  duration_seconds: number;
  motion_breakdown: {
    scene1_hook: string;    // 0s - 2s
    scene2_detail: string;  // 2s - 4s
    scene3_dynamic: string; // 4s - 6s
    scene4_benefit: string; // 6s - 8s
    scene5_cta: string;     // 8s - 10s
  };
  on_screen_texts?: string[];
  visual_consistency_rules: string;
  omni_flash_prompt: string;
  portuguese_summary: string;
  storyboard_image_url?: string;
}

// ─── Tipos das Mensagens do Chat ─────────────────────────────────────────────
export interface VideoChatMessage {
  id: string;
  type:
    | 'user'
    | 'ai'
    | 'loading'
    | 'storyboard'
    | 'storyboard_loading'
    /**
     * O storyboard FALHOU (tipicamente na kie.ai). Aparece no chat de imediato,
     * com o motivo real e um botão para tentar outra vez — em vez de um roteiro
     * de recurso que parecia um resultado.
     */
    | 'storyboard_error'
    /** O agente de vídeo está a analisar a imagem do storyboard. */
    | 'prompt_loading'
    | 'ai_prompt';
  prompt?: string;
  styleName?: string;
  duration?: string;
  videoUrl?: string;
  posterUrl?: string;
  baseImageUrl?: string;
  storyboard?: StoryboardData;
  /**
   * O que o agente de vídeo leu na imagem do storyboard (produto, marca, textos,
   * paleta). Serve para o utilizador confirmar que o prompt foi escrito a partir
   * do storyboard e não de metadados genéricos.
   */
  storyboardFacts?: {
    produto?: string;
    marca?: string;
    textos_na_imagem?: string[];
    paleta?: string;
    materiais?: string;
    pessoas?: string;
    cenario?: string;
  };
  /** `false` quando o prompt não cita nada do storyboard (aviso ao utilizador). */
  grounded?: boolean;
  /** Proporção do vídeo gerado — o player do chat respeita-a (9:16 ou 16:9). */
  videoAspectRatio?: '9:16' | '16:9';
  /** `true` quando o vídeo já está disponível na biblioteca de Mídias. */
  videoRegisteredInMedia?: boolean;
  /** Motivo legível da falha (mensagem do servidor, da kie.ai ou do browser). */
  errorText?: string;
  /** Detalhe técnico curto (código HTTP, serviço em falta), para diagnóstico. */
  errorDetail?: string;
  timestamp: Date | string;
}

export interface VideoChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
  agentId: string;
  messages: VideoChatMessage[];
  activeBaseImage?: string | null;
  activeStoryboard?: StoryboardData | null;
}

import {
  fetchRemoteChatSessions,
  pushRemoteChatSession,
  deleteRemoteChatSession,
  mergeChatSessions,
  sortSessionsByRecency,
  formatMessageTime,
} from '../lib/chatSessionSync';

/**
 * Chave de cache do histórico de vídeo — POR ORGANIZAÇÃO.
 *
 * ⛔ Era uma chave fixa (`nexora_video_chat_sessions_v1`) e o `localStorage` é
 * por navegador: uma conta nova abria o painel com os spots da conta que tinha
 * entrado antes, e o efeito de sincronização reenviava-os para o servidor como
 * se fossem dela. Sem organização na chave, o histórico de um cliente aparecia
 * noutro.
 */
const videoSessionsKey = (scope: string) =>
  `nexora_video_chat_sessions_v2:${(scope || 'sem-organizacao').replace(/[^A-Za-z0-9_-]/g, '_')}`;

/**
 * Imagem do storyboard, com estado de falha EXPLÍCITO.
 *
 * ⛔ Antes, um erro de carregamento substituía a imagem pela fotografia de
 * exemplo do agente (`selectedAgent.previewUrl`): o utilizador via uma imagem
 * que não era o seu storyboard, sem qualquer aviso. Aqui a falha é dita.
 */
const StoryboardImage: React.FC<{
  src: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
}> = ({ src, alt = 'Storyboard Visual', className, onClick }) => {
  const [failed, setFailed] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setFailed(false);
    setLoading(true);
  }, [src]);

  if (!src || failed) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-center p-6 min-h-[160px] bg-black/40">
        <Film className="w-6 h-6 text-amber-400" />
        <span className="text-xs font-bold text-slate-200">Imagem do storyboard indisponível</span>
        <span className="text-[10px] text-slate-400">
          Não foi possível carregar a imagem do servidor.
        </span>
        {src && (
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[#00E5FF] hover:underline mt-1"
            onClick={(e) => e.stopPropagation()}
          >
            Abrir URL diretamente ↗
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full flex items-center justify-center bg-black/40 min-h-[160px]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setFailed(true);
        }}
        onClick={onClick}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        loading="lazy"
      />
    </div>
  );
};

export function VideoGeneratorPage({
  onBack,
  onNavigate,
}: {
  onBack: () => void;
  onNavigate: (path: string) => void;
}) {
  const { currentOrganization, currentUser } = useSession();
  const orgId = currentOrganization?.id || '';
  /**
   * Escopo da cache local = ORGANIZAÇÃO real.
   * Usar um id fixo na cache era o que mostrava os spots de outra conta a quem acabou de a criar.
   */
  const videoStorageKey = useMemo(
    () => videoSessionsKey(currentOrganization?.id || ''),
    [currentOrganization?.id]
  );
  const userId = currentUser?.id || 'usr-1';
  const { showToast } = useToast();

  // ─── CARREGAR SESSÕES PERSISTENTES DO LOCALSTORAGE (DESTA ORGANIZAÇÃO) ─────
  const [sessions, setSessions] = useState<VideoChatSession[]>(() => {
    let savedSessions: VideoChatSession[] = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(videoSessionsKey(currentOrganization?.id || ''));
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            savedSessions = parsed.map((s: any) => ({
              ...s,
              messages: (s.messages || [])
                .filter(
                  (m: any) =>
                    m &&
                    m.type !== 'loading' &&
                    m.type !== 'storyboard_loading' &&
                    m.type !== 'prompt_loading'
                )
                .map((m: any) => ({
                  ...m,
                  timestamp: new Date(m.timestamp),
                })),
            }));
          }
        }
      } catch {}
    }

    const nonEmptySaved = savedSessions.filter((s) => s.messages && s.messages.length > 0);
    if (nonEmptySaved.length > 0) {
      return sortSessionsByRecency(nonEmptySaved);
    }

    const freshSession: VideoChatSession = {
      id: `session-video-${Date.now()}`,
      title: 'Novo Spot de Vídeo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      agentId: VIDEO_AGENTS[0].id,
      messages: [],
    };
    return [freshSession];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0]?.id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  // Salvar sessões no localStorage (chave da organização activa)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(videoStorageKey, JSON.stringify(sessions));
      } catch {}
    }
  }, [sessions, videoStorageKey]);

  // Carregar histórico do servidor na inicialização
  useEffect(() => {
    const scope = currentOrganization?.id;
    if (!scope) return;
    let activo = true;
    fetchRemoteChatSessions(scope, 'VIDEO').then((remotas) => {
      if (!activo || remotas.length === 0) return;
      setSessions((prev) => sortSessionsByRecency(mergeChatSessions(prev, remotas)));
    });
    return () => {
      activo = false;
    };
  }, [currentOrganization?.id]);

  // Sincroniza remotamente apenas a sessão ativa quando esta é modificada (evita loops e sobrescrita de datas em massa)
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const chatMessages = activeSession?.messages || [];

  useEffect(() => {
    if (!activeSession || !activeSession.messages || activeSession.messages.length === 0) return;
    const scope = currentOrganization?.id;
    if (!scope) return;
    const timer = setTimeout(() => {
      pushRemoteChatSession(activeSession, scope, userId, 'VIDEO');
    }, 1500);
    return () => clearTimeout(timer);
  }, [activeSession?.messages?.length, activeSession?.title, activeSession?.id, currentOrganization?.id, userId]);

  /** Chats recentes em cima — o chat ativo selecionado fica SEMPRE na primeira posição */
  const sessionsOrdenadas = useMemo(() => {
    const validas = sessions.filter(
      (s) => (s.messages && s.messages.length > 0) || s.id === activeSessionId
    );
    const sorted = sortSessionsByRecency(validas);

    // Garante que o chat ativo selecionado fique rigorosamente em 1º lugar na barra lateral
    const activeIdx = sorted.findIndex((s) => s.id === activeSessionId);
    if (activeIdx > 0) {
      const [activeItem] = sorted.splice(activeIdx, 1);
      sorted.unshift(activeItem);
    }
    return sorted;
  }, [sessions, activeSessionId]);

  // Form State
  const [baseImage, setBaseImage] = useState<string | null>(activeSession?.activeBaseImage || null);
  const [baseImageSource, setBaseImageSource] = useState<'upload' | 'library' | null>(null);
  const [prompt, setPrompt] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<VideoSpecialistAgent>(() => {
    const found = VIDEO_AGENTS.find((a) => a.id === activeSession?.agentId);
    return found || VIDEO_AGENTS[0];
  });
  const [selectedDuration, setSelectedDuration] = useState(VIDEO_DURATIONS[0]);
  const [motionDetail, setMotionDetail] = useState<'Standard' | 'Pro 60fps' | 'Cinematic 4K'>('Pro 60fps');

  // Storyboard & Video Generation States (controlados por sessão para não vazar entre chats)
  const [analyzingSessions, setAnalyzingSessions] = useState<Record<string, boolean>>({});
  const isAnalyzingStoryboard = !!analyzingSessions[activeSessionId];

  const [generatingSessions, setGeneratingSessions] = useState<Record<string, boolean>>({});
  const isGenerating = !!generatingSessions[activeSessionId];

  const [showStoryboardModal, setShowStoryboardModal] = useState(false);
  const [currentStoryboard, setCurrentStoryboard] = useState<StoryboardData | null>(activeSession?.activeStoryboard || null);
  const [editableOmniPrompt, setEditableOmniPrompt] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Sincroniza formulário e storyboard ao trocar de chat ativo
  useEffect(() => {
    const sess = sessions.find((s) => s.id === activeSessionId);
    if (sess) {
      setBaseImage(sess.activeBaseImage || null);
      setCurrentStoryboard(sess.activeStoryboard || null);
      const foundAgent = VIDEO_AGENTS.find((a) => a.id === sess.agentId) || VIDEO_AGENTS[0];
      setSelectedAgent(foundAgent);
    }
  }, [activeSessionId]);

  /**
   * CONFIGURAÇÃO DO VÍDEO — escolhida pelo utilizador depois de ver o storyboard.
   *
   * O fluxo passou a ser: storyboard criado → o utilizador define duração,
   * qualidade e orientação → aprova → o sistema escreve o prompt a partir do
   * storyboard e manda gerar o vídeo no Google Omni Flash (kie.ai).
   * Já não há passo manual de "gerar prompt".
   */
  const [videoConfig, setVideoConfig] = useState<{
    durationSeconds: number;
    resolution: '360p' | '720p' | '1080p';
    aspectRatio: '9:16' | '16:9';
  }>({ durationSeconds: 10, resolution: '1080p', aspectRatio: '9:16' });

  /** Job de vídeo em curso (kie.ai) — acompanhado por polling. */
  const [videoJob, setVideoJob] = useState<{
    jobId: string;
    status: 'processing' | 'completed' | 'failed';
    progressMessage: string;
    videoUrl?: string;
    error?: string;
    mediaRegistered?: boolean;
    config?: { durationSeconds: number; resolution: string; aspectRatio: string };
  } | null>(null);

  /**
   * Custos definidos pelo administrador (painel Creative AI → Modelos & Custos).
   * Servem para MOSTRAR o preço antes de gerar; a cobrança real é feita pelo
   * servidor no momento do débito. 0 = não cobra.
   */
  const [custosGeracao, setCustosGeracao] = useState<{
    storyboard: Record<string, number>;
    video: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    let ativo = true;
    fetch('/api/ai-credits/generation-costs')
      .then((r) => (r.ok ? r.json() : null))
      .then((dados) => {
        if (ativo && dados) setCustosGeracao(dados);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  const custoStoryboard =
    custosGeracao?.storyboard?.[selectedAgent.id] ?? custosGeracao?.storyboard?.['*'] ?? 0;
  const custoVideo =
    custosGeracao?.video?.[String(videoConfig.durationSeconds)] ?? custosGeracao?.video?.['*'] ?? 0;

  /**
   * Debita o custo da geração no livro-razão (feito pelo SERVIDOR).
   *
   * Devolve o `jobId` para que uma falha possa ser fechada com estorno. Se o
   * custo estiver a 0, o servidor regista o job sem criar transacção — o caminho
   * é o mesmo, para não haver dois fluxos de cobrança diferentes.
   */
  const cobrarGeracao = async (tipo: 'STORYBOARD' | 'VIDEO', styleId: string, duracao?: number) => {
    const res = await fetch('/api/ai-credits/generation/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: orgId,
        userId,
        type: tipo,
        styleId,
        durationSeconds: duracao,
        prompt: tipo === 'STORYBOARD' ? 'Storyboard de vídeo (5 cenas)' : 'Vídeo Omni Flash',
      }),
    });

    const dados = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(dados?.error || `Não foi possível cobrar a geração (HTTP ${res.status}).`);
    }
    return dados as { jobId: string; costInCredits: number; semCusto?: boolean };
  };

  /** Fecha a geração no livro-razão (devolve créditos se falhou). */
  const fecharGeracao = (jobId: string, status: 'COMPLETED' | 'FAILED', erro?: string) =>
    fetch(`/api/ai-credits/generation/${encodeURIComponent(jobId)}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, error: erro }),
    }).catch(() => {});

  const chatEndRef = useRef<HTMLDivElement>(null);
  /** Contentor rolável da lista de mensagens (ver o auto-scroll). */
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Modais
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showAgentsModal, setShowAgentsModal] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);

  // Edição de Título de Sessão
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Library
  const [libraryImages, setLibraryImages] = useState<AIGenerationJob[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  const loadLibraryImages = async () => {
    setLoadingLibrary(true);
    try {
      const data = await studioService.getRecentJobs(orgId, 40);
      /**
       * Esta galeria serve para ESCOLHER A IMAGEM DO PRODUTO (é o que o botão
       * «Usar Imagem» faz), por isso mostra APENAS IMAGENS (sem vídeos).
       */
      const imagens = data.filter((j) => {
        const url = (j.resultUrl || j.outputUrl || '').toLowerCase();
        const isVid =
          j.type === 'VIDEO' ||
          url.endsWith('.mp4') ||
          url.endsWith('.webm') ||
          url.endsWith('.mov') ||
          url.includes('/video/') ||
          url.includes('_video_');
        return Boolean(j.resultUrl || j.outputUrl) && !isVid;
      });
      setLibraryImages(imagens);
    } catch {}
    setLoadingLibrary(false);
  };

  useEffect(() => {
    loadLibraryImages();
  }, [orgId]);

  /**
   * Auto-scroll do chat, LIMITADO à lista de mensagens.
   */
  useEffect(() => {
    const scroller = chatScrollRef.current;
    if (!scroller) return;
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
  }, [chatMessages]);

  // Sincronizar sessão ativa quando troca e trazê-la para o topo
  const handleSelectSession = (session: VideoChatSession) => {
    setActiveSessionId(session.id);
    setBaseImage(session.activeBaseImage || null);
    setCurrentStoryboard(session.activeStoryboard || null);
    const foundAgent = VIDEO_AGENTS.find((a) => a.id === session.agentId) || VIDEO_AGENTS[0];
    setSelectedAgent(foundAgent);
    setPrompt('');
    setSessions((prev) =>
      prev.map((s) => (s.id === session.id ? { ...s, updatedAt: new Date().toISOString() } : s))
    );
  };

  // Criar Novo Chat de Vídeo (limpa sessões vazias órfãs e não duplica)
  const handleCreateNewSession = () => {
    if (activeSession && (!activeSession.messages || activeSession.messages.length === 0)) {
      setBaseImage(null);
      setBaseImageSource(null);
      setCurrentStoryboard(null);
      setPrompt('');
      return;
    }

    const nowIso = new Date().toISOString();
    const newSession: VideoChatSession = {
      id: `session-video-${Date.now()}`,
      title: 'Novo Spot de Vídeo',
      createdAt: nowIso,
      updatedAt: nowIso,
      agentId: selectedAgent.id,
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev.filter((s) => s.messages && s.messages.length > 0)]);
    setActiveSessionId(newSession.id);
    setBaseImage(null);
    setBaseImageSource(null);
    setCurrentStoryboard(null);
    setPrompt('');
    showToast('Novo Chat Aberto', 'Inicie a criação de um novo spot de vídeo.', 'info');
  };

  // Renomear Chat
  const handleStartEditSession = (e: React.MouseEvent, session: VideoChatSession) => {
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
      showToast('Nome Atualizado', 'Título do spot alterado com sucesso.', 'success');
    }
    setEditingSessionId(null);
  };

  const handleCancelEditSession = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  // Eliminar Sessão (apaga do cliente e do servidor definitivamente)
  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    deleteRemoteChatSession(sessionId);

    const filtered = sessions.filter((s) => s.id !== sessionId);
    if (filtered.length === 0) {
      const resetSession: VideoChatSession = {
        id: `session-video-${Date.now()}`,
        title: 'Novo Spot de Vídeo',
        createdAt: new Date().toISOString(),
        agentId: selectedAgent.id,
        messages: [],
      };
      setSessions([resetSession]);
      setActiveSessionId(resetSession.id);
      setBaseImage(null);
      setCurrentStoryboard(null);
      showToast('Spot Eliminado', 'Sessão removida do histórico.', 'info');
      return;
    }

    setSessions(filtered);
    if (activeSessionId === sessionId) {
      setActiveSessionId(filtered[0].id);
      setBaseImage(filtered[0].activeBaseImage || null);
      setCurrentStoryboard(filtered[0].activeStoryboard || null);
    }
    showToast('Spot Eliminado', 'Sessão removida do histórico.', 'info');
  };

  // ─── GERAÇÃO DO STORYBOARD EM IMAGEM (5 CENAS DE 2s • 10s TOTAL) ───────────
  /**
   * Cronómetro do storyboard.
   *
   * Existe porque a fila da kie.ai é imprevisível (medidos 108s e 223s): sem um
   * contador, o utilizador não distingue "está a gerar" de "encravou" e volta a
   * clicar — o que gera pedidos duplicados e ainda mais espera.
   */
  const [storyboardElapsed, setStoryboardElapsed] = useState(0);

  useEffect(() => {
    if (!isAnalyzingStoryboard) {
      setStoryboardElapsed(0);
      return;
    }
    const inicio = Date.now();
    const id = setInterval(() => setStoryboardElapsed(Math.round((Date.now() - inicio) / 1000)), 1000);
    return () => clearInterval(id);
  }, [isAnalyzingStoryboard]);

  const handleGenerateStoryboard = async (imageOverride?: string, customHint?: string) => {
    const targetImage = imageOverride || baseImage;
    if (!targetImage && !prompt.trim()) {
      showToast('Imagem ou Descrição Obrigatória', 'Carregue a imagem do produto para o modelo conceber o Storyboard de 5 cenas.', 'warning');
      return;
    }

    const userInput = customHint || prompt.trim() || `Criar Storyboard de 5 cenas (10s) para o produto com o ${selectedAgent.name}`;
    const loadingId = `sb-loading-${Date.now()}`;
    const currentSessionId = activeSessionId;

    const userMsg: VideoChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      prompt: userInput,
      styleName: selectedAgent.name,
      duration: '10s (5 cenas)',
      baseImageUrl: targetImage || undefined,
      timestamp: new Date(),
    };

    const loadingMsg: VideoChatMessage = {
      id: loadingId,
      type: 'storyboard_loading',
      styleName: selectedAgent.name,
      duration: '10s (5 cenas)',
      timestamp: new Date(),
    };

    // Atualiza mensagens da sessão ativa
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          const newTitle =
            s.title === 'Novo Spot de Vídeo' || s.title.startsWith('Novo Spot')
              ? userInput.length > 25
                ? userInput.substring(0, 23) + '...'
                : (userInput || `${selectedAgent.shortName} Produto`)
              : s.title;
          return {
            ...s,
            title: newTitle,
            updatedAt: new Date().toISOString(),
            activeBaseImage: targetImage || s.activeBaseImage,
            messages: [...s.messages, userMsg, loadingMsg],
          };
        }
        return s;
      })
    );

    setPrompt('');
    setAnalyzingSessions((prev) => ({ ...prev, [currentSessionId]: true }));

    /** Job do livro-razão desta geração de storyboard (para estornar se falhar). */
    let jobStoryboard: string | null = null;
    let erroStoryboard: string | undefined;

    try {
      // Cobrança do storyboard definida pelo administrador (0 = não cobra)
      const cobranca = await cobrarGeracao('STORYBOARD', selectedAgent.id);
      jobStoryboard = cobranca.jobId;

      /**
       * ⛔ O QUE ESTAVA ERRADO AQUI: o pedido era abortado aos 12 segundos.
       * O servidor tem de gerar a narrativa das 5 cenas (LLM) E a imagem do
       * storyboard (kie.ai), e essa imagem demora entre ~110s e mais de 220s
       * conforme a fila do serviço. O abort acontecia sempre antes de a imagem
       * existir: caía no `catch`, era montado um storyboard de recurso e o chat
       * mostrava a FOTOGRAFIA enviada pelo utilizador como se fosse o storyboard.
       *
       * Depois disso o limite passou a 300s — mas a kie.ai já mediu 223s numa
       * tarefa e, somando a narrativa, o total aproxima-se ou ultrapassa os 300s,
       * o que fazia o storyboard "falhar sempre". O limite tem de ficar ACIMA do
       * limite do servidor (10 minutos de polling): assim é sempre o servidor a
       * responder em primeiro lugar — com a imagem ou com o motivo real.
       */
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 720000);

      const res = await fetch('/api/creative-ai/motion/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          imageBase64OrUrl: targetImage || undefined,
          userDescription: userInput,
          motionStyleId: selectedAgent.id,
          durationSeconds: 10,
          aspectRatio: '9:16',
        }),
      });
      clearTimeout(timeoutId);

      let finalStoryboard: StoryboardData;
      /**
       * Aviso vindo do servidor quando o ROTEIRO saiu mas a IMAGEM do storyboard
       * falhou na kie.ai (HTTP 200 com `warning`). É mostrado no cartão do chat,
       * porque um storyboard sem imagem é um resultado incompleto — e o
       * utilizador tem de saber por quem esperar.
       */
      let avisoImagem: string | undefined;

      if (res.ok) {
        finalStoryboard = await res.json();
        avisoImagem = (finalStoryboard as any).warning || (finalStoryboard as any).image_error;
        if (!finalStoryboard.storyboard_image_url && !avisoImagem) {
          avisoImagem =
            'A imagem do storyboard não foi devolvida pelo motor de imagem (kie.ai). O roteiro das 5 cenas está pronto.';
        }
      } else {
        /**
         * ⛔ O QUE MUDOU AQUI: o servidor recusou o pedido (por exemplo a kie.ai
         * devolveu erro) e o chat mostrava na mesma um storyboard de recurso com
         * texto pré-escrito — parecia um resultado quando nada tinha sido gerado.
         * Agora o erro aparece no chat, com o motivo real e botão para repetir.
         */
        const detalhe = await res.json().catch(() => ({} as any));
        const motivo =
          detalhe?.error ||
          detalhe?.message ||
          (res.status === 504 || res.status === 408
            ? 'O motor de imagem demorou demasiado tempo a responder (kie.ai).'
            : `O motor de geração recusou o pedido (HTTP ${res.status}).`);

        throw Object.assign(new Error(motivo), {
          detalhe: `HTTP ${res.status} · /api/creative-ai/motion/generate-prompt`,
        });
      }

      // A imagem do storyboard só existe se o servidor a tiver gerado. Nunca se
      // substitui pela fotografia enviada pelo utilizador: era isso que fazia o
      // chat "mostrar o storyboard" antes de ele existir.
      if (activeSessionId === currentSessionId) {
        setCurrentStoryboard(finalStoryboard);
        setEditableOmniPrompt(finalStoryboard.omni_flash_prompt);
      }

      showToast(
        finalStoryboard.storyboard_image_url ? 'Storyboard Concebido' : 'Roteiro Concebido',
        finalStoryboard.storyboard_image_url
          ? 'Storyboard visual com 5 cenas gerado com sucesso.'
          : avisoImagem || 'O roteiro das 5 cenas está pronto, mas a imagem do storyboard não foi gerada.',
        finalStoryboard.storyboard_image_url ? 'success' : 'warning'
      );

      /**
       * Fecho no livro-razão: com imagem gerada é uma entrega concluída; sem
       * imagem o storyboard não foi entregue e os créditos são devolvidos.
       */
      if (jobStoryboard) {
        if (finalStoryboard.storyboard_image_url) {
          await fecharGeracao(jobStoryboard, 'COMPLETED');
        } else {
          erroStoryboard = avisoImagem || 'A imagem do storyboard não foi gerada.';
          await fecharGeracao(jobStoryboard, 'FAILED', erroStoryboard);
        }
        jobStoryboard = null;
      }

      // Salva o storyboard gerado no repositório para aparecer na Galeria e em Recentes no Dashboard
      if (finalStoryboard.storyboard_image_url) {
        try {
          const { aiGenerationJobRepository } = await import('../../../repositories/aiGenerationJobRepository');
          await aiGenerationJobRepository.create({
            id: `sb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            organizationId: orgId,
            userId: userId || 'usr-1',
            type: 'STORYBOARD',
            prompt: `Storyboard Visual (5 Cenas) • ${finalStoryboard.product_identified || selectedAgent.shortName}`,
            model: 'Kie.ai Storyboard (GPT Image)',
            parameters: {
              aspectRatio: '9:16',
              resolution: '2K',
              styleId: selectedAgent.id,
              agentName: selectedAgent.name,
              productIdentified: finalStoryboard.product_identified,
            },
            costInCredits: custoStoryboard,
            status: 'COMPLETED',
            outputUrl: finalStoryboard.storyboard_image_url,
            resultUrl: finalStoryboard.storyboard_image_url,
            createdAt: new Date().toISOString(),
          });
        } catch (jobErr) {
          console.warn('⚠️ [VideoGeneratorPage] Erro ao registrar storyboard na galeria:', jobErr);
        }
      }

      // Atualiza a sessão substituindo o loading bubble pelo Card de Storyboard
      // e auto-titula o chat com o produto identificado pelo agente ou tema do storyboard
      const autoTitle =
        finalStoryboard.product_identified
          ? `${finalStoryboard.product_identified.slice(0, 24)} · ${selectedAgent.shortName}`
          : finalStoryboard.visual_style
          ? `${finalStoryboard.visual_style.slice(0, 24)} · ${selectedAgent.shortName}`
          : userInput
          ? `${userInput.slice(0, 24)} · ${selectedAgent.shortName}`
          : `Spot ${selectedAgent.shortName}`;

      let sessionComStoryboard: VideoChatSession | null = null;

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === currentSessionId) {
            const filtered = s.messages.filter((m) => m.id !== loadingId);
            const shouldRenameTitle =
              s.title === 'Novo Spot de Vídeo' || s.title.startsWith('Novo Spot') || !s.title;
            const updated: VideoChatSession = {
              ...s,
              title: shouldRenameTitle ? autoTitle : s.title,
              updatedAt: new Date().toISOString(),
              activeStoryboard: finalStoryboard,
              messages: [
                ...filtered,
                {
                  id: `storyboard-${Date.now()}`,
                  type: 'storyboard' as const,
                  prompt: finalStoryboard.omni_flash_prompt,
                  styleName: selectedAgent.name,
                  duration: '10s (5 Cenas)',
                  baseImageUrl: targetImage || finalStoryboard.storyboard_image_url,
                  storyboard: finalStoryboard,
                  errorText: finalStoryboard.storyboard_image_url ? undefined : avisoImagem,
                  timestamp: new Date(),
                },
              ],
            };
            sessionComStoryboard = updated;
            return updated;
          }
          return s;
        })
      );

      if (sessionComStoryboard) {
        pushRemoteChatSession(sessionComStoryboard, currentOrganization?.id || '', userId, 'VIDEO');
      }
    } catch (erro: any) {
      /**
       * FALHA REAL — o storyboard não foi gerado.
       *
       * ⛔ Antes: era montado aqui um "roteiro de recurso" com texto pré-escrito e
       * colocado no chat como se fosse o resultado, com um aviso passageiro num
       * toast. O utilizador ficava sem saber que a kie.ai falhou, e o cartão
       * seguinte (com botões de render) sugeria que havia um storyboard.
       *
       * Agora: nada é inventado. O chat recebe uma mensagem de ERRO com o motivo
       * real (servidor/kie.ai), o detalhe técnico e um botão para tentar de novo.
       */
      const ehTimeout = erro?.name === 'AbortError';
      const motivo = ehTimeout
        ? 'A geração do storyboard excedeu 5 minutos sem resposta (kie.ai).'
        : erro?.message || 'Não foi possível gerar o storyboard.';
      const detalhe =
        erro?.detalhe ||
        (ehTimeout ? 'Tempo limite do pedido esgotado no browser' : 'Sem resposta do motor de geração');

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== currentSessionId) return s;
          const filtered = s.messages.filter((m) => m.id !== loadingId);
          const jaExiste = filtered.some(
            (m) => m.type === 'storyboard_error' && m.errorText === motivo
          );
          if (jaExiste) return { ...s, messages: filtered };

          return {
            ...s,
            updatedAt: new Date().toISOString(),
            messages: [
              ...filtered,
              {
                id: `storyboard-error-${Date.now()}`,
                type: 'storyboard_error' as const,
                prompt: userInput,
                styleName: selectedAgent.name,
                duration: '10s (5 Cenas)',
                baseImageUrl: targetImage || undefined,
                errorText: motivo,
                errorDetail: detalhe,
                timestamp: new Date(),
              },
            ],
          };
        })
      );

      showToast('Falha ao gerar o storyboard', motivo, 'error');

      // Nada foi entregue: devolve os créditos do storyboard.
      if (jobStoryboard) await fecharGeracao(jobStoryboard, 'FAILED', motivo);
    } finally {
      setAnalyzingSessions((prev) => {
        const next = { ...prev };
        delete next[currentSessionId];
        return next;
      });
    }
  };

  /**
   * Passo 1 do novo fluxo: escrever o prompt do vídeo a partir do STORYBOARD.
   *
   * Deixou de ser um botão visível. O prompt é escrito automaticamente quando o
   * utilizador aprova o storyboard — a única acção que lhe resta é definir a
   * configuração e aprovar.
   */
  const gerarPromptDoVideo = async (
    sb: StoryboardData,
    config: { durationSeconds: number; resolution: string; aspectRatio: '9:16' | '16:9' }
  ): Promise<{ prompt: string; facts?: VideoChatMessage['storyboardFacts']; grounded?: boolean }> => {
    const cenas = [
      sb.motion_breakdown?.scene1_hook,
      sb.motion_breakdown?.scene2_detail,
      sb.motion_breakdown?.scene3_dynamic,
      sb.motion_breakdown?.scene4_benefit,
      sb.motion_breakdown?.scene5_cta,
    ].filter(Boolean) as string[];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000);

    try {
      const res = await fetch('/api/creative-ai/video/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          storyboardImageUrl: sb.storyboard_image_url || '',
          referenceImageUrl: baseImage || '',
          videoAgentId: selectedAgent.id,
          videoAgentName: selectedAgent.name,
          motionDirective: selectedAgent.motionDirective,
          productIdentified: sb.product_identified,
          scenes: cenas,
          onScreenTexts: sb.on_screen_texts || [],
          visualConsistencyRules: sb.visual_consistency_rules,
          // A configuração escolhida entra JÁ no prompt (duração e orientação):
          // o Omni Flash recebe depois a mesma configuração no pedido de vídeo.
          durationSeconds: config.durationSeconds,
          aspectRatio: config.aspectRatio,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const prompt: string = data.video_prompt;
      if (!prompt || prompt.length < 60) throw new Error('O agente devolveu um prompt vazio.');

      return { prompt, facts: data.storyboard_facts || undefined, grounded: data.grounded };
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // ─── APROVAR O STORYBOARD E CRIAR O VÍDEO (GOOGLE OMNI FLASH) ───────────────
  /**
   * Fluxo final, sem passos manuais:
   *   1. o utilizador define duração, qualidade e orientação;
   *   2. aprova → o sistema escreve o prompt a partir do storyboard;
   *   3. o vídeo é criado na kie.ai com ESSA configuração;
   *   4. o chat acompanha o progresso e mostra o vídeo no fim;
   *   5. o vídeo fica automaticamente na biblioteca de Mídias do Nexora Sign.
   *
   * ⛔ O que existia antes: um `handleRenderVideoFromPrompt` que escolhia um vídeo
   * de demonstração aleatório (SAMPLE_VIDEOS) e o apresentava no chat como se
   * fosse o spot gerado. Nada era criado e o utilizador via um vídeo de stock.
   */
  const handleApproveAndCreateVideo = async (sb?: StoryboardData) => {
    const alvo = sb || currentStoryboard;
    if (!alvo) return;

    if (!alvo.storyboard_image_url) {
      showToast(
        'Gere a imagem do storyboard primeiro',
        'O vídeo é criado a partir do storyboard. Use «Gerar imagem» no cartão e aprove em seguida.',
        'warning'
      );
      return;
    }

    const config = { ...videoConfig };
    const currentSessionId = activeSessionId;
    const loadingId = `video-loading-${Date.now()}`;

    const actualizarBolha = (texto: string) =>
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: s.messages.map((m) => (m.id === loadingId ? { ...m, prompt: texto } : m)) }
            : s
        )
      );

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? {
              ...s,
              updatedAt: new Date().toISOString(),
              messages: [
                ...s.messages,
                {
                  id: loadingId,
                  type: 'loading' as const,
                  prompt: 'A aprovar o storyboard e a escrever o prompt do vídeo…',
                  styleName: selectedAgent.name,
                  duration: `${config.durationSeconds}s`,
                  timestamp: new Date(),
                },
              ],
            }
          : s
      )
    );

    setGeneratingSessions((prev) => ({ ...prev, [currentSessionId]: true }));
    setVideoJob({ jobId: '', status: 'processing', progressMessage: 'A escrever o prompt a partir do storyboard…' });

    /** Job do livro-razão desta criação (para estornar se falhar). */
    let jobFinanceiro: string | null = null;

    try {
      // 0) Cobrança definida pelo administrador (0 = não cobra)
      const cobranca = await cobrarGeracao('VIDEO', selectedAgent.id, config.durationSeconds);
      jobFinanceiro = cobranca.jobId;

      // 1) Prompt escrito a partir da imagem do storyboard
      const { prompt, facts, grounded } = await gerarPromptDoVideo(alvo, config);
      actualizarBolha('Prompt escrito. A enviar o vídeo para o Google Omni Flash…');

      // 2) Criação do vídeo com a configuração escolhida
      const criarRes = await fetch('/api/creative-ai/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          storyboardImageUrl: alvo.storyboard_image_url,
          durationSeconds: config.durationSeconds,
          resolution: config.resolution,
          aspectRatio: config.aspectRatio,
          organizationId: orgId,
          userId,
          userName: currentUser?.name || '',
        }),
      });

      const criado = await criarRes.json().catch(() => ({}));
      if (!criarRes.ok || !criado?.jobId) {
        throw new Error(criado?.error || `Não foi possível iniciar o vídeo (HTTP ${criarRes.status}).`);
      }

      setVideoJob({
        jobId: criado.jobId,
        status: 'processing',
        progressMessage: criado.message || 'Vídeo enviado para o Google Omni Flash…',
        config: criado.config,
      });
      actualizarBolha('O Omni Flash está a compor o vídeo. Pode continuar no painel — avisamos aqui.');

      // 3) Acompanhar até concluir (o vídeo demora minutos)
      const inicio = Date.now();
      const LIMITE_MS = 20 * 60 * 1000;
      let concluido: any = null;

      while (Date.now() - inicio < LIMITE_MS) {
        await new Promise((r) => setTimeout(r, 5000));

        const estadoRes = await fetch(`/api/creative-ai/video/jobs/${criado.jobId}`);
        if (!estadoRes.ok) continue;

        const estado = await estadoRes.json();
        setVideoJob({
          jobId: estado.jobId,
          status: estado.status,
          progressMessage: estado.progressMessage,
          videoUrl: estado.videoUrl,
          error: estado.error,
          mediaRegistered: estado.mediaRegistered,
          config: estado.config,
        });

        if (estado.progressMessage) actualizarBolha(estado.progressMessage);

        if (estado.status === 'completed') {
          concluido = estado;
          break;
        }
        if (estado.status === 'failed') {
          throw new Error(estado.error || 'O motor não devolveu nenhum vídeo.');
        }
      }

      if (!concluido?.videoUrl) {
        throw new Error('O vídeo excedeu 20 minutos sem ficar pronto. Verifique novamente dentro de instantes.');
      }

      // 4) Garantir publicação na Biblioteca de Mídias (Nexora Sign) para Anunciante e Parceiro
      let mediaPublicada = Boolean(concluido.mediaRegistered);
      try {
        const { contentRepository } = await import('../../../repositories/contentRepository');
        const mediaId = `cnt-video-${criado.jobId.replace(/[^a-zA-Z0-9-]/g, '')}`;
        await contentRepository.create({
          id: mediaId,
          organizationId: orgId,
          name: `Vídeo IA · ${selectedAgent.shortName} · ${config.durationSeconds}s ${config.resolution}`,
          type: 'VIDEO',
          status: 'READY',
          fileUrl: concluido.videoUrl,
          thumbnailUrl: alvo.storyboard_image_url || concluido.videoUrl,
          duration: config.durationSeconds,
          aspectRatio: config.aspectRatio,
          orientation: config.aspectRatio === '16:9' ? 'LANDSCAPE' : 'PORTRAIT',
          resolution: config.resolution === '4K' ? '3840x2160 (4K)' : '1080x1920 (Full HD)',
          tags: ['Creative AI', 'Vídeo', selectedAgent.shortName, 'DOOH'],
          folderId: 'fld-creative-ai',
          folderName: 'Creative AI Studio',
          metadata: {
            source: 'creative-ai-video',
            agentId: selectedAgent.id,
            jobId: criado.jobId,
            prompt,
          } as any,
        });
        mediaPublicada = true;
      } catch (repoErr) {
        console.warn('⚠️ [VideoGeneratorPage] Erro ao registrar vídeo no repositório de conteúdo:', repoErr);
      }

      // Salva o vídeo gerado no repositório para aparecer na Galeria e em Recentes no Dashboard
      try {
        const { aiGenerationJobRepository } = await import('../../../repositories/aiGenerationJobRepository');
        await aiGenerationJobRepository.create({
          id: criado.jobId || `video-${Date.now()}`,
          organizationId: orgId,
          userId: userId || 'usr-1',
          type: 'VIDEO',
          prompt: `Spot de Vídeo (${config.durationSeconds}s) • ${selectedAgent.shortName} • ${alvo.product_identified || ''}`,
          model: 'Google Gemini Omni Flash 1.1',
          parameters: {
            aspectRatio: config.aspectRatio,
            resolution: config.resolution,
            durationSeconds: config.durationSeconds,
            styleId: selectedAgent.id,
            agentName: selectedAgent.name,
            storyboardImageUrl: alvo.storyboard_image_url,
          },
          costInCredits: custoVideo,
          status: 'COMPLETED',
          outputUrl: concluido.videoUrl,
          resultUrl: concluido.videoUrl,
          createdAt: new Date().toISOString(),
        });
      } catch (repoErr2) {
        console.warn('⚠️ [VideoGeneratorPage] Erro ao registrar vídeo na galeria:', repoErr2);
      }

      // 5) Mostrar o vídeo no chat
      const newVideoMsg: VideoChatMessage = {
        id: `ai-video-${Date.now()}`,
        type: 'ai' as const,
        prompt,
        styleName: `${selectedAgent.name} • Omni Flash`,
        duration: `${config.durationSeconds}s (${config.resolution})`,
        videoUrl: concluido.videoUrl,
        posterUrl: alvo.storyboard_image_url || concluido.videoUrl,
        storyboard: alvo,
        storyboardFacts: facts,
        grounded,
        videoAspectRatio: config.aspectRatio,
        videoRegisteredInMedia: mediaPublicada,
        timestamp: new Date(),
      };

      let sessionComVideo: VideoChatSession | null = null;

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === currentSessionId) {
            const updated: VideoChatSession = {
              ...s,
              updatedAt: new Date().toISOString(),
              messages: [
                ...s.messages.filter((m) => m.id !== loadingId),
                newVideoMsg,
              ],
            };
            sessionComVideo = updated;
            return updated;
          }
          return s;
        })
      );

      // Garante que a sessão atual permaneça selecionada e ativa com o vídeo visível
      setActiveSessionId(currentSessionId);

      // PUSH IMEDIATO ao servidor para persistir o vídeo gerado e evitar sobrescrita por versões anteriores
      if (sessionComVideo) {
        pushRemoteChatSession(sessionComVideo, currentOrganization?.id || '', userId, 'VIDEO');
      }

      showToast(
        'Vídeo criado!',
        'O spot está pronto no chat e já disponível na Biblioteca do Nexora Sign para publicação.',
        'success'
      );

      // Fecha a geração no livro-razão (sem estorno: foi concluída)
      if (jobFinanceiro) await fecharGeracao(jobFinanceiro, 'COMPLETED');
    } catch (e: any) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                updatedAt: new Date().toISOString(),
                messages: [
                  ...s.messages.filter((m) => m.id !== loadingId),
                  {
                    id: `video-error-${Date.now()}`,
                    type: 'storyboard_error' as const,
                    prompt: 'Criação do vídeo',
                    styleName: `${selectedAgent.name} • Omni Flash`,
                    duration: `${config.durationSeconds}s`,
                    errorText: e?.message || 'Não foi possível criar o vídeo.',
                    errorDetail: `kie.ai · google/gemini-omni-flash-1-1 · ${config.durationSeconds}s · ${config.resolution} · ${config.aspectRatio}`,
                    timestamp: new Date(),
                  },
                ],
              }
            : s
        )
      );

      setVideoJob((prev) => (prev ? { ...prev, status: 'failed', error: e?.message } : null));
      showToast('Erro ao criar o vídeo', e?.message || 'Tente novamente.', 'error');

      // Devolve os créditos da geração que falhou (o servidor é idempotente:
      // se o motor já tiver fechado o job, não devolve duas vezes).
      if (jobFinanceiro) await fecharGeracao(jobFinanceiro, 'FAILED', e?.message);
    } finally {
      setGeneratingSessions((prev) => {
        const next = { ...prev };
        delete next[currentSessionId];
        return next;
      });
      setVideoJob(null);
    }
  };

  /**
   * Abre no chat um vídeo já gerado (vindo da galeria).
   *
   * O vídeo é acrescentado como mensagem do tipo `ai`, exactamente como o
   * resultado de uma geração — assim fica reproduzível, descarregável e visível
   * no histórico da conversa.
   */
  const handleUseLibraryVideo = (job: AIGenerationJob) => {
    const url = job.resultUrl || job.outputUrl;
    if (!url) return;

    const currentSessionId = activeSessionId;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? {
              ...s,
              updatedAt: new Date().toISOString(),
              messages: [
                ...s.messages,
                {
                  id: `ai-video-galeria-${job.id}`,
                  type: 'ai' as const,
                  prompt: job.prompt || 'Vídeo gerado anteriormente',
                  styleName: job.parameters?.styleId || 'Omni Flash',
                  duration: job.parameters?.durationSeconds
                    ? `${job.parameters.durationSeconds}s${job.parameters.resolution ? ` (${job.parameters.resolution})` : ''}`
                    : 'Vídeo',
                  videoUrl: url,
                  videoAspectRatio: job.parameters?.aspectRatio === '16:9' ? '16:9' : '9:16',
                  timestamp: new Date(),
                },
              ],
            }
          : s
      )
    );

    setShowGalleryModal(false);
    showToast('Vídeo carregado no chat', 'Pode visualizar e descarregar a partir da conversa.', 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target?.result as string;
        setBaseImage(dataUrl);
        setBaseImageSource('upload');
        setSessions((prev) =>
          prev.map((s) => (s.id === activeSessionId ? { ...s, activeBaseImage: dataUrl } : s))
        );
        showToast('Foto do Produto Anexada', 'Clique em "Gerar Storyboard Visual (5 Cenas)" para analisar o produto.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectFromLibrary = (job: AIGenerationJob) => {
    const url = job.resultUrl || job.outputUrl;
    if (url) {
      setBaseImage(url);
      setBaseImageSource('library');
      setShowGalleryModal(false);
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, activeBaseImage: url } : s))
      );
      showToast('Foto do Produto Vinculada', 'Imagem vinculada da galeria.', 'info');
    }
  };

  const handleAgentChange = (agent: VideoSpecialistAgent) => {
    setSelectedAgent(agent);
    setShowAgentsModal(false);
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, agentId: agent.id } : s))
    );
    showToast('Agente Atualizado', `Modelo alterado para ${agent.name}.`, 'info');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerateStoryboard();
    }
  };

  const copyToClipboard = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
      showToast('Copiado!', 'Prompt copiado para a área de transferência.', 'success');
    } catch {
      showToast('Erro ao copiar', 'Copie o texto manualmente.', 'warning');
    }
  };

  const estimatedCost = studioService.estimateCost('VIDEO', {
    aspectRatio: '9:16',
    style: selectedAgent.id,
    duration: '10',
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

      {/* ─── SIDEBAR LATERAL COM HISTÓRICO DE SPOTS DE VÍDEO (ESTILO CHATGPT) ─── */}
      <aside
        className={`h-full border-r border-white/[0.06] bg-[#080D1A]/95 backdrop-blur-2xl flex flex-col transition-all duration-300 shrink-0 fixed md:relative top-0 bottom-0 left-0 z-40 md:z-20 ${
          isSidebarOpen
            ? 'w-72 sm:w-80 shadow-2xl md:shadow-none translate-x-0'
            : 'w-0 -translate-x-full md:translate-x-0 border-none overflow-hidden'
        }`}
      >
        {/* Topo da Sidebar: Botão Novo Spot */}
        <div className="p-3 border-b border-white/[0.06] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCreateNewSession}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-[#00E5FF]/15 hover:from-amber-500/25 hover:to-[#00E5FF]/25 border border-amber-500/30 text-xs font-bold text-amber-300 transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.1)] active:scale-95"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Novo Spot de Vídeo</span>
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

        {/* Lista de Sessões Salvas */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          <span className="text-[10px] font-mono text-slate-500 uppercase px-3 py-1.5 block tracking-wider">
            Spots Anteriores
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
                    handleSelectSession(session);
                  }
                }}
                onDoubleClick={(e) => handleStartEditSession(e, session)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#10172A] border border-amber-500/40 text-amber-300 font-bold shadow-md'
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
                      className="flex-1 bg-[#060A14] border border-amber-500/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveSessionTitle(session.id)}
                      className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 cursor-pointer"
                      title="Salvar"
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
                      <Film className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
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
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-amber-300 hover:bg-white/10 transition-all text-slate-500 cursor-pointer"
                        title="Renomear"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-rose-400 hover:bg-white/10 transition-all text-slate-500 cursor-pointer"
                        title="Eliminar"
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
          <Zap className="w-3 h-3 text-[#00E5FF]" />
          <span>Google Omni Flash (10s • 60fps)</span>
        </div>
      </aside>

      {/* ─── ÁREA DO CHAT PRINCIPAL ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">

        {/* Header do Chat */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0 bg-[#080D1A]/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer mr-1"
                title="Abrir histórico de spots"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/20 to-[#00E5FF]/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
              <VideoIcon className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white font-display">Estúdio de Vídeo IA</h1>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[9px] font-mono font-bold text-[#00E5FF]">
                  <Zap className="w-2.5 h-2.5" /> {selectedAgent.name}
                </span>
              </div>
              {/* Status dinâmico: mostra que está a gerar vídeo ou storyboard */}
              {isGenerating ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                  <p className="text-[10px] text-amber-300 font-semibold animate-pulse">
                    A gerar vídeo… {videoJob?.progressMessage ? `(${videoJob.progressMessage})` : 'pode demorar alguns minutos'}
                  </p>
                </div>
              ) : isAnalyzingStoryboard ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Loader2 className="w-3 h-3 animate-spin text-[#00E5FF]" />
                  <p className="text-[10px] text-[#00E5FF] font-semibold animate-pulse">
                    A gerar storyboard… aguarde
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400">Storyboard de 5 Cenas (2s cada) • Google Omni Flash 60fps</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Badge de geração em curso */}
            {isGenerating && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[9px] font-bold text-amber-300 animate-pulse">
                <Film className="w-3 h-3" />
                Vídeo em Progresso
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowAgentsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-200 transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-bold">{selectedAgent.shortName}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* ─── STREAM DE MENSAGENS DO CHAT ─────────────────────────────────── */}
        <div ref={chatScrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar">

          {/* Boas-vindas quando o chat está vazio */}
          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-5 py-8 animate-in fade-in duration-300">
              <div className="relative">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-[#00E5FF]/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shadow-[0_0_40px_rgba(245,158,11,0.12)]">
                  <Film className="w-7 h-7" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-[#00E5FF] flex items-center justify-center">
                  <Zap className="w-2.5 h-2.5 text-slate-950" />
                </div>
              </div>

              <div className="space-y-2 max-w-md">
                <h2 className="text-base font-extrabold text-white font-display">
                  Direção de Vídeo IA & Storyboard (10s • 5 Cenas)
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Carregue a foto do seu produto. O agente especialista divide o vídeo em <strong>5 cenas de 2 segundos cada</strong>, gera a imagem visual do storyboard com <strong>GPT-Image</strong> e formula o prompt para o <strong>Google Omni Flash</strong>.
                </p>
              </div>

              {/* Ações de Início Rápido */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <label className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-dashed border-[#00E5FF]/40 hover:border-[#00E5FF] bg-[#00E5FF]/[0.04] hover:bg-[#00E5FF]/[0.08] transition-all cursor-pointer text-xs font-semibold text-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.1)]">
                  <Upload className="w-4 h-4" />
                  <span>Carregar Foto do Produto</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={() => { loadLibraryImages(); setShowGalleryModal(true); }}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] transition-all cursor-pointer text-xs font-medium text-slate-300"
                >
                  <FolderHeart className="w-4 h-4 text-pink-400" />
                  <span>Escolher da Galeria IA</span>
                </button>
              </div>

              {/* Seleção Rápida dos 3 Agentes de Vídeo */}
              <div className="pt-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2 block">
                  Modelos Especialistas em Vídeo
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-xl">
                  {VIDEO_AGENTS.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => handleAgentChange(agent)}
                      className={`relative rounded-xl overflow-hidden h-24 border transition-all cursor-pointer group text-left ${
                        selectedAgent.id === agent.id
                          ? 'border-[#00E5FF] ring-1 ring-[#00E5FF]'
                          : 'border-white/[0.08] hover:border-[#00E5FF]/50'
                      }`}
                    >
                      <img src={agent.previewUrl} alt={agent.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <span className="text-[10px] font-bold text-white block">{agent.shortName}</span>
                        <span className="text-[8px] text-[#00E5FF] font-mono block">{agent.badge}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Renderização das Mensagens */}
          {chatMessages.map((msg) => {
            if (msg.type === 'user') {
              return (
                <div key={msg.id} className="flex justify-end gap-3 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="max-w-[70%] space-y-1.5">
                    <div className="flex justify-end gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[9px] font-mono text-amber-300 font-bold">
                        {msg.styleName}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-[9px] font-mono text-slate-300">
                        {msg.duration}
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

            if (msg.type === 'storyboard_loading') {
              return (
                <div key={msg.id} className="flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500/40 to-[#00E5FF]/40 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                    <Clapperboard className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div className="bg-[#10172A] border border-amber-500/30 rounded-[20px] rounded-tl-sm px-5 py-4 flex items-center gap-3 shadow-lg">
                    <div className="w-6 h-6 rounded-full border-2 border-amber-400/40 border-t-amber-400 animate-spin" />
                    <div className="space-y-0.5">
                      <span className="text-xs text-amber-300 font-bold block flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#00E5FF]" />
                        A conceber Storyboard Visual de 5 Cenas com GPT-Image (10s)...
                      </span>
                      {/**
                       * A fila da kie.ai varia muito: a mesma imagem já demorou 108s
                       * e 223s. Prometer "1 a 2 minutos" fazia o utilizador pensar
                       * que tinha falhado. O contador mostra que está a andar.
                       */}
                      <span className="text-[10px] text-slate-400 block">
                        Análise do produto, narrativa das 5 cenas e renderização dos quadros.
                        A fila da kie.ai pode levar de 2 a 8 minutos.
                      </span>
                      <span className="text-[10px] font-mono text-amber-300/90 block">
                        ⏱️ {storyboardElapsed}s a aguardar
                        {storyboardElapsed > 240 ? ' — fila cheia, continue a aguardar' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            if (msg.type === 'prompt_loading') {
              return (
                <div key={msg.id} className="flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00E5FF]/40 to-purple-500/40 border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF] shrink-0 shadow-[0_0_15px_rgba(0,229,255,0.25)]">
                    <VideoIcon className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div className="bg-[#10172A] border border-[#00E5FF]/30 rounded-[20px] rounded-tl-sm px-5 py-4 flex items-center gap-3 shadow-lg">
                    <div className="w-6 h-6 rounded-full border-2 border-[#00E5FF]/40 border-t-[#00E5FF] animate-spin" />
                    <div className="space-y-0.5">
                      <span className="text-xs text-[#00E5FF] font-bold block flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        O agente de vídeo está a analisar a imagem do storyboard...
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Leitura das 5 cenas e escrita do prompt de motion graphics dinâmico com final resolvido
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            /**
             * ERRO DO STORYBOARD — aparece no chat assim que a geração falha.
             * Nada é inventado: mostra o motivo real, o detalhe técnico e um botão
             * para tentar outra vez, com a mesma imagem e a mesma descrição.
             */
            if (msg.type === 'storyboard_error') {
              return (
                <div key={msg.id} className="flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500/40 to-amber-500/30 border border-rose-400/50 flex items-center justify-center text-rose-300 shrink-0 shadow-[0_0_15px_rgba(244,63,94,0.25)]">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="max-w-[90%] space-y-3 bg-[#1A1016] border border-rose-500/40 rounded-[22px] rounded-tl-sm p-4 text-slate-200">
                    <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-[9px] font-mono font-bold text-rose-300">
                        ⛔ Storyboard não gerado
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {msg.styleName} • 10s (5 cenas)
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-white leading-relaxed">{msg.errorText}</p>

                    {msg.errorDetail && (
                      <p className="text-[10px] text-slate-400 font-mono break-all">{msg.errorDetail}</p>
                    )}

                    <ul className="text-[11px] text-slate-400 space-y-1 leading-relaxed">
                      <li>• Nenhuma imagem foi cobrada: sem storyboard, não há consumo nesta tentativa.</li>
                      <li>• A fotografia do produto continua anexada — não precisa de a carregar outra vez.</li>
                      <li>• Se o erro mencionar a kie.ai, é o serviço de imagem que recusou; repetir costuma resolver.</li>
                    </ul>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleGenerateStoryboard(msg.baseImageUrl || baseImage || undefined, msg.prompt)}
                        disabled={isAnalyzingStoryboard}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-extrabold text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        {isAnalyzingStoryboard ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        <span>Tentar novamente</span>
                      </button>

                      {currentStoryboard?.storyboard_image_url && (
                        <button
                          type="button"
                          onClick={() => setShowStoryboardModal(true)}
                          className="px-3.5 py-2.5 rounded-xl border border-white/10 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          Ver último storyboard
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            if (msg.type === 'storyboard' && msg.storyboard) {
              const sb = msg.storyboard;
              // Só a imagem GERADA é que é o storyboard. A fotografia enviada pelo
              // utilizador nunca ocupa este lugar (era o que fazia parecer que o
              // storyboard existia antes de ser gerado).
              const sbImg =
                sb.storyboard_image_url ||
                (sb as any).storyboardImageUrl ||
                (sb as any).imageUrl ||
                (sb as any).image;

              return (
                <div key={msg.id} className="flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500/30 to-[#00E5FF]/30 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    <Clapperboard className="w-4 h-4" />
                  </div>
                  <div className="max-w-[90%] space-y-3 bg-[#10172A] border border-amber-500/30 rounded-[22px] rounded-tl-sm p-4 text-slate-200">
                    <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[9px] font-mono font-bold text-amber-300">
                          🎬 Storyboard Concebido (5 Cenas • 10s)
                        </span>
                        <span className="text-xs font-bold text-white truncate max-w-[200px]">
                          {sb.product_identified}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400">{sb.visual_style}</span>
                    </div>

                    {/* Imagem do Storyboard Visual com os Quadros do Vídeo */}
                    {sbImg ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-[#00E5FF] uppercase tracking-wider flex items-center gap-1.5">
                            <Film className="w-3 h-3" />
                            <span>Composição Visual do Storyboard (5 Cenas)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setPreviewImageUrl(sbImg)}
                            className="text-[10px] text-slate-400 hover:text-[#00E5FF] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ver em Tela Cheia</span>
                          </button>
                        </div>

                        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/60 shadow-lg cursor-pointer group">
                          <StoryboardImage
                            src={sbImg}
                            onClick={() => setPreviewImageUrl(sbImg)}
                            className="w-full max-h-[460px] object-contain group-hover:scale-[1.02] transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end justify-between p-3 pointer-events-none">
                            <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" /> Storyboard com 5 Cenas de 2s
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-black/30 border border-amber-500/30 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-300 shrink-0">
                          <Film className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-white block">Roteiro de 5 Cenas pronto — imagem do storyboard não gerada</span>
                          {/**
                           * Motivo real devolvido pelo motor (kie.ai): sem isto, o
                           * utilizador só sabia que "não foi gerada" e repetia às
                           * cegas. `msg.errorText` traz a resposta do serviço.
                           */}
                          <span className="text-[10px] text-amber-200/90 block mt-0.5 leading-relaxed">
                            {msg.errorText ||
                              'O motor de imagem (kie.ai) não devolveu a imagem do storyboard.'}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            O texto das cenas está pronto a usar. Sem imagem não é possível gerar o prompt do vídeo.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleGenerateStoryboard(baseImage)}
                          disabled={isAnalyzingStoryboard}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[10px] font-bold text-amber-200 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isAnalyzingStoryboard ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          <span>Gerar imagem</span>
                        </button>
                      </div>
                    )}

                    {/* ─── CONFIGURAÇÃO DO VÍDEO + APROVAÇÃO ────────────────────
                        O utilizador já não escreve nem gera prompts: define a
                        configuração pretendida e aprova. O prompt é escrito a
                        partir do storyboard e o vídeo é criado com esta
                        configuração no Google Omni Flash (kie.ai). */}
                    <div className="rounded-2xl border border-[#00E5FF]/25 bg-[#080D18] p-3 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold text-[#00E5FF] uppercase tracking-wider flex items-center gap-1.5">
                          <Clapperboard className="w-3.5 h-3.5" />
                          Configuração do vídeo
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1">
                            <Coins className="w-3 h-3" />
                            Custo: {custoVideo > 0 ? `${custoVideo} créditos` : 'Grátis'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Duração — a API do Omni Flash só aceita 4, 6, 8 ou 10s */}
                        <div>
                          <label className="block text-[9px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                            Duração
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {[4, 6, 8, 10].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setVideoConfig((c) => ({ ...c, durationSeconds: s }))}
                                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                  videoConfig.durationSeconds === s
                                    ? 'bg-[#00E5FF] text-slate-950'
                                    : 'bg-white/[0.05] text-slate-400 hover:text-white'
                                }`}
                              >
                                {s}s
                              </button>
                            ))}
                          </div>
                          <span className="text-[9px] text-slate-600 block mt-0.5">
                            O Omni Flash aceita 4, 6, 8 ou 10 segundos
                          </span>
                        </div>

                        {/* Qualidade */}
                        <div>
                          <label className="block text-[9px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                            Qualidade
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {(['360p', '720p', '1080p'] as const).map((q) => (
                              <button
                                key={q}
                                type="button"
                                onClick={() => setVideoConfig((c) => ({ ...c, resolution: q }))}
                                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                  videoConfig.resolution === q
                                    ? 'bg-[#00E5FF] text-slate-950'
                                    : 'bg-white/[0.05] text-slate-400 hover:text-white'
                                }`}
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Orientação */}
                        <div>
                          <label className="block text-[9px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                            Orientação
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {([
                              { id: '9:16', label: 'Vertical' },
                              { id: '16:9', label: 'Horizontal' },
                            ] as const).map((o) => (
                              <button
                                key={o.id}
                                type="button"
                                onClick={() => setVideoConfig((c) => ({ ...c, aspectRatio: o.id }))}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                  videoConfig.aspectRatio === o.id
                                    ? 'bg-[#00E5FF] text-slate-950'
                                    : 'bg-white/[0.05] text-slate-400 hover:text-white'
                                }`}
                              >
                                {o.label} <span className="font-mono opacity-70">{o.id}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={!sbImg || isGenerating}
                          onClick={() => handleApproveAndCreateVideo(sb)}
                          title={sbImg ? 'Aprovar e criar o vídeo' : 'Gere primeiro a imagem do storyboard'}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                            sbImg && !isGenerating
                              ? 'bg-gradient-to-r from-emerald-500 via-[#00E5FF] to-emerald-500 bg-size-200 hover:bg-pos-100 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.35)] active:scale-95 cursor-pointer'
                              : 'bg-white/[0.04] border border-white/10 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
                          <span>
                            {isGenerating
                              ? 'A criar o vídeo…'
                              : `Aprovar e criar vídeo (${videoConfig.durationSeconds}s · ${videoConfig.resolution}) • ${custoVideo > 0 ? `${custoVideo} créditos` : 'Grátis'}`}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCurrentStoryboard(sb);
                            setEditableOmniPrompt(sb.omni_flash_prompt);
                            setShowStoryboardModal(true);
                          }}
                          className="px-3.5 py-2.5 rounded-xl border border-white/10 text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          Detalhes do Roteiro
                        </button>
                      </div>

                      {!sbImg && (
                        <p className="text-[10px] text-amber-300/80 leading-relaxed">
                          🔒 Gere primeiro a imagem do storyboard (botão «Gerar imagem» acima). O vídeo é criado a
                          partir dela para o produto se manter idêntico em todas as cenas.
                        </p>
                      )}

                      {isGenerating && (
                        <p className="text-[10px] text-[#00E5FF] font-mono leading-relaxed">
                          {videoJob?.progressMessage || 'A processar…'}
                        </p>
                      )}
                    </div>

                    {/* Timeline das 5 Cenas */}
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[10px] pt-1">
                      <div className="p-2 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <span className="font-mono font-bold text-[#00E5FF] block">01 • Hook (0-2s)</span>
                        <p className="text-slate-300 leading-relaxed text-[9.5px]">{sb.motion_breakdown.scene1_hook}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <span className="font-mono font-bold text-amber-300 block">02 • Detalhes (2-4s)</span>
                        <p className="text-slate-300 leading-relaxed text-[9.5px]">{sb.motion_breakdown.scene2_detail}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <span className="font-mono font-bold text-emerald-400 block">03 • Ação (4-6s)</span>
                        <p className="text-slate-300 leading-relaxed text-[9.5px]">{sb.motion_breakdown.scene3_dynamic}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <span className="font-mono font-bold text-pink-400 block">04 • Benefício (6-8s)</span>
                        <p className="text-slate-300 leading-relaxed text-[9.5px]">{sb.motion_breakdown.scene4_benefit}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <span className="font-mono font-bold text-purple-400 block">05 • Clímax (8-10s)</span>
                        <p className="text-slate-300 leading-relaxed text-[9.5px]">{sb.motion_breakdown.scene5_cta}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Mensagem de Resposta de Prompt com Botão para Renderizar
            if (msg.type === 'ai_prompt') {
              return (
                <div key={msg.id} className="flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00E5FF]/40 to-[#1677FF]/30 border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF] shrink-0 shadow-[0_0_15px_rgba(0,229,255,0.25)]">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="max-w-[85%] space-y-3 bg-[#0B101D] border border-[#00E5FF]/40 rounded-[22px] rounded-tl-sm p-4 text-slate-200 shadow-xl">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] font-mono font-bold text-[9px]">
                          ⚡ Prompt Calibrado para Google Omni Flash
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">10s • 60 FPS</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(msg.prompt || '')}
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                        title="Copiar prompt"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-black/60 border border-white/5 text-xs font-mono text-slate-200 leading-relaxed">
                      {msg.prompt}
                    </div>

                    {/**
                     * Ficha do storyboard: prova visual de que o prompt foi escrito
                     * a partir da imagem (produto, marca, textos, paleta). Sem isto,
                     * um prompt genérico passava por bom.
                     */}
                    {msg.storyboardFacts && (
                      <div className="p-3 rounded-xl bg-[#00E5FF]/[0.06] border border-[#00E5FF]/20 space-y-1">
                        <span className="text-[9px] font-mono font-bold text-[#00E5FF] uppercase tracking-wider block">
                          Lido do storyboard
                        </span>
                        <p className="text-[10px] text-slate-300 leading-relaxed">
                          <strong className="text-white">{msg.storyboardFacts.produto || '—'}</strong>
                          {msg.storyboardFacts.marca ? ` · marca: ${msg.storyboardFacts.marca}` : ''}
                          {msg.storyboardFacts.paleta ? ` · paleta: ${msg.storyboardFacts.paleta}` : ''}
                        </p>
                        {Array.isArray(msg.storyboardFacts.textos_na_imagem) &&
                          msg.storyboardFacts.textos_na_imagem.length > 0 && (
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                              Textos no vídeo (da imagem):{' '}
                              <span className="text-slate-200">
                                {msg.storyboardFacts.textos_na_imagem.slice(0, 8).join(' • ')}
                              </span>
                            </p>
                          )}
                      </div>
                    )}

                    {msg.grounded === false && (
                      <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-300 mt-0.5 shrink-0" />
                        <span className="text-[10px] text-amber-200 leading-relaxed">
                          Atenção: este prompt não cita o produto nem os textos lidos no storyboard.
                          Reveja-o antes de renderizar — ou gere outra vez com o agente Comercial.
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-[10px] text-slate-400">
                        Conversa antiga: o prompt já não é um passo separado — aprovar o storyboard cria o vídeo.
                      </span>
                      <button
                        type="button"
                        disabled={isGenerating || !msg.storyboard?.storyboard_image_url}
                        onClick={() => handleApproveAndCreateVideo(msg.storyboard)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#1677FF] hover:brightness-110 text-slate-950 font-extrabold text-xs shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>A criar o vídeo...</span>
                          </>
                        ) : (
                          <>
                            <Film className="w-4 h-4" />
                            <span>
                              Criar vídeo ({videoConfig.durationSeconds}s · {videoConfig.resolution})
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            if (msg.type === 'loading') {
              return (
                <div key={msg.id} className="flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00E5FF]/30 to-[#1677FF]/20 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] shrink-0 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                    <VideoIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-[#10172A] border border-white/[0.08] rounded-[20px] rounded-tl-sm px-5 py-4 flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-[#00E5FF]/40 border-t-[#00E5FF] animate-spin" />
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-300 font-medium block">
                        {msg.prompt || 'Google Omni Flash a renderizar o spot…'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {videoConfig.durationSeconds}s · {videoConfig.resolution} ·{' '}
                        {videoConfig.aspectRatio === '9:16' ? 'Vertical' : 'Horizontal'} — o vídeo é criado na kie.ai
                        (pode levar alguns minutos)
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            if (msg.type === 'ai') {
              return (
                <div key={msg.id} className="flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00E5FF]/30 to-[#1677FF]/20 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] shrink-0 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                    <VideoIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-2 max-w-[75%]">
                    {/* Player de vídeo embutido no chat */}
                    {msg.videoUrl && (
                      <div
                        className="relative rounded-[18px] overflow-hidden border border-white/[0.1] bg-[#10172A] shadow-xl group"
                        style={{
                          // Respeita a orientação escolhida: vertical 9:16 ou horizontal 16:9.
                          aspectRatio: msg.videoAspectRatio === '16:9' ? '16/9' : '9/16',
                          maxWidth: msg.videoAspectRatio === '16:9' ? '380px' : '210px',
                        }}
                      >
                        {playingId === msg.id ? (
                          <video
                            src={msg.videoUrl}
                            poster={msg.posterUrl}
                            autoPlay
                            loop
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img src={msg.posterUrl} alt="video poster" className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        {/* Play/Pause overlay */}
                        <button
                          type="button"
                          onClick={() => setPlayingId(playingId === msg.id ? null : msg.id)}
                          className="absolute inset-0 flex items-center justify-center cursor-pointer"
                        >
                          <div className={`w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/30 flex items-center justify-center text-white transition-all ${playingId === msg.id ? 'opacity-0 hover:opacity-100' : 'opacity-90'}`}>
                            {playingId === msg.id
                              ? <Pause className="w-5 h-5" />
                              : <Play className="w-5 h-5 ml-0.5" />
                            }
                          </div>
                        </button>
                        {/* Badges */}
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur text-[9px] font-mono text-[#00E5FF] border border-white/10 font-bold">
                            60 FPS
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur text-[9px] font-mono text-slate-300 border border-white/10">
                            {msg.duration}
                          </span>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2">
                          <span className="text-[9px] text-white/80 font-medium line-clamp-1">{msg.styleName}</span>
                        </div>
                      </div>
                    )}

                    {/* Publicação automática na biblioteca de Mídias do Nexora Sign */}
                    {msg.videoRegisteredInMedia && (
                      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-[10px] text-emerald-200 leading-relaxed">
                          Já disponível no painel <strong>Nexora Sign → Mídias</strong>, pronto a agendar nos displays.
                        </span>
                      </div>
                    )}

                    {/* Feedback & ações */}
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
                        onClick={() => showToast('Feedback enviado', 'Usaremos para melhorar.', 'info')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/[0.05] transition-colors cursor-pointer"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (msg.videoUrl) {
                            const a = document.createElement('a');
                            a.href = msg.videoUrl;
                            a.download = `nexora-video-${msg.id}.mp4`;
                            a.click();
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#00E5FF] hover:bg-white/[0.05] transition-colors cursor-pointer"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
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

        {/* ─── BARRA DE INPUT FLUTUANTE ─────────────────────────────────────── */}
        <div className="shrink-0 px-4 pb-4 pt-2">
          {/* Banner de Imagem Base & Botão Storyboard */}
          {baseImage && (
            <div className="flex items-center justify-between gap-2 mb-2.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-[#10172A] to-[#162032] border border-[#00E5FF]/30 shadow-lg animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#00E5FF]/50 shrink-0">
                  <img src={baseImage} alt="base" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-white truncate">Foto do Produto Vinculada</span>
                    <span className="px-1.5 py-0.2 rounded bg-[#00E5FF]/20 text-[8px] font-mono text-[#00E5FF]">
                      {baseImageSource === 'library' ? 'Galeria' : 'Upload'}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400">Pronto para gerar Storyboard de 5 cenas (10s)</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* BOTÃO PRIMÁRIO: Gerar Storyboard Visual */}
                <button
                  type="button"
                  onClick={() => handleGenerateStoryboard()}
                  disabled={isAnalyzingStoryboard}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-bold text-[11px] shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isAnalyzingStoryboard ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>A conceber Storyboard...</span>
                    </>
                  ) : (
                    <>
                      <Clapperboard className="w-3.5 h-3.5" />
                      <span>Gerar Storyboard (5 Cenas) • {custoStoryboard > 0 ? `${custoStoryboard} créditos` : 'Grátis'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBaseImage(null);
                    setBaseImageSource(null);
                    setCurrentStoryboard(null);
                    setSessions((prev) =>
                      prev.map((s) => (s.id === activeSessionId ? { ...s, activeBaseImage: null, activeStoryboard: null } : s))
                    );
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Remover imagem"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
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
                    ? 'Instruções adicionais para as 5 cenas do vídeo ou dinâmica...'
                    : 'Descreva o spot comercial ou carregue uma imagem para conceber o Storyboard de 10s...'
                }
                rows={2}
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 resize-none outline-none leading-relaxed font-sans"
              />
            </div>

            {/* Controles */}
            <div className="flex items-center justify-between px-3 pb-3 pt-1 gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Agente Especialista */}
                <button
                  type="button"
                  onClick={() => setShowAgentsModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] text-slate-300 transition-colors cursor-pointer"
                >
                  <Film className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span className="hidden sm:inline">{selectedAgent.shortName}</span>
                </button>

                {/* Duração Fixa em 10s (5 cenas) */}
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] text-slate-300">
                  <span className="font-mono font-bold text-[#00E5FF]">10s (5 Cenas de 2s)</span>
                </div>

                {/* Upload de imagem */}
                <label
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Carregar imagem para o vídeo"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Imagem</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>

                {/* Da galeria */}
                <button
                  type="button"
                  onClick={() => { loadLibraryImages(); setShowGalleryModal(true); }}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Galeria"
                >
                  <FolderHeart className="w-3.5 h-3.5" />
                  <span>Galeria</span>
                </button>
              </div>

              {/* Botão de Envio com custo em créditos */}
              <div className="flex items-center gap-2">
                <span
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-bold"
                  title={`Custo em créditos do Storyboard: ${custoStoryboard} créditos`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>{custoStoryboard > 0 ? `${custoStoryboard} créditos` : 'Grátis'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleGenerateStoryboard()}
                  disabled={isGenerating || isAnalyzingStoryboard}
                  className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00E5FF] to-[#1677FF] hover:brightness-110 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
                  title={`Conceber Storyboard de 5 Cenas (${custoStoryboard > 0 ? `${custoStoryboard} créditos` : 'Grátis'})`}
                >
                  {isGenerating || isAnalyzingStoryboard ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  )}
                </button>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="px-4 pb-2 text-[9px] text-slate-600 text-center">
              Renderização via Google Omni Flash (10s • 60 FPS) — {estimatedCost} créditos por spot.
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL STORYBOARD DE APROVAÇÃO (5 CENAS DE 2s) ─────────────────── */}
      {showStoryboardModal && currentStoryboard && (
        <Modal
          isOpen={showStoryboardModal}
          onClose={() => setShowStoryboardModal(false)}
          title="🎬 Storyboard Visual (5 Cenas de 2s • 10s Total)"
          description="O Agente Criativo analisou o produto e estruturou o roteiro visual de 5 cenas consecutivas antes da geração do prompt."
          size="xl"
          accent="cyan"
        >
          <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar">

            {/* Cabeçalho */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#10172A] to-[#162032] border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {baseImage && (
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-amber-500/40 shrink-0 shadow-md">
                    <img src={baseImage} alt="Produto" className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold">
                      PRODUTO RECONHECIDO
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#00E5FF]/20 text-[#00E5FF] font-mono text-[9px] font-bold">
                      10 SEGUNDOS (5 CENAS • 60 FPS)
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1">{currentStoryboard.product_identified}</h3>
                  <p className="text-[11px] text-slate-400">Modelo: {currentStoryboard.visual_style}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Consistência Visual Ativa</span>
              </div>
            </div>

            {/* Imagem do Storyboard Visual — só aparece quando foi realmente gerada */}
            {currentStoryboard.storyboard_image_url ? (
              <div className="space-y-2 p-4 rounded-2xl bg-[#090E1A] border border-[#00E5FF]/30 shadow-[0_0_30px_rgba(0,229,255,0.06)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Storyboard Visual • 5 Quadros de Cenas (GPT-Image)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewImageUrl(currentStoryboard.storyboard_image_url!)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[#00E5FF] text-[11px] font-semibold transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver em Tela Cheia</span>
                  </button>
                </div>

                <div
                  onClick={() => setPreviewImageUrl(currentStoryboard.storyboard_image_url!)}
                  className="relative rounded-xl overflow-hidden border border-white/10 bg-black/60 flex items-center justify-center cursor-pointer group max-h-72"
                >
                  <StoryboardImage
                    src={currentStoryboard.storyboard_image_url}
                    className="w-full h-full max-h-72 object-contain group-hover:scale-[1.02] transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#00E5FF]" /> Quadros cinematográficos das 5 cenas de 2s
                    </span>
                    <span className="text-[10px] font-mono text-[#00E5FF] bg-black/60 px-2 py-0.5 rounded">
                      Clique para ampliar
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#090E1A] border border-amber-500/30 flex items-start gap-3">
                <Film className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Imagem do storyboard não gerada
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    O roteiro das 5 cenas está pronto abaixo e pode ser usado para renderizar o vídeo.
                    A imagem do storyboard não foi devolvida pelo motor de imagem — feche esta janela e
                    use «Gerar Storyboard (5 Cenas)» para tentar novamente.
                  </p>
                </div>
              </div>
            )}

            {/* As 5 Cenas do Vídeo */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clapperboard className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>Roteiro das 5 Cenas de 2s (Timeline de 10s)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                <div className="p-3 rounded-2xl bg-[#10172A] border border-[#00E5FF]/30 space-y-1.5">
                  <span className="px-2 py-0.5 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] font-mono font-bold text-[9px] block">
                    CENA 1 (0s - 2s)
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {currentStoryboard.motion_breakdown.scene1_hook}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-[#10172A] border border-amber-500/30 space-y-1.5">
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 font-mono font-bold text-[9px] block">
                    CENA 2 (2s - 4s)
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {currentStoryboard.motion_breakdown.scene2_detail}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-[#10172A] border border-emerald-500/30 space-y-1.5">
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[9px] block">
                    CENA 3 (4s - 6s)
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {currentStoryboard.motion_breakdown.scene3_dynamic}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-[#10172A] border border-pink-500/30 space-y-1.5">
                  <span className="px-2 py-0.5 rounded-lg bg-pink-500/10 text-pink-400 font-mono font-bold text-[9px] block">
                    CENA 4 (6s - 8s)
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {currentStoryboard.motion_breakdown.scene4_benefit}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-[#10172A] border border-purple-500/30 space-y-1.5">
                  <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-400 font-mono font-bold text-[9px] block">
                    CENA 5 (8s - 10s)
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {currentStoryboard.motion_breakdown.scene5_cta}
                  </p>
                </div>
              </div>
            </div>

            {/* Prompt Calibrado (Editável) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span>Prompt do Google Omni Flash (5 Cenas)</span>
                </label>
                <span className="text-[10px] text-slate-400">Instruções para o motor em 60fps</span>
              </div>
              <textarea
                value={editableOmniPrompt}
                onChange={(e) => setEditableOmniPrompt(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl bg-[#0B0F19] border border-white/10 text-xs text-slate-200 focus:border-[#00E5FF] outline-none font-mono leading-relaxed"
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowStoryboardModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/10 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer font-medium"
              >
                Voltar
              </button>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Aprovar e criar o vídeo — o prompt é escrito automaticamente */}
                <button
                  type="button"
                  disabled={!currentStoryboard.storyboard_image_url || isGenerating}
                  title={
                    currentStoryboard.storyboard_image_url
                      ? `Criar vídeo de ${videoConfig.durationSeconds}s em ${videoConfig.resolution}`
                      : 'Disponível depois de a imagem do storyboard ser gerada'
                  }
                  onClick={() => {
                    setShowStoryboardModal(false);
                    handleApproveAndCreateVideo({
                      ...currentStoryboard,
                      omni_flash_prompt: editableOmniPrompt || currentStoryboard.omni_flash_prompt,
                    });
                  }}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    currentStoryboard.storyboard_image_url && !isGenerating
                      ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 cursor-pointer'
                      : 'bg-white/[0.04] border border-white/10 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
                  <span>Aprovar e criar vídeo ({videoConfig.durationSeconds}s · {videoConfig.resolution})</span>
                </button>

                {/* Configuração resumida (muda-se no cartão do chat) */}
                <span className="text-[10px] font-mono text-slate-500 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/10">
                  {videoConfig.aspectRatio === '9:16' ? 'Vertical 9:16' : 'Horizontal 16:9'}
                </span>
              </div>
            </div>

          </div>
        </Modal>
      )}

      {/* ─── MODAL DE PREVIEW EM TELA CHEIA ───────────────────────────────── */}
      {previewImageUrl && (
        <Modal
          isOpen={Boolean(previewImageUrl)}
          onClose={() => setPreviewImageUrl(null)}
          title="📸 Storyboard Visual do Vídeo (5 Cenas • 10s)"
          description="Visualização dos quadros e composição visual concebida para o spot publicitário."
          size="xl"
          accent="cyan"
        >
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-black/80 border border-white/10 flex items-center justify-center max-h-[70vh]">
              <img
                src={previewImageUrl}
                alt="Storyboard Visual Expandido"
                className="w-full h-full max-h-[70vh] object-contain"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                5 Cenas de 2 segundos cada • Padrão DOOH 9:16
              </span>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── MODAL AGENTES ESPECIALISTAS EM VÍDEO ───────────────────────────── */}
      {showAgentsModal && (
        <Modal
          isOpen={showAgentsModal}
          onClose={() => setShowAgentsModal(false)}
          title="Modelos Especialistas em Vídeo Publicitário"
          description="Selecione o modelo de inteligência artificial de vídeo calibrado para o seu tipo de produto."
          accent="cyan"
          size="lg"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
            {VIDEO_AGENTS.map((agent) => (
              <div
                key={agent.id}
                onClick={() => handleAgentChange(agent)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                  selectedAgent.id === agent.id
                    ? 'bg-[#00E5FF]/10 border-[#00E5FF]'
                    : 'bg-[#10172A] border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="relative h-28 rounded-xl overflow-hidden">
                  <img src={agent.previewUrl} alt={agent.name} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur text-[9px] font-mono text-[#00E5FF] font-bold">
                    {agent.badge}
                  </span>
                  {selectedAgent.id === agent.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#00E5FF] text-slate-950 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{agent.name}</h4>
                  <p className="text-[10px] text-slate-400 line-clamp-3 mt-1 leading-relaxed">{agent.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* ─── MODAL GALERIA IA (SOMENTE IMAGENS) ─────────────────────────── */}
      {showGalleryModal && (
        <Modal
          isOpen={showGalleryModal}
          onClose={() => setShowGalleryModal(false)}
          title="Escolher Imagem da Galeria IA"
          description="Selecione uma imagem do produto gerada no estúdio para direcionar o Storyboard de 10 segundos."
          size="lg"
          accent="cyan"
        >
          <div className="space-y-4">
            {loadingLibrary ? (
              <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#00E5FF]" /> A carregar imagens da galeria...
              </div>
            ) : libraryImages.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 bg-white/[0.02] rounded-xl border border-white/5 space-y-1.5">
                <p className="font-semibold text-slate-300">Ainda não há imagens geradas nesta organização.</p>
                <p className="text-[11px] text-slate-500">Crie uma imagem no Gerador de Imagens ou carregue a foto do seu produto diretamente pelo botão de upload.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
                {libraryImages.map((job) => {
                  const url = job.resultUrl || job.outputUrl || '';
                  const estilo = job.parameters?.styleId || 'Criativo IA';
                  const promptCurto = job.prompt ? (job.prompt.length > 50 ? job.prompt.slice(0, 48) + '…' : job.prompt) : 'Foto do Produto';

                  return (
                    <div
                      key={job.id}
                      onClick={() => handleSelectFromLibrary(job)}
                      className="group relative rounded-xl overflow-hidden border border-white/10 hover:border-[#00E5FF] transition-all bg-[#0B101D] shadow-md flex flex-col cursor-pointer"
                    >
                      <div className="relative aspect-[9/16] w-full overflow-hidden bg-black/60">
                        <img
                          src={url}
                          alt={promptCurto}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <span className="text-[10px] text-[#00E5FF] font-bold">Clique para usar</span>
                        </div>
                      </div>
                      <div className="p-2 space-y-1 bg-[#0B101D] flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-mono text-[#00E5FF] block truncate">
                            {estilo}
                          </span>
                          <span className="text-[10px] text-slate-300 block line-clamp-2 leading-tight">
                            {promptCurto}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectFromLibrary(job);
                          }}
                          className="w-full mt-1.5 px-2 py-1 rounded-lg bg-[#00E5FF] hover:brightness-110 text-slate-950 text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          Usar Imagem
                        </button>
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
