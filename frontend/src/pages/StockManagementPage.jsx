import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Button, InputGroup, Form, Modal, Alert, Badge, Dropdown, Tabs, Tab, Table, Spinner } from 'react-bootstrap';
import {
    FaBox, FaPlus, FaEdit, FaTrashAlt, FaClipboardList, FaEllipsisV, FaSearch, FaFilter, FaExclamationTriangle, FaCheckCircle, FaCube, FaTools, FaInfoCircle, FaQuestionCircle, FaTimesCircle
} from 'react-icons/fa';

import api from '../api/api'; 
import useDebounce from '../hooks/useDebounce';
import { validateNumber, sanitizeString } from '../utils/validators';
import SaaSDataPagination from '../components/ui/SaaSDataPagination';
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
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
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

    const [isModuleLocked, setIsModuleLocked] = useState(false);

    // --- Data Fetching ---
    const fetchMasterItems = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/master-items');
            if (response.ok) {
                const data = await response.json();
                setMasterItems(data);
                setIsModuleLocked(false);
            } else if (response.status === 403) {
                setIsModuleLocked(true);
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
            const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
            const matchesSearch = !debouncedSearchTerm ||
                (item.name && item.name.toLowerCase().includes(lowerSearchTerm)) ||
                (item.partNo && item.partNo.toLowerCase().includes(lowerSearchTerm));
            const matchesType = !filterType || item.type === filterType;
            return matchesSearch && matchesType;
        });
    }, [debouncedSearchTerm, filterType, masterItems, isLoading]);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredItems.slice(start, start + pageSize);
    }, [filteredItems, currentPage, pageSize]);

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

    // Helper validation for item payload
    const validateItemPayload = (data) => {
        if (!data.name || !data.name.trim()) return "Item Name is required.";
        if (!data.type) return "Item Type is required.";
        
        if (data.unitPrice !== '' && data.unitPrice !== undefined && Number(data.unitPrice) < 0) {
            return "Unit Price cannot be negative.";
        }
        if (data.lubeCharge !== '' && data.lubeCharge !== undefined && Number(data.lubeCharge) < 0) {
            return "Lube Charge cannot be negative.";
        }
        if (data.labourCharge !== '' && data.labourCharge !== undefined && Number(data.labourCharge) < 0) {
            return "Labour Charge cannot be negative.";
        }
        if (data.type === 'Spare' && data.stockQty !== '' && data.stockQty !== undefined && Number(data.stockQty) < 0) {
            return "Stock Quantity cannot be negative.";
        }
        return null;
    };

    // --- CRUD Operations ---
    const handleAddItemSubmit = async (e) => {
        e.preventDefault();
        const validationErr = validateItemPayload(formData);
        if (validationErr) { setFormError(validationErr); return; }
        setFormError('');
        
        const payload = {
            ...formData,
            name: sanitizeString(formData.name),
            partNo: sanitizeString(formData.partNo) || null,
            unitPrice: formData.unitPrice === '' ? 0 : Number(formData.unitPrice),
            lubeCharge: formData.lubeCharge === '' ? 0 : Number(formData.lubeCharge),
            labourCharge: formData.labourCharge === '' ? 0 : Number(formData.labourCharge),
            stockQty: formData.type === 'Spare' ? (formData.stockQty === '' ? 0 : Number(formData.stockQty)) : null
        };

        try {
            const response = await api.post('/master-items', payload);
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
        const validationErr = validateItemPayload(formData);
        if (validationErr) { setFormError(validationErr); return; }
        setFormError('');

        const payload = {
            ...formData,
            name: sanitizeString(formData.name),
            partNo: sanitizeString(formData.partNo) || null,
            unitPrice: formData.unitPrice === '' ? 0 : Number(formData.unitPrice),
            lubeCharge: formData.lubeCharge === '' ? 0 : Number(formData.lubeCharge),
            labourCharge: formData.labourCharge === '' ? 0 : Number(formData.labourCharge),
            stockQty: formData.type === 'Spare' ? (formData.stockQty === '' ? 0 : Number(formData.stockQty)) : null
        };

        try {
            const response = await api.put(`/master-items/${modalState.data.id}`, payload);
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
        <Container fluid className="py-4">
            <div className="page-header-row mb-4 d-flex justify-content-between align-items-center">
                <h2 className="page-title-active mb-0">
                    <FaBox className="me-2 text-primary"/> Stock Management
                </h2>
                {!isModuleLocked ? (
                    <Button variant="primary" onClick={() => showModal('add')} className="shadow-sm d-flex align-items-center">
                        <FaPlus className="me-2" /> Add New Item
                    </Button>
                ) : (
                    <span className="badge bg-warning text-dark px-3 py-2 rounded-pill fw-bold d-inline-flex align-items-center" style={{ fontSize: '13px' }}>
                        🔒 Read-Only Mode (Locked by Admin)
                    </span>
                )}
            </div>

            {isModuleLocked && (
                <Alert variant="warning" className="d-flex align-items-center mb-4 shadow-sm border-0 rounded-3" style={{ backgroundColor: '#fffbe6', borderLeft: '4px solid #f59e0b' }}>
                    <FaExclamationTriangle className="fs-4 me-3 text-warning flex-shrink-0" />
                    <div>
                        <strong className="d-block text-dark fw-bold">Stock & Inventory Locked in Read-Only Mode</strong>
                        <span className="small text-muted">You can search and view all master stock items and pricing in Read-Only Mode. Adding new items, modifying stock quantities, or deleting items is locked by Super Admin.</span>
                    </div>
                </Alert>
            )}

             <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} id="stock-tabs" className="mb-4 stock-nav-tabs">
                
                {/* INVENTORY TAB */}
                <Tab eventKey="inventory" title={<><FaClipboardList className="me-2"/> Full Inventory ({filteredItems.length})</>}>
                    <div className="main-content pt-0">
                        <Card className="mb-4 shadow-sm border-0 saas-card">
                            <Card.Body>
                                <Row className="g-3 align-items-center">
                                    <Col md={5} lg={4}>
                                        <div className="saas-search-pill d-flex align-items-center bg-light rounded-pill px-3 py-2 border">
                                            <FaSearch className="text-muted me-2" />
                                            <Form.Control
                                                className="border-0 shadow-none bg-transparent p-0"
                                                placeholder="Search by Item Name or Part No..."
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </Col>
                                    <Col md={3} lg={3}>
                                        <Form.Select 
                                            className="saas-select shadow-none border-light rounded-3 bg-light"
                                            value={filterType} 
                                            onChange={e => setFilterType(e.target.value)}
                                        >
                                            <option value="">All Item Types</option>
                                            <option value="Spare">Spares Only</option>
                                            <option value="Service">Services Only</option>
                                        </Form.Select>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        <div className="saas-table-wrapper shadow-sm bg-white rounded-4 overflow-hidden border border-light">
                            {isLoading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="mt-2 text-muted">Loading Inventory...</p>
                                </div>
                            ) : (
                                <table className="saas-table w-100">
                                    <thead>
                                        <tr>
                                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold" style={{ width: '40px' }}>#</th>
                                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold">Part No.</th>
                                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold">Item Name & Type</th>
                                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold text-center">Stock Qty</th>
                                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold text-end">Unit Price</th>
                                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold text-end">Lube Chg</th>
                                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold text-end">Labour Chg</th>
                                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold text-center">Actions</th>
                                         </tr>
                                    </thead>
                                    <tbody>
                                        {filteredItems.length === 0 ? (
                                            <tr><td colSpan="8" className="text-center text-muted py-5"><FaInfoCircle className="me-1"/> No items match your criteria.</td></tr>
                                         ) : (
                                             filteredItems.map((item, index) => (
                                                <tr key={item.id} className={`align-middle border-bottom border-light ${item.type === 'Spare' && item.stockQty < LOW_STOCK_THRESHOLD && item.stockQty > 0 ? 'bg-warning bg-opacity-10' : ''}`}>
                                                    <td className="px-4 py-3 text-muted fw-bold">{index + 1}</td>
                                                    <td className="px-4 py-3 fw-medium text-dark">{item.partNo || '-'}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="fw-bold text-dark">{item.name}</div>
                                                        <span className={`saas-badge ${item.type === 'Spare' ? 'saas-badge-info' : 'saas-badge-secondary'} mt-1`}>
                                                            {item.type === 'Spare' ? <FaCube className="me-1"/> : <FaTools className="me-1"/>} {item.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">{renderStockBadge(item)}</td>
                                                    <td className="px-4 py-3 text-end fw-medium">{formatCurrency(item.unitPrice)}</td>
                                                    <td className="px-4 py-3 text-end text-secondary">{formatCurrency(item.lubeCharge)}</td>
                                                    <td className="px-4 py-3 text-end text-secondary">{formatCurrency(item.labourCharge)}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="d-flex justify-content-center gap-3">
                                                            <button className="btn btn-link text-primary p-0 border-0 hover-primary" onClick={() => showModal('edit', item)} title="Edit">
                                                                <FaEdit size={18} />
                                                            </button>
                                                            <button className="btn btn-link text-danger p-0 border-0 hover-danger" onClick={() => handleDeleteClick(item.id, item.name)} title="Delete">
                                                                <FaTrashAlt size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                             ))
                                         )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </Tab>

                {/* LOW STOCK TAB */}
                <Tab eventKey="lowStock" title={
                    <span className="d-flex align-items-center justify-content-center text-danger fw-medium">
                        <FaExclamationTriangle className="me-2"/> Low Stock
                        {lowStockItems.length > 0 && <span className="badge bg-danger ms-2 rounded-pill">{lowStockItems.length}</span>}
                    </span>
                    }>
                     <div className="main-content pt-0">
                        <div className="saas-table-wrapper shadow-sm bg-white rounded-4 overflow-hidden border border-light mt-4">
                            <div className="bg-danger bg-opacity-10 px-4 py-3 border-bottom border-danger border-opacity-25 d-flex align-items-center">
                                <FaExclamationTriangle className="text-danger me-2 fs-5" />
                                <strong className="text-danger">Items Below Threshold ({LOW_STOCK_THRESHOLD} units)</strong>
                            </div>
                            
                            {isLoading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="danger" />
                                    <p className="mt-2 text-muted">Loading...</p>
                                </div>
                            ) : (
                                <table className="saas-table w-100">
                                    <thead>
                                         <tr>
                                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold" style={{ width: '40px' }}>#</th>
                                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold">Part No.</th>
                                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold">Item Name</th>
                                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold text-center">Current Stock</th>
                                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold text-end">Unit Price</th>
                                            <th className="py-3 px-4 text-uppercase text-secondary small fw-bold text-center">Actions</th>
                                         </tr>
                                     </thead>
                                     <tbody>
                                         {lowStockItems.length === 0 ? (
                                             <tr><td colSpan="6" className="text-center text-muted py-5"><FaCheckCircle className="me-2 text-success fs-4 align-middle"/> All spare items are sufficiently stocked.</td></tr>
                                         ) : (
                                             lowStockItems.map((item, index) => ( 
                                                 <tr key={item.id} className="align-middle border-bottom border-light">
                                                     <td className="px-4 py-3 text-muted fw-bold">{index + 1}</td>
                                                     <td className="px-4 py-3 fw-medium text-dark">{item.partNo || '-'}</td>
                                                     <td className="px-4 py-3 fw-bold text-dark">{item.name}</td>
                                                     <td className="px-4 py-3 text-center fw-bold text-danger fs-5">{item.stockQty}</td>
                                                     <td className="px-4 py-3 text-end fw-medium">{formatCurrency(item.unitPrice)}</td>
                                                     <td className="px-4 py-3 text-center">
                                                        <button className="btn btn-link text-primary p-0 border-0 hover-primary" onClick={() => showModal('edit', item)} title="Edit Item">
                                                            <FaEdit size={18} />
                                                        </button>
                                                     </td>
                                                 </tr>
                                             ))
                                         )}
                                     </tbody>
                                 </table>
                            )}
                        </div>
                     </div>
                 </Tab>
             </Tabs>

             {/* --- Add/Edit Form Modal --- */}
              <Modal show={modalState.show} onHide={closeModal} centered size="lg" className="saas-modal">
                    <Modal.Header closeButton className="border-0 pb-0">
                        <Modal.Title className="h5 fw-bold text-dark d-flex align-items-center">
                            {modalState.type === 'add' ? <><FaPlus className="me-2 text-primary" />Add New Master Item</> : <><FaEdit className="me-2 text-primary" />Edit Item: {modalState.data?.name}</>}
                         </Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={modalState.type === 'add' ? handleAddItemSubmit : handleEditItemSubmit}>
                        <Modal.Body className="py-4">
                            {formError && <Alert variant="danger" size="sm" onClose={() => setFormError('')} dismissible>{formError}</Alert>}
                             <Row className="g-3 mb-3">
                                <Col md={8}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold text-dark small">Item Name*</Form.Label>
                                        <Form.Control className="shadow-none border-light bg-light" type="text" name="name" value={formData.name || ''} onChange={handleFormChange} required />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold text-dark small">Part No.</Form.Label>
                                        <Form.Control className="shadow-none border-light bg-light" type="text" name="partNo" value={formData.partNo || ''} onChange={handleFormChange} placeholder="Optional code"/>
                                    </Form.Group>
                                </Col>
                            </Row>
                             <Row className="g-3 mb-3">
                                 <Col md={4}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold text-dark small">Item Type*</Form.Label>
                                        <Form.Select className="shadow-none border-light bg-light" name="type" value={formData.type || 'Spare'} onChange={handleFormChange} required>
                                             <option value="Spare">Spare Part</option>
                                             <option value="Service">Service</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                     <Form.Group>
                                         <Form.Label className="fw-semibold text-dark small">Unit Price (Sale)</Form.Label>
                                         <Form.Control className="shadow-none border-light bg-light" type="number" step="0.01" name="unitPrice" value={formData.unitPrice || ''} onChange={handleFormChange} placeholder="e.g., 450.00"/>
                                     </Form.Group>
                                 </Col>
                                 <Col md={4}>
                                    {formData.type === 'Spare' && (
                                        <Form.Group>
                                            <Form.Label className="fw-semibold text-dark small">Current Stock Qty</Form.Label>
                                            <Form.Control className="shadow-none border-light bg-light" type="number" name="stockQty" value={formData.stockQty || ''} onChange={handleFormChange} placeholder="e.g., 25"/>
                                        </Form.Group>
                                     )}
                                 </Col>
                             </Row>
                             <Row className="g-3 mb-4">
                                 <Col md={6}>
                                     <Form.Group>
                                         <Form.Label className="fw-semibold text-dark small">Default Lube Charge</Form.Label>
                                         <Form.Control className="shadow-none border-light bg-light" type="number" step="0.01" name="lubeCharge" value={formData.lubeCharge || ''} onChange={handleFormChange} placeholder="If applicable"/>
                                     </Form.Group>
                                 </Col>
                                 <Col md={6}>
                                     <Form.Group>
                                         <Form.Label className="fw-semibold text-dark small">Default Labour Charge</Form.Label>
                                         <Form.Control className="shadow-none border-light bg-light" type="number" step="0.01" name="labourCharge" value={formData.labourCharge || ''} onChange={handleFormChange} placeholder="If applicable"/>
                                     </Form.Group>
                                 </Col>
                             </Row>
                              <div className="text-muted small">* Required fields</div>
                        </Modal.Body>
                        <Modal.Footer className="border-0 pt-0">
                            <Button variant="light" onClick={closeModal}>Cancel</Button>
                            <Button variant="primary" type="submit" className="px-4 d-flex align-items-center">
                                {modalState.type === 'add' ? <><FaPlus className="me-2"/> Add Item</> : <><FaEdit className="me-2"/> Save Changes</>}
                            </Button>
                        </Modal.Footer>
                    </Form>
               </Modal>

               {/* --- Universal Custom Alert & Confirmation Modal --- */}
               <Modal show={alertModal.show} onHide={closeAlert} centered backdrop="static" keyboard={false} className="saas-modal">
                    <Modal.Header closeButton className="border-0 pb-0">
                        <Modal.Title className={`h5 fw-bold d-flex align-items-center ${alertModal.type === 'error' ? 'text-danger' : alertModal.type === 'confirm' ? 'text-warning' : 'text-success'}`}>
                            {alertModal.type === 'error' && <FaTimesCircle className="me-2" />}
                            {alertModal.type === 'success' && <FaCheckCircle className="me-2" />}
                            {alertModal.type === 'confirm' && <FaQuestionCircle className="me-2" />}
                            {alertModal.type === 'error' ? 'Error' : alertModal.type === 'confirm' ? 'Confirmation' : 'Success'}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="py-4">
                        <p className="mb-0 fs-6 text-secondary" style={{ whiteSpace: 'pre-line' }}>{alertModal.message}</p>
                    </Modal.Body>
                    <Modal.Footer className="border-0 pt-0">
                        {alertModal.type === 'confirm' ? (
                            <>
                                <Button variant="light" onClick={closeAlert}>Cancel</Button>
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