/**
 * storage.js — All data persisted in localStorage. Works completely offline.
 * Tax logic: GST is INCLUDED in the selling price (reverse calculation).
 * User enters Grand Total (selling price). App back-calculates taxable value + tax.
 */

const Storage = (() => {
  const KEYS = {
    INVOICES: 'mer_invoices',
    SETTINGS: 'mer_settings',
    COUNTER:  'mer_counter',
  };

  function read(key, def = []) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : def;
    } catch { return def; }
  }

  function write(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {
      console.error('Storage write failed:', e);
    }
  }

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  // ─── FINANCIAL YEAR ────────────────────────────────────────────────────────
  function getCurrentFinancialYear() {
    const now   = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();
    if (month >= 4) {
      return `${String(year).slice(2)}-${String(year + 1).slice(2)}`;
    } else {
      return `${String(year - 1).slice(2)}-${String(year).slice(2)}`;
    }
  }

  // ─── INVOICE NUMBER ────────────────────────────────────────────────────────
  // Format: PM-26-27-0001
  function getNextInvoiceNumber(prefix) {
    const counter = read(KEYS.COUNTER, {});
    const fy = getCurrentFinancialYear();
    if (!counter[prefix]) counter[prefix] = {};
    if (!counter[prefix][fy]) counter[prefix][fy] = 0;
    counter[prefix][fy] += 1;
    write(KEYS.COUNTER, counter);
    const seq = String(counter[prefix][fy]).padStart(4, '0');
    return `${prefix}-${fy}-${seq}`;
  }

  function peekNextInvoiceNumber(prefix) {
    const counter = read(KEYS.COUNTER, {});
    const fy      = getCurrentFinancialYear();
    const current = (counter[prefix]?.[fy] || 0) + 1;
    const seq     = String(current).padStart(4, '0');
    return `${prefix}-${fy}-${seq}`;
  }

  // ─── SETTINGS ─────────────────────────────────────────────────────────────
  const DEFAULT_SETTINGS = {
    dealerName:          'MOHAN E RIDE',
    brandName:           'MOHAN E RIDE',
    tagline:             'AUTHORIZED DEALER - DELTIC',
    address1:            'Convent School Road, Tulsi Sagar, Ghazipur',
    address2:            '',
    city:                'Ghazipur',
    state:               'Uttar Pradesh',
    stateCode:           '09',
    pincode:             '233001',
    country:             'India',
    gstin:               '',
    mobile:              '6393268950',
    whatsapp:            '6393268950',
    email:               '',
    signatoryName:       'Authorized Signatory',
    invoicePrefix:       'PM',
    defaultCgstRate:     2.5,
    defaultSgstRate:     2.5,
    defaultIgstRate:     5,
    termsAndConditions:  '1. बेचे गए वाहन किसी भी परिस्थिति में वापस या बदले नहीं जाएंगे।\n2. वारंटी सीधे निर्माण कंपनी द्वारा प्रदान की जाती है और उनके आधिकारिक नियमों और शर्तों के अधीन है।\n3. सभी कानूनी विवाद गाजीपुर शहर न्यायालय के अधिकार क्षेत्र के अधीन हैं।',
    delticLogoPath:      '',
    dealershipLogoPath:  '',
    signaturePath:       '',
  };

  function getSettings() {
    const saved = read(KEYS.SETTINGS, DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS, ...saved };
  }

  function saveSettings(data) {
    const current = getSettings();
    const updated = { ...current, ...data };
    write(KEYS.SETTINGS, updated);
    return updated;
  }

  // ─── INVOICES ─────────────────────────────────────────────────────────────
  function createInvoiceSimple(data) {
    const settings      = getSettings();
    const prefix        = settings.invoicePrefix || 'PM';
    const invoiceNumber = getNextInvoiceNumber(prefix);

    const invoice = {
      id:              uuid(),
      invoiceNumber,
      financialYear:   getCurrentFinancialYear(),
      invoiceDate:     data.invoiceDate || new Date().toISOString().split('T')[0],
      hsnSac:          data.hsnSac || '8711',
      status:          'ISSUED',
      // Buyer
      buyerName:       data.buyerName    || '',
      buyerMobile:     data.buyerMobile  || '',
      buyerAddress1:   data.buyerAddress1 || '',
      buyerCity:       data.buyerCity    || '',
      buyerState:      data.buyerState   || '',
      buyerPincode:    data.buyerPincode || '',
      // Vehicle details (stored as JSON string for template compatibility)
      vehicleDetails:  typeof data.vehicleDetails === 'string'
                         ? data.vehicleDetails
                         : JSON.stringify(data.vehicleDetails || {}),
      // Tax (pre-calculated — GST inclusive reverse calculation)
      isInterState:    data.isInterState  || false,
      grandTotal:      data.grandTotal    || 0,   // what user entered (selling price)
      taxableValue:    data.taxableValue  || 0,   // back-calculated
      cgst:            data.cgst          || 0,
      sgst:            data.sgst          || 0,
      igst:            data.igst          || 0,
      cgstRate:        data.cgstRate      || 0,
      sgstRate:        data.sgstRate      || 0,
      igstRate:        data.igstRate      || 0,
      // Terms & signatory
      termsAndConditions: data.termsAndConditions || settings.termsAndConditions,
      signatoryName:      data.signatoryName      || settings.signatoryName,
      createdAt:       new Date().toISOString(),
      updatedAt:       new Date().toISOString(),
    };

    const invoices = read(KEYS.INVOICES, []);
    invoices.unshift(invoice);
    write(KEYS.INVOICES, invoices);
    return invoice;
  }

  function updateInvoiceSimple(id, data) {
    const invoices = read(KEYS.INVOICES, []);
    const idx      = invoices.findIndex(inv => inv.id === id);
    if (idx === -1) return null;
    invoices[idx] = {
      ...invoices[idx],
      ...data,
      vehicleDetails: typeof data.vehicleDetails === 'string'
        ? data.vehicleDetails
        : JSON.stringify(data.vehicleDetails || {}),
      updatedAt: new Date().toISOString(),
    };
    write(KEYS.INVOICES, invoices);
    return invoices[idx];
  }

  function getAllInvoices({ search = '', status = '', page = 1, limit = 50 } = {}) {
    let invoices = read(KEYS.INVOICES, []);
    if (search) {
      const q = search.toLowerCase();
      invoices = invoices.filter(inv =>
        (inv.invoiceNumber || '').toLowerCase().includes(q) ||
        (inv.buyerName     || '').toLowerCase().includes(q) ||
        (inv.buyerMobile   || '').toLowerCase().includes(q)
      );
    }
    if (status) invoices = invoices.filter(inv => inv.status === status);
    const total = invoices.length;
    const p = parseInt(page), l = parseInt(limit);
    const paginated = invoices.slice((p - 1) * l, p * l);
    return { invoices: paginated, total, page: p, limit: l };
  }

  function getInvoiceById(id) {
    return read(KEYS.INVOICES, []).find(inv => inv.id === id) || null;
  }

  function deleteInvoice(id) {
    const invoices = read(KEYS.INVOICES, []);
    const idx      = invoices.findIndex(inv => inv.id === id);
    if (idx === -1) return false;
    invoices.splice(idx, 1);
    write(KEYS.INVOICES, invoices);
    return true;
  }

  // ─── PUBLIC API ───────────────────────────────────────────────────────────
  return {
    getAllInvoices,
    getInvoiceById,
    createInvoiceSimple,
    updateInvoiceSimple,
    deleteInvoice,
    getNextInvoiceNumber,
    peekNextInvoiceNumber,
    getCurrentFinancialYear,
    getSettings,
    saveSettings,
  };
})();
