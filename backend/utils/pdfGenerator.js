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
 * High-End A4 Single-Page Proportional Layout with Zero Overflow and Edge-to-Edge Fill.
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

    // 3. Calculate tax, round off, and final grand total
    const amountBeforeTax = Math.max(0, subTotal - discountAmount);
    const taxRate = Number(invoice.tax_rate) || 0;
    const taxAmount = (amountBeforeTax * taxRate) / 100;
    const unroundedGrandTotal = amountBeforeTax + taxAmount;
    const grandTotal = Math.round(unroundedGrandTotal);
    const roundOffAmount = grandTotal - unroundedGrandTotal;

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

    // Embed logo as base64
    let logoHtml = '';
    if (garage?.logo_url) {
        try {
            const logoPath = path.join(__dirname, '..', garage.logo_url);
            if (fs.existsSync(logoPath)) {
                const ext = path.extname(logoPath).substring(1) || 'png';
                const logoBuffer = fs.readFileSync(logoPath);
                const base64 = logoBuffer.toString('base64');
                logoHtml = `<img src="data:image/${ext};base64,${base64}" alt="Logo" style="max-height: 55px; max-width: 180px; object-fit: contain; margin-bottom: 6px; display: block;" />`;
            }
        } catch (e) {
            console.error('Failed to load logo for PDF:', e);
        }
    }

    // Dynamic spacer rows to fill single page gracefully
    const minRows = items.length <= 2 ? 3 : (items.length === 3 ? 1 : 0);
    const spacerRowsCount = Math.max(0, minRows);

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
            @page {
                size: A4 portrait;
                margin: 0;
            }
            * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            html, body {
                box-sizing: border-box;
                width: 100%;
                margin: 0;
                padding: 0;
                background: #fff;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                font-size: 11px;
                line-height: 1.35;
                color: #111;
            }
            .invoice-box {
                width: 100%;
                border: 1.5px solid #222;
                padding: 14px 16px;
                background: #fff;
            }
            .text-end { text-align: right; }
            .text-center { text-align: center; }
            .text-start { text-align: left; }
            .fw-bold { font-weight: 700; }
            .fw-semibold { font-weight: 600; }
            .text-muted { color: #555; }
            .text-uppercase { text-transform: uppercase; }
            
            /* Header */
            .header-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 8px;
            }
            .header-table td {
                vertical-align: top;
                border: none;
                padding: 0;
            }
            .company-name {
                font-size: 22px;
                font-weight: 800;
                color: #000;
                margin: 0 0 2px 0;
                line-height: 1.1;
                letter-spacing: -0.3px;
            }
            .company-sub {
                font-size: 9px;
                font-weight: 700;
                color: #222;
                margin: 0 0 2px 0;
            }
            .company-info {
                font-size: 9px;
                color: #333;
                margin: 0;
            }
            .invoice-title {
                font-size: 18px;
                font-weight: 800;
                color: #111;
                margin: 0;
                letter-spacing: 0.5px;
            }
            
            .divider {
                height: 1.5px;
                background: #222;
                margin: 6px 0 8px 0;
            }
            
            /* Meta details */
            .meta-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 8px;
                border: 1px solid #333;
                background: #fdfdfd;
                table-layout: fixed;
            }
            .meta-table td {
                padding: 6px 8px;
                vertical-align: top;
                border: 1px solid #333;
                font-size: 9.5px;
            }
            .meta-label {
                color: #555;
                font-size: 8.5px;
                text-transform: uppercase;
                font-weight: 600;
                margin-bottom: 2px;
            }
            .grid-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 2px;
            }
            
            /* Items Table */
            .items-table {
                width: 100%;
                border-collapse: collapse;
                table-layout: fixed;
                margin-bottom: 0;
            }
            .items-table th {
                background-color: #f1f3f5;
                color: #111;
                font-weight: 700;
                font-size: 9px;
                text-transform: uppercase;
                padding: 6px 4px;
                border: 1px solid #333;
            }
            .items-table td {
                padding: 5px 4px;
                border: 1px solid #333;
                font-size: 9.5px;
                vertical-align: middle;
                word-wrap: break-word;
            }
            
            /* Bottom Summary & Bank */
            .summary-table {
                width: 100%;
                border-collapse: collapse;
                table-layout: fixed;
                margin-top: -1px; /* seamless join with items table */
            }
            .summary-table td {
                border: 1px solid #333;
                padding: 4px 6px;
                font-size: 9.5px;
                vertical-align: top;
            }
            
            /* Footer */
            .footer-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
                page-break-inside: avoid;
            }
            .footer-table td {
                vertical-align: top;
                border: none;
                padding: 0;
            }
            .terms-box {
                font-size: 8.5px;
                color: #333;
                line-height: 1.35;
                padding-right: 12px;
            }
            .terms-box ol {
                margin: 2px 0 0 14px;
                padding: 0;
            }
            .signature-box {
                text-align: center;
                font-size: 9px;
            }
            .signature-line {
                margin-top: 35px;
                border-top: 1px solid #333;
                padding-top: 3px;
                font-weight: 600;
                font-size: 8.5px;
                display: inline-block;
                width: 80%;
            }
        </style>
    </head>
    <body>
        <div class="invoice-box">
            <!-- HEADER -->
            <table class="header-table">
                <tr>
                    <td style="width: 65%;">
                        ${logoHtml}
                        <div class="company-name">${garage?.name || 'SAMAN MOTORS'}</div>
                        <div class="company-sub">ALL CARS SPARES SALES & SERVICE STATION</div>
                        <div class="company-info">${garage?.address || 'Service Station Address'}</div>
                        <div class="company-info">
                            <strong>GSTIN:</strong> ${garage?.gst_number || invoice.gstinNo || '24BBDPK3507P1ZK'} &nbsp;|&nbsp; 
                            <strong>Phone:</strong> ${garage?.phone || 'N/A'}
                        </div>
                    </td>
                    <td style="width: 35%; text-align: right;">
                        <div class="invoice-title">TAX INVOICE</div>
                        <div style="font-size: 8.5px; color: #555; margin-top: 2px;">(Original for Recipient)</div>
                    </td>
                </tr>
            </table>

            <div class="divider"></div>

            <!-- BILL TO & INVOICE DETAILS METADATA BOX -->
            <table class="meta-table">
                <tr>
                    <td style="width: 50%;">
                        <div class="meta-label">Billed To:</div>
                        <div style="font-size: 12px; font-weight: 700; color: #000; margin-bottom: 2px;">
                            ${invoice.customer_name || 'Walk-in Customer'}
                        </div>
                        <div style="color: #444; font-size: 9px; line-height: 1.35;">
                            ${invoice.customer_address && invoice.customer_address !== 'N/A' ? `${invoice.customer_address}<br/>` : ''}
                            ${invoice.customer_phone && invoice.customer_phone !== 'N/A' ? `<strong>Mob:</strong> ${invoice.customer_phone}` : ''}
                            ${invoice.customer_gstin && invoice.customer_gstin !== 'N/A' ? `<br/><strong>GSTIN:</strong> ${invoice.customer_gstin}` : ''}
                        </div>
                    </td>
                    <td style="width: 50%;">
                        <div class="grid-row">
                            <span class="text-muted">Invoice No:</span>
                            <span class="fw-bold">${invoice.invoice_number || '-'}</span>
                        </div>
                        <div class="grid-row">
                            <span class="text-muted">Invoice Date:</span>
                            <span>${formatDate(invoice.date_issued)}</span>
                        </div>
                        <div class="grid-row">
                            <span class="text-muted">Job Card No:</span>
                            <span>${invoice.job_sheet_number || invoice.jobSheetNumber || '-'}</span>
                        </div>
                        <div class="grid-row">
                            <span class="text-muted">Vehicle No:</span>
                            <span class="fw-bold">${invoice.vehicle_car_number || '-'}</span>
                        </div>
                        <div class="grid-row">
                            <span class="text-muted">Vehicle Model:</span>
                            <span>${`${invoice.vehicle_make || ''} ${invoice.vehicle_model || ''}`.trim() || '-'}</span>
                        </div>
                        <div class="grid-row">
                            <span class="text-muted">KM Reading:</span>
                            <span>${invoice.km_reading != null && invoice.km_reading !== '' ? `${invoice.km_reading} KM` : '-'}</span>
                        </div>
                    </td>
                </tr>
            </table>

            <!-- ITEMS TABLE (Exact 100% column widths, zero overflow) -->
            <table class="items-table" style="margin-bottom: 10px;">
                <thead>
                    <tr>
                        <th style="width: 6%; text-align: center;">#</th>
                        <th style="width: 46%; text-align: left;">Description</th>
                        <th style="width: 8%; text-align: center;">Qty</th>
                        <th style="width: 13%; text-align: right;">Parts (₹)</th>
                        <th style="width: 13%; text-align: right;">Lubes (₹)</th>
                        <th style="width: 14%; text-align: right;">Labour (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map((item, index) => `
                        <tr>
                            <td class="text-center">${index + 1}</td>
                            <td><strong>${item.name || 'Service / Item'}</strong></td>
                            <td class="text-center">${item.quantity || 0}</td>
                            <td class="text-end">${Number(item.line_parts_calculated || 0) > 0 ? Number(item.line_parts_calculated).toFixed(2) : '-'}</td>
                            <td class="text-end">${Number(item.lube_charge || 0) > 0 ? Number(item.lube_charge).toFixed(2) : '-'}</td>
                            <td class="text-end">${Number(item.labour_charge || 0) > 0 ? Number(item.labour_charge).toFixed(2) : '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <!-- SUMMARY & PAYMENT SECTION (Visually Separated Dual-Card Architecture) -->
            <table style="width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 10px; page-break-inside: avoid;">
                <tr>
                    <!-- Left Card: Amount in Words & Bank Details -->
                    <td style="width: 52%; vertical-align: top; padding-right: 6px; border: none;">
                        <div style="border: 1px solid #cbd5e1; border-radius: 4px; background-color: #f8fafc; padding: 8px 10px; height: 100%;">
                            <div style="margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0;">
                                <strong style="font-size: 8.5px; text-transform: uppercase; color: #64748b; display: block;">Amount in Words:</strong>
                                <span class="fw-bold" style="font-size: 10px; color: #0f172a; display: block; margin-top: 2px;">${amountInWords}</span>
                            </div>
                            <div>
                                <strong style="font-size: 8.5px; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 3px;">Bank Payment Details:</strong>
                                <div style="font-size: 9px; line-height: 1.4; color: #334155;">
                                    <div><strong>Bank:</strong> ${garage?.bank_name || invoice.bankBranch || 'HDFC Bank (BORSAD)'}</div>
                                    <div><strong>A/c No:</strong> ${garage?.bank_account_no || invoice.bankAccountNo || '07492000002739'}</div>
                                    <div><strong>IFSC:</strong> ${garage?.bank_ifsc || invoice.bankIfsc || 'HDFC0000749'}</div>
                                </div>
                            </div>
                        </div>
                    </td>

                    <!-- Right Card: Financial Totals Table -->
                    <td style="width: 48%; vertical-align: top; padding-left: 6px; border: none;">
                        <div style="border: 1px solid #333; border-radius: 4px; overflow: hidden; background-color: #fff;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 9px; table-layout: fixed;">
                                <tr>
                                    <td style="border: none; border-bottom: 1px solid #eee; border-right: 1px solid #eee; padding: 3.5px 6px; text-align: right; color: #475569; width: 55%;">Total Parts:</td>
                                    <td style="border: none; border-bottom: 1px solid #eee; padding: 3.5px 6px; text-align: right; width: 45%;">${formatCurrency(calculatedTotals.totalParts)}</td>
                                </tr>
                                <tr>
                                    <td style="border: none; border-bottom: 1px solid #eee; border-right: 1px solid #eee; padding: 3.5px 6px; text-align: right; color: #475569;">Total Lubes:</td>
                                    <td style="border: none; border-bottom: 1px solid #eee; padding: 3.5px 6px; text-align: right;">${formatCurrency(calculatedTotals.totalLubes)}</td>
                                </tr>
                                <tr>
                                    <td style="border: none; border-bottom: 1px solid #eee; border-right: 1px solid #eee; padding: 3.5px 6px; text-align: right; color: #475569;">Total Labour:</td>
                                    <td style="border: none; border-bottom: 1px solid #eee; padding: 3.5px 6px; text-align: right;">${formatCurrency(calculatedTotals.totalLabour)}</td>
                                </tr>
                                <tr style="background: #f8fafc;">
                                    <td style="border: none; border-top: 1px solid #333; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; padding: 4px 6px; text-align: right; font-weight: 700; color: #0f172a;">SUB TOTAL:</td>
                                    <td style="border: none; border-top: 1px solid #333; border-bottom: 1px solid #cbd5e1; padding: 4px 6px; text-align: right; font-weight: 700; color: #0f172a;">${formatCurrency(subTotal)}</td>
                                </tr>
                                <tr>
                                    <td style="border: none; border-bottom: 1px solid #eee; border-right: 1px solid #eee; padding: 3.5px 6px; text-align: right; color: ${discountAmount > 0 ? '#dc2626' : '#475569'};">
                                        ${discountAmount > 0 ? (invoice.discount_type === 'Percent' ? `Discount (${invoice.discount_value}%):` : `Discount (Fixed):`) : 'Discount (0%):'}
                                    </td>
                                    <td style="border: none; border-bottom: 1px solid #eee; padding: 3.5px 6px; text-align: right; color: ${discountAmount > 0 ? '#dc2626' : '#0f172a'}; font-weight: ${discountAmount > 0 ? 600 : 400};">
                                        ${discountAmount > 0 ? `(-) ${formatCurrency(discountAmount)}` : formatCurrency(0)}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="border: none; border-bottom: 1px solid #eee; border-right: 1px solid #eee; padding: 3.5px 6px; text-align: right; color: #475569; font-weight: 600;">Taxable Amt:</td>
                                    <td style="border: none; border-bottom: 1px solid #eee; padding: 3.5px 6px; text-align: right; font-weight: 600;">${formatCurrency(amountBeforeTax)}</td>
                                </tr>
                                <tr>
                                    <td style="border: none; border-bottom: 1px solid #eee; border-right: 1px solid #eee; padding: 3.5px 6px; text-align: right; color: #475569;">GST (${taxRate}%):</td>
                                    <td style="border: none; border-bottom: 1px solid #eee; padding: 3.5px 6px; text-align: right;">${taxAmount > 0 ? `(+) ${formatCurrency(taxAmount)}` : formatCurrency(0)}</td>
                                </tr>
                                <tr>
                                    <td style="border: none; border-bottom: 1px solid #333; border-right: 1px solid #eee; padding: 3.5px 6px; text-align: right; color: #475569;">Round Off:</td>
                                    <td style="border: none; border-bottom: 1px solid #333; padding: 3.5px 6px; text-align: right;">${Math.abs(roundOffAmount) < 0.001 ? formatCurrency(0) : (roundOffAmount < 0 ? `(-) ${formatCurrency(Math.abs(roundOffAmount))}` : `(+) ${formatCurrency(roundOffAmount)}`)}</td>
                                </tr>
                                <tr style="background: #f1f5f9;">
                                    <td style="border: none; border-top: 1.5px solid #222; border-right: 1px solid #cbd5e1; padding: 6px; text-align: right; font-size: 11px; font-weight: 800; color: #0f172a;">GRAND TOTAL:</td>
                                    <td style="border: none; border-top: 1.5px solid #222; padding: 6px; text-align: right; font-size: 11.5px; font-weight: 800; color: #0f172a;">${formatCurrency(grandTotal)}</td>
                                </tr>
                            </table>
                        </div>
                    </td>
                </tr>
            </table>

            <!-- FOOTER: TERMS & SIGNATURE -->
            <table class="footer-table">
                <tr>
                    <td style="width: 60%;" class="terms-box">
                        <strong style="font-size: 8.5px; text-transform: uppercase; color: #555;">Terms & Conditions:</strong>
                        ${garage?.terms_and_conditions ? `
                            <div style="white-space: pre-line; margin-top: 2px;">${garage.terms_and_conditions}</div>
                        ` : `
                            <ol>
                                <li>Goods once sold will not be taken back or exchanged.</li>
                                <li>Interest @18% p.a. will be charged if payment is not made within due date.</li>
                                <li>All disputes are subject to local jurisdiction only.</li>
                                <li>E. & O. E. (Errors and Omissions Excepted).</li>
                            </ol>
                        `}
                    </td>
                    <td style="width: 40%;" class="signature-box">
                        <div>For, <strong>${(garage?.name || 'My Garage').toUpperCase()}</strong></div>
                        <div class="signature-line">Authorized Signatory</div>
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
        await page.emulateMediaType('screen');
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '8mm', right: '8mm', bottom: '8mm', left: '8mm' }
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
    let logoHtml = '';
    if (garage?.logo_url) {
        try {
            const logoPath = path.join(__dirname, '..', garage.logo_url);
            if (fs.existsSync(logoPath)) {
                const ext = path.extname(logoPath).substring(1) || 'png';
                const logoBuffer = fs.readFileSync(logoPath);
                const base64 = logoBuffer.toString('base64');
                logoHtml = `<img src="data:image/${ext};base64,${base64}" alt="Logo" style="height: 36px; max-width: 140px; object-fit: contain; margin-right: 10px;" />`;
            }
        } catch (e) {
            console.error('Failed to load logo for ledger PDF:', e);
        }
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            @page {
                size: A4 portrait;
                margin: 0;
            }
            * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            html, body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                font-size: 10.5px;
                color: #212529;
                margin: 0;
                padding: 0;
                width: 100%;
                background: #fff;
            }
            .statement-box {
                width: 100%;
                border: 1.5px solid #222;
                padding: 14px 16px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
            }
            .header-table {
                border-bottom: 2px solid #222;
                padding-bottom: 8px;
                margin-bottom: 10px;
            }
            .header-table td {
                border: none;
                vertical-align: top;
            }
            .company-title {
                font-size: 19px;
                font-weight: 800;
                color: #000;
                margin: 0;
            }
            .info-box {
                background-color: #f8f9fa;
                border: 1px solid #dee2e6;
                padding: 8px;
                margin-bottom: 10px;
                table-layout: fixed;
            }
            .info-box td {
                border: none;
                vertical-align: top;
                font-size: 9.5px;
            }
            .summary-cards {
                margin-bottom: 10px;
            }
            .summary-card {
                background-color: #f8f9fa;
                border: 1px solid #dee2e6;
                padding: 6px;
                text-align: center;
            }
            .summary-title {
                font-size: 8.5px;
                font-weight: 600;
                color: #6c757d;
                text-transform: uppercase;
                margin-bottom: 2px;
            }
            .summary-amount {
                font-size: 13.5px;
                font-weight: 700;
            }
            .data-table th {
                background-color: #343a40;
                color: #fff;
                padding: 6px 8px;
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                border: 1px solid #343a40;
                text-align: left;
            }
            .data-table td {
                padding: 6px 8px;
                font-size: 9.5px;
                border: 1px solid #dee2e6;
            }
            .data-table tr:nth-child(even) {
                background-color: #fafafa;
            }
            .text-end { text-align: right; }
            .text-center { text-align: center; }
            .text-success { color: #198754 !important; }
            .text-danger { color: #dc3545 !important; }
        </style>
    </head>
    <body>
        <div class="statement-box">
            <!-- HEADER -->
            <table class="header-table">
                <tr>
                    <td style="width: 60%;">
                        <div style="display: flex; align-items: center;">
                            ${logoHtml}
                            <div>
                                <div class="company-title">${garage?.name || 'SAMAN MOTORS'}</div>
                                <div style="font-size: 8.5px; color: #555;">${garage?.address || 'Service Station Address'} &nbsp;|&nbsp; Phone: ${garage?.phone || 'N/A'}</div>
                            </div>
                        </div>
                    </td>
                    <td style="width: 40%; text-align: right;">
                        <div style="font-size: 17px; font-weight: 800; letter-spacing: 0.5px;">ACCOUNT LEDGER</div>
                        <div style="font-size: 8.5px; color: #555; margin-top: 2px;">
                            <strong>Date:</strong> ${formatDate(new Date().toISOString())} &nbsp;|&nbsp; <strong>Period:</strong> ${periodText || 'All Transactions'}
                        </div>
                    </td>
                </tr>
            </table>

            <!-- CUSTOMER & GARAGE INFO -->
            <table class="info-box">
                <tr>
                    <td style="width: 50%;">
                        <span style="color: #6c757d; font-size: 8px; text-transform: uppercase; font-weight: 600;">Customer Details:</span><br />
                        <strong style="font-size: 12px; color: #000;">${customerName}</strong><br />
                        <span style="color: #444;">Phone: ${phone || 'N/A'}</span>
                    </td>
                    <td style="width: 50%; text-align: right;">
                        <span style="color: #6c757d; font-size: 8px; text-transform: uppercase; font-weight: 600;">Bank Details:</span><br />
                        <strong>${garage?.bank_name || 'Bank Details'}</strong> &nbsp;|&nbsp; A/c: ${garage?.bank_account_no || 'N/A'}<br />
                        IFSC: ${garage?.bank_ifsc || 'N/A'} &nbsp;|&nbsp; GSTIN: ${garage?.gst_number || 'N/A'}
                    </td>
                </tr>
            </table>

            <!-- SUMMARY STATS -->
            <table class="summary-cards" style="width: 100%; border-spacing: 4px; border-collapse: separate;">
                <tr>
                    <td class="summary-card" style="width: 33.33%;">
                        <div class="summary-title">Total Billed</div>
                        <div class="summary-amount">${formatCurrency(totalBilled)}</div>
                    </td>
                    <td class="summary-card" style="width: 33.33%;">
                        <div class="summary-title">Total Paid</div>
                        <div class="summary-amount text-success">${formatCurrency(totalPaid)}</div>
                    </td>
                    <td class="summary-card" style="width: 33.33%; background-color: #fff3f3; border-color: #f5c6cb;">
                        <div class="summary-title" style="color: #dc3545;">Total Outstanding Due</div>
                        <div class="summary-amount text-danger">${formatCurrency(totalDue)}</div>
                    </td>
                </tr>
            </table>

            <!-- LEDGER TABLE -->
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 12%;">Date</th>
                        <th style="width: 18%;">Doc / Ref #</th>
                        <th style="width: 28%;">Description / Note</th>
                        <th style="width: 14%; text-align: right;">Debit (+)</th>
                        <th style="width: 14%; text-align: right;">Credit (-)</th>
                        <th style="width: 14%; text-align: right;">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.map(tx => `
                        <tr>
                            <td>${formatDate(tx.date)}</td>
                            <td><strong>${tx.reference || '-'}</strong></td>
                            <td>${tx.description || '-'}</td>
                            <td class="text-end">${tx.debit > 0 ? formatCurrency(tx.debit) : '-'}</td>
                            <td class="text-end text-success">${tx.credit > 0 ? formatCurrency(tx.credit) : '-'}</td>
                            <td class="text-end fw-bold">${formatCurrency(tx.balance)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <!-- FOOTER -->
            <table style="width: 100%; margin-top: 15px; page-break-inside: avoid;">
                <tr>
                    <td style="width: 60%; font-size: 8.5px; color: #6c757d; vertical-align: bottom;">
                        This is an official system-generated statement of accounts from ${garage?.name || 'Saman Motors'}.
                    </td>
                    <td style="width: 40%; text-align: center; vertical-align: bottom;">
                        <div style="font-size: 9px;">For, <strong>${(garage?.name || 'SAMAN MOTORS').toUpperCase()}</strong></div>
                        <div style="margin-top: 30px; border-top: 1px solid #343a40; padding-top: 3px; font-size: 8.5px; font-weight: 600; display: inline-block; width: 80%;">Authorized Signatory</div>
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
        await page.emulateMediaType('screen');
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '8mm', right: '8mm', bottom: '8mm', left: '8mm' }
        });
        
        return Buffer.from(pdfBuffer).toString('base64');
    } finally {
        await browser.close();
    }
};
