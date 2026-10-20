import React, { useState, useEffect } from 'react';
import {
  Display,
  DisplayCommercialModel,
  DisplayCommercialStatus,
  DisplayAdvertisingStatus,
} from '../../../types/domain';
import {
  RentDisplayParams,
  SellDisplayParams,
  EventRentalParams,
} from '../../../repositories/types';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select, SelectOption } from '../../../components/ui/Select';
import {
  formatCurrencyKz,
  formatCommercialModel,
  formatCommercialStatus,
} from '../utils/displayFormatters';
import {
  DollarSign,
  Calendar,
  Building,
  Tag,
  ShieldCheck,
  Megaphone,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Clock,
  FileText,
  Percent,
} from 'lucide-react';

export type CommercialActionType =
  | 'RENT'
  | 'SELL'
  | 'EVENT'
  | 'ASSIGN_CUSTOMER'
  | 'RETURN_INVENTORY'
  | 'ADVERTISING_SETTINGS';

interface DisplayCommercialActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  display: Display | null;
  actionType: CommercialActionType;
  onRent: (id: string, params: RentDisplayParams) => Promise<void>;
  onSell: (id: string, params: SellDisplayParams) => Promise<void>;
  onRentForEvent: (id: string, params: EventRentalParams) => Promise<void>;
  onAssignCustomer: (id: string, customerOrgId: string, customerName?: string, notes?: string) => Promise<void>;
  onReturnToInventory: (id: string, notes?: string) => Promise<void>;
  onSetAdvertisingEligibility: (id: string, eligible: boolean, adStatus?: DisplayAdvertisingStatus) => Promise<void>;
}

