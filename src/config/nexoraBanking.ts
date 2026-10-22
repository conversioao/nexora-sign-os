import { useState, useEffect, useCallback } from 'react';

/**
 * Coordenadas bancárias OFICIAIS da Nexora para liquidação em Kwanzas.
 * Suporta armazenamento dinâmico via PostgreSQL com fallback para os valores padrão.
 */
export interface BankingDetails {
  beneficiary: string;
  bankName: string;
  iban: string;
  multicaixaReference: string;
  entity: string;
  currency: string;
  swift?: string;
  accountNumber?: string;
  notes?: string;
}

export const NEXORA_BANKING: BankingDetails = {
  beneficiary: 'NEXORA MEDIA ANGOLA LDA',
  bankName: 'Banco Angolano de Investimentos (BAI)',
  iban: 'AO06 0040 0000 9283 1829 1014 9',
  multicaixaReference: '928 391 002',
  entity: '00921',
  currency: 'Kwanza (AOA)',
  swift: 'BAIAOALU',
  accountNumber: '9283182910149',
  notes: 'Após a transferência, anexe o comprovativo com identificação do NIF ou nome da sua organização para validação e ativação da conta.',
};

let cachedBankingDetails: BankingDetails = { ...NEXORA_BANKING };

export async function fetchGlobalBankingDetails(): Promise<BankingDetails> {
  try {
    const res = await fetch('/api/settings/bank-details');
    if (res.ok) {
      const data = await res.json();
      cachedBankingDetails = { ...NEXORA_BANKING, ...data };
      return cachedBankingDetails;
    }
  } catch (err) {
    console.warn('⚠️ [NexoraBanking] Falha ao carregar coordenadas dinâmicas, usando cache:', err);
  }
  return cachedBankingDetails;
}

export async function saveGlobalBankingDetails(
  details: Partial<BankingDetails>
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/settings/bank-details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });
    if (res.ok) {
      const result = await res.json();
      if (result.bankDetails) {
        cachedBankingDetails = { ...cachedBankingDetails, ...result.bankDetails };
      }
      return { success: true };
    }
    const errData = await res.json().catch(() => ({}));
    return { success: false, error: errData.error || 'Erro ao guardar dados bancários' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro de rede' };
  }
}

export function useNexoraBanking() {
  const [banking, setBanking] = useState<BankingDetails>(cachedBankingDetails);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const data = await fetchGlobalBankingDetails();
    setBanking(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { banking, loading, reload };
}
