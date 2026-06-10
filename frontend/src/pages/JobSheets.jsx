import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Table, Badge, Button, InputGroup, Form, Row, Col, Spinner, Alert, Modal } from 'react-bootstrap';
import { FaEye, FaSearch, FaFileInvoiceDollar, FaFileInvoice, FaArchive, FaTrash, FaCalendarAlt, FaExclamationTriangle, FaCheck } from 'react-icons/fa';
import api from '../api/api';

const JobSheets = () => {
    // State for data from backend
    const [allHistoricalSheets, setAllHistoricalSheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State for UI controls
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // --- NEW: Delete Control States ---
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Single Delete
    const [showSingleModal, setShowSingleModal] = useState(false);
    const [sheetToDelete, setSheetToDelete] = useState(null);

    // Bulk Delete
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
    const [bulkStartDate, setBulkStartDate] = useState('');
    const [bulkEndDate, setBulkEndDate] = useState('');

    // Success Modal
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // --- Helper Functions ---
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
        switch (status?.toLowerCase()) {
            case 'completed': return <Badge bg="success">✅ Completed</Badge>;
            case 'invoiced': return <Badge bg="info">🧾 Invoiced</Badge>;
            case 'cancelled': return <Badge bg="danger">❌ Cancelled</Badge>;
            default: return <Badge bg="secondary">{status || 'N/A'}</Badge>;
        }
    };

    // --- Load Data from Backend ---
    const fetchHistoricalSheets = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/jobsheets/historical');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch job sheets.');
            }
            const data = await response.json();
            setAllHistoricalSheets(data);
        } catch (err) {
            console.error('Error fetching historical job sheets:', err);
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistoricalSheets();
    }, [fetchHistoricalSheets]);

    // --- Filtering Logic ---
    const filteredJobSheets = useMemo(() => {
        return allHistoricalSheets.filter(js => {
            const lowerSearch = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm ||
                js.jobSheetNumber?.toLowerCase().includes(lowerSearch) ||
                js.vehicleNumber?.toLowerCase().includes(lowerSearch) ||
                js.customerName?.toLowerCase().includes(lowerSearch) ||
                js.vehicleModel?.toLowerCase().includes(lowerSearch);

            const matchesStatus = !statusFilter || js.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [allHistoricalSheets, searchTerm, statusFilter]);

    // --- Single Delete Handlers ---
    const promptSingleDelete = (jobSheet) => {
        setSheetToDelete(jobSheet);
        setShowSingleModal(true);
    };

    const executeSingleDelete = async () => {
        if (!sheetToDelete) return;
        setIsDeleting(true);
        setError('');
        try {
            const response = await api.delete(`/jobsheets/${sheetToDelete.id}`);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to delete job sheet.');
            }
            
            // Remove from local state instantly
            setAllHistoricalSheets(prev => prev.filter(js => js.id !== sheetToDelete.id));
            
            // Trigger Success Modal
            setSuccessMessage(`Job Sheet ${sheetToDelete.jobSheetNumber} has been permanently deleted.`);
            setShowSingleModal(false);
            setShowSuccessModal(true);
            
            setSheetToDelete(null);
        } catch (err) {
            console.error('Error deleting single job sheet:', err);
            setError(`Delete Failed: ${err.message}`);
            setShowSingleModal(false);
        } finally {
            setIsDeleting(false);
        }
    };

    // --- Bulk Delete Handlers ---
    const promptBulkConfirm = () => {
        if (!bulkStartDate || !bulkEndDate) return;
        setShowBulkModal(false);
        setShowBulkConfirmModal(true);
    };

    const executeBulkDelete = async () => {
        if (!bulkStartDate || !bulkEndDate) return;
        setIsDeleting(true);
        setError('');
        try {
            const response = await api.post('/jobsheets/bulk-delete', { 
                startDate: bulkStartDate, 
                endDate: bulkEndDate 
            });
            
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to bulk delete job sheets.');
            }
            
            // Reload the entire table
            await fetchHistoricalSheets();
            
            // Trigger Success Modal
            setSuccessMessage(`Job Sheets between ${formatDate(bulkStartDate)} and ${formatDate(bulkEndDate)} have been permanently wiped.`);
            setShowBulkConfirmModal(false);
            setShowSuccessModal(true);
            
            setBulkStartDate('');
            setBulkEndDate('');
        } catch (err) {
            console.error('Error bulk deleting job sheets:', err);
            setError(`Bulk Delete Failed: ${err.message}`);
            setShowBulkConfirmModal(false);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Container fluid className="py-4">
            <div className="page-header-row mb-4 d-flex justify-content-between align-items-center">
                <h2 className="page-title-active mb-0">
                    <FaArchive className="me-2" />
                    Job Sheets Archive
                </h2>
                <Button variant="outline-danger" onClick={() => setShowBulkModal(true)}>
                    <FaTrash className="me-2" /> Bulk Delete by Date
                </Button>
            </div>

            <div className="main-content pt-0">
                 {/* Filter Controls */}
                 <Card className="mb-4 shadow-sm border-light">
                     <Card.Header className="bg-light fw-bold">Filter Records</Card.Header>
                    <Card.Body>
                        <Row className="g-3 align-items-center">
                            <Col md={6} lg={5}>
                                <InputGroup>
                                    <InputGroup.Text><FaSearch /></InputGroup.Text>
                                    <Form.Control
                                         placeholder="Search by Job#, Vehicle#, Customer..."
                                         value={searchTerm}
                                         onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </InputGroup>
                            </Col>
                            <Col md={4} lg={3}>
                                 <Form.Label htmlFor="statusFilterSelect" className="visually-hidden">Status Filter</Form.Label>
                                <Form.Select
                                    id="statusFilterSelect"
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Invoiced">Invoiced</option>
                                    <option value="Cancelled">Cancelled</option>
                                </Form.Select>
                            </Col>
                        </Row>
                    </Card.Body>
                 </Card>

                {/* Job Sheet Table */}
                <Card className="shadow-sm border-light">
                    <Card.Header className="bg-light fw-bold">Historical Records ({filteredJobSheets.length} found)</Card.Header>
                    {error && (
                        <Alert variant="danger" className="m-3 mb-0 shadow-sm" onClose={() => setError('')} dismissible>
                            {error}
                        </Alert>
                    )}
                    <Card.Body className="p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <Spinner animation="border" />
                                <p className="mt-2 text-muted">Loading archive...</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <Table hover striped className="mb-0 align-middle">
                                    <thead className="table-light">
                                         <tr>
                                             <th className="py-3 px-3">Job Sheet #</th>
                                             <th className="py-3 px-3">Date Completed</th>
                                             <th className="py-3 px-3">Vehicle No.</th>
                                             <th className="py-3 px-3">Customer</th>
                                             <th className="py-3 px-3 text-end">Amount</th>
                                             <th className="py-3 px-3">Status</th>
                                             <th className="py-3 px-3 text-center">Actions</th>
                                         </tr>
                                    </thead>
                                    <tbody>
                                         {filteredJobSheets.length === 0 ? (
                                            <tr><td colSpan="7" className="text-center text-muted py-5">No matching job sheets found.</td></tr>
                                        ) : (
                                            filteredJobSheets.map((js) => (
                                                <tr key={js.id}>
                                                    <td className="px-3 fw-medium">{js.jobSheetNumber}</td>
                                                    <td className="px-3">{formatDate(js.dateCompleted || js.dateCreated)}</td>
                                                    <td className="px-3">{js.vehicleNumber}</td>
                                                    <td className="px-3">{js.customerName}</td>
                                                    <td className="px-3 text-end">{Number(js.grandTotal).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || 'N/A'}</td>
                                                    <td className="px-3">{getStatusBadge(js.status)}</td>
                                                    <td className="px-3 text-center">
                                                        <div className="d-flex justify-content-center gap-1">
                                                            <Link to={`/jobsheet/${js.id}`} className="btn btn-outline-secondary btn-sm" title="View Job Sheet Details">
                                                                <FaEye />
                                                            </Link>
                                                            {js.status === 'Invoiced' && js.linkedInvoiceId && (
                                                                <Link to={`/invoices/${js.linkedInvoiceId}/view`} className="btn btn-outline-info btn-sm" title="View Invoice">
                                                                    <FaFileInvoice />
                                                                </Link>
                                                            )}
                                                            {js.status === 'Completed' && !js.linkedInvoiceId && (
                                                                <Link to="/create-invoice" state={{ jobSheetId: js.id }} className="btn btn-outline-primary btn-sm" title="Create Invoice">
                                                                    <FaFileInvoiceDollar />
                                                                </Link>
                                                            )}
                                                            <Button variant="outline-danger" size="sm" title="Permanently Delete" onClick={() => promptSingleDelete(js)}>
                                                                <FaTrash />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </Card.Body>
                    <Card.Footer className="text-muted text-end py-2 px-3">
                         Total Records: {allHistoricalSheets.length} | Displaying: {filteredJobSheets.length}
                     </Card.Footer>
                </Card>
            </div>

            {/* ========================== MODALS ========================== */}

            {/* 1. Single Delete Confirmation Modal */}
            <Modal show={showSingleModal} onHide={() => setShowSingleModal(false)} centered backdrop="static">
                <Modal.Header closeButton className="bg-light border-0">
                    <Modal.Title className="h5 text-danger"><FaExclamationTriangle className="me-2"/>Confirm Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-4">
                    <p>Are you sure you want to permanently delete Job Sheet <strong>{sheetToDelete?.jobSheetNumber}</strong>?</p>
                    <Alert variant="warning" className="mb-0 small">
                        This is a <strong>Hard Delete</strong>. All linked parts, services, and calculations will be permanently wiped from the database. This cannot be undone.
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
                    <Modal.Title className="h5 text-danger"><FaTrash className="me-2"/>Bulk Delete Job Sheets</Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-4">
                    <p className="text-muted">Select a date range to permanently delete old or cancelled job sheets.</p>
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
                    <Button variant="danger" type="button" onClick={promptBulkConfirm} disabled={isDeleting || !bulkStartDate || !bulkEndDate}>
                        Proceed to Wipe
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* 2b. Bulk Delete FINAL Warning Modal */}
            <Modal show={showBulkConfirmModal} onHide={() => setShowBulkConfirmModal(false)} centered backdrop="static">
                <Modal.Header closeButton className="bg-danger text-white border-0">
                    <Modal.Title className="h5"><FaExclamationTriangle className="me-2"/>Final Warning</Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-4 text-center">
                    <h5 className="text-danger mb-3">Are you absolutely sure?</h5>
                    <p className="fs-6">
                        You are about to permanently delete <strong>all job sheets</strong> created between <br/>
                        <strong className="text-dark">{bulkStartDate && formatDate(bulkStartDate)}</strong> and <strong className="text-dark">{bulkEndDate && formatDate(bulkEndDate)}</strong>.
                    </p>
                    <Alert variant="danger" className="mb-0 small text-start shadow-sm mt-4">
                        This action <strong>cannot be undone</strong>. All items, parts, and labor linked to these job sheets will be permanently destroyed.
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

export default JobSheets;