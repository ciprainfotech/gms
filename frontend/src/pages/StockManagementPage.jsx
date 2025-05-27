import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Container, Row, Col, Card, Button, InputGroup, Form, Modal, Alert, Tooltip, OverlayTrigger, Badge, Dropdown, Tabs, Tab, Table, Spinner } from 'react-bootstrap';
import {
    FaBox, FaPlus, FaEdit, FaTrashAlt, FaClipboardList,FaEllipsisV,FaSearch, FaFilter, FaExclamationTriangle, FaCheckCircle, FaTimes, FaCube, FaTools, FaInfoCircle
} from 'react-icons/fa';
import {
    getMasterItems, addMasterItem, updateMasterItem, deleteMasterItemById, LOW_STOCK_THRESHOLD
} from '../data/staticData';
import '../App.css'; // Main app styles with variables
import '../StockManagementPage.css'; // Specific styles for this page

// Helper to format currency
const formatCurrency = (amount) => {
    if (amount == null || isNaN(Number(amount))) {
        return 'N/A'; // Or return '₹ 0.00'
    }
    return Number(amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const StockManagementPage = () => {
    // --- State ---
    const [masterItems, setMasterItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'lowStock'
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState(''); // '', 'Spare', 'Service'

    // Modal & Form State
    const [modalState, setModalState] = useState({ type: null, data: null, show: false }); // 'add', 'edit'
    const [formData, setFormData] = useState({});
    const [formError, setFormError] = useState('');

    // --- Initial Data Loading ---
    useEffect(() => {
        setIsLoading(true);
        // Simulate async loading if needed
        try {
            setMasterItems(getMasterItems());
        } catch (error) {
            console.error("Error loading master items:", error);
        } finally {
            setTimeout(() => setIsLoading(false), 200); // Short delay
        }
    }, []);

    // --- Memoized Filtering & Data Prep ---
    const filteredItems = useMemo(() => {
        if (isLoading) return [];
        return masterItems.filter(item => {
            const lowerSearchTerm = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm ||
                item.name.toLowerCase().includes(lowerSearchTerm) ||
                (item.partNo && item.partNo.toLowerCase().includes(lowerSearchTerm));
            const matchesType = !filterType || item.type === filterType;
            return matchesSearch && matchesType;
        });
    }, [searchTerm, filterType, masterItems, isLoading]);

    const lowStockItems = useMemo(() => {
        if (isLoading) return [];
        return masterItems.filter(item =>
            item.type === 'Spare' && item.stockQty !== null && item.stockQty < LOW_STOCK_THRESHOLD
        );
    }, [masterItems, isLoading]);


    // --- Modal Management ---
    const showModal = (type, data = null) => {
        setFormError('');
        let initialFormData = {};
        if (type === 'add') {
            initialFormData = { name: '', partNo: '', type: 'Spare', unitPrice: '', lubeCharge: '', labourCharge: '', stockQty: '' };
        } else if (type === 'edit' && data) {
            initialFormData = { ...data, // Pre-fill
                unitPrice: data.unitPrice ?? '',
                lubeCharge: data.lubeCharge ?? '',
                labourCharge: data.labourCharge ?? '',
                stockQty: data.stockQty ?? '' // Keep null as '' for input
            };
        }
        setFormData(initialFormData);
        setModalState({ type, data, show: true });
    };
    const closeModal = () => {
        setModalState({ type: null, data: null, show: false });
        setFormData({});
        setFormError('');
    };

    // --- Form Handler ---
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // If type changes, reset stock quantity if switching to Service
        if (name === 'type' && value === 'Service') {
            setFormData(prev => ({ ...prev, stockQty: '' })); // Reset stock for service
        }
    };

    // --- CRUD Operations ---
    const handleAddItemSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.type) { setFormError("Item Name and Type are required."); return; }
        // Add further validation for numbers if needed
        setFormError('');
        const newItem = addMasterItem(formData);
        if (newItem) {
            setMasterItems(getMasterItems()); // Refresh list
            closeModal();
            alert(`${newItem.name} added successfully.`);
        } else { setFormError("Error adding item. Part No might already exist."); }
    };

    const handleEditItemSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.type) { setFormError("Item Name and Type are required."); return; }
        setFormError('');
        const updatedItem = updateMasterItem(modalState.data.id, formData);
        if (updatedItem) {
            setMasterItems(getMasterItems()); // Refresh list
            closeModal();
            alert(`${updatedItem.name} updated successfully.`);
        } else { setFormError("Error updating item. Part No might already exist."); }
    };

    const handleDeleteItem = (itemId, itemName) => {
         if (window.confirm(`Are you sure you want to delete "${itemName}"?\nThis cannot be undone and might affect historical data.`)) {
            const success = deleteMasterItemById(itemId);
            if(success) {
                setMasterItems(getMasterItems()); // Refresh list
                 alert(`"${itemName}" deleted.`);
            } else {
                alert(`Error deleting "${itemName}". It might be in use.`);
            }
         }
    };

    // --- Render Helper: Stock Badge ---
    const renderStockBadge = (item) => {
        if (item.type !== 'Spare' || item.stockQty === null || item.stockQty === undefined) {
            return <Badge bg="light" text="dark" className="stock-badge na">-</Badge>;
        }
        const qty = Number(item.stockQty);
        if (qty <= 0) {
            return <Badge bg="danger" className="stock-badge out">{qty}</Badge>;
        }
        if (qty < LOW_STOCK_THRESHOLD) {
            return <Badge bg="warning" text="dark" className="stock-badge low">{qty}</Badge>;
        }
        return <Badge bg="success" className="stock-badge ok">{qty}</Badge>;
    };

     // --- Render Helper: Table Row ---
    const renderInventoryRow = (item) => (
         <tr key={item.id} className={item.type === 'Spare' && item.stockQty < LOW_STOCK_THRESHOLD && item.stockQty > 0 ? 'table-warning- हल्का' : ''}>
            <td>
                 <span className="item-partno">{item.partNo || '-'}</span>
            </td>
            <td>
                 <div className="item-name">{item.name}</div>
                 <Badge pill bg={item.type === 'Spare' ? 'info' : 'secondary'} className="item-type-badge">
                     {item.type === 'Spare' ? <FaCube/> : <FaTools/>} {item.type}
                 </Badge>
            </td>
             <td className="text-center">{renderStockBadge(item)}</td>
             <td className="text-end">{formatCurrency(item.unitPrice)}</td>
             <td className="text-end">{formatCurrency(item.labourCharge)}</td>
             <td className="text-center">
                  <Dropdown align="end">
                    <Dropdown.Toggle variant="link" size="sm" bsPrefix="p-0" className="action-toggle-table">
                        <FaEllipsisV />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={() => showModal('edit', item)}><FaEdit className="me-2"/> Edit</Dropdown.Item>
                        <Dropdown.Item onClick={() => handleDeleteItem(item.id, item.name)} className="text-danger"><FaTrashAlt className="me-2"/> Delete</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
             </td>
         </tr>
     );

    // --- Main Render ---
    return (
        <Container fluid className="py-4 px-md-4 stock-management-page">
            {/* Page Header */}
            <Row className="mb-3 align-items-center page-header-row">
                <Col>
                    <h2 className="page-title mb-0"><FaBox className="me-2"/>Stock Management</h2>
                </Col>
                <Col xs="auto">
                     <Button variant="primary" onClick={() => showModal('add')} className="add-item-btn">
                        <FaPlus className="me-1" /> Add New Item
                    </Button>
                </Col>
            </Row>

             {/* Tabs for Navigation */}
             <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                id="stock-tabs"
                className="mb-3 stock-nav-tabs"
                fill
             >
                <Tab eventKey="inventory" title={<><FaClipboardList className="me-1"/> Full Inventory ({filteredItems.length})</>}>
                    <Card className="shadow-sm inventory-card">
                        <Card.Header className="inventory-controls">
                            <Row className="g-2 align-items-center">
                                <Col md={6} lg={7}>
                                    <InputGroup size="sm">
                                        <InputGroup.Text><FaSearch /></InputGroup.Text>
                                        <Form.Control
                                            placeholder="Search by Item Name or Part No..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </InputGroup>
                                </Col>
                                <Col md={6} lg={5}>
                                    <InputGroup size="sm">
                                        <InputGroup.Text><FaFilter /></InputGroup.Text>
                                        <Form.Select value={filterType} onChange={e => setFilterType(e.target.value)}>
                                            <option value="">All Item Types</option>
                                            <option value="Spare">Spares Only</option>
                                            <option value="Service">Services Only</option>
                                        </Form.Select>
                                    </InputGroup>
                                </Col>
                            </Row>
                        </Card.Header>
                        <Card.Body className="p-0">
                             <div className="table-responsive inventory-table-wrapper">
                                <Table striped hover responsive className="mb-0 inventory-table">
                                     <thead className="sticky-top inventory-table-header">
                                        <tr>
                                            <th>Part No.</th>
                                            <th>Item Name & Type</th>
                                            <th className="text-center">Stock Qty</th>
                                            <th className="text-end">Unit Price</th>
                                            <th className="text-end">Labour Chg</th>
                                            <th className="text-center">Actions</th>
                                         </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading ? (
                                            <tr><td colSpan="6" className="text-center p-5"><Spinner animation="border" size="sm" /> Loading Inventory...</td></tr>
                                        ) : filteredItems.length === 0 ? (
                                            <tr><td colSpan="6" className="text-center text-muted p-5"><FaInfoCircle className="me-1"/> No items match your criteria.</td></tr>
                                         ) : (
                                             filteredItems.map(renderInventoryRow)
                                         )}
                                    </tbody>
                                </Table>
                            </div>
                         </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="lowStock" title={
                    <span className="d-flex align-items-center">
                        <FaExclamationTriangle className="me-1 text-warning"/> Low Stock
                        {lowStockItems.length > 0 && <Badge pill bg="danger" className="ms-2">{lowStockItems.length}</Badge>}
                    </span>
                    }>
                     <Card className="shadow-sm low-stock-card">
                         <Card.Header className="low-stock-header">
                             <FaExclamationTriangle className="me-2 text-warning"/> Items Below Threshold ({LOW_STOCK_THRESHOLD} units)
                         </Card.Header>
                         <Card.Body className="p-0">
                            <div className="table-responsive low-stock-table-wrapper">
                                 <Table striped hover className="mb-0 low-stock-table">
                                      <thead>
                                         <tr>
                                            <th>Part No.</th>
                                            <th>Item Name</th>
                                            <th className="text-center">Current Stock</th>
                                            <th className="text-end">Unit Price</th>
                                            <th className="text-center">Actions</th>
                                         </tr>
                                     </thead>
                                     <tbody>
                                         {isLoading ? (
                                             <tr><td colSpan="5" className="text-center p-5"><Spinner animation="border" size="sm" /> Loading...</td></tr>
                                         ): lowStockItems.length === 0 ? (
                                             <tr><td colSpan="5" className="text-center text-muted p-4"><FaCheckCircle className="me-1 text-success"/> All spare items are sufficiently stocked.</td></tr>
                                         ) : (
                                             lowStockItems.map(item => ( // Reuse row rendering logic maybe? Simplified here
                                                 <tr key={item.id}>
                                                     <td>{item.partNo || '-'}</td>
                                                     <td>{item.name}</td>
                                                     <td className="text-center fw-bold text-danger">{item.stockQty}</td>
                                                     <td className="text-end">{formatCurrency(item.unitPrice)}</td>
                                                     <td className="text-center">
                                                        <Button variant="outline-primary" size="sm" onClick={() => showModal('edit', item)} title="Edit Item">
                                                            <FaEdit />
                                                        </Button>
                                                        {/* Optionally add order button */}
                                                     </td>
                                                 </tr>
                                             ))
                                         )}
                                     </tbody>
                                 </Table>
                             </div>
                         </Card.Body>
                     </Card>
                 </Tab>
             </Tabs>

             {/* --- Add/Edit Modal --- */}
              <Modal show={modalState.show} onHide={closeModal} centered size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>
                            {modalState.type === 'add' ? <><FaPlus className="me-2" />Add New Master Item</> : <><FaEdit className="me-2" />Edit Item {modalState.data?.name}</>}
                         </Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={modalState.type === 'add' ? handleAddItemSubmit : handleEditItemSubmit}>
                        <Modal.Body>
                            {formError && <Alert variant="danger" size="sm" onClose={() => setFormError('')} dismissible>{formError}</Alert>}
                             <Row>
                                <Col md={8}>
                                    <Form.Group className="mb-3"><Form.Label>Item Name*</Form.Label><Form.Control size="sm" type="text" name="name" value={formData.name || ''} onChange={handleFormChange} required /></Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3"><Form.Label>Part No.</Form.Label><Form.Control size="sm" type="text" name="partNo" value={formData.partNo || ''} onChange={handleFormChange} placeholder="Optional unique code"/></Form.Group>
                                </Col>
                            </Row>
                             <Row>
                                 <Col md={4}>
                                    <Form.Group className="mb-3"><Form.Label>Item Type*</Form.Label>
                                        <Form.Select size="sm" name="type" value={formData.type || 'Spare'} onChange={handleFormChange} required>
                                             <option value="Spare">Spare Part</option>
                                             <option value="Service">Service</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                     <Form.Group className="mb-3"><Form.Label>Unit Price (Sale)</Form.Label><Form.Control size="sm" type="number" step="0.01" name="unitPrice" value={formData.unitPrice || ''} onChange={handleFormChange} placeholder="e.g., 450.00"/></Form.Group>
                                 </Col>
                                 <Col md={4}>
                                     {/* Conditionally Render Stock Qty */}
                                    {formData.type === 'Spare' && (
                                        <Form.Group className="mb-3"><Form.Label>Current Stock Qty</Form.Label><Form.Control size="sm" type="number" name="stockQty" value={formData.stockQty || ''} onChange={handleFormChange} placeholder="e.g., 25"/></Form.Group>
                                     )}
                                 </Col>
                             </Row>
                             <Row>
                                 <Col md={6}>
                                     <Form.Group className="mb-3"><Form.Label>Default Lube Charge</Form.Label><Form.Control size="sm" type="number" step="0.01" name="lubeCharge" value={formData.lubeCharge || ''} onChange={handleFormChange} placeholder="If applicable (e.g., 50.00)"/></Form.Group>
                                 </Col>
                                 <Col md={6}>
                                     <Form.Group className="mb-3"><Form.Label>Default Labour Charge</Form.Label><Form.Control size="sm" type="number" step="0.01" name="labourCharge" value={formData.labourCharge || ''} onChange={handleFormChange} placeholder="If applicable (e.g., 150.00)"/></Form.Group>
                                 </Col>
                             </Row>
                              <small className="text-muted">* Required fields</small>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="outline-secondary" onClick={closeModal}>Cancel</Button>
                            <Button variant="primary" type="submit" className="px-4">
                                {modalState.type === 'add' ? <><FaPlus className="me-1"/> Add Item</> : <><FaEdit className="me-1"/> Save Changes</>}
                            </Button>
                        </Modal.Footer>
                    </Form>
               </Modal>

        </Container>
    );
};

export default StockManagementPage;