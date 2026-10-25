import React from 'react';
import { Contact } from '../../../types/crm';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, IconButton } from '../../../components/ui';
import {
  Users,
  UserPlus,
  Star,
  Phone,
  Mail,
  MessageSquare,
  MoreVertical,
  Edit2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Dropdown } from '../../../components/ui/Dropdown';

interface ContactListCardProps {
  contacts: Contact[];
  loading?: boolean;
  onAddContact: () => void;
  onEditContact: (contact: Contact) => void;
  onSetPrimary: (contactId: string) => void;
  onToggleStatus: (contact: Contact) => void;
}

export const ContactListCard: React.FC<ContactListCardProps> = ({
  contacts,
  loading = false,
  onAddContact,
  onEditContact,
  onSetPrimary,
  onToggleStatus,
}) => {
  return (
    <Card glow="none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#06B6D4]" />
            <CardTitle className="text-sm font-semibold text-[#F8FAFC]">
              Equipa & Contactos da Organização
            </CardTitle>
            <Badge variant="cyan" size="sm">
              {contacts.length}
            </Badge>
          </div>
          <Button
            variant="cyan"
            size="sm"
            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            onClick={onAddContact}
          >
            Adicionar Contacto
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-white/[0.02] border border-white/5">
            <Users className="w-8 h-8 text-[#64748B] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-[#F8FAFC] mb-1">Nenhum contacto cadastrado</p>
            <p className="text-xs text-[#94A3B8] mb-4">Adicione os responsáveis comerciais e técnicos desta organização.</p>
            <Button variant="outline" size="sm" onClick={onAddContact}>
              Cadastrar Primeiro Contacto
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className={`p-4 rounded-xl border transition-all ${
                  contact.isPrimary
                    ? 'bg-[#0B132B]/80 border-[#06B6D4]/30 ring-1 ring-[#06B6D4]/20'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 ${
                        contact.isPrimary
                          ? 'bg-gradient-to-br from-[#06B6D4] to-[#2563EB] text-white shadow-lg shadow-[#06B6D4]/20'
                          : 'bg-white/10 text-[#94A3B8]'
                      }`}
                    >
                      {contact.name.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-[#F8FAFC]">{contact.name}</span>
                        {contact.isPrimary && (
                          <Badge variant="cyan" size="sm" className="text-[10px] px-1.5 py-0">
                            <Star className="w-2.5 h-2.5 fill-[#06B6D4] mr-0.5" />
                            Principal
                          </Badge>
                        )}
                        <Badge
                          variant={contact.status === 'ACTIVE' ? 'emerald' : 'neutral'}
                          size="sm"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {contact.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-[#94A3B8]">
                        {contact.role} {contact.department ? `• ${contact.department}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  <Dropdown
                    trigger={
                      <IconButton variant="ghost" size="sm" aria-label="Ações do contacto">
                        <MoreVertical className="w-3.5 h-3.5 text-[#94A3B8]" />
                      </IconButton>
                    }
                    items={[
                      {
                        label: 'Editar Contacto',
                        icon: <Edit2 className="w-3.5 h-3.5 text-[#94A3B8]" />,
                        onClick: () => onEditContact(contact),
                      },
                      ...(!contact.isPrimary
                        ? [
                            {
                              label: 'Tornar Ponto Principal',
                              icon: <Star className="w-3.5 h-3.5 text-cyan-400" />,
                              onClick: () => onSetPrimary(contact.id),
                            },
                          ]
                        : []),
                      {
                        label: contact.status === 'ACTIVE' ? 'Desativar Contacto' : 'Ativar Contacto',
                        icon:
                          contact.status === 'ACTIVE' ? (
                            <XCircle className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ),
                        onClick: () => onToggleStatus(contact),
                      },
                    ]}
                  />
                </div>

                <div className="space-y-1 pt-2 border-t border-white/5 text-xs text-[#CBD5E1]">
                  {contact.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#64748B] flex-shrink-0" />
                      <a
                        href={`mailto:${contact.email}`}
                        className="truncate hover:text-[#06B6D4] transition-colors"
                      >
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#64748B] flex-shrink-0" />
                        <span>{contact.phone}</span>
                      </div>
                      {contact.whatsapp && (
                        <a
                          href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#10B981] hover:underline"
                        >
                          <MessageSquare className="w-3 h-3" />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {contact.notes && (
                  <p className="mt-2 text-[11px] text-[#64748B] bg-white/[0.02] p-1.5 rounded-lg border border-white/5 line-clamp-2">
                    {contact.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
