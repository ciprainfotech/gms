import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, InputGroup, Table, Alert, Spinner, Badge, Modal } from 'react-bootstrap';
import { FaFileInvoiceDollar, FaBox, FaPlus, FaTrashAlt, FaTimes, FaSave, FaKeyboard, FaHistory, FaUserTie } from 'react-icons/fa';
import Select, { createFilter } from 'react-select';
import { motion, AnimatePresence } from 'framer-motion';

// Completely replaced staticData with your custom API wrapper
import api from '../api/api';
import CustomToast from '../components/CustomToast';
import { validatePhone, validateNumber, sanitizeString } from '../utils/validators';

import '../App.css';
import '../PurchaseEntryPage.css';

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

const PurchaseEntryPage = () => {
    const navigate = useNavigate();

    // --- State ---
    const [masterItems, setMasterItems] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [billDetails, setBillDetails] = useState({ supplierId: '', billNumber: '', billDate: new Date().toISOString().split('T')[0], notes: '' });
    const [billItems, setBillItems] = useState([]);
    const [selectedMasterItem, setSelectedMasterItem] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState(null);
    
    // Modals
    const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
    const [newSupplierData, setNewSupplierData] = useState({ name: '', phone: '', contactPerson: '', city: '' });
    const [supplierFormError, setSupplierFormError] = useState('');

    // --- Refs ---
    const itemSelectRef = useRef(null);
    const quantityInputRefs = useRef({});
    const costInputRefs = useRef({});
    const supplierSelectRef = useRef(null);
    const billNumberRef = useRef(null);

    // --- Load Initial Data from Database ---
    const [isModuleLocked, setIsModuleLocked] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const [itemsRes, suppliersRes] = await Promise.all([
                    api.get('/master-items'),
                    api.get('/suppliers')
                ]);

                if (itemsRes.status === 403 || suppliersRes.status === 403) {
                    setIsModuleLocked(true);
                } else if (itemsRes.ok && suppliersRes.ok) {
                    setMasterItems(await itemsRes.json());
                    setSuppliers(await suppliersRes.json());
                    setIsModuleLocked(false);
                } else {
                    setToast({ type: 'error', title: 'Error', message: "Failed to fetch data from the server." });
                }
            } catch (err) {
                console.error("Error loading initial data:", err);
                setToast({ type: 'error', title: 'Error', message: "Failed to connect to the database. Please check your connection." });
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, []);

    // --- Memoized Options & Calculations ---
    const masterItemOptions = useMemo(() => {
        return masterItems.map(item => ({
            value: item.id,
            label: `${item.name} ${item.partNo ? `(${item.partNo})` : ''} ${item.type === 'Service' ? '[Svc]' : '[Sp]'}`,
            itemData: item
        }));
    }, [masterItems]);

    const supplierOptions = useMemo(() => {
        return suppliers.map(s => ({ value: s.id, label: s.name }));
    }, [suppliers]);

    const calculateGrandTotal = useMemo(() => {
        return billItems.reduce((total, item) => total + (Number(item.lineTotal) || 0), 0);
    }, [billItems]);

    // --- Handlers ---
    const handleBillDetailChange = (e) => setBillDetails({ ...billDetails, [e.target.name]: e.target.value });
    const handleSupplierSelect = (selectedOption) => setBillDetails({ ...billDetails, supplierId: selectedOption ? selectedOption.value : '' });
    const handleMasterItemSelectChange = (selectedOption) => setSelectedMasterItem(selectedOption);

    const addItemToBill = useCallback((itemToAdd) => {
        if (!itemToAdd || !itemToAdd.value || !itemToAdd.itemData) {
            setToast({ type: 'warning', title: 'Invalid Selection', message: "Please select a valid item first." });
            return;
        }
        if (billItems.some(item => item.masterItem.id === itemToAdd.value)) {
            setToast({ type: 'warning', title: 'Item Exists', message: `"${itemToAdd.itemData.name}" is already added. Adjust quantity below.` });
            const existingIndex = billItems.findIndex(i => i.masterItem.id === itemToAdd.value);
            if (existingIndex !== -1 && quantityInputRefs.current[itemToAdd.value]) {
                quantityInputRefs.current[itemToAdd.value]?.focus();
                quantityInputRefs.current[itemToAdd.value]?.select();
            }
            return;
        }
        const defaultPurchasePrice = itemToAdd.itemData.type === 'Spare' ? (itemToAdd.itemData.costPrice ?? '') : '';
        const defaultQuantity = itemToAdd.itemData.type === 'Service' ? 1 : 1;
        const newItem = {
            masterItem: itemToAdd.itemData,
            quantity: defaultQuantity,
            purchasePrice: defaultPurchasePrice,
            lineTotal: (itemToAdd.itemData.type === 'Spare' && defaultPurchasePrice !== '') ? (Number(defaultPurchasePrice) * defaultQuantity) : 0,
            sellingPrice: itemToAdd.itemData.unitPrice
        };
        setBillItems(prevItems => [...prevItems, newItem]);
        setSelectedMasterItem(null);
        if (itemToAdd.itemData.type === 'Spare') {
            setTimeout(() => {
                if (quantityInputRefs.current[newItem.masterItem.id]) {
                    quantityInputRefs.current[newItem.masterItem.id]?.focus();
                    quantityInputRefs.current[newItem.masterItem.id]?.select();
                }
            }, 50);
        } else {
            setTimeout(() => itemSelectRef.current?.focus(), 50);
        }
    }, [billItems]);

    const handleItemInputChange = (index, field, value) => {
        const updatedItems = [...billItems];
        const item = updatedItems[index];
        if (!item) return;
        if (item.masterItem.type === 'Service' && (field === 'quantity' || field === 'purchasePrice')) return;
        let numericValue;
        if (value === '') {
            numericValue = '';
        } else {
            numericValue = field === 'quantity' ? parseInt(value, 10) : parseFloat(value);
            if (isNaN(numericValue) || numericValue < 0) {
                numericValue = item[field];
            }
        }
        item[field] = numericValue;
        const qty = Number(item.quantity) || 0;
        const price = Number(item.purchasePrice) || 0;
        item.lineTotal = (qty > 0 && price >= 0) ? parseFloat((qty * price).toFixed(2)) : 0;
        setBillItems(updatedItems);
    };

    const handleItemInputKeyDown = (e, index, currentField) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const currentItem = billItems[index];
            if (!currentItem) return;
            if (currentItem.masterItem.type === 'Service') {
                itemSelectRef.current?.focus();
                return;
            }
            if (currentField === 'quantity') {
                if (costInputRefs.current[currentItem.masterItem.id]) {
                    costInputRefs.current[currentItem.masterItem.id]?.focus();
                    costInputRefs.current[currentItem.masterItem.id]?.select();
                }
            } else if (currentField === 'purchasePrice') {
                if (itemSelectRef.current) {
                    itemSelectRef.current.focus();
                }
            }
        }
    };

    const handleRemoveItem = (index) => {
        setBillItems(prevItems => prevItems.filter((_, i) => i !== index));
        itemSelectRef.current?.focus();
    };

    const openAddSupplierModal = () => { setShowAddSupplierModal(true); };
    const closeAddSupplierModal = () => setShowAddSupplierModal(false);
    const handleNewSupplierChange = (e) => setNewSupplierData({ ...newSupplierData, [e.target.name]: e.target.value });

    // --- Database Add Supplier ---
    const handleAddSupplierSubmit = async (e) => {
        e.preventDefault();
        setSupplierFormError('');
        
        if (!newSupplierData.name || !newSupplierData.name.trim()) {
            setSupplierFormError("Supplier name is required."); return;
        }
        
        const phoneValidation = validatePhone(newSupplierData.phone, true);
        if (!phoneValidation.isValid) {
            setSupplierFormError(phoneValidation.error); return;
        }

        try {
            const response = await api.post('/suppliers', {
                ...newSupplierData,
                name: sanitizeString(newSupplierData.name),
                phone: phoneValidation.cleanPhone,
                contactPerson: sanitizeString(newSupplierData.contactPerson),
                city: sanitizeString(newSupplierData.city)
            });
            const addedSupplier = await response.json();

            if (response.ok) {
                // Refresh suppliers list
                const suppliersRes = await api.get('/suppliers');
                if (suppliersRes.ok) setSuppliers(await suppliersRes.json());
                
                setBillDetails(prev => ({ ...prev, supplierId: addedSupplier.id }));
                closeAddSupplierModal();
                setNewSupplierData({ name: '', phone: '', contactPerson: '', city: '' });
                
                setTimeout(() => billNumberRef.current?.focus(), 100);
                setToast({ type: 'success', title: 'Success', message: `Supplier "${addedSupplier.name}" added successfully.` });
            } else {
                setSupplierFormError(addedSupplier.message || "Error adding supplier.");
            }
        } catch (error) {
            setSupplierFormError("Server error while connecting to the database.");
        }
    };

    // --- Database Save Purchase Bill ---
    const handleSavePurchase = async () => {
        if (isSaving) return;
        if (!billDetails.supplierId) { setToast({ type: 'error', title: 'Validation', message: "Please select a Supplier." }); supplierSelectRef.current?.focus(); return; }
        if (!billDetails.billNumber.trim()) { setToast({ type: 'error', title: 'Validation', message: "Please enter the Bill/Invoice No." }); billNumberRef.current?.focus(); return; }
        if (!billDetails.billDate) { setToast({ type: 'error', title: 'Validation', message: "Please select the Bill Date." }); return; }
        if (billItems.length === 0) { setToast({ type: 'error', title: 'Validation', message: "Please add at least one item to the bill." }); itemSelectRef.current?.focus(); return; }
        
        let invalidItemFound = false;
        for (let i = 0; i < billItems.length; i++) {
            const item = billItems[i];
            if (item.masterItem.type === 'Spare') {
                const qty = Number(item.quantity); const price = Number(item.purchasePrice);
                if (isNaN(qty) || qty <= 0) {
                    setToast({ type: 'error', title: 'Invalid Quantity', message: `Invalid Quantity (> 0 required) for "${item.masterItem.name}".` });
                    quantityInputRefs.current[item.masterItem.id]?.focus(); invalidItemFound = true; break;
                }
                if (isNaN(price) || price < 0) {
                    setToast({ type: 'error', title: 'Invalid Cost', message: `Invalid Cost/Unit (>= 0 required) for "${item.masterItem.name}".` });
                    costInputRefs.current[item.masterItem.id]?.focus(); invalidItemFound = true; break;
                }
            }
        }
        
        if (invalidItemFound) return;
        setIsSaving(true);
        
        const billDataToSave = { 
             supplierId: billDetails.supplierId,
            billNumber: billDetails.billNumber.trim(),
            billDate: billDetails.billDate,
            notes: billDetails.notes.trim(),
            items: billItems.map(item => ({
                masterItemId: item.masterItem.id,
                quantity: Number(item.quantity) || 0,
                purchasePrice: Number(item.purchasePrice) || 0
            }))
        };

        try {
            const response = await api.post('/purchase-bills', billDataToSave);
            const result = await response.json();

            if (response.ok) {
                setToast({ type: 'success', title: 'Saved!', message: `Bill saved successfully! Stock & cost prices updated.` });
                
                // Refresh master items so the component has the newest stock quantities
                const itemsRes = await api.get('/master-items');
                if (itemsRes.ok) setMasterItems(await itemsRes.json());

                // Reset form
                setBillDetails({ supplierId: '', billNumber: '', billDate: new Date().toISOString().split('T')[0], notes: '' });
                setBillItems([]);
                setSelectedMasterItem(null);
                supplierSelectRef.current?.focus();
            } else {
                setToast({ type: 'error', title: 'Save Failed', message: `Save failed: ${result.message || 'An unknown error occurred.'}` });
            }
        } catch (error) {
            setToast({ type: 'error', title: 'Server Error', message: "Server error while saving the purchase bill." });
        } finally {
            setIsSaving(false);
        }
    };

    // --- Render ---
    if (isModuleLocked) {
        return (
            <Container fluid className="p-5 text-center">
                <Card className="border-0 shadow-lg p-5 rounded-4 mx-auto mt-4" style={{ maxWidth: '650px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                    <div className="mx-auto mb-4 p-3 rounded-circle text-danger d-flex align-items-center justify-content-center" style={{ backgroundColor: '#fef2f2', width: '80px', height: '80px' }}>
                        <FaTimes size={44} />
                    </div>
                    <h3 className="fw-bold text-dark mb-2">Module Access Locked</h3>
                    <p className="text-muted mb-4 fs-6">
                        The <strong>Purchase Entry & Supplier Bills</strong> module has been disabled for your garage account by Cipra Infotech Super Admin.
                    </p>
                    <Alert variant="warning" className="border-0 rounded-3 text-start mb-4">
                        <FaFileInvoiceDollar className="me-2 text-warning" />
                        To activate this module or upgrade your subscription plan, please contact <strong>admin@ciprainfotech.com</strong>.
                    </Alert>
                </Card>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4 px-md-4 purchase-entry-page">
            {/* Page Header */}
            <Row className="mb-4 align-items-center page-header-row">
                <Col>
                    <h2 className="page-title mb-0"><FaFileInvoiceDollar className="me-2" />Record Purchase Bill</h2>
                </Col>
                <Col xs="auto" className="d-flex gap-2">
                    <Link to="/purchase-history">
                        <Button variant="outline-secondary" size="sm">
                            <FaHistory className="me-1" /> View History
                        </Button>
                    </Link>
                    <Link to="/stock">
                        <Button variant="outline-info" size="sm">
                            <FaBox className="me-1" /> View Stock
                        </Button>
                    </Link>
                </Col>
            </Row>

            {/* Alerts */}
            {toast && <CustomToast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />}

            {/* Single Column Layout */}
            <Row>
                <Col xs={12}>
                    {/* Bill Details Card */}
                    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                        <Card className="shadow-sm mb-4 entry-card">
                             <Card.Header>1. Bill Information</Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    {/* Supplier Select */}
                                    <Col md={6}>
                                        <Form.Group controlId="supplierSelect">
                                            <Form.Label>Supplier*</Form.Label>
                                            <InputGroup size="sm">
                                                <Select ref={supplierSelectRef} inputId="supplierSelect" options={supplierOptions} value={supplierOptions.find(opt => opt.value === billDetails.supplierId)} onChange={handleSupplierSelect} placeholder="Select or search supplier..." isClearable isLoading={isLoading} isDisabled={isLoading} className="react-select-container flex-grow-1" classNamePrefix="react-select" styles={{ menu: base => ({ ...base, zIndex: 1057 }) }} />
                                                <Button variant="outline-secondary" onClick={openAddSupplierModal} title="Add New Supplier"><FaPlus /></Button>
                                            </InputGroup>
                                        </Form.Group>
                                    </Col>
                                    {/* Bill Number */}
                                    <Col md={3} sm={6}>
                                        <Form.Group controlId="billNumber">
                                            <Form.Label>Bill/Invoice No.*</Form.Label>
                                            <Form.Control ref={billNumberRef} size="sm" type="text" name="billNumber" value={billDetails.billNumber} onChange={handleBillDetailChange} required placeholder="Supplier's bill #" />
                                        </Form.Group>
                                    </Col>
                                    {/* Bill Date */}
                                    <Col md={3} sm={6}>
                                        <Form.Group controlId="billDate">
                                            <Form.Label>Bill Date*</Form.Label>
                                            <Form.Control size="sm" type="date" name="billDate" value={billDetails.billDate} onChange={handleBillDetailChange} required max={new Date().toISOString().split('T')[0]} />
                                        </Form.Group>
                                    </Col>
                                    {/* Notes */}
                                    <Col md={12}>
                                        <Form.Group controlId="billNotes">
                                            <Form.Label>Notes</Form.Label>
                                            <Form.Control size="sm" as="textarea" rows={1} name="notes" value={billDetails.notes} onChange={handleBillDetailChange} placeholder="Optional notes (e.g., Payment terms, PO number)" />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </motion.div>

                    {/* Add Items Card */}
                    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                        <Card className="shadow-sm mb-4 entry-card">
                            <Card.Header>2. Add Items to Bill</Card.Header>
                            <Card.Body>
                                <Row className="g-2 align-items-end">
                                    <Col>
                                        <Form.Group controlId="itemSelect">
                                            <Form.Label>Search & Select Item (Press Enter to Add)</Form.Label>
                                            <Select
                                                ref={itemSelectRef}
                                                inputId="itemSelect"
                                                options={masterItemOptions}
                                                value={selectedMasterItem}
                                                onChange={handleMasterItemSelectChange}
                                                placeholder="Search by name or part no... then press Enter"
                                                isClearable
                                                isLoading={isLoading}
                                                isDisabled={isLoading || isSaving}
                                                className="react-select-container item-select-purchase"
                                                classNamePrefix="react-select"
                                                filterOption={createFilter({ ignoreAccents: false })}
                                                menuPortalTarget={document.body}
                                                styles={{
                                                    menuPortal: base => ({ ...base, zIndex: 9999 }), 
                                                    menu: base => ({ ...base, zIndex: 9999 })
                                                }}
                                                onKeyDown={(e) => { if (e.key === 'Enter' && selectedMasterItem) { e.preventDefault(); addItemToBill(selectedMasterItem); } }}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <small className="text-muted d-block mt-2">
                                    <FaKeyboard className="me-1" /> Select item and press <kbd>Enter</kbd>. Use <kbd>Tab</kbd> or <kbd>Enter</kbd> to navigate fields below.
                                </small>
                            </Card.Body>
                        </Card>
                    </motion.div>

                    {/* Bill Items Table Section */}
                    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                         <Card className="shadow-sm entry-card">
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <span>3. Purchased Items List</span>
                                <span className="total-amount-display">Bill Total: {formatCurrency(calculateGrandTotal)}</span>
                            </Card.Header>
                            <div className="purchase-items-table-wrapper elegant-scrollbar">
                                <Table hover className="purchase-items-table">
                                    <thead> 
                                        <tr>
                                            <th className='col-item'>Item</th>
                                            <th className="col-qty">Qty* <span className="text-muted d-none d-md-inline">(Spares)</span></th>
                                            <th className="col-cost">Cost/Unit* <span className="text-muted d-none d-md-inline">(Spares)</span></th>
                                            <th className="col-sell d-none d-lg-table-cell">Sell Price</th>
                                            <th className="col-total">Line Total</th>
                                            <th className="col-actions">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading ? (
                                            <tr><td colSpan="6" className="text-center p-5"><Spinner animation="border" size="sm" /><span className="ms-2">Loading...</span></td></tr>
                                        ) : billItems.length === 0 ? (
                                            <tr><td colSpan="6" className="text-center text-muted p-4 fst-italic">No items added yet. Use the search above.</td></tr>
                                        ) : (
                                            billItems.map((item, index) => (
                                                <tr key={item.masterItem.id} className={item.masterItem.type === 'Service' ? 'table-row-service' : ''}>
                                                     <td className='col-item'>
                                                        <div className="item-name-purchase" title={item.masterItem.name}>{item.masterItem.name}</div>
                                                        <div className="item-partno-purchase">{item.masterItem.partNo || '-'} <Badge bg="secondary" text="light" pill size="sm" className="ms-1 fw-normal">{item.masterItem.type}</Badge></div>
                                                    </td>
                                                    <td className="col-qty">
                                                        <Form.Control ref={el => quantityInputRefs.current[item.masterItem.id] = el} type="number" size="sm" value={item.quantity} onChange={(e) => handleItemInputChange(index, 'quantity', e.target.value)} onKeyDown={(e) => handleItemInputKeyDown(e, index, 'quantity')} min="1" step="1" required className="text-center input-narrow" disabled={item.masterItem.type === 'Service' || isSaving} title={item.masterItem.type === 'Service' ? 'N/A for services' : 'Quantity purchased'} />
                                                    </td>
                                                    <td className="col-cost">
                                                        <InputGroup size="sm" className="input-group-narrow">
                                                            <InputGroup.Text>₹</InputGroup.Text>
                                                            <Form.Control ref={el => costInputRefs.current[item.masterItem.id] = el} type="number" value={item.purchasePrice} onChange={(e) => handleItemInputChange(index, 'purchasePrice', e.target.value)} onKeyDown={(e) => handleItemInputKeyDown(e, index, 'purchasePrice')} min="0" step="0.01" required className="text-end no-spinners" disabled={item.masterItem.type === 'Service' || isSaving} title={item.masterItem.type === 'Service' ? 'N/A for services' : 'Cost per unit'} />
                                                        </InputGroup>
                                                    </td>
                                                    <td className="col-sell d-none d-lg-table-cell align-middle">
                                                        <span className={`${Number(item.purchasePrice) > Number(item.sellingPrice) ? 'text-danger fw-bold' : ''} ${item.masterItem.type === 'Service' ? 'text-muted' : ''}`} title={`Current Selling Price: ${formatCurrency(item.sellingPrice, 0)}. ${Number(item.purchasePrice) > Number(item.sellingPrice) ? 'Cost > Sell Price!' : ''}`}>
                                                            {formatCurrency(item.sellingPrice, 0)}
                                                        </span>
                                                    </td>
                                                    <td className="col-total text-end fw-semibold align-middle">{formatCurrency(item.lineTotal)}</td>
                                                    <td className="col-actions">
                                                        <Button variant="link" size="sm" className="text-danger p-0 action-delete" onClick={() => handleRemoveItem(index)} title="Remove Item" disabled={isSaving}> <FaTimes /> </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                            <Card.Footer className="text-center">
                                <Button variant="success" onClick={handleSavePurchase} disabled={isSaving || billItems.length === 0 || isLoading} size="lg" className="px-5 save-button shadow-sm">
                                    {isSaving ? (<><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />Saving...</>) : (<><FaSave className="me-2" />Save Purchase & Update Stock</>)}
                                </Button>
                            </Card.Footer>
                        </Card>
                    </motion.div>
                </Col>
            </Row>

            {/* --- Modals --- */}
            <Modal show={showAddSupplierModal} onHide={closeAddSupplierModal} centered backdrop="static" keyboard={false}>
                 <Modal.Header closeButton> <Modal.Title><FaUserTie className="me-2" />Add New Supplier</Modal.Title> </Modal.Header>
                 <Form onSubmit={handleAddSupplierSubmit}>
                     <Modal.Body>
                         {supplierFormError && <Alert variant="danger" size="sm">{supplierFormError}</Alert>}
                         <Form.Group className="mb-3" controlId="newSupplierName"> <Form.Label>Supplier Name*</Form.Label> <Form.Control size="sm" type="text" name="name" value={newSupplierData.name} onChange={handleNewSupplierChange} required autoFocus /> </Form.Group>
                         <Form.Group className="mb-3" controlId="newSupplierPhone"> <Form.Label>Contact Phone*</Form.Label> <Form.Control size="sm" type="tel" name="phone" value={newSupplierData.phone} onChange={handleNewSupplierChange} required placeholder="10 digits" maxLength={10}/> </Form.Group>
                         <Form.Group className="mb-3" controlId="newSupplierContactPerson"> <Form.Label>Contact Person</Form.Label> <Form.Control size="sm" type="text" name="contactPerson" value={newSupplierData.contactPerson} onChange={handleNewSupplierChange} /> </Form.Group>
                         <Form.Group className="mb-3" controlId="newSupplierCity"> <Form.Label>City</Form.Label> <Form.Control size="sm" type="text" name="city" value={newSupplierData.city} onChange={handleNewSupplierChange} /> </Form.Group>
                         <small className="text-muted">* Required fields</small>
                     </Modal.Body>
                     <Modal.Footer> <Button variant="outline-secondary" onClick={closeAddSupplierModal}>Cancel</Button> <Button variant="primary" type="submit"><FaSave className="me-1" /> Save Supplier</Button> </Modal.Footer>
                 </Form>
            </Modal>

        </Container>
    );
};

export default PurchaseEntryPage;