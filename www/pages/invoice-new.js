/**
 * pages/invoice-new.js — Create / Edit Invoice Page
 * Uses GST-inclusive reverse tax logic.
 */

let nfEditId   = null;
let nfSettings = {};

function nfVal(id)     { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
function nfSet(id, v)  { const el = document.getElementById(id); if (el) el.value = v ?? ''; }
function nfNum(id)     { return parseFloat(document.getElementById(id)?.value || '0') || 0; }

async function renderInvoiceNew(params = {}) {
  nfEditId   = params.id || null;
  nfSettings = Storage.getSettings();
  const s    = nfSettings;
  const isEdit = !!nfEditId;

  document.getElementById('app-root').innerHTML = `
    <div class="app-layout">
      <aside class="sidebar" id="sidebar"></aside>
      <div class="sidebar-overlay" id="sidebar-overlay" onclick="closeSidebar()"></div>
      <main class="main-content" style="padding:0;display:flex;flex-direction:column;height:100vh">

        <!-- ── Top Bar ─────────────────────────────────────────── -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid var(--border);flex-shrink:0;background:var(--bg-base)">
          <div style="display:flex;align-items:center;gap:10px">
            <button class="hamburger-btn" onclick="openSidebar()">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div>
              <a href="#/invoices" style="color:var(--text-muted);font-size:12px;display:block">← All Invoices</a>
              <h1 style="color:var(--text-white);font-size:17px;font-weight:700;margin:0">${isEdit ? 'Edit Invoice' : 'Create Invoice'}</h1>
              <div style="color:var(--text-muted);font-size:11px;margin-top:1px">
                Invoice No.: <strong style="color:#5be016" id="nf-inv-num">${isEdit ? '…' : Storage.peekNextInvoiceNumber(s.invoicePrefix || 'PM')}</strong>
              </div>
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn btn-secondary btn-sm" id="nf-preview-toggle" onclick="nfTogglePreview()">Hide Preview</button>
            <button class="btn btn-primary" id="nf-save-btn" onclick="nfSave()">
              ${isEdit ? '💾 Update Invoice' : '💾 Save Invoice'}
            </button>
          </div>
        </div>

        <!-- ── Split Layout ────────────────────────────────────── -->
        <div style="display:flex;flex:1;overflow:hidden" id="nf-split">

          <!-- Form Panel -->
          <div id="nf-form-panel" style="flex:1;overflow-y:auto;padding:16px 20px;min-width:0">

            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px" id="nf-tabs">
              <button class="section-tab active" data-tab="details"     onclick="nfTab('details')">📋 Invoice</button>
              <button class="section-tab"         data-tab="customer"   onclick="nfTab('customer')">👤 Customer</button>
              <button class="section-tab"         data-tab="vehicle"    onclick="nfTab('vehicle')">🛵 Vehicle</button>
              <button class="section-tab"         data-tab="tax"        onclick="nfTab('tax')">₹ Amount & Tax</button>
              <button class="section-tab"         data-tab="terms"      onclick="nfTab('terms')">📝 Terms</button>
            </div>

            <div class="card" id="nf-sec-details">
              <h3 class="section-title">Invoice Details</h3>
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Invoice Number *</label>
                  <input class="form-input" id="nf-invoiceNumber" placeholder="Auto-generated" oninput="nfPreview()" />
                  <div style="color:var(--text-muted);font-size:10px;margin-top:3px">Leave blank to auto-generate</div>
                </div>
                <div class="form-group">
                  <label class="form-label">Invoice Date *</label>
                  <input class="form-input" type="date" id="nf-invoiceDate" oninput="nfPreview()" />
                </div>
              </div>
            </div>

            <div class="card" id="nf-sec-customer" style="display:none">
              <h3 class="section-title">Customer Details</h3>
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Customer Name *</label>
                  <input class="form-input" id="nf-buyerName" oninput="nfPreview()" />
                </div>
                <div class="form-group">
                  <label class="form-label">Father's Name / S/o</label>
                  <input class="form-input" id="nf-buyerFatherName" oninput="nfPreview()" />
                </div>
                <div class="form-group">
                  <label class="form-label">Mobile Number *</label>
                  <input class="form-input" type="tel" id="nf-buyerMobile" maxlength="10" oninput="nfPreview()" />
                </div>
                <div class="form-group col-span-2">
                  <label class="form-label">Address</label>
                  <input class="form-input" id="nf-buyerAddress1" oninput="nfPreview()" />
                </div>
                <div class="form-group">
                  <label class="form-label">City</label>
                  <input class="form-input" id="nf-buyerCity" oninput="nfPreview()" />
                </div>
                <div class="form-group">
                  <label class="form-label">State</label>
                  <input class="form-input" id="nf-buyerState" oninput="nfPreview()" />
                </div>
                <div class="form-group">
                  <label class="form-label">Pincode</label>
                  <input class="form-input" id="nf-buyerPincode" maxlength="6" oninput="nfPreview()" />
                </div>
              </div>
            </div>

            <div class="card" id="nf-sec-vehicle" style="display:none">
              <h3 class="section-title">Vehicle Details</h3>
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Brand / Type *</label>
                  <input class="form-input" id="nf-vModel" placeholder="e.g. Deltic EZ Electric Scooty" oninput="nfPreview()" />
                </div>
                <div class="form-group">
                  <label class="form-label">Model No. / Variant</label>
                  <input class="form-input" id="nf-vVariant" oninput="nfPreview()" />
                </div>
                <div class="form-group">
                  <label class="form-label">Color</label>
                  <input class="form-input" id="nf-vColour" oninput="nfPreview()" />
                </div>
                <div class="form-group">
                  <label class="form-label">Battery Warranty</label>
                  <input class="form-input" id="nf-vBatteryWarranty" placeholder="e.g. 1 Year" oninput="nfPreview()" />
                </div>
                <div class="form-group col-span-2">
                  <label class="form-label">Chassis No. *</label>
                  <input class="form-input" id="nf-vChassis" style="font-family:monospace" oninput="nfPreview()" />
                </div>
                <div class="form-group">
                  <label class="form-label">Motor No. *</label>
                  <input class="form-input" id="nf-vMotor" style="font-family:monospace" oninput="nfPreview()" />
                </div>
                <div class="form-group">
                  <label class="form-label">Controller No.</label>
                  <input class="form-input" id="nf-vController" style="font-family:monospace" oninput="nfPreview()" />
                </div>
              </div>

              <div style="margin-top:16px">
                <h4 style="color:var(--text-light);font-size:13px;font-weight:600;margin-bottom:10px">Battery Numbers</h4>
                <div class="form-grid-2">
                  ${[1,2,3,4,5,6].map(n => `
                  <div class="form-group">
                    <label class="form-label">Battery ${n}</label>
                    <input class="form-input" id="nf-bat${n}" style="font-family:monospace" oninput="nfPreview()" />
                  </div>`).join('')}
                </div>
              </div>
            </div>

            <div class="card" id="nf-sec-tax" style="display:none">
              <h3 class="section-title">Amount &amp; Tax Calculation</h3>
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">HSN / SAC Code *</label>
                  <input class="form-input" id="nf-hsnSac" value="8711" oninput="nfPreview()" />
                </div>
                <div class="form-group">
                  <label class="form-label" style="color:var(--accent)">Selling Price / Grand Total (₹) *</label>
                  <input class="form-input" type="number" id="nf-grandTotal" placeholder="0.00" step="0.01" oninput="nfCalcAndPreview()" style="border-color:var(--accent);font-weight:bold" />
                  <div style="color:var(--text-muted);font-size:10px;margin-top:3px">Enter the final price (GST is included)</div>
                </div>
              </div>

              <div style="margin:14px 0 10px">
                <label class="form-label" style="margin-bottom:8px;display:block">Tax Type</label>
                <div style="display:flex;gap:10px">
                  <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:8px 16px;border:1px solid var(--border);border-radius:8px;font-size:13px;color:var(--text-light)" id="lbl-intra">
                    <input type="radio" name="nf-taxType" value="intra" id="nf-taxIntra" onchange="nfCalcAndPreview()" checked />
                    Intra-State (CGST + SGST)
                  </label>
                  <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:8px 16px;border:1px solid var(--border);border-radius:8px;font-size:13px;color:var(--text-light)" id="lbl-inter">
                    <input type="radio" name="nf-taxType" value="inter" id="nf-taxInter" onchange="nfCalcAndPreview()" />
                    Inter-State (IGST)
                  </label>
                </div>
              </div>

              <div id="nf-intra-rates" class="form-grid-2" style="margin-top:10px">
                <div class="form-group">
                  <label class="form-label">CGST Rate (%)</label>
                  <input class="form-input" type="number" id="nf-cgstRate" value="${s.defaultCgstRate || 2.5}" step="0.5" min="0" max="50" oninput="nfCalcAndPreview()" />
                </div>
                <div class="form-group">
                  <label class="form-label">SGST Rate (%)</label>
                  <input class="form-input" type="number" id="nf-sgstRate" value="${s.defaultSgstRate || 2.5}" step="0.5" min="0" max="50" oninput="nfCalcAndPreview()" />
                </div>
              </div>

              <div id="nf-inter-rates" class="form-grid-2" style="margin-top:10px;display:none">
                <div class="form-group">
                  <label class="form-label">IGST Rate (%)</label>
                  <input class="form-input" type="number" id="nf-igstRate" value="${s.defaultIgstRate || 5}" step="0.5" min="0" max="50" oninput="nfCalcAndPreview()" />
                </div>
              </div>

              <!-- Live Calculated Amounts -->
              <div id="nf-amounts" style="margin-top:16px;background:var(--bg-deep);border-radius:8px;padding:14px;display:grid;grid-template-columns:repeat(2,1fr);gap:10px"></div>
            </div>

            <div class="card" id="nf-sec-terms" style="display:none">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
                <h3 class="section-title" style="margin:0">Terms &amp; Conditions</h3>
                <button id="nf-lang-toggle" class="btn btn-secondary btn-sm" onclick="nfToggleLang()" title="Toggle English / Hindi">
                  English ↔ हिन्दी
                </button>
              </div>
              <div id="nf-lang-badge" style="font-size:11px;color:var(--text-muted);margin-bottom:8px">
                📝 Currently in: <strong id="nf-lang-label">हिन्दी</strong>
              </div>
              <textarea class="form-input" id="nf-terms" rows="6"
                style="resize:vertical;line-height:1.8;font-size:13px"
                oninput="nfPreview()">${escHtml(s.termsAndConditions || TERMS_HI)}</textarea>
              <div class="form-group" style="margin-top:14px">
                <label class="form-label">Authorized Signatory Name</label>
                <input class="form-input" id="nf-signatoryName" value="${escHtml(s.signatoryName || 'Authorized Signatory')}" oninput="nfPreview()" />
              </div>
            </div>

            <div style="display:flex;gap:10px;padding:16px 0;margin-top:8px">
              <button class="btn btn-primary" style="flex:1;font-size:15px;padding:12px" onclick="nfSave()">
                ${isEdit ? '💾 Update Invoice' : '💾 Save & Generate PDF'}
              </button>
            </div>

          </div>

          <div id="nf-preview-panel" style="width:480px;flex-shrink:0;background:#374151;display:flex;flex-direction:column;overflow:hidden;border-left:1px solid var(--border)">
            <div style="padding:10px 16px;background:#1f2937;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
              <div>
                <div style="font-size:12px;font-weight:700;color:#5be016;text-transform:uppercase;letter-spacing:.5px">📄 Live Invoice Preview</div>
              </div>
            </div>
            <div style="flex:1;overflow:auto;padding:16px;display:flex;justify-content:center;align-items:flex-start">
              <div id="nf-live-preview" style="transform-origin:top center;width:794px;background:white"></div>
            </div>
          </div>

        </div>
      </main>
    </div>`;

  buildSidebar();
  nfSetupTabRadioListeners();
  nfDetectAndShowLang();
  nfUpdateAmounts();
  nfPreview();

  if (nfEditId) {
    const inv = Storage.getInvoiceById(nfEditId);
    if (inv) nfLoadInvoice(inv);
  } else {
    nfSet('nf-invoiceDate', new Date().toISOString().split('T')[0]);
  }

  window.addEventListener('resize', nfScalePreview);
}

function nfTab(tab) {
  const sections = ['details','customer','vehicle','tax','terms'];
  sections.forEach(s => {
    const el = document.getElementById(`nf-sec-${s}`);
    if (el) el.style.display = s === tab ? '' : 'none';
  });
  document.querySelectorAll('.section-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
}

function nfSetupTabRadioListeners() {
  ['nf-taxIntra','nf-taxInter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => {
      const isInter = document.getElementById('nf-taxInter')?.checked;
      document.getElementById('nf-intra-rates').style.display = isInter ? 'none' : '';
      document.getElementById('nf-inter-rates').style.display = isInter ? ''     : 'none';
      nfCalcAndPreview();
    });
  });
}

