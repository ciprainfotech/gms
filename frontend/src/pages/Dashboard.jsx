import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
    Modal, Form, Row, Col, InputGroup, Alert, Badge, Container, Card, Spinner, Button, Table, ListGroup
} from 'react-bootstrap';
import {
    FaPlus, FaSearch, FaEye, FaHistory, FaTools, FaCar, FaCheckCircle, FaSignInAlt, FaExclamationTriangle, FaInfoCircle,
    FaHourglassHalf, FaWrench, FaCheckDouble, FaCarCrash, FaQuestionCircle, FaStickyNote, FaUser, FaTrashAlt, FaShieldAlt
} from 'react-icons/fa';

import api from '../api/api.js';
import CheckinCard from '../components/CheckinCard'; 
import "../App.css";

// --- Helper Functions ---
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
    const [checkInCarNumber, setCheckInCarNumber] = useState("");
    const [checkInKeyProblems, setCheckInKeyProblems] = useState("");
    const [checkInError, setCheckInError] = useState("");
    const [carNumberToRegister, setCarNumberToRegister] = useState("");
    const [selectedJob, setSelectedJob] = useState(null);
    const [newStatus, setNewStatus] = useState("");
    const [jobToDelete, setJobToDelete] = useState(null);
    const [historyModalData, setHistoryModalData] = useState({ customer: null, jobSheets: [], error: null, loading: false });

    // --- Auto-Suggest States ---
    const [historySearchCar, setHistorySearchCar] = useState("");
    const [carSuggestions, setCarSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // --- Auto-Suggest Effect (Debounced) ---
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
                    console.error("Auto-suggest error:", e);
                }
            } else {
                setCarSuggestions([]);
                setShowSuggestions(false);
            }
        };

        const debounceTimer = setTimeout(() => {
            fetchSuggestions();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [historySearchCar]);

    // --- Data Load Effect ---
    useEffect(() => {
        const initializeDashboard = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                const meResponse = await api.get('/auth/me');
                if (!meResponse.ok) throw new Error('Could not verify your session. Please log in again.');
                
                const meData = await meResponse.json();
                if (meData.garages && meData.garages.length > 0) {
                    const defaultGarageId = meData.garages[0].id;
                    const selectResponse = await api.post('/auth/select-garage', { garageId: defaultGarageId });
                    if (!selectResponse.ok) throw new Error('There was a problem selecting your default garage.');
                } else {
                    throw new Error('You are not assigned to any garage. Please contact an administrator.');
                }

                const kanbanResponse = await api.get('/dashboard/kanban-data');
                if (!kanbanResponse.ok) {
                    const errData = await kanbanResponse.json();
                    throw new Error(errData.message || 'Could not fetch dashboard data.');
                }
                const kanbanResult = await kanbanResponse.json();
                setJobs(kanbanResult.data);

            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        initializeDashboard();
    }, [location.state]); 

    // --- Derived State for Kanban Columns ---
    const waitingJobs = jobs.filter(j => j.status === 'Waiting');
    const inProgressJobs = jobs.filter(j => j.status === 'In Progress');
    const completedJobs = jobs.filter(j => j.status === 'Completed');

    // --- State Update Helpers ---
    const updateJobInState = (updatedJob) => setJobs(prev => prev.map(j => (j.id === updatedJob.id ? { ...j, ...updatedJob } : j)));
    const addJobToState = (newJob) => setJobs(prev => [newJob, ...prev]);
    const removeJobFromState = (jobId) => setJobs(prev => prev.filter(j => j.id !== jobId));

    // --- Workflow Handlers ---
    const handleNewCheckInClick = () => {
        setCheckInCarNumber("");
        setCheckInKeyProblems("");
        setCheckInError("");
        setShowCheckInModal(true);
    };

    const handleCheckInSubmit = async () => {
        const carNumToCheck = checkInCarNumber.trim().toUpperCase();
        if (!carNumToCheck) {
            setCheckInError("Please enter a car number.");
            return;
        }
        setCheckInError("");
        
        try {
            const res = await api.post('/vehicles/check', { car_number: carNumToCheck });
            const result = await res.json();

            if (res.ok && result.exists) {
                const jobSheetData = {
                    vehicle_id: result.data.id,
                    customer_id: result.data.customer_id,
                    notes: checkInKeyProblems || 'No problems specified on check-in.'
                };
                const jobRes = await api.post('/jobsheets/check-in', jobSheetData);
                const jobResult = await jobRes.json();

                if (!jobRes.ok) throw new Error(jobResult.message || 'Failed to create Job Sheet.');

                addJobToState(jobResult.data);
                setShowCheckInModal(false);
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
        } catch (err) {
            setApiMessage({type: 'danger', text: `Error: ${err.message}`});
        } finally {
            setShowStatusModal(false);
            setSelectedJob(null);
            setNewStatus("");
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
        } catch (err) {
            setApiMessage({ type: 'danger', text: `Error: ${err.message}` });
        } finally {
            setShowDeleteModal(false);
            setJobToDelete(null);
        }
    };

    // --- History Handlers ---
    const handleHistoryLookupClick = () => {
        setHistorySearchCar("");
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

    if (isLoading) return <Container fluid className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}><Spinner animation="border" variant="primary" /></Container>;
    if (error) return <Container><Alert variant="danger">{error}</Alert></Container>;

    return (
        <Container fluid className="dashboard-kanban d-flex flex-column min-vh-100">
            <div className="flex-grow-1">
                <div className="dashboard-action-bar">
                    <div className="action-bar-left">
                        <h1 className="page-title mb-0 d-none d-md-block">Workshop Flow</h1>
                        <h3 className="page-title mb-0 d-block d-md-none">Flow</h3>
                    </div>
                    <div className="action-bar-right">
                        <Button variant="outline-secondary" className="btn-history-lookup me-2" onClick={handleHistoryLookupClick}>
                            <FaHistory className="me-1 me-md-2" /> <span className="d-none d-md-inline">History Lookup</span>
                        </Button>
                        <Button className="btn-checkin-primary" onClick={handleNewCheckInClick}>
                            <FaPlus className="me-1" /> <span className="d-none d-md-inline">New Check-in</span><span className="d-inline d-md-none">Check In</span>
                        </Button>
                    </div>
                </div>
                
                {apiMessage.text && apiMessage.type === 'danger' && (
                    <Alert variant="danger" onClose={() => setApiMessage({ type: '', text: '' })} dismissible>
                        {apiMessage.text}
                    </Alert>
                )}

                <div className="kanban-board">
                    {/* WAITING COLUMN */}
                    <div className="kanban-column" data-status="Waiting">
                        <div className="kanban-column-header"><h3 className="kanban-column-title"><FaHourglassHalf /> Waiting</h3><span className="kanban-column-count">{waitingJobs.length}</span></div>
                        <div className="kanban-column-content">{waitingJobs.length === 0 ? <div className="kanban-empty-state"><FaCarCrash/> No vehicles waiting.</div> : waitingJobs.map(job => (<CheckinCard key={job.id} job={job} onStartRepair={() => triggerStatusChange(job, 'In Progress')} onDelete={() => handleDeleteClick(job)}/>))}</div>
                    </div>
                    {/* IN PROGRESS COLUMN */}
                    <div className="kanban-column" data-status="In Progress">
                        <div className="kanban-column-header"><h3 className="kanban-column-title"><FaWrench /> In Progress</h3><span className="kanban-column-count">{inProgressJobs.length}</span></div>
                        <div className="kanban-column-content">{inProgressJobs.length === 0 ? <div className="kanban-empty-state"><FaTools/> No vehicles in repair.</div> : inProgressJobs.map(job => (<CheckinCard key={job.id} job={job} onDelete={() => handleDeleteClick(job)} />))}</div>
                    </div>
                    {/* COMPLETED COLUMN */}
                    <div className="kanban-column" data-status="Completed">
                        <div className="kanban-column-header"><h3 className="kanban-column-title"><FaCheckDouble /> Completed Today</h3><span className="kanban-column-count">{completedJobs.length}</span></div>
                        <div className="kanban-column-content">{completedJobs.length === 0 ? <div className="kanban-empty-state"><FaCheckCircle/> No vehicles completed today.</div> : completedJobs.map(job => (<CheckinCard key={job.id} job={job} />))}</div>
                    </div>
                </div>
            </div>

            {/* Corporate Branding & Software Licence Footer */}
            <footer className="mt-5 pt-3 pb-2 text-center text-muted border-top d-print-none small">
                <Row className="align-items-center g-2">
                    <Col sm={6} className="text-sm-start text-center">
                        <span>&copy; {new Date().getFullYear()} <strong>Cipra Infotech</strong>. All Copyrights Reserved.</span>
                    </Col>
                    <Col sm={6} className="text-sm-end text-center">
                        <Badge bg="light" text="dark" className="border px-2 py-1">
                            <FaShieldAlt className="text-primary me-1"/> Licensed to: Saman Motors
                        </Badge>
                    </Col>
                </Row>
            </footer>

            {/* ========================== MODALS ========================== */}

            <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
                <Modal.Header closeButton className="modal-header-custom"><Modal.Title>{newStatus === "In Progress" && <FaTools className="me-2 text-warning" />} Confirm Status Change</Modal.Title></Modal.Header>
                <Modal.Body>{selectedJob && (<p>Change status for <strong>{selectedJob.vehicleNumber}</strong> ({selectedJob.vehicleModel}) to <strong>In Progress</strong>?</p>)}{newStatus === "In Progress" && (<Alert variant="info" className="mt-2 d-flex align-items-center"><FaInfoCircle className="me-2"/><small>This will generate a job sheet number and move the vehicle to the 'In Progress' column.</small></Alert>)}</Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={() => setShowStatusModal(false)}>Cancel</Button><Button variant="primary" onClick={confirmStatusChange}>Confirm</Button></Modal.Footer>
            </Modal>

            <Modal show={showCheckInModal} onHide={() => setShowCheckInModal(false)} centered>
                 <Modal.Header closeButton className="modal-header-custom"><Modal.Title><FaSignInAlt className="me-2" /> Vehicle Check-in</Modal.Title></Modal.Header>
                 <Modal.Body><Form onSubmit={(e) => { e.preventDefault(); handleCheckInSubmit(); }}><Form.Group controlId="checkInCarNum" className="mb-3"><Form.Label>Car Registration Number <span className="text-danger">*</span></Form.Label><Form.Control type="text" placeholder="e.g., GJ01AB1234" value={checkInCarNumber} onChange={(e) => { setCheckInCarNumber(e.target.value.toUpperCase()); setCheckInError(''); }} autoFocus required isInvalid={!!checkInError} className="checkin-input" aria-describedby="checkInErrorBlock"/><Form.Control.Feedback type="invalid" id="checkInErrorBlock">{checkInError}</Form.Control.Feedback></Form.Group><Form.Group controlId="checkInKeyProblems" className="mb-3"><Form.Label><FaStickyNote className="me-1" /> Key Problems / Reason for Visit</Form.Label><Form.Control as="textarea" rows={3} placeholder="e.g., Engine noise on start, AC not cooling..." value={checkInKeyProblems} onChange={(e) => setCheckInKeyProblems(e.target.value)}/></Form.Group></Form></Modal.Body>
                 <Modal.Footer><Button variant="secondary" onClick={() => setShowCheckInModal(false)}>Cancel</Button><Button variant="primary" onClick={handleCheckInSubmit}>Next</Button></Modal.Footer>
            </Modal>

            <Modal show={showRegisterConfirmModal} onHide={() => setShowRegisterConfirmModal(false)} centered size="sm">
                 <Modal.Header closeButton className="modal-header-custom border-0"><Modal.Title><FaQuestionCircle className="text-warning me-2"/> Vehicle Not Found</Modal.Title></Modal.Header>
                 <Modal.Body className="text-center"><p>Vehicle with number <Badge bg="secondary">{carNumberToRegister}</Badge> was not found.</p><p className="mb-0">Register this vehicle and its owner now?</p></Modal.Body>
                 <Modal.Footer className="border-0 justify-content-center"><Button variant="secondary" onClick={() => setShowRegisterConfirmModal(false)} size="sm">Cancel</Button><Button variant="success" onClick={handleConfirmRegistration} size="sm"><FaPlus className="me-1"/> Register New</Button></Modal.Footer>
            </Modal>
            
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton className="modal-header-danger">
                    <Modal.Title><FaExclamationTriangle className="me-2"/> Confirm Cancellation</Modal.Title>
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
                <Modal.Header closeButton className="modal-header-custom border-0 pb-0 pt-3 px-4"><Modal.Title className="history-modal-title"><FaHistory className="me-2" /> Vehicle Service History</Modal.Title></Modal.Header>
                <Modal.Body className="history-modal-body p-4">
                    
                     {/* Auto-Suggest Search Input Group */}
                     <div className="position-relative mb-4">
                        <InputGroup className="history-search-group">
                            <Form.Control 
                                type="text" 
                                placeholder="Search partial or full car number (e.g., 7498)" 
                                value={historySearchCar} 
                                onChange={(e) => setHistorySearchCar(e.target.value.toUpperCase())} 
                                onKeyPress={(e) => e.key === 'Enter' && searchHistoryInModal()} 
                                onFocus={() => { if (carSuggestions.length > 0) setShowSuggestions(true); }}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                autoFocus 
                                className="history-search-input"
                            />
                            <Button variant="info" onClick={() => searchHistoryInModal()} disabled={historyModalData.loading || !historySearchCar.trim()} className="history-search-button">
                                {historyModalData.loading ? <span className="spinner-border spinner-border-sm" /> : <FaSearch />} Search
                            </Button>
                        </InputGroup>

                        {/* 👉 THE FIX: Populates the input and hides dropdown WITHOUT executing the search */}
                        {showSuggestions && carSuggestions.length > 0 && (
                            <ListGroup className="position-absolute w-100 shadow-sm border" style={{ top: '100%', left: 0, zIndex: 1050, maxHeight: '250px', overflowY: 'auto' }}>
                                {carSuggestions.map((car, idx) => (
                                    <ListGroup.Item
                                        key={idx}
                                        action
                                        onMouseDown={(e) => {
                                            e.preventDefault(); // Prevents input focus loss so onBlur doesn't fire instantly
                                            setHistorySearchCar(car.car_number); // Populates the search bar
                                            setShowSuggestions(false); // Closes the dropdown
                                        }}
                                        className="d-flex justify-content-between align-items-center"
                                    >
                                        <strong>{car.car_number}</strong>
                                        {car.customer_name && <small className="text-muted fst-italic">{car.customer_name}</small>}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        )}
                    </div>

                    <div className="history-modal-content">
                        {historyModalData.loading && <div className="text-center p-5 text-muted"><span className="spinner-grow spinner-grow-sm me-2"/>Loading History...</div>}
                        {historyModalData.error && !historyModalData.loading && <Alert variant="light" className="text-center d-flex align-items-center justify-content-center border shadow-sm"><FaExclamationTriangle className="me-2 text-warning" size="1.2em"/> {historyModalData.error}</Alert>}
                        {historyModalData.customer && !historyModalData.loading && (
                            <div>
                                <Card className="mb-4 customer-info-card shadow-sm">
                                    <Card.Body className="p-3"><Row><Col md={6} className="mb-3 mb-md-0 border-end-md"><h6 className="customer-card-title"><FaUser className="icon me-2"/> Owner Details</h6><p><strong className="label">Name:</strong> {historyModalData.customer.name}</p><p><strong className="label">Phone:</strong> {historyModalData.customer.phone || 'N/A'}</p><p><strong className="label">Email:</strong> {historyModalData.customer.email || 'N/A'}</p></Col><Col md={6} className="ps-md-4"><h6 className="customer-card-title"><FaCar className="icon me-2"/> Vehicle Details</h6><p><strong className="label">Model:</strong> {historyModalData.customer.vehicleModel}</p><p><strong className="label">Number:</strong> <Badge bg="dark">{historyModalData.customer.carNumber}</Badge></p><p className="mt-3 mb-0"><strong className="label text-danger"><FaInfoCircle className="me-1"/> Next Service KM:</strong> {historyModalData.customer.nextServiceKm || 'Not Set'}</p></Col></Row></Card.Body>
                                </Card>
                                <h6 className="mb-2 history-table-title">Service Records ({historyModalData.jobSheets.length})</h6>
                                {historyModalData.jobSheets.length > 0 ? (
                                    <div className="history-table-container modal-table">
                                        <Table hover responsive size="sm" className="mb-0 history-record-table">
                                             <thead className="history-table-header"><tr><th>Job #</th><th>Date</th><th>KM Reading</th><th>Status</th><th className="text-center">View</th></tr></thead>
                                            <tbody>{historyModalData.jobSheets.map((js) => (
                                                <tr key={js.id}>
                                                    <td>{js.job_sheet_number}</td>
                                                    <td>{formatDate(js.date_completed || js.date_created)}</td>
                                                    <td>{js.km_reading || '-'}</td>
                                                    <td><Badge bg={js.status === 'Completed' ? 'success' : (js.status === 'In Progress' ? 'warning' : 'secondary')}>{js.status || 'Unknown'}</Badge></td>
                                                    <td className="text-center"><Button variant="outline-info" size="sm" className="btn-view-history py-0 px-1" onClick={() => viewJobSheet(js.id)}> <FaEye /> </Button></td>
                                                </tr>
                                            ))}</tbody>
                                        </Table>
                                    </div>
                                ) : (<Alert variant="light" className="text-center border mt-3"><FaInfoCircle className="me-2"/> No service records found for this vehicle.</Alert>)}
                            </div>
                        )}
                        {!historyModalData.loading && !historyModalData.customer && !historyModalData.error && <div className="text-center p-5 text-muted history-empty-prompt"><FaSearch className="me-2"/> Enter a car number above to search its service history.</div>}
                    </div>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default Dashboard;