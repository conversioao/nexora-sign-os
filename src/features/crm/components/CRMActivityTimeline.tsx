import React from 'react';
import { CRMActivity } from '../../../types/crm';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../../../components/ui';
import {
  Activity,
  CheckCircle2,
  Building2,
  Monitor,
  User,
  ListOrdered,
  Calendar,
  Layers,
} from 'lucide-react';

interface CRMActivityTimelineProps {
  activities: CRMActivity[];
  loading?: boolean;
  title?: string;
  className?: string;
}

export const CRMActivityTimeline: React.FC<CRMActivityTimelineProps> = ({
  activities,
  loading = false,
  title = 'Histórico de Atividades & Auditoria',
  className = '',
}) => {
  const getEntityIcon = (type: CRMActivity['entityType']) => {
    switch (type) {
      case 'CUSTOMER':
      case 'ORGANIZATION':
        return <Building2 className="w-3.5 h-3.5 text-blue-400" />;
      case 'ADVERTISER':
        return <Layers className="w-3.5 h-3.5 text-pink-400" />;
      case 'CONTACT':
        return <User className="w-3.5 h-3.5 text-emerald-400" />;
      case 'DISPLAY':
        return <Monitor className="w-3.5 h-3.5 text-cyan-400" />;
      case 'PLAYLIST':
        return <ListOrdered className="w-3.5 h-3.5 text-purple-400" />;
      case 'SCHEDULE':
        return <Calendar className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('pt-AO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <Card className={className} glow="none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[#F8FAFC]">
            <Activity className="w-4 h-4 text-[#06B6D4]" />
            {title}
          </CardTitle>
          <Badge variant="neutral" size="sm">
            {activities.length} registos
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-white/5 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-white/[0.02] border border-white/5">
            <CheckCircle2 className="w-6 h-6 text-[#64748B] mx-auto mb-2" />
            <p className="text-xs text-[#94A3B8]">Nenhuma atividade registada até o momento.</p>
          </div>
        ) : (
          <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
            {activities.map((act) => (
              <div key={act.id} className="relative group">
                <div className="absolute -left-[19px] top-1 w-3 h-3 rounded-full bg-[#0B1120] border-2 border-[#06B6D4] group-hover:scale-125 transition-transform" />
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-white/5">
                        {getEntityIcon(act.entityType)}
                      </div>
                      <span className="text-xs font-semibold text-[#F8FAFC]">{act.action}</span>
                      <span className="text-[10px] text-[#64748B] font-mono">({act.entityName})</span>
                    </div>
                    <span className="text-[10px] text-[#64748B] whitespace-nowrap">
                      {formatDate(act.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{act.description}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-[#64748B]">
                    <span>Por: <strong className="text-[#CBD5E1] font-medium">{act.actorName}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
