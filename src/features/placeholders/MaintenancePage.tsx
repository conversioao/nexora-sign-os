import React, { useEffect, useState } from 'react';
import { Wrench, ShieldCheck, Activity, AlertTriangle, Plus, CheckCircle, Clock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const MaintenancePage: React.FC<{ onBackToDashboard: () => void }> = ({ onBackToDashboard }) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [displays, setDisplays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    display_id: '',
    title: '',
    description: '',
    severity: 'medium',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const ticketsRes = await fetch('/api/maintenance');
      const displaysRes = await fetch('/api/displays');
      if (ticketsRes.ok) setTickets(await ticketsRes.json());
      if (displaysRes.ok) setDisplays(await displaysRes.json());
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTicket = {
      id: `ticket-${Date.now()}`,
      display_id: formData.display_id || (displays[0]?.id || null),
      title: formData.title || 'Manutenção Solicitada',
      description: formData.description || 'Descrição detalhada do chamado técnico',
      status: 'open',
      severity: formData.severity,
      assigned_to: 'usr-admin',
    };

    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket),
      });
      if (res.ok) {
        setShowAddForm(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error creating technical ticket:', error);
    }
  };

  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-[#FBBF24]" />
            Módulo de Manutenção de Campo & Telemetria
          </h1>
          <p className="text-slate-400 text-sm">Ordens de serviço técnico, controle de temperatura e manutenção preventiva de hardware.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FBBF24] hover:bg-[#D97706] text-black font-bold text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black" />
            Abrir Chamado Técnico
          </button>
          <button
            onClick={onBackToDashboard}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-semibold cursor-pointer"
          >
            Voltar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 flex items-center gap-4 border-l-4 border-emerald-400">
          <div className="p-3 bg-emerald-400/10 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Uptime da Rede</p>
            <h3 className="text-xl font-bold text-white mt-1">99.8%</h3>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4 border-l-4 border-amber-400">
          <div className="p-3 bg-amber-400/10 rounded-xl">
            <Activity className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Chamados em Aberto</p>
            <h3 className="text-xl font-bold text-white mt-1">{openTickets}</h3>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4 border-l-4 border-rose-400">
          <div className="p-3 bg-rose-400/10 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Alertas Críticos</p>
            <h3 className="text-xl font-bold text-white mt-1">
              {tickets.filter(t => t.severity === 'critical' && t.status !== 'closed').length}
            </h3>
          </div>
        </Card>
      </div>

      {showAddForm && (
        <Card className="p-6">
          <h2 className="text-lg font-bold text-white mb-4">Novo Chamado Técnico</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-semibold">Selecionar Display</label>
              <select
                value={formData.display_id}
                onChange={e => setFormData({ ...formData, display_id: e.target.value })}
                className="w-full bg-[#0D1424] border border-white/5 rounded-lg px-3 py-2 text-white text-sm focus:border-[#FBBF24] outline-none"
              >
                <option value="">Selecione um Display</option>
                {displays.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.location})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-semibold">Gravidade / Prioridade</label>
              <select
                value={formData.severity}
                onChange={e => setFormData({ ...formData, severity: e.target.value })}
                className="w-full bg-[#0D1424] border border-white/5 rounded-lg px-3 py-2 text-white text-sm focus:border-[#FBBF24] outline-none"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1.5 font-semibold font-display">Título do Chamado</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Superaquecimento ou Tela preta"
                className="w-full bg-[#0D1424] border border-white/5 rounded-lg px-3 py-2 text-white text-sm focus:border-[#FBBF24] outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1.5 font-semibold font-display">Descrição Detalhada</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Informe o comportamento do display ou erros observados"
                className="w-full bg-[#0D1424] border border-white/5 rounded-lg px-3 py-2 text-white text-sm focus:border-[#FBBF24] outline-none h-24"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#FBBF24] hover:bg-[#D97706] text-black font-bold text-sm cursor-pointer"
              >
                Confirmar Abertura
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Tickets List */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-white mb-4">Chamados Técnicos</h2>
        {loading ? (
          <div className="text-slate-400 text-sm py-4">Carregando chamados do banco de dados...</div>
        ) : tickets.length === 0 ? (
          <div className="text-slate-400 text-sm py-4">Nenhum chamado aberto no momento.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tickets.map(t => (
              <Card key={t.id} className="p-4 border border-white/5 space-y-3 bg-[#0D1424]/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-bold">{t.title}</h3>
                    <p className="text-xs text-slate-500">ID: {t.id} • Gravidade: <span className="uppercase text-amber-500 font-semibold">{t.severity}</span></p>
                  </div>
                  <Badge variant={t.status === 'open' ? 'magenta' : 'cyan'}>
                    {t.status}
                  </Badge>
                </div>
                <p className="text-slate-400 text-sm">{t.description}</p>
                <div className="pt-2 border-t border-white/5 flex justify-between text-xs text-slate-500">
                  <span>Display ID: {t.display_id}</span>
                  <span>Aberto em: {new Date(t.created_at).toLocaleDateString('pt-AO')}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
