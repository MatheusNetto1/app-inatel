/* ============================================================
   INATEL MÓVEL — Tesouraria & Documentos
   App Logic
   ============================================================ */

// ─── State ───────────────────────────────────────────────────
const state = {
  selectedDoc: null,
  timerInterval: null,
  timerSeconds: 600, // 10 min
  screenHistory: [],
  requests: [
    {
      id: 1,
      name: 'Declaração de Matrícula (1ª via)',
      protocol: '#20260415',
      date: '15/04/2026',
      status: 'done',
      price: 0,
    },
  ],
};

function closeAllOverlays() {
  document
    .querySelectorAll('.overlay')
    .forEach(overlay => overlay.classList.remove('active'));
}

function goToRequests() {
  closeSuccess();
  goTo('screen-requests');
}

// ─── Navigation ──────────────────────────────────────────────
function goTo(screenId, addToHistory = true) {
  closeAllOverlays();

  const current = document.querySelector('.screen.active');

  if (current) {
    if (addToHistory) {
      state.screenHistory.push(current.id);
    }

    current.classList.remove('active');
  }

  const next = document.getElementById(screenId);

  if (next) {
    next.classList.add('active');
  }

  if (screenId === 'screen-payment') {
    startTimer();
    updatePaymentScreen();
  }

  if (screenId === 'screen-requests') {
    renderRequests();
  }

  if (screenId !== 'screen-payment') {
    stopTimer();
  }

  const body = next?.querySelector('.screen-body');

  if (body) {
    body.scrollTop = 0;
  }
}

function goBack() {
  stopTimer();
  const prev = state.screenHistory.pop();
  if (prev) {
    const current = document.querySelector('.screen.active');
    current?.classList.remove('active');
    document.getElementById(prev)?.classList.add('active');
  }
}

// ─── Catalog / Document selection ────────────────────────────
function selectDoc(card) {
  // Deselect all
  document.querySelectorAll('.doc-card').forEach(c => c.classList.remove('selected'));
  // Select clicked
  card.classList.add('selected');

  state.selectedDoc = {
    name: card.dataset.name,
    price: parseFloat(card.dataset.price),
    deadline: card.dataset.deadline,
  };

  // Update footer
  const footerTotal = document.getElementById('footer-total');
  const footerValue = document.getElementById('footer-total-value');
  const btnAdvance  = document.getElementById('btn-advance');

  footerTotal.style.display = 'flex';
  if (state.selectedDoc.price === 0) {
    footerValue.textContent = 'Gratuito';
    footerValue.style.color = '#27ae60';
  } else {
    footerValue.textContent = `R$ ${state.selectedDoc.price.toFixed(2).replace('.', ',')}`;
    footerValue.style.color = '';
  }

  btnAdvance.disabled = false;
  btnAdvance.textContent = state.selectedDoc.price === 0
    ? 'Confirmar Solicitação (Gratuito)'
    : `Avançar para Pagamento — R$ ${state.selectedDoc.price.toFixed(2).replace('.', ',')}`;
}

function goToPayment() {
  if (!state.selectedDoc) return;

  if (state.selectedDoc.price === 0) {
    addRequest('processing');
    showSuccess();
    return;
  }

  state.timerSeconds = 600;

  goTo('screen-payment');
}

// ─── Payment screen ──────────────────────────────────────────
function updatePaymentScreen() {
  if (!state.selectedDoc) return;

  const name = document.getElementById('pay-doc-name');
  const price = document.getElementById('pay-doc-price');
  const cardVal = document.getElementById('card-pay-value');

  name.textContent = state.selectedDoc.name;

  price.textContent =
    `R$ ${state.selectedDoc.price.toFixed(2).replace('.', ',')}`;

  if (cardVal) {
    cardVal.textContent =
      state.selectedDoc.price.toFixed(2).replace('.', ',');
  }

  const qrBox = document.getElementById('qr-box');

  if (qrBox) {
    qrBox.style.opacity = '1';
  }

  const timerEl = document.getElementById('qr-timer');

  if (timerEl) {
    timerEl.innerHTML = `
      <svg viewBox="0 0 24 24"
           fill="none"
           stroke="currentColor"
           stroke-width="2"
           width="14"
           height="14">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
      Expira em <strong id="timer-display">10:00</strong>
    `;
  }

  const sel = document.querySelector('.form-select');

  if (sel && state.selectedDoc.price > 0) {
    const p = state.selectedDoc.price;

    sel.innerHTML = `
      <option>1x de R$ ${fmt(p)} (sem juros)</option>
      <option>2x de R$ ${fmt(p / 2)} (sem juros)</option>
      <option>3x de R$ ${fmt(p / 3)} (sem juros)</option>
    `;
  }
}

function fmt(n) { return n.toFixed(2).replace('.', ','); }

function switchTab(tab) {
  document.getElementById('panel-pix').style.display  = tab === 'pix'  ? 'block' : 'none';
  document.getElementById('panel-card').style.display = tab === 'card' ? 'block' : 'none';
  document.getElementById('tab-pix').classList.toggle('pay-tab--active',  tab === 'pix');
  document.getElementById('tab-card').classList.toggle('pay-tab--active', tab === 'card');

  if (tab === 'pix') {
    startTimer();
  } else {
    stopTimer();
  }
}

