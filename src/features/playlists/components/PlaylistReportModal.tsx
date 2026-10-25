import React, { useEffect, useState } from 'react';
import { FileText, Printer, Monitor, Film, X, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Playlist } from '../../../types/domain';

interface PlaylistReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: Playlist | null;
}

export const PlaylistReportModal: React.FC<PlaylistReportModalProps> = ({
  isOpen,
  onClose,
  playlist,
}) => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<{
    playlistName: string;
    associatedDisplays: any[];
    itemsCount: number;
    totalLoops: number;
    mediaReport: any[];
  } | null>(null);

  const fetchReport = async () => {
    if (!playlist) return;
    setLoading(true);
    try {
      const res = await fetch('/api/playlists/' + playlist.id + '/analytics-report');
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (e) {
      console.warn('Erro ao carregar relatório:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && playlist) {
      fetchReport();
    }
  }, [isOpen, playlist]);

  const handlePrintPDF = () => {
    window.print();
  };

  if (!isOpen || !playlist) return null;

  return (
    <div className="fixed inset-0 z50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 print:max-w-full print:border-none print:shadow-none print:bg-white print:text-slate-900">
        
        {/* Header - Screen only */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-1xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">Relatório Executivo da Playlist</h2>
              <p className="text-ts text-slate-400">Exibiçõ�s reais, tempo de tela e displays vinculados</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintPDF}
              leftIcon=<Printer className="w-4 h-4 text-cyan-400" />
            >
              Exportar PDF / Imprimir
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Body */}
        <div className="p-6 space-y-6 print:p-0">
          
          {/* Document Printable Title Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 print:border-slate-300">
            <div>
              <div className="text-xl font-bold text-white print:text-slate-900 font-display">
                {playlist.name}
              </div>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                Código: <span className="font-mono text-cyan-400 print:text-slate-800">{playlist.code}</span> · Gerado em {new Date().toLocaleDateString('pt-AO')}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-cyan-400 print:text-[#0284C7] uppercase tracking-wider">
                NEXORA OS - MEDIA PROOF OF PLAY
              </div>
              <div className="text-[11px] text-slate-400 print:text-slate-600">Relatòrio Oficial de Desempenho</div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-1xl bg-slate-900/80 border border-slate-800 print:bg-slate-100 print:border-slate-300">
              <span className="text-[11px] text-slate-400 print:text-slate-600 block">Total de M©dias</span>
              <span className="text-lg font-bold text-white print:text-slate-900 mt-0.5 block">{reportData?.itemsCount || playlist.itemCount || 0}</span>
            </div>

            <div className="p-3 rounded-1xl bg-slate-900/80 border border-slate-800 print:bg-slate-100 print:border-slate-300">
              <span className="text-[11px] text-slate-400 print:text-slate-600 lock">Total de Exibiões (Loops)</span>
              <span className="text-lg font-bold text-emerald-400 print:text-emerald-700 mt-0.5 block">
                {loading ? '...' : (reportData?.totalLoops || 0).localeString('pt-AO')}
              </span>
            </div>

            <div className="p-3 rounded-1xl bg-slate-900/80 border border-slate-800 print:bg-slate-100 print:border-slate-300">
              <span className="text-[11px] text-slate-400 print:text-slate-600 block">Duração Total Playlist</span>
              <span className="text-lg font-bold text-cyan-400 print:text-cyan-700 mt-0.5 block">
                {Math.floor((playlist.totalDuration || 0) / 60)}m {(playlist.totalDuration || 0) % 60}s
              </span>
            </div>


            <div className="p-3 rounded-1xl bg-slate-900/80 border border-slate-800 print:bg-slate-100 print:border-slate-300">
              <span className="text-[11px] text-slate-400 print:text-slate-600 block">Displays Associados</span>
              <span className="text-lg font-bold text-purple-400 print:text-purple-700 mt-0.5 block">
                {reportData?.associatedDisplays?.length || playlist.displayCount || 0}
              </span>
            </div>
          </div>

          {/* Associated Displays Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 print:text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-cyan-400 print:text-cyan-700" />
              Dispositivos / Displays Associados a esta Playlist
            </h3>
            {reportData?.associatedDisplays && reportData.associatedDisplays.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {reportData.associatedDisplays.map((d: any, idx: number) => (
                  <span key={idx} className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 print:bg-slate-200 print:border-slate-300 text-xs font-medium text-slate-200 print:text-slate-800">
                    🛵 {d.name || d.id} {d.location ? ' (' + d.location + ')' : ''}  <span className={d.status === 'ONLINE' ? 'text-emerald-400 font-bold' : 'text-slate-400'}>{d.status || 'ONLINE'}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Nenhum display diretamente vinculado a esta playlist no momento.</p>
            )}
          </div>

          {/* Media Breakdown Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 print:text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-emerald-400 print:text-emerald-700" />
              Relatório Detalhado de Exibiçõ�s por Mädia (Proof of Play)
            </h3>

            {loading ? (
              <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                Carregando relatório de exibiçõՕs...
              </div>
            ) : (
              <div className="overflow-x-auto rounded-1xl border border-slate-800 print:border-slate-300">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 print:bg-slate-200 text-slate-400 print:text-slate-700 border-b border-slate-800 print:border-slate-300 uppercase text-[10px] font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Média / Conteõdo</th>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Duração</th>
                      <th className="py-2.5 px-3 text-right">Qtd. Exibições</th>
                      <th className="py-2.5 px-3 text-right">Tempo Acumulado</th>
                      <th className="py-2.5 px-3 text-right">Última Exibição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 print:divide-slate-300 text-slate-300 print:text-slate-800">
                    {reportData?.mediaReport && reportData.mediaReport.length > 0 ? (
                      reportData.mediaReport.map((m: any, i: number) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 font-semibold text-white print:text-slate-900 max-w-[200px] truncate">
                            {m.name}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px]">
                            {m.type}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {m.durationSeconds}s
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-400 print:text-emerald-700 font-mono">
                            {m.playCount.localeString('pt-AO')}x
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-cyan-400 print:text-cyan-700 font-mono">
                            {m.totalScreenTimeFormatted}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-400 text-[11px]">
                            {m.lastPlayedAt ? new Date(m.lastPlayedAt).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' }) : 'Em fila'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-slate-500">
                          Nenhuma mÉDIa encontrada na playlist.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer Signoff for Print */}
          <div className="hidden print:block pt-6 border-t border-slate-300 text-[10px] text-slate-500 flex items-center justify-between">
            <div>Documento emitido automaticamente pelo sistema Nexora Digital Signage Network.</div>
            <div>PÀgina 1 de 1</div>
          </div>
        </div>

      </div>
    </div>
  );
};