function nfDetectAndShowLang() {
  const terms = document.getElementById('nf-terms')?.value || '';
  const inHindi = isTermsInHindi(terms);
  const lbl = document.getElementById('nf-lang-label');
  if (lbl) lbl.textContent = inHindi ? 'हिन्दी' : 'English';
}

function nfToggleLang() {
  const el = document.getElementById('nf-terms');
  if (!el) return;
  const inHindi = isTermsInHindi(el.value);
  if (inHindi) el.value = TERMS_EN;
  else el.value = TERMS_HI;
  nfDetectAndShowLang();
  nfPreview();
}

function nfGetCalc() {
  const taxType = document.getElementById('nf-taxInter')?.checked ? 'inter' : 'intra';
  return calcGSTInclusive({
    grandTotal: nfNum('nf-grandTotal'),
    taxType,
    cgstRate: nfNum('nf-cgstRate'),
    sgstRate: nfNum('nf-sgstRate'),
    igstRate: nfNum('nf-igstRate'),
  });
}

function nfUpdateAmounts() {
  const c = nfGetCalc();
  const el = document.getElementById('nf-amounts');
  if (!el) return;

  const rows = c.isInterState
    ? [
        ['Selling Price (Entered)', formatINR(c.grandTotal)],
        ['Taxable Value (Base)', formatINR(c.taxableValue)],
        [`IGST (${c.igstRate}%)`, formatINR(c.igst)],
      ]
    : [
        ['Selling Price (Entered)', formatINR(c.grandTotal)],
        ['Taxable Value (Base)', formatINR(c.taxableValue)],
        [`CGST (${c.cgstRate}%)`, formatINR(c.cgst)],
        [`SGST (${c.sgstRate}%)`, formatINR(c.sgst)],
      ];

  el.innerHTML = rows.map(([label, value]) => `
    <div style="background:var(--bg-card);padding:10px;border-radius:6px">
      <div style="color:var(--text-muted);font-size:10px;font-weight:600;text-transform:uppercase">${label}</div>
      <div style="color:var(--text-white);font-weight:700;font-size:14px;margin-top:4px">${value}</div>
    </div>`).join('');
}

