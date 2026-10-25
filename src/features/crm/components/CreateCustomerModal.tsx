import React, { useState } from 'react';
import {
  CustomerProfile,
  ANGOLA_MUNICIPALITIES,
} from '../../../types/crm';
import { Modal, Input, Button, Select } from '../../../components/ui';
import { CheckCircle2, Building2 } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { NexoraService } from '../../../services';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCustomer: CustomerProfile) => void;
}

export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  // Simplified fields
  const [tradeName, setTradeName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [nif, setNif] = useState('');
  const [phone, setPhone] = useState('+244 ');
  const [email, setEmail] = useState('');
  const [municipality, setMunicipality] = useState<string>(ANGOLA_MUNICIPALITIES[0]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleClose = () => {
    setTradeName('');
    setLegalName('');
    setNif('');
    setPhone('+244 ');
    setEmail('');
    setMunicipality(ANGOLA_MUNICIPALITIES[0]);
    setErrors({});
    onClose();
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!tradeName.trim()) newErrors.tradeName = 'Nome Fantasia é obrigatório';
    if (!nif.trim()) newErrors.nif = 'NIF é obrigatório';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legalName,
          tradeName,
          nif,
          phone,
          email,
          municipality,
        }),
      });

      if (!response.ok) throw new Error('Falha ao cadastrar cliente');
      const data = await response.json();
      
      const newCustomer: CustomerProfile = {
        id: data.id,
        organizationId: data.id,
        customerCode: data.customer_code,
        legalName: data.legal_name,
        tradeName: data.trade_name,
        nif: data.nif,
        industry: data.industry,
        phone: data.phone,
        email: data.email,
        municipality: data.municipality,
        address: `${data.municipality}, Luanda`,
        city: 'Luanda',
        country: 'Angola',
        status: 'ACTIVE',
        lifecycleStage: 'ACTIVE',
        leadSource: 'DIRECT_SALES',
        planName: data.plan_name,
        monthlyFeeKz: data.monthly_fee_kz,
        createdAt: data.created_at,
        updatedAt: data.created_at,
      };

      addToast({
        title: 'Cliente Cadastrado',
        description: `${tradeName} foi adicionado à sua carteira com sucesso.`,
        type: 'success',
      });
      onSuccess(newCustomer);
      handleClose();
    } catch (err: any) {
      addToast({
        title: 'Erro ao cadastrar',
        description: err.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      title="Cadastrar Novo Cliente"
      description="Registe um novo contacto de cliente na plataforma."
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Cadastrar Cliente
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-2">
        <Input
          label="Nome Fantasia / Marca *"
          placeholder="Ex: Restaurante Talatona"
          value={tradeName}
          onChange={(e) => {
            setTradeName(e.target.value);
            if (!legalName) setLegalName(e.target.value);
          }}
          error={errors.tradeName}
          icon={<Building2 className="w-4 h-4 text-slate-400" />}
        />

        <Input
          label="Razão Social"
          placeholder="Ex: Gastronomia Talatona Lda."
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
        />

        <Input
          label="NIF *"
          placeholder="5000000000"
          value={nif}
          onChange={(e) => setNif(e.target.value)}
          error={errors.nif}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Telefone"
            placeholder="+244 923 000 000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label="E-mail"
            placeholder="geral@cliente.ao"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <Select
          label="Município / Localização"
          value={municipality}
          onChange={(e) => setMunicipality(e.target.value)}
          options={ANGOLA_MUNICIPALITIES.map((m) => ({ value: m, label: m }))}
        />
      </div>
    </Modal>
  );
};
