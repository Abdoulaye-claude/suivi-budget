import { describe, expect, it } from 'vitest';
import { formatAmount } from './format';

// Intl.NumberFormat('fr-FR', ...) uses a narrow no-break space (U+202F) as the
// thousands separator, not a regular space — normalize before comparing so
// the tests don't depend on that exact whitespace character.
function normalize(value: string): string {
  return value.replace(/[\s  ]/g, ' ');
}

describe('formatAmount', () => {
  it('formats EUR by default with French conventions (comma decimal)', () => {
    expect(normalize(formatAmount(1234.5))).toBe('1 234,50 €');
  });

  it('formats other currencies when specified', () => {
    expect(normalize(formatAmount(1234.5, 'USD'))).toContain('1 234,50');
    expect(formatAmount(10, 'XOF')).toContain('10');
  });

  it('formats zero and negative amounts', () => {
    expect(normalize(formatAmount(0))).toBe('0,00 €');
    expect(normalize(formatAmount(-42.1))).toBe('-42,10 €');
  });

  it('reuses a cached formatter for the same currency without throwing', () => {
    expect(() => {
      formatAmount(1, 'EUR');
      formatAmount(2, 'EUR');
    }).not.toThrow();
  });
});
