import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaArrowLeft, FaCompass, FaTachometerAlt, FaFileInvoiceDollar, FaUsers, FaCog } from 'react-icons/fa';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Smart suggestions for common path typos
  const path = location.pathname.toLowerCase();
  let suggestedLink = null;

  if (path.includes('setting')) {
    suggestedLink = { title: 'Settings & Garage Profile', url: '/settings', icon: <FaCog /> };
  } else if (path.includes('job') || path.includes('sheet')) {
    suggestedLink = { title: 'Active Job Sheets', url: '/active-jobsheets', icon: <FaTachometerAlt /> };
  } else if (path.includes('invoice') || path.includes('bill')) {
    suggestedLink = { title: 'Invoices Archive', url: '/invoices', icon: <FaFileInvoiceDollar /> };
  } else if (path.includes('staff') || path.includes('pay')) {
    suggestedLink = { title: 'Staff & Payroll', url: '/payroll', icon: <FaUsers /> };
  }

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 py-5 px-3" style={{ background: '#F8FAFC' }}>
      <div 
        className="card border-0 shadow-lg p-4 p-md-5 text-center position-relative overflow-hidden" 
        style={{ 
          maxWidth: '560px', 
          width: '100%', 
          borderRadius: '24px',
          background: '#FFFFFF'
        }}
      >
        {/* Subtle Ambient Glow */}
        <div 
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, rgba(79, 70, 229, 0.12) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }}
        />
        <div 
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: '-60px',
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }}
        />

        {/* Floating 404 Badge & Icon */}
        <div className="d-inline-flex align-items-center justify-content-center mb-3">
          <span 
            className="badge rounded-pill px-3 py-2 fw-bold text-uppercase d-flex align-items-center gap-2"
            style={{ background: '#EEF2FF', color: '#4F46E5', fontSize: '11px', letterSpacing: '0.08em' }}
          >
            <FaCompass className="text-primary" /> Error 404 • Page Not Found
          </span>
        </div>

        {/* 404 Big Gradient Number */}
        <h1 
          className="display-1 fw-black my-2" 
          style={{ 
            fontSize: '5.5rem', 
            letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 900
          }}
        >
          404
        </h1>

        <h4 className="fw-bold text-dark mb-2">Off the Track!</h4>
        <p className="text-muted small mb-4" style={{ lineHeight: '1.6' }}>
          The path <code className="bg-light text-primary px-2 py-1 rounded" style={{ fontSize: '0.85rem' }}>{location.pathname}</code> does not exist or might have been moved.
        </p>

        {/* Smart Suggestion Pill if typo detected */}
        {suggestedLink && (
          <div className="p-3 mb-4 rounded-3 border text-start d-flex align-items-center justify-content-between" style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}>
            <div className="d-flex align-items-center gap-2.5">
              <span className="p-2 rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center">
                {suggestedLink.icon}
              </span>
              <div>
                <div className="text-xs text-muted fw-semibold">Did you mean to go to:</div>
                <div className="fw-bold text-dark text-sm">{suggestedLink.title}</div>
              </div>
            </div>
            <Link to={suggestedLink.url} className="btn btn-sm btn-primary rounded-pill px-3 fw-bold">
              Go There →
            </Link>
          </div>
        )}

        {/* Action Buttons */}
        <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center gap-2 mb-4">
          <Link 
            to="/dashboard" 
            className="btn btn-primary fw-bold rounded-pill px-4 py-2.5 w-100 w-sm-auto d-inline-flex align-items-center justify-content-center gap-2"
          >
            <FaHome /> Back to Dashboard
          </Link>
          <button 
            onClick={() => navigate(-1)} 
            className="btn btn-outline-secondary fw-semibold rounded-pill px-4 py-2.5 w-100 w-sm-auto d-inline-flex align-items-center justify-content-center gap-2"
          >
            <FaArrowLeft /> Go Back
          </button>
        </div>

        {/* Quick Navigation Shortcuts */}
        <div className="border-top pt-3 text-start">
          <div className="text-uppercase text-muted fw-bold text-xs mb-2" style={{ letterSpacing: '0.06em', fontSize: '10px' }}>
            Quick Shortcuts:
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/active-jobsheets" className="badge bg-light text-dark border text-decoration-none px-2.5 py-1.5 rounded-pill">
              Active Job Sheets
            </Link>
            <Link to="/invoices" className="badge bg-light text-dark border text-decoration-none px-2.5 py-1.5 rounded-pill">
              Invoices
            </Link>
            <Link to="/payroll" className="badge bg-light text-dark border text-decoration-none px-2.5 py-1.5 rounded-pill">
              Staff & Payroll
            </Link>
            <Link to="/settings" className="badge bg-light text-dark border text-decoration-none px-2.5 py-1.5 rounded-pill">
              Profile & Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
