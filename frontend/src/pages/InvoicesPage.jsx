import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Table, Badge, Button, InputGroup, Form, Row, Col, Pagination } from 'react-bootstrap';
import { FaEye, FaSearch, FaFilter, FaReceipt, FaPrint, FaPlusCircle, FaMoneyBillWave } from 'react-icons/fa';
import {
    initialInvoices, // We read from this directly to get the freshest data
    addPaymentToInvoice,
    findCustomerById,
    findVehicleById
} from '../data/staticData';
import RecordPaymentModal from '../components/RecordPaymentModal';

const ITEMS_PER_PAGE = 10;

const InvoicesPage = () => {
    // State for UI controls and modal management
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    
    // State to force a re-render after external data is mutated
    const [dataVersion, setDataVersion] = useState(0);

    // Derive the list of invoices on every render to ensure it's always up-to-date
    const enrichedInvoices = initialInvoices.map(inv => {
        const customer = findCustomerById(inv.customerId);
        const vehicle = findVehicleById(inv.vehicleId);
        return {
            ...inv,
            customerName: customer ? customer.name : 'N/A',
            vehicleModel: vehicle ? `${vehicle.make} ${vehicle.model}` : 'N/A'
        };
    }).sort((a, b) => new Date(b.dateIssued) - new Date(a.dateIssued)); // Sort by most recent first

    // Apply filters to the fresh, enriched list
    const filteredInvoices = enrichedInvoices.filter(inv => {
        const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
        const matchesSearch = !searchTerm ||
            inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Reset page number to 1 if filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus]);

    // --- Pagination Calculations ---
    const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentInvoices = filteredInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // --- Modal Handlers ---
    const handleShowPaymentModal = (invoice) => {
        setSelectedInvoice(invoice);
        setShowPaymentModal(true);
    };

    const handleHidePaymentModal = () => {
        setSelectedInvoice(null);
        setShowPaymentModal(false);
    };

    const handleSavePayment = (invoiceId, paymentData) => {
        try {
            // This function modifies the global `initialInvoices` array in staticData.js
            addPaymentToInvoice(invoiceId, paymentData);
            
            // Trigger a re-render of this component to reflect the data change
            setDataVersion(prevVersion => prevVersion + 1);

            alert('Payment recorded successfully!');
        } catch (error) {
            alert(error.message);
        }
    };
    
    // --- Helper Functions ---
    const formatCurrency = (amount) => {
        const numericAmount = Number(amount);
        if (isNaN(numericAmount)) return '₹ 0.00';
        return numericAmount.toLocaleString('en-IN', {
            style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Paid': return <Badge bg="success">Paid</Badge>;
            case 'Partially Paid': return <Badge bg="primary">Partially Paid</Badge>;
            case 'Pending': return <Badge bg="warning" text="dark">Pending</Badge>;
            case 'Overdue': return <Badge bg="danger">Overdue</Badge>;
            default: return <Badge bg="secondary">Unknown</Badge>;
        }
    };

    const handlePrintInvoice = (invoiceId) => {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.visibility = 'hidden';
        iframe.src = `/invoice/${invoiceId}/view?print=true`;

        document.body.appendChild(iframe);

        iframe.onload = function() {
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 10000);
        };
    };

    const renderPaginationItems = () => {
        if (totalPages <= 1) return null;

        const items = [];
        const maxPagesToShow = 5;
        let startPage, endPage;

        if (totalPages <= maxPagesToShow) {
            startPage = 1; endPage = totalPages;
        } else {
            const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
            const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;
            if (currentPage <= maxPagesBeforeCurrent) {
                startPage = 1; endPage = maxPagesToShow;
            } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
                startPage = totalPages - maxPagesToShow + 1; endPage = totalPages;
            } else {
                startPage = currentPage - maxPagesBeforeCurrent; endPage = currentPage + maxPagesAfterCurrent;
            }
        }

        items.push(<Pagination.First key="first" onClick={() => handlePageChange(1)} disabled={currentPage === 1} />);
        items.push(<Pagination.Prev key="prev" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />);

        if (startPage > 1) {
             items.push(<Pagination.Item key={1} onClick={() => handlePageChange(1)}>{1}</Pagination.Item>);
             if (startPage > 2) {
                 items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
             }
        }

        for (let number = startPage; number <= endPage; number++) {
            items.push(<Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)}>{number}</Pagination.Item>);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
            }
            items.push(<Pagination.Item key={totalPages} onClick={() => handlePageChange(totalPages)}>{totalPages}</Pagination.Item>);
        }

        items.push(<Pagination.Next key="next" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />);
        items.push(<Pagination.Last key="last" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />);

        return <Pagination className="justify-content-center">{items}</Pagination>;
    };

    return (
        <Container fluid className="py-0">
            <div className="page-header-row">
                <h2 className="page-title-active mb-0">
                    <FaReceipt /> All Invoices
                </h2>
                <div className="actions">
                    <Link to="/create-invoice" className="btn btn-primary">
                        <FaPlusCircle className="me-2" /> Create New Invoice
                    </Link>
                </div>
            </div>

            <div className="main-content pt-0">
                <Card className="shadow-sm mb-4 border-light">
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={6} lg={7}>
                                <InputGroup>
                                    <InputGroup.Text><FaSearch /></InputGroup.Text>
                                    <Form.Control placeholder="Search by Invoice #, Customer, Vehicle..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </InputGroup>
                            </Col>
                            <Col md={6} lg={5}>
                                <InputGroup>
                                    <InputGroup.Text><FaFilter /></InputGroup.Text>
                                    <Form.Select aria-label="Filter by status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                        <option value="all">All Statuses</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Partially Paid">Partially Paid</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Overdue">Overdue</option>
                                    </Form.Select>
                                </InputGroup>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Card className="shadow-sm border-light">
                    <Card.Header className="bg-light fw-bold d-flex justify-content-between align-items-center">
                        <span>
                             Finalized Invoices (Showing {currentInvoices.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredInvoices.length)} of {filteredInvoices.length})
                        </span>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <div className="table-responsive">
                            <Table hover striped className="mb-0 align-middle">
                                <thead className="table-light">
                                   <tr>
                                        <th>Invoice #</th><th>Date Issued</th><th>Customer</th><th>Vehicle</th>
                                        <th className="text-end">Amount</th><th className="text-center">Status</th><th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentInvoices.length > 0 ? (
                                        currentInvoices.map(inv => (
                                            <tr key={inv.id}>
                                                <td><Link to={`/invoice/${inv.id}/view`}>{inv.invoiceNumber}</Link></td>
                                                <td>{new Date(inv.dateIssued).toLocaleDateString('en-GB')}</td>
                                                <td>{inv.customerName}</td>
                                                <td>{inv.vehicleModel}</td>
                                                <td className="text-end">{formatCurrency(inv.grandTotal)}</td>
                                                <td className="text-center">{getStatusBadge(inv.status)}</td>
                                                <td className="text-center">
                                                    <Button variant="outline-success" size="sm" className="me-1" title="Record Payment" onClick={() => handleShowPaymentModal(inv)} disabled={inv.status === 'Paid'}>
                                                        <FaMoneyBillWave />
                                                    </Button>
                                                    <Link to={`/invoice/${inv.id}/view`} className="btn btn-outline-info btn-sm me-1" title="View Invoice"><FaEye /></Link>
                                                    <Button variant="outline-secondary" size="sm" title="Print Invoice" onClick={() => handlePrintInvoice(inv.id)}><FaPrint /></Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="7" className="text-center text-muted py-4">{enrichedInvoices.length === 0 ? "No invoices have been created yet." : "No invoices found matching your criteria."}</td></tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                     {totalPages > 1 && (
                        <Card.Footer className="bg-light border-0 pt-3 pb-1">
                            {renderPaginationItems()}
                        </Card.Footer>
                     )}
                </Card>
            </div>

            {selectedInvoice && (
                <RecordPaymentModal
                    show={showPaymentModal}
                    onHide={handleHidePaymentModal}
                    invoice={selectedInvoice}
                    onSavePayment={handleSavePayment}
                />
            )}
        </Container>
    );
};

export default InvoicesPage;