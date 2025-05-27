import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Form, InputGroup, Alert, Badge, Spinner, ListGroup } from 'react-bootstrap'; // Added Spinner, ListGroup
import {
    FaFileInvoiceDollar, FaCheck, FaTimes, FaPercentage, FaRupeeSign, FaUser, FaCar, FaPlus, FaInfoCircle // Added more icons
} from 'react-icons/fa';
import {
    initialJobSheets,
    findJobSheetById,
    addInvoice,
    findCustomerById, // Need this to display details
    findVehicleById   // Need this to display details
} from '../data/staticData'; // Import data and helpers

// Helper to format currency (keep as is)
const formatCurrency = (amount) => amount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }) || '₹ 0.00';

// --- Custom CSS (Optional - Add to App.css) ---
/*
.invoice-totals-card .list-group-item {
    border-left: 0;
    border-right: 0;
    padding-left: 0;
    padding-right: 0;
}
.invoice-totals-card .list-group-item:first-child {
    border-top: 0;
}
.invoice-totals-card .list-group-item:last-child {
    border-bottom: 0;
}

.invoice-totals-card .input-group-sm .form-control,
.invoice-totals-card .input-group-sm .form-select {
    // Fine-tune input size if needed for alignment
}

.job-sheet-selection-table th {
    background-color: var(--bs-light-bg-subtle) !important;
    font-weight: 600;
}
*/

