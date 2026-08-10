/**
 * app.js — Shared utilities: sidebar, navigation, formatting, tax calculation.
 * Tax logic: GST INCLUDED in selling price (reverse/back-calculation).
 *   User enters Grand Total → app calculates Taxable Value + Tax
 */

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { hash: '#/dashboard',    label: 'Dashboard',      icon: 'layout-dashboard' },
  { hash: '#/invoices/new', label: 'Create Invoice', icon: 'file-plus' },
  { hash: '#/invoices',     label: 'All Invoices',   icon: 'file-text' },
  { hash: '#/history',      label: 'Invoice History',icon: 'clock' },
  { hash: '#/settings',     label: 'Settings',       icon: 'settings' },
];

const ICONS = {
  'layout-dashboard': `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  'file-plus':        `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
  'file-text':        `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  'clock':            `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  'settings':         `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  'zap':  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  'x':    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  'menu': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
};

function icon(name) { return ICONS[name] || ''; }

// ─── BUNDLED TERMS & CONDITIONS (English & Hindi) ─────────────────────────────
const TERMS_EN = `1. Sold vehicles will not be returned or exchanged under any circumstances.
2. Warranty is provided directly by the manufacturing company and is subject to their official terms and conditions.
3. All legal disputes are subject to the jurisdiction of the City Court, Ghazipur.`;

const TERMS_HI = `1. बेचे गए वाहन किसी भी परिस्थिति में वापस या बदले नहीं जाएंगे।
2. वारंटी सीधे निर्माण कंपनी द्वारा प्रदान की जाती है और उनके आधिकारिक नियमों और शर्तों के अधीन है।
3. सभी कानूनी विवाद गाजीपुर शहर न्यायालय के अधिकार क्षेत्र के अधीन हैं।`;

function isTermsInHindi(termsStr) {
  return /[\u0900-\u097F]/.test(termsStr || '');
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function buildSidebar() {
  const currentHash = window.location.hash || '#/dashboard';
  const sidebar     = document.getElementById('sidebar');
  if (!sidebar) return;

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon">${icon('zap')}</div>
        <div class="sidebar-logo-text">
          <div class="brand">MOHAN E RIDE</div>
          <div class="sub">Invoice Manager</div>
        </div>
      </div>
      <button class="sidebar-close-btn" id="sidebar-close-btn" onclick="closeSidebar()">${icon('x')}</button>
    </div>
    <nav class="sidebar-nav">
      ${NAV_ITEMS.map(({ hash, label, icon: ic }) => {
        const isActive = currentHash === hash || currentHash.startsWith(hash + '/');
        return `<a href="${hash}" class="nav-link ${isActive ? 'active' : ''}" onclick="closeSidebar()">${icon(ic)}${label}</a>`;
      }).join('')}
    </nav>
    <div class="sidebar-footer">
      <div style="padding:9px 12px;color:#94a3b8;font-size:12px;">
        ${icon('zap')} Mohan E Ride v1.0
      </div>
    </div>`;
}

function openSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.add('open');
  if (overlay) overlay.classList.add('visible');
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('visible');
}

// ─── FORMATTING ───────────────────────────────────────────────────────────────
function formatINR(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(n || 0);
}

function formatINRPlain(n) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(n || 0);
}

function formatDate(d) {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return d; }
}

function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function statusBadge(status) {
  const cls = { DRAFT: 'badge-draft', ISSUED: 'badge-issued', PAID: 'badge-paid', CANCELLED: 'badge-cancelled' };
  return `<span class="badge ${cls[status] || 'badge-draft'}">${status || 'DRAFT'}</span>`;
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function showToast(msg, isError = false) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `toast${isError ? ' error' : ''}`;
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.add('hide'), 3500);
}

// ─── TAX CALCULATION (REVERSE / GST-INCLUSIVE) ────────────────────────────────
// The user enters the SELLING PRICE (Grand Total, tax inclusive).
// We back-calculate the taxable value and the tax amounts.
//
// Example with IGST 5%:
//   Grand Total = ₹40,000
//   Taxable Value = 40000 / 1.05 = 38095.24
//   IGST 5% = 38095.24 × 0.05 = 1904.76
//   Check: 38095.24 + 1904.76 = 40000.00 ✓
//
function roundToTwo(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

function calcGSTInclusive({ grandTotal, taxType, cgstRate, sgstRate, igstRate }) {
  const gt = parseFloat(grandTotal) || 0;
  const isInterState = taxType === 'inter';
  let taxableValue, cgst = 0, sgst = 0, igst = 0;

  if (isInterState) {
    const rate   = parseFloat(igstRate) || 0;
    taxableValue = roundToTwo(gt / (1 + rate / 100));
    igst         = roundToTwo(gt - taxableValue);
  } else {
    const cr     = parseFloat(cgstRate) || 0;
    const sr     = parseFloat(sgstRate) || 0;
    const total  = cr + sr;
    taxableValue = roundToTwo(gt / (1 + total / 100));
    cgst         = roundToTwo(taxableValue * cr / 100);
    sgst         = roundToTwo(taxableValue * sr / 100);
    // Ensure grand total matches exactly (rounding correction)
    const diff = roundToTwo(gt - taxableValue - cgst - sgst);
    if (diff !== 0) cgst = roundToTwo(cgst + diff);
  }

  return {
    grandTotal:   gt,
    taxableValue,
    isInterState,
    cgst, sgst, igst,
    cgstRate: parseFloat(cgstRate) || 0,
    sgstRate: parseFloat(sgstRate) || 0,
    igstRate: parseFloat(igstRate) || 0,
  };
}

// Keep alias for compatibility
const calcSimpleInvoice = calcGSTInclusive;

// ─── INIT ─────────────────────────────────────────────────────────────────────
window.addEventListener('hashchange', buildSidebar);

document.addEventListener('DOMContentLoaded', () => {
  buildSidebar();
});
