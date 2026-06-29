import {
  getSelectedDoc,
  getTimerSeconds,
  getTimerInterval,
  getRequests,
  setSelectedDoc,
  clearSelectedDoc,
  setTimerInterval,
  clearTimerInterval,
  decrementTimer,
  resetTimer,
  pushScreen,
  popScreen,
  addRequest,
} from './state.js';

import {
  formatCurrency,
  formatTime,
  formatCardNumber,
  formatExpiry,
  buildInstallments,
  isTimerWarning,
} from './utils.js';

// ─── Helpers de DOM ──────────────────────────────────────────

/**
 * Retorna um elemento pelo id, lançando erro se não existir.
 * @param {string} id
 * @returns {HTMLElement}
 */
function el(id) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Elemento não encontrado: #${id}`);
  return element;
}

/**
 * Exibe um toast temporário na tela.
 * @param {string} msg
 */
function showToast(msg) {
  const toast = el('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// Expõe showToast globalmente pois é chamado diretamente no HTML
window.showToast = showToast;

// ─── Overlays ────────────────────────────────────────────────

function showOverlay(id) {
  el(id).classList.add('active');
}

function hideOverlay(id) {
  el(id).classList.remove('active');
}

function hideAllOverlays() {
  document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
}

// ─── Navegação ───────────────────────────────────────────────

/**
 * Navega para uma tela, gerenciando histórico e efeitos colaterais.
 * @param {string} screenId
 * @param {boolean} addToHistory
 */
function goTo(screenId, addToHistory = true) {
  hideAllOverlays();

  const current = document.querySelector('.screen.active');
  if (current) {
    if (addToHistory) pushScreen(current.id);
    current.classList.remove('active');
  }

  const next = document.getElementById(screenId);
  if (next) next.classList.add('active');

  // Efeitos colaterais por tela
  if (screenId === 'screen-payment') {
    resetTimer();
    renderPaymentScreen();
    startTimer();
  } else {
    stopTimer();
  }

  if (screenId === 'screen-requests') {
    renderRequestsList();
  }

  const body = next?.querySelector('.screen-body');
  if (body) body.scrollTop = 0;
}

function goBack() {
  stopTimer();
  const prev = popScreen();
  if (!prev) return;
  const current = document.querySelector('.screen.active');
  current?.classList.remove('active');
  document.getElementById(prev)?.classList.add('active');
}

function goToRequests() {
  hideOverlay('overlay-success');
  goTo('screen-requests');
}

window.goTo         = goTo;
window.goBack       = goBack;
window.goToRequests = goToRequests;

// ─── Catálogo ────────────────────────────────────────────────

/**
 * Seleciona um documento a partir do card clicado.
 * @param {HTMLElement} card
 */
function selectDoc(card) {
  document.querySelectorAll('.doc-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');

  const doc = {
    name:     card.dataset.name,
    price:    parseFloat(card.dataset.price),
    deadline: card.dataset.deadline,
  };

  setSelectedDoc(doc);
  renderCatalogFooter(doc);
}

/**
 * Atualiza o rodapé do catálogo conforme o documento selecionado.
 * @param {{ name: string, price: number }} doc
 */
function renderCatalogFooter(doc) {
  const footerTotal = el('footer-total');
  const footerValue = el('footer-total-value');
  const btnAdvance  = el('btn-advance');

  footerTotal.style.display = 'flex';

  if (doc.price === 0) {
    footerValue.textContent = 'Gratuito';
    footerValue.style.color = '#27ae60';
    btnAdvance.textContent  = 'Confirmar Solicitação (Gratuito)';
  } else {
    footerValue.textContent = `R$ ${formatCurrency(doc.price)}`;
    footerValue.style.color = '';
    btnAdvance.textContent  = `Avançar para Pagamento — R$ ${formatCurrency(doc.price)}`;
  }

  btnAdvance.disabled = false;
}

function goToPayment() {
  const doc = getSelectedDoc();
  if (!doc) return;

  if (doc.price === 0) {
    const request = addRequest('processing');
    showSuccessOverlay(request.protocol);
    resetCatalog();
    return;
  }

  goTo('screen-payment');
}

function resetCatalog() {
  clearSelectedDoc();
  document.querySelectorAll('.doc-card').forEach(c => c.classList.remove('selected'));
  el('footer-total').style.display = 'none';
  const btn = el('btn-advance');
  btn.disabled    = true;
  btn.textContent = 'Avançar para Pagamento';
}

window.selectDoc   = selectDoc;
window.goToPayment = goToPayment;

// ─── Tela de pagamento ───────────────────────────────────────

function renderPaymentScreen() {
  const doc = getSelectedDoc();
  if (!doc) return;

  el('pay-doc-name').textContent  = doc.name;
  el('pay-doc-price').textContent = `R$ ${formatCurrency(doc.price)}`;

  const cardVal = document.getElementById('card-pay-value');
  if (cardVal) cardVal.textContent = formatCurrency(doc.price);

  // Restaura estado visual do QR
  const qrBox = document.getElementById('qr-box');
  if (qrBox) qrBox.style.opacity = '1';

  renderTimerElement();
  renderInstallmentsSelect(doc.price);

  // Garante que a aba Pix está ativa ao entrar na tela
  switchTab('pix');
}

function renderInstallmentsSelect(price) {
  const sel = document.querySelector('.form-select');
  if (!sel || price <= 0) return;
  sel.innerHTML = buildInstallments(price)
    .map(i => `<option>${i.label}</option>`)
    .join('');
}

function switchTab(tab) {
  el('panel-pix').style.display  = tab === 'pix'  ? 'block' : 'none';
  el('panel-card').style.display = tab === 'card' ? 'block' : 'none';
  el('tab-pix').classList.toggle('pay-tab--active',  tab === 'pix');
  el('tab-card').classList.toggle('pay-tab--active', tab === 'card');

  if (tab === 'pix') startTimer();
  else stopTimer();
}

window.switchTab = switchTab;

// ─── Timer ───────────────────────────────────────────────────

function startTimer() {
  // Evita múltiplos intervalos simultâneos
  if (getTimerInterval() !== null) return;

  renderTimerDisplay();

  const id = setInterval(() => {
    decrementTimer();
    renderTimerDisplay();
    if (getTimerSeconds() <= 0) {
      stopTimer();
      expirePix();
    }
  }, 1000);

  setTimerInterval(id);
}

function stopTimer() {
  clearTimerInterval();
}

/** Reconstrói o elemento do timer (usado ao entrar na tela de pagamento) */
function renderTimerElement() {
  const timerEl = document.getElementById('qr-timer');
  if (!timerEl) return;
  timerEl.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
    Expira em <strong id="timer-display">10:00</strong>
  `;
}

/** Atualiza o display e o estilo de alerta do timer */
function renderTimerDisplay() {
  const seconds = getTimerSeconds();
  const display = document.getElementById('timer-display');
  if (display) display.textContent = formatTime(seconds);

  const timerEl = document.getElementById('qr-timer');
  if (!timerEl) return;

  const warning = isTimerWarning(seconds);
  timerEl.style.background  = warning ? '#fdecea' : '';
  timerEl.style.borderColor = warning ? '#f5b7b1' : '';

  const strong = timerEl.querySelector('strong');
  if (strong) strong.style.color = warning ? '#c0392b' : '';
}

function expirePix() {
  showToast('Código Pix expirado. Gere um novo.');

  const qrBox = document.getElementById('qr-box');
  if (qrBox) qrBox.style.opacity = '0.35';

  const timerEl = document.getElementById('qr-timer');
  if (timerEl) {
    timerEl.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      Código expirado
    `;
  }
}

// ─── Pix ─────────────────────────────────────────────────────

function copyPix() {
  const code = document.getElementById('pix-code')?.textContent ?? '';
  const btn  = document.getElementById('copy-btn');

  navigator.clipboard.writeText(code).catch(() => {});

  if (btn) {
    btn.classList.add('copied');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Copiado!
    `;
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        Copiar
      `;
    }, 2500);
  }

  showToast('Código copiado com sucesso!');
}

