import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Modal, Form, Row, Col, InputGroup, Alert, Badge, Container, Button, Table, ListGroup, Card
} from 'react-bootstrap';
import {
  FaPlus, FaSearch, FaEye, FaHistory, FaTools, FaCar, FaCheckCircle, FaSignInAlt, FaExclamationTriangle, FaInfoCircle,
  FaHourglassHalf, FaWrench, FaCheckDouble, FaCarCrash, FaQuestionCircle, FaStickyNote, FaUser, FaTrashAlt, FaShieldAlt
} from 'react-icons/fa';

import api from '../api/api.js';
import CheckinCard from '../components/CheckinCard';
import MasterDateController from '../components/MasterDateController';
import { useGlobalDate } from '../contexts/GlobalDateContext';
import { useGarage } from '../contexts/GarageContext';
import { useToast } from '../contexts/ToastContext';
import PageShell from '../components/ui/PageShell';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import { formatDate } from '../utils/dateUtils';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { garage, isSuspended } = useGarage();
  const toast = useToast();
  const { workingDate, today } = useGlobalDate();
  const isToday = workingDate === today;

  // --- State ---
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiMessage, setApiMessage] = useState({ type: '', text: '' });

  // Modal States
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showRegisterConfirmModal, setShowRegisterConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Kanban Card Density Mode: 'compact' | 'expanded'
  const [cardDensity, setCardDensity] = useState(() => {
    return localStorage.getItem('kanbanCardDensity') || 'expanded';
  });

  const toggleCardDensity = (mode) => {
    setCardDensity(mode);
    localStorage.setItem('kanbanCardDensity', mode);
  };

  // Form/Data States
  const [checkInCarNumber, setCheckInCarNumber] = useState('');
  const [checkInKeyProblems, setCheckInKeyProblems] = useState('');
  const [checkInError, setCheckInError] = useState('');
  const [carNumberToRegister, setCarNumberToRegister] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [jobToDelete, setJobToDelete] = useState(null);
  const [historyModalData, setHistoryModalData] = useState({ customer: null, jobSheets: [], error: null, loading: false });

  // --- Auto-Suggest States ---
  const [historySearchCar, setHistorySearchCar] = useState('');
  const [carSuggestions, setCarSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (location.state?.featureDenied) {
      setApiMessage({
        type: 'danger',
        text: `Module Locked: The "${location.state.featureDenied}" feature is disabled for your garage account by Cipra Infotech Admin.`
      });
    } else if (location.state?.accountSuspended) {
      setApiMessage({
        type: 'danger',
        text: `Account Suspended (Read-Only Mode): Creation of new cars, job sheets, or invoices is locked. You can browse histories and past records.`
      });
    }
  }, [location.state]);

  // Auto-Suggest Effect
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (historySearchCar.trim().length >= 2) {
        try {
          const res = await api.get(`/vehicles/search?q=${historySearchCar.trim()}`);
          if (res.ok) {
            const data = await res.json();
            setCarSuggestions(data.data || []);
            setShowSuggestions(true);
          }
        } catch (e) {
          // Ignore suggestion error
        }
      } else {
        setCarSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [historySearchCar]);

  // Fetch Dashboard Kanban Data
  useEffect(() => {
    const fetchKanban = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let url = '/dashboard/kanban-data';
        if (workingDate) {
          // Send the raw YYYY-MM-DD string directly to prevent local timezone shifts
          url = `/dashboard/kanban-data?date=${workingDate}`;
        }
        const res = await api.get(url);
        if (!res.ok) throw new Error('Could not fetch dashboard data.');
        const result = await res.json();
        setJobs(result.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchKanban();
  }, [workingDate, location.state]);

  // Derived Kanban Columns
  const waitingJobs = jobs.filter(j => j.status === 'Waiting');
  const inProgressJobs = jobs.filter(j => j.status === 'In Progress');
  const completedJobs = jobs.filter(j => j.status === 'Completed' || j.status === 'Invoiced');

  const updateJobInState = (updatedJob) => setJobs(prev => prev.map(j => (j.id === updatedJob.id ? { ...j, ...updatedJob } : j)));
  const addJobToState = (newJob) => setJobs(prev => [newJob, ...prev]);
  const removeJobFromState = (jobId) => setJobs(prev => prev.filter(j => j.id !== jobId));

  const handleNewCheckInClick = () => {
    setCheckInCarNumber('');
    setCheckInKeyProblems('');
    setCheckInError('');
    setShowCheckInModal(true);
  };

  const handleCheckInSubmit = async () => {
    const carNumToCheck = checkInCarNumber.trim().toUpperCase();
    if (!carNumToCheck) {
      setCheckInError('Please enter a car number.');
      return;
    }
    setCheckInError('');

    try {
      const res = await api.post('/vehicles/check', { car_number: carNumToCheck });
      const result = await res.json();

      if (res.ok && result.exists) {
        const jobSheetData = {
          vehicle_id: result.data.id,
          customer_id: result.data.customer_id,
          notes: checkInKeyProblems || 'No problems specified on check-in.',
          dateCreated: workingDate
        };
        const jobRes = await api.post('/jobsheets/check-in', jobSheetData);
        const jobResult = await jobRes.json();

        if (!jobRes.ok) throw new Error(jobResult.message || 'Failed to create Job Sheet.');

        addJobToState(jobResult.data);
        setShowCheckInModal(false);
        toast.success(`Vehicle ${carNumToCheck} checked in successfully!`);
      } else {
        setCarNumberToRegister(carNumToCheck);
        setShowCheckInModal(false);
        setShowRegisterConfirmModal(true);
      }
    } catch (err) {
      setCheckInError(err.message || 'An error occurred during check-in.');
    }
  };

  const handleConfirmRegistration = () => {
    setShowRegisterConfirmModal(false);
    navigate('/add-customer', { state: { carNumber: carNumberToRegister, keyProblems: checkInKeyProblems } });
  };

  const triggerStatusChange = (job, targetStatus) => {
    setSelectedJob(job);
    setNewStatus(targetStatus);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedJob) return;
    try {
      const res = await api.put(`/jobsheets/${selectedJob.id}/status`, { status: newStatus });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to update status.');
      updateJobInState(result.data);
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setShowStatusModal(false);
      setSelectedJob(null);
      setNewStatus('');
    }
  };

  const handleDeleteClick = (job) => {
    setJobToDelete(job);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;
    try {
      const res = await api.delete(`/jobsheets/${jobToDelete.id}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to cancel the job.');

      removeJobFromState(jobToDelete.id);
      toast.success('Check-in cancelled successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setShowDeleteModal(false);
      setJobToDelete(null);
    }
  };

  const handleHistoryLookupClick = () => {
    setHistorySearchCar('');
    setCarSuggestions([]);
    setHistoryModalData({ customer: null, jobSheets: [], error: null, loading: false });
    setShowHistoryModal(true);
  };

  const searchHistoryInModal = async (carNumOverride) => {
    const carNum = (carNumOverride || historySearchCar).trim().toUpperCase();
    if (!carNum) return;

    setShowSuggestions(false);
    setHistoryModalData({ customer: null, jobSheets: [], error: null, loading: true });

    try {
      const res = await api.get(`/vehicles/history/${carNum}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Vehicle not found.');

      const { customer, jobSheets } = result.data;
      const latestCompletedJob = jobSheets.find(js => js.status === 'Completed' && js.next_service_km);
      setHistoryModalData({
        customer: { ...customer, vehicleModel: `${customer.make || ''} ${customer.model || ''}`.trim(), carNumber: customer.car_number, nextServiceKm: latestCompletedJob?.next_service_km },
        jobSheets,
        error: jobSheets.length === 0 ? `No service history found for ${carNum}.` : null,
        loading: false
      });
    } catch (err) {
      setHistoryModalData({ customer: null, jobSheets: [], error: err.message, loading: false });
    }
  };

  const viewJobSheet = (jobSheetId) => {
    setShowHistoryModal(false);
    navigate(`/jobsheet/${jobSheetId}`);
  };

  if (isLoading) {
    return (
      <Container fluid className="dashboard-kanban d-flex flex-column min-vh-100 p-4">
        <SkeletonLoader.StatGrid count={3} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="p-4">
        <Alert variant="danger" className="shadow-sm">{error}</Alert>
      </Container>
    );
  }

  return (
    <PageShell
      title="Workshop Flow"
      subtitle="Track every vehicle from arrival to delivery in real time"
      icon={FaWrench}
      actions={
        <div className="d-flex gap-3 align-items-center flex-wrap">
          <div style={{ minWidth: '220px' }}>
            <MasterDateController />
          </div>

          {/* Density Toggle: Compact vs Expanded */}
          <div className="bg-light p-1 rounded-pill border border-light d-flex shadow-xs" style={{ height: '36px', alignItems: 'center' }}>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-2.5 py-0.5 fw-bold border-0 ${cardDensity === 'compact' ? 'btn-primary text-white shadow-xs' : 'btn-light text-secondary'}`}
              onClick={() => toggleCardDensity('compact')}
              style={{ fontSize: '11.5px' }}
              title="Compact View: Ultra-dense 2-line cards for viewing many cars with minimal scrolling"
            >
              Compact
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-2.5 py-0.5 fw-bold border-0 ${cardDensity === 'expanded' ? 'btn-primary text-white shadow-xs' : 'btn-light text-secondary'}`}
              onClick={() => toggleCardDensity('expanded')}
              style={{ fontSize: '11.5px' }}
              title="Expanded View: Full detailed cards"
            >
              Detailed
            </button>
          </div>

          <Button variant="outline-secondary" className="rounded-pill fw-bold px-3 py-2 shadow-xs d-flex align-items-center gap-1.5" onClick={handleHistoryLookupClick}>
            <FaHistory /> History Lookup
          </Button>
          <Button
            className="rounded-pill fw-bold px-4 py-2 shadow-sm d-flex align-items-center gap-1.5 text-white"
            onClick={handleNewCheckInClick}
            disabled={isSuspended}
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', border: 'none' }}
            title={isSuspended ? 'Account suspended: Read-only mode' : 'Check in vehicle'}
          >
            <FaPlus /> New Check-in
          </Button>
        </div>
      }
    >
      <div>
        {isSuspended && (
          <Alert variant="danger" className="shadow-sm border-0 rounded-4 mb-4 d-flex align-items-center">
            <FaExclamationTriangle className="fs-2 me-3 text-danger flex-shrink-0" />
            <div>
              <strong className="d-block fs-6 fw-bold">⚠️ Garage Account Suspended (Read-Only Mode)</strong>
              Your garage license is currently deactivated or suspended. You can browse past customer histories and job sheet records, but <strong>creation of new cars, job sheets, or invoices is locked</strong>.
            </div>
          </Alert>
        )}

        {apiMessage.text && (
          <Alert variant={apiMessage.type || 'danger'} dismissible onClose={() => setApiMessage({ type: '', text: '' })} className="shadow-sm border-0 rounded-4 mb-4">
            {apiMessage.text}
          </Alert>
        )}

        {/* --- CREATIVE WORKSHOP KPI SUMMARY BAR --- */}
        <Row className="g-3 mb-4">
          <Col md={3}>
            <Card className="border-0 shadow-sm rounded-4 p-3 d-flex flex-row align-items-center justify-content-between" style={{ backgroundColor: '#FFFFFF', borderLeft: '4px solid #F59E0B' }}>
              <div>
                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Vehicles Waiting</small>
                <h3 className="fw-bold text-dark mb-0 mt-0.5">{waitingJobs.length}</h3>
              </div>
              <div className="rounded-circle p-2.5 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#FEF3C7', color: '#D97706', width: '42px', height: '42px' }}>
                <FaHourglassHalf className="fs-5" />
              </div>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm rounded-4 p-3 d-flex flex-row align-items-center justify-content-between" style={{ backgroundColor: '#FFFFFF', borderLeft: '4px solid #4F46E5' }}>
              <div>
                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Under Repair</small>
                <h3 className="fw-bold text-primary mb-0 mt-0.5">{inProgressJobs.length}</h3>
              </div>
              <div className="rounded-circle p-2.5 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', width: '42px', height: '42px' }}>
                <FaWrench className="fs-5" />
              </div>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm rounded-4 p-3 d-flex flex-row align-items-center justify-content-between" style={{ backgroundColor: '#FFFFFF', borderLeft: '4px solid #10B981' }}>
              <div>
                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>{isToday ? 'Completed Today' : 'Completed'}</small>
                <h3 className="fw-bold text-success mb-0 mt-0.5">{completedJobs.length}</h3>
              </div>
              <div className="rounded-circle p-2.5 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#ECFDF5', color: '#10B981', width: '42px', height: '42px' }}>
                <FaCheckDouble className="fs-5" />
              </div>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm rounded-4 p-3 d-flex flex-row align-items-center justify-content-between" style={{ backgroundColor: '#FFFFFF', borderLeft: '4px solid #06B6D4' }}>
              <div>
                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Total Active Queue</small>
                <h3 className="fw-bold text-dark mb-0 mt-0.5">{waitingJobs.length + inProgressJobs.length}</h3>
              </div>
              <div className="rounded-circle p-2.5 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#E0F2FE', color: '#0284C7', width: '42px', height: '42px' }}>
                <FaCar className="fs-5" />
              </div>
            </Card>
          </Col>
        </Row>

        {/* --- HIGH-END KANBAN BOARD GRID --- */}
        <div className="kanban-board">
          {/* WAITING COLUMN */}
          <div className="kanban-column shadow-sm rounded-4 overflow-hidden" data-status="Waiting" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div className="kanban-column-header p-3 bg-white border-bottom d-flex align-items-center justify-content-between" style={{ borderTop: '3px solid #F59E0B' }}>
              <h5 className="kanban-column-title mb-0 fw-bold d-flex align-items-center text-dark" style={{ fontSize: '15px' }}>
                <FaHourglassHalf className="text-warning me-2" /> Waiting Queue
              </h5>
              <Badge bg="warning" text="dark" pill className="fw-bold px-2.5 py-1">{waitingJobs.length}</Badge>
            </div>
            <div className="kanban-column-content p-3" style={{ minHeight: '420px' }}>
              {waitingJobs.length === 0 ? (
                <div className="text-center py-5 px-3 rounded-4 my-2 border border-dashed bg-white">
                  <div className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px', backgroundColor: '#FEF3C7', color: '#D97706' }}>
                    <FaCar className="fs-3 opacity-75" />
                  </div>
                  <h6 className="fw-bold text-dark mb-1">Queue Empty</h6>
                  <p className="text-muted small mb-3">No vehicles are currently waiting in arrival line.</p>
                  <Button variant="outline-warning" size="sm" className="rounded-pill fw-bold px-3 py-1" onClick={handleNewCheckInClick} disabled={isSuspended}>
                    + Check-in Vehicle
                  </Button>
                </div>
              ) : (
                waitingJobs.map(job => (
                  <CheckinCard
                    key={job.id}
                    job={job}
                    density={cardDensity}
                    onStartRepair={() => triggerStatusChange(job, 'In Progress')}
                    onDelete={() => handleDeleteClick(job)}
                  />
                ))
              )}
            </div>
          </div>

          {/* IN PROGRESS COLUMN */}
          <div className="kanban-column shadow-sm rounded-4 overflow-hidden" data-status="In Progress" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div className="kanban-column-header p-3 bg-white border-bottom d-flex align-items-center justify-content-between" style={{ borderTop: '3px solid #4F46E5' }}>
              <h5 className="kanban-column-title mb-0 fw-bold d-flex align-items-center text-dark" style={{ fontSize: '15px' }}>
                <FaWrench className="text-primary me-2" /> Under Repair
              </h5>
              <Badge bg="primary" pill className="fw-bold px-2.5 py-1">{inProgressJobs.length}</Badge>
            </div>
            <div className="kanban-column-content p-3" style={{ minHeight: '420px' }}>
              {inProgressJobs.length === 0 ? (
                <div className="text-center py-5 px-3 rounded-4 my-2 border border-dashed bg-white">
                  <div className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px', backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
                    <FaTools className="fs-3 opacity-75" />
                  </div>
                  <h6 className="fw-bold text-dark mb-1">No Active Repairs</h6>
                  <p className="text-muted small mb-0">Technicians have completed all active job sheets.</p>
                </div>
              ) : (
                inProgressJobs.map(job => (
                  <CheckinCard key={job.id} job={job} density={cardDensity} onDelete={() => handleDeleteClick(job)} />
                ))
              )}
            </div>
          </div>

          {/* COMPLETED COLUMN */}
          <div className="kanban-column shadow-sm rounded-4 overflow-hidden" data-status="Completed" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div className="kanban-column-header p-3 bg-white border-bottom d-flex align-items-center justify-content-between" style={{ borderTop: '3px solid #10B981' }}>
              <h5 className="kanban-column-title mb-0 fw-bold d-flex align-items-center text-dark" style={{ fontSize: '15px' }}>
                <FaCheckDouble className="text-success me-2" /> {isToday ? 'Completed Today' : 'Completed'}
              </h5>
              <Badge bg="success" pill className="fw-bold px-2.5 py-1">{completedJobs.length}</Badge>
            </div>
            <div className="kanban-column-content p-3" style={{ minHeight: '420px' }}>
              {completedJobs.length === 0 ? (
                <div className="text-center py-5 px-3 rounded-4 my-2 border border-dashed bg-white">
                  <div className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px', backgroundColor: '#ECFDF5', color: '#10B981' }}>
                    <FaCheckCircle className="fs-3 opacity-75" />
                  </div>
                  <h6 className="fw-bold text-dark mb-1">{isToday ? 'No Deliveries Yet' : 'No Completed Jobs'}</h6>
                  <p className="text-muted small mb-0">Completed vehicle repairs for {isToday ? 'today' : 'this date'} will be listed here.</p>
                </div>
              ) : (
                completedJobs.map(job => (
                  <CheckinCard key={job.id} job={job} density={cardDensity} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================== MODALS ========================== */}

      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title>{newStatus === 'In Progress' && <FaTools className="me-2 text-warning" />} Confirm Status Change</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedJob && (
            <p>Change status for <strong>{selectedJob.vehicleNumber}</strong> ({selectedJob.vehicleModel}) to <strong>In Progress</strong>?</p>
          )}
          {newStatus === 'In Progress' && (
            <Alert variant="info" className="mt-2 d-flex align-items-center">
              <FaInfoCircle className="me-2" />
              <small>This will generate a job sheet number and move the vehicle to 'In Progress'.</small>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={confirmStatusChange}>Confirm</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showCheckInModal} onHide={() => setShowCheckInModal(false)} centered>
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title><FaSignInAlt className="me-2" /> Vehicle Check-in</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={(e) => { e.preventDefault(); handleCheckInSubmit(); }}>
            <Form.Group controlId="checkInCarNum" className="mb-3">
              <Form.Label className="form-label-saas">Car Registration Number <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., GJ01AB1234"
                value={checkInCarNumber}
                onChange={(e) => { setCheckInCarNumber(e.target.value.toUpperCase()); setCheckInError(''); }}
                autoFocus
                required
                isInvalid={!!checkInError}
                className="form-control-saas"
              />
              <Form.Control.Feedback type="invalid">{checkInError}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="checkInKeyProblems" className="mb-3">
              <Form.Label className="form-label-saas"><FaStickyNote className="me-1" /> Key Problems / Reason for Visit</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="e.g., Engine noise on start, AC not cooling..."
                value={checkInKeyProblems}
                onChange={(e) => setCheckInKeyProblems(e.target.value)}
                className="form-control-saas"
                style={{ height: 'auto' }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCheckInModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCheckInSubmit}>Next</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showRegisterConfirmModal} onHide={() => setShowRegisterConfirmModal(false)} centered size="sm">
        <Modal.Header closeButton className="modal-header-custom border-0">
          <Modal.Title><FaQuestionCircle className="text-warning me-2" /> Vehicle Not Found</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p>Vehicle with number <Badge bg="secondary">{carNumberToRegister}</Badge> was not found.</p>
          <p className="mb-0">Register this vehicle and its owner now?</p>
        </Modal.Body>
        <Modal.Footer className="border-0 justify-content-center">
          <Button variant="secondary" onClick={() => setShowRegisterConfirmModal(false)} size="sm">Cancel</Button>
          <Button variant="success" onClick={handleConfirmRegistration} size="sm"><FaPlus className="me-1" /> Register New</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="modal-header-danger">
          <Modal.Title><FaExclamationTriangle className="me-2" /> Confirm Cancellation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {jobToDelete && (
            <p>Are you sure you want to cancel the check-in for vehicle <strong>{jobToDelete.vehicleNumber}</strong> ({jobToDelete.vehicleModel})?</p>
          )}
          <Alert variant="warning" className="mt-3">
            <small>This action cannot be undone. The associated job sheet will be marked as cancelled.</small>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Close</Button>
          <Button variant="danger" onClick={confirmDelete}>Yes, Cancel Check-in</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} centered size="lg" className="history-modal history-modal-enhanced">
        <Modal.Header closeButton className="modal-header-custom border-0 pb-0 pt-3 px-4">
          <Modal.Title className="history-modal-title"><FaHistory className="me-2" /> Vehicle Service History</Modal.Title>
        </Modal.Header>
        <Modal.Body className="history-modal-body p-4">
          <div className="mb-4">
            <InputGroup className="history-search-group shadow-xs rounded-pill overflow-hidden border">
              <Form.Control
                type="text"
                placeholder="Search car registration number (e.g., GJ23BD7498)"
                value={historySearchCar}
                onChange={(e) => {
                  setHistorySearchCar(e.target.value.toUpperCase());
                  if (historyModalData.customer) {
                    setHistoryModalData({ customer: null, jobSheets: [], error: null, loading: false });
                  }
                }}
                onKeyDown={(e) => e.key === 'Enter' && searchHistoryInModal()}
                onFocus={() => { if (carSuggestions.length > 0 && !historyModalData.customer) setShowSuggestions(true); }}
                className="border-0 py-2.5 px-4 fw-bold shadow-none"
                style={{ fontSize: '14px' }}
              />
              <Button 
                variant="primary" 
                className="px-4 fw-bold d-flex align-items-center gap-1.5 rounded-pill m-1" 
                style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', border: 'none' }}
                onClick={() => searchHistoryInModal()}
              >
                <FaSearch /> Search
              </Button>
            </InputGroup>

            {showSuggestions && !historyModalData.customer && carSuggestions.length > 0 && (
              <div className="mt-2 border rounded-4 bg-white shadow-lg overflow-hidden" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                <ListGroup variant="flush">
                  {carSuggestions.map((item) => (
                    <ListGroup.Item
                      key={item.id}
                      action
                      onClick={() => {
                        setHistorySearchCar(item.car_number);
                        setShowSuggestions(false);
                        searchHistoryInModal(item.car_number);
                      }}
                      className="d-flex justify-content-between align-items-center py-2.5 px-3 border-bottom"
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center gap-2.5">
                        <span 
                          className="px-2 py-0.5 rounded-2 fw-bold text-dark" 
                          style={{ backgroundColor: '#FDE047', border: '1px solid #0F172A', fontSize: '11px', letterSpacing: '0.5px' }}
                        >
                          {item.car_number}
                        </span>
                        <div>
                          <strong className="text-dark d-block" style={{ fontSize: '13.5px' }}>{item.customer_name}</strong>
                          <small className="text-muted" style={{ fontSize: '11.5px' }}>{item.make || 'Vehicle'} {item.model || ''}</small>
                        </div>
                      </div>
                      <Button variant="outline-primary" size="sm" className="rounded-pill px-3 py-0.5 fw-bold" style={{ fontSize: '11px' }}>
                        View History
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}
          </div>

          {historyModalData.loading && (
            <div className="text-center py-5">
              <SkeletonLoader.Table rows={4} columns={5} />
            </div>
          )}

          {historyModalData.error && (
            <Alert variant="warning" className="text-center py-3 border-0 rounded-4 shadow-xs">{historyModalData.error}</Alert>
          )}

          {historyModalData.customer && (
            <Card className="border-0 shadow-xs rounded-4 mb-4 overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <div style={{ height: '4px', background: 'linear-gradient(90deg, #6366F1, #4F46E5)' }} />
              <Card.Body className="p-3.5">
                <Row className="align-items-center g-3">
                  <Col md={7}>
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle text-white p-2.5 me-3 d-flex align-items-center justify-content-center shadow-xs" style={{ backgroundColor: '#4F46E5', width: '42px', height: '42px' }}>
                        <FaUser style={{ fontSize: '16px' }} />
                      </div>
                      <div>
                        <h6 className="fw-bold text-dark mb-0 fs-6">{historyModalData.customer.name}</h6>
                        <div className="text-muted small d-flex align-items-center gap-2 mt-0.5" style={{ fontSize: '12px' }}>
                          <span>📞 {historyModalData.customer.phone}</span>
                          {historyModalData.customer.email && <span>• ✉️ {historyModalData.customer.email}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 d-flex align-items-center gap-2 flex-wrap">
                      <span 
                        className="px-2.5 py-1 rounded-2 fw-bold text-dark shadow-2xs" 
                        style={{ backgroundColor: '#FDE047', border: '1.5px solid #0F172A', letterSpacing: '0.8px', fontSize: '11.5px' }}
                      >
                        <span className="me-1" style={{ fontSize: '9px', opacity: 0.8 }}>IND</span>
                        {historyModalData.customer.carNumber}
                      </span>
                      <span className="badge bg-light text-dark border px-3 py-1.5 rounded-pill fw-semibold" style={{ fontSize: '12px' }}>
                        <FaCar className="me-1.5 text-primary" />
                        {historyModalData.customer.vehicleModel || `${historyModalData.customer.make || ''} ${historyModalData.customer.model || ''}`.trim() || 'Vehicle'}
                      </span>
                    </div>
                  </Col>
                  <Col md={5} className="text-md-end">
                    <div className="d-inline-block p-3 rounded-3 bg-light border text-start text-md-end" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                      <small className="text-muted d-block fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.6px' }}>Service Recommendation</small>
                      <span className="fw-bold text-primary" style={{ fontSize: '13px' }}>
                        {historyModalData.customer.nextServiceKm ? `Next Due at ${Number(historyModalData.customer.nextServiceKm).toLocaleString('en-IN')} KM` : 'Periodic 6 Months / 10,000 KM'}
                      </span>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {historyModalData.jobSheets.length > 0 && (
            <div className="table-responsive border rounded-4 overflow-hidden shadow-xs">
              <Table hover align="middle" className="mb-0 bg-white">
                <thead style={{ backgroundColor: '#F8FAFC' }}>
                  <tr>
                    <th className="py-3 px-3.5 fw-bold text-muted" style={{ fontSize: '11px', letterSpacing: '0.6px' }}>SERVICE DATE</th>
                    <th className="py-3 px-3.5 fw-bold text-muted" style={{ fontSize: '11px', letterSpacing: '0.6px' }}>JOB SHEET #</th>
                    <th className="py-3 px-3.5 fw-bold text-muted" style={{ fontSize: '11px', letterSpacing: '0.6px' }}>STATUS</th>
                    <th className="py-3 px-3.5 fw-bold text-muted" style={{ fontSize: '11px', letterSpacing: '0.6px' }}>ODOMETER (KM)</th>
                    <th className="py-3 px-3.5 text-end fw-bold text-muted" style={{ fontSize: '11px', letterSpacing: '0.6px' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {historyModalData.jobSheets.map((js) => {
                    let badgeBg = '#F1F5F9';
                    let badgeColor = '#475569';
                    let badgeBorder = '#E2E8F0';
                    let statusLabel = js.status;

                    if (js.status === 'Invoiced') {
                      badgeBg = '#E0F2FE';
                      badgeColor = '#0284C7';
                      badgeBorder = '#BAE6FD';
                      statusLabel = '🧾 Invoiced';
                    } else if (js.status === 'Completed') {
                      badgeBg = '#DCFCE7';
                      badgeColor = '#16A34A';
                      badgeBorder = '#86EFAC';
                      statusLabel = '✅ Completed';
                    } else if (js.status === 'In Progress') {
                      badgeBg = '#EEF2FF';
                      badgeColor = '#4F46E5';
                      badgeBorder = '#C7D2FE';
                      statusLabel = '🛠️ In Repair';
                    }

                    return (
                      <tr key={js.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td className="py-3 px-3.5 fw-semibold text-dark" style={{ fontSize: '13px' }}>
                          {formatDate(js.date_created || js.created_at)}
                        </td>
                        <td className="py-3 px-3.5">
                          <span 
                            className="fw-bold text-primary text-decoration-none" 
                            style={{ cursor: 'pointer', fontSize: '13.5px' }}
                            onClick={() => viewJobSheet(js.id)}
                          >
                            #{js.job_sheet_number || js.id}
                          </span>
                        </td>
                        <td className="py-3 px-3.5">
                          <span 
                            className="badge px-2.5 py-1 rounded-pill fw-bold"
                            style={{ backgroundColor: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}`, fontSize: '11px' }}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 fw-bold text-dark" style={{ fontSize: '13px' }}>
                          {js.km_reading ? `${Number(js.km_reading).toLocaleString('en-IN')} KM` : 'Standard Service'}
                        </td>
                        <td className="py-3 px-3.5 text-end">
                          <Button 
                            size="sm" 
                            variant="outline-primary" 
                            className="rounded-pill px-3 py-1 fw-bold d-inline-flex align-items-center gap-1 shadow-2xs"
                            style={{ fontSize: '12px' }}
                            onClick={() => viewJobSheet(js.id)}
                          >
                            <FaEye style={{ fontSize: '11px' }} /> View Sheet
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </PageShell>
  );
};

export default Dashboard;