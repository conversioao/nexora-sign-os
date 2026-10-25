/**
 * Testes de regressao da normalizacao de itens de playlist.
 *
 * Cobrem as causas provaveis de "algumas midias nao sao exibidas no Nexora Player":
 *   1. video sem extensao (CDN/stream) classificado como IMAGE -> ecra preto;
 *   2. imagem com "video" no caminho classificada como VIDEO -> falha na TV Box;
 *   3. URL de midia perdido/em branco por o item usar outro nome de campo;
 *   4. itens sem URL a serem silenciosamente apagados pela normalizacao.
 *
 * Executar: npx tsx src/lib/mediaItems.test.ts
 */
import {
  guessMediaKindFromUrl,
  resolveItemMediaKind,
  extractItemMediaUrl,
  normalizePlaylistItem,
  normalizePlaylistItems,
  playablePlaylistItems,
  stripUrlDecorations,
} from './mediaItems';

let passed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) passed += 1;
  else failures.push(`${name}${detail === undefined ? '' : ` -> ${JSON.stringify(detail)}`}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Video sem extensao — o caso que dava ecra preto
// ─────────────────────────────────────────────────────────────────────────────
{
  check(
    'type VIDEO declarado ganha a URL sem extensao',
    resolveItemMediaKind({ type: 'VIDEO', mediaUrl: 'https://cdn.nexora.ao/api/media/8f3a2b' }) === 'VIDEO'
  );
  check(
    'URL sem extensao e sem type cai em IMAGE (comportamento seguro)',
    resolveItemMediaKind({ mediaUrl: 'https://cdn.nexora.ao/api/media/8f3a2b' }) === 'IMAGE'
  );
  check('.m3u8 (HLS) e VIDEO', resolveItemMediaKind({ mediaUrl: 'https://x.ao/live/stream.m3u8' }) === 'VIDEO');
  check('.mov e VIDEO', guessMediaKindFromUrl('https://x.ao/clip.MOV') === 'VIDEO');
  check(
    '.mp4 com query string e VIDEO',
    guessMediaKindFromUrl('https://x.ao/v.mp4?token=abc&t=123') === 'VIDEO'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Falsos positivos do sniffing por "video" no caminho
// ─────────────────────────────────────────────────────────────────────────────
{
  check(
    'imagem com "video" no nome NAO e VIDEO',
    resolveItemMediaKind({ mediaUrl: 'https://x.ao/uploads/my-video-thumbnail.png' }) === 'IMAGE'
  );
  check(
    'type IMAGE declarado ganha a URL .mp4',
    resolveItemMediaKind({ type: 'IMAGE', mediaUrl: 'https://x.ao/falso.mp4' }) === 'IMAGE'
  );
  check(
    'pasta /video/ conta como VIDEO',
    guessMediaKindFromUrl('https://x.ao/video/spot-1') === 'VIDEO'
  );
  check(
    'tipo desconhecido (HTML) e preservado, nao inventado',
    resolveItemMediaKind({ type: 'HTML', mediaUrl: 'https://x.ao/ad.html' }) === 'HTML'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Extracao do URL a partir dos varios formatos de item
// ─────────────────────────────────────────────────────────────────────────────
{
  check('mediaUrl directo', extractItemMediaUrl({ mediaUrl: 'a.png' }) === 'a.png');
  check('url directo', extractItemMediaUrl({ url: 'b.mp4' }) === 'b.mp4');
  check('fileUrl directo', extractItemMediaUrl({ fileUrl: 'c.jpg' }) === 'c.jpg');
  check('content.fileUrl', extractItemMediaUrl({ content: { fileUrl: 'd.png' } }) === 'd.png');
  check('content.url', extractItemMediaUrl({ content: { url: 'e.mp4' } }) === 'e.mp4');
  check('mediaUrl ganha a url', extractItemMediaUrl({ mediaUrl: 'x.png', url: 'y.png' }) === 'x.png');
  check('espacos sao removidos', extractItemMediaUrl({ mediaUrl: '  f.png  ' }) === 'f.png');
  check('item sem URL devolve vazio', extractItemMediaUrl({ name: 'sem url' }) === '');
  check('cadeia vazia ignorada', extractItemMediaUrl({ mediaUrl: '   ', url: 'ok.png' }) === 'ok.png');
  check('null nao rebenta', extractItemMediaUrl(null) === '');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Normalizacao de um item — os 3 campos de URL sempre preenchidos
// ─────────────────────────────────────────────────────────────────────────────
{
  const out = normalizePlaylistItem({ id: 'i1', content: { fileUrl: 'https://x.ao/a.mp4' }, duration: 20 });
  check('mediaUrl preenchido', out.mediaUrl === 'https://x.ao/a.mp4');
  check('url preenchido', out.url === 'https://x.ao/a.mp4');
  check('fileUrl preenchido', out.fileUrl === 'https://x.ao/a.mp4');
  check('type inferido como VIDEO', out.type === 'VIDEO', out.type);
  check('duration preservada', out.duration === 20);
  check('id preservado', out.id === 'i1');

  const semDuration = normalizePlaylistItem({ mediaUrl: 'b.png' });
  check('duration default 10', semDuration.duration === 10, semDuration.duration);
  check('name default', semDuration.name === 'Mídia', semDuration.name);

  const comCampanha = normalizePlaylistItem({ mediaUrl: 'c.mp4', campaignId: 'cmp-1', type: 'VIDEO' });
  check('campaignId preservado', comCampanha.campaignId === 'cmp-1');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Nao apagar dados do utilizador
// ─────────────────────────────────────────────────────────────────────────────
{
  const items = [
    { id: 'ok', mediaUrl: 'https://x.ao/a.png' },
    { id: 'sem-url', name: 'Mídia por corrigir' },
  ];

  const normalized = normalizePlaylistItems(items);
  check('normalizePlaylistItems NAO descarta itens', normalized.length === 2, normalized.length);
  check('item sem URL mantem-se identificavel', normalized[1].id === 'sem-url');
  check('item sem URL fica com mediaUrl vazio', normalized[1].mediaUrl === '');

  const playable = playablePlaylistItems(items);
  check('playablePlaylistItems descarta os nao reproduziveis', playable.length === 1, playable.length);
  check('o item mantido e o que tem URL', playable[0].id === 'ok');

  check('entrada nao-array devolve vazio', normalizePlaylistItems(null as any).length === 0);
  check('playablePlaylistItems tolera nao-array', playablePlaylistItems(undefined as any).length === 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Payload que chega ao player: cadeia completa builder -> servidor
// ─────────────────────────────────────────────────────────────────────────────
{
  // Item como o builder o constroi (com content aninhado do /api/content)
  const builderItem = {
    id: 'item-1',
    contentId: 'cnt-9',
    content: { fileUrl: 'https://cdn.nexora.ao/creative-ai/job-77', type: 'VIDEO', name: 'Spot Nexora' },
  };
  const payload = playablePlaylistItems([builderItem]);

  check('item sobrevive a normalizacao', payload.length === 1);
  check('URL extraido do content.fileUrl', payload[0].mediaUrl === 'https://cdn.nexora.ao/creative-ai/job-77');
  check('tipo VIDEO respeitado (video sem extensao)', payload[0].type === 'VIDEO', payload[0].type);
  check('nome do content propagado', payload[0].name === 'Spot Nexora');

  check('stripUrlDecorations remove query e hash', stripUrlDecorations('a.mp4?x=1#y') === 'a.mp4');
}

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n  ${passed} verificacoes passaram, ${failures.length} falharam`);
if (failures.length > 0) {
  failures.forEach((f) => console.log(`   FALHOU: ${f}`));
  process.exit(1);
}
console.log('  Deteccao de tipo de midia e extracao de URL correctas.\n');