window.copyPix = copyPix;

// ─── Confirmar pagamento ──────────────────────────────────────

function confirmPayment() {
  stopTimer();
  showOverlay('overlay-processing');

  setTimeout(() => {
    hideOverlay('overlay-processing');
    const request = addRequest('done');
    showSuccessOverlay(request.protocol);
    resetCatalog();
  }, 2000);
}

function showSuccessOverlay(protocol) {
  const protocolEl = document.getElementById('protocol-number');
  if (protocolEl) protocolEl.textContent = protocol;
  showOverlay('overlay-success');
}

window.confirmPayment = confirmPayment;

// ─── Lista de solicitações ────────────────────────────────────

/** @type {Record<string, { label: string, badgeCls: string, cardCls: string }>} */
const STATUS_CONFIG = {
  done:       { label: 'Disponível',  badgeCls: 'status-badge--done',       cardCls: 'request-card--done' },
  pending:    { label: 'Pendente',    badgeCls: 'status-badge--pending',    cardCls: 'request-card--pending' },
  processing: { label: 'Processando', badgeCls: 'status-badge--processing', cardCls: 'request-card--processing' },
};

function renderRequestsList() {
  const list = document.getElementById('requests-list');
  if (!list) return;

  const items = getRequests();

  if (items.length === 0) {
    list.innerHTML = renderEmptyRequests();
    return;
  }

  list.innerHTML = [...items].reverse().map(renderRequestCard).join('');
}

