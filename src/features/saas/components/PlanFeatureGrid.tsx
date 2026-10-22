import React from 'react';
import {
  Check,
  X,
  Tv,
  Film,
  ListMusic,
  Calendar,
  CalendarDays,
  Users,
  BarChart3,
  Activity,
  Sparkles,
  Video,
  Megaphone,
  Headphones,
  Palette,
  LayoutGrid,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { PlanFeatures } from '../../../types/saas';

interface PlanFeatureGridProps {
  features: PlanFeatures;
  interactive?: boolean;
  onChange?: (features: PlanFeatures) => void;
}

export const PlanFeatureGrid: React.FC<PlanFeatureGridProps> = ({
  features,
  interactive = false,
  onChange,
}) => {
  const featureDefinitions: Array<{
    key: keyof PlanFeatures;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    category: 'CORE' | 'AI' | 'ADVANCED';
  }> = [
    {
      key: 'displayManagement',
      label: 'Gestão de Displays & Players',
      description: 'Provisionamento, monitoramento de status e envio de comandos aos terminais.',
      icon: Tv,
      category: 'CORE',
    },
    {
      key: 'contentManagement',
      label: 'Biblioteca de Conteúdos & Mídia',
      description: 'Upload de imagens, vídeos em 4K, banners e controle de tags.',
      icon: Film,
      category: 'CORE',
    },
    {
      key: 'playlistManagement',
      label: 'Playlists Dinâmicas',
      description: 'Composição de sequências de mídia com tempo e transições.',
      icon: ListMusic,
      category: 'CORE',
    },
    {
      key: 'scheduling',
      label: 'Programação de Horários Padrão',
      description: 'Definição de horários de início e término diários e semanais.',
      icon: Calendar,
      category: 'CORE',
    },
    {
      key: 'advancedScheduling',
      label: 'Agendamento Avançado & Prioridade',
      description: 'Campanhas simultâneas com regras de sobreposição e prioridade de loop.',
      icon: CalendarDays,
      category: 'ADVANCED',
    },
    {
      key: 'teamManagement',
      label: 'Múltiplos Usuários & RBAC',
      description: 'Convite a membros da equipe com perfis Owner, Manager e Editor.',
      icon: Users,
      category: 'CORE',
    },
    {
      key: 'analytics',
      label: 'Relatórios de Audiência & Proof of Play',
      description: 'Estatísticas detalhadas de veiculação e telemetria de visualizações.',
      icon: BarChart3,
      category: 'ADVANCED',
    },
    {
      key: 'remoteMonitoring',
      label: 'NOC & Telemetria Remota em Tempo Real',
      description: 'Detecção instantânea de offline e alertas operacionais.',
      icon: Activity,
      category: 'CORE',
    },
    {
      key: 'aiImageGeneration',
      label: 'AI Studio: Geração de Imagens',
      description: 'Criação assistida de criativos publicitários com IA generativa.',
      icon: Sparkles,
      category: 'AI',
    },
    {
      key: 'aiVideoGeneration',
      label: 'AI Studio: Motion Video Studio',
      description: 'Renderização de vídeos promocionais em alta definição com IA.',
      icon: Video,
      category: 'AI',
    },
    {
      key: 'advertisingMarketplace',
      label: 'Marketplace de Publicidade Nexora',
      description: 'Monetização de inventário e recebimento de campanhas externas na rede.',
      icon: Megaphone,
      category: 'ADVANCED',
    },
    {
      key: 'prioritySupport',
      label: 'Suporte Técnico Prioritário (Luanda)',
      description: 'Atendimento presencial e remoto com SLA de até 4 horas.',
      icon: Headphones,
      category: 'ADVANCED',
    },
    {
      key: 'customBranding',
      label: 'Custom Branding & White-label',
      description: 'Logomarca e identidade visual customizada no player.',
      icon: Palette,
      category: 'ADVANCED',
    },
    {
      key: 'multiZoneLayout',
      label: 'Layouts Multi-Zona (Tela Dividida)',
      description: 'Exibição de tickers de notícias, relógio, clima e vídeo em zonas separadas.',
      icon: LayoutGrid,
      category: 'ADVANCED',
    },
    {
      key: 'auditLogs',
      label: 'Logs de Auditoria & Compliance',
      description: 'Rastreabilidade de todas as alterações feitas por usuários na conta.',
      icon: FileText,
      category: 'ADVANCED',
    },
    {
      key: 'slaGuaranteed',
      label: 'Garantia de Uptime Contratual (SLA 99.5%)',
      description: 'Compromisso formal de disponibilidade e compensação em caso de parada.',
      icon: ShieldAlert,
      category: 'ADVANCED',
    },
  ];

  const handleToggle = (key: keyof PlanFeatures) => {
    if (!interactive || !onChange) return;
    onChange({
      ...features,
      [key]: !features[key],
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {featureDefinitions.map((item) => {
        const isEnabled = Boolean(features[item.key]);
        const Icon = item.icon;

        return (
          <div
            key={item.key}
            onClick={() => handleToggle(item.key)}
            className={`p-3.5 rounded-xl border transition-all ${
              interactive ? 'cursor-pointer select-none hover:border-slate-700' : ''
            } ${
              isEnabled
                ? 'bg-slate-900/90 border-slate-800 text-white'
                : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isEnabled
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-900 text-slate-600 border border-slate-800'
                }`}
              >
                {isEnabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${isEnabled ? 'text-cyan-400' : 'text-slate-600'}`} />
                  <span className={`text-xs font-semibold ${isEnabled ? 'text-white' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  {item.description}
                </p>
              </div>

              {interactive && (
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border text-[10px] ${
                    isEnabled
                      ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-bold'
                      : 'border-slate-700 text-transparent'
                  }`}
                >
                  ✓
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
