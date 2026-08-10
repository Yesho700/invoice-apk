/**
 * pages/storage-info.js — Information about where PDFs are saved.
 */
function renderStorageInfo() {
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
            <h1 class="page-title">PDF Storage Location</h1>
          </div>
        </div>

        <div class="card" style="padding:24px;text-align:center;margin-top:20px;max-width:600px;margin-left:auto;margin-right:auto;">
          <div style="color:var(--brand-green);margin-bottom:16px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h2 style="margin:0 0 10px 0;font-size:20px;color:var(--text-white);">Where are my PDFs saved?</h2>
          <p style="color:var(--text-muted);font-size:14px;line-height:1.6;margin-bottom:24px;">
            Due to Android security rules, apps cannot forcibly open your file manager. However, whenever you generate a PDF, it is automatically saved directly to your phone's native storage.
          </p>
          
          <div style="background:#1f2937;padding:20px;border-radius:8px;text-align:left;margin-bottom:24px;display:inline-block;border:1px solid var(--border-color);width:100%;box-sizing:border-box;">
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Exact Folder Path:</div>
            <div style="font-size:16px;font-family:monospace;color:var(--text-white);line-height:1.8;">
              📁 Internal Storage <br/>
              &nbsp;&nbsp;↳ 📁 Documents <br/>
              &nbsp;&nbsp;&nbsp;&nbsp;↳ 📁 Mohan E Ride <br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;┣ 📁 Customer Copies <br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;┗ 📁 Vendor Copies
            </div>
          </div>

          <p style="color:var(--text-muted);font-size:14px;line-height:1.6;text-align:left;">
            <strong>How to open:</strong><br/>
            1. Open the <strong>"My Files"</strong> or <strong>"File Manager"</strong> app on your Android phone.<br/>
            2. Go to your <strong>Documents</strong> folder.<br/>
            3. Open the <strong>Mohan E Ride</strong> folder.<br/>
            <br/>
            <em>Note: If you are using this app in a web browser instead of the Android APK, your PDFs will simply be saved in your default <strong>Downloads</strong> folder.</em>
          </p>
        </div>
      </main>
    </div>`;
  buildSidebar();
}
