export async function fetchExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;

  const response = await fetch(`https://open.er-api.com/v6/latest/${from}`);
  if (!response.ok) {
    throw new Error('Impossible de récupérer le taux de change.');
  }

  const data = (await response.json()) as { result?: string; rates?: Record<string, number> };
  const rate = data.rates?.[to];
  if (data.result !== 'success' || typeof rate !== 'number') {
    throw new Error('Taux de change indisponible pour cette devise.');
  }

  return rate;
}
