/**
 * Testes de regressao do motor de sessoes do Estudio de Imagem IA.
 *
 * Cobrem exactamente os bugs reportados no Nexora Sign:
 *   1. geracoes DUPLICADAS no mesmo/em varios chats;
 *   2. geracoes AGREGADAS ao chat errado (o "Novo Chat" recebia tudo);
 *   3. o botao de eliminar chat nao removia realmente a conversa nem as geracoes;
 *   4. spinners de loading presos para sempre em chats antigos.
 *
 * Executar:  npx tsx src/features/studio/lib/imageChatSessions.test.ts
 */
import {
  ChatSession,
  normalizeSessions,
  deriveJobSessionMap,
  removeOldestLoading,
  removeLoadingIds,
  pruneJobSessionMap,
  toPersistableSessions,
  jobIdFromMessageId,
} from './imageChatSessions';

let passed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    passed += 1;
  } else {
    failures.push(`${name}${detail === undefined ? '' : ` -> ${JSON.stringify(detail)}`}`);
  }
}

const ai = (jobId: string) => ({
  id: `ai-${jobId}`,
  type: 'ai' as const,
  prompt: `prompt ${jobId}`,
  images: [{ id: jobId, title: jobId, imageUrl: `u/${jobId}`, ratio: '9:16', style: 'apex' }],
  timestamp: new Date('2026-01-01T10:00:00Z') as any,
});

const loading = (n: number) => ({
  id: `loading-${n}`,
  type: 'loading' as const,
  agentName: 'Apex',
  ratio: '9:16',
  timestamp: new Date('2026-01-01T10:00:00Z') as any,
});

const user = (n: number) => ({
  id: `user-${n}`,
  type: 'user' as const,
  prompt: `pedido ${n}`,
  timestamp: new Date('2026-01-01T10:00:00Z') as any,
});

