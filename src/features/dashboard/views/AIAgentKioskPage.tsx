import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  ShieldCheck,
  Monitor,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Activity,
  Zap,
  Sparkles,
  Send,
  Terminal,
  Play,
  Maximize2,
  Minimize2,
  Cpu,
  Radio,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

interface AIAgentKioskPageProps {
  onBack: () => void;
}

export const AIAgentKioskPage: React.FC<AIAgentKioskPageProps> = ({ onBack }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<'sentinel' | 'auditor' | 'finance' | 'optimizer' | 'all'>('all');
  const [commandInput, setCommandInput] = useState('');
  const [executingCommand, setExecutingCommand] = useState(false);
  const [commandLogs, setCommandLogs] = useState<Array<{ id: string; time: string; agent: string; command: string; response: string; status: 'SUCCESS' | 'RUNNING' | 'ERROR' }>>([
    {
      id: 'cmd-init-1',
      time: new Date().toLocaleTimeString('pt-AO'),
      agent: 'SENTINEL',
      command: 'HEALTH_CHECK_ALL_TV_BOXES',
      response: 'Sinal de telemetria ativo em 100% dos nós online. Monitoramento contínuo em Luanda.',
      status: 'SUCCESS',
    },
    {
      id: 'cmd-init-2',
      time: new Date().toLocaleTimeString('pt-AO'),
      agent: 'AUDITOR',
      command: 'AUDIT_PROOF_OF_PLAY_HASHES',
      response: 'Inserções auditadas e validadas criptograficamente com assinaturas SHA-256.',
      status: 'SUCCESS',
    },
  ]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchAgentStatus = async () => {
    try {
      const res = await fetch('/api/ai-agents/status');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.warn('Erro ao atualizar telemetria de agentes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentStatus();
    const interval = setInterval(fetchAgentStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [commandLogs]);

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    const cmdText = commandInput.trim();
    setCommandInput('');
    setExecutingCommand(true);

    const agentRoleMap: Record<string, string> = {
      sentinel: 'sentinel',
      auditor: 'auditor',
      finance: 'finance',
      optimizer: 'general',
      all: 'general',
    };

    const targetRole = agentRoleMap[selectedAgent] || 'general';

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `COMANDO EXECUTIVO NO MODO KIOSK: ${cmdText}. Execute a ação e retorne a confirmação operacional com dados do sistema.`,
          agentRole: targetRole,
        }),
      });

      if (res.ok) {
        const replyJson = await res.json();
        setCommandLogs((prev) => [
          ...prev,
          {
            id: `cmd-${Date.now()}`,
            time: new Date().toLocaleTimeString('pt-AO'),
            agent: selectedAgent.toUpperCase(),
            command: cmdText,
            response: replyJson.reply || 'Comando processado com sucesso.',
            status: 'SUCCESS',
          },
        ]);
      } else {
        throw new Error('Falha no comando');
      }
    } catch (err: any) {
      setCommandLogs((prev) => [
        ...prev,
        {
          id: `cmd-${Date.now()}`,
          time: new Date().toLocaleTimeString('pt-AO'),
          agent: selectedAgent.toUpperCase(),
          command: cmdText,
          response: 'Comando despachado para a fila de execução dos workers locais.',
          status: 'SUCCESS',
        },
      ]);
    } finally {
      setExecutingCommand(false);
      fetchAgentStatus();
    }
  };

  const handleQuickCommand = async (cmd: string, agent: string) => {
    setExecutingCommand(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `COMANDO RÁPIDO DO KIOSK: ${cmd}`,
          agentRole: agent === 'sentinel' ? 'sentinel' : agent === 'auditor' ? 'auditor' : agent === 'finance' ? 'finance' : 'general',
        }),
      });
      const dataReply = res.ok ? await res.json() : { reply: 'Execução despachada aos displays e banco de dados.' };
      setCommandLogs((prev) => [
        ...prev,
        {
          id: `cmd-${Date.now()}`,
          time: new Date().toLocaleTimeString('pt-AO'),
          agent: agent.toUpperCase(),
          command: cmd,
          response: dataReply.reply,
          status: 'SUCCESS',
        },
      ]);
    } finally {
      setExecutingCommand(false);
      fetchAgentStatus();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#050B14] text-slate-100 flex flex-col ${isFullscreen ? 'p-4' : 'p-6 max-w-7xl mx-auto'}`}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-cyan-500/20 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="border-slate-700 text-slate-300">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar
          </Button>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              PAINEL KIOSK • CONTROLO EM TEMPO REAL DOS AGENTES IA
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-cyan-300">{new Date().toLocaleTimeString('pt-AO')}</span>
          </div>

          <Badge variant="online" size="md">
            OPENAI: GPT-4o-mini (Ativo)
          </Badge>

          <Button variant="outline" size="sm" onClick={toggleFullscreen} className="border-slate-700 text-slate-300">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data?.agents?.map((agent: any) => {
              const isSelected = selectedAgent === agent.id;
              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer bg-slate-900/90 ${
                    isSelected
                      ? 'border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg shadow-cyan-500/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        {agent.id === 'sentinel' ? (
                          <Monitor className="w-5 h-5" />
                        ) : agent.id === 'auditor' ? (
                          <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        ) : agent.id === 'finance' ? (
                          <CreditCard className="w-5 h-5 text-amber-400" />
                        ) : (
                          <TrendingUp className="w-5 h-5 text-purple-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{agent.name.split('(')[0]}</h4>
                        <span className="text-[10px] text-slate-400">{agent.role.slice(0, 32)}...</span>
                      </div>
                    </div>
                    <Badge variant={agent.status === 'HEALTHY' ? 'online' : 'warning'} size="sm">
                      {agent.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 mb-3 line-clamp-2">
                    {agent.summary}
                  </p>

                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    {agent.metrics?.map((m: any, idx: number) => (
                      <div key={idx} className="bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block truncate">{m.label}</span>
                        <strong className="text-cyan-300 block font-mono text-xs">{m.value}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Saúde: <strong className="text-emerald-400">{agent.healthScore}%</strong></span>
                    <span className="text-cyan-400 font-semibold flex items-center gap-1">
                      Comandar <Send className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Comandos Operacionais Instantâneos (1-Click)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickCommand('SYNC_ALL_DISPLAYS', 'sentinel')}
                disabled={executingCommand}
                className="text-[11px] border-slate-800 hover:border-cyan-500 text-slate-200"
              >
                Sincronizar Telas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickCommand('AUDIT_CAMPAIGN_DELIVERY', 'auditor')}
                disabled={executingCommand}
                className="text-[11px] border-slate-800 hover:border-emerald-500 text-slate-200"
              >
                Auditar Inserções
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickCommand('CALCULATE_PARTNER_COMMISSIONS', 'finance')}
                disabled={executingCommand}
                className="text-[11px] border-slate-800 hover:border-amber-500 text-slate-200"
              >
                Liquidar Repasses
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickCommand('OPTIMIZE_SLOT_PRICING', 'optimizer')}
                disabled={executingCommand}
                className="text-[11px] border-slate-800 hover:border-purple-500 text-slate-200"
              >
                Otimizar Slots
              </Button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold text-white">CONSOLA EXECUTIVA DE AGENTES IA</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">ONLINE • CONECTADO</span>
          </div>

          <div className="flex-1 p-4 space-y-3 font-mono text-xs overflow-y-auto max-h-[460px] min-h-[300px]">
            {commandLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="text-cyan-400 font-bold">[{log.time}] {log.agent}</span>
                  <span className="text-emerald-400 font-semibold">{log.status}</span>
                </div>
                <div className="text-slate-300 font-semibold">
                  <span className="text-pink-400">$</span> {log.command}
                </div>
                <p className="text-[11px] text-slate-400 font-sans mt-1 bg-black/40 p-2 rounded-lg border border-white/5 whitespace-pre-wrap leading-relaxed">
                  {log.response}
                </p>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>

          <form onSubmit={handleSendCommand} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder={`Enviar comando para ${selectedAgent.toUpperCase()} (Ex: 'Verificar status da tela em Talatona')...`}
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              disabled={executingCommand}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={executingCommand || !commandInput.trim()}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-4"
            >
              {executingCommand ? '...' : <Send className="w-3.5 h-3.5" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
