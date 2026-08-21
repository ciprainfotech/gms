import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { FaArrowRight, FaStickyNote, FaTrashAlt, FaCar, FaUser, FaClock, FaCheckCircle, FaFileInvoiceDollar, FaCalendarAlt, FaPhoneAlt, FaTachometerAlt, FaHashtag } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/dateUtils';
import '../App.css'; 

const CheckinCard = ({ job, onStartRepair, onDelete, density = 'expanded' }) => {
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

    // --- COMPACT DENSE ROW VIEW (Saves 60%+ vertical height) ---
    if (density === 'compact') {
        return (
            <Card className="checkin-card mb-2 shadow-xs border-0 rounded-3 overflow-hidden" style={{ transition: 'all 0.15s ease-in-out', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                <div style={{ 
                    height: '3px', 
                    backgroundColor: job.status === 'Waiting' ? '#F59E0B' : job.status === 'In Progress' ? '#4F46E5' : '#10B981' 
                }} />

                <Card.Body className="p-2">
                    {/* Row 1: License Plate + Model + Status */}
                    <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                        <div className="d-flex align-items-center gap-1.5 min-w-0">
                            <div 
                                className="indian-license-plate d-inline-flex align-items-center px-1.5 py-0.2 rounded shadow-xs fw-bold flex-shrink-0"
                                style={{ 
                                    backgroundColor: '#FDE047', 
                                    color: '#0F172A', 
                                    border: '1px solid #0F172A',
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '10.5px',
                                    letterSpacing: '0.5px'
                                }}
                            >
                                <span className="me-0.5" style={{ fontSize: '7.5px', opacity: 0.8 }}>IND</span>
                                {job.vehicleNumber || 'MH 04 AB 1234'}
                            </div>
                            <span className="fw-bold text-dark text-truncate" style={{ fontSize: '13px', cursor: 'pointer' }} onClick={handleViewDetails}>
                                {job.vehicleModel || 'Vehicle'}
                            </span>
                        </div>

                        <span 
                            className="badge px-2 py-0.5 rounded-pill fw-bold flex-shrink-0"
                            style={{ backgroundColor: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, fontSize: '10px' }}
                        >
                            {statusStyle.label}
                        </span>
                    </div>

                    {/* Row 2: Customer Name + Date + Action Button */}
                    <div className="d-flex align-items-center justify-content-between gap-2 text-muted" style={{ fontSize: '11px' }}>
                        <div className="d-flex align-items-center gap-2 text-truncate">
                            <span className="text-dark fw-medium text-truncate">
                                <FaUser className="me-1 text-secondary" style={{ fontSize: '9px' }} />
                                {job.customerName || 'Customer'}
                            </span>
                            <span className="text-muted">
                                • <FaCalendarAlt className="ms-1 me-0.5 text-primary" style={{ fontSize: '9.5px' }} />
                                {formatDate(job.dateCreated)}
                            </span>
                        </div>

                        <div className="d-flex align-items-center gap-1 flex-shrink-0">
                            {job.status === 'Waiting' && (
                                <Button 
                                    variant="primary" 
                                    size="sm" 
                                    className="rounded-pill px-2 py-0 fw-bold shadow-xs" 
                                    style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', border: 'none', fontSize: '10.5px' }}
                                    onClick={onStartRepair}
                                >
                                    Start <FaArrowRight style={{ fontSize: '8px' }} />
                                </Button>
                            )}
                            {job.status === 'In Progress' && (
                                <Button 
                                    variant="success" 
                                    size="sm" 
                                    className="rounded-pill px-2 py-0 fw-bold shadow-xs" 
                                    style={{ background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none', fontSize: '10.5px' }}
                                    onClick={handleViewDetails}
                                >
                                    Manage
                                </Button>
                            )}
                            {(job.status === 'Completed' || job.status === 'Invoiced') && (
                                <Button 
                                    variant="outline-primary" 
                                    size="sm" 
                                    className="rounded-pill px-2 py-0 fw-bold" 
                                    style={{ fontSize: '10.5px' }}
                                    onClick={handleViewDetails}
                                >
                                    View
                                </Button>
                            )}
                            {(job.status === 'Waiting' || job.status === 'In Progress') && (
                                <Button 
                                    variant="link" 
                                    size="sm" 
                                    className="text-danger p-0 ms-1 text-decoration-none opacity-75" 
                                    onClick={onDelete} 
                                    title="Cancel Check-in"
                                >
                                    <FaTrashAlt style={{ fontSize: '10px' }} />
                                </Button>
                            )}
                        </div>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    // --- EXPANDED FULL DETAILED VIEW ---
    return (
        <Card className="checkin-card mb-3 shadow-sm border-0 rounded-4 overflow-hidden" style={{ transition: 'all 0.2s ease-in-out', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            {/* Top Accent Line */}
            <div style={{ 
                height: '4px', 
                backgroundColor: job.status === 'Waiting' ? '#F59E0B' : job.status === 'In Progress' ? '#4F46E5' : '#10B981' 
            }} />

            <Card.Body className="p-3">
                {/* Header: License Plate Badge + Status */}
                <div className="d-flex justify-content-between align-items-center mb-2 gap-1 flex-wrap">
                    {/* Authentic Indian License Plate Pill */}
                    <div className="d-flex align-items-center gap-1.5">
                        <div 
                            className="indian-license-plate d-inline-flex align-items-center px-2 py-0.5 rounded-2 shadow-xs fw-bold"
                            style={{ 
                                backgroundColor: '#FDE047', 
                                color: '#0F172A', 
                                border: '1.5px solid #0F172A',
                                fontFamily: "'Inter', sans-serif",
                                letterSpacing: '0.8px',
                                fontSize: '11.5px'
                            }}
                        >
                            <span className="me-1" style={{ fontSize: '8.5px', opacity: 0.8 }}>IND</span>
                            {job.vehicleNumber || 'MH 04 AB 1234'}
                        </div>

                        {/* Job Sheet Number Pill if available */}
                        {job.jobSheetNumber && !job.jobSheetNumber.startsWith('CHECKIN-') && (
                            <span className="badge bg-slate-100 text-slate-700 border border-slate-200 fw-semibold px-2 py-1" style={{ fontSize: '10.5px' }}>
                                <FaHashtag className="me-0.5 text-muted" style={{ fontSize: '9px' }} />
                                {job.jobSheetNumber}
                            </span>
                        )}
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
                    <h6 className="fw-bold text-dark mb-1 d-flex align-items-center justify-content-between" style={{ fontSize: '14.5px' }}>
                        <span className="d-flex align-items-center text-truncate">
                            <FaCar className="me-2 text-primary flex-shrink-0" style={{ fontSize: '13px' }} /> 
                            {job.vehicleModel || 'Vehicle'}
                        </span>
                    </h6>
                    
                    {/* Customer & Phone Info */}
                    <div className="d-flex align-items-center justify-content-between text-muted small mt-1 flex-wrap gap-2" style={{ fontSize: '12px' }}>
                        <div className="d-flex align-items-center text-dark fw-medium">
                            <FaUser className="me-1.5 text-secondary" style={{ fontSize: '11px' }} /> 
                            {job.customerName || 'Customer'}
                        </div>
                        {job.customerPhone && (
                            <a 
                                href={`tel:${job.customerPhone}`} 
                                className="text-decoration-none text-muted d-flex align-items-center hover-primary"
                                onClick={(e) => e.stopPropagation()}
                                style={{ fontSize: '11.5px' }}
                            >
                                <FaPhoneAlt className="me-1 text-success" style={{ fontSize: '10px' }} />
                                {job.customerPhone}
                            </a>
                        )}
                    </div>
                </div>

                {/* Checked-in Date & KM Badges Bar */}
                <div className="d-flex align-items-center justify-content-between p-2 rounded-3 mb-2" style={{ backgroundColor: '#F8FAFC', border: '1px border-slate-100', fontSize: '11.5px' }}>
                    <div className="d-flex align-items-center text-slate-700 fw-medium">
                        <FaCalendarAlt className="me-1.5 text-primary" style={{ fontSize: '11px' }} />
                        <span>Check-in: <strong className="text-dark">{formatDate(job.dateCreated)}</strong></span>
                    </div>

                    {job.kmReading && Number(job.kmReading) > 0 && (
                        <div className="d-flex align-items-center text-slate-600 fw-medium">
                            <FaTachometerAlt className="me-1 text-warning" style={{ fontSize: '11px' }} />
                            <span>{Number(job.kmReading).toLocaleString('en-IN')} KM</span>
                        </div>
                    )}
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
