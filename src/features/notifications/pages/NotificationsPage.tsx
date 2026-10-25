import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, AlertTriangle, CheckCircle2, Info, Zap,
  Monitor, Radio, ShieldCheck, RefreshCw, Filter,
  Check, Eye, Activity, Clock, Flame,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button, Badge } from '../../../components/ui';
import { Card } from '../../../components/ui/Card';

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
type FilterType = 'ALL' | Severity | 'UNREAD';

interface AppNotification {
  id: string; title: string; message: string; type: string;
  severity?: Severity; isRead: boolean; createdAt: string; displayId?: string;
}

const SEV_CONFIG = {
  CRITICAL: { label: 'Critico', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: 'flame' },
  HIGH: { label: 'Alta', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: 'alert' },
  MEDIUM: { label: 'Media', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: 'zap' },
  LOW: { label: 'Baixa', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: 'info' },
  INFO: { label: 'Info', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', icon: 'check' },
};

function inferSeverity(n: any): Severity {
  const t = ((n.type || '') + (n.title || '') + (n.message || '')).toUpperCase();
  if (t.includes('OFFLINE') || t.includes('ERROR') || t.includes('CRITICO')) return 'CRITICAL';
  if (t.includes('ALERT') || t.includes('ALERTA') || t.includes('FALHA')) return 'HIGH';
  if (t.includes('WARNING') || t.includes('AVISO')) return 'MEDIUM';
  if (t.includes('ONLINE') || t.includes('SYNC')) return 'LOW';
  return 'INFO';
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `ha ${diff}s`;
  if (diff < 3600) return `ha ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `ha ${Math.floor(diff / 3600)}h`;
  return `ha ${Math.floor(diff / 86400)}d`;
}

const SevIcon: React.FC<{ name: string; cls?: string }> = ({ name, cls = 'w-4 h-4' }) => {
  switch (name) {
    case 'flame': return <Flame className={cls + ' text-red-400'} />;
    case 'alert': return <AlertTriangle className={cls + ' text-orange-400'} />;
    case 'zap': return <Zap className={cls + ' text-amber-400'} />;
    case 'info': return <Info className={cls + ' text-blue-400'} />;
    default: return <CheckCircle2 className={cls + ' text-slate-400'} />;
  }
};

const TypeIcon: React.FC<{ type: string }> = ({ type }) => {
  const t = (type || '').toUpperCase();
  if (t.includes('OFFLINE')) return <Monitor className="w-4 h-4 text-red-400" />;
  if (t.includes('ONLINE')) return <Radio className="w-4 h-4 text-emerald-400" />;
  if (t.includes('ALERT')) return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  if (t.includes('ACTIVITY')) return <Activity className="w-4 h-4 text-cyan-400" />;
  return <ShieldCheck className="w-4 h-4 text-slate-400" />;
};

interface NotificationsPageProps { onBack?: () => void; }

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onBack }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=100');
      if (res.ok) {
        const data = await res.json();
        setNotifications((data.notifications || []).map((n: any) => ({
          id: n.id, title: n.title, message: n.message, type: n.type,
          severity: n.severity || inferSeverity(n),
          isRead: n.isRead ?? false, createdAt: n.createdAt, displayId: n.displayId,
        })));
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 10000);
    return () => clearInterval(iv);
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try { await fetch('/api/notifications/' + id + '/read', { method: 'PATCH' }); } catch {}
    setNotifications(p => p.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try { await fetch('/api/notifications/mark-all-read', { method: 'PATCH' }); } catch {}
    setNotifications(p => p.map(n => ({ ...n, isRead: true })));
    setMarkingAll(false);
  };

  const setSeverity = (id: string, sev: Severity) =>
    setNotifications(p => p.map(n => n.id === id ? { ...n, severity: sev } : n));

  const filtered = notifications.filter(n => {
    if (filter === 'ALL') return true;
    if (filter === 'UNREAD') return !n.isRead;
    return n.severity === filter;
  });

  const unread = notifications.filter(n => !n.isRead).length;
  const critical = notifications.filter(n => n.severity === 'CRITICAL').length;
  const today = notifications.filter(n => new Date(n.createdAt).toDateString() === new Date().toDateString()).length;

  const filters: { key: FilterType; label: string; cnt?: number }[] = [
    { key: 'ALL', label: 'Todas', cnt: notifications.length },
    { key: 'UNREAD', label: 'Nao Lidas', cnt: unread },
    { key: 'CRITICAL', label: 'Critico', cnt: critical },
    { key: 'HIGH', label: 'Alta' },
    { key: 'MEDIUM', label: 'Media' },
    { key: 'LOW', label: 'Baixa' },
    { key: 'INFO', label: 'Info' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Central de Notificacoes"
        description="Gerencie e classifique todos os alertas e eventos do sistema Nexora."
        badge={unread > 0 ? <Badge variant="error" dot>{unread} nao lidas</Badge> : <Badge variant="online" dot>Em dia</Badge>}
        breadcrumbs={[{ label: 'Nexora' }, { label: 'Notificacoes', active: true }]}
        actions={<>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className={'w-3.5 h-3.5' + (loading ? ' animate-spin' : '')} />} onClick={() => { setLoading(true); fetchNotifications(); }}>Actualizar</Button>
          {unread > 0 && <Button variant="cyan" size="sm" leftIcon={markingAll ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} onClick={markAllAsRead} disabled={markingAll}>Marcar Todas como Lidas</Button>}
        </>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', val: notifications.length, c: 'text-white', bg: 'bg-slate-800/60 border-slate-700/50' },
          { label: 'Nao Lidas', val: unread, c: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
          { label: 'Criticas', val: critical, c: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          { label: 'Hoje', val: today, c: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
        ].map(s => (
          <div key={s.label} className={'rounded-xl border p-3.5 ' + s.bg}>
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={'text-2xl font-bold mt-0.5 ' + s.c}>{s.val}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-slate-400" />
        {filters.map(fb => (
          <button key={fb.key} onClick={() => setFilter(fb.key)}
            className={'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ' +
              (filter === fb.key
                ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                : 'bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/60')}>
            {fb.label}
            {fb.cnt !== undefined && (
              <span className={'px-1.5 py-0.5 rounded-full text-[10px] font-bold ' + (filter === fb.key ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-700 text-slate-400')}>
                {fb.cnt}
              </span>
            )}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin" /><span className="text-sm">Carregando...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <Bell className="w-10 h-10 text-slate-600" />
            <p className="text-sm">Nenhuma notificacao neste filtro.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map(notif => {
              const sev = notif.severity || 'INFO';
              const sc = SEV_CONFIG[sev];
              return (
                <div key={notif.id} onClick={() => markAsRead(notif.id)}
                  className={'group flex items-start gap-4 p-4 transition-all cursor-pointer hover:bg-white/[0.03] ' +
                    (!notif.isRead ? 'bg-cyan-500/[0.03] border-l-2 border-cyan-500/50' : 'border-l-2 border-transparent')}>
                  <div className={'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border ' + sc.bg + ' ' + sc.border}>
                    <TypeIcon type={notif.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <p className={'text-sm font-semibold ' + (notif.isRead ? 'text-slate-300' : 'text-white')}>{notif.title}</p>
                      <span className={'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ' + sc.bg + ' ' + sc.border + ' ' + sc.color}>
                        <SevIcon name={sc.icon} cls="w-3 h-3" />{sc.label}
                      </span>
                      {!notif.isRead && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-2">{notif.message}</p>
                    <div className="flex flex-wrap items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-slate-500 mr-1">Reclassificar:</span>
                      {(['CRITICAL','HIGH','MEDIUM','LOW','INFO'] as Severity[]).map(s => (
                        <button key={s} onClick={e => { e.stopPropagation(); setSeverity(notif.id, s); }}
                          className={'px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all ' +
                            (sev === s
                              ? SEV_CONFIG[s].bg + ' ' + SEV_CONFIG[s].border + ' ' + SEV_CONFIG[s].color
                              : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300')}>
                          {SEV_CONFIG[s].label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="w-3 h-3" />{timeAgo(notif.createdAt)}
                    </div>
                    {notif.isRead
                      ? <span className="flex items-center gap-1 text-[10px] text-slate-600"><Eye className="w-3 h-3" />Lida</span>
                      : <span className="flex items-center gap-1 text-[10px] text-cyan-500 font-medium"><Eye className="w-3 h-3" />Clique p/ ler</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
