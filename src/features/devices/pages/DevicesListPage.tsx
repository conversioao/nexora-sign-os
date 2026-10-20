import React, { useState } from 'react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Search, Filter, MonitorSmartphone } from 'lucide-react';
import { useDevices } from '../hooks/useDevices';
import { DeviceStatusBadge, ConnectionStatusBadge } from '../components/DeviceStatusBadge';

export const DevicesListPage: React.FC<{ onNavigateToDetail: (id: string) => void }> = ({ onNavigateToDetail }) => {
  const { devices, isLoading } = useDevices();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDevices = devices.filter(d => 
    d.deviceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Device Management" 
        description="Gestão de hardware, players Android e telemetria."
      >
        <Button variant="primary">
          <MonitorSmartphone className="w-4 h-4 mr-2" />
          Registrar Device
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div className="w-full sm:w-96">
          <Input
            placeholder="Pesquisar por ID, modelo ou serial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
        <Button variant="secondary">
          <Filter className="w-4 h-4 mr-2" />
          Filtros Avançados
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <p className="text-slate-400">Carregando devices...</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>Display</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Conexão</TableHead>
              <TableHead>Player</TableHead>
              <TableHead>Heartbeat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDevices.map(row => (
              <TableRow 
                key={row.id} 
                onClick={() => onNavigateToDetail(row.id)}
                className="cursor-pointer"
              >
                <TableCell>
                  <div>
                    <p className="font-medium text-white">{row.deviceCode}</p>
                    <p className="text-xs text-slate-400">{row.model} ({row.deviceType})</p>
                  </div>
                </TableCell>
                <TableCell>{row.displayId || <span className="text-slate-500">Nenhum</span>}</TableCell>
                <TableCell><DeviceStatusBadge status={row.status} /></TableCell>
                <TableCell><ConnectionStatusBadge status={row.connectionStatus} /></TableCell>
                <TableCell><span className="font-mono text-xs">v{row.playerVersion}</span></TableCell>
                <TableCell>{row.lastHeartbeatAt ? new Date(row.lastHeartbeatAt).toLocaleTimeString() : 'N/A'}</TableCell>
              </TableRow>
            ))}
            {filteredDevices.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                  Nenhum device encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
