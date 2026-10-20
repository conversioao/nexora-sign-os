import React, { useState } from 'react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Tabs } from '../../../components/ui/Tabs';
import { useDevice } from '../hooks/useDevices';
import { DeviceStatusBadge } from '../components/DeviceStatusBadge';
import { DeviceOverviewTab } from '../components/DeviceOverviewTab';
import { DeviceTelemetryTab } from '../components/DeviceTelemetryTab';
import { Activity, HeartPulse, History, Clock } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

export const DeviceDetailPage: React.FC<{ deviceId: string; onBack: () => void }> = ({ deviceId, onBack }) => {
  const { device, isLoading } = useDevice(deviceId);
  const [activeTab, setActiveTab] = useState('telemetry');

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400 animate-pulse">Carregando dados do dispositivo...</div>;
  }

  if (!device) {
    return <div className="p-8 text-center text-rose-400">Dispositivo não encontrado.</div>;
  }

  const tabs = [
    { id: 'telemetry', label: 'Telemetria', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'health', label: 'Saúde & Diagnóstico', icon: <HeartPulse className="w-3.5 h-3.5" /> },
    { id: 'history', label: 'Histórico', icon: <History className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title={device.deviceCode || device.model || `Terminal ${deviceId}`} 
        description={`${device.model || 'Android TV Box'} • ${device.assignedLocation || 'Luanda'} • SN: ${device.serialNumber}`}
        onBack={onBack}
      >
        <DeviceStatusBadge status={device.status} />
      </PageHeader>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === 'telemetry' && <DeviceTelemetryTab device={device} />}
        
        {activeTab === 'health' && <DeviceOverviewTab device={device} />}
        
        {activeTab === 'history' && (
          <Card className="p-6">
            <h4 className="text-md font-medium text-white mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              Histórico de Atividades & Registos do Dispositivo
            </h4>
            <div className="space-y-3">
              {[
                { time: 'Hoje, 16:40', text: 'Telemetria enviada via Socket.IO - Status: ONLINE', type: 'ONLINE' },
                { time: 'Hoje, 14:15', text: 'Sincronização de programação concluída com sucesso', type: 'SYNC' },
                { time: 'Hoje, 09:00', text: 'Dispositivo iniciado e registrado no servidor Nexora', type: 'BOOT' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                  <div className="flex items-center gap-3">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-300">{item.text}</span>
                  </div>
                  <span className="text-slate-500 text-[11px]">{item.time}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