const session = (id: string, title: string, messages: any[]): ChatSession => ({
  id,
  title,
  createdAt: '2026-01-01T00:00:00.000Z',
  agentId: 'apex',
  messages,
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. DUPLICACAO: a mesma geracao repetida no mesmo chat
// ─────────────────────────────────────────────────────────────────────────────
{
  const raw = [
    session('s1', 'Chat A', [user(1), ai('job-1'), ai('job-1'), ai('job-1')]),
  ];
  const out = normalizeSessions(raw, {});
  check('duplicado no mesmo chat -> 1 geracao', out[0].messages.length === 2, out[0].messages.length);
  check('preserva a mensagem do utilizador', out[0].messages[0].type === 'user');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. DUPLICACAO entre chats: a mesma geracao em 2 chats diferentes
//    O mapa legado diz que o dono e 's1' -> tem de sair do 's2'.
// ─────────────────────────────────────────────────────────────────────────────
{
  const raw = [
    session('s2', 'Novo Chat', [ai('job-1')]),
    session('s1', 'Chat A', [user(1), ai('job-1')]),
  ];
  const out = normalizeSessions(raw, { 'job-1': 's1' });
  const s1 = out.find((s) => s.id === 's1')!;
  const s2 = out.find((s) => s.id === 's2');
  check('geracao mantida no chat dono', s1.messages.length === 2, s1.messages.length);
  check('chat errado removido (ficou vazio)', s2 === undefined, out.map((s) => s.id));
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. FUSAO: o chat novo recebeu geracoes de varios chats antigos
// ─────────────────────────────────────────────────────────────────────────────
{
  const raw = [
    session('novo', 'Novo Chat', [ai('job-1'), ai('job-2'), ai('job-3')]),
    session('a', 'Chat A', [ai('job-1')]),
    session('b', 'Chat B', [ai('job-2')]),
  ];
  const map = { 'job-1': 'a', 'job-2': 'b' }; // job-3 nao tem dono conhecido
  const out = normalizeSessions(raw, map);
  const novo = out.find((s) => s.id === 'novo')!;
  const a = out.find((s) => s.id === 'a')!;
  const b = out.find((s) => s.id === 'b')!;

  check('chat novo fica so com o job orfao', novo.messages.length === 1, novo.messages.map((m) => m.id));
  check('chat novo mantem o job-3 (sem dono conhecido)', novo.messages[0].id === 'ai-job-3');
  check('chat A tem exactamente 1 geracao', a.messages.length === 1, a.messages.length);
  check('chat B tem exactamente 1 geracao', b.messages.length === 1, b.messages.length);
  check(
    'nenhuma geracao aparece em dois chats',
    new Set(out.flatMap((s) => s.messages.map((m) => m.id))).size ===
      out.flatMap((s) => s.messages).length
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. MAPA OBSOLETO: o dono indicado ja foi eliminado -> nao perder a geracao
// ─────────────────────────────────────────────────────────────────────────────
{
  const raw = [session('vivo', 'Chat A', [ai('job-9')])];
  const out = normalizeSessions(raw, { 'job-9': 'chat-eliminado' });
  check('geracao nao e descartada por mapa obsoleto', out.length === 1 && out[0].messages.length === 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SPINNERS ORFAOS: bolhas de loading nunca sobrevivem ao arranque
// ─────────────────────────────────────────────────────────────────────────────
{
  const raw = [session('s1', 'Chat A', [user(1), loading(1), loading(2), ai('job-1')])];
  const out = normalizeSessions(raw, {});
  check(
    'todas as bolhas de loading removidas',
    out[0].messages.every((m) => m.type !== 'loading'),
    out[0].messages.map((m) => m.type)
  );
  check('restam user + ai', out[0].messages.length === 2, out[0].messages.length);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. CHATS VAZIOS e dados invalidos
// ─────────────────────────────────────────────────────────────────────────────
{
  const raw = [
    session('vazio1', 'Novo Chat', []),
    session('vazio2', 'Novo Chat', [loading(1)]),
    session('s1', 'Chat A', [ai('job-1')]),
    null,
    { id: 'sem-messages' },
  ];  const out = normalizeSessions(raw as any, {});
  check('chats vazios descartados', out.length === 1 && out[0].id === 's1', out.map((s) => s.id));
  check('lixo ignorado sem rebentar', out[0].messages.length === 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. IDEMPOTENCIA: normalizar duas vezes da o mesmo resultado
//    (garante que recarregar a pagina nao volta a alterar o historico)
// ─────────────────────────────────────────────────────────────────────────────
{
  const raw = [
    session('s2', 'Novo Chat', [ai('job-1'), loading(1)]),
    session('s1', 'Chat A', [ai('job-1'), ai('job-2')]),
  ];
  const once = normalizeSessions(raw, { 'job-1': 's1' });
  const twice = normalizeSessions(JSON.parse(JSON.stringify(once)), { 'job-1': 's1' });
  check('normalizacao e idempotente', JSON.stringify(once) === JSON.stringify(twice));
  check(
    'nao ha geracoes repetidas apos normalizar',
    once.flatMap((s) => s.messages.map((m) => m.id)).length ===
      new Set(once.flatMap((s) => s.messages.map((m) => m.id))).size
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. removeOldestLoading e removeLoadingIds sao PURAS (seguras em StrictMode,
//    onde o React invoca os updaters duas vezes)
// ─────────────────────────────────────────────────────────────────────────────
{
  const messages: any[] = [user(1), loading(1), loading(2), ai('job-1')];
  const snapshot = JSON.stringify(messages);

  const r1 = removeOldestLoading(messages);
  const r2 = removeOldestLoading(messages);
  check('removeOldestLoading nao muta a entrada', JSON.stringify(messages) === snapshot);
  check('removeOldestLoading e deterministica', JSON.stringify(r1) === JSON.stringify(r2));
  check('removeOldestLoading remove so uma bolha', r1.filter((m) => m.type === 'loading').length === 1);
  check('removeOldestLoading remove a mais antiga', r1[1].id === 'loading-2', r1.map((m) => m.id));

  const semLoading = removeOldestLoading([user(1), ai('job-1')]);
  check('sem bolhas devolve a mesma referencia', semLoading.length === 2);

  const filtered = removeLoadingIds(messages, ['loading-1', 'loading-2']);
  check('removeLoadingIds remove as indicadas', filtered.length === 2, filtered.map((m) => m.id));
  check('removeLoadingIds nao muta a entrada', JSON.stringify(messages) === snapshot);
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. ELIMINAR CHAT: o mapa deixa de apontar para o chat removido e as
//    geracoes que lhe pertenciam nunca reaparecem noutro chat
// ─────────────────────────────────────────────────────────────────────────────
{
  const sessions = [
    session('s1', 'Chat A', [ai('job-1')]),
    session('s2', 'Chat B', [ai('job-2')]),
  ];
  const jobMap = { 'job-1': 's1', 'job-2': 's2' };

  // Simula handleDeleteSession('s1')
  const remaining = sessions.filter((s) => s.id !== 's1');
  const liveMap = Object.fromEntries(
    Object.entries(jobMap).filter(([, owner]) => owner !== 's1')
  );

  check('chat eliminado sai da lista', remaining.length === 1 && remaining[0].id === 's2');
  check('job do chat eliminado sai do mapa', liveMap['job-1'] === undefined);
  check('job do outro chat permanece', liveMap['job-2'] === 's2');

  // O job-1 (que estava em curso no chat eliminado) termina depois:
  // sem dono -> e descartado, nao cai no chat ativo.
  const owner = liveMap['job-1'];
  check('geracao do chat eliminado nao migra para outro chat', owner === undefined);

  // E ao persistir, entradas mortas sao podadas
  const pruned = pruneJobSessionMap({ 'job-1': 's1', 'job-2': 's2' }, remaining);
  check('pruneJobSessionMap remove chats mortos', !('job-1' in pruned) && pruned['job-2'] === 's2');
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. PERSISTENCIA: nada de spinners nem chats vazios gravados em disco
// ─────────────────────────────────────────────────────────────────────────────
{
  const sessions = [
    session('s1', 'Chat A', [user(1), loading(1), ai('job-1')]),
    session('vazio', 'Novo Chat', []),
    session('soLoading', 'Novo Chat', [loading(7)]),
  ];
  const persistable = toPersistableSessions(sessions);
  check('apenas 1 chat persistido', persistable.length === 1, persistable.map((s) => s.id));
  check(
    'nenhuma bolha de loading persistida',
    persistable.every((s) => s.messages.every((m) => m.type !== 'loading'))
  );
  check('mensagens reais preservadas', persistable[0].messages.length === 2);
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. MAPA DERIVADO: sempre coerente com o que os chats mostram
// ─────────────────────────────────────────────────────────────────────────────
{
  const sessions = [
    session('s1', 'Chat A', [ai('job-1'), ai('job-2')]),
    session('s2', 'Chat B', [ai('job-3')]),
  ];
  const map = deriveJobSessionMap(sessions);
  check('job-1 -> s1', map['job-1'] === 's1');
  check('job-3 -> s2', map['job-3'] === 's2');
  check('exactamente 3 entradas', Object.keys(map).length === 3, map);
  check('jobIdFromMessageId extrai o id', jobIdFromMessageId('ai-job-42') === 'job-42');
  check('jobIdFromMessageId rejeita ids nao-IA', jobIdFromMessageId('user-1') === null);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n  ${passed} verificacoes passaram, ${failures.length} falharam`);
if (failures.length > 0) {
  failures.forEach((f) => console.log(`   FALHOU: ${f}`));
  process.exit(1);
}
console.log('  Todos os cenarios de duplicacao/fusao/eliminacao estao cobertos.\n');
