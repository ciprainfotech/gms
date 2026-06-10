// src/pages/CreateInvoicePage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Form, InputGroup, Alert, Badge, Spinner, ListGroup, Modal } from 'react-bootstrap';
import { FaFileInvoiceDollar, FaCheck, FaTimes, FaUser, FaCar, FaPlus, FaInfoCircle } from 'react-icons/fa';
import api from '../api/api';

// Robust currency formatter to gracefully accept numeric data types and string allocations alike
const formatCurrency = (amount) => {
    const num = amount != null ? parseFloat(amount) : 0;
    if (isNaN(num)) {
        return '₹ 0.00';
    }
    return num.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    });
};

// Strict DD/MM/YYYY Formatter
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const CreateInvoicePage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [readyJobSheets, setReadyJobSheets] = useState([]);
    const [invoiceDraft, setInvoiceDraft] = useState(null);
    const [invoiceCustomer, setInvoiceCustomer] = useState(null);
    const [invoiceVehicle, setInvoiceVehicle] = useState(null);

    const [discountType, setDiscountType] = useState('Percent');
    const [discountValue, setDiscountValue] = useState(0);
    const [taxRate, setTaxRate] = useState(18);
    const [error, setError] = useState('');
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [isLoadingSheets, setIsLoadingSheets] = useState(true);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdInvoiceData, setCreatedInvoiceData] = useState(null);

    useEffect(() => {
        const fetchReadyJobSheets = async () => {
            setIsLoadingSheets(true);
            setError('');
            try {
                const response = await api.get('/invoices/ready-for-invoicing');
                if (!response.ok) {
                    let errorMessage = `API Error: ${response.status}`;
                    try {
                        const errData = await response.json();
                        errorMessage = errData.message || errorMessage;
                    } catch (e) {}
                    throw new Error(errorMessage);
                }
                const data = await response.json();
                setReadyJobSheets(data);
            } catch (err) {
                console.error("Error loading job sheets for invoicing:", err);
                setError(err.message || "Failed to load completed job sheets.");
            } finally {
                setIsLoadingSheets(false);
            }
        };
        fetchReadyJobSheets();
    }, []);

    useEffect(() => {
        if (location.state?.finalizedJobSheet) {
            handleCreateDraft(location.state.finalizedJobSheet);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);

    const handleCreateDraft = (jobSheet) => {
        if (!jobSheet) return;

        setInvoiceCustomer({
            name: jobSheet.customer_name || jobSheet.customerName || '',
            address: jobSheet.customer_address || jobSheet.customerAddress || '',
            phone: jobSheet.customer_phone || jobSheet.customerPhone || '',
            city: ''
        });

        setInvoiceVehicle({
            make: jobSheet.make || jobSheet.make_name || jobSheet.vehicle_make || '',
            model: jobSheet.model || jobSheet.model_name || jobSheet.vehicle_model || '',
            year: jobSheet.year || jobSheet.vehicle_year || '',
            carNumber: jobSheet.car_number || jobSheet.vehicleNumber || jobSheet.carNumber || jobSheet.vehicle_car_number || '',
            vin: jobSheet.vin || jobSheet.vehicle_vin || ''
        });

        const rawItems = jobSheet.items || [];
        const normalizedItems = rawItems.map(item => {
            const qty = parseInt(item.quantity, 10) || 0;
            const price = parseFloat(item.unit_price ?? item.unitPrice ?? 0);
            const lube = parseFloat(item.lube_charge ?? item.lubeCharge ?? 0);
            const labour = parseFloat(item.labour_charge ?? item.labourCharge ?? 0);

            return {
                ...item,
                master_item_id: item.master_item_id || item.masterItemId,
                name: item.name,
                part_no: item.part_no || item.partNo,
                quantity: qty,
                line_parts: item.line_parts ?? item.lineParts ?? (price * qty),
                line_lubes: item.line_lubes ?? item.lineLubes ?? lube,
                line_labour: item.line_labour ?? item.lineLabour ?? labour,
                line_total: item.line_total ?? item.lineTotal ?? ((price * qty) + lube + labour)
            };
        });

        const totalParts = parseFloat(jobSheet.total_parts ?? jobSheet.totalParts ?? normalizedItems.reduce((acc, i) => acc + (i.line_parts || 0), 0)) || 0;
        const totalLubes = parseFloat(jobSheet.total_lubes ?? jobSheet.totalLubes ?? normalizedItems.reduce((acc, i) => acc + (i.line_lubes || 0), 0)) || 0;
        const totalLabour = parseFloat(jobSheet.total_labour ?? jobSheet.totalLabour ?? normalizedItems.reduce((acc, i) => acc + (i.line_labour || 0), 0)) || 0;
        const grandTotal = parseFloat(jobSheet.grand_total ?? jobSheet.grandTotal ?? jobSheet.subTotal ?? (totalParts + totalLubes + totalLabour)) || 0;

        const draft = {
            jobSheetId: jobSheet.id,
            jobSheetNumber: jobSheet.jobSheetNumber || jobSheet.job_sheet_number,
            dateIssued: new Date().toISOString().split('T')[0],
            items: normalizedItems,
            totalParts,
            totalLubes,
            totalLabour,
            subTotal: grandTotal,
        };

        setInvoiceDraft(draft);
        setDiscountType('Percent');
        setDiscountValue(0);
        setTaxRate(18);
        setError('');
        window.scrollTo(0, 0);
    };

    const invoiceTotals = useMemo(() => {
        if (!invoiceDraft) return null;
        const subtotal = parseFloat(invoiceDraft.subTotal) || 0;
        let calculatedDiscountAmount = 0;
        const currentDiscountValue = parseFloat(discountValue) || 0;
        const currentTaxRatePercent = parseFloat(taxRate) || 0;
        
        if (discountType === 'Percent' && currentDiscountValue > 0) {
            calculatedDiscountAmount = subtotal * (currentDiscountValue / 100);
        } else if (discountType === 'Fixed' && currentDiscountValue > 0) {
            calculatedDiscountAmount = currentDiscountValue;
        }
        
        const amountBeforeTax = subtotal - Math.max(0, calculatedDiscountAmount);
        const calculatedTaxAmount = amountBeforeTax * (currentTaxRatePercent / 100);
        const calculatedGrandTotal = amountBeforeTax + calculatedTaxAmount;
        
        return {
            discountAmount: Math.max(0, calculatedDiscountAmount),
            taxableAmount: amountBeforeTax,
            taxAmount: calculatedTaxAmount,
            grandTotal: calculatedGrandTotal
        };
    }, [invoiceDraft, discountType, discountValue, taxRate]);

    // 1. Opens the Confirmation Modal
    const promptFinalize = () => {
        if (!invoiceDraft || !invoiceTotals) return;
        setShowConfirmModal(true);
    };

    // 2. The actual API call (Runs securely when they click "Yes" in your modal)
    const executeFinalizeInvoice = async () => {
        setShowConfirmModal(false); 
        setIsFinalizing(true);
        setError('');
        
        const finalInvoicePayload = {
            jobSheetId: invoiceDraft.jobSheetId,
            dateIssued: invoiceDraft.dateIssued,
            discountType,
            discountValue: parseFloat(discountValue) || 0,
            taxRate: parseFloat(taxRate) || 0,
            notes: "",
        };
        
        try {
            const response = await api.post('/invoices', finalInvoicePayload);
            if (!response.ok) {
                let errorMessage = `API Error: ${response.status}`;
                try {
                    const errData = await response.json();
                    errorMessage = errData.message || errorMessage;
                } catch (e) {}
                throw new Error(errorMessage);
            }
            const savedInvoice = await response.json();
            
            // Replaces the window.alert with a smooth dashboard success window
            setCreatedInvoiceData(savedInvoice);
            setShowSuccessModal(true);
            
        } catch (err) {
            console.error("Error saving invoice:", err);
            setError(err.message || "Failed to save the invoice. Please try again.");
        } finally {
            setIsFinalizing(false);
        }
    };

    // 3. Runs when they close the Success Modal
    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        if (createdInvoiceData) {
            navigate(`/invoices/${createdInvoiceData.id}/view`);
        }
    };

    return (
        <Container fluid className="py-4">
            <div className="page-header-row mb-4">
                <h2 className="page-title-active mb-0">
                    <FaFileInvoiceDollar className="me-2" /> Create Invoice
                </h2>
            </div>

            <div className="main-content">
                {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                {!invoiceDraft && (
                    <Card className="shadow-sm border-light mb-4">
                        <Card.Header className="bg-light-subtle fw-semibold">
                            <FaInfoCircle className="me-2 text-primary"/> Select Completed Job Sheet
                        </Card.Header>
                        <Card.Body className="p-0">
                            {isLoadingSheets ? (
                                <div className="text-center p-5 text-muted">
                                    <Spinner animation="border" size="sm" className="me-2"/> Loading completed job sheets...
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <Table hover className="mb-0 align-middle job-sheet-selection-table">
                                        <thead className="table-light small text-uppercase text-secondary">
                                            <tr>
                                                <th className="py-2 px-3">Job Sheet #</th>
                                                <th className="py-2 px-3">Customer</th>
                                                <th className="py-2 px-3">Vehicle</th>
                                                <th className="py-2 px-3">Date Completed</th>
                                                <th className="py-2 px-3 text-end">Job Total</th>
                                                <th className="py-2 px-3 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {readyJobSheets.length === 0 ? (
                                                <tr><td colSpan="6" className="text-center text-muted p-4"><i>No completed job sheets found waiting for invoicing.</i></td></tr>
                                            ) : (
                                                readyJobSheets.map(js => (
                                                    <tr key={js.id}>
                                                        <td className="px-3 fw-medium">{js.job_sheet_number || js.jobSheetNumber}</td>
                                                        <td className="px-3">{js.customer_name || js.customerName || 'N/A'}</td>
                                                        <td className="px-3">{`${js.make || ''} ${js.model || ''}`.trim()} ({js.car_number || js.carNumber || js.vehicle_car_number})</td>
                                                        <td className="px-3">
                                                            {/* 👉 FIXED: Implemented strict format utility mapping */}
                                                            {formatDate(js.date_completed || js.dateCompleted)}
                                                        </td>
                                                        <td className="px-3 text-end fw-semibold text-success">
                                                            {formatCurrency(js.grand_total ?? js.grandTotal ?? 0)}
                                                        </td>
                                                        <td className="px-3 text-center">
                                                            <Button variant="primary" size="sm" onClick={() => handleCreateDraft(js)}>
                                                                <FaPlus className="me-1" /> Create Invoice
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                )}
                
                {invoiceDraft && invoiceTotals && (
                    <Card className="shadow-sm border-primary">
                        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                            <span className="fw-semibold">Invoice Draft (Based on Job Sheet: {invoiceDraft.jobSheetNumber})</span>
                        </Card.Header>
                        <Card.Body className="p-4">
                            {invoiceCustomer && invoiceVehicle && (
                                <Row className="mb-4">
                                    <Col md={6} className="mb-3 mb-md-0">
                                        <h5 className="h6 text-muted mb-2"><FaUser className="me-2"/>Bill To</h5>
                                        <ListGroup variant="flush">
                                            <ListGroup.Item className="px-0 py-1 fw-medium">{invoiceCustomer.name}</ListGroup.Item>
                                            <ListGroup.Item className="px-0 py-1">{invoiceCustomer.address}</ListGroup.Item>
                                            <ListGroup.Item className="px-0 py-1">Phone: {invoiceCustomer.phone}</ListGroup.Item>
                                        </ListGroup>
                                    </Col>
                                    <Col md={6}>
                                        <h5 className="h6 text-muted mb-2"><FaCar className="me-2"/>Vehicle Serviced</h5>
                                        <ListGroup variant="flush">
                                            <ListGroup.Item className="px-0 py-1 fw-medium">{invoiceVehicle.make} {invoiceVehicle.model} ({invoiceVehicle.year})</ListGroup.Item>
                                            <ListGroup.Item className="px-0 py-1">Reg. No: <Badge bg="secondary">{invoiceVehicle.carNumber}</Badge></ListGroup.Item>
                                            <ListGroup.Item className="px-0 py-1">VIN: {invoiceVehicle.vin || 'N/A'}</ListGroup.Item>
                                        </ListGroup>
                                    </Col>
                                </Row>
                            )}
                            <hr/>
                            <h5 className="h6 text-muted mb-2">Invoice Items</h5>
                            <div className="table-responsive mb-4">
                                <Table striped bordered size="sm" className="mb-0">
                                    <thead className="table-light small text-uppercase text-secondary">
                                        <tr>
                                            <th className="py-2 px-3 text-center" style={{width:'5%'}}>#</th>
                                            <th className="py-2 px-3" style={{width:'35%'}}>Description</th>
                                            <th className="py-2 px-3 text-center" style={{width:'10%'}}>Qty</th>
                                            <th className="py-2 px-3 text-end" style={{width:'12%'}}>Parts</th>
                                            <th className="py-2 px-3 text-end" style={{width:'12%'}}>Lubes</th>
                                            <th className="py-2 px-3 text-end" style={{width:'12%'}}>Labour</th>
                                            <th className="py-2 px-3 text-end fw-semibold" style={{width:'14%'}}>Line Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoiceDraft.items.map((item, index) => (
                                            <tr key={item.master_item_id || index}>
                                                <td className="px-3 text-center text-muted small">{index + 1}</td>
                                                <td className="px-3">{item.name} {item.part_no ? `(${item.part_no})` : ''}</td>
                                                <td className="px-3 text-center">{item.quantity}</td>
                                                <td className="px-3 text-end small">{formatCurrency(item.line_parts)}</td>
                                                <td className="px-3 text-end small">{formatCurrency(item.line_lubes)}</td>
                                                <td className="px-3 text-end small">{formatCurrency(item.line_labour)}</td>
                                                <td className="px-3 text-end fw-medium">{formatCurrency(item.line_total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                            <Row className="justify-content-end">
                                <Col md={7} lg={6} xl={5}>
                                    <Card body className="bg-light-subtle border-dashed invoice-totals-card">
                                        <h5 className="h6 text-muted mb-3">Summary & Totals</h5>
                                        <ListGroup variant="flush">
                                            <ListGroup.Item className="d-flex justify-content-between small text-muted py-1">
                                                <span>Total Parts Amt:</span>
                                                <span>{formatCurrency(invoiceDraft.totalParts)}</span>
                                            </ListGroup.Item>
                                            <ListGroup.Item className="d-flex justify-content-between small text-muted py-1">
                                                <span>Total Lubes Amt:</span>
                                                <span>{formatCurrency(invoiceDraft.totalLubes)}</span>
                                            </ListGroup.Item>
                                            <ListGroup.Item className="d-flex justify-content-between small text-muted pb-2 pt-1">
                                                <span>Total Labour Amt:</span>
                                                <span>{formatCurrency(invoiceDraft.totalLabour)}</span>
                                            </ListGroup.Item>
                                            <ListGroup.Item className="d-flex justify-content-between fw-semibold pt-3 pb-1 border-top">
                                                <span>Sub Total:</span>
                                                <span>{formatCurrency(invoiceDraft.subTotal)}</span>
                                            </ListGroup.Item>
                                            <ListGroup.Item className="d-flex justify-content-between align-items-center py-2">
                                                <span>Discount:</span>
                                                <InputGroup size="sm" style={{ maxWidth: '200px' }}>
                                                    <Form.Select size="sm" style={{ maxWidth: '65px' }} value={discountType} onChange={e => setDiscountType(e.target.value)} disabled={isFinalizing}>
                                                        <option value="Percent">%</option>
                                                        <option value="Fixed">Fixed</option>
                                                    </Form.Select>
                                                    <Form.Control type="number" className="text-end" min="0" step="any" value={discountValue} onChange={e => setDiscountValue(e.target.value)} disabled={isFinalizing}/>
                                                </InputGroup>
                                            </ListGroup.Item>
                                            <ListGroup.Item className="d-flex justify-content-between small text-danger py-1">
                                                <span></span>
                                                <span>- {formatCurrency(invoiceTotals.discountAmount)}</span>
                                            </ListGroup.Item>
                                            <ListGroup.Item className="d-flex justify-content-between fw-semibold pt-2 pb-1 border-top">
                                                <span>Amount Before Tax:</span>
                                                <span>{formatCurrency(invoiceTotals.taxableAmount)}</span>
                                            </ListGroup.Item>
                                            <ListGroup.Item className="d-flex justify-content-between align-items-center py-2">
                                                <span>Tax (%):</span>
                                                <InputGroup size="sm" style={{ maxWidth: '120px' }}>
                                                    <Form.Control type="number" className="text-end" min="0" step="any" value={taxRate} onChange={e => setTaxRate(e.target.value)} disabled={isFinalizing}/>
                                                    <InputGroup.Text>%</InputGroup.Text>
                                                </InputGroup>
                                            </ListGroup.Item>
                                            <ListGroup.Item className="d-flex justify-content-between small text-muted py-1">
                                                <span></span>
                                                <span>+ {formatCurrency(invoiceTotals.taxAmount)}</span>
                                            </ListGroup.Item>
                                            <ListGroup.Item className="d-flex justify-content-between fw-bold fs-5 pt-3 pb-1 border-top border-dark">
                                                <span>Grand Total:</span>
                                                <span>{formatCurrency(invoiceTotals.grandTotal)}</span>
                                            </ListGroup.Item>
                                        </ListGroup>
                                    </Card>
                                </Col>
                            </Row>
                            <div className="text-end mt-4 pt-3 border-top">
                                <Button variant="outline-secondary" size="lg" onClick={() => setInvoiceDraft(null)} disabled={isFinalizing} className="me-2">
                                    <FaTimes className="me-2" /> Cancel
                                </Button>
                                <Button variant="success" size="lg" onClick={promptFinalize} disabled={isFinalizing}>
                                    {isFinalizing
                                        ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" /> Saving...</>
                                        : <><FaCheck className="me-2" /> Finalize & Save Invoice</>
                                    }
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                )}
            </div>

            {/* Confirmation Modal */}
            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered backdrop="static">
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="h5 text-primary"><FaInfoCircle className="me-2"/> Confirm Invoice</Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-4">
                    <p className="mb-0 fs-6">Are you sure you want to finalize this invoice?</p>
                    <p className="text-muted small mt-2 mb-0">It will be saved permanently and assigned an official Invoice Number.</p>
                </Modal.Body>
                <Modal.Footer className="bg-light border-0">
                    <Button variant="outline-secondary" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={executeFinalizeInvoice}>Yes, Finalize Invoice</Button>
                </Modal.Footer>
            </Modal>

            {/* Success Modal */}
            <Modal show={showSuccessModal} onHide={handleSuccessClose} centered backdrop="static">
                <Modal.Body className="text-center py-5">
                    <div className="mb-3">
                        <div className="rounded-circle bg-success bg-opacity-10 d-inline-flex p-3">
                            <FaCheck className="text-success fs-1" />
                        </div>
                    </div>
                    <h4 className="fw-bold mb-3">Invoice Created!</h4>
                    <p className="text-muted mb-4">
                        Invoice <Badge bg="dark" className="fs-6">{createdInvoiceData?.invoice_number}</Badge> has been saved successfully.
                    </p>
                    <Button variant="success" size="lg" className="px-5" onClick={handleSuccessClose}>
                        View Invoice
                    </Button>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default CreateInvoicePage;