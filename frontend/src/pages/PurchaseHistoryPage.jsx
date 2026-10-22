import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Modal, Tabs, Tab, Offcanvas, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { 
  FaSearch, FaEye, FaEdit, FaTrashAlt, FaMoneyBillWave, FaPlus, 
  FaPrint, FaFileInvoiceDollar, FaChartLine, FaExclamationCircle, 
  FaUserTie, FaWallet, FaChevronLeft, FaChevronRight, FaBoxOpen
} from 'react-icons/fa';
import api from '../api/api';
import CustomToast, { ToastContainer } from '../components/CustomToast';
import ConfirmModal from '../components/ConfirmModal';
import LoadingOverlay from '../components/LoadingOverlay';
import { formatDateShort, getTodayString } from '../utils/dateUtils';
import '../assets/SaaSPremium.css';

const formatCurrency = (amount) => Number(amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 });

const PurchaseHistoryPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const showToast = (type, title, msg) => setToast({ type, title, msg });

  const [activeTab, setActiveTab] = useState('bills');
  const [bills, setBills] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Modals & Offcanvas
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [billToDelete, setBillToDelete] = useState(null);
  
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [billItems, setBillItems] = useState([]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ billId: null, supplierId: null, amount: '', paymentMode: 'Cash', referenceNo: '', notes: '', paymentDate: getTodayString() });

  const [showLedgerDrawer, setShowLedgerDrawer] = useState(false);
  const [ledgerSupplier, setLedgerSupplier] = useState(null);
  const [ledgerTransactions, setLedgerTransactions] = useState([]);

  useEffect(() => {
    fetchBills();
    fetchSuppliers();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await api.get('/purchase-bills');
      if (res.data.success) setBills(res.data.data);
    } catch (err) { showToast('error', 'Error', 'Failed to fetch purchase bills.'); }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      if (res.data.success) setSuppliers(res.data.data);
      setLoading(false);
    } catch (err) { showToast('error', 'Error', 'Failed to fetch vendors.'); setLoading(false); }
  };

  // Bills List Logic
  const handleViewBill = async (id) => {
    try {
      setLoading(true);
      const res = await api.get(`/purchase-bills/${id}`);
      if (res.data.success) {
        setSelectedBill(res.data.data.bill);
        setBillItems(res.data.data.items);
        setShowViewModal(true);
      }
    } catch (err) { showToast('error', 'Error', 'Failed to fetch bill details.'); } finally { setLoading(false); }
  };

  const handleEditBill = (bill) => navigate('/inventory/purchases/new', { state: { bill } });

  const initiateDeleteBill = (bill) => { setBillToDelete(bill); setShowConfirmModal(true); };

  const confirmDeleteBill = async () => {
    try {
      setLoading(true);
      const res = await api.delete(`/purchase-bills/${billToDelete.id}`);
      if (res.data.success) { showToast('success', 'Deleted', 'Bill deleted successfully.'); fetchBills(); fetchSuppliers(); }
    } catch (err) { showToast('error', 'Error', 'Failed to delete bill.'); } finally { setLoading(false); setShowConfirmModal(false); setBillToDelete(null); }
  };

  // Payment Logic
  const handleOpenPayment = (bill) => {
    setPaymentForm({ billId: bill.id, supplierId: bill.supplierId, amount: bill.amountDue, paymentMode: 'Cash', referenceNo: '', notes: '', paymentDate: getTodayString() });
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) return showToast('error', 'Validation', 'Valid amount is required.');
    try {
      setLoading(true);
      const res = await api.post('/supplier-payments', paymentForm);
      if (res.data.success) {
        showToast('success', 'Success', 'Payment recorded.');
        setShowPaymentModal(false);
        fetchBills();
        fetchSuppliers();
        if (showLedgerDrawer && ledgerSupplier) fetchLedger(ledgerSupplier.id);
      }
    } catch (err) { showToast('error', 'Error', 'Failed to record payment.'); } finally { setLoading(false); }
  };

  // Ledger Logic
  const handleViewLedger = async (supplier) => {
    setLedgerSupplier(supplier);
    setShowLedgerDrawer(true);
    fetchLedger(supplier.id);
  };

  const fetchLedger = async (supplierId) => {
    try {
      setLoading(true);
      const res = await api.get(`/suppliers/${supplierId}/ledger`);
      if (res.data.success) setLedgerTransactions(res.data.data);
    } catch (err) { showToast('error', 'Error', 'Failed to fetch ledger.'); } finally { setLoading(false); }
  };

  const handleLedgerPayment = () => {
    setPaymentForm({ billId: null, supplierId: ledgerSupplier.id, amount: '', paymentMode: 'Cash', referenceNo: '', notes: 'Advance/Global Payment', paymentDate: getTodayString() });
    setShowPaymentModal(true);
  };

  // UI rendering components
  return (
    <div className="p-4" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <LoadingOverlay show={loading} />
      {toast && <ToastContainer toast={toast} onClose={() => setToast(null)} />}

      <div className="premium-page-header">
        <div>
          <h1 className="premium-page-title">Purchases & Vendors</h1>
          <p className="premium-page-subtitle">Manage supplier invoices, purchase history, and vendor ledgers.</p>
        </div>
        <div>
          <button className="premium-btn premium-btn-primary" onClick={() => navigate('/inventory/purchases/new')}>
            <FaPlus /> Record New Purchase
          </button>
        </div>
      </div>

      <Row className="mb-4 g-4">
        <Col md={4}>
          <div className="premium-card d-flex align-items-center gap-4" style={{ padding: '24px' }}>
            <div className="rounded-circle d-flex justify-content-center align-items-center" style={{ width: '60px', height: '60px', backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '24px' }}>
              <FaFileInvoiceDollar />
            </div>
            <div>
              <p className="text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Total Purchase Volume</p>
              <h3 className="fw-bold mb-0 text-dark">{formatCurrency(bills.reduce((sum, b) => sum + Number(b.netAmount), 0))}</h3>
            </div>
          </div>
        </Col>
        <Col md={4}>
          <div className="premium-card d-flex align-items-center gap-4" style={{ padding: '24px' }}>
            <div className="rounded-circle d-flex justify-content-center align-items-center" style={{ width: '60px', height: '60px', backgroundColor: '#D1FAE5', color: '#10B981', fontSize: '24px' }}>
              <FaMoneyBillWave />
            </div>
            <div>
              <p className="text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Total Paid to Vendors</p>
              <h3 className="fw-bold mb-0 text-dark">{formatCurrency(bills.reduce((sum, b) => sum + Number(b.amountPaid), 0))}</h3>
            </div>
          </div>
        </Col>
        <Col md={4}>
          <div className="premium-card d-flex align-items-center gap-4" style={{ padding: '24px' }}>
            <div className="rounded-circle d-flex justify-content-center align-items-center" style={{ width: '60px', height: '60px', backgroundColor: '#FEE2E2', color: '#EF4444', fontSize: '24px' }}>
              <FaExclamationCircle />
            </div>
            <div>
              <p className="text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Outstanding Payables</p>
              <h3 className="fw-bold mb-0 text-dark">{formatCurrency(suppliers.reduce((sum, s) => sum + Number(s.outstandingBalance || 0), 0))}</h3>
            </div>
          </div>
        </Col>
      </Row>

      <div className="premium-card p-0 overflow-hidden">
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="border-bottom px-4 pt-3 mb-0 fw-semibold" style={{ gap: '20px' }}>
          <Tab eventKey="bills" title={<span className="py-2 d-inline-block"><FaFileInvoiceDollar className="me-2"/> Purchase Bills</span>}>
            <div className="premium-table-wrapper border-0 rounded-0 shadow-none">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Bill #</th>
                    <th>Vendor</th>
                    <th className="text-end">Net Amt</th>
                    <th className="text-end">Paid</th>
                    <th className="text-end">Balance</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.length === 0 ? (
                    <tr><td colSpan="8"><div className="premium-empty-state"><FaBoxOpen className="premium-empty-icon"/><h4 className="premium-empty-title">No purchase bills</h4></div></td></tr>
                  ) : (
                    bills.map(b => (
                      <tr key={b.id}>
                        <td>{formatDateShort(b.billDate)}</td>
                        <td className="fw-bold text-dark">{b.billNumber}</td>
                        <td>{b.supplierName}</td>
                        <td className="text-end fw-semibold">{formatCurrency(b.netAmount)}</td>
                        <td className="text-end text-success fw-semibold">{formatCurrency(b.amountPaid)}</td>
                        <td className="text-end text-danger fw-semibold">{formatCurrency(b.amountDue)}</td>
                        <td className="text-center">
                          <span className={`premium-badge premium-badge-${b.paymentStatus === 'Paid' ? 'success' : b.paymentStatus === 'Partial' ? 'warning' : 'danger'}`}>
                            {b.paymentStatus}
                          </span>
                        </td>
                        <td className="text-center">
                          <button className="premium-action-btn" onClick={() => handleViewBill(b.id)}><FaEye /></button>
                          <button className="premium-action-btn" onClick={() => handleOpenPayment(b)}><FaMoneyBillWave /></button>
                          <button className="premium-action-btn" onClick={() => handleEditBill(b)}><FaEdit /></button>
                          <button className="premium-action-btn delete" onClick={() => initiateDeleteBill(b)}><FaTrashAlt /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Tab>
          
          <Tab eventKey="vendors" title={<span className="py-2 d-inline-block"><FaUserTie className="me-2"/> Vendor Directory</span>}>
            <div className="premium-table-wrapper border-0 rounded-0 shadow-none">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th>Contact Info</th>
                    <th className="text-center">Credit Days</th>
                    <th className="text-end">Total Billed</th>
                    <th className="text-end">Outstanding Balance</th>
                    <th className="text-center">Ledger</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.length === 0 ? (
                    <tr><td colSpan="6"><div className="premium-empty-state"><FaUserTie className="premium-empty-icon"/><h4 className="premium-empty-title">No vendors found</h4></div></td></tr>
                  ) : (
                    suppliers.map(s => (
                      <tr key={s.id}>
                        <td className="fw-bold text-dark">{s.name}</td>
                        <td>
                          <div style={{ fontSize: '0.85rem' }}>{s.phone || 'No phone'}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{s.email || ''}</div>
                        </td>
                        <td className="text-center">
                          <span className="premium-badge premium-badge-neutral">{s.creditDays} Days</span>
                        </td>
                        <td className="text-end">{formatCurrency(s.totalPurchases)}</td>
                        <td className="text-end fw-bold text-danger">{formatCurrency(s.outstandingBalance)}</td>
                        <td className="text-center">
                          <button className="premium-btn premium-btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => handleViewLedger(s)}>
                            <FaChartLine /> View Ledger
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Tab>
        </Tabs>
      </div>

      {/* Bill Detail Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered dialogClassName="premium-modal">
        {selectedBill && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>Purchase Bill: {selectedBill.billNumber}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Row className="mb-4">
                <Col md={6}>
                  <p className="mb-1 text-muted text-uppercase fw-bold" style={{ fontSize: '0.75rem' }}>Vendor</p>
                  <p className="fw-bold text-dark fs-5">{selectedBill.supplierName}</p>
                </Col>
                <Col md={3}>
                  <p className="mb-1 text-muted text-uppercase fw-bold" style={{ fontSize: '0.75rem' }}>Date</p>
                  <p className="fw-semibold">{formatDateShort(selectedBill.billDate)}</p>
                </Col>
                <Col md={3}>
                  <p className="mb-1 text-muted text-uppercase fw-bold" style={{ fontSize: '0.75rem' }}>Status</p>
                  <span className={`premium-badge premium-badge-${selectedBill.paymentStatus === 'Paid' ? 'success' : selectedBill.paymentStatus === 'Partial' ? 'warning' : 'danger'}`}>
                    {selectedBill.paymentStatus}
                  </span>
                </Col>
              </Row>
              <div className="premium-table-wrapper">
                <table className="premium-table">
                  <thead className="bg-light">
                    <tr>
                      <th>Item</th>
                      <th className="text-center">Qty</th>
                      <th className="text-end">Rate</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.map(item => (
                      <tr key={item.id}>
                        <td className="fw-bold">{item.itemName}</td>
                        <td className="text-center">{item.qty}</td>
                        <td className="text-end">{formatCurrency(item.rate)}</td>
                        <td className="text-end fw-semibold">{formatCurrency(item.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-end mt-4">
                <div style={{ width: '250px' }} className="p-3 bg-light rounded-3 border">
                  <div className="d-flex justify-content-between mb-2 fw-bold fs-5">
                    <span>Net Total:</span>
                    <span className="text-primary">{formatCurrency(selectedBill.netAmount)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 text-success fw-semibold">
                    <span>Paid:</span>
                    <span>{formatCurrency(selectedBill.amountPaid)}</span>
                  </div>
                  <div className="d-flex justify-content-between text-danger fw-semibold">
                    <span>Balance Due:</span>
                    <span>{formatCurrency(selectedBill.amountDue)}</span>
                  </div>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <button className="premium-btn premium-btn-secondary" onClick={() => window.print()}><FaPrint /> Print Invoice</button>
              <button className="premium-btn premium-btn-primary" onClick={() => { setShowViewModal(false); handleOpenPayment(selectedBill); }}><FaMoneyBillWave /> Record Payment</button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* Record Payment Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered dialogClassName="premium-modal">
        <Modal.Header closeButton>
          <Modal.Title>Record Vendor Payment</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRecordPayment}>
          <Modal.Body>
            <div className="premium-form-group">
              <label className="premium-label">Payment Amount (₹) *</label>
              <input type="number" step="0.01" required className="premium-input" style={{ fontSize: '1.25rem', fontWeight: 'bold' }} value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
            </div>
            <Row>
              <Col md={6}>
                <div className="premium-form-group">
                  <label className="premium-label">Payment Mode</label>
                  <select className="premium-select" value={paymentForm.paymentMode} onChange={e => setPaymentForm({...paymentForm, paymentMode: e.target.value})}>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </Col>
              <Col md={6}>
                <div className="premium-form-group">
                  <label className="premium-label">Payment Date</label>
                  <input type="date" className="premium-input" value={paymentForm.paymentDate} onChange={e => setPaymentForm({...paymentForm, paymentDate: e.target.value})} />
                </div>
              </Col>
            </Row>
            <div className="premium-form-group">
              <label className="premium-label">Reference No (Optional)</label>
              <input type="text" className="premium-input" placeholder="e.g. UPI Ref / Cheque No" value={paymentForm.referenceNo} onChange={e => setPaymentForm({...paymentForm, referenceNo: e.target.value})} />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="premium-btn premium-btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
            <button type="submit" className="premium-btn premium-btn-primary">Save Payment</button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Vendor Ledger Drawer */}
      <Offcanvas show={showLedgerDrawer} onHide={() => setShowLedgerDrawer(false)} placement="end" style={{ width: '450px', borderLeft: '1px solid var(--premium-border)' }}>
        <Offcanvas.Header closeButton className="border-bottom bg-light p-4">
          <Offcanvas.Title className="fw-bold text-dark fs-4">Vendor Ledger</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0 d-flex flex-column bg-light">
          {ledgerSupplier && (
            <div className="p-4 bg-white border-bottom">
              <h5 className="fw-bold mb-1">{ledgerSupplier.name}</h5>
              <p className="text-danger fw-bold mb-0">Total Due: {formatCurrency(ledgerSupplier.outstandingBalance)}</p>
            </div>
          )}
          <div className="flex-grow-1 overflow-auto p-4">
            {ledgerTransactions.map((txn, idx) => (
              <div key={idx} className="premium-card mb-3 p-3" style={{ borderLeft: `4px solid ${txn.type === 'BILL' ? 'var(--premium-danger)' : 'var(--premium-success)'}` }}>
                <div className="d-flex justify-content-between mb-2">
                  <span className="fw-bold text-dark">{txn.type === 'BILL' ? `Bill: ${txn.referenceId}` : `Payment: ${txn.paymentMode}`}</span>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>{formatDateShort(txn.date)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-end">
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>Bal: {formatCurrency(txn.runningBalance)}</span>
                  <span className={`fw-bold fs-5 ${txn.type === 'BILL' ? 'text-danger' : 'text-success'}`}>
                    {txn.type === 'BILL' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </span>
                </div>
              </div>
            ))}
            {ledgerTransactions.length === 0 && <div className="text-center p-4 text-muted">No transactions found.</div>}
          </div>
          <div className="p-4 bg-white border-top shadow-lg">
            <button className="premium-btn premium-btn-primary w-100" style={{ padding: '14px' }} onClick={handleLedgerPayment}>
              Record Ledger Payment
            </button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      <ConfirmModal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} onConfirm={confirmDeleteBill} title="Delete Bill" message="Are you sure you want to delete this bill? This will adjust stock quantities." confirmText="Delete Bill" confirmVariant="danger" />
    </div>
  );
};

export default PurchaseHistoryPage;
