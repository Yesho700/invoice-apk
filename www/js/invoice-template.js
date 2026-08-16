/**
 * invoice-template.js — Builds the A4 invoice HTML.
 * Tax logic: GST is INCLUDED in the selling price.
 * taxableValue = grandTotal / (1 + rate/100)  [back-calculated]
 */
const InvoiceTemplate = (function () {
  function escHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildInvoiceHTML(inv, settings) {
    const s   = settings || {};
    const fmt = n => new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(n || 0);

    const fmtDate = d => {
      if (!d) return '';
      try {
        const dt = new Date(d);
        return `${String(dt.getDate()).padStart(2,'0')}-${String(dt.getMonth()+1).padStart(2,'0')}-${dt.getFullYear()}`;
      } catch { return escHtml(d); }
    };

    // Parse vehicleDetails — can be string or object
    let vd = {};
    if (typeof inv.vehicleDetails === 'string') {
      try { vd = JSON.parse(inv.vehicleDetails || '{}'); } catch(e) {}
    } else {
      vd = inv.vehicleDetails || {};
    }

    // buyerFatherName can be in top-level or inside vehicleDetails
    const fatherName = inv.buyerFatherName || vd.buyerFatherName || '';

    // Battery numbers (up to 6)
    const batteries = (vd.batteryNumber || '').split(/[,\n]/).map(x => x.trim());
    while (batteries.length < 6) batteries.push('');

    // Terms — one per line
    const termsRaw = inv.termsAndConditions || s.termsAndConditions || '';
    const terms    = termsRaw.split('\n').filter(Boolean);

    const buyerAddr = [inv.buyerAddress1, inv.buyerCity, inv.buyerState, inv.buyerPincode]
      .filter(Boolean).join(', ');
    const hsnCode   = inv.hsnSac || (inv.items || [])[0]?.hsnSac || '';

    // Tax rows
    let taxRows = '';
    if (!inv.isInterState) {
      taxRows = `
        <tr><td class="tl">SGST (${inv.sgstRate || 0}%)</td><td class="ta">${inv.taxableValue > 0 ? '&#8377; ' + fmt(inv.sgst) : ''}</td></tr>
        <tr><td class="tl">CGST (${inv.cgstRate || 0}%)</td><td class="ta">${inv.taxableValue > 0 ? '&#8377; ' + fmt(inv.cgst) : ''}</td></tr>`;
    } else {
      taxRows = `<tr><td class="tl">IGST (${inv.igstRate || 0}%)</td><td class="ta">${inv.taxableValue > 0 ? '&#8377; ' + fmt(inv.igst) : ''}</td></tr>`;
    }

    return `<div class="invoice-template-container">
      ${inv.copyType ? `<div style="text-align:center;margin-bottom:10px;"><span style="font-weight:700;font-size:12px;letter-spacing:1px;text-transform:uppercase;border:1px solid #111;padding:2px 10px;border-radius:12px;">${escHtml(inv.copyType)}</span></div>` : ''}
      <header class="inv-header">
        <div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
            ${s.dealershipLogoPath ? `<img src="${s.dealershipLogoPath}" style="width:38px;height:38px;object-fit:contain;border-radius:50%">` : '<div class="logo-fb">MER</div>'}
            <h1 class="inv-h1">MOHAN <span style="color:#5be016">E RIDE</span></h1>
          </div>
          <p class="inv-dealer-line">AUTHORIZED DEALER :- ${s.delticLogoPath ? `<img src="${s.delticLogoPath}" style="height:28px;object-fit:contain;vertical-align:middle">` : '<strong>DELTIC</strong>'}</p>
          <p class="inv-dealer-line-p">${escHtml(s.address1 || 'Convent School Road, Tulsi Sagar, Ghazipur')}</p>
          <p class="inv-dealer-line-p">WhatsApp / Call: +91 ${escHtml(s.whatsapp || s.mobile || '6393268950')}</p>
        </div>
        <div style="text-align:right">
          <h2 class="inv-title">TAX INVOICE</h2>
          <table class="inv-meta-table">
            <tr><td class="ml">INV</td><td><strong>${escHtml(inv.invoiceNumber)}</strong></td></tr>
            <tr><td class="ml">Date</td><td style="width:100px">${fmtDate(inv.invoiceDate)}</td></tr>
          </table>
        </div>
      </header>

      <section class="bill-section">
        <div class="bill-header-row">
          <h3 class="bill-label">Billed To</h3>
          <div class="fg" style="width:260px"><strong>Mobile No:</strong><div class="fl">&nbsp;&nbsp;&nbsp;&nbsp;${escHtml(inv.buyerMobile || '')}</div></div>
        </div>
        <div class="customer-row">
          <div class="fg"><strong>Customer Name:</strong><div class="fl">&nbsp;&nbsp;&nbsp;&nbsp;${escHtml(inv.buyerName || '')}</div></div>
          <div class="fg"><strong>S/o:</strong><div class="fl">&nbsp;&nbsp;&nbsp;&nbsp;${escHtml(fatherName)}</div></div>
        </div>
        <div class="customer-full">
          <div class="fg"><strong>Address:</strong><div class="fl">&nbsp;&nbsp;&nbsp;&nbsp;${escHtml(buyerAddr)}</div></div>
        </div>
      </section>

      <table class="inv-table">
        <thead><tr>
          <th style="width:54%;text-align:left">Description &amp; Vehicle Details</th>
          <th class="center" style="width:10%">HSN</th>
          <th class="right" style="width:16%">Rate</th>
          <th class="right" style="width:20%">Amount</th>
        </tr></thead>
        <tbody><tr>
          <td>
            <div style="display: flex; flex-direction: column;">
            <ul class="det-list">
              <li><strong>Brand / Type</strong><span>${escHtml(vd.model || '')}</span></li>
              <li><strong>Model No.</strong><span>${escHtml(vd.variant || '')}</span></li>
              <li><strong>Color</strong><span>${escHtml(vd.colour || '')}</span></li>
              <li><strong>Chassis No.</strong><span style="font-family:monospace">${escHtml(vd.chassisNumber || '')}</span></li>
              <li><strong>Motor No.</strong><span style="font-family:monospace">${escHtml(vd.motorNumber || '')}</span></li>
              <li><strong>Controller No.</strong><span style="font-family:monospace">${escHtml(vd.controllerNumber || '')}</span></li>
              <li><strong>Battery Warranty</strong><span>${escHtml(vd.batteryWarranty || vd.batteryCapacity || '')}</span></li>
            </ul>
            <div class="bat-label">Battery Numbers:</div>
            <div class="bat-lines">
              ${batteries.slice(0, 6).map((b, i) => `<div class="bat-item"><span class="bat-num">${i+1}</span><div class="bat-line">${escHtml(b)}</div></div>`).join('')}
            </div>
            </div>
          </td>
          <td class="center">${escHtml(hsnCode)}</td>
          <td class="right">${inv.taxableValue > 0 ? '&#8377; ' + fmt(inv.taxableValue) : ''}</td>
          <td class="right" style="font-weight:600">${inv.taxableValue > 0 ? '&#8377; ' + fmt(inv.taxableValue) : ''}</td>
        </tr></tbody>
      </table>

      <div class="totals-wrap">
        <table class="tot-table">
          <tr><td class="tl">Subtotal</td><td class="ta">${inv.taxableValue > 0 ? '&#8377; ' + fmt(inv.taxableValue) : ''}</td></tr>
          ${taxRows}
          <tr class="grand"><td class="tl">Grand Total</td><td class="ta">${inv.grandTotal > 0 ? '&#8377; ' + fmt(inv.grandTotal) : ''}</td></tr>
        </table>
      </div>

      <footer class="inv-footer">
        <div class="terms-col">
          <h4>Terms &amp; Conditions</h4>
          <ol>${terms.map(t => `<li>${escHtml(t.replace(/^\d+\.\s*/, ''))}</li>`).join('')}</ol>
        </div>
        <div class="sigs">
          <div class="sig-block"><div class="sig-line"></div><p>Customer Sign</p></div>
          <div class="sig-block">
            <div class="sig-line">${s.signaturePath ? `<img src="${s.signaturePath}" style="height:32px;object-fit:contain">` : ''}</div>
            <p>${escHtml(inv.signatoryName || s.signatoryName || 'Auth. Signatory')}</p>
          </div>
        </div>
      </footer>
    </div>`;
  }

  return { buildInvoiceHTML };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = InvoiceTemplate;
}
