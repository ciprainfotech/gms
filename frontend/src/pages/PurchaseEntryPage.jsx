import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Modal, Form } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import Select, { createFilter } from 'react-select';
import { 
  FaTrash, FaPlus, FaSave, FaReceipt, FaUserTie, 
  FaCalendarAlt, FaFileInvoiceDollar, FaBuilding
} from 'react-icons/fa';
import api from '../api/api';
import CustomToast, { ToastContainer } from '../components/CustomToast';
import LoadingOverlay from '../components/LoadingOverlay';
import { getTodayString } from '../utils/dateUtils';
import '../assets/SaaSPremium.css'; 

const formatCurrency = (amount) => Number(amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 });

const PurchaseEntryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editBill = location.state?.bill;
  const isEditMode = !!editBill;

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [masterItems, setMasterItems] = useState([]);

  const qtyInputRef = useRef(null);
  const rateInputRef = useRef(null);
  const itemSelectRef = useRef(null);

  const [billDetails, setBillDetails] = useState({
    supplierId: '',
    supplierName: '',
    billNumber: '',
    billDate: getTodayString(),
    dueDate: getTodayString(),
    discountAmount: 0,
    taxAmount: 0,
    notes: ''
  });

  const [billItems, setBillItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    masterItemId: null,
    itemName: '',
    qty: '',
    rate: '',
    discount: 0,
    taxPercentage: 0
  });

  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', email: '', address: '', gstNumber: '', creditDays: 0, openingBalance: 0, notes: '' });

  const showToast = (type, title, msg) => setToast({ type, title, msg });

  useEffect(() => {
    fetchSuppliers();
    fetchMasterItems();
    if (isEditMode) {
      loadBillForEditing(editBill);
    }
  }, [isEditMode, editBill]);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      if (res.data.success) setSuppliers(res.data.data);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    }
  };

  const fetchMasterItems = async () => {
    try {
      const res = await api.get('/master-items');
      if (res.data.success) setMasterItems(res.data.data);
    } catch (err) {
      console.error('Failed to fetch master items:', err);
    }
  };

  const loadBillForEditing = async (bill) => {
    setBillDetails({
      supplierId: bill.supplierId || '',
      supplierName: bill.supplierName || '',
      billNumber: bill.billNumber || '',
      billDate: bill.billDate ? bill.billDate.split('T')[0] : getTodayString(),
      dueDate: bill.dueDate ? bill.dueDate.split('T')[0] : getTodayString(),
      discountAmount: bill.discountAmount || 0,
      taxAmount: bill.taxAmount || 0,
      notes: bill.notes || ''
    });

    try {
      setLoading(true);
      const res = await api.get(`/purchase-bills/${bill.id}`);
      if (res.data.success) {
        setBillItems(res.data.data.items.map(i => ({
          masterItemId: i.masterItemId,
          itemName: i.itemName,
          qty: Number(i.qty),
          rate: Number(i.rate),
          discount: Number(i.discountAmount || 0),
          taxPercentage: Number(i.taxPercentage || 0),
          totalAmount: Number(i.totalAmount)
        })));
      }
    } catch (err) {
      showToast('error', 'Error', 'Failed to load bill items.');
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => billItems.reduce((acc, i) => acc + (Number(i.qty) * Number(i.rate)), 0);
  const calculateTotalItemDiscount = () => billItems.reduce((acc, i) => acc + Number(i.discount || 0), 0);
  const calculateTotalItemTax = () => billItems.reduce((acc, i) => {
    const preTax = (Number(i.qty) * Number(i.rate)) - Number(i.discount || 0);
    return acc + (preTax * (Number(i.taxPercentage || 0) / 100));
  }, 0);

  const calculateFinalTotal = () => {
    const base = calculateSubtotal() - calculateTotalItemDiscount() + calculateTotalItemTax();
    const finalVal = base - Number(billDetails.discountAmount || 0) + Number(billDetails.taxAmount || 0);
    return finalVal > 0 ? finalVal : 0;
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!currentItem.masterItemId && !currentItem.itemName.trim()) {
      showToast('error', 'Error', 'Please select or enter an item.');
      return;
    }
    if (!currentItem.qty || Number(currentItem.qty) <= 0) {
      showToast('error', 'Error', 'Quantity must be > 0.');
      return;
    }
    if (Number(currentItem.rate) < 0) {
      showToast('error', 'Error', 'Rate cannot be negative.');
      return;
    }

    const preTax = (Number(currentItem.qty) * Number(currentItem.rate)) - Number(currentItem.discount || 0);
    const taxAmt = preTax * (Number(currentItem.taxPercentage || 0) / 100);
    const totalAmount = preTax + taxAmt;

    const newItem = {
      ...currentItem,
      qty: Number(currentItem.qty),
      rate: Number(currentItem.rate),
      discount: Number(currentItem.discount || 0),
      taxPercentage: Number(currentItem.taxPercentage || 0),
      totalAmount
    };

    setBillItems([...billItems, newItem]);
    setCurrentItem({ masterItemId: null, itemName: '', qty: '', rate: '', discount: 0, taxPercentage: 0 });
    if (itemSelectRef.current) itemSelectRef.current.focus();
  };

  const handleRemoveItem = (index) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const handleSaveBill = async () => {
    if (!billDetails.supplierId) return showToast('error', 'Validation Error', 'Supplier is required.');
    if (!billDetails.billNumber.trim()) return showToast('error', 'Validation Error', 'Bill Number is required.');
    if (billItems.length === 0) return showToast('error', 'Validation Error', 'Add at least one item.');

    try {
      setLoading(true);
      const payload = { ...billDetails, items: billItems, totalAmount: calculateFinalTotal(), netAmount: calculateFinalTotal() };

      if (isEditMode) {
        const res = await api.put(`/purchase-bills/${editBill.id}`, payload);
        if (res.data.success) {
          showToast('success', 'Updated', 'Purchase Bill updated.');
          setTimeout(() => navigate('/inventory/purchases/history'), 1000);
        }
      } else {
        const res = await api.post('/purchase-bills', payload);
        if (res.data.success) {
          showToast('success', 'Created', 'Purchase Bill created.');
          setTimeout(() => navigate('/inventory/purchases/history'), 1000);
        }
      }
    } catch (err) {
      showToast('error', 'Error', err.response?.data?.message || 'Failed to save bill.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/suppliers', supplierForm);
      if (res.data.success) {
        showToast('success', 'Success', 'Vendor created successfully');
        setShowSupplierModal(false);
        fetchSuppliers();
        setBillDetails({ ...billDetails, supplierId: res.data.supplier.id, supplierName: res.data.supplier.name });
        setSupplierForm({ name: '', phone: '', email: '', address: '', gstNumber: '', creditDays: 0, openingBalance: 0, notes: '' });
      }
    } catch (err) {
      showToast('error', 'Error', 'Failed to create vendor');
    } finally {
      setLoading(false);
    }
  };

  const supplierOptions = suppliers.map(s => ({ value: s.id, label: s.name }));
  const itemOptions = masterItems.map(i => ({ value: i.id, label: i.name, rate: i.unitPrice || i.unit_price || i.costPrice || i.cost_price || 0 }));

  return (
    <div className="p-4" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <LoadingOverlay show={loading} />
      {toast && <ToastContainer toast={toast} onClose={() => setToast(null)} />}

      <div className="premium-page-header">
        <div>
          <h1 className="premium-page-title">{isEditMode ? 'Edit Purchase Bill' : 'Record New Purchase'}</h1>
          <p className="premium-page-subtitle">Track incoming inventory and vendor invoices securely.</p>
        </div>
        <div>
          <button className="premium-btn premium-btn-secondary" onClick={() => navigate('/inventory/purchases/history')}>
            Cancel & Back
          </button>
        </div>
      </div>

      <Row className="g-4">
        {/* Left Column: Vendor & Bill Details */}
        <Col lg={4}>
          <div className="premium-card">
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2"><FaUserTie /> Vendor & Invoice Details</h5>
            
            <div className="premium-form-group">
              <label className="premium-label d-flex justify-content-between">
                <span>Vendor / Supplier *</span>
                <span className="text-primary" style={{ cursor: 'pointer', fontSize: '0.75rem' }} onClick={() => setShowSupplierModal(true)}>
                  + Add New
                </span>
              </label>
              <Select
                options={supplierOptions}
                value={supplierOptions.find(o => o.value === billDetails.supplierId) || null}
                onChange={(opt) => setBillDetails({ ...billDetails, supplierId: opt.value, supplierName: opt.label })}
                placeholder="Select Vendor..."
                classNamePrefix="premium-select-react"
                styles={{
                  control: (base) => ({ ...base, borderRadius: '8px', borderColor: '#E2E8F0', padding: '2px' })
                }}
              />
            </div>

            <div className="premium-form-group">
              <label className="premium-label">Invoice Number *</label>
              <div className="position-relative">
                <FaReceipt className="position-absolute" style={{ left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input 
                  type="text" 
                  className="premium-input" 
                  style={{ paddingLeft: '40px' }} 
                  placeholder="e.g. INV-2023-001" 
                  value={billDetails.billNumber}
                  onChange={(e) => setBillDetails({ ...billDetails, billNumber: e.target.value })}
                />
              </div>
            </div>

            <Row>
              <Col xs={6}>
                <div className="premium-form-group">
                  <label className="premium-label">Bill Date</label>
                  <input type="date" className="premium-input" value={billDetails.billDate} onChange={e => setBillDetails({...billDetails, billDate: e.target.value})} />
                </div>
              </Col>
              <Col xs={6}>
                <div className="premium-form-group">
                  <label className="premium-label">Due Date</label>
                  <input type="date" className="premium-input" value={billDetails.dueDate} onChange={e => setBillDetails({...billDetails, dueDate: e.target.value})} />
                </div>
              </Col>
            </Row>

            <div className="premium-form-group">
              <label className="premium-label">Global Bill Discount (₹)</label>
              <input type="number" step="0.01" className="premium-input" placeholder="0.00" value={billDetails.discountAmount} onChange={e => setBillDetails({...billDetails, discountAmount: e.target.value})} />
            </div>

            <div className="premium-form-group">
              <label className="premium-label">Global Bill Tax (₹)</label>
              <input type="number" step="0.01" className="premium-input" placeholder="0.00" value={billDetails.taxAmount} onChange={e => setBillDetails({...billDetails, taxAmount: e.target.value})} />
            </div>

            <div className="premium-form-group">
              <label className="premium-label">Internal Notes</label>
              <textarea className="premium-input" rows="2" placeholder="Optional notes about this shipment" value={billDetails.notes} onChange={e => setBillDetails({...billDetails, notes: e.target.value})}></textarea>
            </div>
          </div>
        </Col>

        {/* Right Column: Line Items & Totals */}
        <Col lg={8}>
          <div className="premium-card">
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2"><FaPlus /> Add Line Items</h5>
            
            <Form onSubmit={handleAddItem} className="mb-4">
              <Row className="g-2 align-items-end">
                <Col md={5}>
                  <label className="premium-label" style={{ fontSize: '0.75rem' }}>Select Item or Type Name *</label>
                  <Select
                    ref={itemSelectRef}
                    options={itemOptions}
                    value={currentItem.masterItemId ? itemOptions.find(o => o.value === currentItem.masterItemId) : null}
                    onChange={(opt) => {
                      setCurrentItem({ ...currentItem, masterItemId: opt.value, itemName: opt.label, rate: opt.rate || '' });
                      if (qtyInputRef.current) qtyInputRef.current.focus();
                    }}
                    placeholder="Search master catalog..."
                  />
                </Col>
                <Col md={2}>
                  <label className="premium-label" style={{ fontSize: '0.75rem' }}>Qty *</label>
                  <input ref={qtyInputRef} type="number" step="0.01" className="premium-input" placeholder="Qty" value={currentItem.qty} onChange={e => setCurrentItem({...currentItem, qty: e.target.value})} onKeyDown={e => e.key === 'Enter' && rateInputRef.current?.focus()} />
                </Col>
                <Col md={2}>
                  <label className="premium-label" style={{ fontSize: '0.75rem' }}>Purchase Rate *</label>
                  <input ref={rateInputRef} type="number" step="0.01" className="premium-input" placeholder="Rate (₹)" value={currentItem.rate} onChange={e => setCurrentItem({...currentItem, rate: e.target.value})} />
                </Col>
                <Col md={1}>
                  <label className="premium-label" style={{ fontSize: '0.75rem' }}>Tax %</label>
                  <input type="number" step="0.1" className="premium-input" placeholder="0%" value={currentItem.taxPercentage} onChange={e => setCurrentItem({...currentItem, taxPercentage: e.target.value})} />
                </Col>
                <Col md={2}>
                  <button type="submit" className="premium-btn premium-btn-primary w-100 h-100" style={{ padding: '12px 10px' }}>Add Item</button>
                </Col>
              </Row>
            </Form>

            <div className="premium-table-wrapper mb-4">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end">Rate</th>
                    <th className="text-end">Tax</th>
                    <th className="text-end">Total</th>
                    <th className="text-center">Del</th>
                  </tr>
                </thead>
                <tbody>
                  {billItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-muted">
                        No items added to this bill yet.
                      </td>
                    </tr>
                  ) : (
                    billItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="fw-bold">{item.itemName}</td>
                        <td className="text-center">{item.qty}</td>
                        <td className="text-end">{formatCurrency(item.rate)}</td>
                        <td className="text-end">{item.taxPercentage > 0 ? `${item.taxPercentage}%` : '-'}</td>
                        <td className="text-end fw-semibold text-primary">{formatCurrency(item.totalAmount)}</td>
                        <td className="text-center">
                          <button className="premium-action-btn delete p-1" onClick={() => handleRemoveItem(idx)}><FaTrash /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="p-4 rounded-4" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <Row className="mb-2">
                <Col xs={8} className="text-end text-muted fw-semibold">Subtotal:</Col>
                <Col xs={4} className="text-end fw-bold">{formatCurrency(calculateSubtotal())}</Col>
              </Row>
              {(calculateTotalItemDiscount() > 0 || Number(billDetails.discountAmount) > 0) && (
                <Row className="mb-2 text-danger">
                  <Col xs={8} className="text-end fw-semibold">Total Discount:</Col>
                  <Col xs={4} className="text-end fw-bold">-{formatCurrency(calculateTotalItemDiscount() + Number(billDetails.discountAmount || 0))}</Col>
                </Row>
              )}
              {(calculateTotalItemTax() > 0 || Number(billDetails.taxAmount) > 0) && (
                <Row className="mb-3 text-muted">
                  <Col xs={8} className="text-end fw-semibold">Total Tax (+):</Col>
                  <Col xs={4} className="text-end fw-bold">+{formatCurrency(calculateTotalItemTax() + Number(billDetails.taxAmount || 0))}</Col>
                </Row>
              )}
              <div className="border-top pt-3">
                <Row className="align-items-center">
                  <Col xs={7} className="text-end text-uppercase" style={{ fontSize: '0.875rem', fontWeight: '700', letterSpacing: '0.05em' }}>Net Payable Amount:</Col>
                  <Col xs={5} className="text-end text-primary" style={{ fontSize: '1.75rem', fontWeight: '800' }}>{formatCurrency(calculateFinalTotal())}</Col>
                </Row>
              </div>
            </div>

            <div className="text-end mt-4">
              <button className="premium-btn premium-btn-primary" onClick={handleSaveBill} style={{ padding: '12px 32px', fontSize: '1rem' }}>
                <FaSave /> {isEditMode ? 'Update Purchase Bill' : 'Save Purchase Bill'}
              </button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Quick Add Vendor Modal */}
      <Modal show={showSupplierModal} onHide={() => setShowSupplierModal(false)} centered dialogClassName="premium-modal">
        <Modal.Header closeButton>
          <Modal.Title>Add New Vendor</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveSupplier}>
          <Modal.Body>
            <div className="premium-form-group">
              <label className="premium-label">Vendor Name *</label>
              <input type="text" required className="premium-input" placeholder="e.g. ACME Auto Parts" value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} />
            </div>
            <div className="premium-form-group">
              <label className="premium-label">Phone</label>
              <input type="text" className="premium-input" placeholder="Contact number" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} />
            </div>
            <div className="premium-form-group">
              <label className="premium-label">GST Number</label>
              <input type="text" className="premium-input" placeholder="GSTIN" value={supplierForm.gstNumber} onChange={e => setSupplierForm({...supplierForm, gstNumber: e.target.value})} />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="premium-btn premium-btn-secondary" onClick={() => setShowSupplierModal(false)}>Cancel</button>
            <button type="submit" className="premium-btn premium-btn-primary">Create Vendor</button>
          </Modal.Footer>
        </Form>
      </Modal>

    </div>
  );
};

export default PurchaseEntryPage;
