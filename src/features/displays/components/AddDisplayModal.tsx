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
import { getApiUrl } from '../../../config/api';

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
    deviceType: 'ANDROID_TV' as DeviceType,
    screenSizeInches: 55,
    maxAdSlots: 8,
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
      const inches = Number(formData.screenSizeInches) || 55;
      const pairRes = await fetch('/api/displays/pair/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanPin,
          name: formData.name.trim(),
          organization_id: currentOrganization?.id || formData.organizationId || 'org-nexora',
          organizationId: currentOrganization?.id || formData.organizationId || 'org-nexora',
          screenSizeInches: inches,
          screen_size_inches: inches,
          max_ad_slots: Number(formData.maxAdSlots),
        }),
      });

      if (pairRes.ok) {
        const created = await pairRes.json();
        showToast({
          type: 'success',
          title: 'Display Emparelhado e Ativo!',
          message: `O display ${created.name} (${inches}") está agora conectado em tempo real e a reproduzir mídias.`,
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
          deviceType: formData.deviceType,
          screenSizeInches: inches,
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
      deviceType: 'ANDROID_TV',
      maxAdSlots: 8,
      organizationId: 'org-nexora',
      screenSizeInches: 55,
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

          {/* Form Fields: Name, Slots and Screen Size Inches */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Nome do Display *"
              placeholder="Ex: Totem Entrada Principal"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
              className="md:col-span-3"
            />

            <Input
              label="Polegadas da Tela *"
              type="number"
              min={15}
              max={120}
              placeholder="Ex: 55"
              value={formData.screenSizeInches}
              onChange={(e) => setFormData({ ...formData, screenSizeInches: Math.max(1, Number(e.target.value)) })}
              helperText='Tamanho da tela (ex: 32", 43", 55", 65")'
            />

            <Input
              label="Slots de Anúncios"
              type="number"
              min={1}
              max={50}
              placeholder="Ex: 8"
              value={formData.maxAdSlots}
              onChange={(e) => setFormData({ ...formData, maxAdSlots: Math.max(1, Number(e.target.value)) })}
              helperText="Capacidade da grade de rotação"
            />
          </div>
        </form>
      )}
    </Modal>
  );
};
