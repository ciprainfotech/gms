import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Form, Button, InputGroup, Table, Alert, Spinner, Modal, Card, Badge } from 'react-bootstrap';
import { FaFileInvoiceDollar, FaHistory, FaSearch, FaTimes, FaEye, FaSort, FaSortUp, FaSortDown, FaPlus } from 'react-icons/fa';
import { Link } from 'react-router-dom';

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
    const [dateFilter, setDateFilter] = useState('all');
    const [viewingBill, setViewingBill] = useState(null); 
    const [sortConfig, setSortConfig] = useState({ key: 'billDate', direction: 'descending' });

    const [isModuleLocked, setIsModuleLocked] = useState(false);

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

                if (billsRes.status === 403 || itemsRes.status === 403) {
                    setIsModuleLocked(true);
                } else if (billsRes.ok && itemsRes.ok) {
                    const rawBills = await billsRes.json();
                    const rawItems = await itemsRes.json();
                    
                    setIsModuleLocked(false);
                    setMasterItems(rawItems);
                    
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

        // Apply Date Filter
        if (dateFilter !== 'all') {
            const today = new Date();
            bills = bills.filter(bill => {
                const bDate = new Date(bill.billDate);
                if (dateFilter === 'today') {
                    return bDate.toDateString() === today.toDateString();
                } else if (dateFilter === 'thisMonth') {
                    return bDate.getMonth() === today.getMonth() && bDate.getFullYear() === today.getFullYear();
                } else if (dateFilter === 'lastMonth') {
                    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    return bDate.getMonth() === lastMonth.getMonth() && bDate.getFullYear() === lastMonth.getFullYear();
                } else if (dateFilter === 'thisYear') {
                    return bDate.getFullYear() === today.getFullYear();
                }
                return true;
            });
        }

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
    }, [purchaseBills, searchTerm, dateFilter]);

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
            {isModuleLocked && (
                <Alert variant="warning" className="shadow-sm border-warning rounded-3 mb-4 d-flex align-items-center bg-warning bg-opacity-10">
                    <FaHistory className="fs-3 me-3 text-warning" />
                    <div>
                        <strong className="d-block text-dark">ℹ️ Read-Only History Mode</strong>
                        <span className="text-secondary small">Entry of new purchase bills is locked by Cipra Infotech Super Admin. You can browse past purchase records.</span>
                    </div>
                </Alert>
            )}
            
            {/* Page Header */}
            <div className="page-header-row mb-4 d-flex justify-content-between align-items-center">
                <h2 className="page-title-active mb-0 d-flex align-items-center">
                    <FaHistory className="me-2 text-primary" /> Purchase Bill History
                </h2>
                {!isModuleLocked && (
                    <div className="actions">
                        <Button as={Link} to="/purchase-entry" variant="primary" className="shadow-sm d-flex align-items-center px-3">
                            <FaPlus className="me-2" /> Add Purchase
                        </Button>
                    </div>
                )}
            </div>

            {/* Alerts */}
            {error && <Alert variant="danger" className="border-0 shadow-sm">{error}</Alert>}

            {/* Filters Row */}
            <Card className="saas-card shadow-sm border-0 mb-4">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={8} lg={9}>
                            <div className="saas-search-pill d-flex align-items-center bg-light rounded-pill px-3 py-2 border border-light">
                                <FaSearch className="text-muted me-2" />
                                <Form.Control
                                    className="border-0 shadow-none bg-transparent p-0"
                                    placeholder="Search by Supplier, Bill No, ID, or Notes..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    disabled={isLoading}
                                />
                                {searchTerm && (
                                    <Button variant="link" size="sm" onClick={() => setSearchTerm('')} title="Clear Search" className="p-0 text-muted hover-danger">
                                        <FaTimes />
                                    </Button>
                                )}
                            </div>
                        </Col>
                        <Col md={4} lg={3}>
                            <Form.Select 
                                value={dateFilter} 
                                onChange={(e) => setDateFilter(e.target.value)} 
                                disabled={isLoading} 
                                className="bg-light border-light shadow-none rounded-pill"
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="thisMonth">This Month</option>
                                <option value="lastMonth">Last Month</option>
                                <option value="thisYear">This Year</option>
                            </Form.Select>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* History Table */}
            <Card className="saas-card shadow-sm border-0">
                <div className="saas-table-wrapper">
                     <Table hover responsive className="mb-0 align-middle">
                         <thead className="bg-light">
                            <tr>
                                 <th onClick={() => requestSort('billDate')} style={{cursor: 'pointer'}} className="border-0">
                                    Bill Date {getSortIcon('billDate')}
                                 </th>
                                 <th onClick={() => requestSort('supplierName')} style={{cursor: 'pointer'}} className="border-0">
                                    Supplier {getSortIcon('supplierName')}
                                 </th>
                                 <th onClick={() => requestSort('billNumber')} style={{cursor: 'pointer'}} className="border-0">
                                    Bill No {getSortIcon('billNumber')}
                                </th>
                                <th className="d-none d-lg-table-cell border-0" onClick={() => requestSort('notes')} style={{cursor: 'pointer'}}>
                                    Notes {getSortIcon('notes')}
                                </th>
                                <th className="text-end border-0" onClick={() => requestSort('totalAmount')} style={{cursor: 'pointer'}}>
                                    Total Amount {getSortIcon('totalAmount')}
                                 </th>
                                 <th className="text-center border-0">Actions</th>
                             </tr>
                         </thead>
                         <tbody className="border-top-0">
                            {isLoading ? (
                                 <tr><td colSpan="6" className="text-center p-5"><Spinner animation="border" size="sm" variant="primary" /><span className="ms-2 text-muted">Loading History...</span></td></tr>
                            ) : sortedBills.length === 0 ? (
                                 <tr><td colSpan="6" className="text-center text-muted p-5 bg-light rounded-bottom-4">
                                     <div className="mb-2"><FaHistory size="2em" className="text-secondary opacity-50" /></div>
                                     <div>{purchaseBills.length === 0 ? "No purchase history recorded yet." : "No matching purchase bills found."}</div>
                                 </td></tr>
                            ) : (
                                 sortedBills.map(bill => (
                                    <tr key={bill.id}>
                                        <td className="fw-medium text-dark">{formatDate(bill.billDate)}</td>
                                        <td className="fw-bold text-dark">{bill.supplierName}</td>
                                        <td><Badge bg="light" text="dark" className="border shadow-sm">{bill.billNumber}</Badge></td>
                                        <td className="d-none d-lg-table-cell text-muted">
                                            {bill.notes && <span className='notes-preview text-truncate d-inline-block' style={{maxWidth: '150px'}} title={bill.notes}>{bill.notes}</span>}
                                        </td>
                                        <td className="text-end fw-bold text-primary">{formatCurrency(bill.totalAmount)}</td>
                                        <td className="text-center">
                                             <Button variant="light" size="sm" className="border shadow-sm text-primary hover-primary" onClick={() => handleViewDetails(bill)} title="View Details">
                                                 <FaEye />
                                             </Button>
                                        </td>
                                    </tr>
                                 ))
                            )}
                         </tbody>
                     </Table>
                 </div>
            </Card>

             {/* View Bill Details Modal */}
             <Modal show={!!viewingBill} onHide={handleCloseDetails} centered size="lg" backdrop="static" keyboard={false} className="saas-modal">
                 <Modal.Header closeButton className="border-0 pb-0">
                     <Modal.Title className="h5 fw-bold text-dark d-flex align-items-center"><FaFileInvoiceDollar className="me-2 text-primary" />Purchase Bill Details</Modal.Title>
                 </Modal.Header>
                 <Modal.Body className="py-4">
                     {viewingBill && (
                         <>
                             <Row className="mb-4 g-3 p-4 bg-light rounded-4 border border-light">
                                 <Col md={6} className="d-flex flex-column">
                                    <span className="text-muted small text-uppercase fw-bold mb-1">Supplier</span>
                                    <span className="fw-bold text-dark fs-5">{viewingBill.supplierName}</span>
                                 </Col>
                                 <Col md={6} className="d-flex flex-column">
                                    <span className="text-muted small text-uppercase fw-bold mb-1">Bill No</span>
                                    <span className="fw-bold text-dark fs-5">{viewingBill.billNumber}</span>
                                 </Col>
                                 <Col md={6} className="d-flex flex-column">
                                    <span className="text-muted small text-uppercase fw-bold mb-1">Bill Date</span>
                                    <span className="text-dark fw-medium">{formatDate(viewingBill.billDate)}</span>
                                 </Col>
                                 <Col md={6} className="d-flex flex-column">
                                    <span className="text-muted small text-uppercase fw-bold mb-1">Recorded</span>
                                    <span className="text-dark fw-medium">{formatDate(viewingBill.dateRecorded)}</span>
                                 </Col>
                                 {viewingBill.notes && <Col xs={12} className="mt-3 pt-3 border-top border-light"><span className="text-muted small fw-bold text-uppercase d-block mb-1">Notes:</span><span className="text-secondary">{viewingBill.notes}</span></Col>}
                             </Row>
                             <h6 className="fw-bold text-dark mb-3">Items Purchased</h6>
                             <div className="border border-light rounded-4 overflow-hidden">
                                 <Table hover responsive className="mb-0">
                                     <thead className="bg-light">
                                         <tr>
                                             <th className="border-0">#</th>
                                             <th className="border-0">Item Name</th>
                                             <th className="border-0">Part No</th>
                                             <th className="text-center border-0">Qty</th>
                                             <th className="text-end border-0">Cost/Unit</th>
                                             <th className="text-end border-0">Line Total</th>
                                         </tr>
                                     </thead>
                                     <tbody className="border-top-0">
                                         {viewingBill.items && viewingBill.items.map((item, index) => {
                                             const masterId = item.masterItemId || item.master_item_id;
                                             const master = masterItems.find(m => m.id === masterId); 
                                             const qty = Number(item.quantity) || 0;
                                             const price = Number(item.purchasePrice || item.purchase_price) || 0;

                                             return (
                                                 <tr key={index}>
                                                     <td className="text-muted">{index + 1}</td>
                                                     <td className="fw-medium text-dark">{master?.name || item.name || <span className='text-muted fst-italic'>Item ID: {masterId}</span>}</td>
                                                     <td className="text-muted">{master?.partNo || item.partNo || item.part_no || '-'}</td>
                                                     <td className="text-center fw-medium">{qty}</td>
                                                     <td className="text-end text-muted">{formatCurrency(price)}</td>
                                                     <td className="text-end fw-bold text-dark">{formatCurrency(qty * price)}</td>
                                                 </tr>
                                             );
                                         })}
                                     </tbody>
                                     <tfoot className="bg-light">
                                         <tr>
                                             <td colSpan="5" className="text-end fw-bold text-secondary border-0 pt-3">Grand Total:</td>
                                             <td className="text-end fw-bold fs-5 text-primary border-0 pt-3">{formatCurrency(viewingBill.totalAmount)}</td>
                                         </tr>
                                     </tfoot>
                                 </Table>
                             </div>
                         </>
                     )}
                 </Modal.Body>
                 <Modal.Footer className="border-0 pt-0">
                     <Button variant="light" onClick={handleCloseDetails} className="px-4 fw-medium">Close</Button>
                 </Modal.Footer>
             </Modal>

        </Container>
    );
};

export default PurchaseHistoryPage;
