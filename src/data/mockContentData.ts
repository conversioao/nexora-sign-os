import { ContentItem, ContentFolder, ContentKPIs } from '../types/domain';

export const mockContentFolders: ContentFolder[] = [
  { id: 'fld-all', name: 'Todas as Mídias', slug: 'todas', itemCount: 16, color: '#3B82F6' },
  { id: 'fld-campanhas', name: 'Campanhas Comerciais', slug: 'campanhas', itemCount: 6, color: '#10B981' },
  { id: 'fld-institucional', name: 'Institucional & Avisos', slug: 'institucional', itemCount: 4, color: '#8B5CF6' },
  { id: 'fld-varejo', name: 'Varejo & Supermercados', slug: 'varejo', itemCount: 3, color: '#F59E0B' },
  { id: 'fld-eventos', name: 'Eventos & Entretenimento', slug: 'eventos', itemCount: 3, color: '#EC4899' },
];

export const mockContentItems: any[] = [];
