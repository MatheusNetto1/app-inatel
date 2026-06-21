import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../../src/js/utils';

describe('formatCurrency', () => {
  it('deve formatar valor inteiro', () => {
    expect(formatCurrency(15)).toBe('15,00');
  });

  it('deve formatar valor decimal', () => {
    expect(formatCurrency(15.5)).toBe('15,50');
  });
});