function renderEmptyRequests() {
  return `
    <div style="text-align:center;padding:48px 16px;color:var(--text-muted)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
           width="48" height="48" style="margin-bottom:12px;opacity:0.4">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <p style="font-size:14px">Nenhuma solicitação ainda</p>
      <p style="font-size:12px;margin-top:4px">Solicite seu primeiro documento abaixo</p>
    </div>
  `;
}

/**
 * Renderiza o HTML de um card de solicitação.
 * @param {import('./state.js').DocumentRequest} req
 * @returns {string}
 */
function renderRequestCard(req) {
  const s          = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending;
  const priceLabel = req.price === 0 ? 'Gratuito' : `R$ ${formatCurrency(req.price)}`;
  const statusDesc = req.status === 'done' ? 'Documento pronto para download' : 'Aguardando processamento';

  const downloadBtn = req.status === 'done'
    ? `<button class="btn-download" onclick="downloadPDF('${req.protocol}', '${req.name}')">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
           <polyline points="7 10 12 15 17 10"/>
           <line x1="12" y1="15" x2="12" y2="3"/>
         </svg>
         Baixar PDF Assinado
       </button>`
    : '';

  return `
    <div class="request-card ${s.cardCls}">
      <div class="request-header">
        <div>
          <div class="request-name">${req.name}</div>
          <div class="request-proto">Protocolo ${req.protocol} · ${req.date}</div>
        </div>
        <span class="status-badge ${s.badgeCls}">${s.label}</span>
      </div>
      <div class="request-meta">${priceLabel} · ${statusDesc}</div>
      ${downloadBtn}
    </div>
  `;
}

function downloadPDF(protocol, name) {
  showToast(`Download iniciado: ${name.substring(0, 30)}…`);
  setTimeout(() => showToast('PDF salvo na pasta Downloads ✓'), 1500);
}

window.downloadPDF = downloadPDF;

// ─── Formatação de inputs ─────────────────────────────────────

window.formatCard   = (input) => { input.value = formatCardNumber(input.value); };
window.formatExpiry = (input) => { input.value = formatExpiry(input.value); };