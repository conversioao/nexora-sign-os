import React, { useState } from 'react';
import {
  Monitor,
  Shield,
  Zap,
  Sparkles,
  Layout,
  Play,
  Activity,
  ArrowRight,
  TrendingUp,
  Tv,
  Layers,
  CheckCircle,
  Cpu,
  RotateCw,
  Globe,
  Users,
  Search,
  FileText,
  HelpCircle,
  ChevronDown,
  Calendar,
  Image as ImageIcon,
  Flame,
} from 'lucide-react';
import { Logo } from '../../../components/ui/Logo';

interface DisplayModel {
  id: string;
  name: string;
  type: string;
  description: string;
  specs: string[];
  defaultRotateX: number;
  defaultRotateY: number;
  screenContent: {
    title: string;
    subtitle: string;
    bgGradient: string;
    badge: string;
    mediaText: string;
  }[];
}

const DISPLAY_MODELS: DisplayModel[] = [
  {
    id: 'totem',
    name: 'Totem Digital Premium',
    type: 'Indoor / Vertical 55"',
    description: 'Ideal para shoppings, hotéis, recepções e corredores comerciais de alto fluxo. Estrutura elegante em vidro temperado e aço escovado.',
    specs: ['Resolução 4K Ultra HD', 'Brilho Inteligente 700 nits', 'Conectividade 4G/WiFi Integrada', 'Vidro Antirreflexo Pro'],
    defaultRotateX: 12,
    defaultRotateY: -15,
    screenContent: [
      {
        title: 'Campanha de Verão',
        subtitle: 'Até 50% de Desconto na loja',
        bgGradient: 'from-amber-500 via-red-500 to-purple-600',
        badge: 'PUBLICIDADE',
        mediaText: 'Vídeo: Campanha_Verao_2026.mp4 (15s)'
      },
      {
        title: 'Guia do Shopping',
        subtitle: 'Encontre suas lojas favoritas',
        bgGradient: 'from-cyan-500 via-blue-600 to-indigo-700',
        badge: 'WAYFINDING',
        mediaText: 'Interativo: Mapa_Piso_1.html'
      }
    ]
  },
  {
    id: 'billboard',
    name: 'Painel de LED Outdoor',
    type: 'Outdoor / Larga Escala',
    description: 'Chassi reforçado com proteção contra intempéries IP65. Alto brilho para visibilidade perfeita mesmo sob incidência de luz solar direta.',
    specs: ['Brilho Extremo 6.500 nits', 'Taxa de Atualização 3.840Hz', 'Gabinete Ultraleve de Alumínio', 'Monitoramento Remoto Integrado'],
    defaultRotateX: 15,
    defaultRotateY: 20,
    screenContent: [
      {
        title: 'Lançamento Unitel 5G',
        subtitle: 'A internet mais rápida de Angola',
        bgGradient: 'from-orange-500 via-amber-600 to-rose-700',
        badge: 'PATROCÍNIO',
        mediaText: 'Grade: Grade_Principal_Luanda.json'
      },
      {
        title: 'Informação Climática',
        subtitle: 'Luanda: Parcialmente Nublado • 28°C',
        bgGradient: 'from-blue-600 via-slate-800 to-zinc-900',
        badge: 'INFORMATIVO',
        mediaText: 'Widget: Tempo_TempoReal.js'
      }
    ]
  },
  {
    id: 'menuboard',
    name: 'Menu Board Digital',
    type: 'Indoor / Horizontal 43"',
    description: 'Especialmente desenhado para restaurantes, fast-foods e cafeterias. Sincronize preços, promoções e fotos de produtos instantaneamente.',
    specs: ['Operação 24/7 Contínua', 'Painel IPS Grande Ângulo de Visão', 'Gestão Centralizada de Preços', 'Integração de Fila de Espera'],
    defaultRotateX: 25,
    defaultRotateY: 0,
    screenContent: [
      {
        title: 'Combo Nexora Burger',
        subtitle: 'Hambúrguer Gourmet + Bebida • 4.500 Kz',
        bgGradient: 'from-yellow-500 via-amber-500 to-orange-600',
        badge: 'MENU DIA',
        mediaText: 'Template: Menu_Burger_Combos.html'
      },
      {
        title: 'Hora do Café',
        subtitle: 'Expresso e Cappuccino a partir de 800 Kz',
        bgGradient: 'from-amber-800 via-amber-950 to-stone-900',
        badge: 'PROMOÇÃO',
        mediaText: 'Vídeo: Cafe_Moments_Motion.mp4'
      }
    ]
  }
];

