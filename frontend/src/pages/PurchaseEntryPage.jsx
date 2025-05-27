import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Link is used now
import { Container, Row, Col, Card, Form, Button, InputGroup, Table, Alert, Spinner, Badge, Modal } from 'react-bootstrap';
import { FaFileInvoiceDollar, FaBox, FaPlus, FaTrashAlt, FaTimes, FaSave, FaListAlt, FaCalendarAlt, FaDollarSign, FaInfoCircle, FaEye, FaBuilding, FaUserTie, FaKeyboard, FaHistory } from 'react-icons/fa';
import { getMasterItems, addPurchaseBill, getSuppliers, addSupplier, findMasterItemById } from '../data/staticData'; // Removed getPurchaseBills
import Select, { createFilter } from 'react-select';
import { motion, AnimatePresence } from 'framer-motion';

// Import the refined CSS
import '../App.css'; // Keep global styles if needed
import '../PurchaseEntryPage.css'; // Load the specific styles

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
    // Removed purchaseBills state, it's handled by the history page
    const [isLoading, setIsLoading] = useState(true);
    const [billDetails, setBillDetails] = useState({ supplierId: '', billNumber: '', billDate: new Date().toISOString().split('T')[0], notes: '' });
    const [billItems, setBillItems] = useState([]);
    const [selectedMasterItem, setSelectedMasterItem] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    // Removed historySearchTerm, viewingBill (will be on history page)
    const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
    const [newSupplierData, setNewSupplierData] = useState({ name: '', phone: '', contactPerson: '', city: '' });
    const [supplierFormError, setSupplierFormError] = useState('');
    // Removed showHistoryModal state

    // --- Refs ---
    const itemSelectRef = useRef(null);
    const quantityInputRefs = useRef({});
    const costInputRefs = useRef({});
    const supplierSelectRef = useRef(null);
    const billNumberRef = useRef(null);

    // --- Load Initial Data (Simpler now) ---
    useEffect(() => {
        setIsLoading(true);
        setError('');
        try {
            // Simulate fetching only necessary data for this page
            setTimeout(() => {
                setMasterItems(getMasterItems());
                setSuppliers(getSuppliers());
                setIsLoading(false);
            }, 300);
        } catch (err) {
            console.error("Error loading initial data:", err);
            setError("Failed to load necessary data. Please refresh.");
            setIsLoading(false);
        }
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

    // --- Handlers (Logic mostly unchanged, but removed history parts) ---
    const handleBillDetailChange = (e) => setBillDetails({ ...billDetails, [e.target.name]: e.target.value });
    const handleSupplierSelect = (selectedOption) => setBillDetails({ ...billDetails, supplierId: selectedOption ? selectedOption.value : '' });
    const handleMasterItemSelectChange = (selectedOption) => setSelectedMasterItem(selectedOption);

    const addItemToBill = useCallback((itemToAdd) => {
        // ... (same logic as before)
        if (!itemToAdd || !itemToAdd.value || !itemToAdd.itemData) {
            setError("Please select a valid item first.");
             setTimeout(() => setError(''), 3500);
            return;
        }
        if (billItems.some(item => item.masterItem.id === itemToAdd.value)) {
            setError(`"${itemToAdd.itemData.name}" is already added. Adjust quantity below.`);
            setTimeout(() => setError(''), 3500);
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
        setError('');
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
        // ... (same logic as before)
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
        // ... (same logic as before)
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
        // ... (same logic as before)
        setBillItems(prevItems => prevItems.filter((_, i) => i !== index));
        itemSelectRef.current?.focus();
    };

    const openAddSupplierModal = () => { /* ... (same) */ setShowAddSupplierModal(true); };
    const closeAddSupplierModal = () => setShowAddSupplierModal(false);
    const handleNewSupplierChange = (e) => setNewSupplierData({ ...newSupplierData, [e.target.name]: e.target.value });

    const handleAddSupplierSubmit = (e) => {
        // ... (same logic as before)
        e.preventDefault();
        setSupplierFormError('');
        if (!newSupplierData.name || !newSupplierData.phone) {
            setSupplierFormError("Supplier Name and Phone are required."); return;
        }
        if (!/^\d{10}$/.test(newSupplierData.phone)) {
            setSupplierFormError("Please enter a valid 10-digit phone number."); return;
        }
        const addedSupplier = addSupplier(newSupplierData);
        if (addedSupplier) {
            setSuppliers(getSuppliers());
            setBillDetails(prev => ({ ...prev, supplierId: addedSupplier.id }));
            closeAddSupplierModal();
            setTimeout(() => billNumberRef.current?.focus(), 100);
            setSuccess(`Supplier "${addedSupplier.name}" added successfully.`);
            setTimeout(() => setSuccess(''), 4000);
        } else {
            setSupplierFormError("Error adding supplier. Please check console or try again.");
        }
    };

    const handleSavePurchase = async () => {
        // ... (same validation and saving logic as before)
        setError(''); setSuccess('');
        if (!billDetails.supplierId) { setError("Please select a Supplier."); supplierSelectRef.current?.focus(); return; }
        if (!billDetails.billNumber.trim()) { setError("Please enter the Bill/Invoice No."); billNumberRef.current?.focus(); return; }
        if (!billDetails.billDate) { setError("Please select the Bill Date."); return; }
        if (billItems.length === 0) { setError("Please add at least one item to the bill."); itemSelectRef.current?.focus(); return; }
        let invalidItemFound = false;
        for (let i = 0; i < billItems.length; i++) { /* ... item validation ... */
            const item = billItems[i];
            if (item.masterItem.type === 'Spare') {
                const qty = Number(item.quantity); const price = Number(item.purchasePrice);
                if (isNaN(qty) || qty <= 0) {
                    setError(`Invalid Quantity (> 0 required) for "${item.masterItem.name}".`);
                    quantityInputRefs.current[item.masterItem.id]?.focus(); invalidItemFound = true; break;
                }
                if (isNaN(price) || price < 0) {
                    setError(`Invalid Cost/Unit (>= 0 required) for "${item.masterItem.name}".`);
                    costInputRefs.current[item.masterItem.id]?.focus(); invalidItemFound = true; break;
                }
            }
        }
        if (invalidItemFound) return;
        setIsSaving(true);
        const billDataToSave = { /* ... bill data ... */
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
        await new Promise(resolve => setTimeout(resolve, 600));
        const result = addPurchaseBill(billDataToSave);
        setIsSaving(false);
        if (result?.bill) {
            setSuccess(`Bill ${result.bill.id} saved successfully! Stock & cost prices updated.`);
            // Don't need to update local history state anymore
            setMasterItems(getMasterItems()); // Still refresh master items for cost price updates
            setBillDetails({ supplierId: '', billNumber: '', billDate: new Date().toISOString().split('T')[0], notes: '' });
            setBillItems([]);
            setSelectedMasterItem(null);
            supplierSelectRef.current?.focus();
            setTimeout(() => setSuccess(''), 6000);
            if (result.errors && result.errors.length > 0) {
                setError(`Bill saved, but with warnings: ${result.errors.join('. ')}`);
            }
        } else {
            setError(`Save failed: ${result?.errors?.join('. ') || 'An unknown error occurred.'}`);
        }
    };

    // --- Render ---
    return (
        <Container fluid className="py-4 px-md-4 purchase-entry-page">
            {/* Page Header */}
            <Row className="mb-4 align-items-center page-header-row">
                <Col>
                    <h2 className="page-title mb-0"><FaFileInvoiceDollar className="me-2" />Record Purchase Bill</h2>
                </Col>
                <Col xs="auto" className="d-flex gap-2">
                    {/* Link to the new history page */}
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
            <AnimatePresence>{error && ( <motion.div><Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert></motion.div> )}</AnimatePresence>
            <AnimatePresence>{success && ( <motion.div><Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert></motion.div> )}</AnimatePresence>

            {/* Single Column Layout */}
            <Row>
                <Col xs={12}>
                    {/* Bill Details Card */}
                    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                        <Card className="shadow-sm mb-4 entry-card">
                             <Card.Header>1. Bill Information</Card.Header>
                            <Card.Body>
                                {/* ... (Supplier, Bill No, Date, Notes Inputs - same as before) ... */}
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
                                                // IMPORTANT: Portal the menu to avoid clipping issues
                                                menuPortalTarget={document.body}
                                                styles={{
                                                    menuPortal: base => ({ ...base, zIndex: 9999 }), // Ensure portal is high z-index
                                                    menu: base => ({ ...base, zIndex: 9999 }) // Also style menu itself if needed
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

                    {/* Bill Items Table Section (No Card, just wrapper) */}
                    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                         <Card className="shadow-sm entry-card">
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <span>3. Purchased Items List</span>
                                <span className="total-amount-display">Bill Total: {formatCurrency(calculateGrandTotal)}</span>
                            </Card.Header>
                            {/* Removed Card.Body, table wrapper is directly inside */}
                            <div className="purchase-items-table-wrapper elegant-scrollbar">
                                <Table hover className="purchase-items-table">
                                    <thead> {/* Removed table-header-fixed class, handled by wrapper */}
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
                                                    {/* Table Cells (td) - same structure as before */}
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

            {/* --- Modals (Only Add Supplier remains here) --- */}
            <Modal show={showAddSupplierModal} onHide={closeAddSupplierModal} centered backdrop="static" keyboard={false}>
                {/* ... (Add Supplier Modal Content - same as before) ... */}
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