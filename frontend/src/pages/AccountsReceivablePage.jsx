import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Table, Badge, Button, Row, Col, Spinner, Accordion, ButtonGroup, Alert } from 'react-bootstrap';
import { FaMoneyBillWave, FaPaperPlane, FaFileInvoiceDollar, FaUserCircle, FaListUl, FaUsers, FaInfoCircle } from 'react-icons/fa';
import api from '../api/api';
import RecordPaymentModal from '../components/RecordPaymentModal';

// --- Formatter Helpers ---
const formatCurrency = (amount) => Number(amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : d.toLocaleDateString('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
};

const AccountsReceivablePage = () => {
    // --- Data & UI State ---
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [actionMessage, setActionMessage] = useState(null); 

    const [loadingStates, setLoadingStates] = useState({});
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [dataVersion, setDataVersion] = useState(0); 
    const [viewMode, setViewMode] = useState('customer'); 

    // --- API Data Fetching ---
    const fetchInvoices = useCallback(async () => {
        setIsLoading(true);
        setFetchError('');
        try {
            const response = await api.get('/invoices');
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to fetch invoice data.');
            }
            const data = await response.json();
            setInvoices(data.invoices || data || []);
        } catch (err) {
            console.error('Error fetching accounts receivable:', err);
            setFetchError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices, dataVersion]);


    // --- Data Derivation and Grouping ---
    const { customerWiseDues, allUnpaidInvoices, kpi } = useMemo(() => {
        const unpaid = invoices
            .filter(inv => inv.status !== 'Paid' && inv.status !== 'Cancelled')
            .map(inv => {
                const grandTotal = parseFloat(inv.grand_total || inv.grandTotal || 0);
                
                // 👉 THE FIX: Aggressively check for total_paid from SQL SUM() functions
                let amountPaid = parseFloat(inv.total_paid || inv.totalPaid || inv.amount_paid || inv.amountPaid || 0);
                
                // If it happens to return a nested array (like the modal fetch does)
                if (inv.paymentRecords && Array.isArray(inv.paymentRecords)) {
                    amountPaid = inv.paymentRecords.reduce((sum, p) => sum + parseFloat(p.amountPaid || p.amount_paid || 0), 0);
                } else if (inv.payment_records && Array.isArray(inv.payment_records)) {
                    amountPaid = inv.payment_records.reduce((sum, p) => sum + parseFloat(p.amountPaid || p.amount_paid || 0), 0);
                }
                
                // Calculate real Amount Due
                const amountDue = Math.max(0, grandTotal - amountPaid);
                
                let currentStatus = inv.status;
                const isPastDue = new Date(inv.due_date || inv.dueDate) < new Date();
                if (currentStatus !== 'Partially Paid' && isPastDue) {
                    currentStatus = 'Overdue';
                }

                return { 
                    ...inv, 
                    id: inv.id,
                    invoiceNumber: inv.invoice_number || inv.invoiceNumber,
                    dueDate: inv.due_date || inv.dueDate,
                    customerId: inv.customer_id || inv.customerId || 'unknown',
                    customerName: inv.customer_name || inv.customerName || 'Unknown Customer',
                    status: currentStatus,
                    amountDue, 
                    amountPaid 
                };
            })
            // Only keep invoices that actually have a pending balance
            .filter(inv => inv.amountDue > 0);

        // Group by customer ID
        const grouped = unpaid.reduce((acc, inv) => {
            if (!acc[inv.customerId]) {
                acc[inv.customerId] = {
                    customerId: inv.customerId,
                    customerName: inv.customerName,
                    totalDue: 0,
                    invoiceCount: 0,
                    invoices: []
                };
            }
            acc[inv.customerId].totalDue += inv.amountDue;
            acc[inv.customerId].invoiceCount++;
            acc[inv.customerId].invoices.push(inv);
            return acc;
        }, {});

        const customerArray = Object.values(grouped).sort((a, b) => b.totalDue - a.totalDue);
        const invoiceArray = unpaid.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        
        const totalOutstanding = customerArray.reduce((sum, cust) => sum + cust.totalDue, 0);
        const totalOverdue = invoiceArray.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + inv.amountDue, 0);

        return {
            customerWiseDues: customerArray,
            allUnpaidInvoices: invoiceArray,
            kpi: { totalOutstanding, totalOverdue, count: invoiceArray.length }
        };
    }, [invoices]); 


    // --- Action Handlers ---
    const sendReminderAPI = async (invoiceId) => {
        const response = await api.post(`/invoices/${invoiceId}/remind`);
        if (!response.ok) throw new Error('Failed to send reminder');
        return await response.json();
    };

    const handleSendSingleReminder = async (invoiceId) => {
        setLoadingStates(prev => ({ ...prev, [invoiceId]: true }));
        try {
            await sendReminderAPI(invoiceId);
            setActionMessage({ type: 'success', text: `Reminder sent successfully for Invoice #${invoiceId}.` });
        } catch (error) { 
            setActionMessage({ type: 'danger', text: `Reminder failed: ${error.message}` });
        } finally { 
            setLoadingStates(prev => ({ ...prev, [invoiceId]: false })); 
        }
    };

    const handleRemindAllForCustomer = async (customerId, customerName) => {
        const customerData = customerWiseDues.find(c => c.customerId === customerId);
        if (!customerData) return;
        
        setLoadingStates(prev => ({ ...prev, [`cust-${customerId}`]: true }));
        try {
            let successCount = 0;
            for (const invoice of customerData.invoices) {
                try {
                    await sendReminderAPI(invoice.id);
                    successCount++;
                } catch (e) {
                    console.error(`Failed to remind for invoice ${invoice.id}`);
                }
            }
            setActionMessage({ type: 'success', text: `Sent ${successCount} reminders to ${customerName}.` });
        } catch (error) { 
            setActionMessage({ type: 'danger', text: `An error occurred: ${error.message}` });
        } finally { 
            setLoadingStates(prev => ({ ...prev, [`cust-${customerId}`]: false })); 
        }
    };

    // Modal handlers
    const handleShowPaymentModal = (invoice) => { 
        setSelectedInvoice(invoice); 
        setShowPaymentModal(true); 
    };
    const handleHidePaymentModal = () => { 
        setSelectedInvoice(null); 
        setShowPaymentModal(false); 
    };
    const handleSavePayment = () => { 
        setDataVersion(v => v + 1); // Triggers background re-fetch and updates amounts!
    }; 


    // --- Sub-Components ---
    const CustomerWiseView = () => (
        <Accordion alwaysOpen>
            {customerWiseDues.length === 0 ? (
                <div className="text-center p-5 text-muted bg-light border rounded">
                    <FaInfoCircle size="2em" className="mb-3 text-secondary"/>
                    <h5>No Outstanding Customer Balances</h5>
                    <p>All customers are fully paid up!</p>
                </div>
            ) : (
                customerWiseDues.map((customer) => (
                    <Accordion.Item key={customer.customerId} eventKey={customer.customerId}>
                        <Accordion.Header as="div" bsPrefix="custom-accordion-header">
                            {/* Improved Header Alignment */}
                            <div className="d-flex w-100 justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                    <FaUserCircle size="2em" className="me-3 text-secondary" />
                                    <div>
                                        <strong className="d-block mb-1">{customer.customerName}</strong>
                                        <small className="text-muted">{customer.invoiceCount} Unpaid Invoice(s)</small>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center">
                                    <div className="text-end me-4">
                                        <small className="d-block text-muted mb-1">Total Due</small>
                                        <strong className="fs-5 text-primary">{formatCurrency(customer.totalDue)}</strong>
                                    </div>
                                    <Button variant="outline-primary" size="sm" onClick={(e) => { e.stopPropagation(); handleRemindAllForCustomer(customer.customerId, customer.customerName); }} disabled={loadingStates[`cust-${customer.customerId}`]}>
                                        {loadingStates[`cust-${customer.customerId}`] ? <Spinner size="sm" /> : <><FaPaperPlane className="me-1"/> Remind All</>}
                                    </Button>
                                </div>
                            </div>
                        </Accordion.Header>
                        <Accordion.Body className="p-0">
                            <Table striped hover responsive className="mb-0 inner-invoice-table">
                                <thead><tr><th>Invoice #</th><th>Due Date</th><th className="text-end">Amount Due</th><th className="text-center">Status</th><th className="text-end">Actions</th></tr></thead>
                                <tbody>
                                    {customer.invoices.map(inv => (
                                        <tr key={inv.id}>
                                            <td><Link to={`/invoices/${inv.id}/view`}>{inv.invoiceNumber}</Link></td>
                                            <td>{formatDate(inv.dueDate)}</td>
                                            <td className="text-end fw-medium">{formatCurrency(inv.amountDue)}</td>
                                            <td className="text-center"><Badge bg={inv.status === 'Overdue' ? 'danger' : 'warning'} text={inv.status === 'Overdue' ? 'white' : 'dark'}>{inv.status}</Badge></td>
                                            <td className="text-end">
                                                <Button variant="link" size="sm" className="text-success p-1 me-2" title="Record Payment" onClick={() => handleShowPaymentModal(inv)}><FaMoneyBillWave size="1.2em"/></Button>
                                                <Button variant="link" size="sm" className="text-primary p-1" title="Send Reminder" onClick={() => handleSendSingleReminder(inv.id)} disabled={loadingStates[inv.id]}>
                                                    {loadingStates[inv.id] ? <Spinner size="sm" /> : <FaPaperPlane size="1.1em"/>}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Accordion.Body>
                    </Accordion.Item>
                ))
            )}
        </Accordion>
    );

    const InvoiceWiseView = () => (
         <Card className="border-light shadow-sm">
            <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                    <thead className="table-light"><tr><th>Invoice #</th><th>Customer</th><th>Due Date</th><th className="text-end">Amount Due</th><th className="text-center">Status</th><th className="text-center">Actions</th></tr></thead>
                    <tbody>
                        {allUnpaidInvoices.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-5 text-muted"><FaInfoCircle className="me-2"/> No pending invoices found.</td></tr>
                        ) : (
                            allUnpaidInvoices.map(inv => (
                                <tr key={inv.id}>
                                    <td className="fw-medium"><Link to={`/invoices/${inv.id}/view`}>{inv.invoiceNumber}</Link></td>
                                    <td>{inv.customerName}</td>
                                    <td>{formatDate(inv.dueDate)}</td>
                                    <td className="text-end fw-bold">{formatCurrency(inv.amountDue)}</td>
                                    <td className="text-center"><Badge bg={inv.status === 'Overdue' ? 'danger' : 'warning'} text={inv.status === 'Overdue' ? 'white' : 'dark'}>{inv.status}</Badge></td>
                                    <td className="text-center">
                                        <Button variant="outline-success" size="sm" className="me-2" title="Record Payment" onClick={() => handleShowPaymentModal(inv)}><FaMoneyBillWave /></Button>
                                        <Button variant="outline-primary" size="sm" title="Send Reminder" onClick={() => handleSendSingleReminder(inv.id)} disabled={loadingStates[inv.id]}>
                                            {loadingStates[inv.id] ? <Spinner as="span" animation="border" size="sm" /> : <FaPaperPlane />}
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );

    // --- Main Render ---
    if (isLoading && invoices.length === 0) {
        return (
            <Container fluid className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="text-muted mt-3">Loading outstanding balances...</p>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4">
            <div className="page-header-row mb-4 d-flex justify-content-between align-items-center">
                <h2 className="page-title-active mb-0"><FaFileInvoiceDollar className="me-2"/> Accounts Receivable</h2>
                <div className="actions">
                     <ButtonGroup size="sm">
                        <Button variant={viewMode === 'customer' ? 'primary' : 'outline-secondary'} onClick={() => setViewMode('customer')}><FaUsers className="me-1"/> Customer View</Button>
                        <Button variant={viewMode === 'invoice' ? 'primary' : 'outline-secondary'} onClick={() => setViewMode('invoice')}><FaListUl className="me-1"/> Invoice View</Button>
                    </ButtonGroup>
                </div>
            </div>

            <div className="main-content pt-0">
                {fetchError && <Alert variant="danger" onClose={() => setFetchError('')} dismissible>{fetchError}</Alert>}
                {actionMessage && <Alert variant={actionMessage.type} onClose={() => setActionMessage(null)} dismissible>{actionMessage.text}</Alert>}

                <Row className="mb-4">
                    <Col md={4}>
                        <Card body className="kpi-card shadow-sm border-0 bg-primary bg-opacity-10 text-primary">
                            <div className="kpi-label fw-semibold text-uppercase small tracking-wide">Total Outstanding</div>
                            <div className="kpi-value fs-3 fw-bold">{formatCurrency(kpi.totalOutstanding)}</div>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card body className="kpi-card shadow-sm border-0 bg-danger bg-opacity-10 text-danger">
                            <div className="kpi-label fw-semibold text-uppercase small tracking-wide">Amount Overdue</div>
                            <div className="kpi-value fs-3 fw-bold">{formatCurrency(kpi.totalOverdue)}</div>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card body className="kpi-card shadow-sm border-0 bg-warning bg-opacity-10 text-dark">
                            <div className="kpi-label fw-semibold text-uppercase small tracking-wide">Unpaid Invoices</div>
                            <div className="kpi-value fs-3 fw-bold">{kpi.count}</div>
                        </Card>
                    </Col>
                </Row>

                {viewMode === 'customer' ? <CustomerWiseView /> : <InvoiceWiseView />}
            </div>

            {selectedInvoice && (
                <RecordPaymentModal 
                    key={selectedInvoice.id} 
                    show={showPaymentModal} 
                    onHide={handleHidePaymentModal} 
                    invoice={selectedInvoice} 
                    onPaymentActionSuccess={handleSavePayment} 
                />
            )}
        </Container>
    );
};

export default AccountsReceivablePage;