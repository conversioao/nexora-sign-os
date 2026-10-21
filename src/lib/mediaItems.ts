/**
 * Normalização partilhada de itens de playlist (cliente web + servidor + player).
 *
 * Porque existe: a deteção de "é vídeo?" andava duplicada em três sítios e era
 * feita APENAS por extensão do URL. Isso partia mídias legítimas:
 *   • um vídeo servido por CDN/stream sem extensão (ex.: ".../media/8f3a2b")
 *     era classificado como IMAGE → o Nexora Player mostrava um ecrã preto;
 *   • um URL de imagem que continha a palavra "video" no caminho era
 *     classificado como VIDEO → falhava na TV Box.
 *
 * Regra: o `type` declarado pelo conteúdo manda; a extensão é só o último recurso.
 */

export const VIDEO_EXTENSIONS = [
  'mp4', 'webm', 'mkv', 'avi', 'mov', 'm4v', 'mpg', 'mpeg', 'm3u8', 'ts', 'ogv',
];

const VIDEO_EXTENSION_RE = new RegExp(`\\.(${VIDEO_EXTENSIONS.join('|')})$`, 'i');

/** Tipos que o player trata como vídeo. */
const VIDEO_TYPES = new Set(['VIDEO', 'STREAM', 'MOTION', 'HLS']);
/** Tipos que o player trata como imagem estática. */
const IMAGE_TYPES = new Set(['IMAGE', 'GIF', 'STATIC', 'PHOTO']);

export type MediaKind = 'VIDEO' | 'IMAGE';

/** Remove query string e hash, para inspeccionar apenas o caminho. */
export function stripUrlDecorations(url: string): string {
  return String(url).split('?')[0].split('#')[0];
}

/**
 * Decide se um URL aponta para vídeo — usado apenas quando não há `type` declarado.
 */
export function guessMediaKindFromUrl(url?: string | null): MediaKind | null {
  if (!url) return null;
  const clean = stripUrlDecorations(String(url)).toLowerCase();
  if (!clean) return null;
  if (VIDEO_EXTENSION_RE.test(clean)) return 'VIDEO';
  if (clean.includes('/video/')) return 'VIDEO';
  return 'IMAGE';
}

/**
 * Extrai o URL de mídia de um item de playlist, tolerando os vários formatos
 * que circulam entre o builder, o repositório e o servidor.
 */
export function extractItemMediaUrl(item: any): string {
  if (!item || typeof item !== 'object') return '';
  const candidates = [
    item.mediaUrl,
    item.url,
    item.fileUrl,
    item.content?.fileUrl,
    item.content?.url,
    item.content?.mediaUrl,
    item.content?.thumbnailUrl,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }
  return '';
}

/**
 * Determina o tipo de mídia de um item.
 * Preserva qualquer `type` já declarado (incluindo tipos não previstos, como
 * 'HTML'), e só recorre ao URL quando nada foi declarado.
 */
export function resolveItemMediaKind(item: any, url?: string): MediaKind | string {
  const declared = String(item?.type || item?.content?.type || '').trim().toUpperCase();
  if (declared) {
    if (IMAGE_TYPES.has(declared)) return 'IMAGE';
    if (VIDEO_TYPES.has(declared)) return 'VIDEO';
    return declared; // ex.: 'HTML' — não inventar
  }
  return guessMediaKindFromUrl(url ?? extractItemMediaUrl(item)) || 'IMAGE';
}

/**
 * Normaliza um item de playlist para o formato canónico que o player consome:
 * `mediaUrl`/`url`/`fileUrl` sempre preenchidos e `type` fiável.
 */
export function normalizePlaylistItem(item: any): any {
  const mediaUrl = extractItemMediaUrl(item);
  const type = resolveItemMediaKind(item, mediaUrl);
  const name = item?.name || item?.title || item?.content?.name || 'Mídia';
  const duration = Number(item?.duration) || Number(item?.content?.duration) || 10;

  return {
    ...item,
    mediaUrl,
    url: mediaUrl,
    fileUrl: mediaUrl,
    name,
    type,
    duration,
  };
}

/**
 * Normaliza a lista completa.
 *
 * NÃO descarta itens sem URL: um item cujo URL não pôde ser resolvido neste
 * momento continua a ser dados do utilizador e não pode ser apagado em silêncio
 * por uma normalização. Quem precisa de descartar (ex.: payload de sync para o
 * player) filtra explicitamente por `mediaUrl`.
 */
export function normalizePlaylistItems(items: any): any[] {
  if (!Array.isArray(items)) return [];
  return items.map(normalizePlaylistItem);
}

/** Apenas os itens realmente reproduzíveis (com URL utilizável). */
export function playablePlaylistItems(items: any): any[] {
  return normalizePlaylistItems(items).filter((item) => Boolean(item.mediaUrl));
}
