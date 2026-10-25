import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Device } from '../../../types/devices';
import { Card } from '../../../components/ui/Card';
import {
  Cpu, HardDrive, MemoryStick, ThermometerSun, Activity, Wifi,
  Terminal, Radio, ArrowUp, Circle, Zap, RefreshCw, CheckCircle2, Clock
} from 'lucide-react';
import io from 'socket.io-client';
import { getSocketServerUrl } from '../../../config/api';

interface DeviceTelemetryTabProps {
  device: Device;
}

interface TelemetryEvent {
  id: string;
  type: 'heartbeat' | 'command' | 'event' | 'error' | 'metric' | 'connection';
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
  metric: { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: <Activity className="w-3 h-3" /> },
  connection: { color: 'text-slate-400', bg: 'bg-slate-500/10', icon: <Wifi className="w-3 h-3" /> },
};

export const DeviceTelemetryTab: React.FC<DeviceTelemetryTabProps> = ({ device }) => {
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<any>(null);
  const [telemetryEvents, setTelemetryEvents] = useState<TelemetryEvent[]>([]);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const telemetryEndRef = useRef<HTMLDivElement>(null);
  const eventIdCounter = useRef(0);

  const [metrics, setMetrics] = useState({
    cpuUsage: device.cpuUsage || 24,
    memoryUsed: device.memoryUsed || 1.2,
    memoryTotal: device.memoryTotal || 2.0,
    storageUsed: device.storageUsed || 14.2,
    storageTotal: device.storageTotal || 32.0,
    temperature: device.temperature || 38.5,
  });

  const addTelemetryEvent = useCallback((evt: Omit<TelemetryEvent, 'id' | 'timestamp'>) => {
    const newEvt: TelemetryEvent = {
      ...evt,
      id: `evt-${++eventIdCounter.current}`,
      timestamp: new Date().toISOString(),
    };
    setTelemetryEvents(prev => {
      const updated = [...prev, newEvt];
      return updated.slice(-100);
    });
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (isAutoScroll && telemetryEndRef.current) {
      telemetryEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [telemetryEvents, isAutoScroll]);

  // Socket.IO real-time connection
  useEffect(() => {
    const socketEndpoint = getSocketServerUrl();
    const socket = io(socketEndpoint, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      addTelemetryEvent({
        type: 'connection', direction: 'in',
        label: 'Socket.IO Conectado',
        detail: `ID: ${socket.id} · Servidor ${socketEndpoint}`,
        severity: 'ok',
      });
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
      addTelemetryEvent({
        type: 'connection', direction: 'in',
        label: 'Socket.IO Desconectado',
        detail: 'Conexão em tempo real interrompida. Re-tentando...',
        severity: 'warn',
      });
    });

    socket.on('device:heartbeat', (data: any) => {
      if (data?.displayId === device.id || data?.displayId === device.displayId) {
        addTelemetryEvent({
          type: 'heartbeat', direction: 'in',
          label: 'Heartbeat Recebido',
          detail: `CPU: ${data.cpu || 25}% · RAM: ${data.ram || '1.2/2.0'}GB · Temp: ${data.temp || 38}°C`,
          severity: 'ok',
        });
        if (data.cpu) {
          setMetrics(prev => ({ ...prev, cpuUsage: data.cpu, temperature: data.temp || prev.temperature }));
        }
      }
    });

    socket.on('device:command_result', (data: any) => {
      addTelemetryEvent({
        type: 'command', direction: 'in',
        label: `Resposta de Comando: ${data.command || 'OK'}`,
        detail: data.message || JSON.stringify(data.result || {}),
        severity: data.success === false ? 'error' : 'ok',
      });
    });

    socket.on('device:event', (data: any) => {
      addTelemetryEvent({
        type: 'event', direction: 'in',
        label: `Evento: ${data.name || 'Notificação'}`,
        detail: data.detail || JSON.stringify(data),
        severity: 'ok',
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [device.id, device.displayId, addTelemetryEvent]);

  // Periodic metric polling
  useEffect(() => {
    const targetId = device.id || device.displayId || device.deviceCode;
    const pollMetrics = async () => {
      try {
        const res = await fetch(`/api/devices/${targetId}/heartbeat`);
        if (res.ok) {
          const data = await res.json();
          setMetrics(prev => ({
            ...prev,
            cpuUsage: data.cpuUsage || prev.cpuUsage,
            memoryUsed: data.memoryUsed || prev.memoryUsed,
            memoryTotal: data.memoryTotal || prev.memoryTotal,
            storageUsed: data.storageUsed || prev.storageUsed,
            storageTotal: data.storageTotal || prev.storageTotal,
            temperature: data.temperature || prev.temperature,
          }));
          addTelemetryEvent({
            type: 'metric', direction: 'in',
            label: 'Métricas de Telemetria Atualizadas',
            detail: `CPU: ${data.cpuUsage}% · Temp: ${data.temperature}°C · Status: ${data.status}`,
            severity: 'ok',
          });
        }
      } catch (err) {}
    };

    pollMetrics();
    const iv = setInterval(pollMetrics, 10000);
    return () => clearInterval(iv);
  }, [device.id, device.displayId, device.deviceCode, addTelemetryEvent]);

  // Send Direct Commands
  const sendDeviceCommand = async (commandName: string) => {
    const targetId = device.id || device.displayId || device.deviceCode;
    const cmdLabels: Record<string, string> = {
      ping: 'Ping (Conectividade)',
      restart_player: 'Reiniciar Player Nexora',
      sync_content: 'Sincronizar Conteúdo',
      get_metrics: 'Obter Métricas Hardware',
      screenshot: 'Capturar Screenshot',
      reboot: 'Reiniciar Dispositivo (Reboot)',
    };

    const label = cmdLabels[commandName] || commandName;
    addTelemetryEvent({
      type: 'command', direction: 'out',
      label: `Enviando Comando: ${label}`,
      detail: `Target: ${targetId} · Via HTTP POST /api/devices/${targetId}/command`,
      severity: 'ok',
    });

    try {
      const res = await fetch(`/api/devices/${targetId}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: commandName, payload: { timestamp: Date.now() } }),
      });
      const data = await res.json();

      addTelemetryEvent({
        type: 'command', direction: 'in',
        label: `Resposta do Servidor: ${label}`,
        detail: data.message || 'Comando enviado com sucesso.',
        severity: res.ok ? 'ok' : 'error',
      });
    } catch (err: any) {
      addTelemetryEvent({
        type: 'error', direction: 'in',
        label: `Erro ao enviar comando: ${label}`,
        detail: err.message || 'Falha de comunicação',
        severity: 'error',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-time Hardware Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-cyan-400">
              <Cpu className="w-5 h-5" />
              <span className="font-medium text-slate-300 text-sm">Uso de CPU</span>
            </div>
            <span className={`font-semibold text-sm ${metrics.cpuUsage > 80 ? 'text-red-400' : 'text-white'}`}>
              {metrics.cpuUsage}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${metrics.cpuUsage > 80 ? 'bg-red-500' : 'bg-cyan-500'}`}
              style={{ width: `${Math.min(100, metrics.cpuUsage)}%` }}
            />
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-purple-400">
              <MemoryStick className="w-5 h-5" />
              <span className="font-medium text-slate-300 text-sm">Memória RAM</span>
            </div>
            <span className="font-semibold text-sm text-white">
              {metrics.memoryUsed} / {metrics.memoryTotal} GB
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-purple-500 transition-all duration-500"
              style={{ width: `${(metrics.memoryUsed / metrics.memoryTotal) * 100}%` }}
            />
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-blue-400">
              <HardDrive className="w-5 h-5" />
              <span className="font-medium text-slate-300 text-sm">Armazenamento</span>
            </div>
            <span className="font-semibold text-sm text-white">
              {metrics.storageUsed} / {metrics.storageTotal} GB
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${(metrics.storageUsed / metrics.storageTotal) * 100}%` }}
            />
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-amber-400">
              <ThermometerSun className="w-5 h-5" />
              <span className="font-medium text-slate-300 text-sm">Temperatura</span>
            </div>
            <span className={`font-semibold text-sm ${metrics.temperature > 70 ? 'text-red-400' : 'text-white'}`}>
              {metrics.temperature} °C
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${metrics.temperature > 70 ? 'bg-red-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, (metrics.temperature / 100) * 100)}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Main Telemetry & Direct Commands Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Telemetria em Tempo Real</h3>
              <p className="text-xs text-slate-400">
                Log ao vivo de comunicações, eventos e comandos do dispositivo · Conectado via Socket.IO
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${socketConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              {socketConnected ? 'Socket.IO Conectado' : 'Desconectado'}
            </span>
            <span className="text-xs text-slate-500 bg-slate-800/60 border border-slate-700/50 px-3 py-1 rounded-full">
              {telemetryEvents.length} eventos
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Live Event Log */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden border-slate-800/80 bg-slate-950/80">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-white">Log de Eventos ao Vivo</span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    AO VIVO
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAutoScroll(prev => !prev)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors ${isAutoScroll ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                  >
                    Auto-Scroll {isAutoScroll ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => setTelemetryEvents([])}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
                  >
                    Limpar
                  </button>
                </div>
              </div>
              <div className="h-80 overflow-y-auto bg-[#070B14] font-mono text-[11px] p-2">
                {telemetryEvents.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-600 gap-2">
                    <Activity className="w-4 h-4" />
                    <span>Aguardando eventos do dispositivo...</span>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {telemetryEvents.map(evt => {
                      const cfg = EVENT_TYPE_CONFIG[evt.type] || EVENT_TYPE_CONFIG.event;
                      const time = new Date(evt.timestamp).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      return (
                        <div key={evt.id} className="flex items-start gap-2 py-1 px-2 rounded hover:bg-white/[0.03] transition-colors">
                          <span className="text-slate-600 flex-shrink-0 w-20 text-[10px] pt-0.5">{time}</span>
                          <span className={`flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${cfg.bg} ${cfg.color}`}>
                            {cfg.icon}
                            {evt.type}
                          </span>
                          <span className={`flex-shrink-0 ${evt.direction === 'in' ? 'text-cyan-400' : 'text-amber-400'}`}>
                            {evt.direction === 'in' ? '←' : '→'}
                          </span>
                          <span className={`font-semibold ${evt.severity === 'error' ? 'text-red-400' : evt.severity === 'warn' ? 'text-amber-400' : 'text-slate-200'}`}>
                            {evt.label}
                          </span>
                          <span className="text-slate-500 truncate">{evt.detail}</span>
                        </div>
                      );
                    })}
                    <div ref={telemetryEndRef} />
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Direct Device Commands Panel */}
          <div>
            <Card className="overflow-hidden border-slate-800/80 bg-slate-950/80 h-full">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/90 border-b border-slate-800">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-white">Comunicação com Device</span>
              </div>
              <div className="p-4 space-y-2">
                <p className="text-[10px] text-slate-400 mb-3">
                  Envie comandos diretamente à TV Box. Respostas são exibidas instantaneamente na telemetria.
                </p>
                {[
                  { cmd: 'ping', label: 'Ping', desc: 'Verificar conectividade com o terminal', color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10' },
                  { cmd: 'restart_player', label: 'Restart Player', desc: 'Reiniciar a aplicação Nexora Player', color: 'text-amber-400 border-amber-500/30 hover:bg-amber-500/10' },
                  { cmd: 'sync_content', label: 'Sync Conteúdo', desc: 'Forçar sincronização de mídia', color: 'text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10' },
                  { cmd: 'get_metrics', label: 'Obter Métricas', desc: 'Solicitar leitura de CPU/RAM/Temp', color: 'text-blue-400 border-blue-500/30 hover:bg-blue-500/10' },
                  { cmd: 'screenshot', label: 'Screenshot', desc: 'Solicitar captura de tela ao vivo', color: 'text-purple-400 border-purple-500/30 hover:bg-purple-500/10' },
                  { cmd: 'reboot', label: 'Reiniciar Device', desc: 'Reboot completo da TV Box', color: 'text-red-400 border-red-500/30 hover:bg-red-500/10' },
                ].map(({ cmd, label, desc, color }) => (
                  <button
                    key={cmd}
                    onClick={() => sendDeviceCommand(cmd)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl border bg-slate-900/80 transition-all text-xs font-semibold flex items-center justify-between group cursor-pointer ${color}`}
                  >
                    <div>
                      <p>{label}</p>
                      <p className="text-[10px] text-slate-500 font-normal mt-0.5">{desc}</p>
                    </div>
                    <ArrowUp className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity rotate-45" />
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
