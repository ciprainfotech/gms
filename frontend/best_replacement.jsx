import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Form, Button, Table, Modal, Tabs, Tab, Badge, Offcanvas, InputGroup
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { 
  FaSearch, FaEye, FaEdit, FaTrashAlt, FaMoneyBillWave, FaPlus, 
  FaBook, FaPrint, FaFileInvoiceDollar, FaChartLine, FaExclamationCircle, 
  FaReceipt, FaUserTie, FaFilter, FaRedo, FaWallet, FaTimes
} from 'react-icons/fa';
import api from '../api/api';
import CustomToast, { ToastContainer } from '../components/CustomToast';
import ConfirmModal from '../components/ConfirmModal';
import LoadingOverlay from '../components/LoadingOverlay';
import SaaSDataPagination from '../components/ui/SaaSDataPagination';
import { formatDateShort, getTodayString } from '../utils/dateUtils';
import '../App.css';
import '../PurchasePage.css';

const formatCurrency = (amount) => Number(amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 });

const PurchaseHistoryPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bills');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Data States
  const [bills, setBills] = useState([]);
  const [totalBillsCount, setTotalBillsCount] = useState(0);
  const [vendors, setVendors] = useState([]);
  const [summary, setSummary] = useState({ totalAmount: 0, totalPaid: 0, outstanding: 0 });

  // Filters for Bills
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    supplierId: '',
    paymentStatus: 'All',
    search: '',
    page: 1,
    pageSize: 10
  });

  // Modals / Overlays
  const [showViewBillModal, setShowViewBillModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: 0, paymentDate: getTodayString(), paymentMethod: 'Cash', referenceNo: '', notes: '' });
  const [paymentTarget, setPaymentTarget] = useState({ type: 'bill', data: null }); // type: 'bill' or 'vendor'
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // { type: 'bill'|'vendor', id }

  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendorForm, setVendorForm] = useState({ id: null, name: '', phone: '', contactPerson: '', email: '', city: '', address: '', gstNumber: '', creditDays: 30, openingBalance: 0, notes: '' });

  const [showLedgerOffcanvas, setShowLedgerOffcanvas] = useState(false);
  const [selectedLedgerVendor, setSelectedLedgerVendor] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);

  useEffect(() => {
    if (activeTab === 'bills') {
      fetchBills();
    } else {
      fetchVendors();
    }
  }, [activeTab, filters.page, filters.pageSize]);

  useEffect(() => {
    if (activeTab === 'bills' && vendors.length === 0) {
      api.get('/suppliers').then(async res => {
        if (res.ok) {
          const data = await res.json();
          setVendors(data || []);
        }
      }).catch(() => {});
    }
  }, [activeTab]);

  const showToast = (type, title, message) => setToast({ type, title, message });

  const fetchBills = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: filters.page,
        pageSize: filters.pageSize,
        ...(filters.supplierId && { supplierId: filters.supplierId }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.paymentStatus !== 'All' && { paymentStatus: filters.paymentStatus }),
        ...(filters.search && { search: filters.search })
      });
      const res = await api.get(`/purchase-bills?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBills(data.bills || []);
        setTotalBillsCount(data.totalCount || 0);

        const tAmt = (data.bills || []).reduce((sum, b) => sum + (Number(b.netAmount)||0), 0);
        const tPaid = (data.bills || []).reduce((sum, b) => sum + (Number(b.amountPaid)||0), 0);
        setSummary({ totalAmount: tAmt, totalPaid: tPaid, outstanding: tAmt - tPaid });
      } else {
        showToast('error', 'Error', 'Failed to fetch purchase bills.');
      }
    } catch (err) {
      console.error('Error fetching bills:', err);
      showToast('error', 'Error', 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers');
      if (res.ok) {
        const data = await res.json();
        setVendors(data || []);
      } else {
        showToast('error', 'Error', 'Failed to fetch suppliers.');
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      showToast('error', 'Error', 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchBills();
  };

  const handleResetFilter = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      supplierId: '',
      paymentStatus: 'All',
      search: '',
      page: 1,
      pageSize: 10
    });
  };

  const handleViewBill = async (bill) => {
    setLoading(true);
    try {
      const res = await api.get(`/purchase-bills/${bill.id}`);
      if (res.ok) {
        const fullBill = await res.json();
        setSelectedBill(fullBill);
        setShowViewBillModal(true);
      } else {
        showToast('error', 'Error', 'Failed to load bill details.');
      }
    } catch (err) {
      showToast('error', 'Error', 'Could not load bill details.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentModal = (type, data) => {
    setPaymentTarget({ type, data });
    const amountToPay = type === 'bill' ? (data.amountDue || data.netAmount || 0) : (data.outstandingBalance || 0);
    setPaymentForm({
      amount: amountToPay,
      paymentDate: getTodayString(),
      paymentMethod: 'Cash',
      referenceNo: '',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const handleSavePayment = async () => {
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      showToast('error', 'Validation', 'Payment amount must be greater than 0.');
      return;
    }

    try {
      const payload = {
        supplierId: paymentTarget.type === 'bill' ? paymentTarget.data.supplierId : paymentTarget.data.id,
        purchaseBillId: paymentTarget.type === 'bill' ? paymentTarget.data.id : null,
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        paymentDate: paymentForm.paymentDate,
        referenceNo: paymentForm.referenceNo,
        notes: paymentForm.notes
      };

      const res = await api.post('/supplier-payments', payload);
      if (res.ok) {
        showToast('success', 'Payment Recorded', 'Vendor payment updated successfully.');
        setShowPaymentModal(false);
        if (activeTab === 'bills') fetchBills();
        else fetchVendors();

        if (showLedgerOffcanvas && selectedLedgerVendor) {
          handleOpenLedger(selectedLedgerVendor);
        }
      } else {
        const errorData = await res.json();
        showToast('error', 'Error', errorData.message || 'Failed to record payment.');
      }
    } catch (err) {
      showToast('error', 'Error', 'Server error while recording payment.');
    }
  };

  const handleOpenLedger = async (vendor) => {
    setSelectedLedgerVendor(vendor);
    setShowLedgerOffcanvas(true);
    try {
      const res = await api.get(`/suppliers/${vendor.id}`);
      if (res.ok) {
        const data = await res.json();
        setLedgerData(data.ledger || []);
      }
    } catch (err) {
      console.error('Error fetching ledger:', err);
    }
  };

  const handleOpenVendorModal = (vendor = null) => {
    if (vendor) {
      setVendorForm({
        id: vendor.id,
        name: vendor.name || '',
        contactPerson: vendor.contactPerson || '',
        phone: vendor.phone || '',
        email: vendor.email || '',
        city: vendor.city || '',
        address: vendor.address || '',
        gstNumber: vendor.gstNumber || '',
        creditDays: vendor.creditDays || 30,
        openingBalance: vendor.openingBalance || 0,
        notes: vendor.notes || ''
      });
    } else {
      setVendorForm({
        id: null,
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        city: '',
        address: '',
        gstNumber: '',
        creditDays: 30,
        openingBalance: 0,
        notes: ''
      });
    }
    setShowVendorModal(true);
  };

  const handleSaveVendor = async (e) => {
    e.preventDefault();
    if (!vendorForm.name.trim()) {
      showToast('error', 'Validation', 'Supplier Name is required.');
      return;
    }

    try {
      let res;
      if (vendorForm.id) {
        res = await api.put(`/suppliers/${vendorForm.id}`, vendorForm);
      } else {
        res = await api.post('/suppliers', vendorForm);
      }

      if (res.ok) {
        showToast('success', 'Success', vendorForm.id ? 'Supplier updated.' : 'Supplier added.');
        setShowVendorModal(false);
        fetchVendors();
      } else {
        const errData = await res.json();
        showToast('error', 'Error', errData.message || 'Failed to save supplier.');
      }
    } catch (err) {
      showToast('error', 'Error', 'Failed to save supplier.');
    }
  };

  const handleDeleteItem = (type, id) => {
    setItemToDelete({ type, id });
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const endpoint = itemToDelete.type === 'bill' ? `/purchase-bills/${itemToDelete.id}` : `/suppliers/${itemToDelete.id}`;
      const res = await api.delete(endpoint);
      if (res.ok) {
        showToast('success', 'Deleted', 'Record removed successfully.');
        if (itemToDelete.type === 'bill') fetchBills();
        else fetchVendors();
      } else {
        const errData = await res.json();
        showToast('error', 'Delete Failed', errData.message || 'Could not delete item.');
      }
    } catch (err) {
      showToast('error', 'Error', 'Failed to delete record.');
    } finally {
      setShowConfirmModal(false);
      setItemToDelete(null);
    }
  };

  const handlePrintBill = (bill) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Bill #${bill.billNumber}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 24px; color: #0F172A; }
          .invoice-header { display: flex; justify-content: space-between; border-bottom: 2px solid #E2E8F0; padding-bottom: 16px; margin-bottom: 24px; }
          .invoice-title { font-size: 24px; font-weight: 800; color: #4F46E5; }
          .meta-info { margin-bottom: 24px; display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { background: #F8FAFC; text-align: left; padding: 10px; border-bottom: 1px solid #CBD5E1; font-size: 12px; text-transform: uppercase; }
          td { padding: 10px; border-bottom: 1px solid #E2E8F0; font-size: 14px; }
          .totals { width: 300px; margin-left: auto; text-align: right; }
          .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
          .grand-total { font-size: 18px; font-weight: 800; color: #4F46E5; border-top: 2px solid #E2E8F0; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div>
            <div class="invoice-title">PURCHASE INVOICE</div>
            <div style="color: #64748B; font-size: 13px; margin-top: 4px;">Garages Management System</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; font-size: 16px;">Bill #: ${bill.billNumber}</div>
            <div style="font-size: 13px; color: #64748B;">Date: ${formatDateShort(bill.billDate)}</div>
          </div>
        </div>
        <div class="meta-info">
          <div>
            <strong>Supplier:</strong> ${bill.supplierName || '—'}
          </div>
          <div>
            <strong>Payment Status:</strong> ${bill.paymentStatus}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Item Name</th>
              <th>Part No</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(bill.items || []).map((item, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${item.itemName}</strong></td>
                <td>${item.partNo || '—'}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">${formatCurrency(item.purchasePrice)}</td>
                <td style="text-align: right;">${formatCurrency(item.lineTotal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(bill.totalAmount || bill.netAmount)}</span>
          </div>
          <div class="totals-row">
            <span>Discount:</span>
            <span>-${formatCurrency(bill.discountAmount || 0)}</span>
          </div>
          <div class="totals-row">
            <span>Tax/GST:</span>
            <span>+${formatCurrency(bill.taxAmount || 0)}</span>
          </div>
          <div class="totals-row grand-total">
            <span>Net Total:</span>
            <span>${formatCurrency(bill.netAmount)}</span>
          </div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="purchase-history-page">
      <ToastContainer>
        {toast && <CustomToast type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />}
      </ToastContainer>

      <LoadingOverlay show={loading} message="Loading financial records..." />

      <ConfirmModal
        isOpen={showConfirmModal}
        title="Confirm Deletion"
        message="Are you sure you want to delete this record? Stock and ledger balances will be updated."
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowConfirmModal(false)}
        confirmText="Delete"
        variant="danger"
      />

      {/* HEADER ROW */}
      <div className="page-header-row mb-4">
        <div>
          <h2 className="page-title d-flex align-items-center gap-2">
            <FaReceipt className="text-primary" /> Purchase & Vendor Management
          </h2>
          <p className="page-subtitle text-muted mb-0">
            Track purchase bills, record supplier payments, and monitor vendor accounts ledger
          </p>
        </div>
        <div>
          <Button 
            variant="primary" 
            onClick={() => navigate('/record-purchase')}
            className="d-flex align-items-center gap-2 fw-semibold px-4 rounded-pill shadow-sm"
          >
            <FaPlus /> Record Purchase Bill
          </Button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <Row className="g-3 mb-4">
        <Col md={4} sm={12}>
          <Card className="stat-card border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div>
                <span className="stat-card-title text-uppercase text-muted fw-bold">Total Purchases</span>
                <h3 className="stat-card-value fw-extrabold mb-0 text-primary">{formatCurrency(summary.totalAmount)}</h3>
                <small className="text-muted">{totalBillsCount} Invoices Billed</small>
              </div>
              <div className="stat-icon-wrapper primary rounded-4 p-3 bg-primary bg-opacity-10 text-primary">
                <FaFileInvoiceDollar size={24} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} sm={6}>
          <Card className="stat-card border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div>
                <span className="stat-card-title text-uppercase text-muted fw-bold">Total Paid</span>
                <h3 className="stat-card-value fw-extrabold mb-0 text-success">{formatCurrency(summary.totalPaid)}</h3>
                <small className="text-muted">Paid to suppliers</small>
              </div>
              <div className="stat-icon-wrapper success rounded-4 p-3 bg-success bg-opacity-10 text-success">
                <FaMoneyBillWave size={24} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} sm={6}>
          <Card className="stat-card border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div>
                <span className="stat-card-title text-uppercase text-muted fw-bold">Total Outstanding</span>
                <h3 className="stat-card-value fw-extrabold mb-0 text-danger">{formatCurrency(summary.outstanding)}</h3>
                <small className="text-muted">Balance owing to vendors</small>
              </div>
              <div className="stat-icon-wrapper danger rounded-4 p-3 bg-danger bg-opacity-10 text-danger">
                <FaWallet size={24} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* MAIN CONTENT CARD WITH TABS */}
      <Card className="border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        <Card.Header className="bg-white border-bottom p-0">
          <Tabs 
            activeKey={activeTab} 
            onSelect={(k) => setActiveTab(k)} 
            className="custom-tabs px-3 pt-2"
          >
            <Tab eventKey="bills" title={<span className="fw-bold d-flex align-items-center gap-2"><FaReceipt /> Purchase Bills</span>} />
            <Tab eventKey="vendors" title={<span className="fw-bold d-flex align-items-center gap-2"><FaUserTie /> Vendor Ledgers</span>} />
          </Tabs>
        </Card.Header>

        <Card.Body className="p-4">
          {/* TAB 1: PURCHASE BILLS */}
          {activeTab === 'bills' && (
            <>
              {/* FILTER BAR */}
              <div className="p-3 bg-light rounded-4 border mb-4">
                <Row className="g-2 align-items-center">
                  <Col md={3} sm={6}>
                    <Form.Control 
                      type="date"
                      value={filters.dateFrom}
                      onChange={e => setFilters({...filters, dateFrom: e.target.value})}
                      placeholder="From Date"
                      className="bg-white"
                    />
                  </Col>
                  <Col md={3} sm={6}>
                    <Form.Control 
                      type="date"
                      value={filters.dateTo}
                      onChange={e => setFilters({...filters, dateTo: e.target.value})}
                      placeholder="To Date"
                      className="bg-white"
                    />
                  </Col>
                  <Col md={3} sm={6}>
                    <Form.Select 
                      value={filters.supplierId}
                      onChange={e => setFilters({...filters, supplierId: e.target.value})}
                      className="bg-white"
                    >
                      <option value="">All Suppliers</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={3} sm={6}>
                    <Form.Select 
                      value={filters.paymentStatus}
                      onChange={e => setFilters({...filters, paymentStatus: e.target.value})}
                      className="bg-white"
                    >
                      <option value="All">All Payment Statuses</option>
                      <option value="Unpaid">Unpaid Only</option>
                      <option value="Partial">Partial Only</option>
                      <option value="Paid">Paid Only</option>
                    </Form.Select>
                  </Col>
                </Row>
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <InputGroup size="sm" style={{ maxWidth: '300px' }}>
                    <InputGroup.Text className="bg-white border-end-0 text-muted"><FaSearch /></InputGroup.Text>
                    <Form.Control 
                      placeholder="Search Bill #"
                      value={filters.search}
                      onChange={e => setFilters({...filters, search: e.target.value})}
                      className="bg-white border-start-0 ps-0"
                    />
                  </InputGroup>

                  <div className="d-flex gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={handleResetFilter} className="d-flex align-items-center gap-1">
                      <FaRedo size={12} /> Reset
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleApplyFilter} className="d-flex align-items-center gap-1 px-3">
                      <FaFilter size={12} /> Filter
                    </Button>
                  </div>
                </div>
              </div>

              {/* BILLS TABLE */}
              <div className="table-responsive border rounded-3 mb-3">
                <Table hover className="saas-table align-middle mb-0">
                  <thead className="bg-light text-uppercase text-muted small fw-bold">
                    <tr>
                      <th>Bill Date</th>
                      <th>Bill #</th>
                      <th>Supplier Name</th>
                      <th className="text-end">Net Amount</th>
                      <th className="text-end">Amount Paid</th>
                      <th className="text-end">Balance Due</th>
                      <th className="text-center">Status</th>
                      <th className="text-end pe-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.length > 0 ? (
                      bills.map(bill => {
                        const statusClass = 
                          bill.paymentStatus === 'Paid' ? 'bg-success bg-opacity-10 text-success border-success border-opacity-25' :
                          bill.paymentStatus === 'Partial' ? 'bg-warning bg-opacity-10 text-warning border-warning border-opacity-25' :
                          'bg-danger bg-opacity-10 text-danger border-danger border-opacity-25';

                        return (
                          <tr key={bill.id}>
                            <td className="fw-semibold">{formatDateShort(bill.billDate)}</td>
                            <td><code className="fw-bold">{bill.billNumber}</code></td>
                            <td className="fw-bold text-dark">{bill.supplierName || '—'}</td>
                            <td className="text-end fw-extrabold text-dark">{formatCurrency(bill.netAmount)}</td>
                            <td className="text-end fw-semibold text-success">{formatCurrency(bill.amountPaid)}</td>
                            <td className="text-end fw-bold text-danger">{formatCurrency(bill.amountDue)}</td>
                            <td className="text-center">
                              <Badge className={`px-3 py-1 rounded-pill border ${statusClass}`}>
                                {bill.paymentStatus}
                              </Badge>
                            </td>
                            <td className="text-end pe-3">
                              <Button variant="light" size="sm" onClick={() => handleViewBill(bill)} className="me-1 text-primary btn-icon-hover" title="View & Print Bill">
                                <FaEye />
                              </Button>
                              {bill.paymentStatus !== 'Paid' && (
                                <Button variant="light" size="sm" onClick={() => handleOpenPaymentModal('bill', bill)} className="me-1 text-success btn-icon-hover" title="Record Payment">
                                  <FaMoneyBillWave />
                                </Button>
                              )}
                              <Button variant="light" size="sm" onClick={() => navigate('/record-purchase', { state: { bill } })} className="me-1 text-secondary btn-icon-hover" title="Edit Bill">
                                <FaEdit />
                              </Button>
                              <Button variant="light" size="sm" onClick={() => handleDeleteItem('bill', bill.id)} className="text-danger btn-icon-hover" title="Delete Bill">
                                <FaTrashAlt />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center py-5 text-muted">
                          No purchase bills found matching search filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>

              <SaaSDataPagination 
                currentPage={filters.page}
                pageSize={filters.pageSize}
                totalCount={totalBillsCount}
                onPageChange={(p) => setFilters(prev => ({ ...prev, page: p }))}
                onPageSizeChange={(sz) => setFilters(prev => ({ ...prev, pageSize: sz, page: 1 }))}
              />
            </>
          )}

          {/* TAB 2: VENDORS & LEDGER */}
          {activeTab === 'vendors' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold text-dark mb-0">Registered Suppliers Catalog</h5>
                <Button variant="primary" onClick={() => handleOpenVendorModal()} className="d-flex align-items-center gap-2 fw-semibold px-4 rounded-pill">
                  <FaPlus /> Add New Supplier
                </Button>
              </div>

              <div className="table-responsive border rounded-3">
                <Table hover className="saas-table align-middle mb-0">
                  <thead className="bg-light text-uppercase text-muted small fw-bold">
                    <tr>
                      <th>Supplier Name</th>
                      <th>Contact Person</th>
                      <th>Phone</th>
                      <th>City</th>
                      <th className="text-end">Total Billed</th>
                      <th className="text-end">Total Paid</th>
                      <th className="text-end">Outstanding Balance</th>
                      <th className="text-end pe-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.length > 0 ? (
                      vendors.map(v => (
                        <tr key={v.id}>
                          <td className="fw-extrabold text-dark fs-6">{v.name}</td>
                          <td className="fw-semibold">{v.contactPerson || '—'}</td>
                          <td>{v.phone || '—'}</td>
                          <td>{v.city || '—'}</td>
                          <td className="text-end fw-semibold">{formatCurrency(v.totalPurchased)}</td>
                          <td className="text-end fw-semibold text-success">{formatCurrency(v.totalPaid)}</td>
                          <td className="text-end fw-extrabold">
                            <span className={v.outstandingBalance > 0 ? 'text-danger' : 'text-success'}>
                              {formatCurrency(v.outstandingBalance)}
                            </span>
                          </td>
                          <td className="text-end pe-3">
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => handleOpenLedger(v)}
                              className="me-2 fw-semibold"
                            >
                              <FaBook className="me-1" /> Ledger
                            </Button>
                            <Button 
                              variant="light" 
                              size="sm" 
                              onClick={() => handleOpenVendorModal(v)}
                              className="me-1 text-primary btn-icon-hover"
                            >
                              <FaEdit />
                            </Button>
                            <Button 
                              variant="light" 
                              size="sm" 
                              onClick={() => handleDeleteItem('vendor', v.id)}
                              className="text-danger btn-icon-hover"
                            >
                              <FaTrashAlt />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center py-5 text-muted">
                          No registered suppliers found. Click "+ Add New Supplier" to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* VIEW BILL MODAL */}
      <Modal show={showViewBillModal} onHide={() => setShowViewBillModal(false)} size="lg" centered>
        {selectedBill && (
          <>
            <Modal.Header closeButton className="border-bottom bg-light">
              <Modal.Title className="fw-bold text-dark">
                Purchase Invoice #{selectedBill.billNumber}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <Row className="mb-4">
                <Col md={6}>
                  <div className="text-muted small text-uppercase fw-bold">Supplier Details</div>
                  <div className="fs-5 fw-bold text-dark">{selectedBill.supplierName}</div>
                  <div className="text-muted small">Date: {formatDateShort(selectedBill.billDate)}</div>
                </Col>
                <Col md={6} className="text-md-end">
                  <div className="text-muted small text-uppercase fw-bold">Payment Status</div>
                  <Badge bg={selectedBill.paymentStatus === 'Paid' ? 'success' : 'danger'} className="fs-6 px-3 py-2 rounded-pill">
                    {selectedBill.paymentStatus}
                  </Badge>
                </Col>
              </Row>

              <Table hover className="saas-table align-middle border rounded-3 mb-4">
                <thead className="bg-light text-uppercase text-muted small fw-bold">
                  <tr>
                    <th>#</th>
                    <th>Item Description</th>
                    <th>Part No</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end">Price</th>
                    <th className="text-end">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedBill.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="text-muted small">{idx + 1}</td>
                      <td className="fw-bold text-dark">{item.itemName}</td>
                      <td><code>{item.partNo || '—'}</code></td>
                      <td className="text-center fw-bold">{item.quantity}</td>
                      <td className="text-end">{formatCurrency(item.purchasePrice)}</td>
                      <td className="text-end fw-bold text-primary">{formatCurrency(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <Row className="justify-content-end">
                <Col md={6}>
                  <div className="bg-light p-3 rounded-3 border">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Subtotal:</span>
                      <span className="fw-semibold">{formatCurrency(selectedBill.totalAmount || selectedBill.netAmount)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Discount:</span>
                      <span className="fw-semibold text-danger">-{formatCurrency(selectedBill.discountAmount)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">GST / Tax:</span>
                      <span className="fw-semibold">+{formatCurrency(selectedBill.taxAmount)}</span>
                    </div>
                    <div className="d-flex justify-content-between pt-2 border-top fs-5 fw-bold">
                      <span>Net Total:</span>
                      <span className="text-primary">{formatCurrency(selectedBill.netAmount)}</span>
                    </div>
                  </div>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer className="bg-light border-top p-3">
              <Button variant="outline-secondary" onClick={() => setShowViewBillModal(false)}>Close</Button>
              <Button variant="primary" onClick={() => handlePrintBill(selectedBill)} className="d-flex align-items-center gap-2 fw-bold">
                <FaPrint /> Print Invoice
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* RECORD PAYMENT MODAL */}
      <Modal show={showPaymentModal && !!paymentTarget?.data} onHide={() => setShowPaymentModal(false)} centered>
        <Modal.Header closeButton className="border-bottom bg-light">
          <Modal.Title className="fw-bold text-dark">Record Supplier Payment</Modal.Title>
        </Modal.Header>
        {paymentTarget?.data && (
          <>
            <Modal.Body className="p-4">
              <div className="p-3 bg-light rounded-4 border text-center mb-4">
                <div className="text-muted small fw-bold text-uppercase">
                  {paymentTarget.type === 'bill' ? `Paying against Bill #${paymentTarget.data.billNumber}` : `Payment to ${paymentTarget.data.name}`}
                </div>
                <div className="fs-3 fw-extrabold text-danger mt-1">
                  Balance: {formatCurrency(paymentTarget.type === 'bill' ? paymentTarget.data.amountDue : paymentTarget.data.outstandingBalance)}
                </div>
              </div>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-uppercase text-muted">Payment Amount (₹) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    required
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                    className="fw-extrabold fs-5"
                  />
                </Form.Group>

                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small text-uppercase text-muted">Payment Method</Form.Label>
                      <Form.Select 
                        value={paymentForm.paymentMethod}
                        onChange={e => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI / GPay</option>
                        <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                        <option value="Cheque">Cheque</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small text-uppercase text-muted">Payment Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={paymentForm.paymentDate}
                        onChange={e => setPaymentForm({...paymentForm, paymentDate: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-uppercase text-muted">Reference / UTR / Cheque #</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Transaction reference number..."
                    value={paymentForm.referenceNo}
                    onChange={e => setPaymentForm({...paymentForm, referenceNo: e.target.value})}
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label className="fw-bold small text-uppercase text-muted">Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Payment notes..."
                    value={paymentForm.notes}
                    onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})}
                  />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer className="bg-light border-top p-3">
              <Button variant="outline-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
              <Button variant="success" onClick={handleSavePayment} className="px-4 fw-bold">Record Payment</Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* ADD / EDIT VENDOR MODAL */}
      <Modal show={showVendorModal} onHide={() => setShowVendorModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-bottom bg-light">
          <Modal.Title className="fw-bold text-dark">
            {vendorForm.id ? `Edit Supplier: ${vendorForm.name}` : 'Add New Supplier'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveVendor}>
          <Modal.Body className="p-4">
            <Row className="g-3">
              <Col md={8}>
                <Form.Group>
                  <Form.Label className="fw-bold small text-uppercase text-muted">Business / Vendor Name *</Form.Label>
                  <Form.Control 
                    type="text"
                    required
                    value={vendorForm.name}
                    onChange={e => setVendorForm({...vendorForm, name: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold small text-uppercase text-muted">Contact Person</Form.Label>
                  <Form.Control 
                    type="text"
                    value={vendorForm.contactPerson}
                    onChange={e => setVendorForm({...vendorForm, contactPerson: e.target.value})}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small text-uppercase text-muted">Phone Number</Form.Label>
                  <Form.Control 
                    type="text"
                    value={vendorForm.phone}
                    onChange={e => setVendorForm({...vendorForm, phone: e.target.value})}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small text-uppercase text-muted">GSTIN Number</Form.Label>
                  <Form.Control 
                    type="text"
                    value={vendorForm.gstNumber}
                    onChange={e => setVendorForm({...vendorForm, gstNumber: e.target.value})}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small text-uppercase text-muted">City</Form.Label>
                  <Form.Control 
                    type="text"
                    value={vendorForm.city}
                    onChange={e => setVendorForm({...vendorForm, city: e.target.value})}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small text-uppercase text-muted">Credit Days</Form.Label>
                  <Form.Control 
                    type="number"
                    value={vendorForm.creditDays}
                    onChange={e => setVendorForm({...vendorForm, creditDays: e.target.value})}
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold small text-uppercase text-muted">Full Address</Form.Label>
                  <Form.Control 
                    as="textarea"
                    rows={2}
                    value={vendorForm.address}
                    onChange={e => setVendorForm({...vendorForm, address: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="bg-light border-top p-3">
            <Button variant="outline-secondary" onClick={() => setShowVendorModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" className="px-4 fw-bold">Save Supplier</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* VENDOR LEDGER OFFCANVAS SIDE DRAWER */}
      <Offcanvas show={showLedgerOffcanvas} onHide={() => setShowLedgerOffcanvas(false)} placement="end" style={{ width: '480px' }}>
        {selectedLedgerVendor && (
          <>
            <Offcanvas.Header closeButton className="border-bottom bg-light">
              <Offcanvas.Title className="fw-bold text-dark d-flex align-items-center gap-2">
                <FaBook className="text-primary" /> Vendor Ledger Account
              </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body className="p-4">
              <div className="p-3 bg-light rounded-4 border mb-4">
                <div className="fs-5 fw-extrabold text-dark">{selectedLedgerVendor.name}</div>
                <div className="text-muted small mb-2">{selectedLedgerVendor.city || 'Location N/A'} | Ph: {selectedLedgerVendor.phone || 'N/A'}</div>
                <div className="d-flex justify-content-between pt-2 border-top mt-2">
                  <span className="text-muted small fw-bold text-uppercase">Balance Due:</span>
                  <span className={`fw-extrabold fs-5 ${selectedLedgerVendor.outstandingBalance > 0 ? 'text-danger' : 'text-success'}`}>
                    {formatCurrency(selectedLedgerVendor.outstandingBalance)}
                  </span>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-dark mb-0">Transaction Timeline History</h6>
                <Button 
                  variant="success" 
                  size="sm" 
                  onClick={() => handleOpenPaymentModal('vendor', selectedLedgerVendor)}
                  className="fw-bold px-3 rounded-pill"
                >
                  + Record Payment
                </Button>
              </div>

              <div className="ledger-timeline">
                {ledgerData.length > 0 ? (
                  ledgerData.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-3 mb-2 border ${item.type === 'bill' ? 'bg-primary bg-opacity-10 border-primary border-opacity-25' : 'bg-success bg-opacity-10 border-success border-opacity-25'}`}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-bold text-dark fs-6">
                            {item.type === 'bill' ? `Purchase Bill #${item.billNumber}` : `Payment (${item.paymentMethod})`}
                          </div>
                          <small className="text-muted">{formatDateShort(item.date)}</small>
                        </div>
                        <div className="text-end">
                          <div className={`fw-extrabold fs-6 ${item.type === 'bill' ? 'text-danger' : 'text-success'}`}>
                            {item.type === 'bill' ? '+' : '-'}{formatCurrency(item.amount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-5 text-muted">
                    No transactions recorded for this vendor yet.
                  </div>
                )}
              </div>
            </Offcanvas.Body>
          </>
        )}
      </Offcanvas>

    </div>
  );
};

export default PurchaseHistoryPage;
