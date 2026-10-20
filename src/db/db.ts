import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Ligação à base de dados.
 *
 * A cadeia de ligação vem EXCLUSIVAMENTE de `DATABASE_URL` (ficheiro `.env`,
 * que está no `.gitignore`). Antes existia aqui uma credencial em texto simples
 * como valor de recurso — ficava no código-fonte, em qualquer cópia do
 * repositório e em bundles. Foi removida.
 *
 * Falhar de imediato com uma mensagem accionável é preferível a ligar em
 * silêncio à base de dados errada: sem `DATABASE_URL` o servidor não arranca.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString || connectionString.trim() === '') {
  console.error(
    [
      '',
      '❌ DATABASE_URL não está definida.',
      '',
      '   A aplicação já não traz uma credencial de recurso no código.',
      '   Crie um ficheiro .env na raiz do projecto (o .env.example tem o modelo):',
      '',
      '     DATABASE_URL="postgres://utilizador:password@servidor:5432/base?sslmode=disable"',
      '',
      '   Nota: se a password contiver caracteres especiais (@, :, /, #), tem de',
      '   ser codificada em URL (ex.: @ → %40).',
      '',
    ].join('\n')
  );
  // Termina aqui: continuar sem base de dados só produziria erros confusos
  process.exit(1);
}

export const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('sslmode=disable') ? false : { rejectUnauthorized: false },

  // ─── Resiliência da ligação ────────────────────────────────────────────────
  // O servidor de base de dados é remoto e o log do backend já mostrou
  // "connect ETIMEDOUT 2.29.29.242:5432". Sem estes limites, uma tentativa de
  // ligação ficava pendurada indefinidamente e o pedido HTTP nunca respondia —
  // o utilizador via um painel eternamente "a carregar" em vez de um erro.
  max: 10,
  // 25s de timeout de conexão para absorver latência de rede em DB remota
  connectionTimeoutMillis: 25_000,
  idleTimeoutMillis: 30_000,
  // Mantém os sockets vivos: reduz as falhas por NAT/firewall a meio do percurso
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
  // Uma consulta presa não pode bloquear uma ligação do pool para sempre
  query_timeout: 30_000,
  statement_timeout: 30_000,
});

/**
 * Erros de clientes inactivos são emitidos no pool, não na promessa da consulta.
 * Sem este handler, uma queda de rede pode terminar o processo do servidor.
 */
pool.on('error', (err) => {
  console.error('⚠️ [DB] Erro num cliente inactivo do pool:', err.message);
});

/**
 * Confirma a ligação no arranque, para que uma falha de rede apareça no log como
 * uma mensagem clara em vez de rebentar mais tarde, a meio de um pedido.
 */
export async function verifyDatabaseConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await pool.query('SELECT 1 AS ok');
    if (res.rows[0]?.ok === 1) {
      return { ok: true, message: 'Ligação à base de dados estabelecida.' };
    }
    return { ok: false, message: 'A base de dados respondeu de forma inesperada.' };
  } catch (error: any) {
    const code = error?.code ? ` [${error.code}]` : '';
    return {
      ok: false,
      message:
        `Não foi possível ligar à base de dados${code}: ${error?.message || error}. ` +
        'Se for ETIMEDOUT/ENOTFOUND, o servidor PostgreSQL está inacessível a partir daqui — ' +
        'verifique a rede, a firewall ou se DATABASE_URL aponta para o host certo.',
    };
  }
}

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
};
