/**
 * Testes dos níveis de acesso.
 *
 * O que aqui se verifica é sobretudo SEGURANÇA: que um nível restrito não ganha
 * permissões a mais por acidente, e que os níveis semeados correspondem
 * exactamente ao que o nome promete.
 *
 * Executar: npx tsx src/lib/accessLevels.test.ts
 */
import {
  ACCESS_GROUPS,
  ACCESS_GROUP_BY_ID,
  permissionsForGroups,
  permissionsForBuiltInLevel,
  BUILT_IN_ACCESS_LEVELS,
  allKnownPermissions,
  groupsContainingPermission,
} from './accessLevels';

let passed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) passed += 1;
  else failures.push(`${name}${detail === undefined ? '' : ` -> ${JSON.stringify(detail)}`}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Integridade do catálogo
// ─────────────────────────────────────────────────────────────────────────────
{
  const ids = ACCESS_GROUPS.map((g) => g.id);
  check('ids de grupos sao unicos', new Set(ids).size === ids.length, ids);
  check('todos os grupos tem rotulo', ACCESS_GROUPS.every((g) => g.label.length > 0));
  check('todos os grupos tem pelo menos 1 permissao', ACCESS_GROUPS.every((g) => g.permissions.length > 0));
  check('existe o grupo de gestao de negocios', 'sign.business' in ACCESS_GROUP_BY_ID);
  check('existe o grupo do painel Creative AI', 'creative.admin' in ACCESS_GROUP_BY_ID);
  check('existe o grupo de administracao da plataforma', 'platform.root' in ACCESS_GROUP_BY_ID);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. União de grupos
// ─────────────────────────────────────────────────────────────────────────────
{
  check('sem grupos -> sem permissoes', permissionsForGroups([]).length === 0);
  check('grupo desconhecido e ignorado', permissionsForGroups(['nao-existe']).length === 0);

  const business = permissionsForGroups(['sign.business']);
  check('gestao de negocios concede clientes', business.includes('customers.read'));
  check('gestao de negocios concede contratos', business.includes('contracts.manage'));
  check('gestao de negocios concede financeiro', business.includes('billing.manage'));
  check('gestao de negocios concede planos', business.includes('plans.manage'));

  // O ponto central do pedido: um funcionário comercial NAO deve poder mexer em
  // displays, conteudos nem programacao.
  check('gestao de negocios NAO concede displays', !business.includes('displays.read'));
  check('gestao de negocios NAO concede conteudos', !business.includes('content.create'));
  check('gestao de negocios NAO concede playlists', !business.includes('playlists.update'));
  check('gestao de negocios NAO concede programacao', !business.includes('schedules.create'));
  check('gestao de negocios NAO concede admin da plataforma', !business.includes('platform.admin'));
  check('gestao de negocios NAO concede painel Creative AI', !business.includes('creativeadmin.access'));

  // Sem duplicados quando os grupos se sobrepoem
  const both = permissionsForGroups(['sign.business', 'sign.organization']);
  check('uniao sem repeticoes', new Set(both).size === both.length, both.length);
  check('uniao junta os dois grupos', both.includes('customers.read') && both.includes('users.manage'));
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Os níveis semeados dizem o que fazem
// ─────────────────────────────────────────────────────────────────────────────
{
  const superAdmin = permissionsForBuiltInLevel('lvl-super-admin');
  check('Administrador Geral existe', superAdmin !== null);
  check('Administrador Geral tem plataforma', Boolean(superAdmin?.includes('platform.admin')));
  check('Administrador Geral tem displays', Boolean(superAdmin?.includes('displays.read')));
  check('Administrador Geral tem Creative AI', Boolean(superAdmin?.includes('creativeadmin.access')));
  check(
    'Administrador Geral tem TODAS as permissions conhecidas',
    allKnownPermissions().every((p) => superAdmin?.includes(p)),
    allKnownPermissions().filter((p) => !superAdmin?.includes(p))
  );

  const businessLevel = permissionsForBuiltInLevel('lvl-business-manager');
  check('Gestor de Negocios existe', businessLevel !== null);
  check('Gestor de Negocios tem clientes', Boolean(businessLevel?.includes('customers.manage')));
  check('Gestor de Negocios NAO tem displays (e o que o nome promete)', !businessLevel?.includes('displays.read'));
  check('Gestor de Negocios NAO tem conteudos', !businessLevel?.includes('content.create'));
  check('Gestor de Negocios NAO tem Creative AI', !businessLevel?.includes('creativeadmin.access'));
  check('Gestor de Negocios NAO e admin da plataforma', !businessLevel?.includes('platform.admin'));

  const creativeAdmin = permissionsForBuiltInLevel('lvl-creative-admin');
  check('Admin Creative AI existe', creativeAdmin !== null);
  check('Admin Creative AI tem acesso ao painel', Boolean(creativeAdmin?.includes('creativeadmin.access')));
  check('Admin Creative AI aprova creditos', Boolean(creativeAdmin?.includes('creativeadmin.credits')));
  check('Admin Creative AI gere pacotes', Boolean(creativeAdmin?.includes('creativeadmin.packages')));
  check('Admin Creative AI NAO tem gestao de negocios', !creativeAdmin?.includes('customers.read'));
  check('Admin Creative AI NAO tem displays', !creativeAdmin?.includes('displays.read'));
  check('Admin Creative AI NAO e admin da plataforma', !creativeAdmin?.includes('platform.admin'));

  const creativeViewer = permissionsForBuiltInLevel('lvl-creative-viewer');
  check('Observador tem acesso ao painel', Boolean(creativeViewer?.includes('creativeadmin.access')));
  check('Observador NAO aprova creditos', !creativeViewer?.includes('creativeadmin.credits'));
  check('Observador NAO gere pacotes', !creativeViewer?.includes('creativeadmin.packages'));

  const operations = permissionsForBuiltInLevel('lvl-operations');
  check('Operador de Rede tem displays', Boolean(operations?.includes('displays.read')));
  check('Operador de Rede NAO tem financeiro', !operations?.includes('billing.manage'));
  check('Operador de Rede NAO tem contratos', !operations?.includes('contracts.manage'));

  check('nivel desconhecido devolve null', permissionsForBuiltInLevel('nao-existe') === null);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Coerência: nenhum nível restrito ganha acesso à administração
// ─────────────────────────────────────────────────────────────────────────────
{
  const restrictive = BUILT_IN_ACCESS_LEVELS.filter((l) => l.id !== 'lvl-super-admin');
  for (const level of restrictive) {
    const perms = permissionsForGroups(level.groups) as string[];
    check(
      `"${level.name}" nao concede administracao da plataforma`,
      !perms.includes('platform.admin') && !perms.includes('platform.all')
    );
  }

  // Só o nível de administração contém o grupo platform.root
  const withRoot = BUILT_IN_ACCESS_LEVELS.filter((l) => l.groups.includes('platform.root'));
  check('apenas um nivel semeado tem platform.root', withRoot.length === 1, withRoot.map((l) => l.id));
  check('e esse e o Administrador Geral', withRoot[0]?.id === 'lvl-super-admin');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Reconstrução inversa (usada pela UI para mostrar os grupos de um nível)
// ─────────────────────────────────────────────────────────────────────────────
{
  const groups = groupsContainingPermission('customers.read');
  check('clientes pertence a gestao de negocios', groups.includes('sign.business'), groups);
  check('platform.admin so pertence ao grupo de plataforma',
    groupsContainingPermission('platform.admin').join() === 'platform.root',
    groupsContainingPermission('platform.admin'));

  check('todos os niveis semeados tem grupos validos',
    BUILT_IN_ACCESS_LEVELS.every((l) => l.groups.every((g) => g in ACCESS_GROUP_BY_ID)));
  check('todos os niveis semeados tem nome e descricao',
    BUILT_IN_ACCESS_LEVELS.every((l) => l.name.length > 0 && l.description.length > 0));
}

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n  ${passed} verificacoes passaram, ${failures.length} falharam`);
if (failures.length > 0) {
  failures.forEach((f) => console.log(`   FALHOU: ${f}`));
  process.exit(1);
}
console.log('  Niveis de acesso corretamente separados e sem excesso de permissoes.\n');
