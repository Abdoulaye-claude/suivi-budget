const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});

export function formatAmount(value: number): string {
  return currencyFormatter.format(value);
}
