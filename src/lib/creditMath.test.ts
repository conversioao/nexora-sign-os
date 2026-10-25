/**
 * Testes da aritmética de créditos do Nexora Creative AI.
 *
 * Um sinal trocado aqui não produz erro visível: produz saldos errados em
 * silêncio. Estes testes fixam a regra e, em especial, a compatibilidade com a
 * semântica que os utilizadores já conheciam do repositório antigo.
 *
 * Executar: npx tsx src/lib/creditMath.test.ts
 */
import {
  signedCreditDelta,
  isConsumptionType,
  isFundingType,
  applyDelta,
  AICreditTransactionType,
} from './creditMath';

let passed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) passed += 1;
  else failures.push(`${name}${detail === undefined ? '' : ` -> ${JSON.stringify(detail)}`}`);
}

function expectDelta(type: AICreditTransactionType, amount: number, expected: number) {
  const actual = signedCreditDelta(type, amount);
  check(`${type}(${amount}) = ${expected}`, actual === expected, actual);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Compatibilidade com a semântica antiga (o que os utilizadores já conheciam)
// ─────────────────────────────────────────────────────────────────────────────
{
  expectDelta('PURCHASE', 1500, 1500);
  expectDelta('GRANT', 500, 500);
  expectDelta('REFUND', 8, 8);
  expectDelta('USAGE', 8, -8);
  expectDelta('EXPIRATION', 100, -100);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ADJUSTMENT: o sinal do valor decide
//    (o repositório antigo só conseguia SOMAR; o admin precisa de poder corrigir)
// ─────────────────────────────────────────────────────────────────────────────
{
  expectDelta('ADJUSTMENT', 250, 250);
  expectDelta('ADJUSTMENT', -250, -250);
  expectDelta('ADJUSTMENT', 0, 0);
  check('ajuste negativo debita de facto', signedCreditDelta('ADJUSTMENT', -100) < 0);
  check('ajuste positivo credita', signedCreditDelta('ADJUSTMENT', 100) > 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Robustez: nunca devolver NaN nem aceitar tipos desconhecidos
// ─────────────────────────────────────────────────────────────────────────────
{
  expectDelta('USAGE', -8, -8); // magnitude negativa → continua a subtrair 8
  expectDelta('GRANT', -500, 500); // magnitude negativa → continua a somar 500
  expectDelta('PURCHASE', 0, 0);

  let threw = false;
  try {
    signedCreditDelta('NAO_EXISTE' as any, 10);
  } catch {
    threw = true;
  }
  check('tipo desconhecido lança erro', threw);

  let threwNaN = false;
  try {
    signedCreditDelta('USAGE', NaN);
  } catch {
    threwNaN = true;
  }
  check('NaN lança erro em vez de corromper o saldo', threwNaN);

  let threwUndefined = false;
  try {
    signedCreditDelta('USAGE', undefined as any);
  } catch {
    threwUndefined = true;
  }
  check('valor em falta lança erro', threwUndefined);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Classificação para relatórios
// ─────────────────────────────────────────────────────────────────────────────
{
  check('USAGE é consumo', isConsumptionType('USAGE'));
  check('EXPIRATION é consumo', isConsumptionType('EXPIRATION'));
  check('PURCHASE não é consumo', !isConsumptionType('PURCHASE'));
  check('REFUND não é consumo', !isConsumptionType('REFUND'));
  check('ADJUSTMENT não é consumo (pode ser dos dois)', !isConsumptionType('ADJUSTMENT'));

  check('PURCHASE é entrada', isFundingType('PURCHASE'));
  check('GRANT é entrada', isFundingType('GRANT'));
  check('ADJUSTMENT conta como entrada (sinal decide)', isFundingType('ADJUSTMENT'));
  check('USAGE não é entrada', !isFundingType('USAGE'));
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. applyDelta: o saldo nunca fica negativo
// ─────────────────────────────────────────────────────────────────────────────
{
  check('5000 - 8 = 4992', applyDelta(5000, -8) === 4992);
  check('0 + 500 = 500', applyDelta(0, 500) === 500);
  check('saldo exacto a zero é permitido', applyDelta(8, -8) === 0);

  let threw = false;
  try {
    applyDelta(5, -8);
  } catch (e: any) {
    threw = true;
    check('mensagem explica o que faltou', String(e.message).includes('insuficientes'), e.message);
  }
  check('gastar mais do que existe é recusado', threw);

  let threwNegative = false;
  try {
    applyDelta(0, -1);
  } catch {
    threwNegative = true;
  }
  check('nunca produz saldo negativo', threwNegative);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Sequência real de um ciclo de geração (débito → reembolso por falha)
// ─────────────────────────────────────────────────────────────────────────────
{
  let balance = 100;
  balance = applyDelta(balance, signedCreditDelta('USAGE', 8));
  check('após gerar: 92', balance === 92, balance);

  // Falha → reembolso exactamente do que foi cobrado (antes eram 10 cr fixos)
  balance = applyDelta(balance, signedCreditDelta('REFUND', 8));
  check('após reembolso: 100 (volta ao original)', balance === 100, balance);

  // Ciclo completo de compra aprovada
  balance = applyDelta(balance, signedCreditDelta('PURCHASE', 1500));
  check('após compra aprovada: 1600', balance === 1600, balance);

  // Ajuste de correcção do admin
  balance = applyDelta(balance, signedCreditDelta('ADJUSTMENT', -600));
  check('após ajuste negativo: 1000', balance === 1000, balance);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n  ${passed} verificacoes passaram, ${failures.length} falharam`);
if (failures.length > 0) {
  failures.forEach((f) => console.log(`   FALHOU: ${f}`));
  process.exit(1);
}
console.log('  Aritmetica de creditos correta e compativel com o comportamento anterior.\n');
