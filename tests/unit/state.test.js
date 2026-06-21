import { describe, it, expect } from 'vitest';
import {
  setSelectedDoc,
  getSelectedDoc,
  clearSelectedDoc
} from '../../src/js/state.js';

describe('selectedDoc', () => {
  it('deve selecionar documento', () => {
    setSelectedDoc({
      name: 'Histórico',
      price: 15
    });

    expect(getSelectedDoc().name).toBe('Histórico');
  });

  it('deve limpar documento', () => {
    clearSelectedDoc();

    expect(getSelectedDoc()).toBeNull();
  });
});