function nfCalcAndPreview() {
  nfUpdateAmounts();
  nfPreview();
}

function nfBuildInvoiceData() {
  const c = nfGetCalc();
  const batteries = [1,2,3,4,5,6].map(n => nfVal(`nf-bat${n}`)).filter(Boolean).join(',');

  return {
    invoiceNumber: nfVal('nf-invoiceNumber') || document.getElementById('nf-inv-num')?.textContent || '—',
    invoiceDate:   nfVal('nf-invoiceDate'),
    hsnSac:        nfVal('nf-hsnSac') || '8711',
    buyerName:     nfVal('nf-buyerName'),
    buyerFatherName: nfVal('nf-buyerFatherName'),
    buyerMobile:   nfVal('nf-buyerMobile'),
    buyerAddress1: nfVal('nf-buyerAddress1'),
    buyerCity:     nfVal('nf-buyerCity'),
    buyerState:    nfVal('nf-buyerState'),
    buyerPincode:  nfVal('nf-buyerPincode'),
    isInterState:  c.isInterState,
    taxableValue:  c.taxableValue,
    grandTotal:    c.grandTotal,
    cgst:          c.cgst,
    sgst:          c.sgst,
    igst:          c.igst,
    cgstRate:      c.cgstRate,
    sgstRate:      c.sgstRate,
    igstRate:      c.igstRate,
    termsAndConditions: document.getElementById('nf-terms')?.value || '',
    signatoryName: nfVal('nf-signatoryName'),
    vehicleDetails: {
      model:           nfVal('nf-vModel'),
      variant:         nfVal('nf-vVariant'),
      colour:          nfVal('nf-vColour'),
      chassisNumber:   nfVal('nf-vChassis'),
      motorNumber:     nfVal('nf-vMotor'),
      controllerNumber:nfVal('nf-vController'),
      batteryWarranty: nfVal('nf-vBatteryWarranty'),
      batteryNumber:   batteries,
      buyerFatherName: nfVal('nf-buyerFatherName'),
    },
  };
}

