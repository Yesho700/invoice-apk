/**
 * pdf.js — Client-side PDF generation.
 * Generates a pixel-perfect A4 PDF from the existing invoice HTML template.
 * Uses locally bundled html2canvas + jsPDF.
 */

const PDFGenerator = (() => {
  function getPDFFilename(invoice, copyType = '') {
    const num = (invoice.invoiceNumber || 'INVOICE').replace(/[^a-zA-Z0-9_-]/g, '');
    const name = (invoice.buyerName || 'Customer').replace(/[^a-zA-Z0-9_-]/g, '');
    const date = (invoice.invoiceDate || new Date().toISOString().split('T')[0]);
    const suffix = copyType ? `_${copyType.replace(' ', '')}` : '';
    return `Invoice_${num}_${name}_${date}${suffix}.pdf`;
  }

  function getFolderPath(invoice, copyType = '') {
    const date = new Date(invoice.invoiceDate || invoice.createdAt || Date.now());
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const folderName = copyType ? copyType.replace('Copy', 'Copies') : 'Invoices';
    return `Mohan E Ride/${folderName}/${year}/${month}`;
  }

  async function generate(invoice, settings, copyType = '', skipWebDownload = false) {
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

      const filename = getPDFFilename(invoice, copyType);
      const folderPath = getFolderPath(invoice, copyType);

      const blob = pdf.output('blob');
      const base64 = pdf.output('datauristring').split(',')[1];

      await savePDF(blob, base64, filename, folderPath, skipWebDownload);

      return { blob, filename, base64, folderPath };
    } finally {
      document.body.removeChild(container);
    }
  }

  async function savePDF(blob, base64, filename, folderPath, skipWebDownload = false) {
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
        if (!skipWebDownload) downloadBlob(blob, filename);
      }
    } else {
      if (!skipWebDownload) downloadBlob(blob, filename);
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
    const result = await generate(invoice, settings, '', true);

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
      const file = new File([result.blob], result.filename, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ title: `Invoice ${invoice.invoiceNumber}`, files: [file] });
        } catch (e) {
          if (e.name !== 'AbortError') console.error(e);
        }
      } else {
        downloadBlob(result.blob, result.filename);
        showToast('Sharing files not supported. PDF downloaded instead.');
      }
    } else {
      downloadBlob(result.blob, result.filename);
      showToast('Sharing not supported on this browser. PDF downloaded instead.');
    }
  }

  async function printInvoice(invoice, settings) {
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      showToast('Preparing document...');
      try {
        const result = await generate(invoice, settings, 'Customer Copy', false);
        await openPDF(result.folderPath, result.filename);
      } catch (e) {
        showToast('Failed to open print preview', true);
      }
      return;
    }

    const html = InvoiceTemplate.buildInvoiceHTML(invoice, settings);
    
    let iframe = document.getElementById('print-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe';
      iframe.style.cssText = 'position:fixed;right:100%;bottom:100%;width:0;height:0;border:none';
      document.body.appendChild(iframe);
    }
    
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <link rel="stylesheet" href="css/invoice-template.css">
  <style>body { margin: 0; } @media print { @page { size: A4 portrait; margin: 0; } }</style>
</head>
<body>${html}</body>
</html>`);
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (e) {
          console.error('Print failed:', e);
          showToast('Printing not supported on this browser.', true);
        }
      }, 500);
    };
  }

  async function openPDF(folderPath, filename) {
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      try {
        const { Filesystem, Directory, FileOpener } = window.Capacitor.Plugins;
        if (!FileOpener) {
          console.warn('FileOpener plugin not found');
          return;
        }
        const fileResult = await Filesystem.getUri({
          path: `${folderPath}/${filename}`,
          directory: Directory.Documents,
        });
        await FileOpener.open({
          filePath: fileResult.uri,
          contentType: 'application/pdf',
        });
      } catch (e) {
        console.error('Failed to open PDF:', e);
        showToast('Could not open PDF automatically.', true);
      }
    }
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

  async function generateDual(invoice, settings) {
    showToast('Generating Customer & Vendor copies...');
    
    const invCustomer = { ...invoice, copyType: 'Customer Copy' };
    const resCustomer = await generate(invCustomer, settings, 'Customer Copy', false);
    
    const invVendor = { ...invoice, copyType: 'Vendor Copy' };
    // On the web browser, downloading 2 files at once is annoying spam.
    // We skip the second web download, but on Android APK, both will still be cleanly saved!
    const resVendor = await generate(invVendor, settings, 'Vendor Copy', true);

    return { customer: resCustomer, vendor: resVendor };
  }

  return { generate, generateDual, sharePDF, printInvoice, downloadBlob, openPDF, getPDFFilename, getFolderPath };
})();
