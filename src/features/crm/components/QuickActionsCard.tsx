import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../../../components/ui';
import {
  Sparkles,
  Monitor,
  ListOrdered,
  Calendar,
  CreditCard,
  Wrench,
  UserPlus,
  Edit2,
  Megaphone,
} from 'lucide-react';

interface ClientQuickActionsCardProps {
  type: 'CLIENT' | 'ADVERTISER';
  onAddContact: () => void;
  onEditProfile: () => void;
  onViewDisplays?: () => void;
  onViewPlaylists?: () => void;
  onViewSchedules?: () => void;
  onViewContracts?: () => void;
  onViewCampaigns?: () => void;
  onViewAICredits?: () => void;
  onScheduleMaintenance?: () => void;
}

export const QuickActionsCard: React.FC<ClientQuickActionsCardProps> = ({
  type,
  onAddContact,
  onEditProfile,
  onViewDisplays,
  onViewPlaylists,
  onViewSchedules,
  onViewContracts,
  onViewCampaigns,
  onViewAICredits,
  onScheduleMaintenance,
}) => {
  return (
    <Card glow="none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#06B6D4]" />
          Ações Rápidas de Gestão
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-xs"
          leftIcon={<UserPlus className="w-3.5 h-3.5 text-cyan-400" />}
          onClick={onAddContact}
        >
          Adicionar Ponto Focal / Contacto
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-xs"
          leftIcon={<Edit2 className="w-3.5 h-3.5 text-blue-400" />}
          onClick={onEditProfile}
        >
          Editar Cadastro Empresarial
        </Button>

        {type === 'CLIENT' && (
          <>
            {onViewDisplays && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                leftIcon={<Monitor className="w-3.5 h-3.5 text-sky-400" />}
                onClick={onViewDisplays}
              >
                Gerir Displays Alocados
              </Button>
            )}
            {onViewPlaylists && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                leftIcon={<ListOrdered className="w-3.5 h-3.5 text-purple-400" />}
                onClick={onViewPlaylists}
              >
                Ver Playlists do Espaço
              </Button>
            )}
            {onViewSchedules && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                leftIcon={<Calendar className="w-3.5 h-3.5 text-amber-400" />}
                onClick={onViewSchedules}
              >
                Programação da Grade
              </Button>
            )}
            {onScheduleMaintenance && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                leftIcon={<Wrench className="w-3.5 h-3.5 text-yellow-400" />}
                onClick={onScheduleMaintenance}
              >
                Agendar Ordem de Serviço
              </Button>
            )}
          </>
        )}

        {type === 'ADVERTISER' && (
          <>
            {onViewCampaigns && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                leftIcon={<Megaphone className="w-3.5 h-3.5 text-pink-400" />}
                onClick={onViewCampaigns}
              >
                Criar Nova Campanha de Mídia
              </Button>
            )}
            {onViewAICredits && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                onClick={onViewAICredits}
              >
                Saldo de Créditos IA
              </Button>
            )}
          </>
        )}

        {onViewContracts && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
            leftIcon={<CreditCard className="w-3.5 h-3.5 text-emerald-400" />}
            onClick={onViewContracts}
          >
            Contratos & Faturas (AOA)
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
