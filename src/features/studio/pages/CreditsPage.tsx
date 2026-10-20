import React, { useEffect, useState } from 'react';
import { studioService } from '../../../services/studioService';
import { AICreditTransaction, AICreditPackage, CreditPurchaseRequest } from '../../../types/studio';
import { isConsumptionType } from '../../../lib/creditMath';
import { useSession } from '../../../context/SessionContext';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/Toast';
import {
  Coins,
  CreditCard,
  Sparkles,
  Upload,
  Check,
  Zap,
  ImageIcon,
  Video,
  TrendingUp,
  Star,
  ArrowRight,
} from 'lucide-react';

export function CreditsPage({
  onBack,
  onNavigate = () => {},
}: {
  onBack: () => void;
  onNavigate?: (path: string) => void;
}) {
  const { currentOrganization, currentUser, currentRole, currentMembership } = useSession();
  const orgId = currentOrganization?.id || '';
  const orgName = currentOrganization?.name || 'Minha Empresa';
  const userId = currentUser?.id || 'usr-1';
  const userName = currentUser?.name || 'Administrador';
  const { showToast } = useToast();

  /**
   * Só a administração da plataforma aprova recargas das OUTRAS organizações.
   * ⛔ Antes, qualquer cliente via a aba "Aprovações Admin" com os pedidos (e os
   * comprovativos) de todas as contas — informação que não é da sua conta.
   */
  const isCreativeAdmin =
    currentRole === 'NEXORA_ADMIN' ||
    currentMembership?.role === 'NEXORA_ADMIN' ||
    currentOrganization?.type === 'NEXORA';

  const [activeTab, setActiveTab] = useState<'PACKAGES' | 'REQUESTS' | 'ADMIN_APPROVAL' | 'HISTORY'>('PACKAGES');
  const [balance, setBalance] = useState(0);
  const [consumedCredits, setConsumedCredits] = useState(0);
  const [transactions, setTransactions] = useState<AICreditTransaction[]>([]);
  const [packages, setPackages] = useState<AICreditPackage[]>([]);
  const [myRequests, setMyRequests] = useState<CreditPurchaseRequest[]>([]);
  const [allRequests, setAllRequests] = useState<CreditPurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Purchase Modal
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<AICreditPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('MULTICAIXA_EXPRESS');
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);

  // View Receipt Modal
  const [viewingReceiptRequest, setViewingReceiptRequest] = useState<CreditPurchaseRequest | null>(null);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  const loadData = async () => {
    setLoading(false);
    /**
     * ⛔ Cada pedido era aguardado em série e sem tratamento de erro: bastava UM
     * falhar (por exemplo os pedidos de recarga) para a função rebentar a meio e
     * os pacotes de créditos NUNCA chegarem ao ecrã — via-se a página sem
     * pacotes, sem explicação. Agora cada pedido é independente: o que falha fica
     * vazio, o resto aparece.
     */
    const [bal, txs, pkgs, myReqs, allReqs] = await Promise.all([
      studioService.getBalance(orgId).catch(() => 0),
      studioService.getTransactions(orgId).catch(() => []),
      studioService.getPackages().catch(() => []),
      studioService.getCreditPurchaseRequests(orgId).catch(() => []),
      // Pedidos de TODAS as organizações: exclusivo da administração. Sem esta
      // guarda, o painel de um cliente carregava os pedidos das outras contas.
      isCreativeAdmin
        ? studioService.getCreditPurchaseRequests().catch(() => [])
        : Promise.resolve([] as CreditPurchaseRequest[]),
    ]);

    const consumed = (txs || [])
      .filter((t) => t.type === 'USAGE' || t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    setBalance(bal);
    setConsumedCredits(consumed);
    setTransactions(txs || []);
    setPackages(pkgs || []);
    setMyRequests(myReqs || []);
    setAllRequests(allReqs || []);

    if (!pkgs || pkgs.length === 0) {
      console.warn('[Créditos] Nenhum pacote de créditos devolvido pelo servidor (/api/ai-credits/packages).');
    }
  };

  useEffect(() => {
    loadData();
  }, [orgId, isCreativeAdmin]);

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFileName(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        setReceiptBase64(evt.target?.result as string);
        showToast('Comprovativo Carregado', `Ficheiro "${file.name}" anexado com sucesso.`, 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePurchaseRequest = async () => {
    if (!selectedPackage) return;
    if (!receiptBase64) {
      showToast('Comprovativo Obrigatório', 'Por favor anexe o comprovativo da transferência ou Multicaixa Express.', 'warning');
      return;
    }

    setIsSubmittingPurchase(true);
    try {
      await studioService.requestCreditPurchase({
        organizationId: orgId,
        organizationName: orgName,
        userId,
        userName,
        packageId: selectedPackage.id,
        paymentMethod,
        receiptUrl: receiptBase64,
        receiptFileName: receiptFileName || 'comprovativo_pagamento.png',
      });

      showToast(
        'Pedido de Recarga Enviado!',
        'O seu comprovativo foi submetido. Assim que o Administrador aprovar, os créditos entrarão na sua conta.',
        'success'
      );

      setIsPurchaseModalOpen(false);
      setSelectedPackage(null);
      setReceiptBase64(null);
      setReceiptFileName('');
      loadData();
      setActiveTab('REQUESTS');
    } catch (e: any) {
      showToast('Erro', e.message || 'Falha ao submeter pedido de compra.', 'error');
    } finally {
      setIsSubmittingPurchase(false);
    }
  };

  const handleApprove = async (request: CreditPurchaseRequest) => {
    setIsProcessingApproval(true);
    try {
      await studioService.approveCreditPurchase(request.id, userName);
      showToast('Recarga Aprovada!', `${request.credits.toLocaleString()} créditos adicionados.`, 'success');
      setViewingReceiptRequest(null);
      loadData();
    } catch (e: any) {
      showToast('Erro', e.message || 'Falha ao aprovar recarga.', 'error');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleReject = async (request: CreditPurchaseRequest) => {
    const reason = prompt('Motivo da rejeição:') || 'Comprovativo não reconhecido';
    setIsProcessingApproval(true);
    try {
      await studioService.rejectCreditPurchase(request.id, reason, userName);
      showToast('Recarga Rejeitada', `Pedido rejeitado: ${reason}`, 'info');
      setViewingReceiptRequest(null);
      loadData();
    } catch (e: any) {
      showToast('Erro', e.message || 'Falha ao rejeitar.', 'error');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-[#0E1528] border border-white/[0.08] p-5 flex items-center justify-between group hover:border-[#00E5FF]/30 transition-all">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono font-bold tracking-wider">Saldo Disponível</span>
            <p className="text-3xl font-extrabold text-white font-mono mt-1 tracking-tight">
              {balance.toLocaleString()}
              <span className="text-sm text-slate-400 font-normal ml-1">cr</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              ≈ {Math.floor(balance / 10)} imagens a 10cr cada
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00E5FF]/20 to-[#1677FF]/10 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.15)]">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#0E1528] border border-white/[0.08] p-5 flex items-center justify-between group hover:border-[#6D3DF5]/30 transition-all">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono font-bold tracking-wider">Total Consumido</span>
            <p className="text-3xl font-extrabold text-white font-mono mt-1 tracking-tight">
              {consumedCredits.toLocaleString()}
              <span className="text-sm text-slate-400 font-normal ml-1">cr</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              ≈ {Math.floor(consumedCredits / 10)} peças geradas
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6D3DF5]/20 to-[#1677FF]/10 border border-[#6D3DF5]/30 flex items-center justify-center text-[#6D3DF5] shadow-[0_0_20px_rgba(109,61,245,0.15)]">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#0E1528] border border-white/[0.08] p-5 flex items-center justify-between group hover:border-[#1677FF]/30 transition-all">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono font-bold tracking-wider">Custo Médio / Peça</span>
            <p className="text-3xl font-extrabold text-[#00E5FF] font-mono mt-1 tracking-tight">
              10
              <span className="text-sm text-slate-400 font-normal ml-1">cr / imagem</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1">30 cr por vídeo spot 60fps</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1677FF]/20 to-[#00E5FF]/10 border border-[#1677FF]/30 flex items-center justify-center text-[#1677FF] shadow-[0_0_20px_rgba(22,119,255,0.15)]">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-[#10172A] p-2 rounded-2xl border border-white/[0.08] flex-wrap">
        {[
          { id: 'PACKAGES', label: 'Pacotes de Recarga' },
          { id: 'REQUESTS', label: 'Minhas Recargas' },
          // A aba de aprovação é só da administração: mostra pedidos e
          // comprovativos de TODAS as organizações.
          ...(isCreativeAdmin ? [{ id: 'ADMIN_APPROVAL', label: 'Aprovações Admin' }] : []),
          { id: 'HISTORY', label: 'Histórico de Consumo' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-[#00E5FF] via-[#00C6FF] to-[#1677FF] text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: PACKAGES */}
      {activeTab === 'PACKAGES' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {packages.map((pkg, idx) => {
            // Derive feature list and capacity per package tier
            const tiers = [
              {
                icon: <Zap className="w-5 h-5" />,
                color: '#00E5FF',
                borderColor: 'border-[#00E5FF]/20',
                glowColor: 'rgba(0,229,255,0.12)',
                capacity: `≈ ${Math.floor(pkg.credits / 10)} imagens`,
                features: ['Imagens em Full HD', 'Todos os estilos', 'Download imediato', 'Validade 12 meses'],
              },
              {
                icon: <ImageIcon className="w-5 h-5" />,
                color: '#1677FF',
                borderColor: 'border-[#1677FF]/20',
                glowColor: 'rgba(22,119,255,0.12)',
                capacity: `≈ ${Math.floor(pkg.credits / 10)} imagens`,
                features: ['Imagens em 2K Ultra', 'Todos os estilos', 'Batch até 4 variações', 'Validade 12 meses'],
              },
              {
                icon: <Star className="w-5 h-5" />,
                color: '#00E5FF',
                borderColor: 'border-[#00E5FF]/50',
                glowColor: 'rgba(0,229,255,0.2)',
                capacity: `≈ ${Math.floor(pkg.credits / 10)} imagens`,
                features: ['Imagens em 4K Max', 'Vídeos Spot incluídos', 'Batch até 4 variações', 'Prioridade neural', 'Validade 12 meses'],
              },
              {
                icon: <Video className="w-5 h-5" />,
                color: '#6D3DF5',
                borderColor: 'border-[#6D3DF5]/20',
                glowColor: 'rgba(109,61,245,0.12)',
                capacity: `≈ ${Math.floor(pkg.credits / 10)} imagens`,
                features: ['Imagens em 4K Max', 'Vídeos Spot ilimitados', 'Batch até 4 variações', 'Fila prioritária GPU', 'Suporte dedicado', 'Validade 24 meses'],
              },
            ];
            const tier = tiers[idx] || tiers[0];

            return (
              <div
                key={pkg.id}
                className={`relative rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                  pkg.popular
                    ? 'bg-gradient-to-b from-[#131D3A] via-[#0F1829] to-[#090E1B] border-[#00E5FF]/50 shadow-[0_0_40px_rgba(0,229,255,0.18)]'
                    : 'bg-[#0D1424] border-white/[0.08] hover:border-white/20 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
                }`}
              >
                {/* Popular Badge */}
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="px-4 py-1 rounded-full bg-gradient-to-r from-[#00E5FF] to-[#1677FF] text-slate-950 text-[10px] font-extrabold uppercase tracking-widest shadow-lg">
                      ✦ Mais Popular
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center border"
                      style={{
                        backgroundColor: `${tier.color}15`,
                        borderColor: `${tier.color}30`,
                        color: tier.color,
                        boxShadow: `0 0 14px ${tier.glowColor}`,
                      }}
                    >
                      {tier.icon}
                    </div>
                    <span
                      className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border"
                      style={{
                        color: tier.color,
                        backgroundColor: `${tier.color}12`,
                        borderColor: `${tier.color}30`,
                      }}
                    >
                      {tier.capacity}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-white tracking-tight font-display">{pkg.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-sans leading-relaxed line-clamp-2">{pkg.description}</p>
                  </div>

                  {/* Price */}
                  <div className="py-3 border-y border-white/[0.06]">
                    <p className="text-2xl font-extrabold text-white font-mono tracking-tight">
                      {pkg.credits.toLocaleString()}
                      <span className="text-sm text-slate-400 font-normal ml-1">créditos</span>
                    </p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: tier.color }}>
                      {pkg.priceKz.toLocaleString()} Kz
                      <span className="text-[10px] text-slate-500 font-normal ml-1">
                        ({(pkg.priceKz / pkg.credits).toFixed(2)} Kz/cr)
                      </span>
                    </p>
                  </div>

                  {/* Feature List */}
                  <ul className="space-y-1.5">
                    {tier.features.map((f, fi) => (
                      <li key={fi} className="flex items-center gap-2 text-[11px] text-slate-300 font-sans">
                        <Check className="w-3.5 h-3.5 shrink-0" style={{ color: tier.color }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPackage(pkg);
                    setIsPurchaseModalOpen(true);
                  }}
                  className="mt-4 w-full py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                  style={{
                    background: pkg.popular
                      ? 'linear-gradient(135deg, #00E5FF, #1677FF)'
                      : `${tier.color}18`,
                    color: pkg.popular ? '#050914' : tier.color,
                    border: `1px solid ${tier.color}30`,
                  }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Comprar Pacote
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB CONTENT: REQUESTS */}
      {activeTab === 'REQUESTS' && (
        <div className="rounded-2xl bg-[#10172A] border border-white/[0.08] overflow-hidden">
          {myRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">Você ainda não submeteu nenhum pedido de recarga.</div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {myRequests.map((req) => (
                <div key={req.id} className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">{req.credits.toLocaleString()} Créditos</p>
                    <p className="text-[11px] text-slate-400">{req.priceKz.toLocaleString()} Kz • {req.paymentMethod}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                    req.status === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : req.status === 'REJECTED'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ADMIN APPROVAL */}
      {activeTab === 'ADMIN_APPROVAL' && isCreativeAdmin && (
        <div className="rounded-2xl bg-[#10172A] border border-white/[0.08] overflow-hidden">
          {allRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">Nenhum pedido de recarga pendente no sistema.</div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {allRequests.map((req) => (
                <div key={req.id} className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">{req.organizationName || req.organizationId} — {req.credits.toLocaleString()} Créditos</p>
                    <p className="text-[11px] text-slate-400">{req.priceKz.toLocaleString()} Kz • {req.userName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewingReceiptRequest(req)}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs text-white"
                    >
                      Ver Comprovativo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: HISTORY */}
      {activeTab === 'HISTORY' && (
        <div className="rounded-2xl bg-[#10172A] border border-white/[0.08] overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">Nenhuma transação registrada.</div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-white">{tx.reason}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{new Date(tx.timestamp).toLocaleString()}</p>
                  </div>
                  {/* O sinal vem da regra partilhada: `amount` é sempre uma
                      magnitude positiva, pelo que sem isto um consumo de 8 cr
                      aparecia como "+8". */}
                  <span className={`text-xs font-bold font-mono ${isConsumptionType(tx.type) ? 'text-slate-300' : 'text-cyan-400'}`}>
                    {isConsumptionType(tx.type) ? '-' : '+'}
                    {tx.amount} cr
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Purchase / Upload Modal */}
      {isPurchaseModalOpen && selectedPackage && (
        <Modal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          title="Recarregar Créditos IA"
          description={`Anexe o comprovativo para ativar o pacote "${selectedPackage.name}".`}
          accent="cyan"
          size="md"
          footer={
            <>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 text-xs text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePurchaseRequest}
                disabled={isSubmittingPurchase || !receiptBase64}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00E5FF] via-[#00C6FF] to-[#1677FF] text-slate-950 text-xs font-bold disabled:opacity-50"
              >
                {isSubmittingPurchase ? 'Submetendo...' : 'Submeter Comprovativo'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#10172A] border border-white/[0.08] space-y-1">
              <p className="text-xs text-slate-400">Pacote selecionado:</p>
              <p className="text-lg font-bold text-white">{selectedPackage.name} — {selectedPackage.credits.toLocaleString()} Créditos</p>
              <p className="text-xs font-mono text-cyan-400 font-bold">{selectedPackage.priceKz.toLocaleString()} Kz</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium">Anexar Comprovativo de Pagamento</label>
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 hover:border-[#00E5FF]/40 rounded-2xl cursor-pointer bg-[#10172A]">
                <Upload className="w-6 h-6 text-slate-400 mb-2" />
                <span className="text-xs text-slate-300 font-medium">
                  {receiptFileName || 'Clique para carregar o comprovativo'}
                </span>
                <input type="file" accept="image/*,application/pdf" onChange={handleReceiptUpload} className="hidden" />
              </label>
            </div>
          </div>
        </Modal>
      )}

      {/* View Receipt Modal */}
      {viewingReceiptRequest && (
        <Modal
          isOpen={!!viewingReceiptRequest}
          onClose={() => setViewingReceiptRequest(null)}
          title="Comprovativo de Pagamento"
          description={`Pedido de ${viewingReceiptRequest.organizationName || viewingReceiptRequest.organizationId}`}
          accent="cyan"
          size="md"
          footer={
            <div className="flex justify-between w-full">
              <button
                onClick={() => handleReject(viewingReceiptRequest)}
                disabled={isProcessingApproval}
                className="px-4 py-2 rounded-xl bg-rose-600/20 text-rose-300 border border-rose-600/40 text-xs font-bold"
              >
                Rejeitar
              </button>
              <button
                onClick={() => handleApprove(viewingReceiptRequest)}
                disabled={isProcessingApproval}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                Aprovar & Creditar
              </button>
            </div>
          }
        >
          <div className="flex justify-center max-h-[400px]">
            {viewingReceiptRequest.receiptUrl ? (
              <img src={viewingReceiptRequest.receiptUrl} alt="Comprovativo" className="max-h-[380px] object-contain rounded-xl" />
            ) : (
              <p className="text-xs text-slate-500">Comprovativo indisponível</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
