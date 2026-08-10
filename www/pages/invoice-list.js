/**
 * pages/invoice-list.js — View all invoices.
 */
let ivlState = { search: '', page: 1, limit: 20 };

async function renderInvoiceList() {
  ivlState = { search: '', page: 1, limit: 20 };

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
              <h1 class="page-title">All Invoices</h1>
            </div>
          </div>
          <a href="#/invoices/new" class="btn btn-primary">+ New Invoice</a>
        </div>

        <div class="card">
          <div class="search-row">
            <div class="search-input-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" class="search-input" id="ivl-search" placeholder="Search by name, number or mobile..." oninput="ivlDoSearch()">
            </div>
          </div>
          
          <div class="table-wrapper" id="ivl-table-wrap"></div>
          
          <div class="pagination">
            <div class="info" id="ivl-info"></div>
            <button class="btn btn-secondary btn-sm" id="ivl-prev" onclick="ivlPrev()">&lt; Prev</button>
            <button class="btn btn-secondary btn-sm" id="ivl-next" onclick="ivlNext()">Next &gt;</button>
          </div>
        </div>
      </main>
    </div>`;

  buildSidebar();
  ivlLoadData();
}

window.ivlDoSearch = function() {
  ivlState.search = document.getElementById('ivl-search').value;
  ivlState.page = 1;
  ivlLoadData();
};

window.ivlPrev = function() { if (ivlState.page > 1) { ivlState.page--; ivlLoadData(); } };
window.ivlNext = function() { ivlState.page++; ivlLoadData(); };

window.ivlGeneratePDF = async function(id) {
  const inv = Storage.getInvoiceById(id);
  const settings = Storage.getSettings();
  if (!inv) return;
  
  showToast('Generating PDF…');
  try {
    const res = await PDFGenerator.generateDual(inv, settings);
    showToast(`✅ Saved to Documents/${res.customer.folderPath} & Documents/${res.vendor.folderPath}`);
  } catch (e) {
    console.error(e);
    showToast('❌ PDF failed: ' + e.message, true);
  }
};

window.ivlDelete = function(id, num) {
  if (!confirm(`Delete invoice ${num}?\nThis cannot be undone.`)) return;
  Storage.deleteInvoice(id);
  showToast(`Invoice ${num} deleted.`);
  ivlLoadData();
};

function ivlLoadData() {
  const { invoices, total } = Storage.getAllInvoices(ivlState);
  
  const totalPages = Math.ceil(total / ivlState.limit) || 1;
  if (ivlState.page > totalPages) ivlState.page = totalPages;

  document.getElementById('ivl-prev').disabled = ivlState.page <= 1;
  document.getElementById('ivl-next').disabled = ivlState.page >= totalPages;
  document.getElementById('ivl-info').textContent = `Showing ${(ivlState.page-1)*ivlState.limit + 1} to ${Math.min(ivlState.page*ivlState.limit, total)} of ${total}`;

  const wrap = document.getElementById('ivl-table-wrap');
  if (invoices.length === 0) {
    wrap.innerHTML = `<div class="empty-state"><p>No invoices found.</p></div>`;
    return;
  }

  wrap.innerHTML = `
    <table class="data-table">
      <thead><tr>
        <th>Invoice #</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th><th>Actions</th>
      </tr></thead>
      <tbody>
        ${invoices.map(inv => `<tr style="cursor:pointer" onclick="ivlGeneratePDF('${inv.id}')">
          <td><strong style="color:var(--accent)">${escHtml(inv.invoiceNumber)}</strong></td>
          <td>
            <div>${escHtml(inv.buyerName)}</div>
            <div style="font-size:11px;color:var(--text-muted)">${escHtml(inv.buyerMobile)}</div>
          </td>
          <td>${formatDate(inv.invoiceDate)}</td>
          <td>₹${formatINRPlain(inv.grandTotal)}</td>
          <td>${statusBadge(inv.status)}</td>
          <td>
            <div style="display:flex;gap:4px;">
              <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();Router.navigate('#/invoices/${inv.id}/edit')" title="Edit">✏️</button>
              <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();Router.navigate('#/invoices/${inv.id}')" title="View Details">👁️</button>
              <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();ivlDelete('${inv.id}', '${escHtml(inv.invoiceNumber)}')" title="Delete">🗑️</button>
            </div>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}
