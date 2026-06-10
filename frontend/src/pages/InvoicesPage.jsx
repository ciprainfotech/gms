import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Table, Badge, Button, InputGroup, Form, Row, Col, Pagination, Alert, Spinner, Modal } from 'react-bootstrap';
import { FaEye, FaSearch, FaFilter, FaReceipt, FaPrint, FaPlusCircle, FaMoneyBillWave, FaTrash, FaExclamationTriangle, FaCalendarAlt, FaCheck } from 'react-icons/fa';
import api from '../api/api';
import RecordPaymentModal from '../components/RecordPaymentModal';

const ITEMS_PER_PAGE = 10;

const InvoicesPage = () => {
    // 1. Data States
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');

    // 2. UI & Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    
    // 3. Payment Modal States
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // 4. Delete States
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [showSingleModal, setShowSingleModal] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);

    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
    const [bulkStartDate, setBulkStartDate] = useState('');
    const [bulkEndDate, setBulkEndDate] = useState('');

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // --- Data Fetching ---
    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        setFetchError('');
        try {
            const response = await api.get('/invoices');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch invoices: ${response.status}`);
            }
            const data = await response.json();
            const sortedInvoices = data.invoices.sort((a, b) => new Date(b.date_issued) - new Date(a.date_issued));
            setInvoices(sortedInvoices);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            setFetchError(error.message || 'An unexpected error occurred while fetching invoices.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    // --- Filtering & Pagination ---
    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
            const matchesSearch = !searchTerm ||
                inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                `${inv.vehicle_make} ${inv.vehicle_model}`.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [invoices, searchTerm, filterStatus]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus]);

    const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentInvoices = filteredInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    // --- Payment Handlers ---
    const handleShowPaymentModal = (invoice) => {
        setSelectedInvoice(invoice); 
        setShowPaymentModal(true);
    };

    const handleHidePaymentModal = () => {
        setSelectedInvoice(null);
        setShowPaymentModal(false);
    };

    const handlePaymentActionSuccess = (actionType, updatedInvoice) => {
        setInvoices(prevInvoices => {
            const newInvoices = prevInvoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv);
            return newInvoices.sort((a, b) => new Date(b.date_issued) - new Date(a.date_issued));
        });
        setSelectedInvoice(updatedInvoice); 
        setShowPaymentModal(false);
    };

    // --- Single Delete Handlers ---
    const promptSingleDelete = (invoice) => {
        setInvoiceToDelete(invoice);
        setShowSingleModal(true); // Opens the confirmation modal
    };

    const executeSingleDelete = async () => {
        if (!invoiceToDelete) return;
        setIsDeleting(true);
        setFetchError('');
        try {
            const response = await api.delete(`/invoices/${invoiceToDelete.id}`);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to delete invoice.');
            }
            // Remove from table instantly
            setInvoices(prev => prev.filter(inv => inv.id !== invoiceToDelete.id));
            
            // Set success message and swap modals
            setSuccessMessage(`Invoice ${invoiceToDelete.invoice_number} has been permanently deleted.`);
            setShowSingleModal(false);
            setShowSuccessModal(true);
            
            // Clear the selected invoice
            setInvoiceToDelete(null);
        } catch (err) {
            console.error('Error deleting single invoice:', err);
            setFetchError(`Delete Failed: ${err.message}`);
            setShowSingleModal(false);
        } finally {
            setIsDeleting(false);
        }
    };

    // --- Bulk Delete Handlers ---
    
    // 1. Opens the SECOND confirmation modal
    const promptBulkConfirm = () => {
        if (!bulkStartDate || !bulkEndDate) return;
        setShowBulkModal(false); // Hide the date picker modal
        setShowBulkConfirmModal(true); // Show the final warning modal
    };

    // 2. The actual API Call
    const executeBulkDelete = async () => {
        if (!bulkStartDate || !bulkEndDate) return;
        setIsDeleting(true);
        setFetchError('');
        try {
            const response = await api.post('/invoices/bulk-delete', { 
                startDate: bulkStartDate, 
                endDate: bulkEndDate 
            });
            
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to bulk delete invoices.');
            }
            
            await fetchInvoices();
            
            setSuccessMessage(`Invoices between ${new Date(bulkStartDate).toLocaleDateString()} and ${new Date(bulkEndDate).toLocaleDateString()} have been permanently wiped.`);
            setShowBulkConfirmModal(false); // Close the final warning modal
            setShowSuccessModal(true);
            
            setBulkStartDate('');
            setBulkEndDate('');
        } catch (err) {
            console.error('Error bulk deleting invoices:', err);
            setFetchError(`Bulk Delete Failed: ${err.message}`);
            setShowBulkConfirmModal(false);
        } finally {
            setIsDeleting(false);
        }
    };

    // --- Formatting Helpers ---
    const formatCurrency = (amount) => {
        const numericAmount = Number(amount) || 0;
        return numericAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
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
        }); // Forces DD/MM/YYYY
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
        iframe.style.position = 'absolute'; iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0'; iframe.style.visibility = 'hidden';
        iframe.src = `/invoice/${invoiceId}/view?print=true`;
        document.body.appendChild(iframe);
        iframe.onload = function() { setTimeout(() => { document.body.removeChild(iframe); }, 10000); };
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
             if (startPage > 2) items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
        }

        for (let number = startPage; number <= endPage; number++) {
            items.push(<Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)}>{number}</Pagination.Item>);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
            items.push(<Pagination.Item key={totalPages} onClick={() => handlePageChange(totalPages)}>{totalPages}</Pagination.Item>);
        }

        items.push(<Pagination.Next key="next" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />);
        items.push(<Pagination.Last key="last" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />);

        return <Pagination className="justify-content-center">{items}</Pagination>;
    };

    return (
        <Container fluid className="py-4"> 
            <div className="page-header-row mb-4 d-flex justify-content-between align-items-center">
                <h2 className="page-title-active mb-0">
                    <FaReceipt className="me-2"/> All Invoices
                </h2>
                <div className="actions d-flex gap-2">
                    <Button variant="outline-danger" type="button" onClick={() => setShowBulkModal(true)}>
                        <FaTrash className="me-2" /> Bulk Delete
                    </Button>
                    <Link to="/create-invoice" className="btn btn-primary">
                        <FaPlusCircle className="me-2" /> Create New
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
                                    <Form.Control placeholder="Search by Invoice #, Customer, Vehicle..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={loading}/>
                                </InputGroup>
                            </Col>
                            <Col md={6} lg={5}>
                                <InputGroup>
                                    <InputGroup.Text><FaFilter /></InputGroup.Text>
                                    <Form.Select aria-label="Filter by status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} disabled={loading}>
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
                    <Card.Header className="bg-light fw-bold">
                        Finalized Invoices ({loading ? 'Loading...' : `Showing ${currentInvoices.length > 0 ? startIndex + 1 : 0} - ${Math.min(startIndex + ITEMS_PER_PAGE, filteredInvoices.length)} of ${filteredInvoices.length}`})
                    </Card.Header>
                    {fetchError && (
                        <Alert variant="danger" className="m-3 mb-0 shadow-sm" onClose={() => setFetchError('')} dismissible>
                            {fetchError}
                        </Alert>
                    )}
                    <Card.Body className="p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <Spinner animation="border" role="status"><span className="visually-hidden">Loading invoices...</span></Spinner>
                                <p className="mt-2 text-muted">Loading invoices...</p>
                            </div>
                        ) : (
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
                                                    <td className="fw-medium"><Link to={`/invoices/${inv.id}/view`}>{inv.invoice_number}</Link></td>
                                                    <td>{formatDate(inv.date_issued)}</td>
                                                    <td>{inv.customer_name}</td>
                                                    <td>{`${inv.vehicle_make} ${inv.vehicle_model}`}</td>
                                                    <td className="text-end fw-medium">{formatCurrency(inv.grand_total)}</td>
                                                    <td className="text-center">{getStatusBadge(inv.status)}</td>
                                                    <td className="text-center">
                                                        <div className="d-flex justify-content-center gap-1">
                                                            <Button variant="outline-success" size="sm" type="button" title="Record Payment" onClick={() => handleShowPaymentModal(inv)}><FaMoneyBillWave /></Button>
                                                            <Link to={`/invoices/${inv.id}/view`} className="btn btn-outline-info btn-sm" title="View Invoice"><FaEye /></Link>
                                                            <Button variant="outline-secondary" size="sm" type="button" title="Print Invoice" onClick={() => handlePrintInvoice(inv.id)}><FaPrint /></Button>
                                                            <Button variant="outline-danger" size="sm" type="button" title="Delete Invoice" onClick={() => promptSingleDelete(inv)}><FaTrash /></Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="7" className="text-center text-muted py-4">{invoices.length === 0 ? "No invoices have been created yet." : "No invoices found matching your criteria."}</td></tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </Card.Body>
                     {totalPages > 1 && !loading && (
                        <Card.Footer className="bg-light border-0 pt-3 pb-1">
                            {renderPaginationItems()}
                        </Card.Footer>
                     )}
                </Card>
            </div>

            {/* ========================== MODALS ========================== */}

            {selectedInvoice && (
                <RecordPaymentModal key={selectedInvoice.id} show={showPaymentModal} onHide={handleHidePaymentModal} invoice={selectedInvoice} onPaymentActionSuccess={handlePaymentActionSuccess}/>
            )}

            {/* 1. Single Delete Confirmation Modal */}
            <Modal show={showSingleModal} onHide={() => setShowSingleModal(false)} centered backdrop="static">
                <Modal.Header closeButton className="bg-light border-0">
                    <Modal.Title className="h5 text-danger"><FaExclamationTriangle className="me-2"/>Confirm Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-4">
                    <p>Are you sure you want to permanently delete Invoice <strong>{invoiceToDelete?.invoice_number}</strong>?</p>
                    <Alert variant="warning" className="mb-0 small">
                        This is a <strong>Hard Delete</strong>. All linked payments will be wiped, and the associated Job Sheet will be reverted to "Completed" status.
                    </Alert>
                </Modal.Body>
                <Modal.Footer className="border-0 bg-light">
                    <Button variant="outline-secondary" type="button" onClick={() => setShowSingleModal(false)} disabled={isDeleting}>Cancel</Button>
                    <Button variant="danger" type="button" onClick={executeSingleDelete} disabled={isDeleting}>
                        {isDeleting ? <><Spinner as="span" size="sm" animation="border" className="me-2"/>Deleting...</> : 'Yes, Delete Permanently'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* 2. Bulk Delete Date Selection Modal */}
            <Modal show={showBulkModal} onHide={() => setShowBulkModal(false)} centered backdrop="static">
                <Modal.Header closeButton className="bg-light border-0">
                    <Modal.Title className="h5 text-danger"><FaTrash className="me-2"/>Bulk Delete Invoices</Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-4">
                    <p className="text-muted">Select an issue-date range to permanently delete old invoices.</p>
                    <Row className="g-3 mb-3">
                        <Col sm={6}>
                            <Form.Group controlId="bulkStartDate">
                                <Form.Label className="small fw-bold">Start Date</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text><FaCalendarAlt /></InputGroup.Text>
                                    <Form.Control type="date" value={bulkStartDate} onChange={e => setBulkStartDate(e.target.value)} disabled={isDeleting} />
                                </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col sm={6}>
                            <Form.Group controlId="bulkEndDate">
                                <Form.Label className="small fw-bold">End Date</Form.Label>  
                                <InputGroup>
                                    <InputGroup.Text><FaCalendarAlt /></InputGroup.Text>
                                    <Form.Control type="date" value={bulkEndDate} onChange={e => setBulkEndDate(e.target.value)} disabled={isDeleting} />
                                </InputGroup>
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer className="border-0 bg-light">
                    <Button variant="outline-secondary" type="button" onClick={() => setShowBulkModal(false)} disabled={isDeleting}>Cancel</Button>
                    {/* 👉 THE FIX: This now triggers the second modal instead of deleting immediately */}
                    <Button variant="danger" type="button" onClick={promptBulkConfirm} disabled={isDeleting || !bulkStartDate || !bulkEndDate}>
                        Proceed to Wipe
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* 2b. 👉 NEW: Bulk Delete FINAL Warning Modal */}
            <Modal show={showBulkConfirmModal} onHide={() => setShowBulkConfirmModal(false)} centered backdrop="static">
                <Modal.Header closeButton className="bg-danger text-white border-0">
                    <Modal.Title className="h5"><FaExclamationTriangle className="me-2"/>Final Warning</Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-4 text-center">
                    <h5 className="text-danger mb-3">Are you absolutely sure?</h5>
                    <p className="fs-6">
                        You are about to permanently delete <strong>all invoices</strong> issued between <br/>
                        <strong className="text-dark">{bulkStartDate && formatDate(bulkStartDate)}</strong> and <strong className="text-dark">{bulkEndDate && formatDate(bulkEndDate)}</strong>
                    </p>
                    <Alert variant="danger" className="mb-0 small text-start shadow-sm mt-4">
                        This action <strong>cannot be undone</strong>. All related payment history will be destroyed and job sheets will be reset to "Completed".
                    </Alert>
                </Modal.Body>
                <Modal.Footer className="border-0 bg-light justify-content-center">
                    <Button variant="outline-secondary" type="button" onClick={() => setShowBulkConfirmModal(false)} disabled={isDeleting}>Cancel</Button>
                    <Button variant="danger" type="button" onClick={executeBulkDelete} disabled={isDeleting}>
                        {isDeleting ? <><Spinner as="span" size="sm" animation="border" className="me-2"/>Wiping Data...</> : 'I Understand, Wipe Everything'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* 3. Delete Success Modal */}
            <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered backdrop="static">
                <Modal.Body className="text-center py-5">
                    <div className="mb-3">
                        <div className="rounded-circle bg-success bg-opacity-10 d-inline-flex p-3">
                            <FaCheck className="text-success fs-1" />
                        </div>
                    </div>
                    <h4 className="fw-bold mb-3">Deletion Successful!</h4>
                    <p className="text-muted mb-4">
                        {successMessage}
                    </p>
                    <Button variant="success" size="lg" className="px-5" type="button" onClick={() => setShowSuccessModal(false)}>
                        Okay
                    </Button>
                </Modal.Body>
            </Modal>

        </Container>
    );
};

export default InvoicesPage;