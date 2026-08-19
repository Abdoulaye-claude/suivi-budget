const formatterCache = new Map<string, Intl.NumberFormat>();

export function formatAmount(value: number, currency = 'EUR'): string {
  let formatter = formatterCache.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency });
    formatterCache.set(currency, formatter);
  }
  return formatter.format(value);
}
