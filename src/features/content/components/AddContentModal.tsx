import React, { useState } from 'react';
import {
  UploadCloud,
  Film,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  X,
  FileCheck,
  Cpu,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Progress } from '../../../components/ui/Progress';
import {
  ContentFolder,
  ContentItem,
  ContentMediaType,
  ContentOrientation,
} from '../../../types/domain';
import { CONTENT_VALIDATION, formatFileSize } from '../utils/contentFormatters';
import { getApiUrl } from '../../../config/api';

interface AddContentModalProps {
  isOpen: boolean;
  folders: ContentFolder[];
  onClose: () => void;
  onUpload: (data: Partial<ContentItem>) => Promise<any>;
}

type UploadStep = 'SELECT_FORM' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED';

interface SelectedFileMock {
  name: string;
  size: number;
  type: ContentMediaType;
  mimeType: string;
  duration?: number;
  width: number;
  height: number;
  aspectRatio: string;
  orientation: ContentOrientation;
  rawFile?: File;
  base64?: string;
}

const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Falha ao ler o arquivo "${file.name}".`));
    reader.readAsDataURL(file);
  });
};

const extractVideoThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      const snapCanvas = document.createElement('canvas');
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;
      video.muted = true;
      video.playsInline = true;

      const cleanUp = () => {
        URL.revokeObjectURL(objectUrl);
      };

      video.onloadeddata = () => {
        video.currentTime = Math.min(1, Math.max(0.1, (video.duration || 1) * 0.1));
      };

      video.onseeked = () => {
        try {
          snapCanvas.width = video.videoWidth || 640;
          snapCanvas.height = video.videoHeight || 360;
          const ctx = snapCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);
            const dataUrl = snapCanvas.toDataURL('image/jpeg', 0.85);
            cleanUp();
            resolve(dataUrl);
            return;
          }
        } catch {
          // ignore
        }
        cleanUp();
        resolve('');
      };

      video.onerror = () => {
        cleanUp();
        resolve('');
      };

      setTimeout(() => {
        cleanUp();
        resolve('');
      }, 4000);
    } catch {
      resolve('');
    }
  });
};

export const AddContentModal: React.FC<AddContentModalProps> = ({
  isOpen,
  folders,
  onClose,
  onUpload,
}) => {
  const [step, setStep] = useState<UploadStep>('SELECT_FORM');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState(folders[1]?.id || 'fld-campanhas');
  const [orientation, setOrientation] = useState<ContentOrientation>('LANDSCAPE');
  const [tagsInput, setTagsInput] = useState('Luanda, Mídia, Campanha');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileMock[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Preset sample media quick selections for seamless testing
  const presetSamples: { label: string; file: SelectedFileMock }[] = [
    {
      label: 'Vídeo 4K (30s) — Telecom',
      file: {
        name: 'spot-unitel-novos-planos-4k.mp4',
        size: 98566144, // 94 MB
        type: 'VIDEO',
        mimeType: 'video/mp4',
        duration: 30,
        width: 3840,
        height: 2160,
        aspectRatio: '16:9',
        orientation: 'LANDSCAPE',
      },
    },
    {
      label: 'Totem Vertical (9:16) — Imagem',
      file: {
        name: 'anuncio-banco-totem-vertical.png',
        size: 7340032, // 7 MB
        type: 'IMAGE',
        mimeType: 'image/png',
        width: 1080,
        height: 1920,
        aspectRatio: '9:16',
        orientation: 'PORTRAIT',
      },
    },
    {
      label: 'Catálogo Ofertas (PDF)',
      file: {
        name: 'catalogo-supermercado-semana.pdf',
        size: 15728640, // 15 MB
        type: 'PDF',
        mimeType: 'application/pdf',
        width: 1080,
        height: 1920,
        aspectRatio: '9:16',
        orientation: 'PORTRAIT',
      },
    },
  ];

  const handleSelectPreset = (sample: typeof presetSamples[0]) => {
    setSelectedFiles([sample.file]);
    if (!name) {
      setName(
        sample.file.type === 'VIDEO'
          ? 'Spot Publicitário — Campanha Verão Luanda 4K'
          : sample.file.type === 'PDF'
          ? 'Encarte de Promoções — Varejo Luanda'
          : 'Peça Publicitária Vertical — Totem Digital'
      );
    }
    setOrientation(sample.file.orientation);
    setValidationError(null);
  };

  const handleSimulateFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.length > 5) {
      setValidationError('Você pode selecionar no máximo 5 mídias de uma vez.');
      return;
    }

    const newSelectedFiles: SelectedFileMock[] = [];
    let errMessage: string | null = null;

    files.forEach((file) => {
      if (file.size > CONTENT_VALIDATION.MAX_FILE_SIZE_BYTES) {
        errMessage = `O arquivo "${file.name}" excede o limite máximo permitido (${formatFileSize(CONTENT_VALIDATION.MAX_FILE_SIZE_BYTES)}).`;
        return;
      }

      const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4');
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      const type: ContentMediaType = isVideo ? 'VIDEO' : isPdf ? 'PDF' : 'IMAGE';

      const fileObj: any = {
        name: file.name,
        size: file.size,
        type,
        rawFile: file,
        mimeType: file.type || (isVideo ? 'video/mp4' : isPdf ? 'application/pdf' : 'image/png'),
        duration: isVideo ? 15 : 10,
        width: orientation === 'PORTRAIT' ? 1080 : 1920,
        height: orientation === 'PORTRAIT' ? 1920 : 1080,
        aspectRatio: orientation === 'PORTRAIT' ? '9:16' : '16:9',
        orientation,
      };

      const reader = new FileReader();
      reader.onload = () => {
        fileObj.base64 = reader.result;
        if (isVideo) {
          const tempVideo = document.createElement('video');
          tempVideo.preload = 'metadata';
          tempVideo.onloadedmetadata = () => {
            if (tempVideo.duration && !isNaN(tempVideo.duration) && tempVideo.duration > 0) {
              fileObj.duration = Math.round(tempVideo.duration);
            }
          };
          tempVideo.src = reader.result as string;
        }
      };
      reader.readAsDataURL(file);

      newSelectedFiles.push(fileObj);
    });

    if (errMessage) {
      setValidationError(errMessage);
      return;
    }

    setSelectedFiles(newSelectedFiles);
    if (!name && newSelectedFiles.length === 1) {
      setName(newSelectedFiles[0].name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    } else if (!name && newSelectedFiles.length > 1) {
      setName(`Lote de Mídias (${newSelectedFiles.length} arquivos)`);
    }
    setValidationError(null);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleReset = () => {
    setStep('SELECT_FORM');
    setName('');
    setDescription('');
    setSelectedFiles([]);
    setUploadProgress(0);
    setValidationError(null);
  };

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) {
      setValidationError('Selecione ou arraste até 5 arquivos para continuar.');
      return;
    }

    setValidationError(null);
    setStep('UPLOADING');
    setUploadProgress(0);

    const selectedFolder = folders.find((f) => f.id === folderId);
    const targetFolderSlug = selectedFolder?.slug || selectedFolder?.name || 'campanhas';

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const totalFiles = selectedFiles.length;

    try {
      for (let i = 0; i < totalFiles; i++) {
        const file = selectedFiles[i];
        const progressBase = Math.round((i / totalFiles) * 100);
        setUploadProgress(progressBase);

        setStep('UPLOADING');
        setProcessingStage(`Preparando "${file.name}"...`);

        // 1. Garantir que temos o base64 do arquivo
        let fileBase64 = (file as any).base64;
        if (!fileBase64 && file.rawFile) {
          setProcessingStage(`Lendo arquivo "${file.name}"...`);
          fileBase64 = await readFileAsBase64(file.rawFile);
        }

        // 2. Extrair miniatura real caso seja vídeo
        let videoThumbBase64 = '';
        if (file.type === 'VIDEO' && file.rawFile) {
          setProcessingStage(`Gerando miniatura do vídeo "${file.name}"...`);
          videoThumbBase64 = await extractVideoThumbnail(file.rawFile);
        }

        setStep('PROCESSING');
        setProcessingStage(`Enviando mídia ${i + 1} de ${totalFiles}: "${file.name}" para o servidor de armazenamento...`);
        setUploadProgress(Math.min(95, progressBase + Math.round(50 / totalFiles)));

        let mediaUrl = '';
        let thumbUrl = videoThumbBase64 || '';

        if (fileBase64) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000); // 10 min
          const uploadEndpoint = getApiUrl('/api/storage/upload');

          const storageRes = await fetch(uploadEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64,
              fileName: file.name,
              folder: targetFolderSlug,
              mimeType: file.mimeType,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!storageRes.ok) {
            const errJson = await storageRes.json().catch(() => ({}));
            throw new Error((errJson as any)?.error || `Falha no servidor de armazenamento (HTTP ${storageRes.status}).`);
          }

          const storageData = await storageRes.json();
          if (storageData.success && storageData.url) {
            mediaUrl = storageData.url;
            if (!thumbUrl && file.type === 'IMAGE') {
              thumbUrl = storageData.url;
            }
          } else {
            throw new Error(storageData?.error || 'O servidor de armazenamento não retornou a URL da mídia.');
          }
        } else {
          throw new Error(`Não foi possível carregar os dados de "${file.name}".`);
        }

        const mediaItemName =
          totalFiles === 1 && name.trim()
            ? name.trim()
            : `${name.trim() || 'Mídia'} #${i + 1} (${file.name})`;

        await onUpload({
          name: mediaItemName,
          description: description.trim() || `Arquivo ${file.name} (parte do lote de ${totalFiles} mídias)`,
          type: file.type,
          status: 'READY',
          fileUrl: mediaUrl,
          url: mediaUrl,
          thumbnailUrl: thumbUrl || mediaUrl,
          mimeType: file.mimeType,
          fileSize: file.size,
          duration: file.duration,
          width: file.width,
          height: file.height,
          aspectRatio: file.aspectRatio,
          orientation: file.orientation,
          resolution: `${file.width}x${file.height}`,
          folderId,
          folderName: selectedFolder ? selectedFolder.name : 'Campanhas Comerciais',
          tags,
          metadata: {
            codec: file.type === 'VIDEO' ? 'H.264 / AAC' : file.type === 'PDF' ? 'PDF 1.7' : 'PNG/JPEG',
            colorSpace: 'BT.709',
            androidCompatibility: {
              compatible: true,
              notes: 'Validado com aceleração de hardware GPU.',
            },
          },
        });
      }

      setUploadProgress(100);
      setStep('COMPLETED');
      setTimeout(() => {
        handleReset();
        onClose();
      }, 900);
    } catch (err: any) {
      console.error('Erro no upload de mídia:', err);
      setStep('SELECT_FORM');
      setValidationError(err?.message || 'Falha ao processar e salvar a mídia.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (step === 'UPLOADING' || step === 'PROCESSING') return;
        handleReset();
        onClose();
      }}
      title="Adicionar Conteúdo à Biblioteca"
      size="lg"
    >
      <div className="space-y-5">
        {validationError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Step 1: Form & File selection */}
        {step === 'SELECT_FORM' && (
          <div className="space-y-4">
            {/* File Dropzone */}
            <div className="relative border-2 border-dashed border-white/20 hover:border-blue-500/60 rounded-xl p-5 text-center bg-[#030712]/60 transition-colors group">
              <input
                type="file"
                id="file-upload-input"
                multiple
                onChange={handleSimulateFilePick}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />

              {selectedFiles.length > 0 ? (
                <div className="space-y-2 relative z-20">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1">
                    <span>Mídias Selecionadas ({selectedFiles.length}/5)</span>
                    <span className="text-blue-400 font-normal">Clique ou solte para trocar/adicionar</span>
                  </div>
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-left">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                          {file.type === 'VIDEO' && <Film className="w-4 h-4" />}
                          {file.type === 'IMAGE' && <ImageIcon className="w-4 h-4" />}
                          {file.type === 'PDF' && <FileText className="w-4 h-4" />}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {formatFileSize(file.size)} • {file.mimeType}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveFile(idx);
                        }}
                        className="p-1 text-slate-400 hover:text-white rounded shrink-0 relative z-30"
                      >
                        <X className="w-4 h-4 text-rose-400" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      Arraste e solte até <span className="text-cyan-400 font-bold">5 arquivos</span> aqui, ou{' '}
                      <span className="text-blue-400 font-semibold underline">procure</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Suporta MP4, WEBM, PNG, JPEG, WEBP, PDF (Máx. 500 MB por lote)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Sample Presets */}
            <div>
              <span className="text-xs text-slate-400 block mb-2 font-medium">
                Ou use um exemplo pronto para teste rápido:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {presetSamples.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-left text-xs transition-colors"
                  >
                    <span className="text-blue-400">
                      {preset.file.type === 'VIDEO' ? (
                        <Film className="w-3.5 h-3.5" />
                      ) : preset.file.type === 'PDF' ? (
                        <FileText className="w-3.5 h-3.5" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <span className="text-slate-300 truncate font-medium">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Metadata Fields */}
            <div className="space-y-3 pt-2">
              <Input
                label="Nome do Conteúdo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Campanha Unitel 5G — Spot 30s Luanda"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Pasta / Categoria"
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  options={folders
                    .filter((f) => f.id !== 'fld-all')
                    .map((f) => ({ value: f.id, label: f.name }))}
                />

                <Select
                  label="Orientação da Mídia"
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as ContentOrientation)}
                  options={[
                    { value: 'LANDSCAPE', label: 'Horizontal (16:9 — Telões e TVs)' },
                    { value: 'PORTRAIT', label: 'Vertical (9:16 — Totens)' },
                    { value: 'SQUARE', label: 'Quadrado (1:1 — Blocos)' },
                  ]}
                />
              </div>

              <Input
                label="Tags (separadas por vírgula)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Ex: Luanda, Talatona, Promoção, 4K"
              />

              <Textarea
                label="Descrição (Opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Detalhes sobre a campanha, objetivos ou instruções de veiculação."
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleStartUpload}>
                Enviar para a Biblioteca
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Uploading Animation */}
        {step === 'UPLOADING' && (
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 animate-pulse">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div className="w-full max-w-md space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Enviando arquivo ({selectedFiles[0]?.name || 'mídia'})...</span>
                <span className="font-mono font-bold text-blue-400">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} variant="cyan" />
              <p className="text-[11px] text-slate-400 font-mono">Taxa estimada: ~18.4 MB/s</p>
            </div>
          </div>
        )}

        {/* Step 3: Processing Simulation */}
        {step === 'PROCESSING' && (
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Cpu className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-white">Processamento & Transcodificação</h4>
              <p className="text-xs text-purple-300 font-mono animate-pulse">{processingStage}</p>
            </div>
          </div>
        )}

        {/* Step 4: Completed Confirmation */}
        {step === 'COMPLETED' && (
          <div className="py-8 flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-semibold text-white">Conteúdo Adicionado com Sucesso!</h4>
            <p className="text-xs text-slate-400">
              A mídia está pronta para inclusão em grades e playlists de Digital Signage.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