const CreateInvoicePage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [readyJobSheets, setReadyJobSheets] = useState([]);
    const [invoiceDraft, setInvoiceDraft] = useState(null);
    // Store fetched details for the draft
    const [invoiceCustomer, setInvoiceCustomer] = useState(null);
    const [invoiceVehicle, setInvoiceVehicle] = useState(null);

    const [discountType, setDiscountType] = useState('Percent');
    const [discountValue, setDiscountValue] = useState(0);
    const [taxRate, setTaxRate] = useState(18);
    const [error, setError] = useState('');
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [isLoadingSheets, setIsLoadingSheets] = useState(true); // Loading state for sheets

    // --- Load Data ---
    useEffect(() => {
        setIsLoadingSheets(true);
        // Simulate fetching sheets
        setTimeout(() => {
            try {
                // Filter the main 'DB' array for active statuses
                const completedSheets = initialJobSheets.filter(
                    js => js.status === 'Completed'
                );

                // --- Enhancement: Pre-fetch or include customer/vehicle names for display ---
                // In a real app, your API might return this directly. Here we simulate joining.
                const sheetsWithDetails = completedSheets.map(js => {
                    const customer = findCustomerById(js.customerId);
                    const vehicle = findVehicleById(js.vehicleId);
                    return {
                        ...js,
                        customerNameDisplay: customer?.name || 'N/A',
                        vehicleModelDisplay: `${vehicle?.make || ''} ${vehicle?.model || ''}`.trim() || 'N/A',
                    };
                });
                setReadyJobSheets(sheetsWithDetails);

            } catch (err) {
                console.error("Error loading job sheets for invoicing:", err);
                setError("Failed to load completed job sheets.");
            } finally {
                setIsLoadingSheets(false);
            }
        }, 300); // Simulate network delay

    }, []); // Run once on mount

    // --- Effect to handle passed state from JobSheetDetail ---
     useEffect(() => {
        if (location.state?.finalizedJobSheet) {
            const jobSheetData = location.state.finalizedJobSheet;
            console.log("Received finalized job sheet for invoicing:", jobSheetData);
            handleCreateDraft(jobSheetData); // Create draft immediately
             // Clear state after processing to prevent re-triggering
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]); // Dependencies


    // --- Create Draft Function (Enhanced to fetch details) ---
    const handleCreateDraft = (jobSheet) => {
        if (!jobSheet) return;

        // Fetch full customer/vehicle details for the draft display
        const customer = findCustomerById(jobSheet.customerId);
        const vehicle = findVehicleById(jobSheet.vehicleId);
        setInvoiceCustomer(customer);
        setInvoiceVehicle(vehicle);

        const draft = {
            jobSheetId: jobSheet.id,
            jobSheetNumber: jobSheet.jobSheetNumber,
            customerId: jobSheet.customerId,
            vehicleId: jobSheet.vehicleId,
            dateIssued: new Date().toISOString().split('T')[0],
            items: JSON.parse(JSON.stringify(jobSheet.items || [])),
            totalParts: jobSheet.totalParts || 0,
            totalLubes: jobSheet.totalLubes || 0,
            totalLabour: jobSheet.totalLabour || 0,
            subTotal: jobSheet.grandTotal || 0,
            // Reset discount/tax for new draft
            discountType: 'Percent',
            discountValue: 0,
            taxRate: 18,
        };
        setInvoiceDraft(draft);
        setDiscountType('Percent'); // Explicitly reset state too
        setDiscountValue(0);
        setTaxRate(18);
        setError('');
        window.scrollTo(0, 0);
    };

    // --- Calculations for Invoice (Keep logic, variable names improved) ---
    const invoiceTotals = useMemo(() => {
        if (!invoiceDraft) return null;

        const subtotal = invoiceDraft.subTotal;
        let calculatedDiscountAmount = 0;
        const currentDiscountValue = parseFloat(discountValue) || 0;
        const currentTaxRatePercent = (parseFloat(taxRate) || 0); // Tax rate as percentage e.g. 18

        if (discountType === 'Percent' && currentDiscountValue > 0) {
            calculatedDiscountAmount = subtotal * (currentDiscountValue / 100);
        } else if (discountType === 'Fixed' && currentDiscountValue > 0) {
            calculatedDiscountAmount = currentDiscountValue;
        }
        calculatedDiscountAmount = Math.max(0, calculatedDiscountAmount); // No negative discounts

        const amountBeforeTax = subtotal - calculatedDiscountAmount;
        const calculatedTaxAmount = amountBeforeTax * (currentTaxRatePercent / 100);
        const calculatedGrandTotal = amountBeforeTax + calculatedTaxAmount;

        return {
            discountAmount: calculatedDiscountAmount,
            taxableAmount: amountBeforeTax, // Renamed for clarity
            taxAmount: calculatedTaxAmount,
            grandTotal: calculatedGrandTotal
        };

    }, [invoiceDraft, discountType, discountValue, taxRate]);

    // --- Finalize Invoice (Keep logic) ---
    const handleFinalizeInvoice = () => {
        if (!invoiceDraft || !invoiceTotals) return;
        if (window.confirm("Finalize this Invoice? It will be saved and assigned an Invoice Number.")) {
            setIsFinalizing(true);
            const finalInvoiceData = {
                ...invoiceDraft,
                invoiceNumber: `INV-${String(Date.now()).slice(-7)}`, // Slightly more unique?
                discountType: discountType, // Save the selected type
                discountValue: parseFloat(discountValue) || 0, // Save the raw value entered
                taxRate: parseFloat(taxRate) || 0, // Save the raw rate entered
                // Save calculated amounts
                discountAmount: invoiceTotals.discountAmount,
                amountBeforeTax: invoiceTotals.taxableAmount,
                taxAmount: invoiceTotals.taxAmount,
                grandTotal: invoiceTotals.grandTotal,
                status: 'Generated', // Or 'Unpaid' or 'Finalized'
            };
            setTimeout(() => {
                try {
                    const savedInvoice = addInvoice(finalInvoiceData); // Add to static data, updates Job Sheet status
                    setIsFinalizing(false);
                    alert(`Invoice ${savedInvoice.invoiceNumber} Created Successfully!`);
                    navigate(`/invoice/${savedInvoice.id}/view`); // Navigate to view the created invoice
                } catch (err) {
                    console.error("Error saving invoice:", err);
                    setError("Failed to save the invoice. Please try again.");
                    setIsFinalizing(false);
                }
            }, 500);
        }
    };


    return (
        <Container fluid className="py-4 px-lg-5">
            {/* Page Header */}
            <div className="d-flex align-items-center mb-4">
                 <FaFileInvoiceDollar className="me-2 text-primary" size="1.8em" />
                 <h1 className="h3 fw-bold text-dark mb-0">Create Invoice</h1>
            </div>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            {/* ========================= Section to select Job Sheet ========================= */}
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
                                                     <td className="px-3 fw-medium">{js.jobSheetNumber}</td>
                                                     <td className="px-3">{js.customerNameDisplay}</td>
                                                     <td className="px-3">{js.vehicleModelDisplay} ({js.vehicleNumber})</td>
                                                     <td className="px-3">{js.dateCompleted ? new Date(js.dateCompleted).toLocaleDateString() : 'N/A'}</td>
                                                     <td className="px-3 text-end">{formatCurrency(js.grandTotal)}</td>
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

            {/* ========================= Invoice Draft Section ========================= */}
            {invoiceDraft && invoiceTotals && invoiceCustomer && invoiceVehicle && (
               <Card className="shadow-sm border-primary">
                    <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                        <span className="fw-semibold">Invoice Draft (Based on Job Sheet: {invoiceDraft.jobSheetNumber})</span>
                        <Button variant="outline-light" size="sm" onClick={() => setInvoiceDraft(null)} title="Cancel Draft Creation">
                            <FaTimes className="me-1" /> Cancel Draft
                        </Button>
                    </Card.Header>
                   <Card.Body className="p-4">
                        {/* --- Customer & Vehicle Info --- */}
                        <Row className="mb-4">
                            <Col md={6} className="mb-3 mb-md-0">
                                <h5 className="h6 text-muted mb-2"><FaUser className="me-2"/>Bill To</h5>
                                <ListGroup variant="flush">
                                    <ListGroup.Item className="px-0 py-1 fw-medium">{invoiceCustomer.name}</ListGroup.Item>
                                    <ListGroup.Item className="px-0 py-1">{invoiceCustomer.address}, {invoiceCustomer.city}</ListGroup.Item>
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
                        <hr/>

                        {/* --- Items Table --- */}
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
                                        <tr key={item.masterItemId || index}>
                                            <td className="px-3 text-center text-muted small">{index + 1}</td>
                                            <td className="px-3">{item.name} {item.partNo ? `(${item.partNo})` : ''}</td>
                                            <td className="px-3 text-center">{item.quantity}</td>
                                            <td className="px-3 text-end small">{formatCurrency(item.lineParts)}</td>
                                            <td className="px-3 text-end small">{formatCurrency(item.lineLubes)}</td>
                                            <td className="px-3 text-end small">{formatCurrency(item.lineLabour)}</td>
                                            <td className="px-3 text-end fw-medium">{formatCurrency(item.lineTotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                         </div>


                         {/* --- Totals & Adjustments Section --- */}
                         <Row className="justify-content-end">
                             <Col md={7} lg={6} xl={5}>
                                 <Card body className="bg-light-subtle border-dashed invoice-totals-card">
                                     <h5 className="h6 text-muted mb-3">Summary & Totals</h5>
                                     <ListGroup variant="flush">
                                         {/* Item Totals Breakdown */}
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

                                         {/* Sub Total */}
                                         <ListGroup.Item className="d-flex justify-content-between fw-semibold pt-3 pb-1 border-top">
                                             <span>Sub Total:</span>
                                             <span>{formatCurrency(invoiceDraft.subTotal)}</span>
                                         </ListGroup.Item>

                                         {/* Discount Input */}
                                         <ListGroup.Item className="d-flex justify-content-between align-items-center py-2">
                                             <span>Discount:</span>
                                             <InputGroup size="sm" style={{ maxWidth: '200px' }}>
                                                 <Form.Select size="sm" style={{ maxWidth: '65px' }} value={discountType} onChange={e => setDiscountType(e.target.value)} disabled={isFinalizing}>
                                                     <option value="Percent">%</option>
                                                     <option value="Fixed">₹</option>
                                                 </Form.Select>
                                                 <Form.Control type="number" className="text-end" min="0" step="any" value={discountValue} onChange={e => setDiscountValue(e.target.value)} disabled={isFinalizing}/>
                                             </InputGroup>
                                         </ListGroup.Item>
                                         {/* Display Calculated Discount */}
                                         <ListGroup.Item className="d-flex justify-content-between small text-danger py-1">
                                              <span></span> {/* Spacer */}
                                              <span>- {formatCurrency(invoiceTotals.discountAmount)}</span>
                                         </ListGroup.Item>


                                         {/* Taxable Amount */}
                                         <ListGroup.Item className="d-flex justify-content-between fw-semibold pt-2 pb-1 border-top">
                                             <span>Amount Before Tax:</span>
                                             <span>{formatCurrency(invoiceTotals.taxableAmount)}</span>
                                         </ListGroup.Item>

                                         {/* Tax Input */}
                                         <ListGroup.Item className="d-flex justify-content-between align-items-center py-2">
                                             <span>Tax (%):</span>
                                              <InputGroup size="sm" style={{ maxWidth: '120px' }}>
                                                  <Form.Control type="number" className="text-end" min="0" step="any" value={taxRate} onChange={e => setTaxRate(e.target.value)} disabled={isFinalizing}/>
                                                  <InputGroup.Text>%</InputGroup.Text>
                                              </InputGroup>
                                         </ListGroup.Item>
                                          {/* Display Calculated Tax */}
                                         <ListGroup.Item className="d-flex justify-content-between small text-muted py-1">
                                             <span></span> {/* Spacer */}
                                             <span>+ {formatCurrency(invoiceTotals.taxAmount)}</span>
                                         </ListGroup.Item>

                                         {/* Grand Total Row */}
                                         <ListGroup.Item className="d-flex justify-content-between fw-bold fs-5 pt-3 pb-1 border-top border-dark">
                                             <span>Grand Total:</span>
                                             <span>{formatCurrency(invoiceTotals.grandTotal)}</span>
                                         </ListGroup.Item>
                                     </ListGroup>
                                 </Card>
                             </Col>
                         </Row>

                         {/* --- Finalize Button --- */}
                         <div className="text-end mt-4 pt-3 border-top">
                             <Button variant="success" size="lg" onClick={handleFinalizeInvoice} disabled={isFinalizing}>
                                  {isFinalizing
                                      ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" /> Saving Invoice...</>
                                      : <><FaCheck className="me-2" /> Finalize & Save Invoice</>
                                  }
                             </Button>
                         </div>
                    </Card.Body>
               </Card>
            )}

        </Container>
    );
};
export default CreateInvoicePage;