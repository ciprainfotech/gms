import React from 'react';
import { FaInbox, FaPlus } from 'react-icons/fa';

const EmptyState = ({
  icon: Icon = FaInbox,
  title = 'No Data Found',
  message = 'There are no records to display at this time.',
  action,
  actionText,
  onActionClick,
  className = ''
}) => {
  return (
    <div 
      className={`card border-0 shadow-sm text-center p-4 p-md-5 my-3 position-relative overflow-hidden ${className}`}
      style={{
        borderRadius: '24px',
        background: '#FFFFFF',
        border: '1.5px dashed #CBD5E1',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.03)'
      }}
    >
      {/* Decorative subtle background radial glow */}
      <div 
        style={{
          position: 'absolute',
          top: '-40px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '240px',
          height: '240px',
          background: 'radial-gradient(circle, rgba(79, 70, 229, 0.06) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }}
      />

      <div className="d-flex flex-column align-items-center justify-content-center position-relative" style={{ zIndex: 1 }}>
        {/* Animated Icon Box */}
        <div 
          className="d-flex align-items-center justify-content-center mb-3 shadow-sm"
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            color: '#4F46E5',
            fontSize: '34px'
          }}
        >
          <Icon />
        </div>

        {/* Title & Message */}
        <h5 className="fw-bold text-dark mb-2" style={{ fontSize: '1.2rem', letterSpacing: '-0.01em' }}>
          {title}
        </h5>
        <p className="text-muted small mb-4" style={{ maxWidth: '440px', lineHeight: '1.6' }}>
          {message}
        </p>

        {/* Action element */}
        {action ? (
          <div>{action}</div>
        ) : actionText && onActionClick ? (
          <button 
            type="button" 
            className="btn btn-primary fw-bold rounded-pill px-4 py-2.5 d-inline-flex align-items-center gap-2 shadow-sm"
            onClick={onActionClick}
          >
            <FaPlus /> {actionText}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default EmptyState;