// ─── Timer ───────────────────────────────────────────────────
function startTimer() {
  if (state.timerInterval) {
    return;
  }

  if (state.timerSeconds <= 0) {
    state.timerSeconds = 600;
  }

  renderTimer();

  state.timerInterval = setInterval(() => {
    state.timerSeconds--;

    renderTimer();

    if (state.timerSeconds <= 0) {
      stopTimer();
      expirePix();
    }
  }, 1000);
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function renderTimer() {
  const el = document.getElementById('timer-display');
  if (!el) return;
  const m = Math.floor(state.timerSeconds / 60).toString().padStart(2, '0');
  const s = (state.timerSeconds % 60).toString().padStart(2, '0');
  el.textContent = `${m}:${s}`;

  // Visual warning when < 2 min
  const timerEl = document.getElementById('qr-timer');
  if (timerEl) {
    timerEl.style.background = state.timerSeconds < 120 ? '#fdecea' : '';
    timerEl.style.borderColor = state.timerSeconds < 120 ? '#f5b7b1' : '';
    const strong = timerEl.querySelector('strong');
    if (strong) strong.style.color = state.timerSeconds < 120 ? '#c0392b' : '';
  }
}

function expirePix() {
  showToast('Código Pix expirado. Gere um novo.');
  const qrBox = document.getElementById('qr-box');
  if (qrBox) qrBox.style.opacity = '0.35';
  const timerEl = document.getElementById('qr-timer');
  if (timerEl) timerEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> Código expirado`;
}

// ─── Copy Pix ────────────────────────────────────────────────
function copyPix() {
  const code = document.getElementById('pix-code')?.textContent;
  const btn  = document.getElementById('copy-btn');

  navigator.clipboard.writeText(code).catch(() => {});

  if (btn) {
    btn.classList.add('copied');
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg> Copiado!`;
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copiar`;
    }, 2500);
  }
  showToast('Código copiado com sucesso!');
}

// ─── Confirm payment ─────────────────────────────────────────
function confirmPayment() {
  stopTimer();
  const overlayProcessing = document.getElementById('overlay-processing');
  overlayProcessing.classList.add('active');

  setTimeout(() => {
    overlayProcessing.classList.remove('active');
    addRequest('done');
    showSuccess();
  }, 2000);
}

function showSuccess() {
  const protocol =
    '#' + Math.floor(20260000 + Math.random() * 9999);

  const el = document.getElementById('protocol-number');

  if (el) {
    el.textContent = protocol;
  }

  if (state.requests.length > 0) {
    state.requests[state.requests.length - 1].protocol = protocol;
  }

  document
    .getElementById('overlay-success')
    .classList.add('active');
}

function closeSuccess() {
  document
    .getElementById('overlay-success')
    .classList.remove('active');
}

// ─── Requests ────────────────────────────────────────────────
function addRequest(status) {
  if (!state.selectedDoc) return;
  const protocol = '#' + Math.floor(20260000 + Math.random() * 9999);
  state.requests.push({
    id: Date.now(),
    name: state.selectedDoc.name,
    protocol,
    date: new Date().toLocaleDateString('pt-BR'),
    status,
    price: state.selectedDoc.price,
  });
  // Reset selection
  state.selectedDoc = null;
  document.querySelectorAll('.doc-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('footer-total').style.display = 'none';
  document.getElementById('btn-advance').disabled = true;
  document.getElementById('btn-advance').textContent = 'Avançar para Pagamento';
}

function renderRequests() {
  const list = document.getElementById('requests-list');
  if (!list) return;

  if (state.requests.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:48px 16px;color:var(--text-muted)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" style="margin-bottom:12px;opacity:0.4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <p style="font-size:14px">Nenhuma solicitação ainda</p>
        <p style="font-size:12px;margin-top:4px">Solicite seu primeiro documento abaixo</p>
      </div>
    `;
    return;
  }

  const statusMap = {
    done:       { label: 'Disponível',   cls: 'status-badge--done',       card: 'request-card--done' },
    pending:    { label: 'Pendente',     cls: 'status-badge--pending',    card: 'request-card--pending' },
    processing: { label: 'Processando',  cls: 'status-badge--processing', card: 'request-card--processing' },
  };

  list.innerHTML = [...state.requests].reverse().map(req => {
    const s = statusMap[req.status] || statusMap.pending;
    const downloadBtn = req.status === 'done'
      ? `<button class="btn-download" onclick="downloadPDF('${req.protocol}', '${req.name}')">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
           Baixar PDF Assinado
         </button>`
      : '';
    return `
      <div class="request-card ${s.card}">
        <div class="request-header">
          <div>
            <div class="request-name">${req.name}</div>
            <div class="request-proto">Protocolo ${req.protocol} · ${req.date}</div>
          </div>
          <span class="status-badge ${s.cls}">${s.label}</span>
        </div>
        <div class="request-meta">
          ${req.price === 0 ? 'Gratuito' : `R$ ${fmt(req.price)}`} · ${req.status === 'done' ? 'Documento pronto para download' : 'Aguardando processamento'}
        </div>
        ${downloadBtn}
      </div>
    `;
  }).join('');
}

function downloadPDF(protocol, name) {
  showToast(`Download iniciado: ${name.substring(0, 30)}…`);
  // Simulates download feedback
  setTimeout(() => showToast('PDF salvo na pasta Downloads ✓'), 1500);
}

// ─── Card input formatting ────────────────────────────────────
function formatCard(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 16);
  input.value = v.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 4);
  if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2);
  input.value = v;
}

// ─── Toast ───────────────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// ─── Close overlay on success button ─────────────────────────
document.getElementById('overlay-success')?.addEventListener('click', function(e) {
  // handled by the button inside
});