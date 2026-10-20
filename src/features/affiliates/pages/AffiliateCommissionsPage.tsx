import React, { useState, useEffect } from 'react';
import {
  Coins,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Building2,
  Briefcase,
  Monitor,
  Download,
  ChevronLeft,
} from 'lucide-react';
import { affiliateRepository } from '../../../repositories/affiliateRepository';
import { AffiliateCommission, CommissionSourceType } from '../../../types/affiliate';

interface AffiliateCommissionsPageProps {
  onBack?: () => void;
}

export const AffiliateCommissionsPage: React.FC<AffiliateCommissionsPageProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PAID' | 'PENDING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCommissions();
  }, []);

  const loadCommissions = async () => {
    setLoading(true);
    try {
      const data = await affiliateRepository.getCommissions();
      setCommissions(data);
    } catch (err) {
      console.error('Erro ao carregar comissões:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = commissions.filter((c) => {
    const matchesSearch = c.sourceDescription.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCommissions = commissions.reduce(
    (sum, c) => sum + parseFloat(String(c.commissionAmountKz || 0)),
    0
  );
  const totalPaid = commissions
    .filter((c) => c.status === 'PAID')
    .reduce((sum, c) => sum + parseFloat(String(c.commissionAmountKz || 0)), 0);
  const totalPending = commissions
    .filter((c) => c.status === 'APPROVED')
    .reduce((sum, c) => sum + parseFloat(String(c.commissionAmountKz || 0)), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Coins className="w-6 h-6 text-emerald-400" />
              Extrato de Comissões Recorrentes
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Histórico detalhado de cada comissão recebida por mensalidades de estabelecimentos, campanhas e displays.
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#090E1A] border border-emerald-500/20">
          <span className="text-[11px] font-semibold uppercase text-emerald-400">Saldo Disponível para Saque</span>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
            {totalPending.toLocaleString('pt-AO')} KZ
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#090E1A] border border-blue-500/20">
          <span className="text-[11px] font-semibold uppercase text-blue-400">Total Já Liquidado</span>
          <div className="text-xl font-bold text-blue-400 font-mono mt-1">
            {totalPaid.toLocaleString('pt-AO')} KZ
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#090E1A] border border-white/[0.06]">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Total de Comissões Geradas</span>
          <div className="text-xl font-bold text-white font-mono mt-1">
            {totalCommissions.toLocaleString('pt-AO')} KZ
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-[#090E1A] border border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por descrição da transação ou empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#070B14] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {(['ALL', 'APPROVED', 'PAID', 'PENDING'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              {st === 'ALL' ? 'Todas' : st === 'APPROVED' ? 'Disponíveis' : st === 'PAID' ? 'Pagas' : 'Pendentes'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#090E1A] border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs">Carregando extrato de comissões...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            Nenhuma comissão encontrada com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/[0.06] text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Origem / Evento</th>
                  <th className="py-3 px-4">Descrição da Recorrência</th>
                  <th className="py-3 px-4 text-right">Valor Pago pelo Indicado</th>
                  <th className="py-3 px-4 text-center">Taxa Aplicada</th>
                  <th className="py-3 px-4 text-right">Sua Comissão</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((comm) => (
                  <tr key={comm.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(comm.createdAt).toLocaleDateString('pt-AO')}
                    </td>
                    <td className="py-3.5 px-4">
                      {comm.sourceType === 'SAAS_PLAN' ? (
                        <span className="inline-flex items-center gap-1 text-cyan-400 font-medium">
                          <Building2 className="w-3.5 h-3.5" /> Estabelecimento
                        </span>
                      ) : comm.sourceType === 'CAMPAIGN' ? (
                        <span className="inline-flex items-center gap-1 text-pink-400 font-medium">
                          <Briefcase className="w-3.5 h-3.5" /> Campanha
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                          <Monitor className="w-3.5 h-3.5" /> Display / Totem
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white max-w-md truncate">
                      {comm.sourceDescription}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                      {parseFloat(String(comm.paymentAmountKz || 0)).toLocaleString('pt-AO')} KZ
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-emerald-400">
                      {comm.commissionRate}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      +{parseFloat(String(comm.commissionAmountKz || 0)).toLocaleString('pt-AO')} KZ
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] rounded-full font-medium ${
                          comm.status === 'PAID'
                            ? 'bg-blue-500/10 text-blue-400'
                            : comm.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {comm.status === 'PAID' ? 'Pago' : comm.status === 'APPROVED' ? 'Disponível' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
