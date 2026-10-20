/**
 * adminUserService — cliente da gestão de administradores.
 *
 * A chave de administração é exigida pelo SERVIDOR em cada pedido
 * (`x-nexora-admin-key`). É guardada em `sessionStorage` — e não em
 * `localStorage` — para que desapareça ao fechar o separador e não fique
 * gravada de forma permanente num computador partilhado.
 */
import { Role } from '../../../types/auth';

const BASE = '/api/admin-users';
const KEY_STORAGE = 'nexora_admin_key';

export interface AdminUserRow {
  id: string;
  email: string;
  fullName: string;
  role: Role | string;
  organizationId: string;
  organizationName: string | null;
  organizationType: string | null;
  createdAt: string | null;
  hasPassword: boolean;
  /** false = conta antiga com password em texto simples (deve ser redefinida). */
  passwordIsHashed: boolean;
}

export interface NewAdminUser {
  email: string;
  fullName: string;
  role: string;
  organizationId: string;
  password: string;
  confirmPlatformAdmin?: boolean;
}

export class AdminUserApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminUserApiError';
    this.status = status;
  }
}

// ─── Chave de administração ──────────────────────────────────────────────────

export const getAdminKey = (): string => {
  try {
    return sessionStorage.getItem(KEY_STORAGE) || '';
  } catch {
    return '';
  }
};

export const setAdminKey = (key: string): void => {
  try {
    if (key) sessionStorage.setItem(KEY_STORAGE, key);
    else sessionStorage.removeItem(KEY_STORAGE);
  } catch {}
};

export const clearAdminKey = (): void => setAdminKey('');

// ─── Pedidos ─────────────────────────────────────────────────────────────────

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const key = getAdminKey();

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(key ? { 'x-nexora-admin-key': key } : {}),
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new AdminUserApiError(
      'Não foi possível contactar o servidor. Confirme que o backend está em execução.',
      0
    );
  }

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    // Uma chave inválida deve ser esquecida, para o formulário voltar a pedi-la
    if (res.status === 401 || res.status === 403) clearAdminKey();
    throw new AdminUserApiError(data?.error || `Operação falhou (HTTP ${res.status}).`, res.status);
  }
  return data as T;
}

export const adminUserService = {
  list(): Promise<AdminUserRow[]> {
    return api<AdminUserRow[]>('/');
  },

  create(input: NewAdminUser): Promise<AdminUserRow> {
    return api<AdminUserRow>('/', { method: 'POST', body: JSON.stringify(input) });
  },

  update(
    id: string,
    patch: {
      role?: string;
      organizationId?: string;
      fullName?: string;
      password?: string;
      confirmPlatformAdmin?: boolean;
    }
  ): Promise<AdminUserRow> {
    return api<AdminUserRow>(`/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  remove(id: string): Promise<{ success: boolean; id: string }> {
    return api<{ success: boolean; id: string }>(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};

/** Organizações disponíveis para associar (endpoint público já existente). */
export async function fetchOrganizations(): Promise<
  { id: string; name: string; type: string }[]
> {
  try {
    const res = await fetch('/api/organizations');
    if (!res.ok) return [];
    const rows = await res.json();
    return Array.isArray(rows)
      ? rows.map((o: any) => ({ id: o.id, name: o.name, type: o.type }))
      : [];
  } catch {
    return [];
  }
}

/**
 * Gera uma password aleatória forte para entregar ao novo administrador.
 * Usa `crypto.getRandomValues` (disponível no browser) em vez de Math.random.
 */
export function generateStrongPassword(length = 16): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}
