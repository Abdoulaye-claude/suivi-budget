import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchExchangeRate } from './exchangeRate';

function mockFetchOnce(response: Partial<Response> & { jsonBody?: unknown }) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.ok ?? true,
    json: () => Promise.resolve(response.jsonBody),
  } as Response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('fetchExchangeRate', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns 1 without calling the network when currencies are identical', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const rate = await fetchExchangeRate('EUR', 'EUR');

    expect(rate).toBe(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('resolves the requested rate from a successful response', async () => {
    mockFetchOnce({ jsonBody: { result: 'success', rates: { USD: 1.0952, XOF: 655.957 } } });

    const rate = await fetchExchangeRate('EUR', 'USD');

    expect(rate).toBe(1.0952);
  });

  it('requests the correct API endpoint for the base currency', async () => {
    const fetchMock = mockFetchOnce({ jsonBody: { result: 'success', rates: { EUR: 0.91 } } });

    await fetchExchangeRate('USD', 'EUR');

    expect(fetchMock).toHaveBeenCalledWith('https://open.er-api.com/v6/latest/USD');
  });

  it('throws when the HTTP response is not ok', async () => {
    mockFetchOnce({ ok: false, jsonBody: {} });

    await expect(fetchExchangeRate('EUR', 'USD')).rejects.toThrow(
      'Impossible de récupérer le taux de change.',
    );
  });

  it('throws when the API reports a non-success result', async () => {
    mockFetchOnce({ jsonBody: { result: 'error', rates: {} } });

    await expect(fetchExchangeRate('EUR', 'USD')).rejects.toThrow(
      'Taux de change indisponible pour cette devise.',
    );
  });

  it('throws when the target currency is missing from the rates', async () => {
    mockFetchOnce({ jsonBody: { result: 'success', rates: { GBP: 0.85 } } });

    await expect(fetchExchangeRate('EUR', 'USD')).rejects.toThrow(
      'Taux de change indisponible pour cette devise.',
    );
  });
});
