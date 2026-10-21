import React from 'react';
import { AdvertiserKPIs } from '../../../types/crm';
import { Card, CardContent } from '../../../components/ui';
import { Briefcase, CheckCircle2, Megaphone, Banknote, Sparkles } from 'lucide-react';

interface AdvertiserKpiCardsProps {
  kpis: AdvertiserKPIs;
  loading?: boolean;
}

export const AdvertiserKpiCards: React.FC<AdvertiserKpiCardsProps> = ({ kpis, loading = false }) => {
  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0,
    }).format(val).replace('Kz', '').trim() + ' Kz';
  };

  const cards = [
    {
      id: 'total-advertisers',
      label: 'Total de Anunciantes',
      value: kpis.totalAdvertisers,
      icon: Briefcase,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10 border-pink-500/20',
      subtitle: 'Marcas & Agências',
    },
    {
      id: 'active-advertisers',
      label: 'Anunciantes Ativos',
      value: kpis.activeAdvertisers,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      subtitle: 'Com veiculações correntes',
    },
    {
      id: 'prospect-advertisers',
      label: 'Prospects & Mídia',
      value: kpis.prospectAdvertisers,
      icon: Sparkles,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      subtitle: 'Propostas em aberto',
    },
    {
      id: 'active-campaigns',
      label: 'Campanhas Ativas',
      value: kpis.activeCampaigns,
      icon: Megaphone,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
      subtitle: 'Veiculações na rede',
    },
    {
      id: 'estimated-investment',
      label: 'Investimento Mensal Estimado',
      value: formatKz(kpis.estimatedMonthlyInvestmentKz),
      icon: Banknote,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      subtitle: 'Orçamento publicitário (AOA)',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.id} className="p-3.5 relative overflow-hidden" glow="none">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-[#94A3B8] truncate">{card.label}</span>
                <div className={`p-1.5 rounded-lg border ${card.bg} ${card.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="space-y-0.5">
                {loading ? (
                  <div className="h-6 w-16 bg-white/5 animate-pulse rounded" />
                ) : (
                  <p className="text-lg font-bold font-display text-[#F8FAFC] tracking-tight truncate">
                    {card.value}
                  </p>
                )}
                <p className="text-[10px] text-[#64748B] truncate">{card.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
