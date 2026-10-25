import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Database,
  Download,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Clock,
  HardDrive,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Terminal,
  Upload,
  Plus,
  Save,
  FileUp,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface BackupItem {
  filename: string;
  size: number;
  sizeFormatted: string;
  createdAt: string;
  isAutomatic: boolean;
  path: string;
}

export const DatabaseBackupsPage: React.FC = () => {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [showManualModal, setShowManualModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // Manual Backup Form state
  const [manualCustomName, setManualCustomName] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [downloadAfterSave, setDownloadAfterSave] = useState(true);

  // File Upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);

  const fetchBackups = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/backups');
      if (res.ok) {
        const data = await res.json();
        setBackups(Array.isArray(data.backups) ? data.backups : []);
      } else {
        throw new Error('Falha ao carregar lista de backups');
      }
    } catch (err: any) {
      console.error(err);
      setFeedbackMsg({ type: 'error', text: 'Não foi possível carregar os backups do servidor.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  // Gerar backup manual (com ou sem nome personalizado)
  const handleCreateManualBackup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setGenerating(true);
      setFeedbackMsg(null);
      const res = await fetch('/api/admin/backups/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isAutomatic: false,
          customName: manualCustomName.trim() || undefined,
          notes: manualNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const generatedName = data.backup?.filename;
        setFeedbackMsg({
          type: 'success',
          text: `Backup manual salvo com sucesso no servidor! Arquivo: ${generatedName} (${data.backup?.sizeFormatted})`,
        });

        // Se marcou para descarregar após salvar
        if (downloadAfterSave && generatedName) {
          handleDownload(generatedName);
        }

        setShowManualModal(false);
        setManualCustomName('');
        setManualNotes('');
        await fetchBackups();
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao gerar backup no servidor');
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Erro ao gerar backup manual' });
    } finally {
      setGenerating(false);
    }
  };

  // Salvar upload de arquivo SQL manual
  const handleUploadBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUploadFile) {
      setFeedbackMsg({ type: 'error', text: 'Selecione um arquivo .sql do seu computador.' });
      return;
    }

    try {
      setUploading(true);
      setFeedbackMsg(null);

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const content = reader.result as string;
          const res = await fetch('/api/admin/backups/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: selectedUploadFile.name,
              content,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            setFeedbackMsg({
              type: 'success',
              text: `Arquivo "${data.backup?.filename}" carregado e salvo com sucesso no storage do servidor!`,
            });
            setShowUploadModal(false);
            setSelectedUploadFile(null);
            await fetchBackups();
          } else {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Falha ao salvar o arquivo no servidor');
          }
        } catch (err: any) {
          setFeedbackMsg({ type: 'error', text: err.message });
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        setFeedbackMsg({ type: 'error', text: 'Erro ao ler o arquivo no navegador.' });
        setUploading(false);
      };

      reader.readAsText(selectedUploadFile);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm(`Tem a certeza que deseja eliminar o arquivo de backup "${filename}"?`)) {
      return;
    }

    try {
      setDeletingFile(filename);
      const res = await fetch(`/api/admin/backups/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setFeedbackMsg({ type: 'success', text: `Backup "${filename}" removido do storage.` });
        await fetchBackups();
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao eliminar arquivo');
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setDeletingFile(null);
    }
  };

  const handleDownload = (filename: string) => {
    const downloadUrl = `/api/admin/backups/${encodeURIComponent(filename)}/download`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDirectExportDownload = () => {
    const link = document.createElement('a');
    link.href = '/api/admin/backups/export-download?name=manual_direto';
    link.setAttribute('download', 'nexora_backup_manual.sql');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalBytes = backups.reduce((acc, b) => acc + b.size, 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
  const autoBackupsCount = backups.filter((b) => b.isAutomatic).length;
  const manualBackupsCount = backups.length - autoBackupsCount;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">Backups do Banco SQL & Resiliência</h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Automação Diária Ativa
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              O sistema gera diariamente cópias completas do PostgreSQL com todas as 47 tabelas relacionais.
              Você também pode <strong>salvar backups manuais</strong> com rótulos personalizados, descarregar diretamente para o seu computador ou importar arquivos SQL externos.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRestoreModal(true)}
            className="text-xs border-slate-700 hover:border-slate-600 text-slate-300"
          >
            <Terminal className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
            Guia de Restauração
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUploadModal(true)}
            className="text-xs border-slate-700 hover:border-slate-600 text-slate-300"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            Carregar Arquivo SQL
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDirectExportDownload}
            className="text-xs border-cyan-500/30 hover:border-cyan-500/50 text-cyan-400 bg-cyan-500/5"
            title="Gera o backup e faz o download direto para o seu computador imediatamente"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Baixar para PC
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowManualModal(true)}
            disabled={generating}
            className="text-xs font-bold bg-[#0284C7] hover:bg-[#0369A1] shadow-lg shadow-[#0284C7]/20"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Novo Backup Manual
          </Button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs transition-all ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-white text-xs underline ml-4 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Tabelas Protegidas</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">47 Tabelas</h3>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            ✓ Schemas, índices e registros
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Rotina Automática</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">Diário às 03:00</h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Retenção: Últimos 14 dias
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Arquivos no Storage</span>
            <FileCode className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">{backups.length}</h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {manualBackupsCount} manuais / {autoBackupsCount} automáticos
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Espaço Ocupado</span>
            <HardDrive className="w-4 h-4 text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">{totalMB} MB</h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Volume persistente /storage/backups
          </p>
        </div>
      </div>

      {/* Backups List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Histórico de Arquivos de Backup (.sql)</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchBackups}
            disabled={loading}
            className="text-xs text-slate-400 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {loading && backups.length === 0 ? (
          <div className="p-12 text-center text-slate-400 animate-pulse text-xs">
            Carregando lista de backups do servidor...
          </div>
        ) : backups.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Database className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">Nenhum arquivo de backup encontrado</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Clique em "Novo Backup Manual" para gerar e salvar uma cópia instantânea completa do banco.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Nome do Arquivo</th>
                  <th className="p-3.5">Tipo</th>
                  <th className="p-3.5">Tamanho</th>
                  <th className="p-3.5">Data / Hora de Criação</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {backups.map((item) => {
                  const isUploaded = item.filename.includes('_upload_');
                  return (
                    <tr key={item.filename} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span className="font-mono text-slate-200 font-medium">
                            {item.filename}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        {item.isAutomatic ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Automático Diário
                          </span>
                        ) : isUploaded ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Carregado Manualmente
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            Manual Sob Demanda
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-300 font-mono">
                        {item.sizeFormatted}
                      </td>
                      <td className="p-3.5 text-slate-400">
                        {new Date(item.createdAt).toLocaleString('pt-AO')}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(item.filename)}
                            className="text-xs px-2.5 py-1 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/10"
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            Descarregar .sql
                          </Button>

                          <button
                            onClick={() => handleDelete(item.filename)}
                            disabled={deletingFile === item.filename}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Eliminar este arquivo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ────────────────── MODAL: CRIAR BACKUP MANUAL ────────────────── */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Criar Backup Manual</h3>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleCreateManualBackup} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Rótulo / Identificador do Backup (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: antes_atualizacao_vps, backup_mensal_outubro"
                  value={manualCustomName}
                  onChange={(e) => setManualCustomName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  O nome será incluído no arquivo final (ex: nexora_backup_manual_seu-rotulo_data.sql).
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Notas / Motivo do Backup (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Cópia de segurança gerada antes da migração de campanhas publicitárias."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-slate-200">
                  <input
                    type="checkbox"
                    checked={downloadAfterSave}
                    onChange={(e) => setDownloadAfterSave(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span>Descarregar arquivo .sql para o meu computador logo após salvar</span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowManualModal(false)}
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={generating}
                  className="font-bold bg-[#0284C7] hover:bg-[#0369A1]"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Gerando e Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 mr-1.5" />
                      Salvar Backup no Servidor
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL: CARREGAR ARQUIVO SQL MANUAL ────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Carregar Arquivo SQL Manual</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleUploadBackup} className="space-y-4 text-xs">
              <p className="text-slate-400 text-xs leading-relaxed">
                Envie um arquivo <code className="text-cyan-400">.sql</code> salvo no seu computador para armazená-lo com segurança no diretório persistente de backups da VPS.
              </p>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-950/50"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".sql,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedUploadFile(e.target.files[0]);
                    }
                  }}
                />
                <FileUp className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                {selectedUploadFile ? (
                  <div>
                    <span className="text-white font-bold block">{selectedUploadFile.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {(selectedUploadFile.size / 1024).toFixed(1)} KB — Clique para trocar
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-slate-300 font-medium block">
                      Clique para escolher o arquivo .sql do seu computador
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Suporta arquivos .sql de backup do PostgreSQL
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={uploading || !selectedUploadFile}
                  className="font-bold bg-amber-500 hover:bg-amber-600 text-slate-950"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Enviando Arquivo...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      Salvar Arquivo no Storage
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL: GUIA DE RESTAURAÇÃO ────────────────── */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Como Restaurar o Backup SQL na VPS</h3>
              </div>
              <button
                onClick={() => setShowRestoreModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>
                Os backups gerados pelo NEXORA OS contêm todas as tabelas, índices e registros relacionais com
                desativação temporária de chaves estrangeiras (<code className="text-cyan-400">session_replication_role = 'replica'</code>),
                garantindo restauração sem falhas de integridade.
              </p>

              <div className="space-y-1.5">
                <span className="font-bold text-white">1. Restaurar via Terminal do EasyPanel:</span>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300">
                  psql -U nexora -d nexora-os &lt; /app/storage/backups/nexora_backup_*.sql
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-white">2. Restaurar via SSH direto no Servidor (Docker):</span>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300">
                  docker exec -i $(docker ps -qf "name=postgres") psql -U nexora -d nexora-os &lt; backup.sql
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-white">3. Restaurar via DBeaver / pgAdmin:</span>
                <p className="text-slate-400 text-[11px]">
                  Basta abrir o arquivo <code className="text-cyan-400">.sql</code> descarregado no Editor SQL da sua ferramenta e clicar em <strong>Executar Script</strong>.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px]">
                💡 <strong>Dica de Recuperação:</strong> A pasta <code className="font-bold">backup-disaster-recovery/</code> no projeto contém a documentação completa de configuração do EasyPanel, variáveis de ambiente e o guia de recuperação de desastres.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRestoreModal(false)}
                className="text-xs"
              >
                Entendi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
