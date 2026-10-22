import {
  ContentItem,
  ContentMediaType,
  ContentOrientation,
  ContentStatus,
} from '../../../types/domain';
import { BadgeVariant } from '../../../types/theme';

export const CONTENT_VALIDATION = {
  MAX_FILE_SIZE_BYTES: 524288000, // 500 MB
  SUPPORTED_MIME_TYPES: [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/pdf',
  ],
  SUPPORTED_EXTENSIONS: ['.mp4', '.webm', '.mov', '.png', '.jpg', '.jpeg', '.webp', '.pdf'],
};

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val.toFixed(val >= 10 || i === 0 ? 1 : 2)} ${sizes[i]}`;
}

export function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatOrientationLabel(orientation: ContentOrientation): string {
  switch (orientation) {
    case 'LANDSCAPE':
      return 'Horizontal (16:9)';
    case 'PORTRAIT':
      return 'Vertical (9:16)';
    case 'SQUARE':
      return 'Quadrado (1:1)';
    default:
      return orientation;
  }
}

export function getContentStatusBadge(status: ContentStatus): {
  variant: BadgeVariant;
  label: string;
} {
  switch (status) {
    case 'ACTIVE':
      return { variant: 'online', label: 'Ativo na Rede' };
    case 'READY':
      return { variant: 'playing', label: 'Pronto' };
    case 'SCHEDULED':
      return { variant: 'scheduled', label: 'Programado' };
    case 'PROCESSING':
      return { variant: 'syncing', label: 'Processando' };
    case 'DRAFT':
      return { variant: 'draft', label: 'Rascunho' };
    case 'ARCHIVED':
      return { variant: 'inactive', label: 'Arquivado' };
    case 'ERROR':
      return { variant: 'error', label: 'Erro no Codec' };
    default:
      return { variant: 'neutral', label: status };
  }
}

export function getContentTypeInfo(type: ContentMediaType): {
  label: string;
  shortLabel: string;
  badgeVariant: BadgeVariant;
  colorHex: string;
} {
  switch (type) {
    case 'VIDEO':
      return {
        label: 'Vídeo Comercial',
        shortLabel: 'Vídeo',
        badgeVariant: 'cyan',
        colorHex: '#06B6D4',
      };
    case 'IMAGE':
      return {
        label: 'Imagem Estática',
        shortLabel: 'Imagem',
        badgeVariant: 'blue',
        colorHex: '#3B82F6',
      };
    case 'PDF':
      return {
        label: 'Documento / PDF',
        shortLabel: 'PDF',
        badgeVariant: 'purple',
        colorHex: '#A855F7',
      };
    case 'HTML':
    case 'WEB':
      return {
        label: 'Aplicação Web / HTML5',
        shortLabel: 'Web',
        badgeVariant: 'live',
        colorHex: '#10B981',
      };
    case 'WIDGET':
      return {
        label: 'Widget Dinâmico',
        shortLabel: 'Widget',
        badgeVariant: 'magenta',
        colorHex: '#EC4899',
      };
    default:
      return {
        label: type,
        shortLabel: type,
        badgeVariant: 'neutral',
        colorHex: '#94A3B8',
      };
  }
}

export function formatDateRelative(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
