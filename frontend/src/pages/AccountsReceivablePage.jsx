import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Table, Badge, Button, Row, Col, Spinner, Accordion, ButtonGroup } from 'react-bootstrap';
import { FaMoneyBillWave, FaPaperPlane, FaFileInvoiceDollar, FaUserCircle, FaListUl, FaUsers } from 'react-icons/fa';
import { initialInvoices, findCustomerById } from '../data/staticData';
import { sendPaymentReminder } from '../api/communicationAPI';
import RecordPaymentModal from '../components/RecordPaymentModal';

const formatCurrency = (amount) => Number(amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

const AccountsReceivablePage = () => {
    // UI State
    const [loadingStates, setLoadingStates] = useState({});
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [dataVersion, setDataVersion] = useState(0); // Forces re-render on data change
    const [viewMode, setViewMode] = useState('customer'); // 'customer' or 'invoice'

    // --- Data Derivation and Grouping ---
    const { customerWiseDues, allUnpaidInvoices, kpi } = useMemo(() => {
        const unpaid = initialInvoices
            .filter(inv => inv.status !== 'Paid')
            .map(inv => {
                const customer = findCustomerById(inv.customerId);
                const amountPaid = inv.paymentRecords.reduce((sum, p) => sum + p.amountPaid, 0);
                const amountDue = inv.grandTotal - amountPaid;
                return { ...inv, amountDue, amountPaid, customerName: customer?.name || 'N/A' };
            });

        // Group by customer
        const grouped = unpaid.reduce((acc, inv) => {
            acc[inv.customerId] = acc[inv.customerId] || {
                customerId: inv.customerId,
                customerName: inv.customerName,
                totalDue: 0,
                invoiceCount: 0,
                invoices: []
            };
            acc[inv.customerId].totalDue += inv.amountDue;
            acc[inv.customerId].invoiceCount++;
            acc[inv.customerId].invoices.push(inv);
            return acc;
        }, {});

        const customerArray = Object.values(grouped).sort((a, b) => b.totalDue - a.totalDue);
        const invoiceArray = unpaid.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        
        // Calculate KPIs
        const totalOutstanding = customerArray.reduce((sum, cust) => sum + cust.totalDue, 0);
        const totalOverdue = invoiceArray.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + inv.amountDue, 0);

        return {
            customerWiseDues: customerArray,
            allUnpaidInvoices: invoiceArray,
            kpi: { totalOutstanding, totalOverdue, count: invoiceArray.length }
        };
    }, [dataVersion]); // Recalculate when data changes

    // --- Action Handlers ---
    const handleSendSingleReminder = async (invoiceId) => {
        setLoadingStates(prev => ({ ...prev, [invoiceId]: true }));
        try {
            const result = await sendPaymentReminder(invoiceId);
            alert(result.message);
        } catch (error) { alert(`Error: ${error.message}`); }
        finally { setLoadingStates(prev => ({ ...prev, [invoiceId]: false })); }
    };

    const handleRemindAllForCustomer = async (customerId) => {
        const customerData = customerWiseDues.find(c => c.customerId === customerId);
        if (!customerData) return;
        
        setLoadingStates(prev => ({ ...prev, [`cust-${customerId}`]: true }));
        try {
            for (const invoice of customerData.invoices) {
                await sendPaymentReminder(invoice.id);
            }
            alert(`Sent ${customerData.invoiceCount} reminders to ${customerData.customerName}.`);
        } catch (error) { alert(`An error occurred: ${error.message}`); }
        finally { setLoadingStates(prev => ({ ...prev, [`cust-${customerId}`]: false })); }
    };

    // Modal handlers
    const handleShowPaymentModal = (invoice) => { setSelectedInvoice(invoice); setShowPaymentModal(true); };
    const handleHidePaymentModal = () => { setSelectedInvoice(null); setShowPaymentModal(false); };
    const handleSavePayment = () => { setDataVersion(v => v + 1); }; // Trigger re-render

    const CustomerWiseView = () => (
        <Accordion alwaysOpen>
            {customerWiseDues.map((customer) => (
                <Accordion.Item key={customer.customerId} eventKey={customer.customerId}>
                    <Accordion.Header as="div" bsPrefix="custom-accordion-header">
                        <div className="d-flex align-items-center">
                            <FaUserCircle size="2em" className="me-3 text-secondary" />
                            <div>
                                <strong className="d-block">{customer.customerName}</strong>
                                <small className="text-muted">{customer.invoiceCount} Unpaid Invoice(s)</small>
                            </div>
                        </div>
                        <div className="d-flex align-items-center">
                            <div className="text-end me-4">
                                <small className="d-block text-muted">Total Due</small>
                                <strong className="fs-5">{formatCurrency(customer.totalDue)}</strong>
                            </div>
                            <Button variant="outline-primary" size="sm" onClick={(e) => { e.stopPropagation(); handleRemindAllForCustomer(customer.customerId); }} disabled={loadingStates[`cust-${customer.customerId}`]}>
                                {loadingStates[`cust-${customer.customerId}`] ? <Spinner size="sm" /> : <><FaPaperPlane className="me-1"/> Remind All</>}
                            </Button>
                        </div>
                    </Accordion.Header>
                    <Accordion.Body className="p-0">
                        <Table striped hover responsive className="mb-0 inner-invoice-table">
                            <thead><tr><th>Invoice #</th><th>Due Date</th><th className="text-end">Amount Due</th><th className="text-center">Status</th><th className="text-end">Actions</th></tr></thead>
                            <tbody>
                                {customer.invoices.map(inv => (
                                    <tr key={inv.id}>
                                        <td><Link to={`/invoice/${inv.id}/view`}>{inv.invoiceNumber}</Link></td>
                                        <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                                        <td className="text-end">{formatCurrency(inv.amountDue)}</td>
                                        <td className="text-center"><Badge bg={inv.status === 'Overdue' ? 'danger' : 'warning'}>{inv.status}</Badge></td>
                                        <td className="text-end">
                                            <Button variant="link" size="sm" className="text-success p-1" title="Record Payment" onClick={() => handleShowPaymentModal(inv)}><FaMoneyBillWave size="1.2em"/></Button>
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
            ))}
        </Accordion>
    );

    const InvoiceWiseView = () => (
         <Card>
            <Card.Body className="p-0">
                <Table responsive hover>
                    <thead><tr><th>Invoice #</th><th>Customer</th><th>Due Date</th><th className="text-end">Amount Due</th><th className="text-center">Status</th><th className="text-center">Actions</th></tr></thead>
                    <tbody>
                        {allUnpaidInvoices.map(inv => (
                            <tr key={inv.id}>
                                <td><Link to={`/invoice/${inv.id}/view`}>{inv.invoiceNumber}</Link></td>
                                <td>{inv.customerName}</td>
                                <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                                <td className="text-end fw-bold">{formatCurrency(inv.amountDue)}</td>
                                <td className="text-center"><Badge bg={inv.status === 'Overdue' ? 'danger' : 'warning'}>{inv.status}</Badge></td>
                                <td className="text-center">
                                    <Button variant="outline-success" size="sm" className="me-2" title="Record Payment" onClick={() => handleShowPaymentModal(inv)}><FaMoneyBillWave /></Button>
                                    <Button variant="outline-primary" size="sm" title="Send Reminder" onClick={() => handleSendSingleReminder(inv.id)} disabled={loadingStates[inv.id]}>
                                        {loadingStates[inv.id] ? <Spinner as="span" animation="border" size="sm" /> : <FaPaperPlane />}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );

    return (
        <Container fluid className="py-0">
            <div className="page-header-row">
                <h2 className="page-title-active mb-0"><FaFileInvoiceDollar /> Accounts Receivable</h2>
                <div className="actions">
                     <ButtonGroup size="sm">
                        <Button variant={viewMode === 'customer' ? 'primary' : 'outline-secondary'} onClick={() => setViewMode('customer')}><FaUsers className="me-1"/> Customer View</Button>
                        <Button variant={viewMode === 'invoice' ? 'primary' : 'outline-secondary'} onClick={() => setViewMode('invoice')}><FaListUl className="me-1"/> Invoice View</Button>
                    </ButtonGroup>
                </div>
            </div>
            <div className="main-content pt-0">
                <Row>
                    <Col md={4}><Card body className="kpi-card mb-4"><div className="kpi-label">Total Outstanding</div><div className="kpi-value">{formatCurrency(kpi.totalOutstanding)}</div></Card></Col>
                    <Col md={4}><Card body className="kpi-card mb-4"><div className="kpi-label">Amount Overdue</div><div className="kpi-value text-danger">{formatCurrency(kpi.totalOverdue)}</div></Card></Col>
                    <Col md={4}><Card body className="kpi-card mb-4"><div className="kpi-label">Unpaid Invoices</div><div className="kpi-value">{kpi.count}</div></Card></Col>
                </Row>

                {viewMode === 'customer' ? <CustomerWiseView /> : <InvoiceWiseView />}
            </div>
            {selectedInvoice && <RecordPaymentModal show={showPaymentModal} onHide={handleHidePaymentModal} invoice={selectedInvoice} onSavePayment={handleSavePayment} />}
        </Container>
    );
};

export default AccountsReceivablePage;