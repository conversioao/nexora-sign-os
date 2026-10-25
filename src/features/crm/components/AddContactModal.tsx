import React, { useState, useEffect } from 'react';
import { Contact, ContactStatus } from '../../../types/crm';
import { Modal, Input, Button, Textarea, Select, Checkbox } from '../../../components/ui';
import { UserPlus, UserCheck, Phone, Mail, MessageSquare } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { NexoraService } from '../../../services';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName?: string;
  contactToEdit?: Contact | null;
  onSuccess: (savedContact: Contact) => void;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  organizationName = 'Organização',
  contactToEdit,
  onSuccess,
}) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [status, setStatus] = useState<ContactStatus>('ACTIVE');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (contactToEdit) {
      setName(contactToEdit.name);
      setRole(contactToEdit.role);
      setDepartment(contactToEdit.department || '');
      setEmail(contactToEdit.email);
      setPhone(contactToEdit.phone);
      setWhatsapp(contactToEdit.whatsapp || '');
      setIsPrimary(contactToEdit.isPrimary);
      setStatus(contactToEdit.status);
      setNotes(contactToEdit.notes || '');
    } else {
      setName('');
      setRole('');
      setDepartment('');
      setEmail('');
      setPhone('+244 ');
      setWhatsapp('+244 ');
      setIsPrimary(false);
      setStatus('ACTIVE');
      setNotes('');
    }
  }, [contactToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast({ type: 'warning', title: 'Atenção', message: 'O nome do contacto é obrigatório.' });
      return;
    }
    if (!email.trim() && !phone.trim()) {
      addToast({ type: 'warning', title: 'Atenção', message: 'Forneça pelo menos um e-mail ou telefone.' });
      return;
    }

    setLoading(true);
    try {
      if (contactToEdit) {
        const updated = await NexoraService.contacts.update(contactToEdit.id, {
          name,
          role,
          department,
          email,
          phone,
          whatsapp,
          isPrimary,
          status,
          notes,
        });

        await NexoraService.crmActivities.logActivity({
          actorId: 'usr-mario',
          actorName: 'Mário Silva',
          organizationId,
          entityType: 'CONTACT',
          entityId: updated.id,
          entityName: updated.name,
          action: 'Contacto Atualizado',
          description: `Contacto ${updated.name} (${updated.role}) atualizado para ${organizationName}.`,
        });

        addToast({ type: 'success', title: 'Contacto Atualizado', message: `${updated.name} foi atualizado com sucesso.` });
        onSuccess(updated);
      } else {
        const created = await NexoraService.contacts.create({
          organizationId,
          name,
          role,
          department,
          email,
          phone,
          whatsapp,
          isPrimary,
          status,
          notes,
        });

        await NexoraService.crmActivities.logActivity({
          actorId: 'usr-mario',
          actorName: 'Mário Silva',
          organizationId,
          entityType: 'CONTACT',
          entityId: created.id,
          entityName: created.name,
          action: 'Contacto Adicionado',
          description: `Novo contacto ${created.name} (${created.role}) adicionado a ${organizationName}.`,
        });

        addToast({ type: 'success', title: 'Contacto Adicionado', message: `${created.name} foi adicionado à equipa da organização.` });
        onSuccess(created);
      }
      onClose();
    } catch {
      addToast({ type: 'danger', title: 'Erro ao Salvar', message: 'Não foi possível salvar os dados do contacto.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contactToEdit ? 'Editar Contacto' : 'Adicionar Novo Contacto'}
      description={`Gerir ponto focal para ${organizationName}.`}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="cyan"
            size="sm"
            onClick={handleSubmit}
            loading={loading}
            leftIcon={contactToEdit ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          >
            {contactToEdit ? 'Salvar Alterações' : 'Adicionar Contacto'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Input
              label="Nome Completo *"
              placeholder="Ex: Carlos Manuel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              label="Cargo / Função *"
              placeholder="Ex: Diretor Geral, Gerente de Mídia"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              label="Departamento"
              placeholder="Ex: Marketing, Operações, TI"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="E-mail Corporativo"
              type="email"
              placeholder="exemplo@empresa.ao"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4 text-[#64748B]" />}
            />
          </div>

          <div>
            <Input
              label="Telefone Principal"
              placeholder="+244 923 000 000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="w-4 h-4 text-[#64748B]" />}
            />
          </div>

          <div>
            <Input
              label="WhatsApp Direto"
              placeholder="+244 923 000 000"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              leftIcon={<MessageSquare className="w-4 h-4 text-[#64748B]" />}
            />
          </div>

          <div>
            <Select
              label="Estado do Contacto"
              value={status}
              onChange={(e) => setStatus(e.target.value as ContactStatus)}
              options={[
                { value: 'ACTIVE', label: 'Ativo' },
                { value: 'INACTIVE', label: 'Inativo' },
              ]}
            />
          </div>
        </div>

        <div className="pt-2">
          <Checkbox
            label="Definir como Ponto Focal Principal (Primary Contact)"
            checked={isPrimary}
            onChange={(checked) => setIsPrimary(checked)}
          />
          <p className="text-[11px] text-[#64748B] ml-6 mt-0.5">
            O contacto principal recebe notificações automáticas de status de displays e faturamento.
          </p>
        </div>

        <div>
          <Textarea
            label="Notas Internas & Observações"
            placeholder="Informações relevantes sobre este contacto (horário de atendimento, preferências)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>
      </form>
    </Modal>
  );
};
