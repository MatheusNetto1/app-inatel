import { generateProtocol, todayFormatted } from './utils.js';

/** @typedef {'done' | 'pending' | 'processing'} RequestStatus */

/**
 * @typedef {Object} DocumentRequest
 * @property {number}          id
 * @property {string}          name
 * @property {string}          protocol
 * @property {string}          date
 * @property {RequestStatus}   status
 * @property {number}          price
 */

/**
 * @typedef {Object} SelectedDoc
 * @property {string} name
 * @property {number} price
 * @property {string} deadline
 */

const TIMER_INITIAL = 600;

function createInitialRequests() {
  return [
    {
      id: 1,
      name: 'Declaração de Matrícula (1ª via)',
      protocol: '#20260415',
      date: '15/04/2026',
      status: 'done',
      price: 0,
    },
  ];
}

const state = {
  /** @type {SelectedDoc | null} */
  selectedDoc: null,

  /** @type {number | null} */
  timerInterval: null,

  /** @type {number} */
  timerSeconds: TIMER_INITIAL,

  /** @type {string[]} */
  screenHistory: [],

  /** @type {DocumentRequest[]} */
  requests: createInitialRequests(),
};

// ─── Seletores (leitura) ──────────────────────────────────────

export function getSelectedDoc()    { return state.selectedDoc; }
export function getTimerSeconds()   { return state.timerSeconds; }
export function getTimerInterval()  { return state.timerInterval; }
export function getScreenHistory()  { return state.screenHistory; }
export function getRequests()       { return state.requests; }

// ─── Mutações (escrita) ───────────────────────────────────────

export function setSelectedDoc(doc) {
  state.selectedDoc = doc;
}

export function clearSelectedDoc() {
  state.selectedDoc = null;
}

export function setTimerInterval(id) {
  state.timerInterval = id;
}

export function clearTimerInterval() {
  if (state.timerInterval !== null) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

export function decrementTimer() {
  state.timerSeconds = Math.max(0, state.timerSeconds - 1);
}

export function resetTimer() {
  state.timerSeconds = TIMER_INITIAL;
}

export function resetRequests() {
  state.requests = createInitialRequests();
}

export function pushScreen(screenId) {
  state.screenHistory.push(screenId);
}

export function popScreen() {
  return state.screenHistory.pop() ?? null;
}

/**
 * Adiciona uma nova solicitação ao histórico.
 * @param {RequestStatus} status
 * @returns {DocumentRequest} O item adicionado (com protocolo gerado)
 */
export function addRequest(status) {
  const doc = state.selectedDoc;
  if (!doc) throw new Error('Nenhum documento selecionado para adicionar à solicitação.');

  const protocol = generateProtocol();
  const request = {
    id: Date.now(),
    name: doc.name,
    protocol,
    date: todayFormatted(),
    status,
    price: doc.price,
  };

  state.requests.push(request);
  return request;
}

export { TIMER_INITIAL };