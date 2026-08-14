import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card } from 'react-bootstrap';
import { FaEye, FaWrench, FaCar, FaUser, FaCalendarAlt, FaClipboardList, FaTrash, FaPlus } from 'react-icons/fa';
import api from '../api/api.js';

import PageShell from '../components/ui/PageShell';
import FilterBar from '../components/ui/FilterBar';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useToast } from '../contexts/ToastContext';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateString;
  }
};

const ActiveJobSheets = () => {
  const toast = useToast();
  const [activeJobSheets, setActiveJobSheets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobSheetToDelete, setJobSheetToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchActiveJobs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get('/jobsheets/active');
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to load active job sheets.');
        }
        const result = await res.json();
        setActiveJobSheets(result.data || []);
      } catch (err) {
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveJobs();
  }, []);

  const filteredJobSheets = useMemo(() => {
    if (!searchTerm.trim()) return activeJobSheets;
    const term = searchTerm.toLowerCase();
    return activeJobSheets.filter(job =>
      (job.jobSheetNumber || '').toLowerCase().includes(term) ||
      (job.vehicleNumber || '').toLowerCase().includes(term) ||
      (job.customerName || '').toLowerCase().includes(term) ||
      (job.vehicleModel || '').toLowerCase().includes(term)
    );
  }, [activeJobSheets, searchTerm]);

  const handleDeleteJobSheet = async () => {
    if (!jobSheetToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/jobsheets/${jobSheetToDelete.id}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete job sheet.');
      }
      setActiveJobSheets(prev => prev.filter(item => item.id !== jobSheetToDelete.id));
      toast.success(`Job sheet #${jobSheetToDelete.jobSheetNumber || jobSheetToDelete.id} deleted`);
      setShowDeleteModal(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
      setJobSheetToDelete(null);
    }
  };

  return (
    <PageShell
      title="Active Job Sheets"
      subtitle="Track ongoing repairs and active workshop jobs in real time"
      icon={FaWrench}
    >
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search active jobs by vehicle, customer, or job sheet #..."
      />

      {isLoading ? (
        <Row className="g-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Col key={idx} lg={4} md={6} sm={12}>
              <Card className="saas-card p-3 shadow-sm border-0">
                <SkeletonLoader.Line height="24px" width="50%" />
                <SkeletonLoader.Line height="16px" width="80%" />
                <SkeletonLoader.Line height="16px" width="60%" />
              </Card>
            </Col>
          ))}
        </Row>
      ) : error ? (
        <EmptyState title="Error Loading Jobs" message={error} />
      ) : filteredJobSheets.length === 0 ? (
        <EmptyState
          icon={FaWrench}
          title={searchTerm ? 'No Matching Jobs Found' : 'No Active Job Sheets'}
          message={searchTerm ? `No active workshop jobs match "${searchTerm}".` : 'There are currently no vehicles undergoing repair or active job sheets in the workshop.'}
          action={
            searchTerm ? (
              <button 
                type="button" 
                className="btn btn-outline-secondary rounded-pill px-4 fw-bold"
                onClick={() => setSearchTerm('')}
              >
                Clear Search Filter
              </button>
            ) : (
              <Link 
                to="/create-invoice" 
                className="btn btn-primary rounded-pill px-4 fw-bold text-decoration-none d-inline-flex align-items-center gap-2 shadow-sm"
              >
                <FaPlus /> Create Invoice / Job Sheet
              </Link>
            )
          }
        />
      ) : (
        <Row className="g-3">
          {filteredJobSheets.map((jobSheet) => (
            <Col key={jobSheet.id} lg={4} md={6} sm={12}>
              <Card className="saas-card shadow-sm border-0 h-100 p-3 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold mb-0 text-primary">#{jobSheet.jobSheetNumber || jobSheet.id}</h6>
                    <StatusBadge status={jobSheet.status || 'In Progress'} />
                  </div>

                  <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                    <FaCar className="text-secondary" /> {jobSheet.vehicleNumber}
                  </h5>

                  <p className="text-muted small mb-2 d-flex align-items-center gap-2">
                    <FaUser className="text-muted" /> {jobSheet.customerName || 'N/A'} — {jobSheet.vehicleModel || 'N/A'}
                  </p>

                  <div className="bg-light p-2 rounded small text-secondary mb-3" style={{ minHeight: '48px' }}>
                    <FaClipboardList className="me-1 text-muted" />
                    {jobSheet.keyProblems || jobSheet.notes || 'No issues listed.'}
                  </div>
                </div>

                <div className="pt-2 border-top d-flex justify-content-between align-items-center">
                  <small className="text-muted d-flex align-items-center gap-1">
                    <FaCalendarAlt /> {formatDate(jobSheet.dateCreated || jobSheet.created_at)}
                  </small>
                  <div className="d-flex gap-2">
                    <button
                      className="btn-saas btn-saas-ghost text-danger p-2"
                      onClick={() => { setJobSheetToDelete(jobSheet); setShowDeleteModal(true); }}
                      title="Delete Job Sheet"
                      style={{ height: '36px' }}
                    >
                      <FaTrash />
                    </button>
                    <Link
                      to={`/jobsheet/${jobSheet.id}`}
                      className="btn-saas btn-saas-primary text-decoration-none"
                      style={{ height: '36px', padding: '0 0.85rem' }}
                    >
                      <FaEye /> View Details
                    </Link>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <ConfirmDialog
        isOpen={showDeleteModal}
        title="Delete Job Sheet"
        message={`Are you sure you want to permanently delete job sheet #${jobSheetToDelete?.jobSheetNumber || jobSheetToDelete?.id}? This action cannot be undone.`}
        confirmText="Yes, Delete"
        isProcessing={isDeleting}
        onConfirm={handleDeleteJobSheet}
        onCancel={() => setShowDeleteModal(false)}
      />
    </PageShell>
  );
};

export default ActiveJobSheets;