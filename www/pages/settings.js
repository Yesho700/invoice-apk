/**
 * pages/settings.js — Dealership Settings page.
 */
async function renderSettings() {
  const s = Storage.getSettings();

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
              <h1 class="page-title">⚙️ Dealership Settings</h1>
              <p class="page-subtitle">Configure information visible on the invoice</p>
            </div>
          </div>
          <button class="btn btn-primary" id="settings-save-btn" onclick="settingsSave()">💾 Save Settings</button>
        </div>

        <div class="settings-section">
          <h2 class="settings-section-title">Logos &amp; Signature</h2>
          <div class="form-grid-3">
            <div class="form-group">
              <label class="form-label">Dealership Logo</label>
              <div class="upload-box" id="logo-box">
                ${s.dealershipLogoPath ? `<img src="${s.dealershipLogoPath}" id="logo-preview" />` : '<div id="logo-preview" style="color:var(--text-muted);font-size:11px;padding:10px">No logo</div>'}
                <label class="upload-label" style="margin-top:8px">
                  📷 Choose Image
                  <input type="file" accept="image/*" style="display:none" onchange="settingsUploadImage(this,'dealershipLogoPath','logo-preview','logo-remove')">
                </label>
                <button id="logo-remove" onclick="settingsClearImage('dealershipLogoPath','logo-preview','logo-remove')" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:11px;margin-top:4px; ${s.dealershipLogoPath ? '' : 'display:none;'}">✕ Remove</button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Deltic / Brand Logo</label>
              <div class="upload-box" id="deltic-box">
                ${s.delticLogoPath ? `<img src="${s.delticLogoPath}" id="deltic-preview" />` : '<div id="deltic-preview" style="color:var(--text-muted);font-size:11px;padding:10px">No logo</div>'}
                <label class="upload-label" style="margin-top:8px">
                  📷 Choose Image
                  <input type="file" accept="image/*" style="display:none" onchange="settingsUploadImage(this,'delticLogoPath','deltic-preview','deltic-remove')">
                </label>
                <button id="deltic-remove" onclick="settingsClearImage('delticLogoPath','deltic-preview','deltic-remove')" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:11px;margin-top:4px; ${s.delticLogoPath ? '' : 'display:none;'}">✕ Remove</button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Authorized Signatory Image</label>
              <div class="upload-box" id="sig-box">
                ${s.signaturePath ? `<img src="${s.signaturePath}" id="sig-preview" />` : '<div id="sig-preview" style="color:var(--text-muted);font-size:11px;padding:10px">No signature</div>'}
                <label class="upload-label" style="margin-top:8px">
                  📷 Choose Image
                  <input type="file" accept="image/*" style="display:none" onchange="settingsUploadImage(this,'signaturePath','sig-preview','sig-remove')">
                </label>
                <button id="sig-remove" onclick="settingsClearImage('signaturePath','sig-preview','sig-remove')" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:11px;margin-top:4px; ${s.signaturePath ? '' : 'display:none;'}">✕ Remove</button>
              </div>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h2 class="settings-section-title">Dealership Information</h2>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Invoice Number Prefix</label>
              <input class="form-input" id="s-invoicePrefix" maxlength="10" value="${escHtml(s.invoicePrefix || 'PM')}" />
              <div style="color:var(--text-muted);font-size:10px;margin-top:3px">e.g. PM → PM-26-27-0001</div>
            </div>
            <div class="form-group">
              <label class="form-label">Authorized Signatory Name</label>
              <input class="form-input" id="s-signatoryName" value="${escHtml(s.signatoryName)}" />
            </div>
            <div class="form-group col-span-2">
              <label class="form-label">Dealership Address *</label>
              <input class="form-input" id="s-address1" value="${escHtml(s.address1)}" />
            </div>
            <div class="form-group">
              <label class="form-label">WhatsApp / Mobile *</label>
              <input class="form-input" id="s-whatsapp" value="${escHtml(s.whatsapp || s.mobile)}" />
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h2 class="settings-section-title">Default Tax Rates</h2>
          <p style="color:var(--text-muted);font-size:12px;margin-bottom:12px">These will be pre-filled when creating a new invoice.</p>
          <div class="form-grid-3">
            <div class="form-group">
              <label class="form-label">Default CGST Rate (%)</label>
              <input class="form-input" type="number" id="s-defaultCgstRate" value="${s.defaultCgstRate}" step="0.5" />
            </div>
            <div class="form-group">
              <label class="form-label">Default SGST Rate (%)</label>
              <input class="form-input" type="number" id="s-defaultSgstRate" value="${s.defaultSgstRate}" step="0.5" />
            </div>
            <div class="form-group">
              <label class="form-label">Default IGST Rate (%)</label>
              <input class="form-input" type="number" id="s-defaultIgstRate" value="${s.defaultIgstRate}" step="0.5" />
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h2 class="settings-section-title">Default Terms &amp; Conditions</h2>
          <div style="display:flex;gap:8px;margin-bottom:10px">
            <button class="btn btn-secondary btn-sm" onclick="settingsSetTermsHi()">हिन्दी में सेट करें</button>
            <button class="btn btn-secondary btn-sm" onclick="settingsSetTermsEn()">Set in English</button>
          </div>
          <textarea class="form-input" id="s-termsAndConditions" rows="8" style="resize:vertical;line-height:1.7">${escHtml(s.termsAndConditions)}</textarea>
        </div>

        <div class="settings-section">
          <h2 class="settings-section-title">Data Management</h2>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <button class="btn btn-secondary" onclick="settingsExport()">📤 Export All Data</button>
            <label class="btn btn-secondary" style="cursor:pointer">
              📥 Import Data <input type="file" accept=".json" style="display:none" onchange="settingsImport(this)">
            </label>
          </div>
          <p style="color:var(--text-muted);font-size:11px;margin-top:8px">Export creates a JSON backup of all invoices and settings.</p>
        </div>

      </main>
    </div>`;

  buildSidebar();
  window._pendingImages = {};

  window.settingsUploadImage = (input, field, previewId, removeBtnId) => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target.result;
      window._pendingImages[field] = b64;
      const el = document.getElementById(previewId);
      if (el) el.outerHTML = `<img src="${b64}" id="${previewId}" style="max-height:60px;max-width:100%;object-fit:contain;border-radius:4px;margin-bottom:10px;display:block;margin-left:auto;margin-right:auto;" />`;
      const rmBtn = document.getElementById(removeBtnId);
      if (rmBtn) rmBtn.style.display = 'inline-block';
      showToast('Image ready — click Save Settings to apply.');
    };
    reader.readAsDataURL(file);
  };

  window.settingsClearImage = (field, previewId, removeBtnId) => {
    window._pendingImages[field] = '';
    const el = document.getElementById(previewId);
    if (el) el.outerHTML = `<div id="${previewId}" style="color:var(--text-muted);font-size:11px;padding:10px">Removed (save to confirm)</div>`;
    const rmBtn = document.getElementById(removeBtnId);
    if (rmBtn) rmBtn.style.display = 'none';
    showToast('Image removed — click Save Settings to apply.');
  };

  window.settingsSave = () => {
    const btn = document.getElementById('settings-save-btn');
    btn.disabled = true; btn.textContent = 'Saving…';

    const data = {
      invoicePrefix:     document.getElementById('s-invoicePrefix').value || 'PM',
      signatoryName:     document.getElementById('s-signatoryName').value,
      address1:          document.getElementById('s-address1').value,
      whatsapp:          document.getElementById('s-whatsapp').value,
      defaultCgstRate:   Number(document.getElementById('s-defaultCgstRate').value),
      defaultSgstRate:   Number(document.getElementById('s-defaultSgstRate').value),
      defaultIgstRate:   Number(document.getElementById('s-defaultIgstRate').value),
      termsAndConditions:document.getElementById('s-termsAndConditions').value,
      ...window._pendingImages,
    };

    Storage.saveSettings(data);
    window._pendingImages = {};
    showToast('✅ Settings saved!');
    btn.disabled = false; btn.textContent = '💾 Save Settings';
  };

  window.settingsSetTermsHi = () => { document.getElementById('s-termsAndConditions').value = TERMS_HI; };
  window.settingsSetTermsEn = () => { document.getElementById('s-termsAndConditions').value = TERMS_EN; };

  window.settingsExport = () => {
    const data = {
      invoices: Storage.getAllInvoices({ limit: 9999 }).invoices,
      settings: Storage.getSettings(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `mohan-e-ride-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    showToast('📤 Data exported!');
  };

  window.settingsImport = (input) => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.settings)  Storage.saveSettings(data.settings);
        if (data.invoices)  localStorage.setItem('mer_invoices',  JSON.stringify(data.invoices));
        showToast('✅ Data imported successfully!');
        setTimeout(() => renderSettings(), 800);
      } catch {
        showToast('❌ Invalid backup file', true);
      }
    };
    reader.readAsText(file);
  };
}
