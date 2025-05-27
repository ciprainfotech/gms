import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Container, Card, Badge, Button, Alert, Row, Col } from 'react-bootstrap'; // Added Row, Col
import {
    FaEye, FaWrench, FaFileAlt, FaCar, FaUser, FaCalendarAlt, FaClipboardList, FaArrowRight // Added more icons
} from 'react-icons/fa';
import { initialJobSheets } from '../data/staticData'; // Keep for simulation

// --- Custom CSS (Add this to your App.css or a dedicated CSS file) ---
/*
// Add this to your App.css or a dedicated CSS file


*/

const ActiveJobSheets = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeJobSheets, setActiveJobSheets] = useState([]);
    const [error, setError] = useState(null);

    // --- Data Loading Logic (Keep as is) ---
    useEffect(() => {
        // Try to load from localStorage first? Or fetch from API?
        // Simulating initial load from static data for now
        try {
            // In a real app, you'd fetch from an API endpoint:
            // fetch('/api/jobsheets?status=Draft&status=InProgress')
            //   .then(res => res.json())
            //   .then(data => setActiveJobSheets(data))
            //   .catch(err => setError("Failed to load active job sheets."));

            // Simulation:
            const loadedSheets = initialJobSheets.filter(
                js => js.status === 'Draft' || js.status === 'In Progress'
            );
            // Sort by creation date maybe? Newest first?
            loadedSheets.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
            setActiveJobSheets(loadedSheets);
            console.log("Simulated loading initial active job sheets.");

        } catch (err) {
             console.error("Error loading job sheets:", err);
             setError("An unexpected error occurred while loading job sheets.");
        }

    }, []); // Run once on mount

    // Effect to handle potential new job sheets passed via navigation state
    // (This is less common now that Dashboard doesn't redirect, but kept for flexibility)
     useEffect(() => {
        if (location.state?.newJobSheet) {
            const newJobSheet = location.state.newJobSheet;
            // Add if not already present (prevent duplicates on refresh/back navigation)
            if (!activeJobSheets.some(js => js.id === newJobSheet.id)) {
                 // Add to the top for visibility
                 setActiveJobSheets(prev => [newJobSheet, ...prev]);
            }
            // Clear the state from navigation history
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname, activeJobSheets]);

    // --- Helper Function for Status Badge ---
    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'draft':
                return (
                    <Badge pill bg="light" text="dark" className="badge-status badge-status-draft">
                        <FaFileAlt /> Draft
                    </Badge>
                );
            case 'in progress':
                return (
                    <Badge pill bg="warning" text="dark" className="badge-status badge-status-inprogress">
                        <FaWrench /> In Progress
                    </Badge>
                );
            default:
                return <Badge pill bg="secondary" className="badge-status">{status || 'Unknown'}</Badge>;
        }
    };

    // --- Render Component ---
    return (
        <Container fluid className="py-4 px-lg-5 px-md-4 px-sm-3">
            {/* Page Header */}
            <h2 className="page-title-active">
                <FaClipboardList />
                Active Job Sheets
            </h2>

            {/* Error Alert */}
            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

            {/* Job Sheet Grid */}
            {activeJobSheets.length > 0 ? (
                <Row className="job-sheet-grid">
                    {activeJobSheets.map((js) => (
                        <Col key={js.id} lg={4} md={6} sm={12}> {/* Responsive Grid */}
                            <Card className="job-sheet-card h-100"> {/* h-100 for equal height cards */}
                                <Card.Header>
                                    <span className="job-sheet-number">
                                        <FaFileAlt /> {js.jobSheetNumber}
                                    </span>
                                    {getStatusBadge(js.status)}
                                </Card.Header>
                                <Card.Body>
                                    <div className="card-detail-row">
                                        <FaCar className="card-icon" />
                                        Vehicle: <strong>{js.vehicleNumber}</strong>
                                    </div>
                                    <div className="card-detail-row">
                                        {/* Placeholder icon or leave blank */}
                                        <span className="card-icon" style={{ visibility: 'hidden' }}><FaCar /></span>
                                        Model: <strong>{js.vehicleModel || 'N/A'}</strong>
                                    </div>
                                    <div className="card-detail-row">
                                        <FaUser className="card-icon" />
                                        Customer: <strong>{js.customerName || 'N/A'}</strong>
                                    </div>
                                     {/* Display initial problems if available */}
                                     {js.notes?.includes("Key Problems:") && (
                                         <div className="card-detail-row fst-italic" style={{ fontSize: '0.9rem' }}>
                                            <FaWrench className="card-icon" style={{ color: '#dc3545' }}/> {/* Red icon */}
                                            Issue: <strong>{js.notes.split("Key Problems:")[1]?.split('.')[0]?.trim() || 'See details'}</strong>
                                         </div>
                                     )}
                                    <div className="card-detail-row">
                                        <FaCalendarAlt className="card-icon" />
                                        Created: <strong>{new Date(js.dateCreated).toLocaleDateString()}</strong>
                                    </div>
                                </Card.Body>
                                <Card.Footer>
                                    <Link to={`/jobsheet/${js.id}`} className="btn btn-primary btn-sm btn-view-job">
                                        Open Job Sheet <FaArrowRight />
                                    </Link>
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : (
                // Empty State Display
                !error && ( // Only show empty state if there's no loading error
                    <Container className="empty-state-container">
                        <div className="empty-state-icon">
                            <FaWrench />
                        </div>
                        <p className="empty-state-text">No Active Work Orders</p>
                        <p className="empty-state-subtext">
                            Job sheets currently being worked on will appear here. <br/>
                            Start a repair from the Dashboard to create one.
                        </p>
                         {/* Optional: Button to navigate back to Dashboard */}
                         {/* <Button variant="outline-primary" size="sm" as={Link} to="/dashboard" className="mt-3">
                            Go to Dashboard
                         </Button> */}
                    </Container>
                )
            )}
        </Container>
    );
};

export default ActiveJobSheets;