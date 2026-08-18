// src/pages/InvoiceViewPage.jsx
// --- COMPLETE & REFACTORED FILE WITH NEW LOGO CLASS ---

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Table, Button, Spinner, Alert } from 'react-bootstrap';
import { FaPrint, FaArrowLeft, FaWhatsapp } from 'react-icons/fa';
import api, { SERVER_BASE_URL } from '../api/api';
import defaultLogo from '../assets/saman-logo.png';
import CustomToast from '../components/CustomToast';
import LoadingOverlay from '../components/LoadingOverlay';
import ConfirmModal from '../components/ConfirmModal';
import '../App.css'; // Make sure you add the new CSS here

// FIX: Import number-to-words using ES Modules syntax
import numberToWords from 'number-to-words'; 

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
        console.error("Error formatting date:", e);
        return 'Invalid Date';
    }
};

const InvoiceViewPage = () => {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [invoice, setInvoice] = useState(null);
    const [garage, setGarage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sendingWa, setSendingWa] = useState(false);
    const [toast, setToast] = useState(null);
    const [error, setError] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null });

    // Data Fetching Effect
    useEffect(() => {
        const fetchInvoiceData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(`/invoices/${invoiceId}`);
                if (!response.ok) {
                    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    } catch (e) { /* JSON parsing failed, use default message */ }
                    throw new Error(errorMessage);
                }
                const data = await response.json();
                setInvoice(data);

                // Fetch active garage profile for branding
                const profileRes = await api.get('/profile');
                if (profileRes.ok) {
                    const profData = await profileRes.json();
                    setGarage(profData.garage);
                }
            } catch (err) {
                console.error("Error loading invoice data:", err);
                setError(err.message || "An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };
        fetchInvoiceData();
    }, [invoiceId]);

    const confirmSendWhatsApp = () => {
        if (!garage) {
            setToast({ type: 'error', title: 'Error', message: 'Garage profile not loaded yet. Please try again.' });
            return;
        }
        if (!garage.feature_whatsapp) {
            setToast({ type: 'error', title: 'Feature Disabled', message: 'WhatsApp Messaging is disabled globally for your account. Contact Cipra Infotech support.' });
            return;
        }
        if (garage.feature_whatsapp_utility === false) {
            setToast({ type: 'error', title: 'Feature Disabled', message: 'Utility transactional messaging is disabled for your account by your Super Admin.' });
            return;
        }
        if (garage.whatsapp_status !== 'connected') {
            setToast({ type: 'error', title: 'WhatsApp Disconnected', message: 'WhatsApp is not connected. Please scan the QR code in settings.' });
            return;
        }
        if (!invoice?.customer_phone) {
            setToast({ type: 'error', title: 'Missing Phone Number', message: 'Customer phone number is missing. Cannot dispatch WhatsApp message.' });
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: 'Confirm WhatsApp Invoice Dispatch',
            message: `Send invoice ${invoice?.invoice_number || ''} via WhatsApp to ${invoice?.customer_name || 'Customer'} (${invoice?.customer_phone || 'No phone'})?`,
            action: () => executeSendWhatsApp()
        });
    };

    const executeSendWhatsApp = async () => {
        setSendingWa(true);
        try {
            const res = await api.post('/whatsapp/send-invoice', { invoiceId });
            const data = await res.json();
            if (res.ok) {
                setToast({
                    type: 'success',
                    title: 'WhatsApp Delivered!',
                    message: data.message || 'Invoice sent successfully in background.'
                });
            } else {
                setToast({
                    type: 'error',
                    title: data.code === 'INSUFFICIENT_FUNDS' ? 'Balance Exhausted' : 'Dispatch Failed',
                    message: data.message || 'Failed to send WhatsApp invoice.'
                });
            }
        } catch (err) {
            setToast({ type: 'error', title: 'Network Error', message: 'Could not connect to WhatsApp service.' });
        } finally {
            setSendingWa(false);
        }
    };

    // --- Calculate all totals on the frontend using useMemo ---
    const invoiceTotals = useMemo(() => {
        if (!invoice) return null;

        const items = invoice.items || [];
        
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
        } else { // 'Fixed'
            discountAmount = invoiceDiscountValue;
        }

        // 3. Calculate tax, round off, and final grand total
        const amountBeforeTax = subTotal - discountAmount;
        const taxRate = Number(invoice.tax_rate) || 0;
        const taxAmount = (amountBeforeTax * taxRate) / 100;
        const unroundedGrandTotal = amountBeforeTax + taxAmount;
        const grandTotal = Math.round(unroundedGrandTotal);
        const roundOff = grandTotal - unroundedGrandTotal;
        
        return {
            totalParts: calculatedTotals.totalParts,
            totalLubes: calculatedTotals.totalLubes,
            totalLabour: calculatedTotals.totalLabour,
            subTotal,
            discountAmount,
            amountBeforeTax,
            taxAmount,
            unroundedGrandTotal,
            roundOff,
            grandTotal
        };

    }, [invoice]);

    // --- Amount in Words ---
    const amountInWords = useMemo(() => {
        const total = Number(invoiceTotals?.grandTotal) || 0; 
        if (total === 0) {
            return 'RUPEES ZERO ONLY';
        }

        // Use the imported numberToWords
        const integerPart = Math.floor(total);
        const decimalPart = Math.round((total - integerPart) * 100);

        let words = numberToWords.toWords(integerPart).toUpperCase();
        if (decimalPart > 0) {
            words += ` AND PAISE ${numberToWords.toWords(decimalPart).toUpperCase()}`;
        }
        return `RUPEES ${words} ONLY`;
    }, [invoiceTotals?.grandTotal]);


    // Render States
    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading Invoice...</p>
            </Container>
        );
    }

    if (error) {
         return (
            <Container className="py-5">
                <Alert variant="danger" className="d-print-none">
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

    if (!invoice || !invoiceTotals) {
        return (
             <Container className="py-5">
                <Alert variant="warning">Invoice data could not be loaded or is incomplete.</Alert>
             </Container>
        );
    }
    
    // Helper functions to get labels matching invoice creation customization
    const getDiscountLabel = () => {
        if (Number(invoice.discount_value) > 0) {
            if (invoice.discount_type === 'Percent') {
                 return `Discount (${invoice.discount_value}%)`;
            }
            return `Discount (Fixed)`;
        }
        return `Discount (0%)`;
    };

    const getTaxLabel = () => {
        if (Number(invoice.tax_rate) > 0) {
            return `GST (${invoice.tax_rate}%)`;
        }
        return 'GST (0%)';
    };
    
    // Constants for rendering
    const items = invoice.items || [];
    const minTableRows = 10;
    
    const logoSrc = garage?.logo_url ? (garage.logo_url.startsWith('http') ? garage.logo_url : `${SERVER_BASE_URL}${garage.logo_url}`) : defaultLogo;

    return (
        <div className={`invoice-view-wrapper bg-light py-4 py-md-5 printable-section`}>
            <LoadingOverlay isVisible={sendingWa} message="Sending WhatsApp Invoice..." />
            {toast && <CustomToast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />}
            
            <ConfirmModal 
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={() => {
                    if (confirmModal.action) confirmModal.action();
                    setConfirmModal({ isOpen: false, title: '', message: '', action: null });
                }}
                onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', action: null })}
            />

            <Container>
                <Row className="mb-3 d-print-none">
                     <Col className="text-end">
                         <Button variant="outline-secondary" size="sm" onClick={() => navigate(-1)} className="me-2"><FaArrowLeft className="me-1"/> Back</Button>
                          <Button 
                              variant="success" 
                              size="sm" 
                              onClick={confirmSendWhatsApp} 
                              disabled={sendingWa || garage?.feature_whatsapp_utility === false} 
                              className="me-2"
                              title={garage?.feature_whatsapp_utility === false ? "WhatsApp Utility Messaging is disabled by Super Admin" : "Send via WhatsApp"}
                          >
                              <FaWhatsapp className="me-1"/> Send via WhatsApp
                          </Button>
                          <Button variant="primary" size="sm" onClick={() => window.print()}><FaPrint className="me-1"/> Print Invoice</Button>
                     </Col>
                 </Row>
                 
                <div className="invoice-paper mx-lg-auto p-4 border bg-white shadow-sm" style={{ maxWidth: '850px' }}>
                    {/* 1. HEADER SECTION */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '65%', verticalAlign: 'top' }}>
                                    <img src={logoSrc} alt="Garage Logo" className="company-logo-view mb-1" style={{ maxHeight: '55px', maxWidth: '200px', objectFit: 'contain', display: 'block' }} />
                                    <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '12pt', letterSpacing: '-0.2px' }}>{garage?.name || 'SAMAN MOTORS'}</h5>
                                    <p className="mb-0 text-dark small" style={{ fontSize: '8.5pt', fontWeight: 600 }}>ALL CARS SPARES SALES & SERVICE STATION</p>
                                    <p className="mb-0 text-muted small" style={{ fontSize: '8pt', lineHeight: 1.3 }}>{garage?.address || 'Opp. Geeta Hume Pipe, Vasad Road, Vaghwala, Borsad - 388540'}</p>
                                    <p className="mb-0 text-muted small" style={{ fontSize: '8pt' }}>GSTIN: <strong>{garage?.gst_number || invoice.gstinNo || '24BBDPK3507P1ZK'}</strong> | Phone: {garage?.phone || '9428434436'}</p>
                                </td>
                                <td style={{ width: '35%', textAlign: 'right', verticalAlign: 'top' }}>
                                    <h4 className="fw-bold mb-0 text-uppercase text-dark" style={{ fontSize: '16pt', letterSpacing: '0.5px' }}>Tax Invoice</h4>
                                    <span className="text-muted small" style={{ fontSize: '8.5pt' }}>(Original for Recipient)</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div style={{ height: '2px', backgroundColor: '#334155', marginBottom: '8px' }}></div>

                    {/* 2. CUSTOMER & INVOICE METADATA (Boxed 2-Column Grid) */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #334155', backgroundColor: '#f8fafc', marginBottom: '10px', tableLayout: 'fixed', borderRadius: '4px' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '50%', verticalAlign: 'top', padding: '6px 10px', borderRight: '1px solid #334155' }}>
                                    <div className="text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: '7.5pt', letterSpacing: '0.5px' }}>Billed To:</div>
                                    <strong className="d-block text-dark" style={{ fontSize: '10pt' }}>{invoice.customer_name || 'Walk-in Customer'}</strong>
                                    <div className="small text-muted" style={{ fontSize: '8.5pt', lineHeight: 1.35 }}>
                                        {invoice.customer_address && invoice.customer_address !== 'N/A' && (
                                            <>{invoice.customer_address}<br/></>
                                        )}
                                        {invoice.customer_phone && invoice.customer_phone !== 'N/A' && (
                                            <><strong>Mob:</strong> {invoice.customer_phone}</>
                                        )}
                                        {invoice.customer_gstin && invoice.customer_gstin !== 'N/A' && (
                                            <><br/><strong>GSTIN:</strong> {invoice.customer_gstin}</>
                                        )}
                                    </div>
                                </td>
                                <td style={{ width: '50%', verticalAlign: 'top', padding: '6px 10px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', lineHeight: 1.4 }}>
                                        <tbody>
                                            <tr>
                                                <td style={{ width: '40%', color: '#64748b' }}>Invoice No:</td>
                                                <td style={{ width: '60%', fontWeight: 'bold', color: '#0f172a' }}>{invoice.invoice_number || '-'}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ color: '#64748b' }}>Invoice Date:</td>
                                                <td style={{ color: '#0f172a' }}>{formatDate(invoice.date_issued)}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ color: '#64748b' }}>Job Card No:</td>
                                                <td style={{ color: '#0f172a' }}>{invoice.job_sheet_number || invoice.jobSheetNumber || '-'}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ color: '#64748b' }}>Vehicle No:</td>
                                                <td style={{ fontWeight: 'bold', color: '#0f172a' }}>{invoice.vehicle_car_number || '-'}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ color: '#64748b' }}>Vehicle Model:</td>
                                                <td style={{ color: '#0f172a' }}>{`${invoice.vehicle_make || ''} ${invoice.vehicle_model || ''}`.trim() || '-'}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ color: '#64748b' }}>KM Reading:</td>
                                                <td style={{ color: '#0f172a' }}>{invoice.km_reading != null && invoice.km_reading !== '' ? `${invoice.km_reading} KM` : '-'}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* 3. ITEMS TABLE (Visually Standalone Bordered Table) */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #334155', marginBottom: '10px', tableLayout: 'fixed' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #334155' }}>
                                <th style={{ width: '5%', textAlign: 'center', padding: '5px 4px', borderRight: '1px solid #334155', fontSize: '8.5pt', fontWeight: 700 }}>#</th>
                                <th style={{ width: '47%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #334155', fontSize: '8.5pt', fontWeight: 700 }}>Description</th>
                                <th style={{ width: '8%', textAlign: 'center', padding: '5px 4px', borderRight: '1px solid #334155', fontSize: '8.5pt', fontWeight: 700 }}>Qty</th>
                                <th style={{ width: '13%', textAlign: 'right', padding: '5px 8px', borderRight: '1px solid #334155', fontSize: '8.5pt', fontWeight: 700 }}>Parts (₹)</th>
                                <th style={{ width: '13%', textAlign: 'right', padding: '5px 8px', borderRight: '1px solid #334155', fontSize: '8.5pt', fontWeight: 700 }}>Lubes (₹)</th>
                                <th style={{ width: '14%', textAlign: 'right', padding: '5px 8px', fontSize: '8.5pt', fontWeight: 700 }}>Labour (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={item.master_item_id || `item-${index}`} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '8.5pt' }}>
                                    <td style={{ textAlign: 'center', padding: '4px', borderRight: '1px solid #334155' }}>{index + 1}</td>
                                    <td style={{ padding: '4px 8px', borderRight: '1px solid #334155', fontWeight: 600, color: '#0f172a' }}>{item.name || '-'}</td>
                                    <td style={{ textAlign: 'center', padding: '4px', borderRight: '1px solid #334155' }}>{item.quantity || 0}</td>
                                    <td style={{ textAlign: 'right', padding: '4px 8px', borderRight: '1px solid #334155' }}>{formatCurrency(item.line_parts_calculated)}</td>
                                    <td style={{ textAlign: 'right', padding: '4px 8px', borderRight: '1px solid #334155' }}>{formatCurrency(item.lube_charge)}</td>
                                    <td style={{ textAlign: 'right', padding: '4px 8px' }}>{formatCurrency(item.labour_charge)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* 4. SUMMARY & PAYMENT SECTION (Visually Separated Dual-Card Architecture) */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', pageBreakInside: 'avoid', marginBottom: '8px' }}>
                        <tbody>
                            <tr>
                                {/* Left Card: Customer Payment & Bank Details */}
                                <td style={{ width: '52%', verticalAlign: 'top', paddingRight: '6px' }}>
                                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#f8fafc', padding: '8px 10px', height: '100%' }}>
                                        <div style={{ marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
                                            <strong className="d-block text-uppercase text-muted" style={{ fontSize: '7.5pt', letterSpacing: '0.5px' }}>Amount in Words:</strong>
                                            <span className="fw-bold text-dark" style={{ fontSize: '9pt', display: 'block', marginTop: '2px' }}>{amountInWords}</span>
                                        </div>
                                        <div className="bank-details">
                                            <strong className="d-block text-uppercase text-muted" style={{ fontSize: '7.5pt', letterSpacing: '0.5px', marginBottom: '2px' }}>Bank Payment Details:</strong>
                                            <div style={{ fontSize: '8.5pt', lineHeight: 1.4, color: '#334155' }}>
                                                <div><strong>Bank:</strong> {garage?.bank_name || invoice.bankBranch || 'HDFC Bank (BORSAD)'}</div>
                                                <div><strong>A/c No:</strong> {garage?.bank_account_no || invoice.bankAccountNo || '07492000002739'}</div>
                                                <div><strong>IFSC:</strong> {garage?.bank_ifsc || invoice.bankIfsc || 'HDFC0000749'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Right Card: Financial Totals Breakdown Table */}
                                <td style={{ width: '48%', verticalAlign: 'top', paddingLeft: '6px' }}>
                                    <div style={{ border: '1px solid #334155', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', tableLayout: 'fixed' }}>
                                            <tbody>
                                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '3.5px 6px', textAlign: 'right', color: '#475569', width: '55%', borderRight: '1px solid #e2e8f0' }}>Total Parts:</td>
                                                    <td style={{ padding: '3.5px 8px', textAlign: 'right', width: '45%', fontWeight: 500 }}>{formatCurrency(invoiceTotals.totalParts)}</td>
                                                </tr>
                                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '3.5px 6px', textAlign: 'right', color: '#475569', borderRight: '1px solid #e2e8f0' }}>Total Lubes:</td>
                                                    <td style={{ padding: '3.5px 8px', textAlign: 'right', fontWeight: 500 }}>{formatCurrency(invoiceTotals.totalLubes)}</td>
                                                </tr>
                                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '3.5px 6px', textAlign: 'right', color: '#475569', borderRight: '1px solid #e2e8f0' }}>Total Labour:</td>
                                                    <td style={{ padding: '3.5px 8px', textAlign: 'right', fontWeight: 500 }}>{formatCurrency(invoiceTotals.totalLabour)}</td>
                                                </tr>
                                                <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                                                    <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700, color: '#0f172a', borderRight: '1px solid #cbd5e1' }}>SUB TOTAL:</td>
                                                    <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(invoiceTotals.subTotal)}</td>
                                                </tr>
                                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '3.5px 6px', textAlign: 'right', color: invoiceTotals.discountAmount > 0 ? '#dc2626' : '#475569', borderRight: '1px solid #e2e8f0' }}>
                                                        {getDiscountLabel()}:
                                                    </td>
                                                    <td style={{ padding: '3.5px 8px', textAlign: 'right', color: invoiceTotals.discountAmount > 0 ? '#dc2626' : '#0f172a', fontWeight: invoiceTotals.discountAmount > 0 ? 600 : 400 }}>
                                                        {invoiceTotals.discountAmount > 0 ? `(-) ${formatCurrency(invoiceTotals.discountAmount)}` : formatCurrency(0)}
                                                    </td>
                                                </tr>
                                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '3.5px 6px', textAlign: 'right', color: '#475569', fontWeight: 600, borderRight: '1px solid #e2e8f0' }}>Taxable Amount:</td>
                                                    <td style={{ padding: '3.5px 8px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(invoiceTotals.amountBeforeTax)}</td>
                                                </tr>
                                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '3.5px 6px', textAlign: 'right', color: '#475569', borderRight: '1px solid #e2e8f0' }}>{getTaxLabel()}:</td>
                                                    <td style={{ padding: '3.5px 8px', textAlign: 'right' }}>{invoiceTotals.taxAmount > 0 ? `(+) ${formatCurrency(invoiceTotals.taxAmount)}` : formatCurrency(0)}</td>
                                                </tr>
                                                <tr style={{ borderBottom: '1px solid #334155' }}>
                                                    <td style={{ padding: '3.5px 6px', textAlign: 'right', color: '#475569', borderRight: '1px solid #e2e8f0' }}>Round Off:</td>
                                                    <td style={{ padding: '3.5px 8px', textAlign: 'right' }}>
                                                        {Math.abs(invoiceTotals.roundOff) < 0.001 
                                                            ? formatCurrency(0) 
                                                            : (invoiceTotals.roundOff < 0 
                                                                ? `(-) ${formatCurrency(Math.abs(invoiceTotals.roundOff))}` 
                                                                : `(+) ${formatCurrency(invoiceTotals.roundOff)}`)}
                                                    </td>
                                                </tr>
                                                <tr style={{ backgroundColor: '#f1f5f9' }}>
                                                    <td style={{ padding: '6px 6px', textAlign: 'right', fontSize: '10.5pt', fontWeight: 800, color: '#0f172a', borderRight: '1px solid #cbd5e1' }}>GRAND TOTAL:</td>
                                                    <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: '11pt', fontWeight: 800, color: '#0f172a' }}>{formatCurrency(invoiceTotals.grandTotal)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* 5. FOOTER: TERMS & SIGNATURE */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', pageBreakInside: 'avoid' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '60%', verticalAlign: 'top', paddingRight: '12px' }}>
                                    <strong className="text-muted text-uppercase d-block mb-1" style={{ fontSize: '7.5pt', letterSpacing: '0.5px' }}>Terms & Conditions:</strong>
                                    {garage?.terms_and_conditions ? (
                                        <div style={{ fontSize: '7.5pt', color: '#475569', whiteSpace: 'pre-line', lineHeight: 1.3 }}>{garage.terms_and_conditions}</div>
                                    ) : (
                                        <ol style={{ paddingLeft: '14px', margin: 0, fontSize: '7.5pt', color: '#475569', lineHeight: 1.35 }}>
                                            <li>Goods once sold will not be taken back or exchanged.</li>
                                            <li>Interest @18% p.a. will be charged if payment is not made within the stipulated time.</li>
                                            <li>All disputes are subject to BORSAD Jurisdiction only.</li>
                                            <li>E. & O. E. (Errors and Omissions Excepted).</li>
                                        </ol>
                                    )}
                                </td>
                                <td style={{ width: '40%', verticalAlign: 'bottom', textAlign: 'center', paddingLeft: '12px' }}>
                                    <p className="mb-4 small text-dark" style={{ fontSize: '8.5pt' }}>For, <strong>{(garage?.name || 'SAMAN MOTORS').toUpperCase()}</strong></p>
                                    <div style={{ borderTop: '1px solid #334155', paddingTop: '4px', display: 'inline-block', width: '80%' }}>
                                        <span style={{ fontSize: '8pt', color: '#475569', fontWeight: 600 }}>Authorised Signatory</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Container>
        </div>
    );
};

export default InvoiceViewPage;