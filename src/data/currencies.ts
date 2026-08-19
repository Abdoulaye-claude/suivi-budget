export interface CurrencyOption {
  code: string;
  label: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'USD', label: 'USD — Dollar américain' },
  { code: 'GBP', label: 'GBP — Livre sterling' },
  { code: 'CHF', label: 'CHF — Franc suisse' },
  { code: 'CAD', label: 'CAD — Dollar canadien' },
  { code: 'JPY', label: 'JPY — Yen japonais' },
  { code: 'MAD', label: 'MAD — Dirham marocain' },
  { code: 'XOF', label: 'XOF — Franc CFA (Afrique de l\'Ouest)' },
  { code: 'XAF', label: 'XAF — Franc CFA (Afrique centrale)' },
];
