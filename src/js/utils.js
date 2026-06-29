/**
 * Formata um número como moeda brasileira (ex: 15.5 → "15,50")
 * @param {number} value
 * @returns {string}
 */
export function formatCurrency(value) {
  return value.toFixed(2).replace('.', ',');
}

/**
 * Formata segundos em MM:SS (ex: 605 → "10:05")
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Formata número de cartão de crédito com espaços a cada 4 dígitos
 * @param {string} raw - valor bruto do input
 * @returns {string}
 */
export function formatCardNumber(raw) {
  const digits = raw.replace(/\D/g, '').substring(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Formata data de validade de cartão no padrão MM/AA
 * @param {string} raw - valor bruto do input
 * @returns {string}
 */
export function formatExpiry(raw) {
  const digits = raw.replace(/\D/g, '').substring(0, 4);
  return digits.length > 2
    ? `${digits.substring(0, 2)}/${digits.substring(2)}`
    : digits;
}

/**
 * Gera um número de protocolo único baseado em prefixo de ano + número aleatório
 * @returns {string} ex: "#20260412"
 */
export function generateProtocol() {
  const suffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  const year = new Date().getFullYear();
  return `#${year}${suffix}`;
}

/**
 * Retorna a data atual formatada em pt-BR (ex: "20/06/2026")
 * @returns {string}
 */
export function todayFormatted() {
  return new Date().toLocaleDateString('pt-BR');
}

/**
 * Gera as opções de parcelamento para um dado valor
 * @param {number} price
 * @param {number} maxInstallments
 * @returns {Array<{label: string, value: number}>}
 */
export function buildInstallments(price, maxInstallments = 3) {
  return Array.from({ length: maxInstallments }, (_, i) => {
    const n = i + 1;
    return {
      label: `${n}x de R$ ${formatCurrency(price / n)} (sem juros)`,
      value: price / n,
    };
  });
}

/**
 * Verifica se o timer está em estado de alerta (menos de 2 minutos)
 * @param {number} seconds
 * @returns {boolean}
 */
export function isTimerWarning(seconds) {
  return seconds < 120;
}