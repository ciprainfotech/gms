import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { FaArrowRight, FaStickyNote, FaTrashAlt, FaCar, FaUser, FaClock, FaCheckCircle, FaFileInvoiceDollar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../App.css'; 

const CheckinCard = ({ job, onStartRepair, onDelete }) => {
    const navigate = useNavigate();

    const getStatusVariant = (status) => {
        switch (status) {
            case 'Waiting': return { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A', label: '⏳ Waiting' };
            case 'In Progress': return { bg: '#EEF2FF', color: '#4F46E5', border: '#C7D2FE', label: '🛠️ In Repair' };
            case 'Completed': return { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', label: '✅ Repair Closed' };
            case 'Invoiced': return { bg: '#E0F2FE', color: '#0284C7', border: '#BAE6FD', label: '🧾 Invoiced' };
            default: return { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0', label: status };
        }
    };

    const statusStyle = getStatusVariant(job.status);

    const handleViewDetails = () => {
        navigate(`/jobsheet/${job.id}`);
    };

    return (
        <Card className="checkin-card mb-3 shadow-sm border-0 rounded-4 overflow-hidden" style={{ transition: 'all 0.2s ease-in-out', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            {/* Top Accent Line */}
            <div style={{ 
                height: '4px', 
                backgroundColor: job.status === 'Waiting' ? '#F59E0B' : job.status === 'In Progress' ? '#4F46E5' : '#10B981' 
            }} />

            <Card.Body className="p-3">
                {/* Header: License Plate Badge + Status */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                    {/* Authentic Indian License Plate Pill */}
                    <div 
                        className="indian-license-plate d-inline-flex align-items-center px-2.5 py-1 rounded-2 shadow-xs fw-bold"
                        style={{ 
                            backgroundColor: '#FDE047', 
                            color: '#0F172A', 
                            border: '1.5px solid #0F172A',
                            fontFamily: "'Inter', sans-serif",
                            letterSpacing: '1px',
                            fontSize: '12px'
                        }}
                    >
                        <span className="me-1" style={{ fontSize: '9px', opacity: 0.8 }}>IND</span>
                        {job.vehicleNumber || 'MH 04 AB 1234'}
                    </div>

                    <span 
                        className="badge px-2.5 py-1 rounded-pill fw-bold"
                        style={{ backgroundColor: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, fontSize: '11px' }}
                    >
                        {statusStyle.label}
                    </span>
                </div>

                {/* Car Model & Customer Info */}
                <div onClick={handleViewDetails} style={{ cursor: 'pointer' }} className="mb-2">
                    <h6 className="fw-bold text-dark mb-0.5 d-flex align-items-center" style={{ fontSize: '14.5px' }}>
                        <FaCar className="me-2 text-primary" style={{ fontSize: '13px' }} /> {job.vehicleModel || 'Vehicle'}
                    </h6>
                    <div className="text-muted small d-flex align-items-center mt-1" style={{ fontSize: '12px' }}>
                        <FaUser className="me-1.5 text-secondary" style={{ fontSize: '11px' }} /> {job.customerName || 'Customer'}
                    </div>
                </div>

                {/* Notes Preview Box */}
                {job.notes && (
                    <div className="p-2 rounded-3 mb-3 bg-light border-0" style={{ backgroundColor: '#F8FAFC', fontSize: '11.5px', color: '#475569' }}>
                        <FaStickyNote className="me-1.5 text-warning" />
                        <span className="fw-medium">{job.notes}</span>
                    </div>
                )}

                {/* Bottom Action Footer */}
                <div className="d-flex justify-content-between align-items-center pt-2 border-top" style={{ borderColor: '#F1F5F9' }}>
                    <div className="d-flex align-items-center gap-1.5">
                        {job.status === 'Waiting' && (
                            <Button 
                                variant="primary" 
                                size="sm" 
                                className="rounded-pill px-3 py-1 fw-bold d-flex align-items-center shadow-xs" 
                                style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', border: 'none', fontSize: '12px' }}
                                onClick={onStartRepair}
                            >
                                Start Repair <FaArrowRight className="ms-1.5" style={{ fontSize: '10px' }} />
                            </Button>
                        )}
                        {job.status === 'In Progress' && (
                            <Button 
                                variant="success" 
                                size="sm" 
                                className="rounded-pill px-3 py-1 fw-bold d-flex align-items-center shadow-xs" 
                                style={{ background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none', fontSize: '12px' }}
                                onClick={handleViewDetails}
                            >
                                Manage Repairs
                            </Button>
                        )}
                        {(job.status === 'Completed' || job.status === 'Invoiced') && (
                            <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="rounded-pill px-3 py-1 fw-bold d-flex align-items-center" 
                                style={{ fontSize: '12px' }}
                                onClick={handleViewDetails}
                            >
                                View Job Sheet
                            </Button>
                        )}
                    </div>

                    <div>
                        {(job.status === 'Waiting' || job.status === 'In Progress') && (
                            <Button 
                                variant="link" 
                                size="sm" 
                                className="text-danger p-1 text-decoration-none opacity-75 opacity-100-hover" 
                                onClick={onDelete} 
                                title="Cancel Check-in"
                            >
                                <FaTrashAlt style={{ fontSize: '12px' }} />
                            </Button>
                        )}
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default CheckinCard;