const FAQS = [
  {
    q: 'O que é a divisão Nexora Sign e Nexora Creative AI?',
    a: 'O Nexora Sign é focado na gestão física de displays, totens e na programação de campanhas de mídia indoor. Já o Nexora Creative AI é a nossa suite criativa integrada, focada na geração automatizada de mídias, vídeos de alto impacto e imagens utilizando Inteligência Artificial de ponta adaptada para o formato vertical.'
  },
  {
    q: 'Como funciona o controle em tempo real dos displays?',
    a: 'Através de conexões WebSocket seguras e telemetria avançada, as alterações de grade, preços e mídias feitas no Nexora Sign são sincronizadas com os players físicos em menos de 5 segundos, com suporte completo a cache local offline.'
  },
  {
    q: 'Os templates gerados por IA são personalizáveis?',
    a: 'Sim! Com o Creative AI, você pode gerar mídias a partir de prompts de texto e, em seguida, editá-los, adicionar caixas de texto com o seu cardápio, preços dinâmicos ou widgets informativos integrados.'
  },
  {
    q: 'Posso integrar telas de fornecedores terceiros?',
    a: 'Completamente. O player do Nexora Sign roda em aparelhos Android, Raspberry Pi, Windows e smart TVs comerciais que suportam navegadores modernos ou instalação de aplicativos locais.'
  }
];

export interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToSignUp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin, onNavigateToSignUp }) => {
  const [selectedModel, setSelectedModel] = useState<DisplayModel>(DISPLAY_MODELS[0]);
  const [contentIndex, setContentIndex] = useState(0);
  const [rotX, setRotX] = useState(selectedModel.defaultRotateX);
  const [rotY, setRotY] = useState(selectedModel.defaultRotateY);
  
  // Product Tour active tab state
  const [activeTourTab, setActiveTourTab] = useState<'sign' | 'creative' | 'analytics'>('sign');
  
  // FAQ active indexes
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Creative AI simulator state
  const [prompt, setPrompt] = useState('Painel animado para promoção de Hambúrguer Gourmet no fim de semana');
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);

  const handleSelectModel = (model: DisplayModel) => {
    setSelectedModel(model);
    setContentIndex(0);
    setRotX(model.defaultRotateX);
    setRotY(model.defaultRotateY);
  };

  const activeContent = selectedModel.screenContent[contentIndex];

  const handleSimulateGeneration = () => {
    setGenerating(true);
    setGeneratedResult(null);
    setTimeout(() => {
      setGenerating(false);
      setGeneratedResult('from-yellow-500 via-red-500 to-amber-800');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-[#F8FAFC] font-sans antialiased overflow-x-hidden relative selection:bg-[#2563EB]/30 selection:text-[#06B6D4]">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#2563EB]/10 to-[#7C3AED]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[800px] right-10 w-[600px] h-[600px] bg-gradient-to-br from-[#06B6D4]/10 to-[#2563EB]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[1800px] left-10 w-[500px] h-[500px] bg-purple-900/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#070B14]/75 border-b border-white/5 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <Logo variant="full" size="md" />

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold">
            <a href="#plataformas" className="text-[#94A3B8] hover:text-white transition-colors">Plataformas</a>
            <a href="#tour" className="text-[#94A3B8] hover:text-white transition-colors">Tour do Produto</a>
            <a href="#displays" className="text-[#94A3B8] hover:text-white transition-colors">Modelos 3D</a>
            <a href="#recursos" className="text-[#94A3B8] hover:text-white transition-colors">Recursos</a>
            <a href="#faq" className="text-[#94A3B8] hover:text-white transition-colors">FAQs</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToLogin}
              className="px-4 py-2 rounded-lg text-xs font-semibold hover:bg-white/5 text-slate-300 hover:text-white border border-transparent hover:border-white/10 transition-all cursor-pointer"
            >
              Entrar
            </button>
            <button
              onClick={onNavigateToSignUp}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] hover:bg-blue-500 text-white shadow-sm shadow-[#2563EB]/25 hover:scale-[1.02] transition-all cursor-pointer"
            >
              Criar Conta
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-36 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-6 space-y-6 text-left relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] text-[11px] font-bold tracking-wider uppercase font-display">
              <Sparkles className="w-3.5 h-3.5" /> Mídia Indoor Automatizada
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display leading-[1.05] tracking-tight">
              Uma plataforma, <br className="hidden sm:inline" />
              duas soluções <br />
              <span className="nexora-gradient-text">revolucionárias</span>
            </h1>
            <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed max-w-lg">
              Nexora divide a comunicação visual em duas vertentes complementares: **Creative AI** para geração e adaptação de mídias por Inteligência Artificial, e **Sign** para programação e controle remoto de displays físicos em tempo real.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={onNavigateToSignUp}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-xs font-bold bg-[#2563EB] hover:bg-blue-500 text-white shadow-lg shadow-[#2563EB]/20 hover:scale-[1.02] transition-all cursor-pointer"
              >
                Criar Conta Grátis <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#plataformas"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-all"
              >
                Conhecer as Plataformas
              </a>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/5">
              <div>
                <div className="text-2xl font-bold text-white font-display">100%</div>
                <div className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">Baseado em Cloud</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white font-display">&lt; 5s</div>
                <div className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">Sincronização</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#06B6D4] font-display">Angola</div>
                <div className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">Suporte Local</div>
              </div>
            </div>
          </div>

          {/* Isometric Hero Visual Mockup */}
          <div className="lg:col-span-6 flex justify-center relative">
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-[#06B6D4]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative w-full max-w-[440px] aspect-square rounded-3xl bg-gradient-to-br from-[#131D31]/40 to-[#0B1120]/10 border border-white/5 flex items-center justify-center p-8 overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.1),transparent_70%)]" />
              
              {/* Dual Visual Card Mockup (Creative AI overlay on Sign Display) */}
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Back Screen (Signage Device) */}
                <div
                  className="w-52 h-[300px] rounded-xl bg-[#070B14] border-4 border-slate-700/80 shadow-2xl p-2.5 flex flex-col justify-between absolute transition-all duration-500"
                  style={{
                    transform: 'perspective(1000px) rotateX(15deg) rotateY(-25deg) rotateZ(3deg) translateX(-30px) translateY(-10px)',
                    boxShadow: '15px 15px 40px rgba(0, 0, 0, 0.6)',
                  }}
                >
                  <div className="h-full rounded bg-gradient-to-t from-cyan-600 to-blue-800 p-3 flex flex-col justify-between overflow-hidden relative">
                    <span className="text-[7px] font-bold text-white bg-black/40 px-1 py-0.5 rounded self-start">SIGN DISPLAYS</span>
                    <div className="text-[11px] font-extrabold text-white font-display">Totem Central Ativo</div>
                    <div className="text-[7px] text-white/70">Luanda • Online</div>
                  </div>
                </div>

                {/* Front Screen (Creative AI Generation Panel) */}
                <div
                  className="w-56 p-4 rounded-2xl bg-[#0B1120]/95 border border-[#7C3AED]/30 shadow-2xl flex flex-col gap-2.5 absolute transition-all duration-500"
                  style={{
                    transform: 'perspective(1000px) rotateX(15deg) rotateY(-20deg) rotateZ(3deg) translateX(40px) translateY(30px) translateZ(50px)',
                    boxShadow: '20px 20px 50px rgba(0, 0, 0, 0.7)',
                  }}
                >
                  <div className="flex items-center gap-1.5 text-[#C084FC]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-bold uppercase tracking-wider font-display">Creative AI</span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                    <div className="w-full h-1 bg-[#7C3AED]/30 rounded mb-1.5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-3/4 animate-pulse" />
                    </div>
                    <span className="text-[8px] text-[#94A3B8] font-mono block">Gerando vídeo comercial vertical...</span>
                  </div>
                  <div className="w-full aspect-video rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plataformas Split Showcase Section */}
      <section id="plataformas" className="py-20 bg-[#0B1120]/30 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16 max-w-xl mx-auto">
            <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">A Suite Nexora</span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display">Duas plataformas. Um único ecossistema.</h2>
            <p className="text-xs sm:text-sm text-[#94A3B8]">
              Acesse ferramentas especializadas para o seu momento de comunicação: criar conteúdos com IA ou monitorar totens digitais.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Nexora Sign Box */}
            <div className="p-8 rounded-3xl bg-[#131D31]/40 border border-white/5 hover:border-[#06B6D4]/30 transition-all text-left flex flex-col justify-between space-y-8 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#06B6D4]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#06B6D4]/10 transition-colors" />
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center text-[#06B6D4]">
                  <Monitor className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
                  Nexora <span className="text-[#06B6D4]">Sign</span>
                </h3>
                <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                  A solução definitiva para distribuição de grades, controle de hardware, agendamentos comerciais integrados, gerenciamento de contratos publicitários e métricas em tempo real para redes de totens e displays de Mídia Indoor.
                </p>
                <ul className="space-y-2.5 pt-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#06B6D4] flex-shrink-0" /> Monitoramento em tempo real (Telemetria)</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#06B6D4] flex-shrink-0" /> Linha do tempo e grades de veiculação dinâmicas</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#06B6D4] flex-shrink-0" /> Gestão de contratos, CRM de anunciantes e cobrança</li>
                </ul>
              </div>
              <button
                onClick={onNavigateToLogin}
                className="w-full sm:w-auto self-start flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#06B6D4]/10 hover:bg-[#06B6D4] text-[#06B6D4] hover:text-[#070B14] border border-[#06B6D4]/25 hover:border-transparent transition-all cursor-pointer"
              >
                Conhecer Nexora Sign <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Nexora Creative AI Box */}
            <div className="p-8 rounded-3xl bg-[#131D31]/40 border border-white/5 hover:border-[#7C3AED]/30 transition-all text-left flex flex-col justify-between space-y-8 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#7C3AED]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#7C3AED]/10 transition-colors" />
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
                  Nexora <span className="text-[#C084FC]">Creative AI</span>
                </h3>
                <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                  Simplifique a criação de conteúdo. Gere peças de publicidade animadas, imagens e vinhetas comerciais verticais com inteligência artificial. Adapte a sua identidade visual para qualquer proporção de tela instantaneamente.
                </p>
                <ul className="space-y-2.5 pt-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#7C3AED] flex-shrink-0" /> Geração de imagem e vídeo comerciais a partir de texto</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#7C3AED] flex-shrink-0" /> Adaptação instantânea de grade vertical/horizontal</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#7C3AED] flex-shrink-0" /> Estúdio de edição rápida integrado à nuvem</li>
                </ul>
              </div>
              <button
                onClick={onNavigateToLogin}
                className="w-full sm:w-auto self-start flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#7C3AED]/10 hover:bg-[#7C3AED] text-[#C084FC] hover:text-white border border-[#7C3AED]/25 hover:border-transparent transition-all cursor-pointer"
              >
                Conhecer Creative AI <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Product Tour Sections (Interactive Demo) */}
      <section id="tour" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12 max-w-xl mx-auto">
          <span className="text-xs font-bold text-[#06B6D4] uppercase tracking-wider">Interface Nexora</span>
          <h2 className="text-2xl sm:text-3xl font-bold font-display">Experimente o sistema por dentro</h2>
          <p className="text-xs sm:text-sm text-[#94A3B8]">
            Selecione uma das abas de demonstração abaixo para simular as principais visualizações e recursos da nossa plataforma.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex justify-center border-b border-white/5 mb-8 overflow-x-auto pb-1">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTourTab('sign')}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTourTab === 'sign'
                  ? 'border-[#06B6D4] text-[#06B6D4]'
                  : 'border-transparent text-[#64748B] hover:text-[#94A3B8]'
              }`}
            >
              Nexora Sign Panel
            </button>
            <button
              onClick={() => setActiveTourTab('creative')}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTourTab === 'creative'
                  ? 'border-[#7C3AED] text-[#C084FC]'
                  : 'border-transparent text-[#64748B] hover:text-[#94A3B8]'
              }`}
            >
              Creative AI Studio
            </button>
            <button
              onClick={() => setActiveTourTab('analytics')}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTourTab === 'analytics'
                  ? 'border-[#2563EB] text-[#60A5FA]'
                  : 'border-transparent text-[#64748B] hover:text-[#94A3B8]'
              }`}
            >
              Métricas & Análise
            </button>
          </div>
        </div>

        {/* Tour Contents Container */}
        <div className="p-6 rounded-2xl bg-[#0B1120] border border-white/5 shadow-2xl text-left min-h-[380px] flex flex-col justify-between">
          {activeTourTab === 'sign' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Monitor className="w-4 h-4 text-[#06B6D4]" /> Dashboard de Dispositivos (Nexora Sign)
                  </h3>
                  <p className="text-[11px] text-[#64748B]">Simulação do painel do cliente monitorando os totens de Luanda.</p>
                </div>
                <div className="bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 rounded-full px-2.5 py-0.5 text-[9px] font-bold">
                  45 / 48 ONLINE
                </div>
              </div>

              {/* Fake Devices Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[#64748B] border-b border-white/5">
                      <th className="py-2.5 font-medium">Nome do Display</th>
                      <th className="py-2.5 font-medium">Localização</th>
                      <th className="py-2.5 font-medium">Status</th>
                      <th className="py-2.5 font-medium">Playlist Ativa</th>
                      <th className="py-2.5 font-medium">CPU / Temp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03] text-slate-300">
                    <tr>
                      <td className="py-3 font-semibold text-white">NX-T-001 (Totem A)</td>
                      <td className="py-3">Shopping Luanda</td>
                      <td className="py-3 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Ativo</td>
                      <td className="py-3 text-cyan-400">Playlist_Institucional_2026</td>
                      <td className="py-3 text-[10px] font-mono">14% / 42°C</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-semibold text-white">NX-T-002 (Totem B)</td>
                      <td className="py-3">Shopping Luanda</td>
                      <td className="py-3 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Ativo</td>
                      <td className="py-3 text-cyan-400">Playlist_Combos_Alimentacao</td>
                      <td className="py-3 text-[10px] font-mono">22% / 45°C</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-semibold text-white">NX-LED-005 (Painel)</td>
                      <td className="py-3">Avenida Deolinda Rodrigues</td>
                      <td className="py-3 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Alerta</td>
                      <td className="py-3 text-cyan-400">Grade_Patrocinadores_Unitel</td>
                      <td className="py-3 text-[10px] font-mono">88% / 58°C</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTourTab === 'creative' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#7C3AED]" /> Suite de Criação IA (Nexora Creative AI)
                </h3>
                <p className="text-[11px] text-[#64748B]">Simulador rápido de geração e adaptação de mídias por prompt.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Generation Form */}
                <div className="space-y-4">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] uppercase font-bold text-[#94A3B8]">Prompt do Conteúdo</label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full bg-[#131D31] border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[#7C3AED]/60 h-20 resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSimulateGeneration}
                      disabled={generating}
                      className="flex-1 py-2 bg-[#7C3AED] hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      {generating ? 'Processando IA...' : 'Gerar Peça'}
                    </button>
                    <button
                      onClick={() => setPrompt('Cardápio dinâmico com preços atualizados de bebidas frias')}
                      className="px-3 py-2 bg-white/5 border border-white/5 text-[#94A3B8] hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Exemplo 2
                    </button>
                  </div>
                </div>

                {/* Display output screen */}
                <div className="flex justify-center">
                  <div className="w-40 h-64 border border-white/10 bg-[#070B14] rounded-xl p-1.5 shadow-xl relative overflow-hidden flex items-center justify-center">
                    {generating ? (
                      <div className="space-y-2 text-center">
                        <div className="w-6 h-6 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto" />
                        <span className="text-[9px] text-slate-500 font-mono">Renderizando vídeo...</span>
                      </div>
                    ) : generatedResult ? (
                      <div className={`w-full h-full bg-gradient-to-br ${generatedResult} p-3 rounded-lg flex flex-col justify-between animate-fade-in`}>
                        <span className="text-[8px] font-bold bg-[#7C3AED]/20 text-[#C084FC] border border-[#7C3AED]/35 px-1 py-0.5 rounded self-start">IA GERADA</span>
                        <div className="text-[10px] font-bold text-white font-display drop-shadow leading-tight">Sucesso! Promoção Hambúrguer Gourmet</div>
                        <span className="text-[7px] text-white/70 block">Vídeo renderizado em 1080x1920 (15s)</span>
                      </div>
                    ) : (
                      <div className="text-center text-[#64748B] p-4">
                        <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-[10px] leading-relaxed">Digite o prompt ou use os exemplos e clique em Gerar.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTourTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#2563EB]" /> Métricas de Audiência & Conversão
                </h3>
                <p className="text-[11px] text-[#64748B]">Exibição simulada de métricas consolidadas dos totens e visualizações geradas.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#131D31]/40 border border-white/5 space-y-1">
                  <span className="text-[9px] text-[#64748B] uppercase tracking-wider font-bold">Total de Impressões</span>
                  <div className="text-xl font-extrabold text-white">4.3M+</div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <Flame className="w-3 h-3" /> +12% este mês
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#131D31]/40 border border-white/5 space-y-1">
                  <span className="text-[9px] text-[#64748B] uppercase tracking-wider font-bold">Uptime da Rede</span>
                  <div className="text-xl font-extrabold text-white">99.98%</div>
                  <div className="text-[10px] text-slate-500">Média em 30 dias</div>
                </div>
                <div className="p-4 rounded-xl bg-[#131D31]/40 border border-white/5 space-y-1">
                  <span className="text-[9px] text-[#64748B] uppercase tracking-wider font-bold">Cliques / QR Codes</span>
                  <div className="text-xl font-extrabold text-white">42,890</div>
                  <div className="text-[10px] text-cyan-400">Conversão de Campanhas</div>
                </div>
              </div>

              {/* Simplified graphic bar simulation */}
              <div className="p-4 rounded-xl bg-[#131D31]/20 border border-white/5 space-y-2">
                <span className="text-[9px] font-bold text-white block">Distribuição de Telas por Província (Angola)</span>
                <div className="flex gap-2 items-end h-16 pt-2">
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-[#06B6D4] h-[65%] rounded-t" />
                    <span className="text-[8px] text-[#64748B]">Luanda</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-[#2563EB] h-[25%] rounded-t" />
                    <span className="text-[8px] text-[#64748B]">Benguela</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-[#7C3AED] h-[15%] rounded-t" />
                    <span className="text-[8px] text-[#64748B]">Huíla</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-slate-700 h-[8%] rounded-t" />
                    <span className="text-[8px] text-[#64748B]">Outras</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-[#94A3B8] flex-wrap gap-2">
            <span>Quer gerenciar suas próprias campanhas?</span>
            <button
              onClick={onNavigateToSignUp}
              className="flex items-center gap-1 text-[#06B6D4] font-bold hover:underline cursor-pointer"
            >
              Criar Conta e Começar <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Interactive 3D Display Simulator Section */}
      <section id="displays" className="py-20 bg-[#0B1120]/15 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <span className="text-xs font-bold text-[#06B6D4] uppercase tracking-wider">Simulador Virtual Interativo</span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display">Explore nossos Displays Digitais 3D</h2>
            <p className="text-xs sm:text-sm text-[#94A3B8] max-w-xl mx-auto">
              Use os controles abaixo para rotacionar o display virtual no espaço 3D, alterar as mídias exibidas e analisar as especificações de cada hardware.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: Configurator Controls */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] text-left">Selecione o Modelo de Tela</h3>
                <div className="space-y-3">
                  {DISPLAY_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleSelectModel(model)}
                      className={`w-full p-4 rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                        selectedModel.id === model.id
                          ? 'bg-[#2563EB]/10 border-[#2563EB] shadow-sm shadow-[#2563EB]/10'
                          : 'bg-[#131D31]/40 border-white/5 hover:border-white/10 hover:bg-[#131D31]/80'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{model.name}</div>
                        <div className="text-[10px] text-[#94A3B8] mt-0.5">{model.type}</div>
                      </div>
                      <Monitor className={`w-4 h-4 ${selectedModel.id === model.id ? 'text-[#06B6D4]' : 'text-[#64748B]'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Speeds & Controls */}
              <div className="p-5 rounded-2xl bg-[#0B1120] border border-white/5 space-y-4 text-left">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5 text-cyan-400" /> Rotação do Espaço 3D
                  </span>
                  <button
                    onClick={() => {
                      setRotX(selectedModel.defaultRotateX);
                      setRotY(selectedModel.defaultRotateY);
                    }}
                    className="text-[10px] text-[#06B6D4] hover:underline cursor-pointer"
                  >
                    Resetar Ângulo
                  </button>
                </div>

                {/* Slider Controls for interactive Rotations */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-[#94A3B8]">
                      <span>Rotação Horizontal (Eixo Y)</span>
                      <span className="font-mono text-white">{rotY}°</span>
                    </div>
                    <input
                      type="range"
                      min="-60"
                      max="60"
                      value={rotY}
                      onChange={(e) => setRotY(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#06B6D4]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-[#94A3B8]">
                      <span>Rotação Vertical (Eixo X)</span>
                      <span className="font-mono text-white">{rotX}°</span>
                    </div>
                    <input
                      type="range"
                      min="-40"
                      max="40"
                      value={rotX}
                      onChange={(e) => setRotX(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">Conteúdo Ativo na Tela</span>
                  <div className="flex gap-2">
                    {selectedModel.screenContent.map((c, idx) => (
                      <button
                        key={idx}
                        onClick={() => setContentIndex(idx)}
                        className={`flex-1 py-1.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                          contentIndex === idx
                            ? 'bg-[#06B6D4]/20 border-[#06B6D4] text-[#06B6D4]'
                            : 'bg-white/5 border-transparent text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        {c.badge}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Canvas Mockup & Spec Panel */}
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-[#131D31]/30 border border-white/5 relative items-center overflow-hidden min-h-[460px]">
              {/* Background Tech Net */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

              {/* Interactive 3D Device Container */}
              <div className="flex items-center justify-center h-full relative z-10">
                <div
                  className="transition-all duration-150 ease-out flex items-center justify-center"
                  style={{
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                  }}
                >
                  {/* 3D simulated monitor bezel */}
                  <div
                    className={`border-4 border-slate-800 bg-[#070B14] rounded-2xl shadow-[20px_20px_45px_rgba(0,0,0,0.7)] p-2 transition-all duration-300 relative ${
                      selectedModel.id === 'menuboard' ? 'w-[280px] h-[170px]' : 'w-[180px] h-[310px]'
                    }`}
                    style={{
                      transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* Bezel glow effect */}
                    <div className="absolute inset-0 rounded-xl border border-white/10 pointer-events-none" />

                    {/* Live Display Screen */}
                    <div
                      className={`w-full h-full rounded-lg bg-gradient-to-br ${activeContent.bgGradient} p-3 flex flex-col justify-between text-left overflow-hidden relative`}
                      style={{ transform: 'translateZ(10px)' }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-bold text-white bg-black/40 px-1.5 py-0.5 rounded border border-white/10">
                          {activeContent.badge}
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white leading-tight font-display drop-shadow">
                          {activeContent.title}
                        </h4>
                        <p className="text-[8px] text-white/80 line-clamp-2 leading-relaxed">
                          {activeContent.subtitle}
                        </p>
                      </div>

                      {/* Footer feed info */}
                      <div className="flex justify-between items-center text-[7px] text-white/60">
                        <span>Nexora OS Player</span>
                        <span>v1.2</span>
                      </div>

                      {/* Reflection glass */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                    </div>

                    {/* Foot/Base for vertical totem */}
                    {selectedModel.id === 'totem' && (
                      <div
                        className="absolute bottom-[-18px] left-[15%] right-[15%] h-3 bg-slate-900 border border-slate-700/50 rounded-lg shadow-lg"
                        style={{ transform: 'translateZ(-15px) rotateX(90deg)' }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Spec Panel */}
              <div className="space-y-5 text-left relative z-10 self-center">
                <div>
                  <span className="bg-[#2563EB]/15 text-[#60A5FA] border border-[#2563EB]/25 px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider">
                    Especificações do Hardware
                  </span>
                  <h3 className="text-lg font-bold text-white font-display mt-2">{selectedModel.name}</h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed mt-1">{selectedModel.description}</p>
                </div>

                <ul className="space-y-2 text-xs text-slate-300">
                  {selectedModel.specs.map((spec, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-[#06B6D4] flex-shrink-0" />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2">
                  <button
                    onClick={onNavigateToSignUp}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#06B6D4] hover:bg-cyan-500 text-[#070B14] shadow-sm shadow-[#06B6D4]/20 transition-all cursor-pointer"
                  >
                    Quero este Display <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Robust Platform Features Detail Grid */}
      <section id="recursos" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-16 max-w-xl mx-auto">
          <span className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider">Recursos Avançados</span>
          <h2 className="text-2xl sm:text-3xl font-bold font-display">Tudo o que a sua marca precisa</h2>
          <p className="text-xs sm:text-sm text-[#94A3B8]">
            Explore as principais ferramentas do nosso painel de controle que aceleram e modernizam a gestão de mídias físicas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#131D31]/40 border border-white/5 text-left space-y-3 hover:border-blue-500/20 transition-all">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white text-xs">Agendamento & Calendário</h3>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Programação avançada por data, intervalos horários e dias específicos da semana. Defina prioridade e evite conflitos de exibição.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#131D31]/40 border border-white/5 text-left space-y-3 hover:border-cyan-500/20 transition-all">
            <Layout className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-white text-xs">Grade de Regiões</h3>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Divida a tela física em sub-áreas dinâmicas para mostrar conteúdos simultâneos, como feed de notícias RSS, previsão do tempo e promoções.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#131D31]/40 border border-white/5 text-left space-y-3 hover:border-purple-500/20 transition-all">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white text-xs">Nexora Studio AI</h3>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Crie comerciais do zero por Inteligência Artificial. Insira slogans e imagens, e gere clipes otimizados para o formato vertical.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#131D31]/40 border border-white/5 text-left space-y-3 hover:border-emerald-500/20 transition-all">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-white text-xs">Telemetria & Diagnósticos</h3>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Acompanhe a temperatura, conexões pendentes, ping e integridade dos totens físicos diretamente em tempo real com relatórios.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#131D31]/40 border border-white/5 text-left space-y-3 hover:border-orange-500/20 transition-all">
            <Users className="w-5 h-5 text-orange-400" />
            <h3 className="font-semibold text-white text-xs">Multi-Tenant & CRM</h3>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Gerencie sub-organizações, clientes locais, anunciantes e faturamento integrado com controle rígido de acessos e permissões.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#131D31]/40 border border-white/5 text-left space-y-3 hover:border-pink-500/20 transition-all">
            <FileText className="w-5 h-5 text-pink-400" />
            <h3 className="font-semibold text-white text-xs">Contratos & Relatórios</h3>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Gere faturas comerciais detalhadas e comprove a exibição exata da veiculação de cada campanha de mídia com gráficos consolidados.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-20 bg-[#0B1120]/45 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          <div className="space-y-3">
            <HelpCircle className="w-8 h-8 text-[#06B6D4] mx-auto" />
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">Dúvidas Frequentes</h2>
            <p className="text-xs sm:text-sm text-[#94A3B8]">
              Respostas diretas sobre como o ecossistema Nexora opera no mercado de digital signage.
            </p>
          </div>

          <div className="text-left space-y-4">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="bg-[#131D31]/60 border border-white/5 rounded-xl overflow-hidden transition-all">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full p-5 flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:bg-white/[0.02] cursor-pointer text-left gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${expandedFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {expandedFaq === idx && (
                  <div className="p-5 pt-0 border-t border-white/5 text-[11px] sm:text-xs text-[#94A3B8] leading-relaxed animate-slide-down">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#070B14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Logo variant="full" size="sm" />
            <p className="text-[10px] text-[#64748B]">
              Nexora-OS • Todos os direitos reservados © 2026.
            </p>
          </div>

          <div className="flex items-center gap-6 text-[11px] text-[#94A3B8]">
            <a href="#plataformas" className="hover:text-white transition-colors">Plataformas</a>
            <a href="#tour" className="hover:text-white transition-colors">Tour do Produto</a>
            <a href="#displays" className="hover:text-white transition-colors">Modelos 3D</a>
            <span className="text-[#64748B]">•</span>
            <button onClick={onNavigateToLogin} className="hover:text-white transition-colors cursor-pointer text-left bg-transparent border-none">Acesso Restrito</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
