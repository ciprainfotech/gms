import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Form, Button, Modal, Row, Col } from 'react-bootstrap';
import { FaReceipt, FaMoneyBillWave, FaTrash, FaPlus, FaEye, FaDollarSign, FaExclamationCircle } from 'react-icons/fa';
import api from '../api/api';
import RecordPaymentModal from '../components/RecordPaymentModal';

import PageShell from '../components/ui/PageShell';
import StatCard from '../components/ui/StatCard';
import FilterBar from '../components/ui/FilterBar';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useToast } from '../contexts/ToastContext';
import { useGarage } from '../contexts/GarageContext';

const formatCurrency = (amount) => {
  if (amount == null || isNaN(Number(amount))) return '₹0.00';
  return Number(amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateString;
  }
};

const InvoicesPage = () => {
  const toast = useToast();
  const { isSuspended } = useGarage();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // UI Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Delete States
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkEndDate, setBulkEndDate] = useState('');

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const response = await api.get('/invoices');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch invoices');
      }
      const data = await response.json();
      const sortedInvoices = (data.invoices || []).sort((a, b) => new Date(b.date_issued) - new Date(a.date_issued));
      setInvoices(sortedInvoices);
    } catch (error) {
      setFetchError(error.message || 'An unexpected error occurred while fetching invoices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Compute KPI Stats
  const stats = useMemo(() => {
    let totalCount = invoices.length;
    let totalAmount = 0;
    let unpaidSum = 0;
    let paidCount = 0;

    invoices.forEach(inv => {
      const grandTotal = Number(inv.grand_total) || 0;
      const amountPaid = Number(inv.amount_paid) || 0;
      totalAmount += grandTotal;
      const status = (inv.status || inv.payment_status || '').toLowerCase();
      if (status === 'paid') {
        paidCount++;
      } else {
        unpaidSum += (grandTotal - amountPaid);
      }
    });

    return {
      totalCount,
      totalAmount,
      unpaidSum,
      paidCount
    };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const term = searchTerm.trim().toLowerCase();
      const invoiceNum = (inv.invoice_number || inv.id?.toString() || '').toLowerCase();
      const customerName = (inv.customer_name || '').toLowerCase();
      const vehicleNum = (inv.vehicle_car_number || inv.car_number || '').toLowerCase();
      const jobSheetNum = (inv.job_sheet_number || '').toLowerCase();

      const matchesSearch = !term || (
        invoiceNum.includes(term) ||
        customerName.includes(term) ||
        vehicleNum.includes(term) ||
        jobSheetNum.includes(term)
      );

      const status = (inv.status || inv.payment_status || '').toLowerCase();
      let matchesStatus = filterStatus === 'all';
      if (filterStatus === 'paid') {
        matchesStatus = status === 'paid';
      } else if (filterStatus === 'unpaid') {
        matchesStatus = status === 'unpaid' || status === 'pending' || status === 'due';
      } else if (filterStatus === 'partial') {
        matchesStatus = status.includes('partial');
      }
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, filterStatus]);

  const handleSingleDelete = async () => {
    if (!invoiceToDelete) return;
    setIsDeleting(true);
    try {
      const response = await api.delete(`/invoices/${invoiceToDelete.id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete invoice');
      }
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceToDelete.id));
      toast.success(`Invoice #${invoiceToDelete.invoice_number || invoiceToDelete.id} deleted`);
      setShowSingleModal(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
      setInvoiceToDelete(null);
    }
  };

  const executeBulkDelete = async () => {
    if (!bulkStartDate || !bulkEndDate) return;
    setIsDeleting(true);
    try {
      const res = await api.post('/invoices/bulk-delete', {
        startDate: bulkStartDate,
        endDate: bulkEndDate
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Bulk delete failed');

      toast.success(result.message || 'Bulk deletion completed successfully');
      setShowBulkConfirmModal(false);
      setShowBulkModal(false);
      fetchInvoices();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'date_issued',
      label: 'Date',
      sortable: true,
      render: (val) => formatDate(val)
    },
    {
      key: 'invoice_number',
      label: 'Invoice #',
      sortable: true,
      render: (val, row) => <strong className="text-primary">#{val || row.id}</strong>
    },
    {
      key: 'customer_name',
      label: 'Customer',
      sortable: true,
      render: (val, row) => (
        <div>
          <strong className="text-dark d-block">{val || 'N/A'}</strong>
          <small className="text-muted">{row.customer_phone || ''}</small>
        </div>
      )
    },
    {
      key: 'vehicle_number',
      label: 'Vehicle',
      sortable: true,
      render: (val, row) => val || row.vehicle_car_number || row.car_number || 'N/A'
    },
    {
      key: 'grand_total',
      label: 'Amount',
      sortable: true,
      render: (val) => <strong className="text-dark">{formatCurrency(val)}</strong>
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val, row) => <StatusBadge status={val || row.payment_status || 'Unpaid'} />
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (_, row) => {
        const statusStr = (row.status || row.payment_status || '').toLowerCase();
        return (
          <div className="d-flex gap-2 justify-content-end">
            <Link to={`/invoices/${row.id}/view`} className="btn-saas btn-saas-secondary" style={{ height: '34px', padding: '0 0.65rem' }}>
              <FaEye /> View
            </Link>
            {statusStr !== 'paid' && !isSuspended && (
              <button
                onClick={() => { setSelectedInvoice(row); setShowPaymentModal(true); }}
                className="btn-saas btn-saas-primary"
                style={{ height: '34px', padding: '0 0.65rem' }}
              >
                <FaMoneyBillWave /> Pay
              </button>
            )}
            {!isSuspended && (
              <button
                onClick={() => { setInvoiceToDelete(row); setShowSingleModal(true); }}
                className="btn-saas btn-saas-ghost text-danger"
                style={{ height: '34px', padding: '0 0.5rem' }}
                title="Delete Invoice"
              >
                <FaTrash />
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <PageShell
      title="Invoices & Billing"
      subtitle="Complete view of all customer invoices, payments, and balances"
      icon={FaReceipt}
      actions={
        <div className="d-flex gap-2">
          {!isSuspended && (
            <button onClick={() => setShowBulkModal(true)} className="btn-saas btn-saas-danger">
              <FaTrash /> Bulk Wipe Range
            </button>
          )}
          {!isSuspended && (
            <Link to="/create-invoice" className="btn-saas btn-saas-primary text-decoration-none">
              <FaPlus /> Create Invoice
            </Link>
          )}
        </div>
      }
    >
      <div className="stat-card-grid">
        <StatCard icon={FaReceipt} label="Total Invoices" value={stats.totalCount} iconColor="indigo" />
        <StatCard icon={FaDollarSign} label="Total Billed" value={formatCurrency(stats.totalAmount)} iconColor="emerald" />
        <StatCard icon={FaExclamationCircle} label="Outstanding Balance" value={formatCurrency(stats.unpaidSum)} iconColor="rose" />
      </div>

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search invoices by customer, vehicle, invoice #, or job sheet #..."
      >
        <Form.Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="form-select-saas"
          style={{ width: '180px' }}
        >
          <option value="all">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </Form.Select>
      </FilterBar>

      {fetchError && <div className="alert alert-danger mb-4 shadow-sm">{fetchError}</div>}

      <DataTable
        columns={columns}
        data={filteredInvoices}
        isLoading={loading}
        emptyTitle="No Invoices Found"
        emptyMessage={searchTerm || filterStatus !== 'all' ? 'No invoices match your search filters.' : 'You have not issued any invoices yet.'}
        pageSize={10}
      />

      <ConfirmDialog
        isOpen={showSingleModal}
        title="Delete Invoice"
        message={`Are you sure you want to delete Invoice #${invoiceToDelete?.invoice_number || invoiceToDelete?.id}?`}
        confirmText="Delete Invoice"
        isProcessing={isDeleting}
        onConfirm={handleSingleDelete}
        onCancel={() => setShowSingleModal(false)}
      />

      {/* Bulk Delete Modal */}
      <Modal show={showBulkModal} onHide={() => setShowBulkModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger fw-bold fs-6">Bulk Delete Invoices</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-secondary small mb-3">Select a date range to permanently delete invoices:</p>
          <Row className="g-2">
            <Col sm={6}>
              <Form.Label className="form-label-saas">Start Date</Form.Label>
              <Form.Control type="date" value={bulkStartDate} onChange={e => setBulkStartDate(e.target.value)} className="form-control-saas" />
            </Col>
            <Col sm={6}>
              <Form.Label className="form-label-saas">End Date</Form.Label>
              <Form.Control type="date" value={bulkEndDate} onChange={e => setBulkEndDate(e.target.value)} className="form-control-saas" />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowBulkModal(false)} className="btn-saas btn-saas-secondary">Cancel</Button>
          <Button variant="danger" disabled={!bulkStartDate || !bulkEndDate} onClick={() => { setShowBulkModal(false); setShowBulkConfirmModal(true); }} className="btn-saas btn-saas-danger">
            Next & Confirm
          </Button>
        </Modal.Footer>
      </Modal>

      <ConfirmDialog
        isOpen={showBulkConfirmModal}
        title="Wipe Invoice Range"
        message={`You are about to permanently delete all invoices issued between ${bulkStartDate} and ${bulkEndDate}.`}
        confirmText="Wipe Everything"
        typedConfirmation="DELETE"
        isProcessing={isDeleting}
        onConfirm={executeBulkDelete}
        onCancel={() => setShowBulkConfirmModal(false)}
      />

      {selectedInvoice && (
        <RecordPaymentModal
          show={showPaymentModal}
          onHide={() => setShowPaymentModal(false)}
          invoice={selectedInvoice}
          onPaymentSuccess={() => {
            fetchInvoices();
            setShowPaymentModal(false);
            toast.success('Payment recorded successfully!');
          }}
        />
      )}
    </PageShell>
  );
};

export default InvoicesPage;