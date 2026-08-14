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

        // 3. Calculate tax and final grand total
        const amountBeforeTax = subTotal - discountAmount;
        const taxRate = Number(invoice.tax_rate) || 0;
        const taxAmount = (amountBeforeTax * taxRate) / 100;
        const grandTotal = amountBeforeTax + taxAmount;
        
        return {
            totalParts: calculatedTotals.totalParts,
            totalLubes: calculatedTotals.totalLubes,
            totalLabour: calculatedTotals.totalLabour,
            subTotal,
            discountAmount,
            amountBeforeTax,
            taxAmount,
            grandTotal
        };

    }, [invoice]);

    // --- Amount in Words ---
    const amountInWords = useMemo(() => {
        const total = Number(invoice?.grand_total) || 0; 
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
    }, [invoice?.grand_total]);


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
    
    // Helper functions to get labels
    const getDiscountLabel = () => {
        if (Number(invoice.discount_value) > 0) {
            if (invoice.discount_type === 'Percent') {
                 return `DISCOUNT (${invoice.discount_value}%)`;
            }
        }
        return `DISCOUNT APPLIED`;
    };

    const getTaxLabel = () => {
        if (Number(invoice.tax_rate) > 0) {
            return `TAX (${invoice.tax_rate}%)`;
        }
        return 'TAX ADDED';
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
                 
                <div className="invoice-paper mx-lg-auto p-4 p-md-5 border bg-white shadow-sm">
                    <Row className="invoice-header align-items-center mb-4">
                        <Col xs={7} md={8} className="company-info">
                            <img src={logoSrc} alt="Garage Logo" className="company-logo-view mb-2" style={{ maxHeight: '110px', maxWidth: '280px', objectFit: 'contain' }} />
                            <h4 className="fw-bold mb-1 company-name">{garage?.name || 'SAMAN MOTORS'}</h4>
                            <p className="mb-0 company-tagline small">ALL CARS SPARES SALES & SERVICE STATION</p>
                            <p className="mb-0 company-address small">{garage?.address || 'Opp. Geeta Hume Pipe, Vasad Road, Vaghwala, Borsad - 388540'}</p>
                            <p className="company-gstin mb-0 small">GSTIN No.: {garage?.gst_number || invoice.gstinNo || '24BBDPK3507P1ZK'} | Phone: {garage?.phone || ''}</p>
                        </Col>
                        <Col xs={5} md={4} className="text-end invoice-title">
                            <h5 className="invoice-type fw-bold mb-1 text-uppercase">Tax Invoice</h5>
                            <p className="invoice-copy-type mb-0 small text-muted">(Original for Recipient)</p>
                        </Col>
                    </Row>
                    <hr className="my-3"/>
                    <Row className="mb-4 invoice-meta-section">
                        <Col md={7} className="customer-details mb-3 mb-md-0 pe-md-4">
                            <h6 className="text-muted small text-uppercase mb-2 fw-semibold">Bill To:</h6>
                            <div className="detail-block">
                                <strong className="d-block">{invoice.customer_name || 'N/A'}</strong>
                                <div className="small text-muted">
                                    {invoice.customer_address || 'N/A'}<br/>
                                    Mob: {invoice.customer_phone || 'N/A'}<br/>
                                    GSTIN: {invoice.customer_gstin || 'N/A'}
                                </div>
                            </div>
                        </Col>
                        <Col md={5} className="invoice-vehicle-details border-start-md ps-md-4">
                            <Row as="dl" className="detail-grid-dl mb-0 small">
                                <Col xs={5} as="dt">Invoice No:</Col>
                                <Col xs={7} as="dd" className="fw-bold">{invoice.invoice_number || 'N/A'}</Col>
                                <Col xs={5} as="dt">Invoice Date:</Col>
                                <Col xs={7} as="dd">{formatDate(invoice.date_issued)}</Col>
                                <Col xs={5} as="dt">Job Card No:</Col>
                                <Col xs={7} as="dd">{invoice.job_sheet_number || invoice.jobSheetNumber || 'N/A'}</Col>
                                <Col xs={5} as="dt">Vehicle No:</Col>
                                <Col xs={7} as="dd" className="fw-semibold">{invoice.vehicle_car_number || 'N/A'}</Col>
                                <Col xs={5} as="dt">Model:</Col>
                                <Col xs={7} as="dd">{`${invoice.vehicle_make || ''} ${invoice.vehicle_model || 'N/A'}`.trim()}</Col>
                                <Col xs={5} as="dt">KM Reading:</Col>
                                <Col xs={7} as="dd">{invoice.km_reading != null ? `${invoice.km_reading} KM` : 'N/A'}</Col>
                            </Row>
                        </Col>
                    </Row>
                    <div className="table-responsive">
                        <Table bordered className="invoice-items-table mb-0 small">
                            <thead className="table-light align-middle">
                                <tr>
                                    <th className="text-center" style={{ width: '40px' }}>#</th>
                                    <th style={{ minWidth: '100px' }}>Part No.</th>
                                    <th style={{ minWidth: '200px' }}>Description</th>
                                    <th className="text-center" style={{ width: '50px' }}>Qty</th>
                                    <th className="text-end" style={{ width: '100px' }}>Parts Amt</th>
                                    <th className="text-end" style={{ width: '100px' }}>Lubes Amt</th>
                                    <th className="text-end" style={{ width: '100px' }}>Labour Amt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={item.master_item_id || `item-${index}`}>
                                        <td className="text-center">{index + 1}</td>
                                        <td>{item.part_no || '-'}</td>
                                        <td>{item.name || 'N/A'}</td>
                                        <td className="text-center">{item.quantity || 0}</td>
                                        <td className="text-end">{formatCurrency(item.line_parts_calculated)}</td>
                                        <td className="text-end">{formatCurrency(item.lube_charge)}</td>
                                        <td className="text-end">{formatCurrency(item.labour_charge)}</td>
                                    </tr>
                                ))}
                                {Array.from({ length: Math.max(0, minTableRows - items.length) }).map((_, i) => (
                                    <tr key={`empty-${i}`} className="empty-row"><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="4" rowSpan={8} className="align-top text-section border-end p-2">
                                        <div className="mb-2">
                                            <strong className="d-block small text-uppercase text-muted">Amount in Words:</strong>
                                            <span className="amount-words fw-semibold">{amountInWords}</span>
                                        </div>
                                        <div className="bank-details my-2 pt-2 border-top">
                                            <strong className="d-block small text-uppercase text-muted">Bank Details:</strong>
                                            <div className="small">
                                                <span>{garage?.bank_name || invoice.bankBranch || 'HDFC Bank (BORSAD)'}</span><br/>
                                                <span>A/c No: {garage?.bank_account_no || invoice.bankAccountNo || '07492000002739'}</span><br/>
                                                <span>IFSC: {garage?.bank_ifsc || invoice.bankIfsc || 'HDFC0000749'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td colSpan="2" className="text-end label-cell fw-medium">TOTAL PARTS</td>
                                    <td className="text-end value-cell fw-medium">{formatCurrency(invoiceTotals.totalParts)}</td>
                                </tr>
                                <tr>
                                    <td colSpan="2" className="text-end label-cell fw-medium">TOTAL LUBES</td>
                                    <td className="text-end value-cell fw-medium">{formatCurrency(invoiceTotals.totalLubes)}</td>
                                </tr>
                                <tr>
                                    <td colSpan="2" className="text-end label-cell fw-medium">TOTAL LABOUR</td>
                                    <td className="text-end value-cell fw-medium">{formatCurrency(invoiceTotals.totalLabour)}</td>
                                </tr>
                                <tr className="subtotal-row">
                                    <td colSpan="2" className="text-end label-cell fw-semibold border-top pt-2">SUB TOTAL</td>
                                    <td className="text-end value-cell fw-semibold border-top pt-2">{formatCurrency(invoiceTotals.subTotal)}</td>
                                </tr>
                                {invoiceTotals.discountAmount > 0 && (
                                    <tr>
                                        <td colSpan="2" className="text-end label-cell">{getDiscountLabel()}</td>
                                        <td className="text-end value-cell text-danger">(-) {formatCurrency(invoiceTotals.discountAmount)}</td>
                                    </tr>
                                )}
                                {Number(invoice.tax_rate) > 0 && (
                                    <tr className="taxable-amount-row">
                                        <td colSpan="2" className="text-end label-cell fw-semibold">TAXABLE AMOUNT</td>
                                        <td className="text-end value-cell fw-semibold">{formatCurrency(invoiceTotals.amountBeforeTax)}</td>
                                    </tr>
                                )}
                                {invoiceTotals.taxAmount > 0 && (
                                    <tr>
                                        <td colSpan="2" className="text-end label-cell">{getTaxLabel()}</td>
                                        <td className="text-end value-cell">(+) {formatCurrency(invoiceTotals.taxAmount)}</td>
                                    </tr>
                                )}
                                <tr className="grand-total-row table-light">
                                    <td colSpan="2" className="text-end label-cell fw-bolder pt-2">GRAND TOTAL</td>
                                    <td className="text-end value-cell fw-bolder fs-5 pt-2">{formatCurrency(invoiceTotals.grandTotal)}</td>
                                </tr>
                            </tfoot>
                        </Table>
                    </div>
                    <Row className="invoice-footer mt-4 pt-3 border-top">
                        <Col md={7} className="terms-section small pe-md-4 mb-3 mb-md-0">
                            <strong className="text-muted text-uppercase small d-block mb-1">Terms & Conditions:</strong>
                            {garage?.terms_and_conditions ? (
                                <div style={{ whiteSpace: 'pre-line' }}>{garage.terms_and_conditions}</div>
                            ) : (
                                <ol className="ps-3 mb-0">
                                    <li>Goods once sold will not be taken back or exchanged.</li>
                                    <li>Interest @18% p.a. will be charged if payment is not made within the stipulated time.</li>
                                    <li>All disputes are subject to BORSAD Jurisdiction only.</li>
                                    <li>E. & O. E. (Errors and Omissions Excepted).</li>
                                </ol>
                            )}
                        </Col>
                        <Col md={5} className="signature-section text-center pt-md-4 mt-md-4">
                            <p className="mb-5 small">For, <strong>{(garage?.name || 'My Garage').toUpperCase()}</strong></p>
                            <p className="signature-line pt-2 mt-5 border-top small">Authorised Signatory</p>
                        </Col>
                    </Row>
                </div>
            </Container>
        </div>
    );
};

export default InvoiceViewPage;