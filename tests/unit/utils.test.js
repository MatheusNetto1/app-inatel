import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatTime,
  formatCardNumber,
  formatExpiry,
  buildInstallments,
  isTimerWarning,
  generateProtocol,
  todayFormatted,
} from '../../src/js/utils.js';

// ─── formatCurrency ───────────────────────────────────────────

describe('formatCurrency', () => {
  it('formata valor inteiro com dois decimais', () => {
    expect(formatCurrency(15)).toBe('15,00');
  });

  it('formata valor com uma casa decimal', () => {
    expect(formatCurrency(7.5)).toBe('7,50');
  });

  it('formata zero corretamente', () => {
    expect(formatCurrency(0)).toBe('0,00');
  });

  it('arredonda dízima periódica corretamente', () => {
    expect(formatCurrency(10 / 3)).toBe('3,33');
  });

  it('usa vírgula como separador decimal (padrão pt-BR)', () => {
    expect(formatCurrency(1.99)).not.toContain('.');
    expect(formatCurrency(1.99)).toContain(',');
  });
});

// ─── formatTime ──────────────────────────────────────────────

describe('formatTime', () => {
  it('formata 600 segundos como 10:00', () => {
    expect(formatTime(600)).toBe('10:00');
  });

  it('formata 0 segundos como 00:00', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('adiciona zero à esquerda nos segundos abaixo de 10', () => {
    expect(formatTime(65)).toBe('01:05');
  });

  it('formata 59 segundos como 00:59', () => {
    expect(formatTime(59)).toBe('00:59');
  });

  it('adiciona zero à esquerda nos minutos abaixo de 10', () => {
    expect(formatTime(540)).toBe('09:00');
  });
});

// ─── formatCardNumber ─────────────────────────────────────────

describe('formatCardNumber', () => {
  it('insere espaços a cada 4 dígitos', () => {
    expect(formatCardNumber('1234567890123456')).toBe('1234 5678 9012 3456');
  });

  it('remove caracteres não numéricos antes de formatar', () => {
    expect(formatCardNumber('1234-5678-9012-3456')).toBe('1234 5678 9012 3456');
  });

  it('limita a 16 dígitos e ignora o excedente', () => {
    expect(formatCardNumber('12345678901234567890')).toBe('1234 5678 9012 3456');
  });

  it('formata número parcial com menos de 4 dígitos sem espaço', () => {
    expect(formatCardNumber('123')).toBe('123');
  });

  it('formata número parcial entre 4 e 8 dígitos', () => {
    expect(formatCardNumber('12345')).toBe('1234 5');
  });

  it('retorna string vazia para input vazio', () => {
    expect(formatCardNumber('')).toBe('');
  });

  it('não adiciona espaço trailing em número completo', () => {
    const result = formatCardNumber('1234567890123456');
    expect(result).not.toMatch(/ $/);
  });
});

// ─── formatExpiry ────────────────────────────────────────────

describe('formatExpiry', () => {
  it('insere barra após os 2 primeiros dígitos', () => {
    expect(formatExpiry('1225')).toBe('12/25');
  });

  it('não insere barra com menos de 3 dígitos', () => {
    expect(formatExpiry('12')).toBe('12');
  });

  it('limita a 4 dígitos e ignora o excedente', () => {
    expect(formatExpiry('122599')).toBe('12/25');
  });

  it('remove caracteres não numéricos (idempotente com barra já presente)', () => {
    expect(formatExpiry('12/25')).toBe('12/25');
  });

  it('retorna string vazia para input vazio', () => {
    expect(formatExpiry('')).toBe('');
  });

  it('formata 3 dígitos corretamente', () => {
    expect(formatExpiry('123')).toBe('12/3');
  });
});

// ─── buildInstallments ───────────────────────────────────────

describe('buildInstallments', () => {
  it('gera 3 parcelas por padrão', () => {
    expect(buildInstallments(15)).toHaveLength(3);
  });

  it('a primeira parcela tem o valor total', () => {
    const [first] = buildInstallments(15);
    expect(first.value).toBe(15);
  });

  it('divide o valor igualmente entre as parcelas', () => {
    const [, second] = buildInstallments(15);
    expect(second.value).toBe(7.5);
  });

  it('respeita o parâmetro maxInstallments', () => {
    expect(buildInstallments(10, 5)).toHaveLength(5);
  });

  it('cada item tem as propriedades label e value', () => {
    buildInstallments(15).forEach(item => {
      expect(item).toHaveProperty('label');
      expect(item).toHaveProperty('value');
    });
  });

  it('o label inclui o número da parcela', () => {
    const installments = buildInstallments(15);
    expect(installments[0].label).toContain('1x');
    expect(installments[1].label).toContain('2x');
    expect(installments[2].label).toContain('3x');
  });

  it('o label inclui "sem juros"', () => {
    buildInstallments(15).forEach(item => {
      expect(item.label).toContain('sem juros');
    });
  });

  it('o label inclui o valor formatado em pt-BR', () => {
    const [first] = buildInstallments(15);
    expect(first.label).toContain('15,00');
  });
});

// ─── isTimerWarning ──────────────────────────────────────────

describe('isTimerWarning', () => {
  it('retorna true quando restam menos de 120 segundos', () => {
    expect(isTimerWarning(119)).toBe(true);
    expect(isTimerWarning(1)).toBe(true);
    expect(isTimerWarning(0)).toBe(true);
  });

  it('retorna false no limite exato de 120 segundos', () => {
    expect(isTimerWarning(120)).toBe(false);
  });

  it('retorna false quando restam mais de 120 segundos', () => {
    expect(isTimerWarning(600)).toBe(false);
    expect(isTimerWarning(121)).toBe(false);
  });
});

// ─── generateProtocol ────────────────────────────────────────

describe('generateProtocol', () => {
  it('inicia com #', () => {
    expect(generateProtocol()).toMatch(/^#/);
  });

  it('tem exatamente 9 caracteres (#XXXXXXXX)', () => {
    expect(generateProtocol()).toHaveLength(9);
  });

  it('contém apenas # seguido de 8 dígitos', () => {
    expect(generateProtocol()).toMatch(/^#\d{8}$/);
  });

  it('inclui o ano atual no protocolo', () => {
    const currentYear = new Date().getFullYear().toString();
    expect(generateProtocol()).toContain(currentYear);
  });

  it('gera valores distintos em chamadas consecutivas (probabilístico)', () => {
    const protocols = new Set(Array.from({ length: 30 }, generateProtocol));
    expect(protocols.size).toBeGreaterThan(1);
  });
});

// ─── todayFormatted ──────────────────────────────────────────

describe('todayFormatted', () => {
  it('retorna string no formato DD/MM/AAAA', () => {
    expect(todayFormatted()).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('retorna a data de hoje', () => {
    const today = new Date().toLocaleDateString('pt-BR');
    expect(todayFormatted()).toBe(today);
  });
});