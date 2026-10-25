import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Device } from '../../../types/devices';
import { Card } from '../../../components/ui/Card';
import { DeviceStatusBadge, ConnectionStatusBadge } from './DeviceStatusBadge';
import {
  Cpu, HardDrive, MemoryStick, ThermometerSun, Activity, Clock, Server,
  Monitor, Camera, RefreshCw, Eye, Wifi, WifiOff, ImageIcon, Zap,
  Terminal, Radio, ArrowUpDown, ArrowDown, ArrowUp, Circle
} from 'lucide-react';
import { heartbeatService } from '../../../services/deviceService';
import io from 'socket.io-client';
import { getSocketServerUrl } from '../../../config/api';

interface DeviceOverviewTabProps {
  device: Device;
}

interface TelemetryEvent {
  id: string;
  type: 'heartbeat' | 'command' | 'event' | 'error' | 'snapshot' | 'metric' | 'connection';
  direction: 'in' | 'out';
  label: string;
  detail: string;
  timestamp: string;
  severity?: 'ok' | 'warn' | 'error';
}

const EVENT_TYPE_CONFIG = {
  heartbeat: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: <Radio className="w-3 h-3" /> },
  command: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', icon: <Terminal className="w-3 h-3" /> },
  event: { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: <Zap className="w-3 h-3" /> },
  error: { color: 'text-red-400', bg: 'bg-red-500/10', icon: <Circle className="w-3 h-3" /> },
  snapshot: { color: 'text-purple-400', bg: 'bg-purple-500/10', icon: <Camera className="w-3 h-3" /> },
  metric: { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: <Activity className="w-3 h-3" /> },
  connection: { color: 'text-slate-400', bg: 'bg-slate-500/10', icon: <Wifi className="w-3 h-3" /> },
};

