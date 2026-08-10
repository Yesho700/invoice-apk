/**
 * pages/dashboard.js — Dashboard page module.
 */
async function renderDashboard() {
  const { invoices, total } = Storage.getAllInvoices({ limit: 1000 });
  const settings = Storage.getSettings();

  const totalRevenue = invoices.reduce((s, inv) => s + (inv.grandTotal || 0), 0);
  const issued = invoices.filter(i => i.status === 'ISSUED').length;
  const paid = invoices.filter(i => i.status === 'PAID').length;
  const draft = invoices.filter(i => i.status === 'DRAFT').length;
  const recent = invoices.slice(0, 5);

  document.getElementById('app-root').innerHTML = `
    <div class="app-layout">
      <aside class="sidebar" id="sidebar"></aside>
      <div class="sidebar-overlay" id="sidebar-overlay" onclick="closeSidebar()"></div>
      <main class="main-content">
        <div class="page-header">
          <div style="display:flex;align-items:center;gap:12px">
            <button class="hamburger-btn" onclick="openSidebar()" id="hamburger-btn">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div>
              <h1 class="page-title">Dashboard</h1>
              <p style="color:var(--text-muted);font-size:12px;margin:0">${settings.brandName} — Invoice Manager</p>
            </div>
          </div>
          <a href="#/invoices/new" class="btn btn-primary">+ New Invoice</a>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="background:rgba(91,224,22,.12);color:#5be016">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">Total Revenue</div>
              <div class="stat-value">₹${formatINRPlain(totalRevenue)}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:rgba(59,130,246,.12);color:#3b82f6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">Total Invoices</div>
              <div class="stat-value">${total}</div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="section-title" style="margin-bottom:16px">Recent Invoices</h3>
          ${recent.length === 0 ? `<div style="text-align:center;padding:40px;color:var(--text-muted)">No invoices yet. <a href="#/invoices/new" style="color:#5be016">Create your first invoice →</a></div>` :
            `<div class="table-wrapper">
              <table class="data-table">
                <thead><tr>
                  <th>Invoice #</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th>
                </tr></thead>
                <tbody>
                  ${recent.map(inv => `<tr onclick="Router.navigate('#/invoices/${inv.id}')" style="cursor:pointer">
                    <td><strong style="color:var(--accent)">${escHtml(inv.invoiceNumber)}</strong></td>
                    <td>${escHtml(inv.buyerName)}</td>
                    <td>${formatDate(inv.invoiceDate)}</td>
                    <td>₹${formatINRPlain(inv.grandTotal)}</td>
                    <td>${statusBadge(inv.status)}</td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>
            <div style="text-align:right;margin-top:12px"><a href="#/invoices" style="color:#5be016;font-size:13px">View all invoices →</a></div>`
          }
        </div>
      </main>
    </div>`;
  buildSidebar();
}
