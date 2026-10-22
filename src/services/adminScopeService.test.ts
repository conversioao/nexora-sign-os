/**
 * Testes das categorias de administrador.
 *
 * Garantem a separação pedida: quem entra no admin GERAL (Nexora Sign) não ganha
 * acesso ao admin do Creative AI por acidente, e vice-versa. Também fixam a
 * regra de que `platform.all` é super-poder e abre ambos.
 *
 * Executar: npx tsx src/services/adminScopeService.test.ts
 */
import { Permission } from '../types/auth';
import { ROLES_REGISTRY } from './permissionService';
import {
  getAdminScopes,
  hasAdminScope,
  canAccessCreativeAdmin,
  describeAdminAccess,
  getVisibleCreativeAdminSections,
  getCreativeAdminAccessLevel,
  CREATIVE_ADMIN_SECTIONS,
  ADMIN_SCOPES,
} from './adminScopeService';

let passed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) passed += 1;
  else failures.push(`${name}${detail === undefined ? '' : ` -> ${JSON.stringify(detail)}`}`);
}

const perms = (role: keyof typeof ROLES_REGISTRY): Permission[] =>
  ROLES_REGISTRY[role].permissions as Permission[];

// ─────────────────────────────────────────────────────────────────────────────
// 1. Separação das duas categorias
// ─────────────────────────────────────────────────────────────────────────────
{
  const generalOnly: Permission[] = ['platform.admin'];
  check('platform.admin dá categoria GENERAL', hasAdminScope(generalOnly, 'GENERAL'));
  check('platform.admin NÃO dá categoria CREATIVE_AI', !hasAdminScope(generalOnly, 'CREATIVE_AI'));
  check('platform.admin sozinho não abre o painel Creative AI', !canAccessCreativeAdmin(generalOnly));

  const creativeOnly: Permission[] = ['creativeadmin.access'];
  check('creativeadmin.access dá categoria CREATIVE_AI', hasAdminScope(creativeOnly, 'CREATIVE_AI'));
  check('creativeadmin.access NÃO dá categoria GENERAL', !hasAdminScope(creativeOnly, 'GENERAL'));
  check('creativeadmin.access abre o painel Creative AI', canAccessCreativeAdmin(creativeOnly));

  check('sem permissões → nenhuma categoria', getAdminScopes([]).length === 0);
  check('sem permissões → sem acesso', !canAccessCreativeAdmin([]));
  check('sem permissões → etiqueta correta', describeAdminAccess([]) === 'Sem acesso a admin');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Super-poder `platform.all`
// ─────────────────────────────────────────────────────────────────────────────
{
  const superUser: Permission[] = ['platform.all'];
  check('platform.all abre o painel Creative AI', canAccessCreativeAdmin(superUser));
  check('platform.all dá ambas as categorias', getAdminScopes(superUser).length === ADMIN_SCOPES.length);
  check('platform.all é MANAGER', getCreativeAdminAccessLevel(superUser) === 'MANAGER');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Papéis reais do sistema
// ─────────────────────────────────────────────────────────────────────────────
{
  const admin = perms('NEXORA_ADMIN');
  check('NEXORA_ADMIN entra no admin geral', hasAdminScope(admin, 'GENERAL'));
  check('NEXORA_ADMIN entra no admin Creative AI', hasAdminScope(admin, 'CREATIVE_AI'));
  check('NEXORA_ADMIN vê todas as secções', getVisibleCreativeAdminSections(admin).length === CREATIVE_ADMIN_SECTIONS.length);
  check('NEXORA_ADMIN é MANAGER', getCreativeAdminAccessLevel(admin) === 'MANAGER');
  check('NEXORA_ADMIN: etiqueta combinada', describeAdminAccess(admin) === 'Admin Geral + Creative AI');

  const operator = perms('NEXORA_OPERATOR');
  check('NEXORA_OPERATOR entra no admin Creative AI', hasAdminScope(operator, 'CREATIVE_AI'));
  check('NEXORA_OPERATOR NÃO é admin geral', !hasAdminScope(operator, 'GENERAL'));
  check('NEXORA_OPERATOR é apenas VIEWER', getCreativeAdminAccessLevel(operator) === 'VIEWER', getCreativeAdminAccessLevel(operator));
  check('NEXORA_OPERATOR não pode aprovar créditos', !operator.includes('creativeadmin.credits'));
  check('NEXORA_OPERATOR não pode editar pacotes', !operator.includes('creativeadmin.packages'));
  check('NEXORA_OPERATOR: etiqueta Creative AI', describeAdminAccess(operator) === 'Admin Creative AI');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Papéis de cliente/anunciante NÃO ganham acesso por engano
// ─────────────────────────────────────────────────────────────────────────────
{
  const clientRoles = ['CLIENT_OWNER', 'CLIENT_MANAGER', 'CLIENT_EDITOR', 'ADVERTISER_OWNER', 'ADVERTISER_MANAGER', 'TECHNICIAN'] as const;
  for (const role of clientRoles) {
    const p = perms(role);
    check(`${role}: sem acesso ao admin Creative AI`, !canAccessCreativeAdmin(p));
    check(`${role}: sem secções`, getVisibleCreativeAdminSections(p).length === 0);
    check(`${role}: nível NONE`, getCreativeAdminAccessLevel(p) === 'NONE');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Filtragem das secções por permissão granular
// ─────────────────────────────────────────────────────────────────────────────
{
  const analyticsOnly: Permission[] = ['creativeadmin.access', 'creativeadmin.analytics'];
  const sections = getVisibleCreativeAdminSections(analyticsOnly).map((s) => s.id);
  check('vê Visão Geral', sections.includes('ca-overview'));
  check('vê Utilizadores', sections.includes('ca-users'));
  check('vê Consumo & Estilos', sections.includes('ca-analytics'));
  check('NÃO vê Gestão de Créditos', !sections.includes('ca-credits'));
  check('NÃO vê Aprovações', !sections.includes('ca-approvals'));
  check('NÃO vê Pacotes', !sections.includes('ca-packages'));

  const creditsOnly: Permission[] = ['creativeadmin.access', 'creativeadmin.credits'];
  const creditsSections = getVisibleCreativeAdminSections(creditsOnly).map((s) => s.id);
  check('créditos: vê Aprovações', creditsSections.includes('ca-approvals'));
  check('créditos: vê Gestão de Créditos', creditsSections.includes('ca-credits'));
  check('créditos: NÃO vê Pacotes (permissão separada)', !creditsSections.includes('ca-packages'));
  check('créditos: NÃO vê Analítica', !creditsSections.includes('ca-analytics'));
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Integridade das definições
// ─────────────────────────────────────────────────────────────────────────────
{
  const ids = CREATIVE_ADMIN_SECTIONS.map((s) => s.id);
  check('ids das secções são únicos', new Set(ids).size === ids.length, ids);
  check('existem 6 secções no painel', CREATIVE_ADMIN_SECTIONS.length === 6, CREATIVE_ADMIN_SECTIONS.length);
  check('existem exactamente 2 categorias de admin', ADMIN_SCOPES.length === 2, ADMIN_SCOPES.length);
  check(
    'todas as secções exigem uma permissão',
    CREATIVE_ADMIN_SECTIONS.every((s) => Boolean(s.requiredPermission))
  );
  check(
    'a 1.ª secção é acessível a quem só tem creativeadmin.access',
    getVisibleCreativeAdminSections(['creativeadmin.access']).some((s) => s.id === 'ca-overview')
  );
}

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n  ${passed} verificacoes passaram, ${failures.length} falharam`);
if (failures.length > 0) {
  failures.forEach((f) => console.log(`   FALHOU: ${f}`));
  process.exit(1);
}
console.log('  Categorias de admin corretamente separadas.\n');
