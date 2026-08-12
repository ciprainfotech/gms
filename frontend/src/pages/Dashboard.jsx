import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Modal, Form, Row, Col, InputGroup, Alert, Badge, Container, Button, Table, ListGroup
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

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { garage, isSuspended } = useGarage();
  const toast = useToast();
  const { workingDate } = useGlobalDate();

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
          const d = new Date(workingDate);
          const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          url = `/dashboard/kanban-data?date=${formattedDate}`;
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

  const searchHistoryInModal = async () => {
    const carNum = historySearchCar.trim().toUpperCase();
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
          <div style={{ minWidth: '240px' }}>
            <MasterDateController />
          </div>
          <Button variant="outline-secondary" className="btn-saas btn-saas-secondary" onClick={handleHistoryLookupClick}>
            <FaHistory /> History Lookup
          </Button>
          <Button
            className="btn-saas btn-saas-primary"
            onClick={handleNewCheckInClick}
            disabled={isSuspended}
            title={isSuspended ? 'Account suspended: Read-only mode' : 'Check in vehicle'}
          >
            <FaPlus /> New Check-in
          </Button>
        </div>
      }
    >
      <div>
        {isSuspended && (
          <Alert variant="danger" className="shadow-sm border-0 rounded-3 mb-4 d-flex align-items-center">
            <FaExclamationTriangle className="fs-2 me-3 text-danger flex-shrink-0" />
            <div>
              <strong className="d-block fs-6 fw-bold">⚠️ Garage Account Suspended (Read-Only Mode)</strong>
              Your garage license is currently deactivated or suspended. You can browse past customer histories and job sheet records, but <strong>creation of new cars, job sheets, or invoices is locked</strong>.
            </div>
          </Alert>
        )}

        {apiMessage.text && (
          <Alert variant={apiMessage.type || 'danger'} dismissible onClose={() => setApiMessage({ type: '', text: '' })} className="shadow-sm">
            {apiMessage.text}
          </Alert>
        )}

        <div className="kanban-board mt-2">
          {/* WAITING COLUMN */}
          <div className="kanban-column" data-status="Waiting">
            <div className="kanban-column-header">
              <h3 className="kanban-column-title"><FaHourglassHalf className="text-warning" /> Waiting</h3>
              <span className="kanban-column-count">{waitingJobs.length}</span>
            </div>
            <div className="kanban-column-content">
              {waitingJobs.length === 0 ? (
                <div className="kanban-empty-state"><FaCarCrash className="fs-3 mb-2 opacity-50" /> No vehicles waiting.</div>
              ) : (
                waitingJobs.map(job => (
                  <CheckinCard
                    key={job.id}
                    job={job}
                    onStartRepair={() => triggerStatusChange(job, 'In Progress')}
                    onDelete={() => handleDeleteClick(job)}
                  />
                ))
              )}
            </div>
          </div>

          {/* IN PROGRESS COLUMN */}
          <div className="kanban-column" data-status="In Progress">
            <div className="kanban-column-header">
              <h3 className="kanban-column-title"><FaWrench className="text-primary" /> In Progress</h3>
              <span className="kanban-column-count">{inProgressJobs.length}</span>
            </div>
            <div className="kanban-column-content">
              {inProgressJobs.length === 0 ? (
                <div className="kanban-empty-state"><FaTools className="fs-3 mb-2 opacity-50" /> No vehicles in repair.</div>
              ) : (
                inProgressJobs.map(job => (
                  <CheckinCard key={job.id} job={job} onDelete={() => handleDeleteClick(job)} />
                ))
              )}
            </div>
          </div>

          {/* COMPLETED COLUMN */}
          <div className="kanban-column" data-status="Completed">
            <div className="kanban-column-header">
              <h3 className="kanban-column-title"><FaCheckDouble className="text-success" /> Completed Today</h3>
              <span className="kanban-column-count">{completedJobs.length}</span>
            </div>
            <div className="kanban-column-content">
              {completedJobs.length === 0 ? (
                <div className="kanban-empty-state"><FaCheckCircle className="fs-3 mb-2 opacity-50" /> No vehicles completed today.</div>
              ) : (
                completedJobs.map(job => (
                  <CheckinCard key={job.id} job={job} />
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
          <div className="position-relative mb-4">
            <InputGroup className="history-search-group">
              <Form.Control
                type="text"
                placeholder="Search partial or full car number (e.g., 7498)"
                value={historySearchCar}
                onChange={(e) => setHistorySearchCar(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && searchHistoryInModal()}
                onFocus={() => { if (carSuggestions.length > 0) setShowSuggestions(true); }}
                className="form-control-saas"
              />
              <Button variant="primary" onClick={searchHistoryInModal}><FaSearch /> Search</Button>
            </InputGroup>

            {showSuggestions && carSuggestions.length > 0 && (
              <ListGroup className="position-absolute w-100 shadow-lg custom-suggestions-dropdown" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                {carSuggestions.map((item) => (
                  <ListGroup.Item
                    key={item.id}
                    action
                    onClick={() => {
                      setHistorySearchCar(item.car_number);
                      setShowSuggestions(false);
                    }}
                    className="d-flex justify-content-between align-items-center py-2"
                  >
                    <div>
                      <strong className="text-dark d-block">{item.car_number}</strong>
                      <small className="text-muted">{item.customer_name} ({item.make} {item.model})</small>
                    </div>
                    <Badge bg="light" text="dark" className="border">Select</Badge>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>

          {historyModalData.loading && (
            <div className="text-center py-4"><SkeletonLoader.Table rows={3} columns={4} /></div>
          )}

          {historyModalData.error && (
            <Alert variant="warning" className="text-center py-3">{historyModalData.error}</Alert>
          )}

          {historyModalData.customer && (
            <div className="customer-info-banner p-3 mb-4 rounded-3 border bg-light">
              <Row className="align-items-center">
                <Col md={7}>
                  <h6 className="fw-bold mb-1"><FaUser className="me-2 text-primary" />{historyModalData.customer.name}</h6>
                  <p className="text-muted small mb-0"><FaCar className="me-1" /> {historyModalData.customer.carNumber} — {historyModalData.customer.vehicleModel}</p>
                </Col>
                <Col md={5} className="text-md-end mt-2 mt-md-0">
                  <Badge bg="primary" className="px-3 py-2">
                    Next Due: {historyModalData.customer.nextServiceKm ? `${historyModalData.customer.nextServiceKm} KM` : 'N/A'}
                  </Badge>
                </Col>
              </Row>
            </div>
          )}

          {historyModalData.jobSheets.length > 0 && (
            <div className="table-responsive">
              <Table hover align="middle" className="saas-table">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Job #</th>
                    <th>Status</th>
                    <th>Km Run</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {historyModalData.jobSheets.map((js) => (
                    <tr key={js.id}>
                      <td>{formatDate(js.date_created || js.created_at)}</td>
                      <td><strong className="text-primary">#{js.id}</strong></td>
                      <td><Badge bg={js.status === 'Completed' ? 'success' : js.status === 'In Progress' ? 'warning' : 'secondary'}>{js.status}</Badge></td>
                      <td>{js.km_run ? `${js.km_run} KM` : 'N/A'}</td>
                      <td>
                        <Button size="sm" variant="outline-primary" onClick={() => viewJobSheet(js.id)}>
                          <FaEye className="me-1" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
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