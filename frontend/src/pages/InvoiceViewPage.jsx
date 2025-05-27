import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Table, Button, Spinner, Alert } from 'react-bootstrap';
import { FaPrint, FaArrowLeft } from 'react-icons/fa';
import { findInvoiceById, findCustomerById, findVehicleById } from '../data/staticData'; // Assuming these work
import logo from '../assets/saman-logo.png'; // ** Verify your logo path **
// import numberToWords from 'number-to-words'; // Uncomment and install if needed: npm install number-to-words

// --- CSS ---
// Ensure CSS is imported (globally or directly)
// Option 1: Create InvoiceViewPage.css and import it
// import './InvoiceViewPage.css';
// Option 2: Use a global CSS like App.css (Ensure styles below are added/updated)
import '../App.css'; // Or your main CSS file

// --- Currency Formatter (Robust) ---
const formatCurrency = (amount) => {
    if (amount == null || typeof amount !== 'number' || isNaN(amount)) {
        // Return a non-breaking space for alignment if zero/invalid
        return `₹\u00A00.00`;
    }
    const fixedAmount = amount.toFixed(2);
    return Number(fixedAmount).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

// --- Date Formatter ---
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-GB', { // dd/mm/yyyy format
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        console.error("Error formatting date:", e);
        return 'Invalid Date';
    }
};


