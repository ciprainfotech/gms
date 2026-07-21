import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Form, Button, InputGroup, Table, Alert, Spinner, Modal } from 'react-bootstrap';
import { FaFileInvoiceDollar, FaHistory, FaSearch, FaTimes, FaEye, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

// Import custom API wrapper instead of static data
import api from '../api/api';

import '../PurchaseEntryPage.css'; // Reuse the styles

// Helpers
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
    const [masterItems, setMasterItems] = useState([]); // Added to replace findMasterItemById
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingBill, setViewingBill] = useState(null); 
    const [sortConfig, setSortConfig] = useState({ key: 'billDate', direction: 'descending' });

    // --- Load Data from Database ---
    useEffect(() => {
        const fetchHistoryData = async () => {
            setIsLoading(true);
            setError('');
            try {
                // Fetch both bills and master items concurrently
                const [billsRes, itemsRes] = await Promise.all([
                    api.get('/purchase-bills'),
                    api.get('/master-items')
                ]);

                if (billsRes.ok && itemsRes.ok) {
                    const rawBills = await billsRes.json();
                    const itemsData = await itemsRes.json();
                    
                    // Normalize the data safely in case the backend uses snake_case
                    const formattedBills = rawBills.map(bill => ({
                        ...bill,
                        billDate: bill.bill_date || bill.billDate,
                        supplierName: bill.supplier_name || bill.supplierName || 'Unknown Supplier',
                        billNumber: bill.bill_number || bill.billNumber,
                        totalAmount: bill.total_amount || bill.totalAmount,
                        dateRecorded: bill.created_at || bill.dateRecorded,
                        items: bill.items || bill.purchase_bill_items || []
                    }));

                    setPurchaseBills(formattedBills);
                    setMasterItems(itemsData);
                } else {
                    setError("Failed to fetch data from the server.");
                }
            } catch (err) {
                console.error("Error loading purchase history:", err);
                setError("Failed to load purchase history. Please check your connection.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistoryData();
    }, []);

    // --- Filtering ---
    const filteredBills = useMemo(() => {
        let bills = [...purchaseBills];
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            bills = bills.filter(bill => {
                const supName = bill.supplierName || '';
                const billNo = bill.billNumber || '';
                const notes = bill.notes || '';
                const idStr = String(bill.id || '');
                
                return supName.toLowerCase().includes(lowerSearch) ||
                       billNo.toLowerCase().includes(lowerSearch) ||
                       idStr.toLowerCase().includes(lowerSearch) ||
                       notes.toLowerCase().includes(lowerSearch);
            });
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
                    aValue = new Date(aValue || 0);
                    bValue = new Date(bValue || 0);
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
             direction = 'ascending';
        }
        setSortConfig({ key, direction });
    };

    // --- Modal Handlers ---
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

             {/* View Bill Details Modal */}
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
                                     {viewingBill.items && viewingBill.items.map((item, index) => {
                                         // Dynamic Lookup from our fetched masterItems state
                                         const masterId = item.masterItemId || item.master_item_id;
                                         const master = masterItems.find(m => m.id === masterId); 
                                         const qty = Number(item.quantity) || 0;
                                         const price = Number(item.purchasePrice || item.purchase_price) || 0;

                                         return (
                                             <tr key={index}>
                                                 <td>{index + 1}</td>
                                                 <td>{master?.name || item.name || <span className='text-muted fst-italic'>Item ID: {masterId}</span>}</td>
                                                 <td>{master?.partNo || item.partNo || item.part_no || '-'}</td>
                                                 <td className="text-center">{qty}</td>
                                                 <td className="text-end">{formatCurrency(price)}</td>
                                                 <td className="text-end fw-semibold">{formatCurrency(qty * price)}</td>
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