import React from 'react';
import { Film, Image as ImageIcon, FileText, HardDrive, Layers, Clock, AlertTriangle } from 'lucide-react';
import { ContentKPIs, ContentMediaType, ContentStatus } from '../../../types/domain';
import { formatFileSize } from '../utils/contentFormatters';
import { Skeleton } from '../../../components/ui/Skeleton';

interface ContentKpiSummaryProps {
  kpis: ContentKPIs | null;
  isLoading?: boolean;
  activeTypeFilter?: ContentMediaType | 'ALL';
  activeStatusFilter?: ContentStatus | 'ALL';
  onSelectType: (type: ContentMediaType | 'ALL') => void;
  onSelectStatus: (status: ContentStatus | 'ALL') => void;
}

export const ContentKpiSummary: React.FC<ContentKpiSummaryProps> = ({
  kpis,
  isLoading = false,
  activeTypeFilter = 'ALL',
  activeStatusFilter = 'ALL',
  onSelectType,
  onSelectStatus,
}) => {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div key={idx} className="bg-[#0B1120]/80 border border-white/5 rounded-xl p-4">
            <Skeleton variant="text" width="60%" className="mb-2" />
            <Skeleton variant="text" width="40%" height={28} />
          </div>
        ))}
      </div>
    );
  }

  const isAllActive = activeTypeFilter === 'ALL' && activeStatusFilter === 'ALL';
  const isVideoActive = activeTypeFilter === 'VIDEO';
  const isImageActive = activeTypeFilter === 'IMAGE';
  const isDocActive = activeTypeFilter === 'PDF';
  const isProcessingActive = activeStatusFilter === 'PROCESSING' || activeStatusFilter === 'ERROR';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
      {/* 1. Total de Mídias */}
      <button
        type="button"
        onClick={() => {
          onSelectType('ALL');
          onSelectStatus('ALL');
        }}
        className={`flex flex-col text-left p-4 rounded-xl border transition-all relative overflow-hidden group ${
          isAllActive
            ? 'bg-blue-600/10 border-blue-500/40 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/30'
            : 'bg-[#0B1120]/90 border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
        }`}
      >
        <div className="flex items-center justify-between w-full mb-2">
          <span className="text-xs font-medium text-slate-400">Total de Mídias</span>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isAllActive ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-400 group-hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white font-mono">{kpis.total}</span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-slate-400" />
            {formatFileSize(kpis.totalStorageBytes)}
          </span>
        </div>
      </button>

      {/* 2. Vídeos */}
      <button
        type="button"
        onClick={() => {
          onSelectStatus('ALL');
          onSelectType(isVideoActive ? 'ALL' : 'VIDEO');
        }}
        className={`flex flex-col text-left p-4 rounded-xl border transition-all relative overflow-hidden group ${
          isVideoActive
            ? 'bg-cyan-500/10 border-cyan-500/40 shadow-lg shadow-cyan-500/5 ring-1 ring-cyan-500/30'
            : 'bg-[#0B1120]/90 border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
        }`}
      >
        <div className="flex items-center justify-between w-full mb-2">
          <span className="text-xs font-medium text-slate-400">Vídeos Comerciais</span>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isVideoActive ? 'bg-cyan-500/20 text-[#38BDF8]' : 'bg-white/5 text-slate-400 group-hover:text-[#38BDF8]'
            }`}
          >
            <Film className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white font-mono">{kpis.videos}</span>
          <span className="text-[11px] text-[#38BDF8]/90 font-medium">4K & Full HD</span>
        </div>
      </button>

      {/* 3. Imagens */}
      <button
        type="button"
        onClick={() => {
          onSelectStatus('ALL');
          onSelectType(isImageActive ? 'ALL' : 'IMAGE');
        }}
        className={`flex flex-col text-left p-4 rounded-xl border transition-all relative overflow-hidden group ${
          isImageActive
            ? 'bg-blue-500/10 border-blue-500/40 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/30'
            : 'bg-[#0B1120]/90 border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
        }`}
      >
        <div className="flex items-center justify-between w-full mb-2">
          <span className="text-xs font-medium text-slate-400">Imagens Estáticas</span>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isImageActive ? 'bg-blue-500/20 text-[#60A5FA]' : 'bg-white/5 text-slate-400 group-hover:text-[#60A5FA]'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white font-mono">{kpis.images}</span>
          <span className="text-[11px] text-[#60A5FA]/90 font-medium">PNG & JPEG</span>
        </div>
      </button>

      {/* 4. Documentos & PDFs */}
      <button
        type="button"
        onClick={() => {
          onSelectStatus('ALL');
          onSelectType(isDocActive ? 'ALL' : 'PDF');
        }}
        className={`flex flex-col text-left p-4 rounded-xl border transition-all relative overflow-hidden group ${
          isDocActive
            ? 'bg-purple-500/10 border-purple-500/40 shadow-lg shadow-purple-500/5 ring-1 ring-purple-500/30'
            : 'bg-[#0B1120]/90 border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
        }`}
      >
        <div className="flex items-center justify-between w-full mb-2">
          <span className="text-xs font-medium text-slate-400">Catálogos & PDFs</span>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isDocActive ? 'bg-purple-500/20 text-[#C084FC]' : 'bg-white/5 text-slate-400 group-hover:text-[#C084FC]'
            }`}
          >
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white font-mono">{kpis.documents}</span>
          <span className="text-[11px] text-[#C084FC]/90 font-medium">Multi-página</span>
        </div>
      </button>

      {/* 5. Processando / Alertas */}
      <button
        type="button"
        onClick={() => {
          onSelectType('ALL');
          onSelectStatus(isProcessingActive ? 'ALL' : 'PROCESSING');
        }}
        className={`flex flex-col text-left p-4 rounded-xl border transition-all relative overflow-hidden group ${
          isProcessingActive
            ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30'
            : 'bg-[#0B1120]/90 border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
        }`}
      >
        <div className="flex items-center justify-between w-full mb-2">
          <span className="text-xs font-medium text-slate-400">Processamento / Alertas</span>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isProcessingActive ? 'bg-amber-500/20 text-[#F59E0B]' : 'bg-white/5 text-slate-400 group-hover:text-[#F59E0B]'
            }`}
          >
            {kpis.processing > 0 ? (
              <Clock className="w-4 h-4 text-[#F59E0B] animate-spin" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white font-mono">
            {kpis.processing + (kpis.archived > 0 ? 1 : 0)}
          </span>
          <span className="text-[11px] text-amber-400/90 font-medium">
            {kpis.processing > 0 ? `${kpis.processing} ativo` : 'Transcodificação'}
          </span>
        </div>
      </button>
    </div>
  );
};
