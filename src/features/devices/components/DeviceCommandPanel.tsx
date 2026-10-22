import React, { useState } from 'react';
import { Device, DeviceCommandType } from '../../../types/devices';
import { deviceService } from '../../../services/deviceService';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useToast } from '../../../components/ui/Toast';
import { RotateCcw, Power, RefreshCw, Smartphone, Trash2, Camera, Stethoscope, DownloadCloud } from 'lucide-react';

interface DeviceCommandPanelProps {
  device: Device;
}

export const DeviceCommandPanel: React.FC<DeviceCommandPanelProps> = ({ device }) => {
  const [isSending, setIsSending] = useState(false);
  const { showToast } = useToast();

  const handleCommand = async (command: DeviceCommandType, label: string) => {
    if (!confirm(`Tem certeza que deseja enviar o comando "${label}" para o dispositivo ${device.deviceCode}?`)) {
      return;
    }
    
    setIsSending(true);
    try {
      await deviceService.sendCommand(device.id, command);
      showToast('Comando enviado', `O comando ${label} foi enviado com sucesso.`, 'success');
    } catch (e) {
      showToast('Erro ao enviar', 'Não foi possível enviar o comando.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const commands: { type: DeviceCommandType; label: string; icon: React.FC<any>; variant?: any }[] = [
    { type: 'RESTART_PLAYER', label: 'Reiniciar Player', icon: RotateCcw, variant: 'secondary' },
    { type: 'REBOOT_DEVICE', label: 'Reboot Device', icon: Power, variant: 'danger' },
    { type: 'SYNC_CONTENT', label: 'Sincronizar Conteúdo', icon: DownloadCloud },
    { type: 'SYNC_PLAYLIST', label: 'Sincronizar Playlist', icon: RefreshCw },
    { type: 'REFRESH_SCHEDULE', label: 'Atualizar Programação', icon: RefreshCw },
    { type: 'CLEAR_CACHE', label: 'Limpar Cache', icon: Trash2, variant: 'secondary' },
    { type: 'CAPTURE_SCREENSHOT', label: 'Capturar Tela', icon: Camera },
    { type: 'RUN_DIAGNOSTIC', label: 'Auto-diagnóstico', icon: Stethoscope },
    { type: 'UPDATE_PLAYER', label: 'Atualizar Player', icon: Smartphone, variant: 'secondary' },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-display font-semibold text-white mb-4">Painel de Comandos (Mock)</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {commands.map((cmd) => (
          <Button
            key={cmd.type}
            variant={cmd.variant || 'primary'}
            isLoading={isSending}
            onClick={() => handleCommand(cmd.type, cmd.label)}
            className="w-full justify-start"
          >
            <cmd.icon className="w-4 h-4 mr-2" />
            {cmd.label}
          </Button>
        ))}
      </div>
    </Card>
  );
};