const InvoiceViewPage = () => {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [missingDataWarning, setMissingDataWarning] = useState(null);

    // --- Data Fetching Effect ---
    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);
        setMissingDataWarning(null); // Reset warnings
        setInvoice(null); setCustomer(null); setVehicle(null);

        // Simulate async fetch (Replace with your actual API call if needed)
        const timer = setTimeout(() => {
            if (!isMounted) return;

            try {
                // *** Crucial: Ensure findInvoiceById returns the full invoice object
                // including discountType, discountValue, taxRate, discountAmount, taxAmount etc. ***
                const foundInvoice = findInvoiceById(invoiceId);
                if (!foundInvoice) {
                    setError(`Invoice with ID ${invoiceId} not found.`);
                    setLoading(false);
                    return;
                }

                setInvoice(foundInvoice); // Set core invoice data

                // Attempt to load related data - check for missing data
                let warnings = [];
                const foundCustomer = findCustomerById(foundInvoice.customerId);
                if (foundCustomer) {
                    setCustomer(foundCustomer);
                } else {
                    console.warn(`Customer not found for ID: ${foundInvoice.customerId}`);
                    warnings.push("Customer details are missing.");
                }

                const foundVehicle = findVehicleById(foundInvoice.vehicleId);
                if (foundVehicle) {
                    setVehicle(foundVehicle);
                } else {
                    console.warn(`Vehicle not found for ID: ${foundInvoice.vehicleId}`);
                    warnings.push("Vehicle details are missing.");
                }

                // Set warning state if related data is missing, but still allow rendering
                if (warnings.length > 0) {
                    setMissingDataWarning(`Note: ${warnings.join(' ')} Invoice display might be incomplete.`);
                }

            } catch (err) {
                console.error("Error loading invoice data:", err);
                setError("An unexpected error occurred while loading the invoice.");
            } finally {
                if (isMounted) setLoading(false);
            }
        }, 300); // Reduced timeout slightly

        // Cleanup function
        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [invoiceId]); // Re-run effect if invoiceId changes

    // --- Amount in Words ---
    const amountInWords = useMemo(() => {
        const total = invoice?.grandTotal;
        if (total == null || typeof total !== 'number' || isNaN(total)) {
            return 'RUPEES ZERO ONLY';
        }

        try {
            // --- Number to Words Library Integration (Recommended) ---
            // 1. Install: npm install number-to-words
            // 2. Uncomment: import numberToWords from 'number-to-words';
            // const num = total;
            // const integerPart = Math.floor(num);
            // const decimalPart = Math.round((num - integerPart) * 100);
            // let words = `RUPEES ${numberToWords.toWords(integerPart).toUpperCase()}`;
            // if (decimalPart > 0) {
            //     const paiseWords = numberToWords.toWords(decimalPart).toUpperCase();
            //     words += ` AND PAISE ${paiseWords}`;
            // } else {
            //    words += ` AND PAISE ZERO`; // Explicitly add zero paise if needed
            // }
            // return words + ' ONLY';

            // --- Simple Placeholder (If library not used) ---
            const integerPart = Math.floor(total);
            const decimalPart = Math.round((total - integerPart) * 100);
            return `RUPEES ${integerPart} AND PAISE ${decimalPart.toString().padStart(2, '0')} ONLY (Placeholder)`;

        } catch (e) {
            console.error("Error converting number to words:", e);
            return "ERROR GENERATING WORDS";
        }
    }, [invoice?.grandTotal]);

    // --- Render States ---
    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading Invoice...</p>
            </Container>
        );
    }

    // Handle case where invoice itself wasn't found after loading attempt
    if (error && !invoice) { // Show error only if invoice failed to load entirely
         return (
            <Container className="py-5">
                <Alert variant="danger">
                    <Alert.Heading>Error Loading Invoice</Alert.Heading>
                    <p>{error}</p>
                    <hr />
                    <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
                         <FaArrowLeft className="me-1"/> Go Back
                    </Button>
                </Alert>
            </Container>
        );
    }

    // --- Main Render (Invoice Data Available) ---
    // Check if invoice is loaded before attempting to render details
    if (!invoice) {
        return (
             <Container className="py-5">
                <Alert variant="warning">Invoice data is not available.</Alert>
             </Container>
        );
    }

    // Safe access to potentially missing nested data
    const items = invoice.items || [];
    const totalItems = items.length;
    const minTableRows = 10; // Minimum rows for visual consistency

    // Helper to format discount label based on saved data
    const getDiscountLabel = () => {
        if (!invoice || invoice.discountAmount <= 0) return 'DISCOUNT'; // Default if no discount
        if (invoice.discountType === 'Percent' && invoice.discountValue > 0) {
            return `DISCOUNT (${invoice.discountValue}%)`;
        }
        if (invoice.discountType === 'Fixed' && invoice.discountValue > 0) {
            // Optionally show the fixed amount in label, or just keep it simple
            // return `DISCOUNT (₹ ${invoice.discountValue})`;
             return `DISCOUNT APPLIED`;
        }
        return 'DISCOUNT'; // Fallback
    };

     // Helper to format tax label based on saved data
     const getTaxLabel = () => {
         if (!invoice || invoice.taxAmount <= 0) return 'TAX'; // Default if no tax
         if (invoice.taxRate > 0) {
             return `TAX (${invoice.taxRate}%)`;
         }
         return 'TAX ADDED'; // Fallback
     };


    return (
        // Outer wrapper for potential page background styling, not printed
        <div className="invoice-view-wrapper bg-light py-4 py-md-5 d-print-bg-transparent">
            <Container> {/* Use standard Container for centering content */}

                 {/* --- Action Buttons (Non-Printable) --- */}
                 <Row className="mb-3 d-print-none">
                     <Col className="text-end">
                         <Button variant="outline-secondary" size="sm" onClick={() => navigate(-1)} className="me-2">
                             <FaArrowLeft className="me-1"/> Back
                         </Button>
                         <Button variant="primary" size="sm" onClick={() => window.print()}>
                             <FaPrint className="me-1"/> Print Invoice
                         </Button>
                     </Col>
                 </Row>

                 {/* --- Warning for Missing Related Data (Non-Printable) --- */}
                 {missingDataWarning && (
                      <Alert variant="warning" className="mx-lg-auto mb-3 d-print-none shadow-sm small" style={{ maxWidth: '800px' }}>
                          {missingDataWarning}
                      </Alert>
                 )}
                 {error && invoice && ( // Show other errors if invoice WAS loaded but something else went wrong
                     <Alert variant="danger" className="mx-lg-auto mb-3 d-print-none shadow-sm small" style={{ maxWidth: '800px' }}>
                         {error}
                     </Alert>
                 )}


                 {/* --- Invoice Paper Simulation --- */}
                 <div className="invoice-paper mx-lg-auto p-4 p-md-5 border bg-white shadow-sm d-print-block">
                        {/* --- Header --- */}
                        <Row className="invoice-header align-items-center mb-4">
                            <Col xs={7} md={8} className="company-info">
                                 <img src={logo} alt="Saman Motors Logo" className="company-logo mb-2"/>
                                 <h4 className="fw-bold mb-1 company-name">SAMAN MOTORS</h4>
                                 <p className="mb-0 company-tagline small">ALL CARS SPARES SALES & SERVICE STATION</p>
                                 <p className="mb-0 company-address small">Opp. Geeta Hume Pipe, Vasad Road, Vaghwala, Borsad - 388540</p>
                                 <p className="company-gstin mb-0 small">GSTIN No.: {invoice.gstinNo || '24BBDPK3507P1ZK'} | State: Gujarat (24)</p>
                            </Col>
                            <Col xs={5} md={4} className="text-end invoice-title">
                                <h5 className="invoice-type fw-bold mb-1 text-uppercase">Tax Invoice</h5>
                                <p className="invoice-copy-type mb-0 small text-muted">(Original for Recipient)</p>
                            </Col>
                        </Row>
                        <hr className="my-3"/>

                        {/* --- Meta Details --- */}
                         <Row className="mb-4 invoice-meta-section">
                            {/* Bill To Section */}
                            <Col md={7} className="customer-details mb-3 mb-md-0 pe-md-4">
                                <h6 className="text-muted small text-uppercase mb-2 fw-semibold">Bill To:</h6>
                                <div className="detail-block">
                                    <strong className="d-block">{customer?.name || 'N/A'}</strong>
                                    <div className="small text-muted">
                                        {customer?.address || 'N/A'}{customer?.city ? `, ${customer.city}` : ''}<br/>
                                        Mob: {customer?.phone || 'N/A'}<br/>
                                        GSTIN: {customer?.gstin || 'N/A'}
                                    </div>
                                </div>
                            </Col>
                             {/* Invoice & Vehicle Details Section */}
                            <Col md={5} className="invoice-vehicle-details border-start-md ps-md-4">
                                 <Row as="dl" className="detail-grid-dl mb-0 small">
                                    <Col xs={5} as="dt">Invoice No:</Col>
                                    <Col xs={7} as="dd" className="fw-bold">{invoice.invoiceNumber || 'N/A'}</Col>

                                    <Col xs={5} as="dt">Invoice Date:</Col>
                                    <Col xs={7} as="dd">{formatDate(invoice.dateIssued)}</Col>

                                    <Col xs={5} as="dt">Job Card No:</Col>
                                    <Col xs={7} as="dd">{invoice.jobSheetNumber || 'N/A'}</Col>

                                    <Col xs={5} as="dt">Vehicle No:</Col>
                                    <Col xs={7} as="dd" className="fw-semibold">{vehicle?.carNumber || 'N/A'}</Col>

                                    <Col xs={5} as="dt">Model:</Col>
                                    <Col xs={7} as="dd">{`${vehicle?.make || ''} ${vehicle?.model || 'N/A'}`.trim()}</Col>

                                    <Col xs={5} as="dt">KM Reading:</Col>
                                    <Col xs={7} as="dd">{invoice.kmReading != null ? `${invoice.kmReading} KM` : 'N/A'}</Col>
                                </Row>
                            </Col>
                        </Row>


                        {/* --- Items Table (Wrapped for Responsiveness) --- */}
                         <div className="table-responsive"> {/* <--- ADDED WRAPPER */}
                            <Table bordered className="invoice-items-table mb-0 small">
                                <thead className="table-light align-middle">
                                    <tr>
                                        <th className="text-center" style={{ width: '40px' }}>#</th>
                                        <th style={{ minWidth: '100px' }}>Part No.</th> {/* Added minWidth */}
                                        <th style={{ minWidth: '200px' }}>Description</th> {/* Added minWidth */}
                                        <th className="text-center" style={{ width: '50px' }}>Qty</th>
                                        <th className="text-end" style={{ width: '100px' }}>Rate</th> {/* Adjusted Width */}
                                        <th className="text-end" style={{ width: '100px' }}>Parts Amt</th> {/* Adjusted Width */}
                                        <th className="text-end" style={{ width: '100px' }}>Lubes Amt</th>{/* Adjusted Width */}
                                        <th className="text-end" style={{ width: '100px' }}>Labour Amt</th>{/* Adjusted Width */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* --- Render Invoice Items --- */}
                                    {items.map((item, index) => (
                                        <tr key={item.masterItemId || `item-${index}`}>
                                            <td className="text-center">{index + 1}</td>
                                            <td>{item.partNo || '-'}</td>
                                            <td>{item.name || 'N/A'}</td>
                                            <td className="text-center">{item.quantity || 0}</td>
                                            <td className="text-end">{formatCurrency(item.unitPrice)}</td>
                                            <td className="text-end">{formatCurrency(item.lineParts)}</td>
                                            <td className="text-end">{formatCurrency(item.lineLubes)}</td>
                                            <td className="text-end">{formatCurrency(item.lineLabour)}</td>
                                        </tr>
                                    ))}
                                    {/* --- Render Empty Rows for Consistent Height --- */}
                                    {Array.from({ length: Math.max(0, minTableRows - totalItems) }).map((_, i) => (
                                        <tr key={`empty-${i}`} className="empty-row">
                                            <td> </td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                                        </tr>
                                    ))}
                                </tbody>
                                {/* --- Table Footer with Updated Totals --- */}
                                <tfoot >
                                    <tr>
                                        {/* Text Section spanning columns and rows */}
                                        {/* INCREASED ROWSPAN to account for new "Taxable Amount" row */}
                                        <td colSpan="5" rowSpan={8} className="align-top text-section border-end p-2">
                                            <div className="mb-2">
                                                <strong className="d-block small text-uppercase text-muted">Amount in Words:</strong>
                                                <span className="amount-words fw-semibold">{amountInWords}</span>
                                            </div>
                                            <div className="bank-details my-2 pt-2 border-top">
                                                <strong className="d-block small text-uppercase text-muted">Bank Details:</strong>
                                                <div className="small">
                                                    <span>HDFC Bank ({invoice.bankBranch || 'BORSAD'})</span><br/>
                                                    <span>A/c No: {invoice.bankAccountNo || '07492000002739'}</span><br/>
                                                    <span>IFSC: {invoice.bankIfsc || 'HDFC0000749'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Numerical Totals */}
                                        <td colSpan="2" className="text-end label-cell fw-medium">TOTAL PARTS</td>
                                        <td className="text-end value-cell fw-medium">{formatCurrency(invoice.totalParts)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan="2" className="text-end label-cell fw-medium">TOTAL LUBES</td>
                                        <td className="text-end value-cell fw-medium">{formatCurrency(invoice.totalLubes)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan="2" className="text-end label-cell fw-medium">TOTAL LABOUR</td>
                                        <td className="text-end value-cell fw-medium">{formatCurrency(invoice.totalLabour)}</td>
                                    </tr>
                                    <tr className="subtotal-row">
                                        <td colSpan="2" className="text-end label-cell fw-semibold border-top pt-2">SUB TOTAL</td>
                                        <td className="text-end value-cell fw-semibold border-top pt-2">{formatCurrency(invoice.subTotal)}</td>
                                    </tr>

                                    {/* --- UPDATED Conditional Discount --- */}
                                    {invoice.discountAmount != null && invoice.discountAmount > 0 ? (
                                        <tr>
                                            <td colSpan="2" className="text-end label-cell">
                                                {getDiscountLabel()} {/* Use helper for label */}
                                            </td>
                                            <td className="text-end value-cell text-danger">(-) {formatCurrency(invoice.discountAmount)}</td>
                                        </tr>
                                    ) : ( <tr className="filler-row"><td colSpan="3"> </td></tr> )} {/* Filler */}

                                    {/* --- NEW: Taxable Amount (SubTotal - Discount) --- */}
                                     {(invoice.discountAmount > 0 || invoice.taxAmount > 0) && ( // Show only if discount/tax applied
                                         <tr className="taxable-amount-row">
                                             <td colSpan="2" className="text-end label-cell fw-semibold">TAXABLE AMOUNT</td>
                                             <td className="text-end value-cell fw-semibold">{formatCurrency(invoice.amountBeforeTax)}</td>
                                         </tr>
                                     )}

                                    {/* --- UPDATED Conditional Tax --- */}
                                    {invoice.taxAmount != null && invoice.taxAmount > 0 ? (
                                        <tr>
                                            <td colSpan="2" className="text-end label-cell">{getTaxLabel()}</td>
                                            <td className="text-end value-cell">(+) {formatCurrency(invoice.taxAmount)}</td>
                                        </tr>
                                    ) : (
                                         // Add filler only if Taxable Amount row wasn't shown AND no tax
                                         !(invoice.discountAmount > 0) && <tr className="filler-row"><td colSpan="3"> </td></tr>
                                     )}


                                    {/* --- Grand Total --- */}
                                    <tr className="grand-total-row table-light">
                                        <td colSpan="2" className="text-end label-cell fw-bolder pt-2">GRAND TOTAL</td>
                                        <td className="text-end value-cell fw-bolder fs-5 pt-2">{formatCurrency(invoice.grandTotal)}</td>
                                    </tr>
                                </tfoot>
                            </Table>
                         </div> {/* <--- END table-responsive WRAPPER */}


                         {/* --- Footer: Terms & Signature --- */}
                         <Row className="invoice-footer mt-4 pt-3 border-top">
                              <Col md={7} className="terms-section small pe-md-4 mb-3 mb-md-0">
                                 <strong className="text-muted text-uppercase small d-block mb-1">Terms & Conditions:</strong>
                                 <ol className="ps-3 mb-0">
                                     <li>Goods once sold will not be taken back or exchanged.</li>
                                     <li>Interest @18% p.a. will be charged if payment is not made within the stipulated time.</li>
                                     <li>All disputes are subject to BORSAD Jurisdiction only.</li>
                                     <li>E. & O. E. (Errors and Omissions Excepted).</li>
                                 </ol>
                             </Col>
                             <Col md={5} className="signature-section text-center pt-md-4 mt-md-4">
                                 <p className="mb-5 small">For, <strong>SAMAN MOTORS</strong></p>
                                 <p className="signature-line pt-2 mt-5 border-top small">Authorised Signatory</p>
                             </Col>
                         </Row>
                    </div> {/* End .invoice-paper */}

            </Container>
        </div> // End .invoice-view-wrapper
    );
};

export default InvoiceViewPage;