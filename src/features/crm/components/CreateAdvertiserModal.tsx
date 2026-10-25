import React, { useState } from 'react';
import {
  AdvertiserProfile,
  CustomerLifecycleStage,
  LeadSource,
  ANGOLA_MUNICIPALITIES,
  ADVERTISER_INDUSTRIES,
  LEAD_SOURCE_LABELS,
  LIFECYCLE_STAGE_LABELS,
} from '../../../types/crm';
import { Modal, Input, Button, Textarea, Select } from '../../../components/ui';
import {
  Briefcase,
  User,
  CheckCircle2,
  Phone,
  Mail,
  Globe,
  ArrowRight,
  ArrowLeft,
  Banknote,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { NexoraService } from '../../../services';

interface CreateAdvertiserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newAdvertiser: AdvertiserProfile) => void;
}

export const CreateAdvertiserModal: React.FC<CreateAdvertiserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Dados do Anunciante
  const [tradeName, setTradeName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [nif, setNif] = useState('');
  const [industry, setIndustry] = useState<string>(ADVERTISER_INDUSTRIES[0]);
  const [phone, setPhone] = useState('+244 ');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [municipality, setMunicipality] = useState<string>(ANGOLA_MUNICIPALITIES[0]);

  // Step 2: Contacto
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('Head de Mídia / Contas');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('+244 ');
  const [contactWhatsapp, setContactWhatsapp] = useState('+244 ');

  // Step 3: Orçamento & Comercial
  const [monthlyBudgetEstimateKz, setMonthlyBudgetEstimateKz] = useState<number>(3500000);
  const [lifecycleStage, setLifecycleStage] = useState<CustomerLifecycleStage>('ACTIVE');
  const [leadSource, setLeadSource] = useState<LeadSource>('DIRECT_SALES');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setStep(1);
    setTradeName('');
    setLegalName('');
    setNif('');
    setIndustry(ADVERTISER_INDUSTRIES[0]);
    setPhone('+244 ');
    setEmail('');
    setWebsite('');
    setAddress('');
    setMunicipality(ANGOLA_MUNICIPALITIES[0]);
    setContactName('');
    setContactRole('Head de Mídia / Contas');
    setContactEmail('');
    setContactPhone('+244 ');
    setContactWhatsapp('+244 ');
    setMonthlyBudgetEstimateKz(3500000);
    setLifecycleStage('ACTIVE');
    setLeadSource('DIRECT_SALES');
    setNotes('');
  };

  const handleNextStep1 = () => {
    if (!tradeName.trim()) {
      addToast({ type: 'warning', title: 'Campo Obrigatório', message: 'Indique o nome da marca ou agência.' });
      return;
    }
    if (!nif.trim()) {
      addToast({ type: 'warning', title: 'Campo Obrigatório', message: 'Indique o NIF do anunciante.' });
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!contactName.trim()) {
      addToast({ type: 'warning', title: 'Campo Obrigatório', message: 'Indique o nome do contacto principal.' });
      return;
    }
    setStep(3);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Create Organization in OrganizationRepository
      const org = await NexoraService.organizations.create({
        name: tradeName,
        tradeName: legalName || tradeName,
        type: 'ADVERTISER',
        nif,
        contactEmail: email || contactEmail || 'mídia@anunciante.ao',
        phone: phone || contactPhone || '+244 923 000 000',
        address: address || `${municipality}, Luanda`,
        city: 'Luanda',
        province: municipality,
        country: 'Angola',
        timezone: 'Africa/Luanda',
        status: 'ACTIVE',
      });

      // 2. Create Advertiser Profile
      const advertiser = await NexoraService.advertisers.createProfile({
        organizationId: org.id,
        legalName: legalName || tradeName,
        tradeName,
        nif,
        industry,
        phone,
        email,
        website,
        address: address || `${municipality}, Luanda`,
        municipality,
        city: 'Luanda',
        country: 'Angola',
        status: lifecycleStage === 'ACTIVE' ? 'ACTIVE' : lifecycleStage === 'PROSPECT' ? 'PROSPECT' : 'INACTIVE',
        lifecycleStage,
        leadSource,
        monthlyBudgetEstimateKz: Number(monthlyBudgetEstimateKz) || 3500000,
        notes,
      });

      // 3. Create Primary Contact
      if (contactName.trim()) {
        await NexoraService.contacts.create({
          organizationId: org.id,
          name: contactName,
          role: contactRole,
          department: 'Mídia & Publicidade',
          email: contactEmail || email || 'contacto@anunciante.ao',
          phone: contactPhone || phone || '+244 923 000 000',
          whatsapp: contactWhatsapp || contactPhone || '',
          isPrimary: true,
          status: 'ACTIVE',
        });
      }

      // 4. Log Activity
      await NexoraService.crmActivities.logActivity({
        actorId: 'usr-mario',
        actorName: 'Mário Silva',
        organizationId: org.id,
        entityType: 'ADVERTISER',
        entityId: advertiser.id,
        entityName: advertiser.tradeName,
        action: 'Anunciante Criado',
        description: `Novo anunciante ${advertiser.tradeName} cadastrado com orçamento estimado de ${monthlyBudgetEstimateKz.toLocaleString()} Kz.`,
      });

      addToast({
        type: 'success',
        title: 'Anunciante Registado!',
        message: `${tradeName} foi adicionado à base de anunciantes da Nexora.`,
      });

      onSuccess(advertiser);
      resetForm();
      onClose();
    } catch {
      addToast({
        type: 'danger',
        title: 'Erro ao Registar Anunciante',
        message: 'Ocorreu um erro ao salvar o anunciante.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Registar Novo Anunciante & Agência"
      description="Cadastre uma marca ou agência parceira de veiculação na rede de telas Nexora."
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
            <span>Passo {step} de 3</span>
            <span className="text-[#64748B]">•</span>
            <span className="text-[#EC4899]">
              {step === 1 ? 'Dados da Marca' : step === 2 ? 'Gestor de Mídia' : 'Orçamento & Metas'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep((s) => (s - 1) as 1 | 2)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                disabled={loading}
              >
                Voltar
              </Button>
            )}

            {step < 3 ? (
              <Button
                variant="cyan"
                size="sm"
                onClick={step === 1 ? handleNextStep1 : handleNextStep2}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continuar
              </Button>
            ) : (
              <Button
                variant="cyan"
                size="sm"
                onClick={handleSubmit}
                loading={loading}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Finalizar Registo
              </Button>
            )}
          </div>
        </div>
      }
    >
      {/* Wizard Progress bar */}
      <div className="mb-6">
        <div className="grid grid-cols-3 gap-2">
          {[
            { s: 1, label: '1. Marca / Agência', icon: Briefcase },
            { s: 2, label: '2. Ponto Focal', icon: User },
            { s: 3, label: '3. Orçamento', icon: Sparkles },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = step === item.s;
            const isCompleted = step > item.s;
            return (
              <div
                key={item.s}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-pink-500/10 border-pink-500/40 text-pink-400'
                    : isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-white/[0.02] border-white/5 text-[#64748B]'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-semibold truncate">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 1: Dados da Marca */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Input
                label="Nome Comercial da Marca / Agência *"
                placeholder="Ex: Unitel Angola, Agência Criativa"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                label="Razão Social (Legal Name)"
                placeholder="Ex: Unitel S.A."
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="NIF (Número de Identificação Fiscal) *"
                placeholder="Ex: 5400112233"
                value={nif}
                onChange={(e) => setNif(e.target.value)}
                required
              />
            </div>

            <div>
              <Select
                label="Segmento de Mercado *"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                options={ADVERTISER_INDUSTRIES.map((ind) => ({ value: ind, label: ind }))}
              />
            </div>

            <div>
              <Input
                label="Telefone Comercial"
                placeholder="+244 923 000 000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4 text-[#64748B]" />}
              />
            </div>

            <div>
              <Input
                label="E-mail de Mídia"
                type="email"
                placeholder="planeamento@marca.ao"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4 text-[#64748B]" />}
              />
            </div>

            <div>
              <Input
                label="Website Oficial"
                placeholder="https://marca.ao"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                leftIcon={<Globe className="w-4 h-4 text-[#64748B]" />}
              />
            </div>

            <div>
              <Select
                label="Município Sede *"
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                options={ANGOLA_MUNICIPALITIES.map((mun) => ({ value: mun, label: mun }))}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Contacto */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <Input
                label="Nome do Gestor de Mídia / Contas *"
                placeholder="Ex: Paula Nascimento"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="Cargo / Função"
                placeholder="Ex: Diretora de Marketing & Branding"
                value={contactRole}
                onChange={(e) => setContactRole(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="E-mail Direto"
                type="email"
                placeholder="paula.nascimento@marca.ao"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4 text-[#64748B]" />}
              />
            </div>

            <div>
              <Input
                label="Telefone / Telemóvel"
                placeholder="+244 923 100 001"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4 text-[#64748B]" />}
              />
            </div>

            <div>
              <Input
                label="WhatsApp"
                placeholder="+244 923 100 001"
                value={contactWhatsapp}
                onChange={(e) => setContactWhatsapp(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Orçamento & Metas */}
      {step === 3 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Input
                label="Orçamento Mensal Estimado (AOA / Kz) *"
                type="number"
                placeholder="3500000"
                value={monthlyBudgetEstimateKz}
                onChange={(e) => setMonthlyBudgetEstimateKz(Number(e.target.value))}
                leftIcon={<Banknote className="w-4 h-4 text-[#10B981]" />}
              />
            </div>

            <div>
              <Select
                label="Estado Comercial Inicial *"
                value={lifecycleStage}
                onChange={(e) => setLifecycleStage(e.target.value as CustomerLifecycleStage)}
                options={Object.entries(LIFECYCLE_STAGE_LABELS).map(([k, v]) => ({
                  value: k,
                  label: `${v.step}. ${v.label}`,
                }))}
              />
            </div>

            <div>
              <Select
                label="Canal de Origem (Lead Source) *"
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value as LeadSource)}
                options={Object.entries(LEAD_SOURCE_LABELS).map(([k, v]) => ({
                  value: k,
                  label: v,
                }))}
              />
            </div>

            <div className="md:col-span-2">
              <Textarea
                label="Notas Comerciais & Foco de Campanha"
                placeholder="Produtos de destaque, target de audiência desejado em Luanda..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
