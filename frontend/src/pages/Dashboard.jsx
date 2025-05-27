import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Modal, Form, Row, Col, InputGroup, Alert, Badge, Container, Card
} from "react-bootstrap";
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';

// Icons
import {
    FaPlus, FaSearch, FaEye, FaCity, FaEnvelope, FaPhone, FaUser, FaCarAlt, FaIdCard, FaRegClock,
    FaHistory, FaTools, FaCar, FaCheckCircle, FaSignInAlt, FaExclamationTriangle, FaInfoCircle,
    FaClock, FaHourglassHalf, FaWrench, FaCheckDouble, FaCarCrash, FaQuestionCircle, FaStickyNote // Added icon for notes/problems
} from "react-icons/fa";

// Data Imports - **Verify this path is correct for your project structure**
import {
    initialJobSheets, initialVehicles, initialCustomers, addJobSheet
} from '../data/staticData';

// Sub-component - **Verify this path and ensure the component exists and accepts the 'vehicle' prop**
import CheckinCard from '../components/CheckinCard';

// --- Custom CSS Import - **Verify this path** ---
import "../App.css";

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // --- State ---
    const [checkedInVehicles, setCheckedInVehicles] = useState([]);
    const [jobSheetHistoryDb, setJobSheetHistoryDb] = useState(() => initialJobSheets || []); // Use state for potential updates later
    const [vehiclesDb, setVehiclesDb] = useState(() => initialVehicles || []);             // Use state
    const [customersDb, setCustomersDb] = useState(() => initialCustomers || []);           // Use state

    // Modal States
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showCheckInModal, setShowCheckInModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showRegisterConfirmModal, setShowRegisterConfirmModal] = useState(false);

    // Check-in Modal State
    const [checkInCarNumber, setCheckInCarNumber] = useState("");
    const [checkInKeyProblems, setCheckInKeyProblems] = useState(""); // <<< New State for Key Problems
    const [checkInError, setCheckInError] = useState("");

    // Registration Flow State
    const [carNumberToRegister, setCarNumberToRegister] = useState("");

    // Status Change State
    const [selectedVehicleForStatus, setSelectedVehicleForStatus] = useState(null);
    const [newStatus, setNewStatus] = useState("");

    // History Modal State
    const [historySearchCar, setHistorySearchCar] = useState("");
    const [historyModalData, setHistoryModalData] = useState({
        customer: null, jobSheets: [], error: null, loading: false
    });


    // --- Effect for handling navigation state (from AddCustomer) ---
    useEffect(() => {
        if (location.state?.newCheckIn) {
            const newCheckInData = location.state.newCheckIn;
            // Check if vehicle *from registration* is already active (unlikely but possible race condition)
            const isAlreadyCheckedIn = checkedInVehicles.some(
                (v) => v.vehicleId === newCheckInData.vehicleId && v.status !== "Completed"
            );
            if (!isAlreadyCheckedIn) {
                const customer = customersDb.find(c => c.id === newCheckInData.customerId);
                const vehicle = vehiclesDb.find(v => v.id === newCheckInData.vehicleId);
                if (customer && vehicle) {
                    const checkInData = {
                        id: Date.now(), // Unique ID for the check-in instance
                        customer: customer.name,
                        carNumber: vehicle.carNumber,
                        vehicleModel: `${vehicle.make || ''} ${vehicle.model || ''}`.trim(),
                        status: "Waiting", // Default status on check-in
                        checkIn: getFormattedTime(),
                        keyProblems: newCheckInData.keyProblems || "N/A", // Pass problems from registration if provided
                        customerId: customer.id,
                        vehicleId: vehicle.id,
                    };
                    setCheckedInVehicles(prev => [checkInData, ...prev]); // Add to top
                } else {
                    console.error("Data inconsistency: Customer or Vehicle not found after registration.");
                    // Consider showing a user-friendly error, e.g., using an Alert component or a toast library
                    alert("Error: Could not find the newly registered customer or vehicle data. Please refresh or contact support.");
                }
            }
            // Clear location state to prevent re-triggering
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname, checkedInVehicles, customersDb, vehiclesDb]);


    // --- Helper Functions ---
    const getFormattedTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    // Filter vehicles by status for Kanban columns
    const waitingVehicles = checkedInVehicles.filter(v => v.status === 'Waiting');
    const inProgressVehicles = checkedInVehicles.filter(v => v.status === 'In Progress');
    const completedVehicles = checkedInVehicles.filter(v => v.status === 'Completed');

    // --- Workflow Functions ---

    // Open Check-in Modal
    const handleNewCheckInClick = () => {
        setCheckInCarNumber("");
        setCheckInKeyProblems(""); // Clear problems field
        setCheckInError("");
        setShowCheckInModal(true);
    };

    // Handle Check-in Submission
    const handleCheckInSubmit = () => {
        const carNumToCheck = checkInCarNumber.trim().toUpperCase().replace(/\s+/g, ''); // Normalized for check
        const originalCarNum = checkInCarNumber.trim().toUpperCase(); // Keep original format

        if (!carNumToCheck) {
            setCheckInError("Please enter a car number.");
            return;
        }
        setCheckInError(""); // Clear previous error

        // Check if already checked in and *not* completed
        const isAlreadyCheckedIn = checkedInVehicles.some(
            v => v.carNumber.replace(/\s+/g, '') === carNumToCheck && v.status !== "Completed"
        );
        if (isAlreadyCheckedIn) {
            setCheckInError(`${originalCarNum} is already checked in and active.`);
            return;
        }

        // Find vehicle in the main database
        const existingVehicle = vehiclesDb.find(v => v.carNumber.replace(/\s+/g, '') === carNumToCheck);

        if (existingVehicle?.id) {
            // --- Vehicle Found ---
            const customer = customersDb.find(c => c.id === existingVehicle.customerId);
            if (!customer?.id) {
                // Data integrity issue: Vehicle exists but linked customer doesn't
                setCheckInError(`Error: Customer data missing for ${originalCarNum}. Please check 'Customers & Vehicles' or register again.`);
                // Optionally, you could still allow check-in with a warning or trigger a data fix flow.
                return;
            }

            // Create the check-in data object
            const newCheckInData = {
                id: Date.now(), // Unique ID for this specific check-in instance
                customer: customer.name,
                carNumber: existingVehicle.carNumber, // Use car number format from DB
                vehicleModel: `${existingVehicle.make || ''} ${existingVehicle.model || ''}`.trim(),
                status: "Waiting", // Initial status
                checkIn: getFormattedTime(),
                keyProblems: checkInKeyProblems || "Not specified", // <<< Store key problems
                customerId: customer.id,
                vehicleId: existingVehicle.id,
            };

            // Add to the top of the checked-in list
            setCheckedInVehicles(prev => [newCheckInData, ...prev]);

            // Close modal and clear fields
            setShowCheckInModal(false);
            setCheckInCarNumber("");
            setCheckInKeyProblems("");

        } else {
            // --- Vehicle NOT Found ---
            // Prepare for registration confirmation
            setCarNumberToRegister(originalCarNum); // Store the number the user typed
            setShowCheckInModal(false);       // Close the current check-in modal
            setShowRegisterConfirmModal(true); // Open the confirmation modal for registration
            // Clear inputs for the next check-in attempt
            setCheckInCarNumber("");
            setCheckInKeyProblems(""); // Also clear problems if going to registration
        }
    };

    // Handle Confirmation to Register New Vehicle/Customer
    const handleConfirmRegistration = () => {
        setShowRegisterConfirmModal(false);
        // Navigate to the registration page, passing the car number and potentially key problems
        navigate('/add-customer', {
            state: {
                carNumber: carNumberToRegister,
                keyProblems: checkInKeyProblems // Pass problems along
            }
        });
        setCarNumberToRegister(""); // Clear the stored number after navigation
        setCheckInKeyProblems(""); // Clear problems state
    };


    // Trigger Status Change Modal
    const triggerStatusChange = (vehicle, targetStatus) => {
        setSelectedVehicleForStatus(vehicle);
        setNewStatus(targetStatus);
        setShowStatusModal(true);
    };

    // Confirm and Execute Status Change
    const confirmStatusChange = () => {
        if (!selectedVehicleForStatus) return;

        // Update the status in the checkedInVehicles list
        const updatedCheckIns = checkedInVehicles.map(v =>
            v.id === selectedVehicleForStatus.id ? { ...v, status: newStatus } : v
        );
        setCheckedInVehicles(updatedCheckIns);

        // --- Logic for "In Progress" ---
        if (newStatus === "In Progress") {
            // Validate necessary IDs before proceeding
            if (!selectedVehicleForStatus.vehicleId || !selectedVehicleForStatus.customerId) {
                alert("Error: Cannot start repair. Critical vehicle or customer ID missing. Please check data integrity.");
                // Optional: Revert status change or handle differently
                setShowStatusModal(false);
                return;
            }

            // Prepare Job Sheet data
            const jobSheetData = {
                id: `JS${Date.now()}`, // Generate unique Job Sheet ID
                jobSheetNumber: `JS-${String(Date.now()).slice(-6)}`, // Simple unique number
                vehicleId: selectedVehicleForStatus.vehicleId,
                customerId: selectedVehicleForStatus.customerId,
                vehicleNumber: selectedVehicleForStatus.carNumber,
                customerName: selectedVehicleForStatus.customer,
                vehicleModel: selectedVehicleForStatus.vehicleModel,
                dateCreated: new Date().toISOString().split('T')[0],
                status: 'In Progress', // Job sheet status starts as In Progress
                // ** Incorporate Key Problems into Notes **
                notes: `Initial Check-in: ${selectedVehicleForStatus.checkIn}. Key Problems: ${selectedVehicleForStatus.keyProblems || 'Not specified'}`,
                kmReading: '', // To be filled later
                items: [],     // To be filled later
                totalParts: 0,
                totalLubes: 0,
                totalLabour: 0,
                grandTotal: 0,
                // Add other necessary fields from your data model
            };

            // Add the new job sheet to your data store
            addJobSheet(jobSheetData);
            console.log("New Job Sheet Created (ID):", jobSheetData.id); // Log for confirmation

            // *** DO NOT NAVIGATE *** - User stays on Dashboard
            // navigate('/active-jobsheets', { state: { focusJobSheetId: jobSheetData.id } }); // <<< REMOVED/COMMENTED OUT

            // Optionally show a brief success message (e.g., using a toast notification library)
            // Example: toast.success(`Job Sheet ${jobSheetData.jobSheetNumber} created!`);

        } else if (newStatus === "Completed") {
            // Handle completion logic if needed (e.g., update job sheet status via another mechanism)
            console.log(`Check-in ${selectedVehicleForStatus.carNumber} marked as Completed on Dashboard.`);
             // Find the corresponding job sheet (if one was created) and update its status maybe?
             // This depends on how you manage job sheet completion (likely via the Job Sheet page itself)
        }

        // Close modal and reset state
        setShowStatusModal(false);
        setSelectedVehicleForStatus(null);
        setNewStatus("");
    };

    // --- History Lookup Functions ---

    const handleHistoryLookupClick = () => {
        setHistorySearchCar("");
        setHistoryModalData({ customer: null, jobSheets: [], error: null, loading: false });
        setShowHistoryModal(true);
    };

    const searchHistoryInModal = () => {
        const carNum = historySearchCar.trim().toUpperCase().replace(/\s+/g, '');
        if (!carNum) {
            setHistoryModalData(prev => ({ ...prev, error: "Please enter a car number." }));
            return;
        }
        setHistoryModalData({ customer: null, jobSheets: [], error: null, loading: true });

        // Simulate async lookup (replace with actual fetch if needed)
        setTimeout(() => {
            const targetVehicle = vehiclesDb.find(v => v.carNumber.replace(/\s+/g, '') === carNum);
            if (!targetVehicle) {
                setHistoryModalData(prev => ({ ...prev, error: `No vehicle found with number ${historySearchCar}.`, loading: false }));
                return;
            }
            const customer = customersDb.find(c => c.id === targetVehicle.customerId);
             if (!customer) {
                 // Handle case where vehicle exists but customer doesn't (data inconsistency)
                 console.warn(`Data Inconsistency: Vehicle ${targetVehicle.carNumber} found, but Customer ID ${targetVehicle.customerId} not found.`);
                 setHistoryModalData({
                     customer: { // Provide partial info if possible
                         id: null, name: 'Customer Not Found', phone: 'N/A', email: 'N/A', city: 'N/A',
                         vehicleModel: `${targetVehicle.make || ''} ${targetVehicle.model || ''}`.trim(),
                         carNumber: targetVehicle.carNumber, nextServiceKm: 'N/A',
                     },
                     jobSheets: [], // No job sheets if customer is missing/unreliable link
                     error: `Customer data associated with ${targetVehicle.carNumber} is missing.`,
                     loading: false
                 });
                 return;
             }

            const foundJobSheets = jobSheetHistoryDb
                .filter(js => js.vehicleId === targetVehicle.id)
                .sort((a, b) => new Date(b.dateCompleted || b.dateCreated) - new Date(a.dateCompleted || a.dateCreated)); // Sort by most recent

            // Determine next service KM (example logic: from latest completed job sheet)
            const latestCompletedJob = foundJobSheets.find(js => js.status === 'Completed' && js.nextServiceKm);
            const nextServiceKm = latestCompletedJob?.nextServiceKm || 'N/A';


            setHistoryModalData({
                customer: {
                    id: customer.id, name: customer.name || 'N/A', phone: customer.phone || 'N/A',
                    email: customer.email || 'N/A', city: customer.city || 'N/A',
                    vehicleModel: `${targetVehicle.make || ''} ${targetVehicle.model || ''}`.trim(),
                    carNumber: targetVehicle.carNumber,
                    nextServiceKm: nextServiceKm, // Use calculated value
                },
                jobSheets: foundJobSheets,
                error: foundJobSheets.length === 0 ? `No service history found for ${targetVehicle.carNumber}.` : null,
                loading: false
            });
        }, 300); // Simulating network delay
    };

    const viewJobSheet = (jobSheetId) => {
        setShowHistoryModal(false);
        navigate(`/jobsheet/${jobSheetId}`);
    };

    // --- Render ---
    return (
        <Container fluid className="dashboard-kanban">
            {/* --- Top Action Bar --- */}
            <div className="dashboard-action-bar">
                <div className="action-bar-left">
                    <h1 className="page-title mb-0 d-none d-md-block">Workshop Flow</h1>
                    <h3 className="page-title mb-0 d-block d-md-none">Flow</h3> {/* Smaller title for mobile */}
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

            {/* --- Kanban Board --- */}
            <div className="kanban-board">
                {/* Column: Waiting */}
                <div className="kanban-column" data-status="Waiting">
                    <div className="kanban-column-header">
                        <h3 className="kanban-column-title"><FaHourglassHalf /> Waiting</h3>
                        <span className="kanban-column-count">{waitingVehicles.length}</span>
                    </div>
                    <div className="kanban-column-content">
                        {waitingVehicles.length === 0 ? (
                            <div className="kanban-empty-state"><FaCarCrash/> No vehicles waiting.</div>
                        ) : (
                            waitingVehicles.map(vehicle => (
                                // Ensure CheckinCard component can display vehicle.keyProblems
                                <CheckinCard key={vehicle.id} vehicle={vehicle}
                                    onStartRepair={() => triggerStatusChange(vehicle, 'In Progress')}
                                    onCompleteCheckout={() => {/* Placeholder: Completion likely handled elsewhere */}}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Column: In Progress */}
                <div className="kanban-column" data-status="In Progress">
                    <div className="kanban-column-header">
                        <h3 className="kanban-column-title"><FaWrench /> In Progress</h3>
                        <span className="kanban-column-count">{inProgressVehicles.length}</span>
                    </div>
                    <div className="kanban-column-content">
                        {inProgressVehicles.length === 0 ? (
                            <div className="kanban-empty-state"><FaTools/> No vehicles in repair.</div>
                        ) : (
                            inProgressVehicles.map(vehicle => (
                                <CheckinCard key={vehicle.id} vehicle={vehicle}
                                    onStartRepair={() => {/* Already In Progress */}}
                                    onCompleteCheckout={() => triggerStatusChange(vehicle, 'Completed')}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Column: Completed Today */}
                <div className="kanban-column" data-status="Completed">
                    <div className="kanban-column-header">
                         <h3 className="kanban-column-title"><FaCheckDouble /> Completed Today</h3>
                        <span className="kanban-column-count">{completedVehicles.length}</span>
                    </div>
                    <div className="kanban-column-content">
                       {completedVehicles.length === 0 ? (
                            <div className="kanban-empty-state"><FaCheckCircle/> No vehicles completed today.</div>
                        ) : (
                            completedVehicles.map(vehicle => (
                                <CheckinCard key={vehicle.id} vehicle={vehicle}
                                    onStartRepair={() => {/* Cannot restart completed */}}
                                    onCompleteCheckout={() => {/* Already Completed */}}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* --- Modals --- */}

            {/* Status Update Confirmation Modal */}
            <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
                 <Modal.Header closeButton className="modal-header-custom">
                    <Modal.Title>
                         {newStatus === "In Progress" && <FaTools className="me-2 text-warning" />}
                         {newStatus === "Completed" && <FaCheckCircle className="me-2 text-success" />}
                         Confirm Status Change
                    </Modal.Title>
                </Modal.Header>
                 <Modal.Body>
                    {selectedVehicleForStatus && (
                         <p>Change status for <strong>{selectedVehicleForStatus.carNumber}</strong> ({selectedVehicleForStatus.vehicleModel}) to <strong>{newStatus}</strong>?</p>
                     )}
                    {newStatus === "In Progress" && (
                        <Alert variant="info" className="mt-2 d-flex align-items-center">
                            <FaInfoCircle className="me-2"/>
                            <small>A new Job Sheet will be created in 'Active Job Sheets'. You will remain on this Dashboard.</small>
                        </Alert>
                    )}
                     {newStatus === "Completed" && (
                        <Alert variant="success" className="mt-2 d-flex align-items-center">
                            <FaInfoCircle className="me-2"/>
                            <small>This will move the vehicle to the 'Completed Today' column.</small>
                        </Alert>
                    )}
                 </Modal.Body>
                 <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowStatusModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={confirmStatusChange}>Confirm</Button>
                 </Modal.Footer>
            </Modal>

            {/* Vehicle Check-in Modal */}
            <Modal show={showCheckInModal} onHide={() => setShowCheckInModal(false)} centered>
                 <Modal.Header closeButton className="modal-header-custom">
                    <Modal.Title><FaSignInAlt className="me-2" /> Vehicle Check-in</Modal.Title>
                </Modal.Header>
                 <Modal.Body>
                     <Form onSubmit={(e) => { e.preventDefault(); handleCheckInSubmit(); }}> {/* Allow Enter key submit on form */}
                         <Form.Group controlId="checkInCarNum" className="mb-3">
                             <Form.Label>Car Registration Number <span className="text-danger">*</span></Form.Label>
                             <Form.Control
                                 type="text"
                                 placeholder="e.g., GJ01AB1234"
                                 value={checkInCarNumber}
                                 onChange={(e) => { setCheckInCarNumber(e.target.value.toUpperCase()); setCheckInError(''); }}
                                 autoFocus
                                 required // HTML5 validation
                                 isInvalid={!!checkInError}
                                 className="checkin-input"
                                 aria-describedby="checkInErrorBlock"
                             />
                             {/* Use Form.Control.Feedback for cleaner error display */}
                             <Form.Control.Feedback type="invalid" id="checkInErrorBlock">
                                 {checkInError}
                             </Form.Control.Feedback>
                         </Form.Group>

                         {/* <<< New Field for Key Problems >>> */}
                         <Form.Group controlId="checkInKeyProblems" className="mb-3">
                             <Form.Label><FaStickyNote className="me-1" /> Key Problems / Reason for Visit</Form.Label>
                             <Form.Control
                                 as="textarea"
                                 rows={3}
                                 placeholder="e.g., Engine noise on start, AC not cooling, 40,000km service, Check brakes..."
                                 value={checkInKeyProblems}
                                 onChange={(e) => setCheckInKeyProblems(e.target.value)}
                             />
                         </Form.Group>
                     </Form>
                 </Modal.Body>
                 <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCheckInModal(false)}>Cancel</Button>
                    {/* Button type="submit" or link onClick to handleCheckInSubmit */}
                    <Button variant="primary" onClick={handleCheckInSubmit}>Next</Button>
                 </Modal.Footer>
            </Modal>

            {/* Registration Confirmation Modal */}
            <Modal show={showRegisterConfirmModal} onHide={() => setShowRegisterConfirmModal(false)} centered size="sm">
                 <Modal.Header closeButton className="modal-header-custom border-0">
                      <Modal.Title><FaQuestionCircle className="text-warning me-2"/> Vehicle Not Found</Modal.Title>
                 </Modal.Header>
                 <Modal.Body className="text-center">
                     <p>Vehicle with number <Badge bg="secondary">{carNumberToRegister}</Badge> was not found.</p>
                     <p className="mb-0">Register this vehicle and its owner now?</p>
                 </Modal.Body>
                 <Modal.Footer className="border-0 justify-content-center">
                    <Button variant="secondary" onClick={() => setShowRegisterConfirmModal(false)} size="sm">Cancel</Button>
                    <Button variant="success" onClick={handleConfirmRegistration} size="sm">
                       <FaPlus className="me-1"/> Register New
                    </Button>
                 </Modal.Footer>
            </Modal>

            {/* History Lookup Modal (Enhanced UI) */}
            <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} centered size="lg" className="history-modal history-modal-enhanced">
                <Modal.Header closeButton className="modal-header-custom border-0 pb-0 pt-3 px-4">
                    <Modal.Title className="history-modal-title">
                        <FaHistory className="me-2" /> Vehicle Service History
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="history-modal-body p-4">
                     <InputGroup className="mb-4 history-search-group">
                        <Form.Control
                            type="text" placeholder="Enter Car Registration Number" value={historySearchCar}
                            onChange={(e) => setHistorySearchCar(e.target.value.toUpperCase())}
                            onKeyPress={(e) => e.key === 'Enter' && searchHistoryInModal()} autoFocus
                            className="history-search-input"
                        />
                        <Button variant="info" onClick={searchHistoryInModal} disabled={historyModalData.loading || !historySearchCar.trim()} className="history-search-button">
                            {historyModalData.loading ? <span className="spinner-border spinner-border-sm" /> : <FaSearch />} Search
                        </Button>
                    </InputGroup>

                    <div className="history-modal-content">
                        {historyModalData.loading && (
                            <div className="text-center p-5 text-muted">
                                <span className="spinner-grow spinner-grow-sm me-2" role="status" aria-hidden="true"></span>
                                Loading History...
                            </div>
                        )}

                        {/* Error when no vehicle found OR customer data missing */}
                        {historyModalData.error && !historyModalData.customer && !historyModalData.loading && (
                            <Alert variant="light" className="text-center d-flex align-items-center justify-content-center border shadow-sm">
                                <FaExclamationTriangle className="me-2 text-warning" size="1.2em"/> {historyModalData.error}
                            </Alert>
                        )}

                        {/* Customer/Vehicle Found - Display Info and History */}
                        {historyModalData.customer && !historyModalData.loading && (
                            <div>
                                {/* Customer/Vehicle Details Card */}
                                <Card className="mb-4 customer-info-card shadow-sm">
                                    <Card.Body className="p-3">
                                        <Row>
                                            <Col md={6} className="mb-3 mb-md-0 border-end-md">
                                                <h6 className="customer-card-title"><FaUser className="icon me-2"/> Owner Details</h6>
                                                 <p><strong className="label">Name:</strong> {historyModalData.customer.name}</p>
                                                 <p><strong className="label">Phone:</strong> {historyModalData.customer.phone || 'N/A'}</p>
                                                 <p><strong className="label">Email:</strong> {historyModalData.customer.email || 'N/A'}</p>
                                                 <p className="mb-0"><strong className="label">City:</strong> {historyModalData.customer.city || 'N/A'}</p>
                                            </Col>
                                            <Col md={6} className="ps-md-4">
                                                 <h6 className="customer-card-title"><FaCarAlt className="icon me-2"/> Vehicle Details</h6>
                                                <p><strong className="label">Model:</strong> {historyModalData.customer.vehicleModel}</p>
                                                <p><strong className="label">Number:</strong> <Badge bg="dark">{historyModalData.customer.carNumber}</Badge></p>
                                                <p className="mt-3 mb-0"><strong className="label text-danger"><FaRegClock className="me-1"/> Next Service KM:</strong> {historyModalData.customer.nextServiceKm || 'Not Set'}</p>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                {/* History Table Section */}
                                <h6 className="mb-2 history-table-title">Service Records ({historyModalData.jobSheets.length})</h6>
                                {historyModalData.jobSheets.length > 0 ? (
                                    <div className="history-table-container modal-table">
                                        <Table hover responsive size="sm" className="mb-0 history-record-table">
                                             <thead className="history-table-header">
                                                 <tr>
                                                     <th>Job #</th>
                                                     <th>Date</th>
                                                     <th>KM Reading</th>
                                                     <th>Status</th>
                                                     <th className="text-center">View</th>
                                                 </tr>
                                             </thead>
                                            <tbody>
                                                {historyModalData.jobSheets.map((js) => (
                                                    <tr key={js.id}>
                                                        <td>{js.jobSheetNumber}</td>
                                                        <td>{new Date(js.dateCompleted || js.dateCreated).toLocaleDateString()}</td>
                                                        <td>{js.kmReading || '-'}</td>
                                                        <td><Badge bg={js.status === 'Completed' ? 'success' : (js.status === 'In Progress' ? 'warning' : 'secondary')}>{js.status || 'Unknown'}</Badge></td>
                                                        <td className="text-center">
                                                            <Button variant="outline-info" size="sm" className="btn-view-history py-0 px-1" onClick={() => viewJobSheet(js.id)}> <FaEye /> </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                ) : (
                                     // Show message if customer found but no history
                                     <Alert variant="light" className="text-center border mt-3">
                                         <FaInfoCircle className="me-2"/> No service records found for this vehicle.
                                     </Alert>
                                )}
                            </div>
                        )}

                        {/* Initial empty state for modal (before search) */}
                         {!historyModalData.loading && !historyModalData.customer && !historyModalData.error && (
                               <div className="text-center p-5 text-muted history-empty-prompt">
                                   <FaSearch className="me-2"/> Enter a car number above to search its service history.
                               </div>
                         )}
                    </div>
                </Modal.Body>
            </Modal>

        </Container>
    );
};

export default Dashboard;

// --- TODO ---
// 1.  **Verify Import Paths:** Double-check the paths for `staticData`, `CheckinCard`, and `App.css` relative to this `Dashboard.js` file.
// 2.  **Update `CheckinCard` Component:** Make sure your `CheckinCard.jsx` component:
//     *   Accepts the `vehicle` prop.
//     *   Displays the `vehicle.keyProblems` information somewhere on the card (e.g., below the model or customer name). You might use the `<FaStickyNote />` icon.
// 3.  **Data Persistence:** Remember this implementation uses in-memory state and static data. For a real application, you'd replace `staticData` interactions and `useState` for `jobSheetHistoryDb`, `vehiclesDb`, `customersDb` with API calls and likely use a global state management solution (like Context API or Redux/Zustand) or fetch data as needed.
// 4.  **Error Handling:** Consider more robust user feedback for errors (e.g., using toast notifications instead of `alert` or just `console.log`).