import React, { useState, useMemo } from 'react';
import { Modal, Button, Table, Row, Col, Form } from 'react-bootstrap';
import { SERVER_BASE_URL } from '../api/api.js';

const formatCurrency = (amount) => {
  const num = Number(amount || 0);
  return num.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const CustomerStatementModal = ({ show, onHide, customer, garage, onSendWhatsApp, isSendingLedger }) => {
  if (!customer) return null;

  // --- Date Range Filter State ---
  const [dateRangePreset, setDateRangePreset] = useState('all'); // 'all' | 'this_month' | 'last_month' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Chronologically sorted & date-filtered transactions with running balance
  const ledgerTransactions = useMemo(() => {
    if (!customer.invoices) return [];
    
    // Sort chronologically ascending by invoice date
    const sorted = [...customer.invoices].sort((a, b) => {
      const dateA = new Date(a.date_issued || a.dateIssued || a.dueDate || 0);
      const dateB = new Date(b.date_issued || b.dateIssued || b.dueDate || 0);
      return dateA - dateB;
    });

    const filtered = sorted.filter(inv => {
      const invDateStr = inv.date_issued || inv.dateIssued || inv.dueDate;
      if (!invDateStr) return true;
      const invDate = new Date(invDateStr);
      
      const now = new Date();
      if (dateRangePreset === 'this_month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return invDate >= startOfMonth;
      } else if (dateRangePreset === 'last_month') {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return invDate >= startOfLastMonth && invDate <= endOfLastMonth;
      } else if (dateRangePreset === 'custom') {
        if (startDate && new Date(startDate) > invDate) return false;
        if (endDate && new Date(endDate) < invDate) return false;
      }
      return true;
    });

    // Compute running balance for each transaction in standard ERP ledger format
    let runningBalance = 0;
    return filtered.map(inv => {
      const billed = parseFloat(inv.grand_total || inv.grandTotal || 0);
      const paid = parseFloat(inv.amountPaid || 0);
      const netLine = billed - paid;
      runningBalance += netLine;

      return {
        ...inv,
        voucherType: 'Sales Invoice',
        refNo: inv.invoiceNumber || inv.invoice_number, // Clean code, NO "Sales Invoice #" prefix!
        particulars: inv.particulars || 'Vehicle Service & Repairs',
        billed,
        paid,
        runningBalance
      };
    });
  }, [customer.invoices, dateRangePreset, startDate, endDate]);

  const totalBilled = ledgerTransactions.reduce((sum, item) => sum + item.billed, 0);
  const totalPaid = ledgerTransactions.reduce((sum, item) => sum + item.paid, 0);
  const closingBalance = Math.max(0, totalBilled - totalPaid);

  const periodText = useMemo(() => {
    if (dateRangePreset === 'this_month') return 'This Month';
    if (dateRangePreset === 'last_month') return 'Last Month';
    if (dateRangePreset === 'custom') return `${startDate || 'Start'} to ${endDate || 'End'}`;
    return 'All Transactions';
  }, [dateRangePreset, startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  // Enterprise ERP Excel CSV Export
  const handleDownloadExcel = () => {
    if (ledgerTransactions.length === 0) return;

    const headers = ["SR", "Date", "Reference No.", "Vehicle No.", "Debit (INR)", "Credit (INR)", "Running Balance (INR)"];
    
    const rows = ledgerTransactions.map((item, idx) => [
      idx + 1,
      `"${formatDate(item.date_issued || item.dateIssued || item.dueDate)}"`,
      `"${item.refNo}"`,
      `"${(item.vehicle_number || item.vehicleNumber || 'N/A').replace(/"/g, '""')}"`,
      item.billed.toFixed(2),
      item.paid.toFixed(2),
      item.runningBalance.toFixed(2)
    ]);

    const summaryRows = [
      [],
      ["ACCOUNT LEDGER SUMMARY"],
      ["Total Debit Amount", "", "", "", totalBilled.toFixed(2)],
      ["Total Credit Amount", "", "", "", "", totalPaid.toFixed(2)],
      ["Closing Outstanding Balance", "", "", "", "", "", closingBalance.toFixed(2)]
    ];

    const csvString = [
      [`ACCOUNT LEDGER - ${customer.customerName.toUpperCase()}`].join(","),
      [`Company: ${garage?.name || 'My Garage'}`].join(","),
      [`Period: ${periodText} | Date Generated: ${formatDate(new Date())}`].join(","),
      [],
      headers.join(","),
      ...rows.map(e => e.join(",")),
      ...summaryRows.map(e => e.join(","))
    ].join("\r\n");

    const blob = new Blob(["\ufeff" + csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Account_Ledger_${customer.customerName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasLogo = Boolean(garage?.logo_url);
  const logoSrc = hasLogo
    ? (garage.logo_url.startsWith('http') ? garage.logo_url : `${SERVER_BASE_URL}${garage.logo_url}`)
    : null;

  return (
    <Modal show={show} onHide={onHide} size="xl" centered backdrop="static" className="customer-statement-modal">
      <Modal.Header className="bg-dark text-white border-0 d-print-none py-2 px-3">
        <Modal.Title className="h6 mb-0 d-flex align-items-center text-truncate" style={{ maxWidth: '80%' }}>
          <FaFileInvoiceDollar className="me-2 text-warning flex-shrink-0" /> Production-Ready Account Ledger — {customer.customerName}
        </Modal.Title>
        <Button variant="outline-light" size="sm" onClick={onHide} aria-label="Close" className="btn-close-white">✕</Button>
      </Modal.Header>

      <Modal.Body className="p-3 bg-white" id="printable-statement" style={{ maxHeight: '88vh', overflowY: 'auto' }}>
        {/* PRINT OPTIMIZATION CSS FOR A4 LASER PRINTING */}
        <style>
          {`
            @media print {
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
              
              /* Hide everything in the body by default */
              body > * {
                display: none !important;
              }
              
              /* Only show our modal */
              body > .customer-statement-modal {
                display: block !important;
                position: relative !important;
                left: 0 !important;
                top: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: auto !important;
                overflow: visible !important;
              }
              
              /* Reset modal components for printing */
              .customer-statement-modal .modal-dialog,
              .customer-statement-modal .modal-content,
              .customer-statement-modal .modal-body {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
                height: auto !important;
                max-height: none !important;
                overflow: visible !important;
                background: #fff !important;
              }
              
              /* Hide print-none elements explicitly */
              .d-print-none {
                display: none !important;
              }
              
              /* Table printing improvements */
              thead {
                display: table-header-group !important;
              }
              tfoot {
                display: table-footer-group !important;
              }
              tr {
                page-break-inside: avoid !important;
              }
              
              body {
                background: #fff !important;
                color: #000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              .erp-table th {
                background-color: #2A2F35 !important;
                color: #ffffff !important;
                border: 1px solid #1a1e22 !important;
                font-size: 8.5pt !important;
                padding: 4px 6px !important;
                text-transform: uppercase;
              }
              
              .erp-table td {
                border: 1px solid #D9D9D9 !important;
                font-size: 8.5pt !important;
                padding: 3px 6px !important;
              }
            }

            /* On-screen ERP Styling */
            .erp-table {
              border-collapse: collapse;
              width: 100%;
              font-size: 9pt;
            }
            .erp-table th {
              background-color: #2D3748;
              color: #FFFFFF;
              font-weight: 700;
              font-size: 8.5pt;
              padding: 5px 6px;
              border: 1px solid #1A202C;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .erp-table td {
              border: 1px solid #E2E8F0;
              padding: 4px 6px;
              color: #1A202C;
            }
            .erp-table tr:nth-child(even) {
              background-color: #FAFAFA;
            }
            .mono-val {
              font-family: monospace, 'Courier New', Courier;
              letter-spacing: -0.2px;
            }
          `}
        </style>

        {/* Responsive Date Period Filter Bar (hidden during print) */}
        <div className="bg-light p-2 rounded border mb-3 d-print-none">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <div>
                <Form.Label className="small fw-bold text-muted mb-0 me-1" style={{ fontSize: '11px' }}><FaCalendarAlt className="me-1"/> Period:</Form.Label>
                <Form.Select 
                  size="sm" 
                  style={{ width: '140px', fontSize: '12px' }}
                  value={dateRangePreset} 
                  onChange={(e) => setDateRangePreset(e.target.value)}
                >
                  <option value="all">All Transactions</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="custom">Custom Range</option>
                </Form.Select>
              </div>

              {dateRangePreset === 'custom' && (
                <>
                  <div className="d-flex align-items-center gap-1">
                    <span className="small text-muted" style={{ fontSize: '11px' }}>From:</span>
                    <Form.Control type="date" size="sm" style={{ fontSize: '12px', width: '130px' }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <span className="small text-muted" style={{ fontSize: '11px' }}>To:</span>
                    <Form.Control type="date" size="sm" style={{ fontSize: '12px', width: '130px' }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </>
              )}
            </div>

            <div className="d-flex align-items-center gap-2">
              <Button variant="outline-success" size="sm" onClick={handleDownloadExcel} style={{ fontSize: '12px' }}>
                <FaFileDownload className="me-1" /> Excel Statement
              </Button>
              {onSendWhatsApp && (
                <Button 
                  variant="outline-success" 
                  size="sm" 
                  onClick={() => onSendWhatsApp(customer, ledgerTransactions, totalBilled, totalPaid, closingBalance)}
                  style={{ fontSize: '12px' }}
                  className="d-flex align-items-center"
                >
                  <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" className="me-1"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path></svg>
                  WhatsApp Ledger
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={handlePrint} style={{ fontSize: '12px' }}>
                <FaPrint className="me-1" /> Print Ledger (A4)
              </Button>
            </div>
          </div>
        </div>

        <div className="statement-paper">
          {/* HEADER SECTION (Max 8-10% page height) */}
          <div className="d-flex justify-content-between align-items-start pb-2 mb-2 border-bottom border-2 border-dark">
            <div className="d-flex align-items-center gap-2">
              {hasLogo ? (
                <img src={logoSrc} alt="Garage Logo" style={{ height: '32px', maxWidth: '140px', objectFit: 'contain' }} />
              ) : null}
              <div>
                <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '15pt', letterSpacing: '-0.3px' }}>{garage?.name || 'SAMAN MOTORS'}</h5>
                <p className="mb-0 text-secondary" style={{ fontSize: '8.5pt' }}>
                  {garage?.address || 'Service Station Address'} &nbsp;|&nbsp; Phone: {garage?.phone || 'N/A'} &nbsp;|&nbsp; GSTIN: {garage?.gst_number || 'N/A'}
                </p>
              </div>
            </div>
            <div className="text-end">
              <h5 className="fw-bold text-dark mb-0 text-uppercase" style={{ fontSize: '14pt', letterSpacing: '0.5px' }}>ACCOUNT LEDGER</h5>
              <p className="mb-0 text-muted" style={{ fontSize: '8pt' }}>
                <strong>Date:</strong> {formatDate(new Date())} &nbsp;|&nbsp; <strong>Period:</strong> {periodText}
              </p>
            </div>
          </div>

          {/* CUSTOMER & BANK INFORMATION SECTION (Max 8% page height) */}
          <div className="bg-light border rounded p-2 mb-2" style={{ fontSize: '8.5pt', lineHeight: '1.4' }}>
            <Row className="g-1">
              <Col xs={6}>
                <span className="text-muted text-uppercase" style={{ fontSize: '7.5pt' }}>Customer Name:</span><br />
                <strong className="text-dark fs-6">{customer.customerName}</strong>
              </Col>
              <Col xs={6} className="text-end">
                <span className="text-muted text-uppercase" style={{ fontSize: '7.5pt' }}>Mobile / Email:</span><br />
                <span className="fw-semibold text-dark">{(customer.phone || customer.invoices?.[0]?.customerPhone || customer.invoices?.[0]?.customer_phone) || 'N/A'} {customer.email ? `| ${customer.email}` : ''}</span>
              </Col>
            </Row>
            <hr className="my-1 text-muted" style={{ opacity: 0.3 }} />
            <Row className="g-1">
              <Col xs={4}>
                <span className="text-muted" style={{ fontSize: '7.5pt' }}>Bank Name:</span> <strong className="text-dark">{garage?.bank_name || 'HDFC Bank (BORSAD)'}</strong>
              </Col>
              <Col xs={4}>
                <span className="text-muted" style={{ fontSize: '7.5pt' }}>Account No:</span> <strong className="text-dark">{garage?.bank_account_no || '07492000002739'}</strong>
              </Col>
              <Col xs={4} className="text-end">
                <span className="text-muted" style={{ fontSize: '7.5pt' }}>IFSC Code:</span> <strong className="text-dark">{garage?.bank_ifsc || 'HDFC0000749'}</strong>
              </Col>
            </Row>
          </div>

          {/* TRANSACTION TABLE (75-80% of Page - Fits 25-35 rows per A4 page) */}
          <table className="erp-table mb-2">
            <thead>
              <tr>
                <th className="text-center" style={{ width: '5%' }}>SR</th>
                <th style={{ width: '15%' }}>Date</th>
                <th style={{ width: '20%' }}>Reference No.</th>
                <th style={{ width: '20%' }}>Vehicle No.</th>
                <th className="text-end" style={{ width: '12%' }}>Debit (₹)</th>
                <th className="text-end" style={{ width: '12%' }}>Credit (₹)</th>
                <th className="text-end" style={{ width: '16%' }}>Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledgerTransactions.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-3 text-muted">No transaction entries found for the selected period.</td></tr>
              ) : (
                ledgerTransactions.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="text-center text-muted">{idx + 1}</td>
                    <td className="text-nowrap">{formatDate(item.date_issued || item.dateIssued || item.dueDate)}</td>
                    <td className="fw-bold">{item.refNo}</td>
                    <td>{item.vehicle_number || item.vehicleNumber || 'N/A'}</td>
                    <td className="text-end mono-val">{formatCurrency(item.billed)}</td>
                    <td className="text-end text-success mono-val">{formatCurrency(item.paid)}</td>
                    <td className="text-end fw-bold mono-val">
                      {formatCurrency(Math.abs(item.runningBalance))} {item.runningBalance > 0 ? 'Dr' : item.runningBalance < 0 ? 'Cr' : ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* SUMMARY SECTION (Compact Boxed Summary) */}
          <Row className="mb-2 g-2 align-items-center">
            <Col xs={7} style={{ fontSize: '8pt' }}>
              <p className="mb-0 text-muted">
                <strong>Declaration:</strong> This is a computer-generated Account Ledger Statement. All entries are subject to audit and verification.
              </p>
            </Col>
            <Col xs={5}>
              <div className="border rounded p-2 bg-light" style={{ fontSize: '8.5pt' }}>
                <div className="d-flex justify-content-between mb-1">
                  <span>Total Debit (Billed):</span>
                  <span className="mono-val fw-bold">{formatCurrency(totalBilled)}</span>
                </div>
                <div className="d-flex justify-content-between mb-1 text-success">
                  <span>Total Credit (Paid):</span>
                  <span className="mono-val fw-bold">{formatCurrency(totalPaid)}</span>
                </div>
                <div className="d-flex justify-content-between pt-1 border-top border-dark fw-bold text-danger" style={{ fontSize: '9.5pt', backgroundColor: '#F0F0F0', padding: '3px 5px', borderRadius: '3px' }}>
                  <span>Closing Outstanding Balance:</span>
                  <span className="mono-val">{formatCurrency(closingBalance)} Dr</span>
                </div>
              </div>
            </Col>
          </Row>

          {/* FOOTER SECTION (Max 8% page height) */}
          <div className="pt-2 mt-5 border-top d-flex justify-content-between align-items-end" style={{ fontSize: '8pt' }}>
            <div className="text-muted pb-1">
              Generated by <strong>{(garage?.name || 'Saman Motors').toUpperCase()} Garage Management System</strong> &nbsp;|&nbsp; {new Date().toLocaleString('en-GB')}
            </div>
            <div className="text-center" style={{ minWidth: '200px' }}>
              <p className="mb-4 small">For, <strong>{(garage?.name || 'SAMAN MOTORS').toUpperCase()}</strong></p>
              <div className="border-top border-dark pt-1 px-3 text-dark fw-semibold" style={{ fontSize: '8pt' }}>Authorized Signatory</div>
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer className="bg-light border-0 d-print-none py-2 px-3">
        <Button variant="secondary" size="sm" onClick={onHide}>
          <FaTimes className="me-1" /> Close
        </Button>
        <Button variant="outline-success" size="sm" onClick={handleDownloadExcel} className="me-2">
          <FaFileDownload className="me-1" /> Excel Statement
        </Button>
        {onSendWhatsApp && (
            <Button 
                variant="outline-success" 
                size="sm" 
                onClick={() => onSendWhatsApp(customer, ledgerTransactions, totalBilled, totalPaid, closingBalance, periodText)}
                className="me-2 d-flex align-items-center"
                disabled={isSendingLedger}
            >
                {isSendingLedger ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : (
                  <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" className="me-1"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path></svg>
                )}
                WhatsApp Ledger
            </Button>
        )}
        <Button variant="primary" size="sm" onClick={handlePrint}>
          <FaPrint className="me-1" /> Print Ledger (A4)
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CustomerStatementModal;