function nfPreview() {
  const container = document.getElementById('nf-live-preview');
  if (!container || typeof InvoiceTemplate === 'undefined') return;
  const inv = nfBuildInvoiceData();
  container.innerHTML = InvoiceTemplate.buildInvoiceHTML(inv, nfSettings);
  nfScalePreview();
}

function nfScalePreview() {
  const container = document.getElementById('nf-live-preview');
  const wrapper   = container?.parentElement;
  if (!container || !wrapper) return;
  const available = wrapper.clientWidth - 32;
  const scale     = Math.min(1, available / 794);
  container.style.transform     = `scale(${scale})`;
  container.style.marginBottom  = `-${Math.round(container.offsetHeight * (1 - scale))}px`;
}

function nfTogglePreview() {
  const panel = document.getElementById('nf-preview-panel');
  const btn   = document.getElementById('nf-preview-toggle');
  if (!panel) return;
  const visible = panel.style.display !== 'none';
  panel.style.display = visible ? 'none' : '';
  if (btn) btn.textContent = visible ? 'Show Preview' : 'Hide Preview';
}

function nfLoadInvoice(inv) {
  const numEl = document.getElementById('nf-inv-num');
  if (numEl) numEl.textContent = inv.invoiceNumber;

  nfSet('nf-invoiceNumber', inv.invoiceNumber);
  nfSet('nf-invoiceDate',   (inv.invoiceDate || '').split('T')[0]);
  nfSet('nf-hsnSac',        inv.hsnSac || '8711');
  nfSet('nf-buyerName',     inv.buyerName);
  nfSet('nf-buyerMobile',   inv.buyerMobile);
  nfSet('nf-buyerAddress1', inv.buyerAddress1);
  nfSet('nf-buyerCity',     inv.buyerCity);
  nfSet('nf-buyerState',    inv.buyerState);
  nfSet('nf-buyerPincode',  inv.buyerPincode);
  nfSet('nf-terms',         inv.termsAndConditions || '');
  nfSet('nf-signatoryName', inv.signatoryName);
  
  nfSet('nf-grandTotal',    inv.grandTotal);

  if (inv.isInterState) {
    const el = document.getElementById('nf-taxInter');
    if (el) { el.checked = true; el.dispatchEvent(new Event('change')); }
    nfSet('nf-igstRate', inv.igstRate || 5);
  } else {
    nfSet('nf-cgstRate', inv.cgstRate || 2.5);
    nfSet('nf-sgstRate', inv.sgstRate || 2.5);
  }

  const vd = typeof inv.vehicleDetails === 'string'
    ? JSON.parse(inv.vehicleDetails || '{}')
    : (inv.vehicleDetails || {});

  nfSet('nf-vModel',          vd.model);
  nfSet('nf-vVariant',        vd.variant);
  nfSet('nf-vColour',         vd.colour);
  nfSet('nf-vChassis',        vd.chassisNumber);
  nfSet('nf-vMotor',          vd.motorNumber);
  nfSet('nf-vController',     vd.controllerNumber);
  nfSet('nf-vBatteryWarranty',vd.batteryWarranty);
  nfSet('nf-buyerFatherName', inv.buyerFatherName || vd.buyerFatherName);

  const bats = (vd.batteryNumber || '').split(',').map(b => b.trim());
  bats.forEach((b, i) => nfSet(`nf-bat${i + 1}`, b));

  nfDetectAndShowLang();
  nfCalcAndPreview();
}

