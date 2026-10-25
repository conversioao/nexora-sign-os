import React from 'react';
import {
  Check,
  X,
  Tv,
  HardDrive,
  Users,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { Plan } from '../../../types/saas';
import { formatKz, formatInterval } from '../utils/saasFormatters';
import { Button } from '../../../components/ui/Button';

interface PlanCardProps {
  plan: Plan;
  onSelect?: (plan: Plan) => void;
  onEdit?: (plan: Plan) => void;
  showAdminActions?: boolean;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  onSelect,
  onEdit,
  showAdminActions = true,
}) => {
  const isPopular = plan.isPopular;

  const featureItems = [
    { label: 'Gestão de Displays', enabled: plan.features.displayManagement },
    { label: 'Gestão de Conteúdos & Mídia', enabled: plan.features.contentManagement },
    { label: 'Playlists Dinâmicas', enabled: plan.features.playlistManagement },
    { label: 'Programação de Horários', enabled: plan.features.scheduling },
    { label: 'Agendamento Avançado & Prioridade', enabled: plan.features.advancedScheduling },
    { label: 'Gestão de Membros de Equipa', enabled: plan.features.teamManagement },
    { label: 'Métricas & Relatórios de Audiência', enabled: plan.features.analytics },
    { label: 'Monitoramento & NOC Remoto', enabled: plan.features.remoteMonitoring },
    { label: 'Geração de Imagens com IA', enabled: plan.features.aiImageGeneration },
    { label: 'Estúdio de Vídeo com IA', enabled: plan.features.aiVideoGeneration },
    { label: 'Marketplace de Anúncios Nexora', enabled: plan.features.advertisingMarketplace },
    { label: 'Suporte Prioritário Luanda', enabled: plan.features.prioritySupport },
  ];

  return (
    <div
      className={`relative flex flex-col rounded-xl transition-all duration-200 ${
        isPopular
          ? 'bg-slate-900 border-2 border-cyan-500 shadow-xl shadow-cyan-500/10'
          : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold px-3.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {plan.badgeText || 'Mais Popular'}
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <span className="text-[11px] font-mono text-cyan-400 font-medium tracking-wider uppercase">
              {plan.code}
            </span>
            <h3 className="text-xl font-bold text-white mt-0.5">{plan.name}</h3>
          </div>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              plan.status === 'ACTIVE'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : plan.status === 'DRAFT'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
            }`}
          >
            {plan.status === 'ACTIVE' ? 'Ativo' : plan.status === 'DRAFT' ? 'Rascunho' : 'Arquivado'}
          </span>
        </div>

        <p className="text-sm text-slate-400 mb-5 min-h-[40px] leading-relaxed">
          {plan.description}
        </p>

        {/* Pricing Box */}
        <div className="bg-slate-950/60 rounded-lg p-4 border border-slate-800/80 mb-5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {formatKz(plan.basePrice)}
            </span>
            <span className="text-sm text-slate-400 font-medium">
              {formatInterval(plan.billingInterval)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Faturamento em Kwanzas (AOA) com emissão de fatura pró-forma
          </p>
        </div>

        {/* Limits Grid */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-800 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
              <Tv className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {plan.displayLimit === 0 ? 'Slots Rede' : `${plan.displayLimit} Telas`}
              </div>
              <div className="text-[10px] text-slate-400">Limite de Displays</div>
            </div>
          </div>

          <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-800 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
              <HardDrive className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">{plan.storageLimitGB} GB</div>
              <div className="text-[10px] text-slate-400">Armazenamento</div>
            </div>
          </div>

          <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-800 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-violet-500/10 flex items-center justify-center text-violet-400 shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {plan.monthlyAiCredits.toLocaleString('pt-AO')} pts
              </div>
              <div className="text-[10px] text-slate-400">Créditos IA / mês</div>
            </div>
          </div>

          <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-800 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">{plan.teamMemberLimit} Usuários</div>
              <div className="text-[10px] text-slate-400">Membros de Equipa</div>
            </div>
          </div>
        </div>

        {/* Feature List */}
        <div className="border-t border-slate-800 pt-4 flex-1">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Recursos & Entitlements
          </h4>
          <ul className="space-y-2.5 text-xs">
            {featureItems.map((item, idx) => (
              <li
                key={idx}
                className={`flex items-start gap-2 ${
                  item.enabled ? 'text-slate-300' : 'text-slate-500 line-through opacity-70'
                }`}
              >
                {item.enabled ? (
                  <div className="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                    <X className="w-2.5 h-2.5" />
                  </div>
                )}
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Subscribed Orgs info */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              <strong className="text-white font-semibold">
                {plan.activeSubscriptionsCount ?? 0}
              </strong>{' '}
              {plan.activeSubscriptionsCount === 1 ? 'organização ativa' : 'organizações ativas'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 flex gap-2">
          {onSelect && (
            <Button
              variant={isPopular ? 'primary' : 'outline'}
              className="w-full justify-center text-xs py-2"
              onClick={() => onSelect(plan)}
            >
              <span>Ver Detalhes do Plano</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}
          {showAdminActions && onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(plan)}
              className="text-xs px-3"
            >
              Editar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
