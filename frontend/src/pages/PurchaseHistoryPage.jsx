import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, InputGroup, Table, Alert, Spinner, Modal } from 'react-bootstrap';
import { FaFileInvoiceDollar, FaHistory,FaSearch, FaTimes, FaEye, FaCalendarAlt, FaArrowLeft, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { getPurchaseBills, findMasterItemById } from '../data/staticData'; // Get data fetching functions

// Import shared CSS or define specific styles if needed
import '../PurchaseEntryPage.css'; // Reuse the styles for now

// Helpers (can be moved to a utils file)
const formatCurrency = (amount, minimumFractionDigits = 2) => {
    if (amount == null || isNaN(Number(amount))) return 'N/A';
    return Number(amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits, maximumFractionDigits: 2 });
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return 'Invalid Date'; }
};

const PurchaseHistoryPage = () => {
    const [purchaseBills, setPurchaseBills] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingBill, setViewingBill] = useState(null); // State for viewing details modal
    const [sortConfig, setSortConfig] = useState({ key: 'billDate', direction: 'descending' });

    // --- Load Data ---
    useEffect(() => {
        setIsLoading(true);
        setError('');
        try {
            setTimeout(() => {
                setPurchaseBills(getPurchaseBills()); // Get raw data
                setIsLoading(false);
            }, 300);
        } catch (err) {
            console.error("Error loading purchase history:", err);
            setError("Failed to load purchase history. Please try again.");
            setIsLoading(false);
        }
    }, []);

    // --- Filtering ---
    const filteredBills = useMemo(() => {
        let bills = [...purchaseBills];
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            bills = bills.filter(bill =>
                bill.supplierName?.toLowerCase().includes(lowerSearch) ||
                bill.billNumber?.toLowerCase().includes(lowerSearch) ||
                bill.id?.toLowerCase().includes(lowerSearch) ||
                bill.notes?.toLowerCase().includes(lowerSearch)
            );
        }
        return bills;
    }, [purchaseBills, searchTerm]);

    // --- Sorting ---
     const sortedBills = useMemo(() => {
        let sortableItems = [...filteredBills];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle date sorting
                if (sortConfig.key === 'billDate' || sortConfig.key === 'dateRecorded') {
                    aValue = new Date(aValue);
                    bValue = new Date(bValue);
                }
                // Handle numeric sorting (e.g., totalAmount)
                else if (sortConfig.key === 'totalAmount') {
                     aValue = Number(aValue) || 0;
                     bValue = Number(bValue) || 0;
                }
                 // Handle string sorting (case-insensitive)
                 else if (typeof aValue === 'string' && typeof bValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                 }


                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0; // a == b
            });
        }
        return sortableItems;
    }, [filteredBills, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
             // Optional: Cycle back to unsorted or default sort (e.g., date descending)
             // For now, just toggle between asc/desc for the clicked column
             direction = 'ascending';
             // Or to reset: key = 'billDate'; direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // --- Modal Handler ---
    const handleViewDetails = (bill) => setViewingBill(bill);
    const handleCloseDetails = () => setViewingBill(null);

     // Helper to render sort icons
     const getSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return <FaSort className="ms-1 text-muted" size="0.8em" />;
        }
        if (sortConfig.direction === 'ascending') {
            return <FaSortUp className="ms-1" size="0.8em" />;
        }
        return <FaSortDown className="ms-1" size="0.8em" />;
    };


    // --- Render ---
    return (
        <Container fluid className="py-4 px-md-4 purchase-history-page">
            {/* Page Header */}
            <Row className="mb-4 align-items-center page-header-row">
                <Col>
                    <h2 className="page-title mb-0 text-right"><FaHistory className="me-2" />Purchase Bill History</h2>
                </Col>
            </Row>

            {/* Alerts */}
            {error && <Alert variant="danger">{error}</Alert>}

            {/* Search Bar */}
            <Row>
                <Col>
                    <InputGroup className="mb-3 search-bar">
                        <InputGroup.Text><FaSearch /></InputGroup.Text>
                        <Form.Control
                            placeholder="Search by Supplier, Bill No, ID, or Notes..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            disabled={isLoading}
                        />
                        {searchTerm && (
                            <Button variant="outline-secondary" size="sm" onClick={() => setSearchTerm('')} title="Clear Search">
                                <FaTimes />
                            </Button>
                        )}
                    </InputGroup>
                </Col>
            </Row>


            {/* History Table */}
            <div className="history-table-wrapper">
                 <Table responsive hover className="history-table">
                     <thead>
                        <tr>
                             <th onClick={() => requestSort('billDate')} style={{cursor: 'pointer'}}>
                                Bill Date {getSortIcon('billDate')}
                             </th>
                             <th onClick={() => requestSort('supplierName')} style={{cursor: 'pointer'}}>
                                Supplier {getSortIcon('supplierName')}
                             </th>
                             <th onClick={() => requestSort('billNumber')} style={{cursor: 'pointer'}}>
                                Bill No {getSortIcon('billNumber')}
                            </th>
                            <th className="d-none d-lg-table-cell" onClick={() => requestSort('notes')} style={{cursor: 'pointer'}}>
                                Notes {getSortIcon('notes')}
                            </th>
                            <th className="text-end" onClick={() => requestSort('totalAmount')} style={{cursor: 'pointer'}}>
                                Total Amount {getSortIcon('totalAmount')}
                             </th>
                             <th className="text-center">Actions</th>
                         </tr>
                     </thead>
                     <tbody>
                        {isLoading ? (
                             <tr><td colSpan="6" className="text-center p-5"><Spinner animation="border" size="sm" /><span className="ms-2">Loading History...</span></td></tr>
                        ) : sortedBills.length === 0 ? (
                             <tr><td colSpan="6" className="text-center text-muted p-4 fst-italic">{purchaseBills.length === 0 ? "No purchase history recorded yet." : "No matching purchase bills found."}</td></tr>
                        ) : (
                             sortedBills.map(bill => (
                                <tr key={bill.id}>
                                    <td>{formatDate(bill.billDate)}</td>
                                    <td>{bill.supplierName}</td>
                                    <td>{bill.billNumber}</td>
                                    <td className="d-none d-lg-table-cell">
                                        {bill.notes && <span className='notes-preview' title={bill.notes}>{bill.notes}</span>}
                                    </td>
                                    <td className="text-end fw-medium">{formatCurrency(bill.totalAmount)}</td>
                                    <td className="text-center">
                                         <Button variant="outline-primary" size="sm" className="action-view" onClick={() => handleViewDetails(bill)} title="View Details">
                                             <FaEye />
                                         </Button>
                                    </td>
                                </tr>
                             ))
                        )}
                     </tbody>
                 </Table>
             </div>

             {/* View Bill Details Modal (Copied/Adapted from original page) */}
             <Modal show={!!viewingBill} onHide={handleCloseDetails} centered size="lg" backdrop="static" keyboard={false}>
                 <Modal.Header closeButton>
                     <Modal.Title><FaFileInvoiceDollar className="me-2" />Purchase Bill Details</Modal.Title>
                 </Modal.Header>
                 <Modal.Body>
                     {viewingBill && (
                         <>
                             <Row className="mb-3 g-3 p-3 bg-light rounded border">
                                 <Col md={6}><strong>Supplier:</strong> {viewingBill.supplierName}</Col>
                                 <Col md={6}><strong>Bill No:</strong> {viewingBill.billNumber}</Col>
                                 <Col md={6}><strong>Bill Date:</strong> {formatDate(viewingBill.billDate)}</Col>
                                 <Col md={6}><strong>Recorded:</strong> {formatDate(viewingBill.dateRecorded)}</Col>
                                 {viewingBill.notes && <Col xs={12} className="mt-2"><small><strong>Notes:</strong> {viewingBill.notes}</small></Col>}
                             </Row>
                             <h6 className="mt-3 mb-2">Items Purchased:</h6>
                             <Table striped bordered hover size="sm" responsive>
                                 <thead className="table-light">
                                     <tr>
                                         <th>#</th><th>Item Name</th><th>Part No</th>
                                         <th className="text-center">Qty</th>
                                         <th className="text-end">Cost/Unit</th>
                                         <th className="text-end">Line Total</th>
                                     </tr>
                                 </thead>
                                 <tbody>
                                     {viewingBill.items.map((item, index) => {
                                         const master = findMasterItemById(item.masterItemId); // Reuse finder
                                         return (
                                             <tr key={index}>
                                                 <td>{index + 1}</td>
                                                 <td>{master?.name || <span className='text-muted fst-italic'>Item ID: {item.masterItemId}</span>}</td>
                                                 <td>{master?.partNo || '-'}</td>
                                                 <td className="text-center">{item.quantity}</td>
                                                 <td className="text-end">{formatCurrency(item.purchasePrice)}</td>
                                                 <td className="text-end fw-semibold">{formatCurrency(item.quantity * item.purchasePrice)}</td>
                                             </tr>
                                         );
                                     })}
                                 </tbody>
                                 <tfoot>
                                     <tr className="table-light">
                                         <td colSpan="5" className="text-end fw-bold">Grand Total:</td>
                                         <td className="text-end fw-bold fs-6">{formatCurrency(viewingBill.totalAmount)}</td>
                                     </tr>
                                 </tfoot>
                             </Table>
                         </>
                     )}
                 </Modal.Body>
                 <Modal.Footer>
                     <Button variant="outline-secondary" onClick={handleCloseDetails}>Close</Button>
                 </Modal.Footer>
             </Modal>

        </Container>
    );
};

export default PurchaseHistoryPage;