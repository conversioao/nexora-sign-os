import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Plan, PlanStatus, BillingInterval, PlanFeatures } from '../../../types/saas';
import { PlanFeatureGrid } from './PlanFeatureGrid';
import { Button } from '../../../components/ui/Button';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (planData: Partial<Plan>) => Promise<void>;
  initialPlan?: Plan | null;
}

export const CreatePlanModal: React.FC<CreatePlanModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialPlan,
}) => {
  const [name, setName] = useState(initialPlan?.name || '');
  const [code, setCode] = useState(initialPlan?.code || '');
  const [description, setDescription] = useState(initialPlan?.description || '');
  const [basePrice, setBasePrice] = useState(initialPlan?.basePrice ? String(initialPlan.basePrice) : '50000');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(initialPlan?.billingInterval || 'MONTHLY');
  const [status, setStatus] = useState<PlanStatus>(initialPlan?.status || 'ACTIVE');
  const [displayLimit, setDisplayLimit] = useState(initialPlan?.displayLimit ? String(initialPlan.displayLimit) : '5');
  const [storageLimitGB, setStorageLimitGB] = useState(initialPlan?.storageLimitGB ? String(initialPlan.storageLimitGB) : '20');
  const [teamMemberLimit, setTeamMemberLimit] = useState(initialPlan?.teamMemberLimit ? String(initialPlan.teamMemberLimit) : '3');
  const [playlistLimit, setPlaylistLimit] = useState(initialPlan?.playlistLimit ? String(initialPlan.playlistLimit) : '15');
  const [scheduleLimit, setScheduleLimit] = useState(initialPlan?.scheduleLimit ? String(initialPlan.scheduleLimit) : '15');
  const [monthlyAiCredits, setMonthlyAiCredits] = useState(initialPlan?.monthlyAiCredits ? String(initialPlan.monthlyAiCredits) : '500');
  const [badgeText, setBadgeText] = useState(initialPlan?.badgeText || '');
  const [isPopular, setIsPopular] = useState(initialPlan?.isPopular || false);

  const [features, setFeatures] = useState<PlanFeatures>(
    initialPlan?.features || {
      displayManagement: true,
      contentManagement: true,
      playlistManagement: true,
      scheduling: true,
      advancedScheduling: false,
      teamManagement: true,
      analytics: true,
      remoteMonitoring: true,
      aiImageGeneration: true,
      aiVideoGeneration: false,
      advertisingMarketplace: false,
      prioritySupport: false,
      customBranding: false,
      multiZoneLayout: false,
      auditLogs: false,
      slaGuaranteed: false,
    }
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do plano é obrigatório.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload: Partial<Plan> = {
        name,
        code: code.trim() || `PLAN_${name.toUpperCase().replace(/\s+/g, '_')}`,
        description,
        basePrice: Number(basePrice) || 0,
        billingInterval,
        status,
        displayLimit: Number(displayLimit) || 0,
        storageLimitGB: Number(storageLimitGB) || 0,
        teamMemberLimit: Number(teamMemberLimit) || 1,
        playlistLimit: Number(playlistLimit) || 0,
        scheduleLimit: Number(scheduleLimit) || 0,
        monthlyAiCredits: Number(monthlyAiCredits) || 0,
        badgeText: badgeText.trim() || undefined,
        isPopular,
        features,
        entitlements: {
          maxDisplays: Number(displayLimit) || 0,
          maxStorageGB: Number(storageLimitGB) || 0,
          maxTeamMembers: Number(teamMemberLimit) || 1,
          maxPlaylists: Number(playlistLimit) || 0,
          maxSchedules: Number(scheduleLimit) || 0,
          monthlyAiCredits: Number(monthlyAiCredits) || 0,
          maxVideoGenerations: features.aiVideoGeneration ? 10 : 0,
        },
      };

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Falha ao salvar o plano.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl my-8">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialPlan ? 'Editar Plano SaaS' : 'Criar Novo Plano SaaS'}
              </h3>
              <p className="text-xs text-slate-400">
                Configure os parâmetros comerciais, limites de recursos e entitlements.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Section: Basic Info */}
          <div>
            <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3">
              1. Informações Básicas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome Comercial do Plano *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Nexora Pro Business"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Código Identificador (Slug)
                </label>
                <input
                  type="text"
                  placeholder="ex: PLAN_PRO_BUSINESS"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Descrição Comercial
                </label>
                <textarea
                  rows={2}
                  placeholder="Descreva a finalidade e público-alvo deste plano..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Preço Base (em Kwanzas - AOA) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Ciclo de Faturamento
                </label>
                <select
                  value={billingInterval}
                  onChange={(e) => setBillingInterval(e.target.value as BillingInterval)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="MONTHLY">Mensal</option>
                  <option value="QUARTERLY">Trimestral</option>
                  <option value="YEARLY">Anual</option>
                  <option value="CUSTOM">Personalizado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Status de Publicação
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PlanStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="ACTIVE">Ativo (Disponível)</option>
                  <option value="DRAFT">Rascunho (Interno)</option>
                  <option value="ARCHIVED">Arquivado (Descontinuado)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Texto do Badge em Destaque
                </label>
                <input
                  type="text"
                  placeholder="ex: Mais Popular / Oferta Especial"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                type="checkbox"
                id="isPopularCheck"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-950"
              />
              <label htmlFor="isPopularCheck" className="text-xs text-slate-300 cursor-pointer">
                Destacar visualmente como plano recomendado na vitrine
              </label>
            </div>
          </div>

          {/* Section: Resource Limits */}
          <div className="border-t border-slate-800 pt-5">
            <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3">
              2. Limites Quantitativos (Entitlements)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Limite de Displays (Telas)
                </label>
                <input
                  type="number"
                  min="0"
                  value={displayLimit}
                  onChange={(e) => setDisplayLimit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Armazenamento (GB)
                </label>
                <input
                  type="number"
                  min="1"
                  value={storageLimitGB}
                  onChange={(e) => setStorageLimitGB(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Membros de Equipe
                </label>
                <input
                  type="number"
                  min="1"
                  value={teamMemberLimit}
                  onChange={(e) => setTeamMemberLimit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Limite de Playlists
                </label>
                <input
                  type="number"
                  min="0"
                  value={playlistLimit}
                  onChange={(e) => setPlaylistLimit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Limite de Agendamentos
                </label>
                <input
                  type="number"
                  min="0"
                  value={scheduleLimit}
                  onChange={(e) => setScheduleLimit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Créditos IA Mensais
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={monthlyAiCredits}
                  onChange={(e) => setMonthlyAiCredits(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Linked Displays Selection */}
          <div className="border-t border-slate-800 pt-5 space-y-3">
            <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              3. Vincular Displays Específicos a este Pacote
            </h4>
            <p className="text-xs text-slate-400">
              Selecione quais telas/displays pertencem a este pacote comercial para veiculação direta.
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-40 overflow-y-auto space-y-2">
              {[
                { id: 'dsp-1789652888471', name: 'TALATONNA (Talatona Shopping)', code: 'NX-8698' },
                { id: 'dsp-1789643826906', name: 'CASA (Luanda Centro)', code: 'NX-7805' },
                { id: 'dsp-1789552697044', name: 'Display Aeroporto 01', code: 'NX-1002' },
                { id: 'dsp-1789552679683', name: 'Totem Belas Shopping', code: 'NX-5001' },
              ].map((d) => (
                <label key={d.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-white/5 hover:border-cyan-500/40 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <input type="checkbox" defaultChecked className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-950" />
                    <div>
                      <span className="text-xs font-semibold text-white">{d.name}</span>
                      <span className="text-[10px] text-cyan-400 font-mono ml-2">{d.code}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Ativo</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section: Features & Capabilities Matrix */}
          <div className="border-t border-slate-800 pt-5">
            <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
              3. Matriz de Recursos Habilitados (Features)
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Clique nos cards para habilitar ou desabilitar cada recurso para os assinantes deste plano.
            </p>
            <PlanFeatureGrid features={features} interactive={true} onChange={setFeatures} />
          </div>

          {/* Modal Footer Buttons */}
          <div className="border-t border-slate-800 pt-4 flex items-center justify-end gap-3">
            <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'A salvar...' : initialPlan ? 'Atualizar Plano' : 'Criar Plano'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
