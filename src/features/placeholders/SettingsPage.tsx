import React, { useState, useEffect } from 'react';
import { Settings, Phone, MessageSquare, Building2, Bell, Globe, Save, CheckCircle, ShieldCheck, CreditCard, Building } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { useSession } from '../../context/SessionContext';
import { ANGOLA_BANKS } from '../../data/angolaBanks';
import { WhatsAppNotificationSettingsCard } from '../../components/notifications/WhatsAppNotificationSettingsCard';

export const SettingsPage: React.FC<{ onBackToDashboard: () => void }> = ({ onBackToDashboard }) => {
  const { currentOrganization } = useSession();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [whatsappNumber, setWhatsappNumber] = useState('244923000000');
  const [contactEmail, setContactEmail] = useState(currentOrganization?.contactEmail || 'contacto@empresa.ao');
  const [orgName, setOrgName] = useState(currentOrganization?.name || 'Sua Empresa');
  const [nif, setNif] = useState(currentOrganization?.nif || '5400000000');
  const [city, setCity] = useState(currentOrganization?.city || 'Luanda');
  
  // Bank Account states
  const orgAny = currentOrganization as any;
  const [bankName, setBankName] = useState(orgAny?.bankName || '');
  const [accountHolder, setAccountHolder] = useState(orgAny?.accountHolder || currentOrganization?.name || '');
  const [iban, setIban] = useState(orgAny?.iban || '');
  const [accountNumber, setAccountNumber] = useState('');

  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyCampaignReports, setNotifyCampaignReports] = useState(true);

  useEffect(() => {
    if (currentOrganization?.id) {
      fetch(`/api/partner/bank-accounts?organizationId=${currentOrganization.id}`, {
        headers: { 'x-organization-id': currentOrganization.id },
      })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setBankName(data[0].bankName || '');
            setAccountHolder(data[0].accountHolder || '');
            setIban(data[0].iban || '');
            setAccountNumber(data[0].accountNumber || '');
          }
        })
        .catch(() => {});
    }
  }, [currentOrganization?.id]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (currentOrganization?.id && bankName && iban) {
        await fetch('/api/partner/bank-accounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-organization-id': currentOrganization.id,
          },
          body: JSON.stringify({
            organizationId: currentOrganization.id,
            bankName,
            accountHolder,
            iban,
            accountNumber,
          }),
        }).catch(() => {});
      }

      addToast({
        type: 'success',
        title: 'Configurações Guardadas',
        message: 'Preferências corporativas e dados bancários atualizados com sucesso!',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2 font-display">
            <Settings className="w-6 h-6 text-cyan-400" />
            Configurações da Conta & Notificações
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Gerencie seu número de WhatsApp, alertas de campanhas e informações corporativas.
          </p>
        </div>
        <button
          onClick={onBackToDashboard}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
        >
          Voltar ao Dashboard
        </button>
      </div>

      {/* Section 1: Canal de Notificações WhatsApp & Agentes Inteligentes */}
      <WhatsAppNotificationSettingsCard />

      <form onSubmit={handleSaveSettings} className="space-y-6">

        {/* Section 2: Dados Corporativos & Organização */}
        <Card className="p-6 space-y-4 border border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Dados da Organização</h2>
              <p className="text-xs text-slate-400">Informações da conta jurídica para emissão de faturas e contratos de mídia.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Nome da Empresa / Marca</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">NIF / Identificação Fiscal</label>
              <input
                type="text"
                value={nif}
                onChange={(e) => setNif(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Província / Cidade</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </Card>

        {/* Section 2.5: Conta Bancária para Repasses (Angola) */}
        <Card className="p-6 space-y-4 border border-emerald-500/20 bg-slate-900/60">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Conta Bancária para Repasses em Angola</h2>
              <p className="text-xs text-slate-400">
                Configure os dados bancários corporativos para recebimento de receitas de publicidade e comissões.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Banco de Angola</label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">Selecione o seu banco...</option>
                {ANGOLA_BANKS.map((b) => (
                  <option key={b.code} value={b.fullName}>
                    {b.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Titular / Beneficiário da Conta</label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="Nome da empresa ou titular"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">IBAN de Angola (AO06)</label>
              <input
                type="text"
                value={iban}
                onChange={(e) => setIban(e.target.value.toUpperCase())}
                placeholder="AO06 0000 0000 0000 0000 0000 0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Fuso Horário e Idioma */}
        <Card className="p-6 space-y-4 border border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Região & Preferências de Sistema</h2>
              <p className="text-xs text-slate-400">Ajustes regionais aplicados aos horários de exibição de relatórios.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Idioma do Painel</label>
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium flex items-center justify-between">
                <span>Português (Angola)</span>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Fuso Horário da Rede</label>
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium flex items-center justify-between">
                <span>WAT — West Africa Time (UTC+1 Luanda)</span>
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
          </div>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Guardando...' : 'Guardar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
};