export const DeviceOverviewTab: React.FC<DeviceOverviewTabProps> = ({ device }) => {
  const offlineDuration = heartbeatService.getOfflineDuration(device.lastHeartbeatAt);
  const isOffline = offlineDuration > 60; // > 60s
  
  const [liveFrame, setLiveFrame] = useState<{ snapshotBase64: string; adTitle: string; timestamp: string } | null>(null);
  const [loadingWebcam, setLoadingWebcam] = useState(true);
  const [frameCount, setFrameCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<any>(null);

  // Real-time telemetry event log
  const [telemetryEvents, setTelemetryEvents] = useState<TelemetryEvent[]>([]);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const telemetryEndRef = useRef<HTMLDivElement>(null);
  const eventIdCounter = useRef(0);

  const addTelemetryEvent = useCallback((evt: Omit<TelemetryEvent, 'id' | 'timestamp'>) => {
    const newEvt: TelemetryEvent = {
      ...evt,
      id: `evt-${++eventIdCounter.current}`,
      timestamp: new Date().toISOString(),
    };
    setTelemetryEvents(prev => {
      const updated = [...prev, newEvt];
      return updated.slice(-100); // keep last 100 events
    });
  }, []);

  // All possible IDs for this device (display_id from DB)
  const possibleIds = [device.id, device.displayId, device.deviceCode].filter(Boolean) as string[];

  const fetchLatestFrame = useCallback(async () => {
    // Try all possible IDs to find snapshots
    for (const targetId of possibleIds) {
      try {
        const res = await fetch(`/api/audit/snapshots/${targetId}?limit=1`);
        if (res.ok) {
          const data = await res.json();
          if (data.snapshots && data.snapshots.length > 0) {
            setLiveFrame(data.snapshots[0]);
            setFrameCount(prev => prev + 1);
            setLastError(null);
            setLoadingWebcam(false);
            addTelemetryEvent({ type: 'snapshot', direction: 'in', label: 'Snapshot Recebido', detail: `Frame capturado via API · ID: ${targetId}`, severity: 'ok' });
            return;
          }
        }
      } catch (err: any) {
        setLastError(err.message || 'Erro de rede');
        addTelemetryEvent({ type: 'error', direction: 'in', label: 'Falha ao buscar snapshot', detail: err.message || 'Erro de rede', severity: 'error' });
      }
    }
    setLoadingWebcam(false);
  }, [possibleIds.join(',')]);


  // Socket.IO: Listen for real-time events and telemetry
  useEffect(() => {
    const socketEndpoint = getSocketServerUrl();
    const socket = io(socketEndpoint, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      addTelemetryEvent({ type: 'connection', direction: 'in', label: 'Socket.IO Conectado', detail: `ID: ${socket.id || 'n/a'} · Servidor ${socketEndpoint}`, severity: 'ok' });
    });

    socket.on('disconnect', (reason: string) => {
      setSocketConnected(false);
      addTelemetryEvent({ type: 'connection', direction: 'in', label: 'Socket.IO Desconectado', detail: `Motivo: ${reason}`, severity: 'warn' });
    });

    // Heartbeat events from device
    socket.on('device:heartbeat', (data: any) => {
      const devId = (data.deviceId || data.displayId || '').toLowerCase();
      const isMatch = possibleIds.some(id => devId.includes(id.toLowerCase()) || id.toLowerCase().includes(devId));
      if (isMatch || possibleIds.length === 0) {
        addTelemetryEvent({
          type: 'heartbeat', direction: 'in',
          label: 'Heartbeat Recebido',
          detail: `CPU: ${data.cpuUsage ?? '?'}% · RAM: ${data.memoryUsed ?? '?'}/${data.memoryTotal ?? '?'}GB · Temp: ${data.temperature ?? '?'}°C`,
          severity: 'ok'
        });
      }
    });

    // Command responses
    socket.on('device:command_result', (data: any) => {
      const devId = (data.deviceId || data.displayId || '').toLowerCase();
      const isMatch = possibleIds.some(id => devId.includes(id.toLowerCase()) || id.toLowerCase().includes(devId));
      if (isMatch || possibleIds.length === 0) {
        addTelemetryEvent({
          type: 'command', direction: 'in',
          label: `Resposta: ${data.command || 'Comando'}`,
          detail: data.result || data.message || 'OK',
          severity: data.success ? 'ok' : 'error'
        });
      }
    });

    // Generic device events
    socket.on('device:event', (data: any) => {
      const devId = (data.deviceId || data.displayId || '').toLowerCase();
      const isMatch = possibleIds.some(id => devId.includes(id.toLowerCase()) || id.toLowerCase().includes(devId));
      if (isMatch || possibleIds.length === 0) {
        addTelemetryEvent({
          type: 'event', direction: 'in',
          label: data.event || 'Evento do Dispositivo',
          detail: JSON.stringify(data.payload || data).slice(0, 120),
          severity: data.severity || 'ok'
        });
      }
    });

    // Metric updates
    socket.on('device:metrics', (data: any) => {
      const devId = (data.deviceId || data.displayId || '').toLowerCase();
      const isMatch = possibleIds.some(id => devId.includes(id.toLowerCase()) || id.toLowerCase().includes(devId));
      if (isMatch || possibleIds.length === 0) {
        addTelemetryEvent({
          type: 'metric', direction: 'in',
          label: 'Métricas Atualizadas',
          detail: `CPU: ${data.cpuUsage ?? '?'}% · RAM: ${data.memoryUsed ?? '?'}GB · Storage: ${data.storageUsed ?? '?'}GB`,
          severity: 'ok'
        });
      }
    });

    const handleIncomingFrame = (snapshot: any) => {
      if (!snapshot || !snapshot.snapshotBase64) return;

      const incomingId = (snapshot.displayId || '').toLowerCase().trim();
      const isMatch = possibleIds.some(id => {
        const normId = id.toLowerCase().trim();
        return (
          normId === incomingId ||
          incomingId.includes(normId) ||
          normId.includes(incomingId) ||
          normId.replace(/^(dsp-|dev-)/, '') === incomingId.replace(/^(dsp-|dev-)/, '')
        );
      });

      if (isMatch || possibleIds.length === 0) {
        setLiveFrame({
          snapshotBase64: snapshot.snapshotBase64,
          adTitle: snapshot.adTitle || 'Câmera ao Vivo',
          timestamp: snapshot.timestamp || new Date().toISOString(),
        });
        setFrameCount(prev => prev + 1);
        setLoadingWebcam(false);
        setLastError(null);
        addTelemetryEvent({
          type: 'snapshot', direction: 'in',
          label: 'Frame de Câmera Recebido',
          detail: `Ad: ${snapshot.adTitle || 'N/A'} · Via Socket.IO`,
          severity: 'ok'
        });
      }
    };

    // Real-time snapshot/frame from TV Box
    socket.on('audit:new_snapshot', handleIncomingFrame);
    socket.on('camera:frame', handleIncomingFrame);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [possibleIds.join(',')]);

  // Polling fallback (every 3s)
  useEffect(() => {
    fetchLatestFrame();
    const interval = setInterval(fetchLatestFrame, 3000);
    return () => clearInterval(interval);
  }, [fetchLatestFrame]);

  // Auto-scroll telemetry log
  useEffect(() => {
    if (isAutoScroll && telemetryEndRef.current) {
      telemetryEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [telemetryEvents, isAutoScroll]);

  // Periodic metric simulation from device (real heartbeat poll every 5s)
  useEffect(() => {
    const pollMetrics = async () => {
      try {
        const res = await fetch(`/api/devices/${device.id}/heartbeat`);
        if (res.ok) {
          const data = await res.json();
          addTelemetryEvent({
            type: 'metric', direction: 'in',
            label: 'Métricas Recebidas (Poll)',
            detail: `CPU: ${data.cpuUsage ?? device.cpuUsage ?? '?'}% · RAM: ${data.memoryUsed ?? device.memoryUsed ?? '?'}GB · Temp: ${data.temperature ?? device.temperature ?? '?'}°C`,
            severity: 'ok'
          });
        }
      } catch {
        // Server may not have this endpoint - just log current device values
        addTelemetryEvent({
          type: 'heartbeat', direction: 'in',
          label: 'Heartbeat Local',
          detail: `CPU: ${device.cpuUsage ?? '?'}% · RAM: ${device.memoryUsed ?? '?'}/${device.memoryTotal ?? '?'}GB · Temp: ${device.temperature ?? '?'}°C`,
          severity: (device.cpuUsage ?? 0) > 85 ? 'warn' : 'ok'
        });
      }
    };

    // Initial event
    addTelemetryEvent({
      type: 'connection', direction: 'in',
      label: 'Painel de Telemetria Iniciado',
      detail: `Device: ${device.deviceCode || device.id} · IP: ${device.ipAddress || 'N/A'}`,
      severity: 'ok'
    });

    pollMetrics();
    const iv = setInterval(pollMetrics, 5000);
    return () => clearInterval(iv);
  }, [device.id]);

  // Send command helper
  const sendDeviceCommand = async (command: string, payload?: any) => {
    addTelemetryEvent({
      type: 'command', direction: 'out',
      label: `Comando Enviado: ${command}`,
      detail: payload ? JSON.stringify(payload).slice(0, 100) : 'Sem payload',
      severity: 'ok'
    });
    try {
      const res = await fetch(`/api/devices/${device.id}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, payload }),
      });
      const data = await res.json();
      addTelemetryEvent({
        type: 'command', direction: 'in',
        label: `Resposta: ${command}`,
        detail: data.message || data.result || (res.ok ? 'Sucesso' : 'Falhou'),
        severity: res.ok ? 'ok' : 'error'
      });
    } catch (err: any) {
      addTelemetryEvent({
        type: 'error', direction: 'in',
        label: `Erro no Comando: ${command}`,
        detail: err.message || 'Falha na comunicação',
        severity: 'error'
      });
    }
  };


  // Stream configuration
  const defaultIp = (device as any).specs?.ip || device.ipAddress || '192.168.0.105';
  const [streamMode, setStreamMode] = useState<'STREAM' | 'SNAPSHOTS'>('SNAPSHOTS');
  const [streamUrl, setStreamUrl] = useState<string>(`http://${defaultIp}:8080/video`);
  const [useProxy, setUseProxy] = useState<boolean>(true);
  const [isStreamTesting, setIsStreamTesting] = useState(false);
  const [streamTestResult, setStreamTestResult] = useState<{ reachable: boolean; message: string } | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [streamActive, setStreamActive] = useState(false);

  // Compute final stream URL
  const activeStreamSrc = useProxy 
    ? `/api/audit/proxy-stream?url=${encodeURIComponent(streamUrl)}`
    : streamUrl;

  const testStreamConnection = async () => {
    setIsStreamTesting(true);
    setStreamTestResult(null);
    try {
      const res = await fetch(`/api/audit/test-stream?url=${encodeURIComponent(streamUrl)}`);
      const data = await res.json();
      if (data.reachable) {
        setStreamTestResult({ reachable: true, message: `Conectado com sucesso! (Status HTTP ${data.status})` });
        setStreamActive(true);
      } else {
        setStreamTestResult({ reachable: false, message: `Falha ao conectar: ${data.error || 'Porta fechada na TV Box'}` });
      }
    } catch (e: any) {
      setStreamTestResult({ reachable: false, message: `Erro ao testar: ${e.message}` });
    } finally {
      setIsStreamTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">Status do Dispositivo</p>
            <DeviceStatusBadge status={device.status} />
          </div>
          <Activity className="w-8 h-8 text-slate-600" />
        </Card>
        
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">Conectividade</p>
            <ConnectionStatusBadge status={device.connectionStatus} />
          </div>
          <Server className="w-8 h-8 text-slate-600" />
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">Último Heartbeat</p>
            <p className="text-lg font-semibold text-white">
              {device.lastHeartbeatAt ? new Date(device.lastHeartbeatAt).toLocaleTimeString() : 'N/A'}
            </p>
            {isOffline && (
              <p className="text-xs text-rose-400 mt-1">
                Offline há {Math.floor(offlineDuration / 60)} min
              </p>
            )}
          </div>
          <Clock className="w-8 h-8 text-slate-600" />
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">Display Associado</p>
            <p className="text-lg font-semibold text-white">
              {device.displayId || 'Não associado'}
            </p>
          </div>
          <Monitor className="w-8 h-8 text-slate-600" />
        </Card>
      </div>



      <h3 className="text-lg font-display font-semibold text-white mt-4 mb-4">Saúde do Hardware</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-nexora-cyan" />
              <span className="font-medium text-slate-300">CPU</span>
            </div>
            <span className={`font-semibold ${device.cpuUsage > 80 ? 'text-rose-400' : 'text-white'}`}>
              {device.cpuUsage}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${device.cpuUsage > 80 ? 'bg-rose-500' : 'bg-nexora-cyan'}`} 
              style={{ width: `${device.cpuUsage}%` }}
            ></div>
          </div>
        </Card>

        {/* RAM */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MemoryStick className="w-5 h-5 text-nexora-purple" />
              <span className="font-medium text-slate-300">Memória (RAM)</span>
            </div>
            <span className={`font-semibold ${device.memoryUsed / device.memoryTotal > 0.8 ? 'text-rose-400' : 'text-white'}`}>
              {device.memoryUsed} / {device.memoryTotal} GB
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${(device.memoryUsed / device.memoryTotal) > 0.8 ? 'bg-rose-500' : 'bg-nexora-purple'}`} 
              style={{ width: `${(device.memoryUsed / device.memoryTotal) * 100}%` }}
            ></div>
          </div>
        </Card>

        {/* Storage */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-nexora-blue" />
              <span className="font-medium text-slate-300">Armazenamento</span>
            </div>
            <span className={`font-semibold ${device.storageUsed / device.storageTotal > 0.9 ? 'text-rose-400' : 'text-white'}`}>
              {device.storageUsed} / {device.storageTotal} GB
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${(device.storageUsed / device.storageTotal) > 0.9 ? 'bg-rose-500' : 'bg-nexora-blue'}`} 
              style={{ width: `${(device.storageUsed / device.storageTotal) * 100}%` }}
            ></div>
          </div>
        </Card>

        {/* Temp */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ThermometerSun className="w-5 h-5 text-amber-500" />
              <span className="font-medium text-slate-300">Temperatura</span>
            </div>
            <span className={`font-semibold ${device.temperature > 70 ? 'text-rose-400' : 'text-white'}`}>
              {device.temperature} °C
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${device.temperature > 70 ? 'bg-rose-500' : 'bg-amber-500'}`} 
              style={{ width: `${Math.min(100, (device.temperature / 100) * 100)}%` }}
            ></div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="p-6">
          <h4 className="text-md font-medium text-white mb-4 border-b border-slate-800 pb-2">Informações do Sistema</h4>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            <div>
              <dt className="text-slate-400">Fabricante</dt>
              <dd className="font-medium text-slate-200">{device.manufacturer}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Modelo</dt>
              <dd className="font-medium text-slate-200">{device.model}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Número de Série</dt>
              <dd className="font-medium text-slate-200">{device.serialNumber}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Versão do Android</dt>
              <dd className="font-medium text-slate-200">{device.androidVersion}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Versão do Player</dt>
              <dd className="font-medium text-slate-200">{device.playerVersion}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Firmware</dt>
              <dd className="font-medium text-slate-200">{device.firmwareVersion}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <h4 className="text-md font-medium text-white mb-4 border-b border-slate-800 pb-2">Informações de Rede</h4>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            <div>
              <dt className="text-slate-400">Endereço IP</dt>
              <dd className="font-medium text-slate-200">{device.ipAddress}</dd>
            </div>
            <div>
              <dt className="text-slate-400">MAC Address</dt>
              <dd className="font-medium text-slate-200 font-mono text-xs mt-1">{device.macAddress}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Última Sincronização</dt>
              <dd className="font-medium text-slate-200">{device.lastSyncAt ? new Date(device.lastSyncAt).toLocaleString() : 'N/A'}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
};
