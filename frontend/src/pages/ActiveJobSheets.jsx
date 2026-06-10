import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Badge, Button, Alert, Row, Col, Spinner, Modal, Tooltip, OverlayTrigger } from 'react-bootstrap';
import {
    FaEye, FaWrench, FaFileAlt, FaCar, FaUser, FaCalendarAlt, FaClipboardList, FaTrash, FaExclamationTriangle
} from 'react-icons/fa';
import api from '../api/api.js';

const ActiveJobSheets = () => {
    // --- State Management ---
    const [activeJobSheets, setActiveJobSheets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for delete functionality
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [jobSheetToDelete, setJobSheetToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- Data Loading Logic ---
    useEffect(() => {
        const fetchActiveJobs = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get('/jobsheets/active');
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Failed to load active job sheets from the server.');
                }
                const result = await res.json();
                setActiveJobSheets(result.data);
            } catch (err) {
                console.error("Error loading job sheets:", err);
                setError(err.message || "An unexpected error occurred.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchActiveJobs();
    }, []); // Run once on component mount

    // --- Helper Functions ---
    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'draft':
                return (
                    <Badge pill bg="light" text="dark" className="badge-status badge-status-draft">
                        <FaFileAlt className="me-1" /> Draft
                    </Badge>
                );
            case 'in progress':
                return (
                    <Badge pill bg="warning" text="dark" className="badge-status badge-status-inprogress">
                        <FaWrench className="me-1" /> In Progress
                    </Badge>
                );
            default:
                return <Badge pill bg="secondary" className="badge-status">{status || 'Unknown'}</Badge>;
        }
    };

    // --- Delete Functionality Handlers ---
    const handleOpenDeleteModal = (jobSheet) => {
        setJobSheetToDelete(jobSheet);
        setShowDeleteModal(true);
    };

    const handleCloseDeleteModal = () => {
        setJobSheetToDelete(null);
        setShowDeleteModal(false);
    };

    const handleDeleteJobSheet = async () => {
        if (!jobSheetToDelete) return;
        
        setIsDeleting(true);
        setError(null);
        try {
            const response = await api.delete(`/jobsheets/${jobSheetToDelete.id}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to delete the job sheet.' }));
                throw new Error(errorData.message);
            }

            // Remove the deleted job sheet from the local state to update UI instantly
            setActiveJobSheets(prevSheets => prevSheets.filter(js => js.id !== jobSheetToDelete.id));
            handleCloseDeleteModal();

        } catch (err) {
            console.error("Error deleting job sheet:", err);
            setError(err.message);
            handleCloseDeleteModal(); // Close modal even on error
        } finally {
            setIsDeleting(false);
        }
    };

    // --- Render Logic ---
    if (isLoading) {
        return (
            <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <Spinner animation="border" variant="primary" />
                <span className="ms-3 fs-5 text-muted">Loading Active Jobs...</span>
            </Container>
        );
    }
    
    return (
        <Container fluid className="py-4 px-lg-5 px-md-4 px-sm-3">
            <h2 className="page-title-active">
                <FaClipboardList className="me-2" />
                Active Job Sheets
            </h2>

            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

            {activeJobSheets.length > 0 ? (
                <Row className="job-sheet-grid">
                    {activeJobSheets.map((js) => (
                        <Col key={js.id} lg={4} md={6} sm={12} className="mb-4">
                            <Card className="job-sheet-card h-100 d-flex flex-column">
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <span className="job-sheet-number fw-bold">
                                        <FaFileAlt className="me-1" /> {js.jobSheetNumber}
                                    </span>
                                    {getStatusBadge(js.status)}
                                </Card.Header>
                                <Card.Body className="flex-grow-1">
                                    <div className="card-detail-row">
                                        <FaCar className="card-icon" />
                                        Vehicle: <strong>{js.vehicleNumber}</strong>
                                    </div>
                                    {/* --- UPDATED LINE --- */}
                                    <div className="card-detail-row">
                                        <FaCar className="card-icon text-secondary" /> 
                                        Model: <strong>{js.vehicleModel || 'N/A'}</strong>
                                    </div>
                                    <div className="card-detail-row">
                                        <FaUser className="card-icon" />
                                        Customer: <strong>{js.customerName || 'N/A'}</strong>
                                    </div>
                                     {js.notes && (
                                         <div className="card-detail-row fst-italic" style={{ fontSize: '0.9rem' }}>
                                            <FaWrench className="card-icon" style={{ color: '#dc3545' }}/>
                                            Issue: <strong>{js.notes.includes("Key Problems:") ? js.notes.split("Key Problems:")[1]?.trim() : js.notes}</strong>
                                         </div>
                                     )}
                                    <div className="card-detail-row">
                                        <FaCalendarAlt className="card-icon" />
                                        Created: <strong>{new Date(js.dateCreated).toLocaleDateString()}</strong>
                                    </div>
                                </Card.Body>
                                <Card.Footer className="d-flex justify-content-between align-items-center">
                                    <Link to={`/jobsheet/${js.id}`} className="btn btn-outline-primary btn-sm">
                                        <FaEye className="me-1" /> View Details
                                    </Link>
                                    <OverlayTrigger
                                        placement="top"
                                        overlay={<Tooltip id={`tooltip-delete-${js.id}`}>Delete Job Sheet</Tooltip>}
                                    >
                                        <Button
                                            variant="link"
                                            className="p-0 text-danger delete-icon-button"
                                            onClick={() => handleOpenDeleteModal(js)}
                                            disabled={isDeleting}
                                        >
                                            <FaTrash />
                                        </Button>
                                    </OverlayTrigger>
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : (
                !error && (
                    <Container className="empty-state-container">
                        <div className="empty-state-icon">
                            <FaWrench />
                        </div>
                        <p className="empty-state-text">No Active Work Orders</p>
                        <p className="empty-state-subtext">
                            Job sheets currently being worked on will appear here. <br/>
                            Start a repair from the Dashboard to create one.
                        </p>
                    </Container>
                )
            )}

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title><FaExclamationTriangle className="text-danger me-2" />Confirm Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to permanently delete job sheet s<strong>{jobSheetToDelete?.jobSheetNumber}</strong>?
                    This action cannot be undone.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseDeleteModal} disabled={isDeleting}>Cancel</Button>
                    <Button variant="danger" onClick={handleDeleteJobSheet} disabled={isDeleting}>
                        {isDeleting ? <><Spinner as="span" size="sm" animation="border" className="me-1" /> Deleting...</> : "Yes, Delete It"}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default ActiveJobSheets;