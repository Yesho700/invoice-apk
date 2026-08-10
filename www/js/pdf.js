/**
 * pdf.js — Client-side PDF generation.
 * Generates a pixel-perfect A4 PDF from the existing invoice HTML template.
 * Uses locally bundled html2canvas + jsPDF.
 */

const PDFGenerator = (() => {
  function getPDFFilename(invoice) {
    const num = (invoice.invoiceNumber || 'INVOICE').replace(/\//g, '-');
    return `Invoice_${num}.pdf`;
  }

  function getFolderPath(invoice) {
    const date = new Date(invoice.invoiceDate || invoice.createdAt || Date.now());
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `Mohan E Ride/Invoices/${year}/${month}`;
  }

  async function generate(invoice, settings) {
    await loadDeps();

    const html = InvoiceTemplate.buildInvoiceHTML(invoice, settings);

    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 794px;
      background: white;
      z-index: -9999;
      font-family: 'Segoe UI', Arial, sans-serif;
    `;
    container.innerHTML = html;
    document.body.appendChild(container);

    await waitForImages(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 794,
      });

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * pageW) / canvas.width;

      if (imgH > pageH) {
        let y = 0;
        while (y < imgH) {
          if (y > 0) pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, -y, imgW, imgH);
          y += pageH;
        }
      } else {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);
      }

      const filename = getPDFFilename(invoice);
      const folderPath = getFolderPath(invoice);

      const blob = pdf.output('blob');
      const base64 = pdf.output('datauristring').split(',')[1];

      await savePDF(blob, base64, filename, folderPath);

      return { blob, filename, base64, folderPath };
    } finally {
      document.body.removeChild(container);
    }
  }

  async function savePDF(blob, base64, filename, folderPath) {
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      try {
        const { Filesystem, Directory } = window.Capacitor.Plugins;
        const fullFolder = folderPath;
        try {
          await Filesystem.mkdir({
            path: fullFolder,
            directory: Directory.Documents,
            recursive: true,
          });
        } catch {}

        await Filesystem.writeFile({
          path: `${fullFolder}/${filename}`,
          data: base64,
          directory: Directory.Documents,
        });

        console.log(`PDF saved to Documents/${fullFolder}/${filename}`);
      } catch (e) {
        console.error('Failed to save PDF to device:', e);
        downloadBlob(blob, filename);
      }
    } else {
      downloadBlob(blob, filename);
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  async function sharePDF(invoice, settings) {
    showToast('Generating PDF for sharing...');
    const result = await generate(invoice, settings);

    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      try {
        const { Filesystem, Directory, Share } = window.Capacitor.Plugins;
        const fileResult = await Filesystem.getUri({
          path: `${result.folderPath}/${result.filename}`,
          directory: Directory.Documents,
        });

        await Share.share({
          title: `Invoice ${invoice.invoiceNumber}`,
          text: `Invoice for ${invoice.buyerName} — ₹${(invoice.grandTotal || 0).toLocaleString('en-IN')}`,
          url: fileResult.uri,
          dialogTitle: 'Share Invoice PDF',
        });
      } catch (e) {
        console.error('Share failed:', e);
        showToast('Share failed. PDF has been downloaded instead.', true);
      }
    } else if (navigator.share && result.blob) {
      try {
        const file = new File([result.blob], result.filename, { type: 'application/pdf' });
        await navigator.share({ title: `Invoice ${invoice.invoiceNumber}`, files: [file] });
      } catch {}
    } else {
      showToast('PDF downloaded. Open it to share.');
    }
  }

  function printInvoice(invoice, settings) {
    const html = InvoiceTemplate.buildInvoiceHTML(invoice, settings);
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <link rel="stylesheet" href="css/invoice-template.css">
  <style>body { margin: 0; } @media print { @page { size: A4 portrait; margin: 0; } }</style>
</head>
<body>${html}<script>window.onload=()=>setTimeout(()=>window.print(),300);</script>
</body>
</html>`);
    win.document.close();
  }

  function waitForImages(container) {
    const images = container.querySelectorAll('img');
    if (!images.length) return Promise.resolve();
    return Promise.all(Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 3000);
      });
    }));
  }

  let depsLoaded = false;
  function loadDeps() {
    if (depsLoaded) return Promise.resolve();
    return new Promise((resolve, reject) => {
      // Load local html2canvas
      const s1 = document.createElement('script');
      s1.src = 'js/lib/html2canvas.min.js';
      s1.onload = () => {
        // Load local jsPDF
        const s2 = document.createElement('script');
        s2.src = 'js/lib/jspdf.umd.min.js';
        s2.onload = () => { depsLoaded = true; resolve(); };
        s2.onerror = reject;
        document.head.appendChild(s2);
      };
      s1.onerror = reject;
      document.head.appendChild(s1);
    });
  }

  return { generate, sharePDF, printInvoice, downloadBlob, getPDFFilename, getFolderPath };
})();
