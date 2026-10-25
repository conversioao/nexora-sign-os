import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Smartphone,
  CheckCircle2,
  Bell,
  RefreshCw,
  Send,
  ShieldCheck,
  Zap,
  TrendingUp,
  Monitor,
  DollarSign,
  FileCheck,
  Check,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useSession } from '../../context/SessionContext';
import { getApiUrl } from '../../config/api';

interface WhatsAppNotificationSettingsCardProps {
  roleOverride?: 'DISPLAY_OWNER' | 'ADVERTISER' | 'AFFILIATE' | 'NEXORA_ADMIN';
  compact?: boolean;
}

export const WhatsAppNotificationSettingsCard: React.FC<WhatsAppNotificationSettingsCardProps> = ({
  roleOverride,
  compact = false,
}) => {
  const { currentOrganization, currentUser } = useSession();
  const { showToast } = useToast();

  const orgType = (roleOverride || currentOrganization?.type || (currentUser as any)?.role || 'CLIENT').toUpperCase();
  const isPartner = orgType === 'DISPLAY_OWNER' || orgType === 'PARTNER';
  const isAdvertiser = orgType === 'ADVERTISER';
  const isAffiliate = orgType === 'AFFILIATE';
  const isAdmin = orgType === 'NEXORA_ADMIN' || orgType === 'NEXORA';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Phone state
  const [phone, setPhone] = useState(currentOrganization?.phone || '');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [whatsappVerified, setWhatsappVerified] = useState(true);

  // Preference toggles
  // Parceiro
  const [notifyAdAdded, setNotifyAdAdded] = useState(true);
  const [notifyDisplayStatus, setNotifyDisplayStatus] = useState(true);
  const [notifyWeeklyPayout, setNotifyWeeklyPayout] = useState(true);

  // Anunciante
  const [notifyCampaignReview, setNotifyCampaignReview] = useState(true);
  const [notifyCampaignLive, setNotifyCampaignLive] = useState(true);
  const [notifyCampaignDailyReport, setNotifyCampaignDailyReport] = useState(true);
  const [notifyBillingAlerts, setNotifyBillingAlerts] = useState(true);

  // Afiliado
  const [notifyAffiliateNewReferral, setNotifyAffiliateNewReferral] = useState(true);
  const [notifyAffiliateSubscriptionCommission, setNotifyAffiliateSubscriptionCommission] = useState(true);
  const [notifyAffiliateAdCommission, setNotifyAffiliateAdCommission] = useState(true);
  const [notifyAffiliatePayout, setNotifyAffiliatePayout] = useState(true);

  // Carrega configurações
  useEffect(() => {
    if (!currentOrganization?.id) return;
    setLoading(true);

    fetch(getApiUrl(`/api/notifications/whatsapp-preferences?orgId=${encodeURIComponent(currentOrganization.id)}&role=${orgType}`))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.phone) setPhone(data.phone);
          if (data.whatsapp_verified !== undefined) setWhatsappVerified(data.whatsapp_verified);
          if (data.notify_ad_added !== undefined) setNotifyAdAdded(data.notify_ad_added);
          if (data.notify_display_status !== undefined) setNotifyDisplayStatus(data.notify_display_status);
          if (data.notify_weekly_payout !== undefined) setNotifyWeeklyPayout(data.notify_weekly_payout);
          if (data.notify_campaign_review !== undefined) setNotifyCampaignReview(data.notify_campaign_review);
          if (data.notify_campaign_live !== undefined) setNotifyCampaignLive(data.notify_campaign_live);
          if (data.notify_campaign_daily_report !== undefined) setNotifyCampaignDailyReport(data.notify_campaign_daily_report);
          if (data.notify_billing_alerts !== undefined) setNotifyBillingAlerts(data.notify_billing_alerts);
          if (data.notify_affiliate_new_referral !== undefined) setNotifyAffiliateNewReferral(data.notify_affiliate_new_referral);
          if (data.notify_affiliate_subscription_commission !== undefined) setNotifyAffiliateSubscriptionCommission(data.notify_affiliate_subscription_commission);
          if (data.notify_affiliate_ad_commission !== undefined) setNotifyAffiliateAdCommission(data.notify_affiliate_ad_commission);
          if (data.notify_affiliate_payout !== undefined) setNotifyAffiliatePayout(data.notify_affiliate_payout);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentOrganization?.id, orgType]);

  const handleSavePreferences = async () => {
    if (!currentOrganization?.id) return;
    setSaving(true);
    try {
      const res = await fetch(getApiUrl('/api/notifications/whatsapp-preferences'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
          phone,
          role_type: orgType,
          whatsapp_verified: whatsappVerified,
          notify_ad_added: notifyAdAdded,
          notify_display_status: notifyDisplayStatus,
          notify_weekly_payout: notifyWeeklyPayout,
          notify_campaign_review: notifyCampaignReview,
          notify_campaign_live: notifyCampaignLive,
          notify_campaign_daily_report: notifyCampaignDailyReport,
          notify_billing_alerts: notifyBillingAlerts,
          notify_affiliate_new_referral: notifyAffiliateNewReferral,
          notify_affiliate_subscription_commission: notifyAffiliateSubscriptionCommission,
          notify_affiliate_ad_commission: notifyAffiliateAdCommission,
          notify_affiliate_payout: notifyAffiliatePayout,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Configurações de notificações WhatsApp salvas com sucesso!', 'success');
        setIsEditingPhone(false);
      } else {
        showToast(data.error || 'Erro ao salvar configurações.', 'danger');
      }
    } catch {
      showToast('Falha ao comunicar com o servidor.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!phone) {
      showToast('Configure um número de WhatsApp válido primeiro.', 'warning');
      return;
    }
    setTesting(true);
    try {
      const res = await fetch(getApiUrl('/api/notifications/whatsapp-test-personal'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, roleType: orgType }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Mensagem de teste enviada com sucesso para o seu WhatsApp!', 'success');
      } else {
        showToast(data.message || 'Mensagem registrada no log do sistema.', 'info');
      }
    } catch {
      showToast('Erro ao disparar mensagem de teste.', 'danger');
    } finally {
      setTesting(false);
    }
  };

  const roleTitle = isPartner
    ? 'Parceiro (Proprietário de Displays)'
    : isAdvertiser
    ? 'Anunciante Marketplace'
    : isAffiliate
    ? 'Afiliado Oficial Nexora'
    : 'Conta Corporativa';

  return (
    <Card className={`border border-emerald-500/20 bg-slate-900/80 backdrop-blur-md overflow-hidden relative shadow-xl ${compact ? 'p-4' : 'p-6'}`}>
      <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2 font-display">
                Notificações WhatsApp em Tempo Real
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Agentes Ativos
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Os agentes inteligentes da Nexora usam o seu número verificado para manter contato direto e enviar alertas em tempo real.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendTestMessage}
            disabled={testing || !phone}
            leftIcon={testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-emerald-400" />}
          >
            {testing ? 'A Enviar...' : 'Testar no WhatsApp'}
          </Button>

          <Button
            variant="cyan"
            size="sm"
            onClick={handleSavePreferences}
            disabled={saving}
            leftIcon={saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          >
            {saving ? 'A Guardar...' : 'Guardar Alterações'}
          </Button>
        </div>
      </div>

      {/* Phone Number Display & Edit */}
      <div className="mt-4 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">Número de WhatsApp Verificado:</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                {roleTitle}
              </span>
            </div>
            {isEditingPhone ? (
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: 244923000000"
                  className="bg-slate-900 border border-emerald-500/50 rounded-lg px-2.5 py-1 text-xs text-white font-mono outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setIsEditingPhone(false)}
                  className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold hover:bg-emerald-500/30"
                >
                  Concluir
                </button>
              </div>
            ) : (
              <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                {phone ? `+${phone}` : 'Nenhum número configurado'}
              </p>
            )}
          </div>
        </div>

        {!isEditingPhone && (
          <button
            type="button"
            onClick={() => setIsEditingPhone(true)}
            className="text-xs text-slate-400 hover:text-white underline cursor-pointer self-end sm:self-auto"
          >
            Alterar Número
          </button>
        )}
      </div>

      {/* Specific Toggles Based on Panel Role */}
      <div className="mt-5 space-y-3.5">
        <p className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5 text-cyan-400" />
          Alertas Ativos para o seu Perfil ({roleTitle})
        </p>

        {/* PARCEIRO (DISPLAY OWNER) TOGGLES */}
        {isPartner && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex items-start gap-3">
              <input
                type="checkbox"
                checked={notifyAdAdded}
                onChange={(e) => setNotifyAdAdded(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 shrink-0"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Novo Anúncio no seu Display
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Receba mensagem no WhatsApp sempre que um novo anúncio for adicionado ao seu display, informando o anunciante e mostrando a sua <strong>comissão em KZ</strong>.
                </p>
              </div>
            </label>

            <label className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex items-start gap-3">
              <input
                type="checkbox"
                checked={notifyDisplayStatus}
                onChange={(e) => setNotifyDisplayStatus(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 shrink-0"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                  Status de Conexão (Online / Offline)
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Notifica imediatamente quando o seu totem/display ficar <strong>ONLINE</strong> ou <strong>OFFLINE</strong>, detalhando sempre a causa e diagnóstico técnico.
                </p>
              </div>
            </label>

            <label className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex items-start gap-3">
              <input
                type="checkbox"
                checked={notifyWeeklyPayout}
                onChange={(e) => setNotifyWeeklyPayout(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 shrink-0"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                  Fechamento & Repasse Semanal
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Extrato consolidado de receitas geradas pelas suas telas e avisos de transferência bancária em Angola.
                </p>
              </div>
            </label>
          </div>
        )}

        {/* ANUNCIANTE (ADVERTISER) TOGGLES */}
        {isAdvertiser && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex items-start gap-3">
              <input
                type="checkbox"
                checked={notifyCampaignReview}
                onChange={(e) => setNotifyCampaignReview(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 shrink-0"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Campanha em Validação
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Receba confirmação instantânea no WhatsApp informando que a sua campanha foi enviada e está em <strong>análise e validação técnica</strong>.
                </p>
              </div>
            </label>

            <label className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex items-start gap-3">
              <input
                type="checkbox"
                checked={notifyCampaignLive}
                onChange={(e) => setNotifyCampaignLive(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 shrink-0"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  Campanha no Ar (Aprovada)
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Notificação comemorativa assim que o seu anúncio for aprovado pela moderação e começar a rodar nas telas da rede.
                </p>
              </div>
            </label>

            <label className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex items-start gap-3">
              <input
                type="checkbox"
                checked={notifyCampaignDailyReport}
                onChange={(e) => setNotifyCampaignDailyReport(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 shrink-0"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                  Relatório Diário de Desempenho (2x ao dia)
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Receba relatórios diários de veiculações, plays executados e impacto de público <strong>na manhã (08h)</strong> e <strong>no final da tarde (18h)</strong>.
                </p>
              </div>
            </label>

            <label className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex items-start gap-3">
              <input
                type="checkbox"
                checked={notifyBillingAlerts}
                onChange={(e) => setNotifyBillingAlerts(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 shrink-0"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-purple-400" />
                  Faturas & Comprovativos
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Avisos de confirmação de pagamento, recibos fiscais e recarga de créditos do Creative AI.
                </p>
              </div>
            </label>
          </div>
        )}

        {/* AFILIADO (AFFILIATE) TOGGLES */}
        {isAffiliate && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex items-start gap-3">
              <input
                type="checkbox"
                checked={notifyAffiliateNewReferral}
                onChange={(e) => setNotifyAffiliateNewReferral(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 shrink-0"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  Novo Cadastro via seu Link
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Notifica em tempo real no seu WhatsApp quando alguém se registrar na plataforma usando o seu link exclusivo de afiliado.
                </p>
              </div>
            </label>

            <label className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex items-start gap-3">
              <input
                type="checkbox"
                checked={notifyAffiliateSubscriptionCommission}
                onChange={(e) => setNotifyAffiliateSubscriptionCommission(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 shrink-0"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Cliente Paga Mensalidade / Plano
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Notificação instantânea quando um cliente indicado pagar por um plano de displays, com a comissão creditada na carteira.
                </p>
              </div>
            </label>

            <label className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex items-start gap-3">
              <input
                type="checkbox"
                checked={notifyAffiliateAdCommission}
                onChange={(e) => setNotifyAffiliateAdCommission(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 shrink-0"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Anunciante Paga Campanhas
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Receba aviso em tempo real quando um anunciante da sua rede pagar veiculação de anúncios, com o percentual e valor em KZ.
                </p>
              </div>
            </label>

            <label className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex items-start gap-3">
              <input
                type="checkbox"
                checked={notifyAffiliatePayout}
                onChange={(e) => setNotifyAffiliatePayout(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 shrink-0"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                  Saques & Transferências Bancárias
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Confirmação de processamento e liquidação de pedidos de levantamento para o seu IBAN angolano.
                </p>
              </div>
            </label>
          </div>
        )}

        {/* DEFAULT / CLIENT TOGGLES */}
        {!isPartner && !isAdvertiser && !isAffiliate && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex items-start gap-3">
              <input
                type="checkbox"
                checked={notifyDisplayStatus}
                onChange={(e) => setNotifyDisplayStatus(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 shrink-0"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                  Status dos Displays
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Alertas quando as suas telas ficarem online ou perderem conexão com a rede.
                </p>
              </div>
            </label>

            <label className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex items-start gap-3">
              <input
                type="checkbox"
                checked={notifyBillingAlerts}
                onChange={(e) => setNotifyBillingAlerts(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 shrink-0"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Comprovativos & Faturas
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Confirmações de subscrição de planos e avisos de renovação de licenças.
                </p>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Info Note Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
        <Info className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          As mensagens são entregues via servidor Evolution API oficial do ecossistema Nexora OS com criptografia de ponta a ponta.
        </span>
      </div>
    </Card>
  );
};
