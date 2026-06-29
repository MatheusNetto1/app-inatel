import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSelectedDoc,
  getTimerSeconds,
  getTimerInterval,
  getRequests,
  getScreenHistory,
  setSelectedDoc,
  clearSelectedDoc,
  setTimerInterval,
  clearTimerInterval,
  decrementTimer,
  resetTimer,
  resetRequests,
  pushScreen,
  popScreen,
  addRequest,
  TIMER_INITIAL,
} from '../../src/js/state.js';

// ─── Isolamento ───────────────────────────────────────────────

beforeEach(() => {
  clearSelectedDoc();
  clearTimerInterval();
  resetTimer();
  resetRequests();

  while (popScreen() !== null) { /* drain */ }
});

// ─── selectedDoc ─────────────────────────────────────────────

describe('selectedDoc', () => {
  it('inicia como null', () => {
    expect(getSelectedDoc()).toBeNull();
  });

  it('setSelectedDoc armazena o documento corretamente', () => {
    setSelectedDoc({ name: 'Histórico Escolar', price: 15, deadline: '2 dias' });
    expect(getSelectedDoc()).toEqual({ name: 'Histórico Escolar', price: 15, deadline: '2 dias' });
  });

  it('clearSelectedDoc volta para null', () => {
    setSelectedDoc({ name: 'Histórico Escolar', price: 15, deadline: '2 dias' });
    clearSelectedDoc();
    expect(getSelectedDoc()).toBeNull();
  });

  it('setSelectedDoc sobrescreve um documento anterior', () => {
    setSelectedDoc({ name: 'Doc A', price: 10, deadline: 'Imediato' });
    setSelectedDoc({ name: 'Doc B', price: 20, deadline: '1 dia' });
    expect(getSelectedDoc()?.name).toBe('Doc B');
  });
});

// ─── timer ───────────────────────────────────────────────────

describe('timer', () => {
  it('TIMER_INITIAL é 600 segundos (10 minutos)', () => {
    expect(TIMER_INITIAL).toBe(600);
  });

  it('getTimerSeconds retorna TIMER_INITIAL após resetTimer', () => {
    expect(getTimerSeconds()).toBe(TIMER_INITIAL);
  });

  it('decrementTimer reduz os segundos em 1', () => {
    decrementTimer();
    expect(getTimerSeconds()).toBe(TIMER_INITIAL - 1);
  });

  it('decrementTimer não vai abaixo de 0', () => {
    for (let i = 0; i < TIMER_INITIAL + 10; i++) decrementTimer();
    expect(getTimerSeconds()).toBe(0);
  });

  it('resetTimer restaura TIMER_INITIAL mesmo após decrementos', () => {
    decrementTimer();
    decrementTimer();
    resetTimer();
    expect(getTimerSeconds()).toBe(TIMER_INITIAL);
  });

  it('setTimerInterval armazena o id do intervalo', () => {
    setTimerInterval(42);
    expect(getTimerInterval()).toBe(42);
  });

  it('clearTimerInterval zera o id armazenado', () => {
    setTimerInterval(42);
    clearTimerInterval();
    expect(getTimerInterval()).toBeNull();
  });

  it('clearTimerInterval não lança erro quando já é null', () => {
    expect(() => clearTimerInterval()).not.toThrow();
  });
});

// ─── screenHistory ───────────────────────────────────────────

describe('screenHistory', () => {
  it('inicia vazio', () => {
    expect(getScreenHistory()).toHaveLength(0);
  });

  it('pushScreen adiciona telas na ordem correta', () => {
    pushScreen('screen-menu');
    pushScreen('screen-catalog');
    expect(getScreenHistory()).toEqual(['screen-menu', 'screen-catalog']);
  });

  it('popScreen remove e retorna a última tela', () => {
    pushScreen('screen-menu');
    pushScreen('screen-catalog');
    expect(popScreen()).toBe('screen-catalog');
    expect(getScreenHistory()).toHaveLength(1);
  });

  it('popScreen retorna null quando o histórico está vazio', () => {
    expect(popScreen()).toBeNull();
  });

  it('pushScreen e popScreen funcionam como pilha (LIFO)', () => {
    pushScreen('screen-menu');
    pushScreen('screen-catalog');
    pushScreen('screen-payment');
    expect(popScreen()).toBe('screen-payment');
    expect(popScreen()).toBe('screen-catalog');
    expect(popScreen()).toBe('screen-menu');
    expect(popScreen()).toBeNull();
  });
});

// ─── addRequest ──────────────────────────────────────────────

describe('addRequest', () => {
  it('lança erro se nenhum documento estiver selecionado', () => {
    expect(() => addRequest('done')).toThrow(
      'Nenhum documento selecionado para adicionar à solicitação.'
    );
  });

  it('adiciona a solicitação ao array de requests', () => {
    const initialCount = getRequests().length;
    setSelectedDoc({ name: 'Histórico Escolar', price: 15, deadline: '2 dias' });
    addRequest('done');
    expect(getRequests()).toHaveLength(initialCount + 1);
  });

  it('retorna o objeto da solicitação criada', () => {
    setSelectedDoc({ name: 'Histórico Escolar', price: 15, deadline: '2 dias' });
    const req = addRequest('done');
    expect(req).toMatchObject({
      name:   'Histórico Escolar',
      price:  15,
      status: 'done',
    });
  });

  it('a solicitação gerada tem protocolo no formato correto', () => {
    setSelectedDoc({ name: 'Histórico Escolar', price: 15, deadline: '2 dias' });
    const req = addRequest('done');
    expect(req.protocol).toMatch(/^#\d{8}$/);
  });

  it('a solicitação gerada tem uma data no formato DD/MM/AAAA', () => {
    setSelectedDoc({ name: 'Histórico Escolar', price: 15, deadline: '2 dias' });
    const req = addRequest('done');
    expect(req.date).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('aceita os três status possíveis', () => {
    for (const status of ['done', 'pending', 'processing']) {
      setSelectedDoc({ name: 'Doc', price: 0, deadline: 'Imediato' });
      const req = addRequest(status);
      expect(req.status).toBe(status);
    }
  });

  it('o documento selecionado permanece no state após addRequest', () => {
    setSelectedDoc({ name: 'Histórico Escolar', price: 15, deadline: '2 dias' });
    addRequest('done');
    expect(getSelectedDoc()).not.toBeNull();
  });
});