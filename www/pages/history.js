/**
 * pages/history.js — Alias for Invoice List for now.
 */
async function renderHistory() {
  await renderInvoiceList();
  // Just change the title
  const title = document.querySelector('.page-title');
  if (title) title.textContent = 'Invoice History';
}
