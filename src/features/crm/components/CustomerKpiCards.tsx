import React from 'react';
import { CustomerKPIs } from '../../../types/crm';
import { Card, CardContent } from '../../../components/ui';
import { Users, CheckCircle2, UserCheck, Monitor, Banknote, UserX } from 'lucide-react';

interface CustomerKpiCardsProps {
  kpis: CustomerKPIs;
  loading?: boolean;
}

export const CustomerKpiCards: React.FC<CustomerKpiCardsProps> = ({ kpis, loading = false }) => {
  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0,
    }).format(val).replace('Kz', '').trim() + ' Kz';
  };

  const cards = [
    {
      id: 'total-customers',
      label: 'Total de Clientes',
      value: kpis.totalCustomers,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      subtitle: 'Organizações cadastradas',
    },
    {
      id: 'active-customers',
      label: 'Clientes Ativos',
      value: kpis.activeCustomers,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      subtitle: 'Com contratos vigentes',
    },
    {
      id: 'prospects',
      label: 'Prospects & Leads',
      value: kpis.prospectCustomers,
      icon: UserCheck,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      subtitle: 'Em negociação comercial',
    },
    {
      id: 'installed-displays',
      label: 'Displays Alocados',
      value: kpis.installedDisplays,
      icon: Monitor,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
      subtitle: 'Telas na rede de clientes',
    },
    {
      id: 'monthly-revenue',
      label: 'Receita Mensal Estimada',
      value: formatKz(kpis.estimatedMonthlyRevenueKz),
      isText: true,
      icon: Banknote,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      subtitle: 'Planos SaaS ativos (AOA)',
    },
    {
      id: 'inactive-customers',
      label: 'Inativos / Suspensos',
      value: kpis.inactiveCustomers,
      icon: UserX,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      subtitle: 'Aguardando renovação',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
                  <p className="text-lg font-bold font-display text-[#F8FAFC] tracking-tight">
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
