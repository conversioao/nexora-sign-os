import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { DeviceType, Display, DisplayOrientation } from '../../../types/domain';
import { useToast } from '../../../components/ui/Toast';
import {
  Monitor,
  MapPin,
  Tv,
  HardDrive,
  CheckCircle2,
  Key,
  Smartphone,
  Sparkles,
  ArrowRight,
  RotateCw,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { NexoraService } from '../../../services';
import { useSession } from '../../../context/SessionContext';

interface AddDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDisplay: (data: Partial<Display>) => Promise<Display>;
}

export const AddDisplayModal: React.FC<AddDisplayModalProps> = ({
  isOpen,
  onClose,
  onAddDisplay,
}) => {
  const { showToast } = useToast();
  const { currentOrganization } = useSession();
  const [step, setStep] = useState<'ENTER_PIN' | 'CONFIGURE'>('ENTER_PIN');
  const [pinCode, setPinCode] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);

  // Auto-detected specs from the TV Box
  const [detectedSpecs, setDetectedSpecs] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    municipality: 'Talatona',
    venueName: '',
    zone: 'Entrada Principal',
    deviceType: 'ANDROID_TV' as DeviceType,
    orientation: 'LANDSCAPE' as DisplayOrientation,
    // Duration-based pricing (Kz per spot insertion)
    priceImage10s: 3500,
    priceImage15s: 5000,
    priceImage30s: 9000,
    priceVideo10s: 4400,
    priceVideo15s: 6250,
    priceVideo30s: 11250,
    maxAdSlots: 8,
    estimatedDailyReach: 15000,
    coverImageUrl: '',
    notes: '',
    organizationId: currentOrganization?.id || 'org-nexora',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isOpen) {
      if (currentOrganization?.id) {
        setFormData((prev) => ({ ...prev, organizationId: currentOrganization.id }));
      }
      fetch('/api/organizations?type=CLIENT,PARTNER')
        .then((res) => (res.ok ? res.json() : []))
        .then((orgs) => setOrganizations(orgs))
        .catch((err) => console.error(err));
    }
  }, [isOpen, currentOrganization?.id]);

  const handleVerifyPin = async () => {
    const cleanPin = pinCode.replace(/[^0-9]/g, '');
    if (cleanPin.length < 6) {
      setPinError('Digite o código de 6 dígitos exibido na tela da TV Box.');
      return;
    }

    setIsVerifyingPin(true);
    setPinError(null);

    try {
      const res = await fetch(`/api/displays/pair/verify/${cleanPin}`);
      const data = await res.json();

      if (res.ok && data.valid) {
        setDetectedSpecs(data.specs || {});
        // Auto pre-fill name
        const plat = data.specs?.platform || 'TV Box';
        const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
        const autoCode = `NX-${uniqueSuffix}`;
        setFormData((prev) => ({
          ...prev,
          name: prev.name || `[${autoCode}] ${plat} - `,
          deviceType: data.specs?.platform?.toLowerCase().includes('android') ? 'ANDROID_TV' : 'TOTEM',
        }));
        setStep('CONFIGURE');
        showToast({
          type: 'success',
          title: 'Dispositivo Identificado!',
          message: 'TV Box conectada com sucesso. Configure os dados do display.',
        });
      } else {
        setPinError(data.message || 'Código não encontrado. Verifique se a TV Box está ligada e com o Nexora Player aberto.');
      }
    } catch (e) {
      setPinError('Erro ao validar código. Certifique-se de que o servidor está ativo.');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const handlePinChange = (val: string) => {
    // Format as 3-3 (e.g. 742-891)
    const digits = val.replace(/[^0-9]/g, '').slice(0, 6);
    if (digits.length > 3) {
      setPinCode(`${digits.slice(0, 3)}-${digits.slice(3)}`);
    } else {
      setPinCode(digits);
    }
    setPinError(null);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) {
      errs.name = 'O nome do display é obrigatório.';
    }
    if (!formData.venueName.trim()) {
      errs.venueName = 'O estabelecimento / local é obrigatório.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // First try pair confirm through API
      const cleanPin = pinCode.replace(/[^0-9]/g, '');
      const pairRes = await fetch('/api/displays/pair/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanPin,
          name: formData.name.trim(),
          municipality: formData.municipality,
          venueName: formData.venueName.trim(),
          zone: formData.zone.trim(),
          orientation: formData.orientation,
          organization_id: currentOrganization?.id || formData.organizationId || 'org-nexora',
          organizationId: currentOrganization?.id || formData.organizationId || 'org-nexora',
          // Duration-based pricing
          dailyRateKz: Number(formData.priceImage15s), // base price = 15s image spot
          price_image_10s: Number(formData.priceImage10s),
          price_image_15s: Number(formData.priceImage15s),
          price_image_30s: Number(formData.priceImage30s),
          price_video_10s: Number(formData.priceVideo10s),
          price_video_15s: Number(formData.priceVideo15s),
          price_video_30s: Number(formData.priceVideo30s),
          max_ad_slots: Number(formData.maxAdSlots),
          cover_image_url: formData.coverImageUrl,
          estimated_daily_reach: Number(formData.estimatedDailyReach),
        }),
      });

      if (pairRes.ok) {
        const created = await pairRes.json();
        showToast({
          type: 'success',
          title: 'Display Emparelhado e Ativo!',
          message: `O display ${created.name} está agora conectado em tempo real e a reproduzir mídias.`,
        });
      } else {
        const errorData = await pairRes.json().catch(() => ({}));
        if (pairRes.status === 403 || errorData.reachedLimit) {
          showToast({
            type: 'danger',
            title: 'Limite do Plano Atingido',
            message: errorData.error || 'Atingiu a capacidade de displays do seu plano atual. Faça upgrade para conectar mais telas.',
          });
          setIsSubmitting(false);
          return;
        }

        // Fallback to standard hook
        await onAddDisplay({
          name: formData.name.trim(),
          status: 'ONLINE',
          organizationId: formData.organizationId,
          location: {
            province: 'Luanda',
            municipality: formData.municipality,
            venueName: formData.venueName.trim(),
            zone: formData.zone.trim(),
            address: `${formData.venueName.trim()}, ${formData.municipality}, Luanda`,
          },
          deviceType: formData.deviceType,
          orientation: formData.orientation,
          dailyRateKz: Number(formData.dailyRateKz),
          coverImageUrl: formData.coverImageUrl,
          estimatedDailyReach: Number(formData.estimatedDailyReach),
          notes: formData.notes,
        });
      }

      handleClose();
    } catch {
      // Handled by toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setStep('ENTER_PIN');
    setPinCode('');
    setPinError(null);
    setDetectedSpecs(null);
    setFormData({
      name: '',
      municipality: 'Talatona',
      venueName: '',
      zone: 'Entrada Principal',
      deviceType: 'ANDROID_TV',
      orientation: 'LANDSCAPE',
      priceImage10s: 3500,
      priceImage15s: 5000,
      priceImage30s: 9000,
      priceVideo10s: 4400,
      priceVideo15s: 6250,
      priceVideo30s: 11250,
      maxAdSlots: 8,
      estimatedDailyReach: 15000,
      coverImageUrl: '',
      notes: '',
      organizationId: 'org-nexora',
    });
    setErrors({});
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      title={step === 'ENTER_PIN' ? 'Emparelhar Nova TV Box (Estilo Yodeck)' : 'Configurar Novo Display'}
      description={
        step === 'ENTER_PIN'
          ? 'Digite o código de 6 dígitos que aparece na tela da TV Box ao abrir o Nexora Player.'
          : 'Dispositivo verificado com sucesso. Defina o nome, localização e orientação da tela.'
      }
      footer={
        step === 'ENTER_PIN' ? (
          <>
            <Button variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleVerifyPin}
              loading={isVerifyingPin}
              leftIcon={<Key className="w-4 h-4" />}
            >
              Verificar Dispositivo
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => setStep('ENTER_PIN')} disabled={isSubmitting}>
              Voltar
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Concluir Emparelhamento
            </Button>
          </>
        )
      }
    >
      {step === 'ENTER_PIN' ? (
        <div className="space-y-6 py-2">
          {/* Visual Instructions */}
          <div className="p-4 bg-slate-900/60 rounded-xl border border-cyan-500/20 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Como funciona o emparelhamento:</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                1. Instale e abra o app <strong className="text-cyan-300">Nexora Player</strong> na sua TV Box ou Smart TV.{' '}
                2. Um código de 6 dígitos aparecerá na tela. Digite-o abaixo para conectar a máquina remotamente.
              </p>
            </div>
          </div>

          {/* PIN Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Código de Emparelhamento (PIN de 6 Dígitos)
            </label>
            <div className="relative">
              <input
                type="text"
                value={pinCode}
                onChange={(e) => handlePinChange(e.target.value)}
                placeholder="Ex: 742-891"
                maxLength={7}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleVerifyPin();
                }}
                className="w-full bg-slate-950 border-2 border-cyan-500/40 focus:border-cyan-400 rounded-xl py-3.5 px-4 text-center font-mono text-3xl tracking-widest text-cyan-300 font-bold focus:outline-none shadow-inner"
              />
            </div>
            {pinError && (
              <p className="text-xs text-rose-400 flex items-center gap-1.5 mt-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> {pinError}
              </p>
            )}
            <p className="text-[11px] text-slate-500 text-center mt-1">
              O código é gerado automaticamente pelo reprodutor da TV Box.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Detected Hardware Specs Banner */}
          {detectedSpecs && (
            <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <span className="text-xs font-bold text-emerald-300">Dispositivo Reconhecido</span>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {detectedSpecs.platform} • {detectedSpecs.resolution} • IP: {detectedSpecs.ip}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                PIN: {pinCode}
              </span>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome do Display *"
              placeholder="Ex: Totem Entrada Principal"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
            />

            <Select
              label="Município de Luanda"
              value={formData.municipality}
              onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
              options={[
                { value: 'Talatona', label: 'Talatona' },
                { value: 'Maianga', label: 'Maianga' },
                { value: 'Ingombota', label: 'Ingombota / Centro' },
                { value: 'Mutamba', label: 'Mutamba' },
                { value: 'Belas', label: 'Belas' },
                { value: 'Kilamba', label: 'Kilamba' },
                { value: 'Viana', label: 'Viana' },
                { value: 'Cazenga', label: 'Cazenga' },
              ]}
            />

            <Select
              label="Tipo de Estabelecimento (Marketplace)"
              value={(formData as any).venueType || 'SHOPPING_CENTER'}
              onChange={(e) => setFormData({ ...formData, [e.target.name || 'venueType']: e.target.value } as any)}
              options={[
                { value: 'SHOPPING_CENTER', label: 'Shopping Center / Centro Comercial' },
                { value: 'CORPORATE', label: 'Edifício Corporativo / Banco' },
                { value: 'HOTEL', label: 'Hotel 5 Estrelas / Resort' },
                { value: 'TRANSPORT', label: 'Aeroporto / Terminal de Transportes' },
                { value: 'STREET_TOTEM', label: 'Totem Urbano / Via Pública' },
                { value: 'RETAIL_STORE', label: 'Hipermercado / Loja de Conveniência' },
              ]}
            />

            <Input
              label="Estabelecimento / Loja *"
              placeholder="Ex: Belas Shopping, Farmácia Central"
              value={formData.venueName}
              onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
              error={errors.venueName}
            />

            <Input
              label="Zona / Posição no Local"
              placeholder="Ex: Entrada Principal, Caixa 03"
              value={formData.zone}
              onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
            />

            <Select
              label="Vincular a Parceiro / Proprietário (Rede Nexora)"
              value={formData.organizationId}
              onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
              options={[
                { value: 'org-nexora', label: 'Associar à Rede Nexora (Próprio)' },
                ...organizations.filter(o => o.id !== 'org-nexora').map(org => ({
                  value: org.id,
                  label: org.tradeName || org.name
                }))
              ]}
            />

            <Select
              label="Orientação da Tela"
              value={formData.orientation}
              onChange={(e) => setFormData({ ...formData, orientation: e.target.value as DisplayOrientation })}
              options={[
                { value: 'LANDSCAPE', label: 'Horizontal (Paisagem 16:9)' },
                { value: 'PORTRAIT', label: 'Vertical (Retrato 9:16 - Totem)' },
              ]}
            />

            {/* Duration-based Pricing Grid */}
            <div className="md:col-span-2 space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                💰 Tabela de Preços por Duração e Formato (Kz / Inserção)
              </label>
              <div className="rounded-xl border border-cyan-500/30 bg-slate-950 overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-4 text-[10px] font-bold uppercase tracking-wider">
                  <div className="px-3 py-2 text-slate-400 bg-slate-900/60 border-b border-slate-800">Duração</div>
                  <div className="px-3 py-2 text-center text-slate-400 bg-slate-900/60 border-b border-l border-slate-800">10 seg</div>
                  <div className="px-3 py-2 text-center text-cyan-300 bg-slate-900/60 border-b border-l border-slate-800">15 seg ★</div>
                  <div className="px-3 py-2 text-center text-amber-300 bg-slate-900/60 border-b border-l border-slate-800">30 seg</div>
                </div>
                {/* Imagem Row */}
                <div className="grid grid-cols-4 border-b border-slate-800/60">
                  <div className="px-3 py-2.5 text-xs font-semibold text-slate-300 flex items-center gap-1.5">🖼️ Imagem</div>
                  <div className="px-2 py-1.5 border-l border-slate-800">
                    <input type="number" min={500} step={100}
                      value={formData.priceImage10s}
                      onChange={(e) => setFormData({ ...formData, priceImage10s: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-right focus:border-cyan-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="px-2 py-1.5 border-l border-slate-800">
                    <input type="number" min={500} step={100}
                      value={formData.priceImage15s}
                      onChange={(e) => setFormData({ ...formData, priceImage15s: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-cyan-500/40 rounded-lg px-2 py-1.5 text-xs text-cyan-300 text-right focus:border-cyan-400 focus:outline-none font-mono font-bold"
                    />
                  </div>
                  <div className="px-2 py-1.5 border-l border-slate-800">
                    <input type="number" min={500} step={100}
                      value={formData.priceImage30s}
                      onChange={(e) => setFormData({ ...formData, priceImage30s: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-right focus:border-cyan-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
                {/* Vídeo Row */}
                <div className="grid grid-cols-4">
                  <div className="px-3 py-2.5 text-xs font-semibold text-slate-300 flex items-center gap-1.5">🎬 Vídeo HD</div>
                  <div className="px-2 py-1.5 border-l border-slate-800">
                    <input type="number" min={500} step={100}
                      value={formData.priceVideo10s}
                      onChange={(e) => setFormData({ ...formData, priceVideo10s: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-right focus:border-cyan-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="px-2 py-1.5 border-l border-slate-800">
                    <input type="number" min={500} step={100}
                      value={formData.priceVideo15s}
                      onChange={(e) => setFormData({ ...formData, priceVideo15s: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-right focus:border-cyan-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="px-2 py-1.5 border-l border-slate-800">
                    <input type="number" min={500} step={100}
                      value={formData.priceVideo30s}
                      onChange={(e) => setFormData({ ...formData, priceVideo30s: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-right focus:border-cyan-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500">
                ★ O preço de <strong className="text-cyan-300">Imagem 15s</strong> é o preço base utilizado nas estimativas do Marketplace.
                A frequência de exibição é calculada automaticamente com base na playlist e duração do spot (média 13h/dia operacional).
              </p>
            </div>

            <Input
              label="Capacidade Máxima de Anúncios (Slots)"
              type="number"
              min={1}
              max={50}
              placeholder="Ex: 8 (grade de 8 anúncios)"
              value={formData.maxAdSlots}
              onChange={(e) => setFormData({ ...formData, maxAdSlots: Math.max(1, Number(e.target.value)) })}
            />

            <Input
              label="Estimativa Diária de Pessoas (Alcance)"
              type="number"
              min={100}
              placeholder="Ex: 15000 pessoas/dia"
              value={formData.estimatedDailyReach}
              onChange={(e) => setFormData({ ...formData, estimatedDailyReach: Number(e.target.value) })}
            />

            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Imagem de Capa do Display (Para exibição no Marketplace) *
              </label>
              <div className="flex items-center gap-3">
                {formData.coverImageUrl ? (
                  <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 group">
                    <img src={formData.coverImageUrl} alt="Capa" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, coverImageUrl: '' })}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-rose-400 font-bold transition-opacity"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-16 rounded-lg border-2 border-dashed border-slate-700 bg-slate-900/60 flex items-center justify-center text-slate-500 text-xs">
                    Sem Capa
                  </div>
                )}
                <div className="flex-1">
                  <label className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 cursor-pointer transition-colors">
                    <span>🖼️ {formData.coverImageUrl ? 'Trocar Imagem de Capa' : 'Carregar Imagem de Capa'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = async (ev) => {
                          const base64 = ev.target?.result as string;
                          try {
                            const res = await fetch('/api/storage/upload', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                fileBase64: base64,
                                fileName: file.name,
                                folder: 'displays_capas',
                                mimeType: file.type,
                              }),
                            });
                            const data = await res.json();
                            if (data.url) {
                              setFormData(prev => ({ ...prev, coverImageUrl: data.url }));
                              showToast({ type: 'success', title: 'Capa Carregada', message: 'Imagem de capa salva com sucesso!' });
                            }
                          } catch (err) {
                            showToast({ type: 'error', title: 'Erro de Upload', message: 'Não foi possível carregar a imagem.' });
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1">Formatos aceites: JPG, PNG, WEBP (Recomendado 16:9)</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};
