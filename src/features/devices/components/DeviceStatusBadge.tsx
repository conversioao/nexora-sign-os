import React from 'react';
import { DeviceStatus, ConnectionStatus } from '../../../types/devices';
import { Badge } from '../../../components/ui/Badge';

interface DeviceStatusBadgeProps {
  status: DeviceStatus;
}

export const DeviceStatusBadge: React.FC<DeviceStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'ONLINE':
      return <Badge variant="success">Online</Badge>;
    case 'WARNING':
      return <Badge variant="warning">Atenção</Badge>;
    case 'OFFLINE':
      return <Badge variant="error">Offline</Badge>;
    case 'ERROR':
      return <Badge variant="error">Erro</Badge>;
    case 'MAINTENANCE':
      return <Badge variant="neutral">Manutenção</Badge>;
    case 'UNREGISTERED':
      return <Badge variant="neutral">Não Registado</Badge>;
    case 'PROVISIONING':
      return <Badge variant="blue">Provisionando</Badge>;
    case 'DECOMMISSIONED':
      return <Badge variant="neutral">Desativado</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
};

interface ConnectionStatusBadgeProps {
  status: ConnectionStatus;
}

export const ConnectionStatusBadge: React.FC<ConnectionStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'CONNECTED':
      return (
        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          Conectado
        </div>
      );
    case 'DISCONNECTED':
      return (
        <div className="flex items-center gap-1.5 text-rose-400 text-xs font-medium">
          <div className="w-2 h-2 rounded-full bg-rose-400"></div>
          Desconectado
        </div>
      );
    case 'UNSTABLE':
      return (
        <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
          <div className="w-2 h-2 rounded-full bg-amber-400"></div>
          Instável
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
          <div className="w-2 h-2 rounded-full bg-slate-400"></div>
          Desconhecido
        </div>
      );
  }
};
