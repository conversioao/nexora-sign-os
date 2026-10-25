/**
 * Aritmética de créditos do Nexora Creative AI.
 *
 * Módulo deliberadamente PURO (sem base de dados, sem HTTP, sem React) porque é
 * aqui que um erro passa despercebido: um sinal trocado não rebenta nada, apenas
 * corrompe saldos em silêncio. É a única definição da regra de sinal em todo o
 * sistema — o serviço do servidor, as rotas e a interface usam todos esta
 * função, pelo que o ecrã nunca discorda do que ficou gravado.
 *
 * Vive em `src/lib` (partilhado) e não em `src/server` precisamente por ser
 * consumido dos dois lados.
 */

export type AICreditTransactionType =
  | 'PURCHASE'
  | 'GRANT'
  | 'USAGE'
  | 'REFUND'
  | 'ADJUSTMENT'
  | 'EXPIRATION';

/** Tipos que aumentam o saldo. */
export const ADDITIVE_CREDIT_TYPES: AICreditTransactionType[] = ['PURCHASE', 'GRANT', 'REFUND'];

/** Tipos que reduzem o saldo. */
export const SUBTRACTIVE_CREDIT_TYPES: AICreditTransactionType[] = ['USAGE', 'EXPIRATION'];

/**
 * Converte (tipo, valor) no delta COM SINAL a somar ao saldo.
 *
 * Compatibilidade preservada com o repositório antigo:
 *   PURCHASE / GRANT / REFUND → somam a magnitude
 *   USAGE / EXPIRATION        → subtraem a magnitude
 *
 * ADJUSTMENT é o único tipo em que o SINAL DO PRÓPRIO VALOR decide, para
 * permitir correcções negativas (o repositório antigo só conseguia somar).
 */
export function signedCreditDelta(type: AICreditTransactionType, amount: number): number {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    throw new Error(`Valor de créditos inválido: ${amount}`);
  }
  const magnitude = Math.abs(numeric);

  if (type === 'ADJUSTMENT') return numeric < 0 ? -magnitude : magnitude;
  if (ADDITIVE_CREDIT_TYPES.includes(type)) return magnitude;
  if (SUBTRACTIVE_CREDIT_TYPES.includes(type)) return -magnitude;

  throw new Error(`Tipo de transacção de créditos desconhecido: ${type}`);
}

/** True se o tipo representa consumo (para relatórios de "créditos gastos"). */
export function isConsumptionType(type: AICreditTransactionType): boolean {
  return SUBTRACTIVE_CREDIT_TYPES.includes(type);
}

/** True se o tipo representa entrada de créditos (compra, oferta, estorno). */
export function isFundingType(type: AICreditTransactionType): boolean {
  return ADDITIVE_CREDIT_TYPES.includes(type) || type === 'ADJUSTMENT';
}

/**
 * Saldo resultante. Recusa saldo negativo — nunca se gasta o que não existe.
 */
export function applyDelta(currentBalance: number, delta: number): number {
  const next = Number(currentBalance) + Number(delta);
  if (next < 0) {
    throw new Error(
      `Créditos insuficientes. Saldo actual: ${Number(currentBalance)} cr, necessário: ${Math.abs(delta)} cr.`
    );
  }
  return next;
}
