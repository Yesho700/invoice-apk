/**
 * pages/invoice-detail.js — Invoice detail / view page.
 */
async function renderInvoiceDetail(params) {
  const inv      = Storage.getInvoiceById(params.id);
  const settings = Storage.getSettings();

  if (!inv) {
    document.getElementById('app-root').innerHTML = `
      <div style="text-align:center;padding:60px;color:#94a3b8">
        <h2>Invoice not found</h2>
        <a href="#/invoices" style="color:#5be016">← Back to Invoices</a>
      </div>`;
    return;
  }

  const vd = typeof inv.vehicleDetails === 'string'
    ? JSON.parse(inv.vehicleDetails || '{}')
    : (inv.vehicleDetails || {});

  document.getElementById('app-root').innerHTML = `
    <div class="app-layout">
      <aside class="sidebar" id="sidebar"></aside>
      <div class="sidebar-overlay" id="sidebar-overlay" onclick="closeSidebar()"></div>
      <main class="main-content">
        <div class="page-header">
          <div style="display:flex;align-items:center;gap:12px">
            <button class="hamburger-btn" onclick="openSidebar()">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div>
              <a href="#/invoices" style="color:var(--text-muted);font-size:12px;display:block">← All Invoices</a>
              <h1 class="page-title" style="font-size:20px">Invoice ${escHtml(inv.invoiceNumber)}</h1>
              <div style="color:var(--text-muted);font-size:12px;margin-top:2px">
                ${inv.buyerName ? escHtml(inv.buyerName) + ' &nbsp;·&nbsp; ' : ''}
                ${formatDate(inv.invoiceDate)} &nbsp;·&nbsp;
                <strong style="color:#5be016">₹${formatINRPlain(inv.grandTotal)}</strong>
              </div>
            </div>
          </div>

          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <a href="#/invoices/${inv.id}/edit" class="btn btn-secondary btn-sm">✏️ Edit</a>
            <button id="detail-pdf-btn" onclick="detailDownloadPDF('${inv.id}')" class="btn btn-primary">
              ⬇️ Generate PDF
            </button>
            <button onclick="detailSharePDF('${inv.id}')" class="btn btn-secondary">
              📤 Share
            </button>
            <button onclick="detailPrint('${inv.id}')" class="btn btn-secondary btn-sm">🖨️ Print</button>
            <button onclick="detailDelete('${inv.id}','${escHtml(inv.invoiceNumber)}')" class="btn btn-danger btn-sm">🗑️</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px">
          ${[
            ['Customer', escHtml(inv.buyerName || '—')],
            ['Date', formatDate(inv.invoiceDate)],
            ['Taxable Value', '₹' + formatINRPlain(inv.taxableValue)],
            ['Tax', inv.isInterState ? `IGST ${inv.igstRate}% = ₹${formatINRPlain(inv.igst)}` : `CGST+SGST ${inv.cgstRate}%+${inv.sgstRate}% = ₹${formatINRPlain((inv.cgst||0)+(inv.sgst||0))}`],
            ['Grand Total', '₹' + formatINRPlain(inv.grandTotal)],
            ['Vehicle', escHtml(vd.model || '—')],
          ].map(([l, v]) => `
            <div class="card" style="padding:12px">
              <div style="color:var(--text-muted);font-size:10px;font-weight:600;text-transform:uppercase;margin-bottom:4px">${l}</div>
              <div style="color:var(--text-white);font-size:13px;font-weight:600">${v}</div>
            </div>`).join('')}
        </div>

        <div style="margin-bottom:12px;display:flex;align-items:center;gap:10px">
          <span style="color:var(--text-muted);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px">📄 Invoice Preview</span>
          <span style="color:var(--text-muted);font-size:11px">(scroll to see full invoice)</span>
        </div>

        <div style="background:#374151;border-radius:12px;padding:20px;overflow-x:auto;min-height:400px">
          <div style="width:794px;margin:0 auto;box-shadow:0 4px 30px rgba(0,0,0,0.5); transform-origin:top left" id="detail-inv-wrap">
          </div>
        </div>

        <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap">
          <button onclick="detailDownloadPDF('${inv.id}')" class="btn btn-primary" style="flex:1;justify-content:center">
            ⬇️ Generate &amp; Save PDF
          </button>
          <button onclick="detailSharePDF('${inv.id}')" class="btn btn-secondary" style="flex:1;justify-content:center">
            📤 Share PDF
          </button>
        </div>

      </main>
    </div>`;

  buildSidebar();
  
  const container = document.getElementById('detail-inv-wrap');
  container.innerHTML = InvoiceTemplate.buildInvoiceHTML(inv, settings);
  
  // Scale down slightly for mobile screens
  if (window.innerWidth < 800) {
      const scale = (window.innerWidth - 64) / 794;
      container.style.transform = `scale(${scale})`;
      container.parentElement.style.height = `${1123 * scale + 40}px`;
  }
}

async function detailDownloadPDF(id) {
  const btn = document.getElementById('detail-pdf-btn');
  const inv = Storage.getInvoiceById(id);
  const settings = Storage.getSettings();
  if (!inv) return showToast('Invoice not found', true);

  if (btn) { btn.disabled = true; btn.textContent = '⏳ Generating…'; }
  showToast('Generating PDF…');

  try {
    const res = await PDFGenerator.generateDual(inv, settings);
    showToast(`✅ Saved to Documents/${res.customer.folderPath} & Documents/${res.vendor.folderPath}`);
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      await PDFGenerator.openPDF(res.customer.folderPath, res.customer.filename);
    }
  } catch (e) {
    console.error(e);
    showToast('❌ PDF failed: ' + e.message, true);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '⬇️ Generate PDF'; }
  }
}

async function detailSharePDF(id) {
  const inv = Storage.getInvoiceById(id);
  const settings = Storage.getSettings();
  if (!inv) return;
  try {
    await PDFGenerator.sharePDF(inv, settings);
  } catch (e) {
    showToast('❌ Share failed', true);
  }
}

function detailPrint(id) {
  const inv = Storage.getInvoiceById(id);
  const settings = Storage.getSettings();
  if (!inv) return;
  PDFGenerator.printInvoice(inv, settings);
}

function detailDelete(id, num) {
  if (!confirm(`Delete invoice ${num}?\nThis cannot be undone.`)) return;
  Storage.deleteInvoice(id);
  showToast(`Invoice ${num} deleted.`);
  Router.navigate('#/invoices');
}
