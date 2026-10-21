export interface AngolaBank {
  code: string;
  name: string;
  fullName: string;
}

export const ANGOLA_BANKS: AngolaBank[] = [
  { code: '0040', name: 'BAI', fullName: 'BAI - Banco Angolano de Investimentos' },
  { code: '0006', name: 'BFA', fullName: 'BFA - Banco de Fomento Angola' },
  { code: '0051', name: 'BIC', fullName: 'BIC - Banco BIC Angola' },
  { code: '0010', name: 'BPC', fullName: 'BPC - Banco de Poupança e Crédito' },
  { code: '0044', name: 'Banco Sol', fullName: 'Banco Sol' },
  { code: '0055', name: 'Millennium Atlântico', fullName: 'Banco Millennium Atlântico (BMA)' },
  { code: '0054', name: 'Standard Bank', fullName: 'Standard Bank de Angola' },
  { code: '0045', name: 'Banco Keve', fullName: 'Banco Keve' },
  { code: '0043', name: 'Banco Económico', fullName: 'Banco Económico' },
  { code: '0005', name: 'BCI', fullName: 'BCI - Banco de Comércio e Indústria' },
  { code: '0058', name: 'Banco Yetu', fullName: 'Banco Yetu' },
  { code: '0059', name: 'Banco Valor', fullName: 'Banco Valor' },
  { code: '0060', name: 'BCH', fullName: 'Banco Comercial do Huambo' },
  { code: '0056', name: 'Finibanco', fullName: 'Finibanco Angola' },
  { code: '0000', name: 'Outro', fullName: 'Outro Banco Comercial (BNA)' },
];

export function formatAngolaIban(raw: string): string {
  const clean = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  // Ensure starts with AO06
  let formatted = clean;
  if (!formatted.startsWith('AO06') && formatted.length > 0) {
    if (formatted.startsWith('AO')) formatted = 'AO06' + formatted.slice(2);
    else formatted = 'AO06' + formatted;
  }
  // Group into 4s
  return formatted.match(/.{1,4}/g)?.join(' ') || formatted;
}
