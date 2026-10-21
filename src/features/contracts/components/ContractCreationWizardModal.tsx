import React, { useState, useEffect } from 'react';
import {
  ContractType,
  ContractTemplate,
  ContractItem,
  ContractParty,
  ContractItemType,
} from '../../../types/contracts';
import { useContractTemplates } from '../hooks/useContractTemplates';
import { contractService } from '../../../services/contractService';
import { formatCurrencyAOA } from '../utils/contractFormatters';
import { mockOrganizations } from '../../../data/mockAuthData';
import { mockDisplays } from '../../../data/mockData';
import { mockPlans, mockAddOns } from '../../../data/mockSaasData';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Building2,
  FileText,
  Layers,
  Calendar,
  Sparkles,
  Tv,
  Cloud,
  Plus,
  Trash2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface ContractCreationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newContractId: string) => void;
  prefill?: {
    contractType?: ContractType;
    organizationId?: string;
    organizationName?: string;
    displayId?: string;
    planId?: string;
    customerId?: string;
  };
}

export const ContractCreationWizardModal: React.FC<ContractCreationWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  prefill,
}) => {
  const { templates } = useContractTemplates();
  const activeTemplates = templates.filter((t) => t.status === 'ACTIVE');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [contractType, setContractType] = useState<ContractType>(
    prefill?.contractType || 'DISPLAY_RENTAL_AND_SAAS'
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  // Organization & Parties
  const [selectedOrgId, setSelectedOrgId] = useState(prefill?.organizationId || 'org-talatona');
  const [clientLegalName, setClientLegalName] = useState('Gastronomia & Lazer Talatona Lda.');
  const [clientTradeName, setClientTradeName] = useState('Restaurante Talatona');
  const [clientNif, setClientNif] = useState('5409823102');
  const [clientEmail, setClientEmail] = useState('administracao@talatona.ao');
  const [clientPhone, setClientPhone] = useState('+244 924 111 222');
  const [clientAddress, setClientAddress] = useState('Via AL 15, Talatona, Luanda');
  const [representativeName, setRepresentativeName] = useState('Carlos Manuel');
  const [representativeRole, setRepresentativeRole] = useState('Diretor Geral & Sócio-Gerente');

  // Items
  const [items, setItems] = useState<Partial<ContractItem>[]>([
    {
      id: 'tmp-1',
      itemType: 'DISPLAY',
      description: 'Totem Interativo 75" 4K UHD com Android TV (Aluguer Mensal)',
      quantity: 1,
      unitPrice: 120000,
      discount: 0,
      total: 120000,
    },
    {
      id: 'tmp-2',
      itemType: 'PLAN',
      description: 'Subscrição Nexora Pro Business',
      quantity: 1,
      unitPrice: 85000,
      discount: 0,
      total: 85000,
    },
  ]);

  // Commercial Terms
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [paymentTerms, setPaymentTerms] = useState('Mensal pré-pago a 30 dias');
  const [autoRenew, setAutoRenew] = useState(true);
  const [customDiscount, setCustomDiscount] = useState(0);
  const [generateDocImmediately, setGenerateDocImmediately] = useState(true);

  // Auto update org details on org change
  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    const org = mockOrganizations.find((o) => o.id === orgId);
    if (org) {
      setClientTradeName(org.name);
      setClientLegalName(`${org.name} Lda.`);
      if (org.id === 'org-talatona') {
        setClientLegalName('Gastronomia & Lazer Talatona Lda.');
        setClientNif('5409823102');
        setRepresentativeName('Carlos Manuel');
        setRepresentativeRole('Diretor Geral');
        setClientEmail('carlos@talatona.ao');
      } else if (org.id === 'org-shopping') {
        setClientLegalName('Luanda Retail & Shopping Hub S.A.');
        setClientNif('5423189901');
        setRepresentativeName('Ana Silva');
        setRepresentativeRole('Diretora de Operações');
        setClientEmail('administracao@shoppingluanda.ao');
      } else if (org.id === 'org-publicidade') {
        setClientLegalName('Agência Publicidade Criativa Angola Lda.');
        setClientNif('5401928374');
        setRepresentativeName('Fernando Costa');
        setRepresentativeRole('Diretor Executivo');
        setClientEmail('planeamento@publicidadeao.co.ao');
      } else if (org.id === 'org-evento') {
        setClientLegalName('Luanda Live & Eventos Culturais S.A.');
        setClientNif('5489012345');
        setRepresentativeName('Sara Domingos');
        setRepresentativeRole('Produtora Executiva');
        setClientEmail('bilheteira@eventoluanda.ao');
      }
    }
  };

  // Select appropriate template automatically on contractType change
  useEffect(() => {
    const matching = activeTemplates.find((t) => t.contractType === contractType);
    if (matching) {
      setSelectedTemplateId(matching.id);
    }
  }, [contractType, activeTemplates]);

  // Set default title
  useEffect(() => {
    const org = mockOrganizations.find((o) => o.id === selectedOrgId);
    const orgLabel = org?.name || 'Cliente';
    if (!title || title.startsWith('Contrato')) {
      if (contractType === 'DISPLAY_RENTAL_AND_SAAS') {
        setTitle(`Aluguer de Displays & Subscrição Cloud — ${orgLabel}`);
      } else if (contractType === 'DISPLAY_SALE') {
        setTitle(`Venda Definitiva de Hardware — ${orgLabel}`);
      } else if (contractType === 'EVENT_RENTAL') {
        setTitle(`Locação Temporária para Evento — ${orgLabel}`);
      } else if (contractType === 'SAAS_SUBSCRIPTION') {
        setTitle(`Licenciamento Nexora SaaS — ${orgLabel}`);
      } else {
        setTitle(`Contrato Comercial — ${orgLabel}`);
      }
    }
  }, [contractType, selectedOrgId]);

  // Financial calculations
  const itemsSubtotal = items.reduce((acc, it) => acc + (it.total || 0), 0);
  const calculatedTax = Math.round(Math.max(0, itemsSubtotal - customDiscount) * 0.14);
  const calculatedTotal = Math.max(0, itemsSubtotal - customDiscount + calculatedTax);

  // Add Item Helpers
  const addItem = (type: ContractItemType, desc: string, price: number, refCode?: string) => {
    setItems((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}-${Math.random()}`,
        itemType: type,
        description: desc,
        quantity: 1,
        unitPrice: price,
        discount: 0,
        total: price,
        referenceCode: refCode,
      },
    ]);
  };

  const removeItem = (id?: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItemQty = (id: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const q = Math.max(1, qty);
          const total = Math.max(0, q * (i.unitPrice || 0) - (i.discount || 0));
          return { ...i, quantity: q, total };
        }
        return i;
      })
    );
  };

  // Submit Handler
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const targetOrg = mockOrganizations.find((o) => o.id === selectedOrgId);

      const partiesPayload: Partial<ContractParty>[] = [
        {
          partyType: 'NEXORA',
          legalName: 'Nexora Digital Signage Technologies Lda.',
          tradeName: 'Nexora Angola',
          nif: '5417892341',
          email: 'juridico@nexora.ao',
          phone: '+244 923 000 111',
          address: 'Edifício Sky One, 14º Andar, Av. Lenine, Ingombota, Luanda',
          city: 'Luanda',
          province: 'Luanda',
          country: 'Angola',
          representativeName: 'Mário Silva',
          representativeRole: 'Diretor Geral',
          signatureStatus: 'SIGNED',
          signedAt: new Date().toISOString(),
        },
        {
          organizationId: selectedOrgId,
          partyType: targetOrg?.type === 'ADVERTISER' ? 'ADVERTISER' : 'CUSTOMER',
          legalName: clientLegalName,
          tradeName: clientTradeName,
          nif: clientNif,
          email: clientEmail,
          phone: clientPhone,
          address: clientAddress,
          city: 'Luanda',
          province: 'Luanda',
          country: 'Angola',
          representativeName: representativeName,
          representativeRole: representativeRole,
          signatureStatus: 'PENDING',
        },
      ];

      const newContract = await contractService.createContract({
        contract: {
          title,
          organizationId: selectedOrgId,
          organizationName: clientTradeName,
          organizationType: targetOrg?.type || 'CLIENT',
          contractType,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          currency: 'AOA',
          subtotal: itemsSubtotal,
          discount: customDiscount,
          tax: calculatedTax,
          total: calculatedTotal,
          paymentTerms,
          autoRenew,
          notes,
          status: 'DRAFT',
          primaryClientName: clientLegalName,
          primaryClientNif: clientNif,
        },
        items,
        parties: partiesPayload,
        templateId: selectedTemplateId || undefined,
        generateDocumentImmediately: generateDocImmediately,
      });

      onSuccess(newContract.id);
    } catch (err: any) {
      console.error('Error creating contract:', err);
      setError(err.message || 'Falha ao criar contrato.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0f131c] border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col my-8 max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 px-6 border-b border-slate-800 flex items-center justify-between bg-[#121620]">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 block mb-0.5">
              Novo Acordo Comercial
            </span>
            <h2 className="text-lg font-bold text-white">
              Assistente de Criação de Contrato
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Stepper */}
        <div className="bg-slate-900/90 border-b border-slate-800/80 px-6 py-3 flex items-center justify-between text-xs">
          {[
            { num: 1, label: 'Tipo & Modelo' },
            { num: 2, label: 'Contratante' },
            { num: 3, label: 'Itens & Ativos' },
            { num: 4, label: 'Valores & Vigência' },
            { num: 5, label: 'Revisão Final' },
          ].map((st) => (
            <div key={st.num} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  step === st.num
                    ? 'bg-cyan-500 text-black'
                    : step > st.num
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {step > st.num ? <Check className="w-3.5 h-3.5" /> : st.num}
              </div>
              <span
                className={`hidden sm:inline font-medium ${
                  step === st.num ? 'text-cyan-400' : step > st.num ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {st.label}
              </span>
              {st.num < 5 && <span className="text-slate-700 hidden sm:inline ml-2">›</span>}
            </div>
          ))}
        </div>

        {/* Modal Body with Step Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Type & Template Selection */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">
                  Tipo Comercial do Contrato
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      type: 'DISPLAY_RENTAL_AND_SAAS' as ContractType,
                      title: 'Aluguer + SaaS (Recomendado)',
                      desc: 'Totens/Displays em regime de aluguer com subscrição de software em nuvem inclusa.',
                    },
                    {
                      type: 'DISPLAY_RENTAL' as ContractType,
                      title: 'Aluguer de Hardware',
                      desc: 'Cessão de terminais de sinalização digital e suportes.',
                    },
                    {
                      type: 'DISPLAY_SALE' as ContractType,
                      title: 'Venda de Hardware',
                      desc: 'Transmissão definitiva de displays e video walls.',
                    },
                    {
                      type: 'SAAS_SUBSCRIPTION' as ContractType,
                      title: 'Subscrição SaaS Pura',
                      desc: 'Licenciamento da plataforma Nexora em telas do próprio cliente (BYOD).',
                    },
                    {
                      type: 'EVENT_RENTAL' as ContractType,
                      title: 'Aluguer para Eventos',
                      desc: 'Locação temporária de curta duração para feiras como a FILDA.',
                    },
                    {
                      type: 'MAINTENANCE' as ContractType,
                      title: 'Manutenção & SLA',
                      desc: 'Acordo de assistência técnica preventiva e corretiva.',
                    },
                  ].map((opt) => (
                    <div
                      key={opt.type}
                      onClick={() => setContractType(opt.type)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        contractType === opt.type
                          ? 'bg-cyan-500/10 border-cyan-500 text-white'
                          : 'bg-[#121620] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-xs text-white mb-1 flex items-center justify-between">
                        <span>{opt.title}</span>
                        {contractType === opt.type && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">
                  Template Jurídico Base
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Nenhum (Contrato Livre / Sem Cláusulas Padrão)</option>
                  {activeTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code} — v{t.version})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1.5">
                  Título do Contrato
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Aluguer de Displays & Subscrição Nexora Pro"
                  className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Client & Signatory Parties */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1.5">
                  Selecionar Organização Cliente / Anunciante
                </label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => handleOrgChange(e.target.value)}
                  className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {mockOrganizations
                    .filter((o) => o.type !== 'NEXORA')
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.type === 'ADVERTISER' ? 'Anunciante' : 'Cliente'})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Razão Social / Nome Legal</label>
                  <input
                    type="text"
                    value={clientLegalName}
                    onChange={(e) => setClientLegalName(e.target.value)}
                    className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">NIF (Angola)</label>
                  <input
                    type="text"
                    value={clientNif}
                    onChange={(e) => setClientNif(e.target.value)}
                    className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Email Financeiro / Jurídico</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Telefone de Contato</label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Endereço Sede</label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Representante Legal (Signatário)</label>
                  <input
                    type="text"
                    value={representativeName}
                    onChange={(e) => setRepresentativeName(e.target.value)}
                    className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Cargo / Função do Representante</label>
                  <input
                    type="text"
                    value={representativeRole}
                    onChange={(e) => setRepresentativeRole(e.target.value)}
                    className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Items & Assets */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Itens Contratados ({items.length})
                </label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      addItem(
                        'DISPLAY',
                        'Totem 75" 4K Aluguer Mensal',
                        120000,
                        'NEX-DS-00001'
                      )
                    }
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" /> + Display
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      addItem(
                        'PLAN',
                        'Plano Nexora Pro Business',
                        85000,
                        'PLAN_PRO'
                      )
                    }
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" /> + Plano SaaS
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      addItem(
                        'INSTALLATION',
                        'Serviço de Montagem e Fixação On-Site',
                        75000
                      )
                    }
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" /> + Instalação
                  </Button>
                </div>
              </div>

              {/* Items List Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#121620]">
                {items.length === 0 ? (
                  <p className="p-6 text-center text-xs text-slate-400">
                    Nenhum item adicionado. Use os botões acima para incluir displays, planos ou serviços.
                  </p>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 text-left">Descrição</th>
                        <th className="py-2.5 px-3 text-center w-16">Qtd.</th>
                        <th className="py-2.5 px-3 text-right">Preço Unit.</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                        <th className="py-2.5 px-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {items.map((it) => (
                        <tr key={it.id}>
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-white block">{it.description}</span>
                            <span className="text-[10px] text-cyan-400 font-mono">{it.itemType}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min={1}
                              value={it.quantity || 1}
                              onChange={(e) =>
                                updateItemQty(it.id!, parseInt(e.target.value) || 1)
                              }
                              className="w-12 bg-slate-900 border border-slate-700 rounded px-1 text-center text-white"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {formatCurrencyAOA(it.unitPrice)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-cyan-300">
                            {formatCurrencyAOA(it.total)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => removeItem(it.id)}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Commercial Terms & Pricing */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Data de Início</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Data de Término</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Condições de Faturação</label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Desconto Comercial (AOA)</label>
                  <input
                    type="number"
                    min={0}
                    value={customDiscount}
                    onChange={(e) => setCustomDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="autoRenewCheck"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="autoRenewCheck" className="text-xs text-slate-300">
                  Renovação Automática Anual Ativa
                </label>
              </div>

              {/* Financial Box */}
              <div className="bg-[#121620] border border-slate-800 rounded-xl p-4 space-y-2 mt-4">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Subtotal Líquido:</span>
                  <span className="font-mono text-white">{formatCurrencyAOA(itemsSubtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Descontos Aplicados:</span>
                  <span className="font-mono text-slate-300">{formatCurrencyAOA(customDiscount)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>IVA (14% Angola):</span>
                  <span className="font-mono text-slate-300">{formatCurrencyAOA(calculatedTax)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-cyan-300 pt-2 border-t border-slate-800">
                  <span>Total Global do Contrato:</span>
                  <span className="font-mono">{formatCurrencyAOA(calculatedTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Final Review & Generate Option */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="bg-[#121620] border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-bold text-white mb-2">{title}</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">Contratante:</span>
                    <span className="text-white font-medium">{clientLegalName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">NIF:</span>
                    <span className="text-white font-mono">{clientNif}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Vigência:</span>
                    <span className="text-white">
                      {startDate} até {endDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Total AOA:</span>
                    <span className="text-cyan-300 font-bold font-mono">
                      {formatCurrencyAOA(calculatedTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Notas Internas / Observações</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Instruções para equipe de campo, detalhes adicionais..."
                  className="w-full bg-[#121620] border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center gap-3">
                <input
                  type="checkbox"
                  id="genDocCheck"
                  checked={generateDocImmediately}
                  onChange={(e) => setGenerateDocImmediately(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500"
                />
                <label htmlFor="genDocCheck" className="text-xs text-cyan-300 cursor-pointer">
                  <strong>Compilar Minuta Jurídica Imediatamente</strong> (Gera documento estruturado com cláusulas formatadas prontas para visualização e assinatura).
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 px-6 border-t border-slate-800 bg-[#121620] flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (step > 1) setStep(step - 1);
              else onClose();
            }}
            disabled={loading}
            className="text-xs"
          >
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </Button>

          {step < 5 ? (
            <Button
              size="sm"
              onClick={() => setStep(step + 1)}
              className="text-xs bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              Avançar <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={loading}
              className="text-xs bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {loading ? 'Criando Contrato...' : 'Salvar e Concluir'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