function nfValidate() {
  const errors = [];
  if (!nfVal('nf-invoiceDate'))    errors.push('Invoice Date is required');
  if (!nfVal('nf-buyerName'))      errors.push('Customer Name is required');
  if (!nfVal('nf-buyerMobile'))    errors.push('Mobile Number is required');
  else if (!/^\d{10}$/.test(nfVal('nf-buyerMobile').replace(/\s/g,'')))
                                   errors.push('Mobile must be 10 digits');
  if (!nfVal('nf-vModel'))         errors.push('Vehicle Brand / Type is required');
  if (!nfVal('nf-vChassis'))       errors.push('Chassis Number is required');
  if (!nfVal('nf-vMotor'))         errors.push('Motor Number is required');
  if (!nfVal('nf-hsnSac'))         errors.push('HSN / SAC Code is required');

  const gt = nfNum('nf-grandTotal');
  if (!gt || gt <= 0)              errors.push('Selling Price / Grand Total must be > 0');

  const isInter = document.getElementById('nf-taxInter')?.checked;
  if (isInter && nfNum('nf-igstRate') <= 0) errors.push('IGST Rate must be > 0');
  if (!isInter && (nfNum('nf-cgstRate') + nfNum('nf-sgstRate')) <= 0)
    errors.push('CGST + SGST Rate must be > 0');

  return errors;
}

