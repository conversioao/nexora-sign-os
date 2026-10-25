import React, { useState } from 'react';
import { X, ShieldAlert, Plus, Trash2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Subscription, SubscriptionStatus, AddOn } from '../../../types/saas';
import { formatKz } from '../utils/saasFormatters';
import { Button } from '../../../components/ui/Button';

interface SubscriptionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription | null;
  availableAddOns: AddOn[];
  onUpdateStatus: (id: string, status: SubscriptionStatus) => Promise<void>;
  onAddAddOn: (subscriptionId: string, addOnId: string, quantity: number) => Promise<void>;
  onRemoveAddOn: (subscriptionId: string, subAddOnId: string) => Promise<void>;
}

export const SubscriptionStatusModal: React.FC<SubscriptionStatusModalProps> = ({
  isOpen,
  onClose,
  subscription,
  availableAddOns,
  onUpdateStatus,
  onAddAddOn,
  onRemoveAddOn,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<SubscriptionStatus>(
    subscription?.status || 'ACTIVE'
  );
  const [selectedAddOnId, setSelectedAddOnId] = useState<string>(
    availableAddOns[0]?.id || ''
  );
  const [addOnQuantity, setAddOnQuantity] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !subscription) return null;

  const handleStatusChange = async () => {
    try {
      setSaving(true);
      setError(null);
      await onUpdateStatus(subscription.id, selectedStatus);
      setSuccessMsg(`Status alterado com sucesso para ${selectedStatus}!`);
      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    } catch (err: any) {
      setError(err?.message || 'Erro ao alterar status da subscrição.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddOn = async () => {
    if (!selectedAddOnId) return;
    try {
      setSaving(true);
      setError(null);
      await onAddAddOn(subscription.id, selectedAddOnId, addOnQuantity);
      setSuccessMsg('Add-on contratado com sucesso!');
      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    } catch (err: any) {
      setError(err?.message || 'Erro ao adicionar add-on.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAddOn = async (subAddOnId: string) => {
    try {
      setSaving(true);
      setError(null);
      await onRemoveAddOn(subscription.id, subAddOnId);
      setSuccessMsg('Add-on removido.');
      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    } catch (err: any) {
      setError(err?.message || 'Erro ao remover add-on.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Gestão da Subscrição SaaS
              </h3>
              <p className="text-xs text-slate-400">
                {subscription.organizationName} ({subscription.planName})
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Lifecycle Status Transition */}
          <div>
            <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
              1. Ciclo de Vida & Status
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Alterne o estado da subscrição para simular cobrança pendente, ativação ou suspensão:
            </p>
            <div className="flex items-center gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as SubscriptionStatus)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ACTIVE">ACTIVE (Ativa - Regular)</option>
                <option value="TRIAL">TRIAL (Período de Testes)</option>
                <option value="PAST_DUE">PAST_DUE (Pagamento Pendente)</option>
                <option value="SUSPENDED">SUSPENDED (Suspensa por Inadimplência)</option>
                <option value="CANCELLED">CANCELLED (Cancelada pelo Cliente)</option>
                <option value="EXPIRED">EXPIRED (Prazo de Vigência Expirado)</option>
              </select>

              <Button
                variant="primary"
                size="sm"
                onClick={handleStatusChange}
                disabled={saving || selectedStatus === subscription.status}
              >
                Atualizar Status
              </Button>
            </div>
          </div>

          {/* Section 2: Add-Ons Management */}
          <div className="border-t border-slate-800 pt-5">
            <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
              2. Módulos Adicionais (Add-ons) Ativos
            </h4>

            {/* List current add-ons */}
            {subscription.addOns && subscription.addOns.length > 0 ? (
              <div className="space-y-2 mb-4">
                {subscription.addOns.map((addon) => (
                  <div
                    key={addon.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      <div>
                        <span className="font-semibold text-white">{addon.addOnName}</span>
                        <span className="text-slate-500 ml-2 font-mono">
                          (Qtd: {addon.quantity} × {formatKz(addon.unitPrice)})
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveAddOn(addon.id)}
                      className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/10 rounded transition-colors"
                      title="Remover Add-on"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 mb-4 italic">
                Nenhum add-on contratado atualmente por esta organização.
              </p>
            )}

            {/* Contract new add-on */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Contratar Novo Add-on:
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedAddOnId}
                  onChange={(e) => setSelectedAddOnId(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                >
                  {availableAddOns.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} - {formatKz(a.price)}{a.unitLabel}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  max="10"
                  value={addOnQuantity}
                  onChange={(e) => setAddOnQuantity(Number(e.target.value))}
                  className="w-16 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none"
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddAddOn}
                  disabled={saving || !selectedAddOnId}
                  className="text-xs whitespace-nowrap"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};
