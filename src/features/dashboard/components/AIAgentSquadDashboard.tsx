import React, { useState, useEffect } from 'react';
import {
  Bot,
  ShieldCheck,
  Monitor,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Activity,
  Zap,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

const AGENT_CONFIGS: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  sentinel: {
    icon: <Monitor className="w-5 h-5" />,
    color: '#22D3EE',
    bg: 'rgba(6,182,212,0.1)',
    border: 'rgba(6,182,212,0.2)',
  },
  auditor: {
    icon: <ShieldCheck className="w-5 h-5" />,
    color: '#34D399',
    bg: 'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.2)',
  },
  finance: {
    icon: <CreditCard className="w-5 h-5" />,
    color: '#FBBF24',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.2)',
  },
  optimizer: {
    icon: <TrendingUp className="w-5 h-5" />,
    color: '#C084FC',
    bg: 'rgba(168,85,247,0.1)',
    border: 'rgba(168,85,247,0.2)',
  },
};

const DEFAULT_AGENT_CONFIG = {
  icon: <Bot className="w-5 h-5" />,
  color: '#60A5FA',
  bg: 'rgba(37,99,235,0.1)',
  border: 'rgba(37,99,235,0.2)',
};

export function AIAgentSquadDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAgentStatus = async () => {
    try {
      const res = await fetch('/api/ai-agents/status');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.warn('Erro ao carregar estado da equipa de agentes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentStatus();
    const interval = setInterval(fetchAgentStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const systemOk = data?.systemStatus === 'OPTIMAL';

  if (loading && !data) {
    return (
      <div
        className="rounded-2xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(10,17,33,0.98))',
          border: '1px solid rgba(255,255,255,0.07)',
          minHeight: 180,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#22D3EE', borderTopColor: 'transparent' }}
          />
          <span className="text-xs font-semibold" style={{ color: '#475569' }}>
            Inicializando Agentes…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Control Tower Banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, #060B16 0%, #0E1C30 50%, #080D1A 100%)',
          border: `1px solid ${systemOk ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
          boxShadow: `0 0 40px ${systemOk ? 'rgba(16,185,129,0.05)' : 'rgba(245,158,11,0.05)'}, 0 8px 32px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Decorative grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(6,182,212,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.1) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        {/* Glow */}
        <div
          className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 85% 15%, ${systemOk ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)'} 0%, transparent 65%)`,
          }}
        />

        {/* Ghost robot icon */}
        <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
          <Bot style={{ width: 140, height: 140, color: '#22D3EE' }} />
        </div>

        <div className="relative z-10 p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              {/* Live indicator label */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                  style={{ animation: 'pulse 2s ease-in-out infinite' }}
                />
                <span
                  className="text-[10px] font-extrabold uppercase tracking-[0.14em]"
                  style={{ color: '#22D3EE' }}
                >
                  Centro de Comando Autónomo Nexora IA
                </span>
              </div>

              <h2
                className="font-black text-white leading-tight"
                style={{ fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', letterSpacing: '-0.02em' }}
              >
                Equipa de Agentes Operacionais
                <span
                  className="ml-2 text-[11px] font-bold px-2 py-0.5 rounded-md align-middle"
                  style={{
                    background: 'rgba(6,182,212,0.1)',
                    border: '1px solid rgba(6,182,212,0.2)',
                    color: '#22D3EE',
                    letterSpacing: '0.04em',
                  }}
                >
                  AI Agent Squad
                </span>
              </h2>

              <p className="text-[11px] mt-1.5 max-w-xl leading-relaxed" style={{ color: '#334155' }}>
                4 Agentes autónomos a monitorizar TV Boxes, integridade do Proof of Play, repasses financeiros e ocupação do inventário.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold"
                style={{
                  background: systemOk ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                  border: `1px solid ${systemOk ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
                  color: systemOk ? '#10B981' : '#F59E0B',
                }}
              >
                <Zap className="w-3.5 h-3.5" />
                {systemOk ? 'REDE 100% SAUDÁVEL' : 'ATENÇÃO REQUERIDA'}
              </div>

              <button
                type="button"
                onClick={fetchAgentStatus}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 hover:bg-white/5 active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#64748B',
                }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sincronizar
              </button>
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${systemOk ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.3)'}, transparent)`,
          }}
        />
      </div>

      {/* ── Agent Cards Grid ── */}
      {data?.agents && data.agents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.agents.map((agent: any) => {
            const cfg = AGENT_CONFIGS[agent.id] || DEFAULT_AGENT_CONFIG;
            const isHealthy = agent.status === 'HEALTHY';
            const isWarning = agent.status === 'WARNING';

            return (
              <div
                key={agent.id}
                className="rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(10,17,33,0.98))',
                  border: '1px solid rgba(255,255,255,0.07)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                }}
              >
                {/* Card header */}
                <div
                  className="px-4 py-3 flex items-center justify-between"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2.5 rounded-xl"
                      style={{
                        background: cfg.bg,
                        border: `1px solid ${cfg.border}`,
                        color: cfg.color,
                      }}
                    >
                      {cfg.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{agent.name}</p>
                      <p className="text-[11px]" style={{ color: '#334155' }}>
                        {agent.role}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
                    style={{
                      background: isHealthy
                        ? 'rgba(16,185,129,0.1)'
                        : isWarning
                        ? 'rgba(245,158,11,0.1)'
                        : 'rgba(100,116,139,0.1)',
                      border: `1px solid ${isHealthy ? 'rgba(16,185,129,0.25)' : isWarning ? 'rgba(245,158,11,0.25)' : 'rgba(100,116,139,0.2)'}`,
                      color: isHealthy ? '#10B981' : isWarning ? '#F59E0B' : '#64748B',
                    }}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'animate-pulse' : ''}`}
                      style={{
                        background: isHealthy ? '#10B981' : isWarning ? '#F59E0B' : '#64748B',
                      }}
                    />
                    {agent.status}
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4 space-y-3">
                  {/* Summary */}
                  <p
                    className="text-xs leading-relaxed p-3 rounded-xl"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      color: '#94A3B8',
                    }}
                  >
                    {agent.summary}
                  </p>

                  {/* Metrics */}
                  {agent.metrics && agent.metrics.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {agent.metrics.map((m: any, i: number) => (
                        <div
                          key={i}
                          className="text-center p-2.5 rounded-xl"
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                          }}
                        >
                          <span
                            className="text-[9px] uppercase font-bold block mb-1"
                            style={{ color: '#334155', letterSpacing: '0.08em' }}
                          >
                            {m.label}
                          </span>
                          <strong className="text-xs font-black text-white">{m.value}</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Alerts */}
                  {agent.alerts && agent.alerts.length > 0 && (
                    <div className="space-y-1.5">
                      {agent.alerts.map((al: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 p-2.5 rounded-xl text-[11px]"
                          style={{
                            background: 'rgba(245,158,11,0.07)',
                            border: '1px solid rgba(245,158,11,0.2)',
                          }}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#FBBF24' }} />
                          <div style={{ color: '#FCD34D' }}>
                            <strong>{al.title}:</strong> {al.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
