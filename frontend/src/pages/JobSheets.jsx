import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Form, Button, Modal, Alert, Row, Col } from 'react-bootstrap';
import { FaEye, FaFileInvoiceDollar, FaArchive, FaTrash } from 'react-icons/fa';
import api from '../api/api';

import PageShell from '../components/ui/PageShell';
import FilterBar from '../components/ui/FilterBar';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useToast } from '../contexts/ToastContext';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    return dateString;
  }
};

const JobSheets = () => {
  const toast = useToast();
  const [allHistoricalSheets, setAllHistoricalSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Delete control states
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [sheetToDelete, setSheetToDelete] = useState(null);

  // Bulk Delete
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkEndDate, setBulkEndDate] = useState('');

  const fetchHistoricalSheets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/jobsheets/historical');
      if (!res.ok) throw new Error('Could not fetch historical job sheets.');
      const result = await res.json();
      setAllHistoricalSheets(Array.isArray(result) ? result : (result.data || []));
    } catch (err) {
      setError(err.message || 'An error occurred while fetching historical job sheets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistoricalSheets();
  }, [fetchHistoricalSheets]);

  const filteredSheets = useMemo(() => {
    return allHistoricalSheets.filter(sheet => {
      const term = searchTerm.trim().toLowerCase();
      const num = (sheet.jobSheetNumber || sheet.job_sheet_number || sheet.id?.toString() || '').toLowerCase();
      const car = (sheet.vehicleNumber || sheet.car_number || '').toLowerCase();
      const cust = (sheet.customerName || sheet.customer_name || '').toLowerCase();
      const vehicleModelStr = (sheet.vehicleModel || `${sheet.make || ''} ${sheet.model || ''}`).toLowerCase();

      const matchesSearch = !term || (
        num.includes(term) ||
        car.includes(term) ||
        cust.includes(term) ||
        vehicleModelStr.includes(term)
      );

      const matchesStatus = !statusFilter || (sheet.status || '').toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [allHistoricalSheets, searchTerm, statusFilter]);

  const handleSingleDelete = async () => {
    if (!sheetToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/jobsheets/${sheetToDelete.id}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete job sheet');
      }
      setAllHistoricalSheets(prev => prev.filter(s => s.id !== sheetToDelete.id));
      toast.success(`Job sheet #${sheetToDelete.jobSheetNumber || sheetToDelete.job_sheet_number || sheetToDelete.id} permanently deleted.`);
      setShowSingleModal(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
      setSheetToDelete(null);
    }
  };

  const executeBulkDelete = async () => {
    if (!bulkStartDate || !bulkEndDate) return;
    setIsDeleting(true);
    try {
      const res = await api.post('/jobsheets/bulk-delete', {
        startDate: bulkStartDate,
        endDate: bulkEndDate
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Bulk delete failed');

      toast.success(result.message || 'Bulk deletion completed successfully');
      setShowBulkConfirmModal(false);
      setShowBulkModal(false);
      fetchHistoricalSheets();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'dateCreated',
      label: 'Date',
      sortable: true,
      render: (val, row) => formatDate(val || row.date_created || row.created_at)
    },
    {
      key: 'jobSheetNumber',
      label: 'Job #',
      sortable: true,
      render: (val, row) => <strong className="text-primary">#{val || row.job_sheet_number || row.id}</strong>
    },
    {
      key: 'customerName',
      label: 'Customer',
      sortable: true,
      render: (val, row) => val || row.customer_name || 'N/A'
    },
    {
      key: 'vehicleNumber',
      label: 'Vehicle',
      sortable: true,
      render: (val, row) => {
        const vehicleNum = val || row.car_number || 'N/A';
        const modelStr = row.vehicleModel || `${row.make || ''} ${row.model || ''}`.trim();
        return (
          <div>
            <strong className="text-dark d-block">{vehicleNum}</strong>
            {modelStr && <small className="text-muted">{modelStr}</small>}
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (_, row) => (
        <div className="d-flex gap-2 justify-content-end">
          <Link to={`/jobsheet/${row.id}`} className="btn-saas btn-saas-secondary" style={{ height: '34px', padding: '0 0.65rem' }}>
            <FaEye /> View
          </Link>
          {row.status === 'Completed' && (
            <Link to="/create-invoice" state={{ jobSheetId: row.id }} className="btn-saas btn-saas-primary" style={{ height: '34px', padding: '0 0.65rem' }}>
              <FaFileInvoiceDollar /> Invoice
            </Link>
          )}
          <button
            onClick={() => { setSheetToDelete(row); setShowSingleModal(false); setShowSingleModal(true); }}
            className="btn-saas btn-saas-ghost text-danger"
            style={{ height: '34px', padding: '0 0.5rem' }}
            title="Delete"
          >
            <FaTrash />
          </button>
        </div>
      )
    }
  ];

  return (
    <PageShell
      title="Job Sheets Archive"
      subtitle="Complete history of all work orders, repairs, and invoices"
      icon={FaArchive}
      actions={
        <button
          onClick={() => setShowBulkModal(true)}
          className="btn-saas btn-saas-danger"
        >
          <FaTrash /> Bulk Wipe Range
        </button>
      }
    >
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search job sheets by customer, vehicle number, model, or job #..."
      >
        <Form.Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-select-saas"
          style={{ width: '180px' }}
        >
          <option value="">All Statuses</option>
          <option value="Completed">Completed</option>
          <option value="Invoiced">Invoiced</option>
          <option value="Cancelled">Cancelled</option>
        </Form.Select>
      </FilterBar>

      {error && <Alert variant="danger" className="mb-4 shadow-sm">{error}</Alert>}

      <DataTable
        columns={columns}
        data={filteredSheets}
        isLoading={loading}
        emptyTitle="No Job Sheets Found"
        emptyMessage={searchTerm || statusFilter ? 'No job sheets match your search filters.' : 'Your historical job sheet archive is empty.'}
        pageSize={12}
      />

      <ConfirmDialog
        isOpen={showSingleModal}
        title="Delete Job Sheet"
        message={`Are you sure you want to delete Job Sheet #${sheetToDelete?.jobSheetNumber || sheetToDelete?.job_sheet_number || sheetToDelete?.id}? This action cannot be undone.`}
        confirmText="Delete Job Sheet"
        isProcessing={isDeleting}
        onConfirm={handleSingleDelete}
        onCancel={() => setShowSingleModal(false)}
      />

      {/* Bulk Delete Modal */}
      <Modal show={showBulkModal} onHide={() => setShowBulkModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger fw-bold fs-6">Bulk Delete Job Sheets</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-secondary small mb-3">Select a date range to permanently delete job sheet records:</p>
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
        title="Wipe Date Range Data"
        message={`You are about to permanently delete all job sheets between ${bulkStartDate} and ${bulkEndDate}. All related records will be lost.`}
        confirmText="Wipe Everything"
        typedConfirmation="DELETE"
        isProcessing={isDeleting}
        onConfirm={executeBulkDelete}
        onCancel={() => setShowBulkConfirmModal(false)}
      />
    </PageShell>
  );
};

export default JobSheets;