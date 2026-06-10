import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { FaArrowRight, FaStickyNote, FaTrashAlt, FaCar, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../App.css'; // Ensure this file contains styles for .checkin-card, .card-title-clickable, etc.

const CheckinCard = ({ job, onStartRepair, onDelete }) => {
    const navigate = useNavigate();

    const getStatusVariant = (status) => {
        switch (status) {
            case 'Waiting': return 'secondary';
            case 'In Progress': return 'warning';
            case 'Completed': return 'success';
            default: return 'light';
        }
    };

    const handleViewDetails = () => {
        // For 'In Progress' and 'Completed' jobs, this navigates to the full job sheet editor/viewer.
        navigate(`/jobsheet/${job.id}`);
    };

    return (
        <Card className="checkin-card mb-3 shadow-sm">
            <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-start">
                    <div onClick={handleViewDetails} style={{ cursor: 'pointer', flexGrow: 1 }}>
                        <Card.Title className="h6 mb-1 card-title-clickable">{job.vehicleModel}</Card.Title>
                        <p className="mb-2 text-muted small"><FaCar className="me-1" /> {job.vehicleNumber}</p>
                    </div>
                    <Badge pill bg={getStatusVariant(job.status)} className="align-self-center">{job.status}</Badge>
                </div>
                <p className="small mb-2"><FaUser className="me-2 text-muted"/>{job.customerName}</p>
                <Card.Text className="small text-muted mb-3 notes-preview">
                    <FaStickyNote className="me-2"/>{job.notes || "No notes provided."}
                </Card.Text>

                <div className="d-flex justify-content-between align-items-center">
                    {/* Main Action Buttons */}
                    <div>
                        {job.status === 'Waiting' && (
                            <Button variant="primary" size="sm" onClick={onStartRepair}>
                                Start Repair <FaArrowRight />
                            </Button>
                        )}
                        {job.status === 'In Progress' && (
                             <Button variant="success" size="sm" onClick={handleViewDetails}>
                                Update Details
                            </Button>
                        )}
                         {job.status === 'Completed' && (
                             <Button variant="info" size="sm" onClick={handleViewDetails}>
                                View Details
                            </Button>
                        )}
                    </div>

                    {/* Secondary Action: Delete/Cancel Button */}
                    <div>
                        {(job.status === 'Waiting' || job.status === 'In Progress') && (
                            <Button variant="outline-danger" size="sm" className="p-1" onClick={onDelete} title="Cancel Check-in">
                                <FaTrashAlt />
                            </Button>
                        )}
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default CheckinCard;