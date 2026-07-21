import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Button, InputGroup, Form, Modal, Alert, Badge, Dropdown, Tabs, Tab, Table, Spinner } from 'react-bootstrap';
import {
    FaBox, FaPlus, FaEdit, FaTrashAlt, FaClipboardList, FaEllipsisV, FaSearch, FaFilter, FaExclamationTriangle, FaCheckCircle, FaCube, FaTools, FaInfoCircle, FaQuestionCircle, FaTimesCircle
} from 'react-icons/fa';

import api from '../api/api'; 
import '../App.css'; 
import '../StockManagementPage.css'; 

const LOW_STOCK_THRESHOLD = 10;

const formatCurrency = (amount) => {
    if (amount == null || isNaN(Number(amount))) {
        return 'N/A'; 
    }
    return Number(amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const StockManagementPage = () => {
    // --- State ---
    const [masterItems, setMasterItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('inventory'); 
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState(''); 

    // Item Form Modal State
    const [modalState, setModalState] = useState({ type: null, data: null, show: false }); 
    const [formData, setFormData] = useState({});
    const [formError, setFormError] = useState('');

    // Universal Custom Alert/Confirm Modal State
    const [alertModal, setAlertModal] = useState({
        show: false,
        type: 'success', // 'success', 'error', 'confirm'
        message: '',
        confirmAction: null // Function to execute if user clicks "Yes" on confirm
    });

    const showAlert = (type, message, confirmAction = null) => {
        setAlertModal({ show: true, type, message, confirmAction });
    };

    const closeAlert = () => {
        setAlertModal({ ...alertModal, show: false });
    };

    // --- Data Fetching ---
    const fetchMasterItems = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/master-items');
            if (response.ok) {
                const data = await response.json();
                setMasterItems(data);
            } else {
                console.error("Failed to fetch master items");
            }
        } catch (error) {
            console.error("Error loading master items:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMasterItems();
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


    // --- Form Modal Management ---
    const showModal = (type, data = null) => {
        setFormError('');
        let initialFormData = {};
        if (type === 'add') {
            initialFormData = { name: '', partNo: '', type: 'Spare', unitPrice: '', lubeCharge: '', labourCharge: '', stockQty: '' };
        } else if (type === 'edit' && data) {
            initialFormData = { ...data, 
                unitPrice: data.unitPrice ?? '',
                lubeCharge: data.lubeCharge ?? '',
                labourCharge: data.labourCharge ?? '',
                stockQty: data.stockQty ?? '' 
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

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'type' && value === 'Service') {
            setFormData(prev => ({ ...prev, stockQty: '' })); 
        }
    };

    // --- CRUD Operations ---
    const handleAddItemSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.type) { setFormError("Item Name and Type are required."); return; }
        setFormError('');
        
        try {
            const response = await api.post('/master-items', formData);
            const data = await response.json();

            if (response.ok) {
                await fetchMasterItems(); 
                closeModal();
                showAlert('success', `${data.name || formData.name} added successfully.`);
            } else {
                setFormError(data.message || "Error adding item. Part No might already exist.");
            }
        } catch (error) {
            setFormError("Server error while connecting to the database.");
        }
    };

    const handleEditItemSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.type) { setFormError("Item Name and Type are required."); return; }
        setFormError('');

        try {
            const response = await api.put(`/master-items/${modalState.data.id}`, formData);
            const data = await response.json();

            if (response.ok) {
                await fetchMasterItems(); 
                closeModal();
                showAlert('success', `${data.name || formData.name} updated successfully.`);
            } else {
                setFormError(data.message || "Error updating item. Part No might already exist.");
            }
        } catch (error) {
            setFormError("Server error while updating the item.");
        }
    };

    // Triggered when user clicks delete in dropdown
    const handleDeleteClick = (itemId, itemName) => {
        showAlert('confirm', `Are you sure you want to delete "${itemName}"?\nThis cannot be undone and might affect historical data.`, () => executeDelete(itemId, itemName));
    };

    // Actually performs the deletion after confirmation
    const executeDelete = async (itemId, itemName) => {
        closeAlert(); // close confirm dialog
        try {
            const response = await api.delete(`/master-items/${itemId}`);
            const data = await response.json();

            if (response.ok) {
                await fetchMasterItems(); 
                showAlert('success', `"${itemName}" deleted successfully.`);
            } else {
                showAlert('error', data.message || `Error deleting "${itemName}". It might be in use.`);
            }
        } catch (error) {
            showAlert('error', "Server error during deletion.");
        }
    };

    // --- Render Helpers ---
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

    const renderInventoryRow = (item, index) => (
         <tr key={item.id} className={item.type === 'Spare' && item.stockQty < LOW_STOCK_THRESHOLD && item.stockQty > 0 ? 'table-warning' : ''}>
            <td className="text-muted fw-bold align-middle">{index + 1}</td>
            <td className="align-middle">
                 <span className="item-partno">{item.partNo || '-'}</span>
            </td>
            <td>
                 <div className="item-name">{item.name}</div>
                 <Badge pill bg={item.type === 'Spare' ? 'info' : 'secondary'} className="item-type-badge">
                     {item.type === 'Spare' ? <FaCube/> : <FaTools/>} {item.type}
                 </Badge>
            </td>
             <td className="text-center align-middle">{renderStockBadge(item)}</td>
             <td className="text-end align-middle">{formatCurrency(item.unitPrice)}</td>
             <td className="text-end align-middle">{formatCurrency(item.lubeCharge)}</td>
             <td className="text-end align-middle">{formatCurrency(item.labourCharge)}</td>
             <td className="text-center align-middle">
                  <Dropdown align="end">
                    <Dropdown.Toggle variant="link" size="sm" bsPrefix="p-0" className="action-toggle-table">
                        <FaEllipsisV />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={() => showModal('edit', item)}><FaEdit className="me-2"/> Edit</Dropdown.Item>
                        <Dropdown.Item onClick={() => handleDeleteClick(item.id, item.name)} className="text-danger"><FaTrashAlt className="me-2"/> Delete</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
             </td>
         </tr>
     );

    // --- Main Render ---
    return (
        <Container fluid className="py-4 px-md-4 stock-management-page">
            <Row className="mb-3 align-items-center page-header-row">
                <Col>
                    <h2 className="page-title mb-0"><FaBox className="me-2"/>Stock Management</h2>
                </Col>
                <Col xs="auto">
                     <Button variant="primary" onClick={() => showModal('add')} className="add-item-btn shadow-sm">
                        <FaPlus className="me-1" /> Add New Item
                    </Button>
                </Col>
            </Row>

             <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} id="stock-tabs" className="mb-3 stock-nav-tabs" fill>
                
                {/* INVENTORY TAB */}
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
                                <Table striped hover responsive className="mb-0 inventory-table align-middle">
                                     <thead className="sticky-top inventory-table-header">
                                        <tr>
                                            <th style={{ width: '40px' }}>#</th>
                                            <th>Part No.</th>
                                            <th>Item Name & Type</th>
                                            <th className="text-center">Stock Qty</th>
                                            <th className="text-end">Unit Price</th>
                                            <th className="text-end">Lube Chg</th>
                                            <th className="text-end">Labour Chg</th>
                                            <th className="text-center">Actions</th>
                                         </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading ? (
                                            <tr><td colSpan="8" className="text-center p-5"><Spinner animation="border" size="sm" className="me-2" /> Loading Inventory...</td></tr>
                                        ) : filteredItems.length === 0 ? (
                                            <tr><td colSpan="8" className="text-center text-muted p-5"><FaInfoCircle className="me-1"/> No items match your criteria.</td></tr>
                                         ) : (
                                             filteredItems.map((item, index) => renderInventoryRow(item, index))
                                         )}
                                    </tbody>
                                </Table>
                            </div>
                         </Card.Body>
                    </Card>
                </Tab>

                {/* LOW STOCK TAB */}
                <Tab eventKey="lowStock" title={
                    <span className="d-flex align-items-center justify-content-center">
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
                                 <Table striped hover className="mb-0 low-stock-table align-middle">
                                      <thead>
                                         <tr>
                                            <th style={{ width: '40px' }}>#</th>
                                            <th>Part No.</th>
                                            <th>Item Name</th>
                                            <th className="text-center">Current Stock</th>
                                            <th className="text-end">Unit Price</th>
                                            <th className="text-center">Actions</th>
                                         </tr>
                                     </thead>
                                     <tbody>
                                         {isLoading ? (
                                             <tr><td colSpan="6" className="text-center p-5"><Spinner animation="border" size="sm" className="me-2" /> Loading...</td></tr>
                                         ): lowStockItems.length === 0 ? (
                                             <tr><td colSpan="6" className="text-center text-muted p-4"><FaCheckCircle className="me-1 text-success"/> All spare items are sufficiently stocked.</td></tr>
                                         ) : (
                                             lowStockItems.map((item, index) => ( 
                                                 <tr key={item.id}>
                                                     <td className="text-muted fw-bold">{index + 1}</td>
                                                     <td>{item.partNo || '-'}</td>
                                                     <td>{item.name}</td>
                                                     <td className="text-center fw-bold text-danger">{item.stockQty}</td>
                                                     <td className="text-end">{formatCurrency(item.unitPrice)}</td>
                                                     <td className="text-center">
                                                        <Button variant="outline-primary" size="sm" onClick={() => showModal('edit', item)} title="Edit Item">
                                                            <FaEdit />
                                                        </Button>
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

             {/* --- Add/Edit Form Modal --- */}
              <Modal show={modalState.show} onHide={closeModal} centered size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title className="fs-5">
                            {modalState.type === 'add' ? <><FaPlus className="me-2 text-primary" />Add New Master Item</> : <><FaEdit className="me-2 text-primary" />Edit Item: {modalState.data?.name}</>}
                         </Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={modalState.type === 'add' ? handleAddItemSubmit : handleEditItemSubmit}>
                        <Modal.Body>
                            {formError && <Alert variant="danger" size="sm" onClose={() => setFormError('')} dismissible>{formError}</Alert>}
                             <Row>
                                <Col md={8}>
                                    <Form.Group className="mb-3"><Form.Label className="fw-semibold">Item Name*</Form.Label><Form.Control size="sm" type="text" name="name" value={formData.name || ''} onChange={handleFormChange} required /></Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3"><Form.Label className="fw-semibold">Part No.</Form.Label><Form.Control size="sm" type="text" name="partNo" value={formData.partNo || ''} onChange={handleFormChange} placeholder="Optional code"/></Form.Group>
                                </Col>
                            </Row>
                             <Row>
                                 <Col md={4}>
                                    <Form.Group className="mb-3"><Form.Label className="fw-semibold">Item Type*</Form.Label>
                                        <Form.Select size="sm" name="type" value={formData.type || 'Spare'} onChange={handleFormChange} required>
                                             <option value="Spare">Spare Part</option>
                                             <option value="Service">Service</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                     <Form.Group className="mb-3"><Form.Label className="fw-semibold">Unit Price (Sale)</Form.Label><Form.Control size="sm" type="number" step="0.01" name="unitPrice" value={formData.unitPrice || ''} onChange={handleFormChange} placeholder="e.g., 450.00"/></Form.Group>
                                 </Col>
                                 <Col md={4}>
                                    {formData.type === 'Spare' && (
                                        <Form.Group className="mb-3"><Form.Label className="fw-semibold">Current Stock Qty</Form.Label><Form.Control size="sm" type="number" name="stockQty" value={formData.stockQty || ''} onChange={handleFormChange} placeholder="e.g., 25"/></Form.Group>
                                     )}
                                 </Col>
                             </Row>
                             <Row>
                                 <Col md={6}>
                                     <Form.Group className="mb-3"><Form.Label className="fw-semibold">Default Lube Charge</Form.Label><Form.Control size="sm" type="number" step="0.01" name="lubeCharge" value={formData.lubeCharge || ''} onChange={handleFormChange} placeholder="If applicable"/></Form.Group>
                                 </Col>
                                 <Col md={6}>
                                     <Form.Group className="mb-3"><Form.Label className="fw-semibold">Default Labour Charge</Form.Label><Form.Control size="sm" type="number" step="0.01" name="labourCharge" value={formData.labourCharge || ''} onChange={handleFormChange} placeholder="If applicable"/></Form.Group>
                                 </Col>
                             </Row>
                              <small className="text-muted">* Required fields</small>
                        </Modal.Body>
                        <Modal.Footer className="bg-light">
                            <Button variant="outline-secondary" onClick={closeModal}>Cancel</Button>
                            <Button variant="primary" type="submit" className="px-4">
                                {modalState.type === 'add' ? <><FaPlus className="me-1"/> Add Item</> : <><FaEdit className="me-1"/> Save Changes</>}
                            </Button>
                        </Modal.Footer>
                    </Form>
               </Modal>

               {/* --- Universal Custom Alert & Confirmation Modal --- */}
               <Modal show={alertModal.show} onHide={closeAlert} centered backdrop="static" keyboard={false}>
                    <Modal.Header closeButton className={`text-white ${alertModal.type === 'error' ? 'bg-danger' : alertModal.type === 'confirm' ? 'bg-warning text-dark' : 'bg-success'}`}>
                        <Modal.Title className="fs-5 d-flex align-items-center">
                            {alertModal.type === 'error' && <FaTimesCircle className="me-2" />}
                            {alertModal.type === 'success' && <FaCheckCircle className="me-2" />}
                            {alertModal.type === 'confirm' && <FaQuestionCircle className="me-2" />}
                            {alertModal.type === 'error' ? 'Error' : alertModal.type === 'confirm' ? 'Confirmation' : 'Success'}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="py-4">
                        <p className="mb-0 fs-6" style={{ whiteSpace: 'pre-line' }}>{alertModal.message}</p>
                    </Modal.Body>
                    <Modal.Footer className="bg-light">
                        {alertModal.type === 'confirm' ? (
                            <>
                                <Button variant="outline-secondary" onClick={closeAlert}>Cancel</Button>
                                <Button variant="danger" className="px-4" onClick={alertModal.confirmAction}>Yes, Delete</Button>
                            </>
                        ) : (
                            <Button variant={alertModal.type === 'error' ? 'danger' : 'success'} className="px-4" onClick={closeAlert}>OK</Button>
                        )}
                    </Modal.Footer>
               </Modal>

        </Container>
    );
};

export default StockManagementPage;