const puppeteer = require('puppeteer');
const numberToWords = require('number-to-words');
const fs = require('fs');
const path = require('path');

// Helper to find system Chrome or Chromium binary if Puppeteer default is missing in container
const getExecutablePath = () => {
    if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
    const possiblePaths = [
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/snap/bin/chromium',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ];
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) return p;
    }
    return undefined;
};

const launchPuppeteerBrowser = async () => {
    const execPath = getExecutablePath();
    const launchOptions = {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process'
        ]
    };
    if (execPath) {
        launchOptions.executablePath = execPath;
    }
    return await puppeteer.launch(launchOptions);
};

// Robust Currency Formatter
const formatCurrency = (amount) => {
    const numericAmount = Number(amount) || 0;
    const fixedAmount = numericAmount.toFixed(2);
    return Number(fixedAmount).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

// Date Formatter
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return 'Invalid Date';
    }
};

/**
 * Generates an Invoice PDF in memory and returns it as a Base64 string.
 * @param {Object} invoice 
 * @param {Object} garage 
 * @param {Array} items 
 * @returns {Promise<string>} Base64 encoded PDF string
 */
exports.generateInvoicePDF = async (invoice, garage, items) => {
    // 1. Calculate base totals from the items list
    const calculatedTotals = items.reduce((acc, item) => {
        acc.totalParts += Number(item.line_parts_calculated) || 0;
        acc.totalLubes += Number(item.lube_charge) || 0;
        acc.totalLabour += Number(item.labour_charge) || 0;
        return acc;
    }, { totalParts: 0, totalLubes: 0, totalLabour: 0 });

    const subTotal = calculatedTotals.totalParts + calculatedTotals.totalLubes + calculatedTotals.totalLabour;

    // 2. Calculate discount from the invoice header data
    let discountAmount = 0;
    const invoiceDiscountValue = Number(invoice.discount_value) || 0;

    if (invoice.discount_type === 'Percent') {
        discountAmount = (subTotal * invoiceDiscountValue) / 100;
    } else {
        discountAmount = invoiceDiscountValue;
    }

    // 3. Calculate tax and final grand total
    const amountBeforeTax = subTotal - discountAmount;
    const taxRate = Number(invoice.tax_rate) || 0;
    const taxAmount = (amountBeforeTax * taxRate) / 100;
    const grandTotal = amountBeforeTax + taxAmount;

    // 4. Amount in Words
    const total = Number(grandTotal) || 0; 
    let amountInWords = 'RUPEES ZERO ONLY';
    if (total > 0) {
        const integerPart = Math.floor(total);
        const decimalPart = Math.round((total - integerPart) * 100);
        let words = numberToWords.toWords(integerPart).toUpperCase();
        if (decimalPart > 0) {
            words += ` AND PAISE ${numberToWords.toWords(decimalPart).toUpperCase()}`;
        }
        amountInWords = `RUPEES ${words} ONLY`;
    }

    const minTableRows = 6;
    
    // Embed logo as base64 to ensure Puppeteer renders it instantly without network requests
    let logoHtml = '';
    if (garage?.logo_url) {
        try {
            const logoPath = path.join(__dirname, '..', garage.logo_url);
            if (fs.existsSync(logoPath)) {
                const ext = path.extname(logoPath).substring(1) || 'png';
                const logoBuffer = fs.readFileSync(logoPath);
                const base64 = logoBuffer.toString('base64');
                logoHtml = `<img src="data:image/${ext};base64,${base64}" alt="Logo" style="max-height: 80px; max-width: 250px; object-fit: contain; margin-bottom: 12px;" />`;
            }
        } catch (e) {
            console.error('Failed to load logo for PDF:', e);
        }
    }

    // Generate HTML string matching the frontend design exactly
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
            body { font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #333; margin: 0; padding: 0; }
            .invoice-paper { padding: 15px 30px; background: #fff; }
            .text-end { text-align: right; }
            .text-center { text-align: center; }
            .fw-bold { font-weight: bold; }
            .fw-semibold { font-weight: 600; }
            .small { font-size: 10px; }
            .text-muted { color: #6c757d; }
            .text-uppercase { text-transform: uppercase; }
            .mb-0 { margin-bottom: 0; }
            .mb-1 { margin-bottom: 2px; }
            .mb-2 { margin-bottom: 4px; }
            .mb-3 { margin-bottom: 12px; }
            .mb-4 { margin-bottom: 16px; }
            .my-3 { margin-top: 12px; margin-bottom: 12px; }
            .my-2 { margin-top: 6px; margin-bottom: 6px; }
            .pt-2 { padding-top: 6px; }
            .ps-3 { padding-left: 12px; }
            .p-2 { padding: 6px; }
            .border { border: 1px solid #dee2e6; }
            .border-top { border-top: 1px solid #dee2e6; }
            .border-end { border-right: 1px solid #dee2e6; }
            .border-bottom { border-bottom: 1px solid #dee2e6; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 0.5rem; }
            th, td { padding: 6px; border: 1px solid #000 !important; }
            th { background-color: #f8f9fa; font-weight: 600; text-align: left; }
            .table-light th, .table-light td { background-color: #f8f9fa; }
            
            .header-row { display: flex; justify-content: space-between; align-items: flex-start; }
            .company-name { font-size: 26px; margin: 0 0 6px 0; font-weight: 700; color: #000; }
            
            .meta-row { display: flex; justify-content: space-between; margin-top: 24px; padding-bottom: 16px; border-bottom: 1px solid #dee2e6; }
            .bill-to { width: 50%; padding-right: 16px; }
            .invoice-details { width: 50%; padding-left: 16px; }
            
            .detail-grid { display: grid; grid-template-columns: 120px 1fr; gap: 4px; }
            .footer-row { display: flex; justify-content: space-between; margin-top: 24px; padding-top: 16px; border-top: 1px solid #dee2e6; }
            .terms { width: 60%; }
            .signature { width: 40%; text-align: center; padding-top: 40px; }
            
            .text-danger { color: #dc3545; }
        </style>
    </head>
    <body>
        <div class="invoice-paper" style="border: 1px solid #dee2e6;">
            <div class="header-row" style="margin-bottom: 12px;">
                <div>
                    ${logoHtml}
                    <h1 class="company-name">${garage?.name || 'SAMAN MOTORS'}</h1>
                    <p class="mb-1 small fw-bold">ALL CARS SPARES SALES & SERVICE STATION</p>
                    <p class="mb-1 small">${garage?.address || 'Opp. Geeta Hume Pipe, Vasad Road, Vaghwala, Borsad - 388540'}</p>
                    <p class="mb-0 small">GSTIN No.: ${garage?.gst_number || invoice.gstinNo || '24BBDPK3507P1ZK'} | Phone: ${garage?.phone || ''}</p>
                </div>
                <div class="text-end">
                    <h2 class="mb-1 text-uppercase fw-bold" style="font-size: 20px;">TAX INVOICE</h2>
                    <p class="mb-0 small text-muted">(Original for Recipient)</p>
                </div>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #000;">
            
            <div class="meta-row mb-4">
                <div class="bill-to">
                    <div class="small text-uppercase mb-2 fw-semibold text-muted">Bill To:</div>
                    <strong style="display: block; font-size: 14px; margin-bottom: 4px;">${invoice.customer_name || 'N/A'}</strong>
                    <div class="small text-muted">
                        ${invoice.customer_address || 'N/A'}<br/>
                        Mob: ${invoice.customer_phone || 'N/A'}<br/>
                        GSTIN: ${invoice.customer_gstin || 'N/A'}
                    </div>
                </div>
                <div class="invoice-details" style="border-left: 1px solid #eee;">
                    <div class="detail-grid small">
                        <div class="text-muted">Invoice No:</div> <div class="fw-bold">${invoice.invoice_number || 'N/A'}</div>
                        <div class="text-muted">Invoice Date:</div> <div>${formatDate(invoice.date_issued)}</div>
                        <div class="text-muted">Job Card No:</div> <div>${invoice.job_sheet_number || invoice.jobSheetNumber || 'N/A'}</div>
                        <div class="text-muted">Vehicle No:</div> <div class="fw-bold">${invoice.vehicle_car_number || 'N/A'}</div>
                        <div class="text-muted">Model:</div> <div>${`${invoice.vehicle_make || ''} ${invoice.vehicle_model || 'N/A'}`.trim()}</div>
                        <div class="text-muted">KM Reading:</div> <div>${invoice.km_reading != null ? `${invoice.km_reading} KM` : 'N/A'}</div>
                    </div>
                </div>
            </div>
            
            <table>
                <thead class="table-light align-middle">
                    <tr>
                        <th class="text-center" style="width: 30px;">#</th>
                        <th style="width: 80px;">Part No.</th>
                        <th>Description</th>
                        <th class="text-center" style="width: 40px;">Qty</th>
                        <th class="text-end" style="width: 80px;">Parts Amt</th>
                        <th class="text-end" style="width: 80px;">Lubes Amt</th>
                        <th class="text-end" style="width: 80px;">Labour Amt</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map((item, index) => `
                        <tr>
                            <td class="text-center">${index + 1}</td>
                            <td>${item.part_no || '-'}</td>
                            <td>${item.name || 'N/A'}</td>
                            <td class="text-center">${item.quantity || 0}</td>
                            <td class="text-end">${formatCurrency(item.line_parts_calculated)}</td>
                            <td class="text-end">${formatCurrency(item.lube_charge)}</td>
                            <td class="text-end">${formatCurrency(item.labour_charge)}</td>
                        </tr>
                    `).join('')}
                    ${Array.from({ length: Math.max(0, minTableRows - items.length) }).map(() => `
                        <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="4" rowspan="8" class="border-end p-2" style="vertical-align: top;">
                            <div class="mb-3">
                                <strong class="small text-uppercase text-muted" style="display: block;">Amount in Words:</strong>
                                <span class="fw-semibold" style="font-size: 11px;">${amountInWords}</span>
                            </div>
                            <div class="my-2 pt-2 border-top">
                                <strong class="small text-uppercase text-muted" style="display: block; margin-bottom: 4px;">Bank Details:</strong>
                                <div class="small">
                                    <span>${garage?.bank_name || invoice.bankBranch || 'HDFC Bank (BORSAD)'}</span><br/>
                                    <span>A/c No: ${garage?.bank_account_no || invoice.bankAccountNo || '07492000002739'}</span><br/>
                                    <span>IFSC: ${garage?.bank_ifsc || invoice.bankIfsc || 'HDFC0000749'}</span>
                                </div>
                            </div>
                        </td>
                        <td colspan="2" class="text-end fw-semibold">TOTAL PARTS</td>
                        <td class="text-end">${formatCurrency(calculatedTotals.totalParts)}</td>
                    </tr>
                    <tr>
                        <td colspan="2" class="text-end fw-semibold">TOTAL LUBES</td>
                        <td class="text-end">${formatCurrency(calculatedTotals.totalLubes)}</td>
                    </tr>
                    <tr>
                        <td colspan="2" class="text-end fw-semibold">TOTAL LABOUR</td>
                        <td class="text-end">${formatCurrency(calculatedTotals.totalLabour)}</td>
                    </tr>
                    <tr>
                        <td colspan="2" class="text-end fw-bold pt-2 border-top">SUB TOTAL</td>
                        <td class="text-end fw-bold pt-2 border-top">${formatCurrency(subTotal)}</td>
                    </tr>
                    ${discountAmount > 0 ? `
                        <tr>
                            <td colspan="2" class="text-end">DISCOUNT ${invoice.discount_type === 'Percent' ? `(${invoice.discount_value}%)` : ''}</td>
                            <td class="text-end" style="color: red;">(-) ${formatCurrency(discountAmount)}</td>
                        </tr>
                    ` : ''}
                    ${taxRate > 0 ? `
                        <tr>
                            <td colspan="2" class="text-end fw-bold">TAXABLE AMOUNT</td>
                            <td class="text-end fw-bold">${formatCurrency(amountBeforeTax)}</td>
                        </tr>
                    ` : ''}
                    ${taxAmount > 0 ? `
                        <tr>
                            <td colspan="2" class="text-end">TAX (${taxRate}%)</td>
                            <td class="text-end">(+) ${formatCurrency(taxAmount)}</td>
                        </tr>
                    ` : ''}
                    <tr class="table-light">
                        <td colspan="2" class="text-end fw-bold" style="font-size: 14px; padding-top: 12px; padding-bottom: 12px;">GRAND TOTAL</td>
                        <td class="text-end fw-bold" style="font-size: 14px; padding-top: 12px; padding-bottom: 12px;">${formatCurrency(grandTotal)}</td>
                    </tr>
                </tfoot>
            </table>
            
            <div class="footer-row">
                <div class="terms small">
                    <strong class="text-muted text-uppercase mb-1" style="display: block;">Terms & Conditions:</strong>
                    ${garage?.terms_and_conditions ? `
                        <div style="white-space: pre-line;">${garage.terms_and_conditions}</div>
                    ` : `
                        <ol class="ps-3 mb-0" style="margin-top: 4px;">
                            <li>Goods once sold will not be taken back or exchanged.</li>
                            <li>Interest @18% p.a. will be charged if payment is not made within the stipulated time.</li>
                            <li>All disputes are subject to BORSAD Jurisdiction only.</li>
                            <li>E. & O. E. (Errors and Omissions Excepted).</li>
                        </ol>
                    `}
                </div>
                <div class="signature">
                    <p class="mb-2 small">For, <strong>${(garage?.name || 'My Garage').toUpperCase()}</strong></p>
                    <p class="small text-muted" style="margin-top: 40px; font-style: italic;">This is a computer-generated invoice and requires no physical signature.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    // Spin up puppeteer to generate PDF
    const browser = await launchPuppeteerBrowser();
    
    try {
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '5mm', right: '5mm', bottom: '5mm', left: '5mm' }
        });
        
        return Buffer.from(pdfBuffer).toString('base64');
    } finally {
        await browser.close();
    }
};

/**
 * Generates a Customer Ledger PDF in memory and returns it as a Base64 string.
 */
exports.generateLedgerPDF = async (customerName, transactions, totalBilled, totalPaid, totalDue, garage, phone, periodText = 'All Transactions') => {
    // Generate HTML string matching the frontend Statement design
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            @page { margin: 10mm; }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #333; margin: 0; padding: 0; background: #fff; }
            .d-flex { display: flex; }
            .justify-content-between { justify-content: space-between; }
            .align-items-start { align-items: flex-start; }
            .align-items-end { align-items: flex-end; }
            .align-items-center { align-items: center; }
            .border-bottom { border-bottom: 1px solid #dee2e6; }
            .border-top { border-top: 1px solid #dee2e6; }
            .border-dark { border-color: #212529 !important; }
            .border-2 { border-width: 2px !important; }
            .pb-2 { padding-bottom: 0.5rem; }
            .pt-1 { padding-top: 0.25rem; }
            .pt-2 { padding-top: 0.5rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-4 { margin-bottom: 1.5rem; }
            .mb-0 { margin-bottom: 0 !important; }
            .my-1 { margin-top: 0.25rem; margin-bottom: 0.25rem; }
            .mt-5 { margin-top: 3rem; }
            .gap-2 { gap: 0.5rem; }
            .text-end { text-align: right; }
            .text-center { text-align: center; }
            .text-muted { color: #6c757d; }
            .text-dark { color: #212529; }
            .text-secondary { color: #6c757d; }
            .text-uppercase { text-transform: uppercase; }
            .fw-bold { font-weight: 700; }
            .fw-semibold { font-weight: 600; }
            .bg-light { background-color: #f8f9fa; }
            .border { border: 1px solid #dee2e6; }
            .rounded { border-radius: 0.25rem; }
            .p-2 { padding: 0.5rem; }
            .px-3 { padding-left: 1rem; padding-right: 1rem; }
            .row { display: flex; flex-wrap: wrap; margin-left: -2px; margin-right: -2px; }
            .col-6 { flex: 0 0 50%; max-width: 50%; padding-left: 2px; padding-right: 2px; }
            .col-4 { flex: 0 0 33.333333%; max-width: 33.333333%; padding-left: 2px; padding-right: 2px; }
            .col-7 { flex: 0 0 58.333333%; max-width: 58.333333%; padding-left: 2px; padding-right: 2px; }
            .col-5 { flex: 0 0 41.666667%; max-width: 41.666667%; padding-left: 2px; padding-right: 2px; }
            .g-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; padding-left: 0.25rem; padding-right: 0.25rem; }
            .g-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; padding-left: 0.5rem; padding-right: 0.5rem; }
            .fs-6 { font-size: 1rem; }
            .small { font-size: 0.875em; }
            hr { border: 0; border-top: 1px solid rgba(0,0,0,.1); }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 0.5rem; }
            th { background-color: #343a40; color: #fff; padding: 6px 8px; font-size: 10px; font-weight: 600; text-transform: uppercase; border: 1px solid #dee2e6; text-align: left; }
            td { padding: 6px 8px; font-size: 11px; border: 1px solid #dee2e6; color: #212529; }
            .table-striped tbody tr:nth-of-type(odd) { background-color: rgba(0,0,0,.02); }
            .text-success { color: #198754 !important; }
            .text-danger { color: #dc3545 !important; }
            .mono-val { font-family: monospace; font-size: 11px; font-weight: 500; }
        </style>
    </head>
    <body>
        <div class="statement-paper">
          <!-- HEADER SECTION -->
          <table style="width: 100%; border-bottom: 2px solid #343a40; padding-bottom: 8px; margin-bottom: 15px;">
            <tr>
              <td style="width: 50%; vertical-align: top;">
                <div style="display: inline-block; vertical-align: middle;">
                  ${garage?.logo_url ? `<img src="${garage.logo_url.startsWith('http') ? garage.logo_url : `http://localhost:5001${garage.logo_url}`}" alt="Garage Logo" style="height: 32px; max-width: 140px; object-fit: contain; margin-right: 10px;" />` : ''}
                </div>
                <div style="display: inline-block; vertical-align: middle;">
                  <h5 style="font-weight: bold; color: #212529; margin: 0; font-size: 15pt; letter-spacing: -0.3px;">${garage?.name || 'SAMAN MOTORS'}</h5>
                  <p style="margin: 0; color: #6c757d; font-size: 8.5pt;">
                    ${garage?.address || 'Service Station Address'} &nbsp;|&nbsp; Phone: ${garage?.phone || 'N/A'} &nbsp;|&nbsp; GSTIN: ${garage?.gst_number || 'N/A'}
                  </p>
                </div>
              </td>
              <td style="width: 50%; vertical-align: top; text-align: right;">
                <h5 style="font-weight: bold; color: #212529; margin: 0; font-size: 14pt; letter-spacing: 0.5px;">ACCOUNT LEDGER</h5>
                <p style="margin: 0; color: #6c757d; font-size: 8pt;">
                  <strong>Date:</strong> ${formatDate(new Date().toISOString())} &nbsp;|&nbsp; <strong>Period:</strong> ${periodText || 'All Transactions'}
                </p>
              </td>
            </tr>
          </table>

          <!-- CUSTOMER & BANK INFORMATION SECTION -->
          <table style="width: 100%; font-size: 8.5pt; line-height: 1.4; background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 8px; margin-bottom: 10px;">
            <tr>
              <td style="width: 50%;">
                <span style="color: #6c757d; font-size: 7.5pt; text-transform: uppercase;">Customer Name:</span><br />
                <strong style="color: #212529; font-size: 14px;">${customerName}</strong>
              </td>
              <td style="width: 50%; text-align: right;">
                <span style="color: #6c757d; font-size: 7.5pt; text-transform: uppercase;">Mobile / Email:</span><br />
                <span style="font-weight: 600; color: #212529;">${phone || 'N/A'}</span>
              </td>
            </tr>
            <tr>
              <td colspan="2"><hr style="margin: 5px 0; opacity: 0.3; border-top: 1px solid #6c757d;" /></td>
            </tr>
            <tr>
              <td style="width: 33.33%;"><span style="color: #6c757d; font-size: 7.5pt;">Bank Name:</span> <strong style="color: #212529;">${garage?.bank_name || 'HDFC Bank (BORSAD)'}</strong></td>
              <td style="width: 33.33%;"><span style="color: #6c757d; font-size: 7.5pt;">Account No:</span> <strong style="color: #212529;">${garage?.bank_account_no || '07492000002739'}</strong></td>
              <td style="width: 33.33%; text-align: right;"><span style="color: #6c757d; font-size: 7.5pt;">IFSC Code:</span> <strong style="color: #212529;">${garage?.bank_ifsc || 'HDFC0000749'}</strong></td>
            </tr>
          </table>

          <!-- TRANSACTION TABLE -->
          <table class="table-striped" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #343a40; color: white;">
                <th style="padding: 5px; text-align: center; width: 5%;">SR</th>
                <th style="padding: 5px; text-align: left; width: 15%;">Date</th>
                <th style="padding: 5px; text-align: left; width: 20%;">Reference No.</th>
                <th style="padding: 5px; text-align: left; width: 20%;">Vehicle No.</th>
                <th style="padding: 5px; text-align: right; width: 12%;">Debit (₹)</th>
                <th style="padding: 5px; text-align: right; width: 12%;">Credit (₹)</th>
                <th style="padding: 5px; text-align: right; width: 16%;">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.length === 0 ? `<tr><td colspan="7" style="text-align: center; color: #6c757d; padding: 15px;">No transactions found in this period.</td></tr>` : ''}
              ${transactions.map((item, i) => `
                <tr style="border-bottom: 1px solid #dee2e6;">
                  <td style="padding: 5px; text-align: center;">${i + 1}</td>
                  <td style="padding: 5px; text-align: left;">${formatDate(item.date_issued || item.dateIssued || item.dueDate)}</td>
                  <td style="padding: 5px; text-align: left;">${item.refNo || '-'}</td>
                  <td style="padding: 5px; text-align: left;">${item.vehicle_number || item.vehicleNumber || 'N/A'}</td>
                  <td style="padding: 5px; text-align: right;" class="mono-val">${formatCurrency(item.billed)}</td>
                  <td style="padding: 5px; text-align: right;" class="text-success mono-val">${formatCurrency(item.paid)}</td>
                  <td style="padding: 5px; text-align: right;" class="fw-bold mono-val">
                    ${formatCurrency(Math.abs(item.runningBalance))} ${item.runningBalance > 0 ? 'Dr' : item.runningBalance < 0 ? 'Cr' : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- SUMMARY SECTION -->
          <table style="width: 100%; margin-top: 15px; font-size: 8.5pt;">
            <tr>
              <td style="width: 60%; vertical-align: top;">
                <p style="margin: 0; color: #6c757d; padding-right: 20px;">
                  <strong>Declaration:</strong> This is a computer-generated Account Ledger Statement. All entries are subject to audit and verification.
                </p>
              </td>
              <td style="width: 40%; vertical-align: top;">
                <div style="border: 1px solid #dee2e6; border-radius: 4px; padding: 8px; background-color: #f8f9fa;">
                  <table style="width: 100%;">
                    <tr>
                      <td style="padding-bottom: 4px;">Total Debit (Billed):</td>
                      <td style="text-align: right; padding-bottom: 4px;" class="mono-val fw-bold">${formatCurrency(totalBilled)}</td>
                    </tr>
                    <tr>
                      <td style="color: #198754; padding-bottom: 4px;">Total Credit (Paid):</td>
                      <td style="text-align: right; color: #198754; padding-bottom: 4px;" class="mono-val fw-bold">${formatCurrency(totalPaid)}</td>
                    </tr>
                    <tr>
                      <td colspan="2"><hr style="margin: 2px 0; border-top: 1px solid #343a40;" /></td>
                    </tr>
                    <tr style="background-color: #F0F0F0;">
                      <td style="color: #dc3545; font-weight: bold; padding: 4px;">Closing Outstanding Balance:</td>
                      <td style="text-align: right; color: #dc3545; font-weight: bold; padding: 4px;" class="mono-val">${formatCurrency(totalDue)} Dr</td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>
          </table>

          <!-- FOOTER SECTION -->
          <table style="width: 100%; margin-top: 40px; border-top: 1px solid #dee2e6; padding-top: 10px; font-size: 8pt;">
            <tr>
              <td style="width: 60%; vertical-align: bottom; color: #6c757d;">
                Generated by <strong>${(garage?.name || 'Saman Motors').toUpperCase()} Garage Management System</strong> &nbsp;|&nbsp; ${formatDate(new Date().toISOString())}
              </td>
              <td style="width: 40%; vertical-align: bottom; text-align: center;">
                <p style="margin: 0 0 30px 0;">For, <strong>${(garage?.name || 'SAMAN MOTORS').toUpperCase()}</strong></p>
                <div style="border-top: 1px solid #343a40; padding-top: 5px; display: inline-block; width: 80%; color: #212529; font-weight: 600;">Authorized Signatory</div>
              </td>
            </tr>
          </table>
        </div>
    </body>
    </html>
    `;

    const browser = await launchPuppeteerBrowser();
    
    try {
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '5mm', right: '5mm', bottom: '5mm', left: '5mm' }
        });
        
        return Buffer.from(pdfBuffer).toString('base64');
    } finally {
        await browser.close();
    }
};