async function nfSave() {
  const btn = document.getElementById('nf-save-btn');
  const errors = nfValidate();
  if (errors.length) {
    showToast('⚠️ ' + errors[0], true);
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Saving…';

  try {
    const inv = nfBuildInvoiceData();
    const c = nfGetCalc();

    const payload = {
      ...inv,
      vehicleDetails: typeof inv.vehicleDetails === 'string' ? inv.vehicleDetails : JSON.stringify(inv.vehicleDetails)
    };

    let savedInv;
    if (nfEditId) {
      savedInv = Storage.updateInvoiceSimple(nfEditId, payload);
    } else {
      savedInv = Storage.createInvoiceSimple(payload);
    }

    showToast('✅ Invoice saved! Generating PDF…');

    try {
      const settings = Storage.getSettings();
      await PDFGenerator.generate(savedInv, settings);
      showToast('✅ Invoice saved and PDF generated!');
    } catch (pdfErr) {
      console.error('PDF error:', pdfErr);
      showToast('Invoice saved. PDF generation failed.', true);
    }

    setTimeout(() => Router.navigate(`#/invoices/${savedInv.id}`), 1400);

  } catch (e) {
    console.error(e);
    showToast('Error: ' + e.message, true);
    btn.disabled = false;
    btn.textContent = nfEditId ? '💾 Update Invoice' : '💾 Save Invoice';
  }
}
