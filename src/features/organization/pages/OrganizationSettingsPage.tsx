import React, { useState, useEffect } from 'react';
import {
  Building2,
  Building,
  Briefcase,
  Wrench,
  Save,
  Check,
  Globe,
  Clock,
  Shield,
  Phone,
  Mail,
  MapPin,
  FileText,
  Sparkles,
  Users,
  Monitor,
} from 'lucide-react';
import { useSession } from '../../../context/SessionContext';
import { Organization, OrganizationType } from '../../../types/auth';
import { ORGANIZATION_TYPE_LABELS } from '../../../services/permissionService';
import { useToast } from '../../../components/ui/Toast';

export const OrganizationSettingsPage: React.FC<{
  onNavigateToUsers?: () => void;
}> = ({ onNavigateToUsers }) => {
  const { currentOrganization, updateOrganization, hasPermission } = useSession();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<Partial<Organization>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentOrganization) {
      setFormData({
        name: currentOrganization.name,
        tradeName: currentOrganization.tradeName,
        type: currentOrganization.type,
        nif: currentOrganization.nif,
        contactEmail: currentOrganization.contactEmail,
        phone: currentOrganization.phone,
        address: currentOrganization.address,
        city: currentOrganization.city,
        province: currentOrganization.province,
        country: currentOrganization.country,
        timezone: currentOrganization.timezone,
        settings: {
          defaultTimezone: currentOrganization.settings?.defaultTimezone || 'Africa/Luanda',
          currency: currentOrganization.settings?.currency || 'AOA',
          language: currentOrganization.settings?.language || 'pt-AO',
          twoFactorRequired: currentOrganization.settings?.twoFactorRequired || false,
        },
      });
    }
  }, [currentOrganization]);

  if (!currentOrganization) return null;

  const canEdit = hasPermission('organization.update');
  const typeMeta = ORGANIZATION_TYPE_LABELS[currentOrganization.type];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      showToast('Você não possui permissão para alterar os dados da organização.', 'danger');
      return;
    }

    setIsSaving(true);
    try {
      await updateOrganization(formData);
      showToast('Dados da organização atualizados com sucesso!', 'success');
    } catch (err: any) {
      showToast('Erro ao salvar dados da organização.', 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-[#0B1120] border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${
                currentOrganization.logoGradient || 'from-blue-600 to-cyan-500'
              } flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20`}
            >
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white font-display">
                  {currentOrganization.name}
                </h1>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border ${typeMeta.badge}`}>
                  {currentOrganization.type}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Código: <span className="font-mono text-cyan-400 font-semibold">{currentOrganization.code}</span> • {currentOrganization.city}, {currentOrganization.province}
              </p>
            </div>
          </div>

          {onNavigateToUsers && (
            <button
              type="button"
              onClick={onNavigateToUsers}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 transition-colors text-xs font-semibold cursor-pointer"
            >
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Gerir Membros da Equipa</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="p-6 rounded-3xl bg-[#0B1120] border border-white/10 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display mb-1">
              Informações Cadastrais & Empresa
            </h3>
            <p className="text-xs text-slate-400">
              Dados fiscais e de identificação utilizados para faturamento e contratos em Angola.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nome Comercial (Fantasia) *
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/10 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Razão Social Completa *
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.tradeName || ''}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/10 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                NIF (Número de Identificação Fiscal)
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.nif || ''}
                onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/10 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none font-mono disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tipo de Organização
              </label>
              <input
                type="text"
                disabled
                value={`${typeMeta.label} (${currentOrganization.type})`}
                className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 outline-none opacity-80"
              />
            </div>
          </div>
        </div>

        {/* Contact & Location */}
        <div className="p-6 rounded-3xl bg-[#0B1120] border border-white/10 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display mb-1">
              Contacto & Localização
            </h3>
            <p className="text-xs text-slate-400">
              Endereço principal e canal de comunicação para notificações operacionais.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Comercial *
              </label>
              <input
                type="email"
                disabled={!canEdit}
                value={formData.contactEmail || ''}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/10 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Telefone de Contacto (Angola)
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/10 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none font-mono disabled:opacity-60"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Endereço Físico / Edifício
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/10 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Município
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/10 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Província / País
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={`${formData.province || 'Luanda'}, ${formData.country || 'Angola'}`}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/10 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Regional & System Preferences */}
        <div className="p-6 rounded-3xl bg-[#0B1120] border border-white/10 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display mb-1">
              Configurações Regionais & Fuso Horário
            </h3>
            <p className="text-xs text-slate-400">
              Padrões para execução de grades de programação e relatórios em Kwanzas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Fuso Horário Padrão
              </label>
              <select
                disabled={!canEdit}
                value={formData.timezone || 'Africa/Luanda'}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full bg-[#070B14] border border-white/10 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none disabled:opacity-60"
              >
                <option value="Africa/Luanda">Africa/Luanda (WAT, GMT+1)</option>
                <option value="Africa/Johannesburg">Africa/Johannesburg (SAST, GMT+2)</option>
                <option value="Europe/Lisbon">Europe/Lisbon (WET/WEST, GMT+0/+1)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Moeda Padrão
              </label>
              <select
                disabled={!canEdit}
                value={formData.settings?.currency || 'AOA'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      defaultTimezone: formData.settings?.defaultTimezone || 'Africa/Luanda',
                      language: formData.settings?.language || 'pt-AO',
                      currency: e.target.value as any,
                    },
                  })
                }
                className="w-full bg-[#070B14] border border-white/10 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none disabled:opacity-60"
              >
                <option value="AOA">Kwanza Angolano (Kz / AOA)</option>
                <option value="USD">Dólar Americano ($ / USD)</option>
                <option value="EUR">Euro (€ / EUR)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Idioma do Sistema
              </label>
              <select
                disabled={!canEdit}
                value={formData.settings?.language || 'pt-AO'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      defaultTimezone: formData.settings?.defaultTimezone || 'Africa/Luanda',
                      currency: formData.settings?.currency || 'AOA',
                      language: e.target.value as any,
                    },
                  })
                }
                className="w-full bg-[#070B14] border border-white/10 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none disabled:opacity-60"
              >
                <option value="pt-AO">Português (Angola)</option>
                <option value="pt-PT">Português (Portugal)</option>
                <option value="en">English (US)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        {canEdit && (
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'A guardar...' : 'Guardar Alterações'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