export const DisplayCommercialActionModal: React.FC<DisplayCommercialActionModalProps> = ({
  isOpen,
  onClose,
  display,
  actionType,
  onRent,
  onSell,
  onRentForEvent,
  onAssignCustomer,
  onReturnToInventory,
  onSetAdvertisingEligibility,
}) => {
  const [submitting, setSubmitting] = useState(false);

  // Common fields
  const [customerName, setCustomerName] = useState('');
  const [customerOrgId, setCustomerOrgId] = useState('org-unitel');
  const [contractNumber, setContractNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Rental fields
  const [monthlyFeeKz, setMonthlyFeeKz] = useState<number>(180000);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [autoRenew, setAutoRenew] = useState(true);
  const [depositKz, setDepositKz] = useState<number>(0);
  const [installationFeeKz, setInstallationFeeKz] = useState<number>(50000);

  // Sale fields
  const [salePriceKz, setSalePriceKz] = useState<number>(1450000);
  const [warrantyMonths, setWarrantyMonths] = useState<number>(24);
  const [hasMaintenancePlan, setHasMaintenancePlan] = useState(true);
  const [maintenanceMonthlyFeeKz, setMaintenanceMonthlyFeeKz] = useState<number>(45000);

  // Event fields
  const [eventName, setEventName] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [dailyRateKz, setDailyRateKz] = useState<number>(75000);
  const [totalEventFeeKz, setTotalEventFeeKz] = useState<number>(225000);

  // Advertising fields
  const [adEligible, setAdEligible] = useState<boolean>(true);
  const [adStatus, setAdStatus] = useState<DisplayAdvertisingStatus>('COMMERCIAL_ADS_ENABLED');
  const [revenueSharePercent, setRevenueSharePercent] = useState<number>(30);
  const [maxAdSlots, setMaxAdSlots] = useState<number>(6);

  // Dynamic registered partners/customers options
  const [clientOrgOptions, setClientOrgOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    const fetchRegisteredPartners = async () => {
      try {
        const res = await fetch('/api/organizations?type=CLIENT,PARTNER');
        if (res.ok) {
          const orgs = await res.json();
          if (Array.isArray(orgs) && orgs.length > 0) {
            const dynamicOpts: SelectOption[] = orgs.map((o: any) => ({
              value: o.id,
              label: `${o.name} (${o.city || o.municipality || 'Luanda'})`,
            }));
            dynamicOpts.push({ value: 'org-custom', label: 'Outro Cliente / Parceiro (Personalizado)' });
            setClientOrgOptions(dynamicOpts);
            if (!customerOrgId || customerOrgId === 'org-unitel' || customerOrgId === 'org-talatona') {
              setCustomerOrgId(orgs[0].id);
              setCustomerName(orgs[0].name);
            }
          } else {
            setClientOrgOptions([{ value: 'org-custom', label: 'Outro Cliente / Parceiro (Personalizado)' }]);
          }
        }
      } catch (e) {
        console.warn('Erro ao carregar parceiros registados:', e);
      }
    };
    if (isOpen) {
      fetchRegisteredPartners();
    }
  }, [isOpen]);

  // Initialize modal values when opened or display changes
  useEffect(() => {
    if (!display) return;

    const code = display.code || 'NEX';
    const randomContract = `CTR-${code}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    setContractNumber(randomContract);

    // Populate defaults based on display profile
    const profile = display.commercialProfile;
    if (profile) {
      setCustomerName(profile.customerOrganizationName || display.clientName || 'Cliente Nexora');
      setCustomerOrgId(profile.customerOrganizationId || display.organizationId || 'org-talatona');
      setMonthlyFeeKz(profile.monthlyFeeKz || display.dailyRateKz * 22 || 180000);
      setSalePriceKz(profile.salePriceKz || 1500000);
      setAdEligible(profile.advertisingEligible ?? true);
      setAdStatus(profile.advertisingStatus || 'COMMERCIAL_ADS_ENABLED');
      setRevenueSharePercent(profile.advertisingRevenueSharePercent || 30);
      setMaxAdSlots(profile.maxCommercialSlots || 6);
    } else {
      setCustomerName(display.clientName || 'Cliente Nexora');
      setMonthlyFeeKz(display.dailyRateKz * 22 || 180000);
      setSalePriceKz(1500000);
    }

    const today = new Date().toISOString().split('T')[0];
    const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setStartDate(today);
    setEndDate(oneYearLater);
    setEventStartDate(today);
    setEventEndDate(sevenDaysLater);
    setDailyRateKz(display.dailyRateKz || 50000);
    setTotalEventFeeKz((display.dailyRateKz || 50000) * 7);
    setEventVenue(`${display.location.venueName}, ${display.location.municipality}`);
    setNotes('');
  }, [display, actionType, isOpen]);

  // Handle client selection change
  const handleClientOrgChange = (orgId: string) => {
    setCustomerOrgId(orgId);
    const selected = clientOrgOptions.find((o) => o.value === orgId);
    if (selected && orgId !== 'org-custom') {
      setCustomerName(selected.label.split(' (')[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!display) return;

    setSubmitting(true);
    try {
      if (actionType === 'RENT') {
        await onRent(display.id, {
          customerOrgId,
          customerName: customerName.trim() || 'Cliente Nexora',
          contractNumber,
          monthlyFeeKz: Number(monthlyFeeKz),
          startDate,
          endDate: endDate || undefined,
          autoRenew,
          depositKz: Number(depositKz),
          installationFeeKz: Number(installationFeeKz),
          notes,
        });
      } else if (actionType === 'SELL') {
        await onSell(display.id, {
          buyerOrgId: customerOrgId,
          customerName: customerName.trim() || 'Cliente Nexora',
          salePriceKz: Number(salePriceKz),
          warrantyMonths: Number(warrantyMonths),
          includeMaintenancePlan: hasMaintenancePlan,
          maintenanceMonthlyFeeKz: hasMaintenancePlan ? Number(maintenanceMonthlyFeeKz) : undefined,
          contractNumber,
          notes,
        });
      } else if (actionType === 'EVENT') {
        await onRentForEvent(display.id, {
          eventName: eventName.trim() || 'Evento Corporativo',
          venue: eventVenue.trim() || `${display.location.venueName}`,
          organizerOrgId: customerOrgId,
          organizerName: customerName.trim() || 'Organizador',
          startDate: eventStartDate,
          endDate: eventEndDate,
          dailyRateKz: Number(dailyRateKz),
          totalFeeKz: Number(totalEventFeeKz),
          notes,
        });
      } else if (actionType === 'ASSIGN_CUSTOMER') {
        await onAssignCustomer(
          display.id,
          customerOrgId,
          customerName.trim() || 'Cliente Nexora',
          notes
        );
      } else if (actionType === 'RETURN_INVENTORY') {
        await onReturnToInventory(display.id, notes);
      } else if (actionType === 'ADVERTISING_SETTINGS') {
        await onSetAdvertisingEligibility(display.id, adEligible, adStatus);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!display) return null;

  const getModalTitle = () => {
    switch (actionType) {
      case 'RENT':
        return `Alugar Display — ${display.code}`;
      case 'SELL':
        return `Vender Hardware Display — ${display.code}`;
      case 'EVENT':
        return `Reserva de Display para Evento — ${display.code}`;
      case 'ASSIGN_CUSTOMER':
        return `Associar Display a Cliente — ${display.code}`;
      case 'RETURN_INVENTORY':
        return `Retornar Display ao Inventário Livre — ${display.code}`;
      case 'ADVERTISING_SETTINGS':
        return `Monetização & Elegibilidade de Anúncios — ${display.code}`;
    }
  };

  const getModalDescription = () => {
    switch (actionType) {
      case 'RENT':
        return 'Configure o contrato de aluguer de hardware + software SaaS para o cliente.';
      case 'SELL':
        return 'Transfira a propriedade do hardware para o cliente e configure o plano de licenciamento SaaS.';
      case 'EVENT':
        return 'Aluguer temporário pontual para feiras, exposições ou convenções em Luanda.';
      case 'ASSIGN_CUSTOMER':
        return 'Vincule este dispositivo à conta operacional de um cliente na plataforma Nexora.';
      case 'RETURN_INVENTORY':
        return 'Finalize a alocação atual e torne o display disponível para novos clientes ou eventos.';
      case 'ADVERTISING_SETTINGS':
        return 'Defina se este display participa da rede programática de publicidade Nexora e taxas de repasse.';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getModalTitle()} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-xs text-[#94A3B8] -mt-2">{getModalDescription()}</p>

        {/* Display Summary Header */}
        <div className="bg-[#0B1120] p-3.5 rounded-xl border border-white/10 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#06B6D4] text-xs">{display.code}</span>
              <span className="text-white font-medium text-sm">{display.name}</span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              {display.location.venueName} • {display.location.municipality} • {display.screenSizeInches}" {display.orientation}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-[#94A3B8] block">Status Atual</span>
            <span className="text-xs font-semibold text-emerald-400">
              {formatCommercialStatus(display.commercialProfile?.commercialStatus).label}
            </span>
          </div>
        </div>

        {/* 1. RENT FORM */}
        {actionType === 'RENT' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Organização do Cliente <span className="text-rose-400">*</span>
                </label>
                <Select
                  options={clientOrgOptions}
                  value={customerOrgId}
                  onChange={(e) => handleClientOrgChange(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Nome do Cliente / Empresa
                </label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Unitel Angola"
                  leftIcon={<Building className="w-4 h-4" />}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Número do Contrato
                </label>
                <Input
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                  leftIcon={<FileText className="w-4 h-4" />}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Mensalidade (Kz/mês) <span className="text-rose-400">*</span>
                </label>
                <Input
                  type="number"
                  value={monthlyFeeKz}
                  onChange={(e) => setMonthlyFeeKz(Number(e.target.value))}
                  leftIcon={<DollarSign className="w-4 h-4" />}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Data de Início do Contrato <span className="text-rose-400">*</span>
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  leftIcon={<Calendar className="w-4 h-4" />}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Data de Término (Opcional)
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  leftIcon={<Calendar className="w-4 h-4" />}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Taxa de Instalação (Kz)
                </label>
                <Input
                  type="number"
                  value={installationFeeKz}
                  onChange={(e) => setInstallationFeeKz(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Depósito Caução (Kz)
                </label>
                <Input
                  type="number"
                  value={depositKz}
                  onChange={(e) => setDepositKz(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-[#0B1120] rounded-xl border border-white/5">
              <input
                type="checkbox"
                id="autoRenewCheck"
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-[#0F172A] text-[#06B6D4] focus:ring-0"
              />
              <label htmlFor="autoRenewCheck" className="text-xs text-white cursor-pointer select-none">
                Renovação automática mensal após o término do contrato inicial
              </label>
            </div>
          </div>
        )}

        {/* 2. SELL FORM */}
        {actionType === 'SELL' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Comprador / Organização <span className="text-rose-400">*</span>
                </label>
                <Select
                  options={clientOrgOptions}
                  value={customerOrgId}
                  onChange={(e) => handleClientOrgChange(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Nome do Comprador
                </label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Banco de Fomento Angola"
                  leftIcon={<Building className="w-4 h-4" />}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Valor de Venda do Hardware (Kz) <span className="text-rose-400">*</span>
                </label>
                <Input
                  type="number"
                  value={salePriceKz}
                  onChange={(e) => setSalePriceKz(Number(e.target.value))}
                  leftIcon={<DollarSign className="w-4 h-4" />}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Garantia de Hardware (Meses)
                </label>
                <Input
                  type="number"
                  value={warrantyMonths}
                  onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                  leftIcon={<ShieldCheck className="w-4 h-4" />}
                />
              </div>
            </div>

            <div className="p-3.5 bg-[#0B1120] rounded-xl border border-white/5 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasMaintenanceCheck"
                  checked={hasMaintenancePlan}
                  onChange={(e) => setHasMaintenancePlan(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-[#0F172A] text-[#06B6D4] focus:ring-0"
                />
                <label htmlFor="hasMaintenanceCheck" className="text-xs font-medium text-white cursor-pointer select-none">
                  Vincular Plano de Licenciamento SaaS & Manutenção Nexora
                </label>
              </div>

              {hasMaintenancePlan && (
                <div>
                  <label className="block text-[11px] text-[#94A3B8] mb-1">
                    Mensalidade do Plano SaaS de Manutenção (Kz/mês)
                  </label>
                  <Input
                    type="number"
                    value={maintenanceMonthlyFeeKz}
                    onChange={(e) => setMaintenanceMonthlyFeeKz(Number(e.target.value))}
                    leftIcon={<DollarSign className="w-4 h-4" />}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. EVENT FORM */}
        {actionType === 'EVENT' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Nome do Evento <span className="text-rose-400">*</span>
                </label>
                <Input
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Ex: FILDA 2025 - Stand Unitel"
                  leftIcon={<Sparkles className="w-4 h-4" />}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Local / Pavilhão do Evento <span className="text-rose-400">*</span>
                </label>
                <Input
                  value={eventVenue}
                  onChange={(e) => setEventVenue(e.target.value)}
                  placeholder="Ex: ZEE Luanda-Bengo, Pavilhão 1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Organização Solicitante
                </label>
                <Select
                  options={clientOrgOptions}
                  value={customerOrgId}
                  onChange={(e) => handleClientOrgChange(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Nome do Responsável
                </label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Manuel Costa"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Início do Evento <span className="text-rose-400">*</span>
                </label>
                <Input
                  type="date"
                  value={eventStartDate}
                  onChange={(e) => setEventStartDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Término do Evento <span className="text-rose-400">*</span>
                </label>
                <Input
                  type="date"
                  value={eventEndDate}
                  onChange={(e) => setEventEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Diária do Display (Kz/dia)
                </label>
                <Input
                  type="number"
                  value={dailyRateKz}
                  onChange={(e) => {
                    const rate = Number(e.target.value);
                    setDailyRateKz(rate);
                    setTotalEventFeeKz(rate * 7);
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Valor Total do Pacote (Kz)
                </label>
                <Input
                  type="number"
                  value={totalEventFeeKz}
                  onChange={(e) => setTotalEventFeeKz(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. ASSIGN CUSTOMER FORM */}
        {actionType === 'ASSIGN_CUSTOMER' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Selecione a Organização <span className="text-rose-400">*</span>
                </label>
                <Select
                  options={clientOrgOptions}
                  value={customerOrgId}
                  onChange={(e) => handleClientOrgChange(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Nome do Cliente / Conta
                </label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Hipermercados Kero"
                  leftIcon={<Building className="w-4 h-4" />}
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. RETURN TO INVENTORY FORM */}
        {actionType === 'RETURN_INVENTORY' && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
            <p className="text-xs font-semibold text-amber-400">
              Aviso de Desvinculação Comercial
            </p>
            <p className="text-xs text-[#CBD5E1]">
              Ao retornar este display ao inventário disponível, o vínculo com o cliente atual será arquivado, o status comercial voltará para <strong>DISPONÍVEL</strong> e o hardware poderá ser alugado ou vendido a outros clientes.
            </p>
          </div>
        )}

        {/* 6. ADVERTISING SETTINGS FORM */}
        {actionType === 'ADVERTISING_SETTINGS' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-[#0B1120] rounded-xl border border-white/5 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="adEligibleCheck"
                  checked={adEligible}
                  onChange={(e) => setAdEligible(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-[#0F172A] text-[#06B6D4] focus:ring-0"
                />
                <label htmlFor="adEligibleCheck" className="text-xs font-medium text-white cursor-pointer select-none">
                  Habilitar este display para Monetização Publicitária Nexora Ads
                </label>
              </div>
              <p className="text-[11px] text-[#94A3B8] pl-6">
                Permite que anunciantes externos comprem slots de mídia programática neste display.
              </p>
            </div>

            {adEligible && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                    Modo de Publicidade
                  </label>
                  <Select
                    options={[
                      { value: 'COMMERCIAL_ADS_ENABLED', label: '100% Anúncios Comerciais' },
                      { value: 'HYBRID_ADS', label: 'Híbrido (Cliente + Anúncios)' },
                      { value: 'PRIVATE_ONLY', label: 'Privado (Apenas Conteúdo Interno)' },
                    ]}
                    value={adStatus}
                    onChange={(e) => setAdStatus(e.target.value as DisplayAdvertisingStatus)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                    Repasse ao Estabelecimento (%)
                  </label>
                  <Input
                    type="number"
                    value={revenueSharePercent}
                    onChange={(e) => setRevenueSharePercent(Number(e.target.value))}
                    leftIcon={<Percent className="w-4 h-4" />}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                    Capacidade Máxima de Slots de Anúncios na Grade
                  </label>
                  <Input
                    type="number"
                    value={maxAdSlots}
                    onChange={(e) => setMaxAdSlots(Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Observations / Notes for all actions */}
        <div>
          <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
            Observações Comerciais & Registro de Auditoria
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Aprovado pela diretoria comercial da Nexora Angola."
            className="w-full bg-[#0B1120] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#06B6D4]"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={submitting}>
            Confirmar Operação
          </Button>
        </div>
      </form>
    </Modal>
  );
};
