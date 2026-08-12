import React from 'react';

const LoadingOverlay = ({ isVisible, message = 'Processing...' }) => {
  if (!isVisible) return null;

  return (
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        transition: 'all 0.3s ease'
      }}
    >
      <div className="text-center p-4 rounded-4 shadow-lg bg-white bg-opacity-10 border border-white border-opacity-20" style={{ minWidth: '220px' }}>
        <div className="spinner-border text-info mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h6 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>{message}</h6>
        <small className="text-white-50" style={{ fontSize: '11px' }}>Powered by Cipra Infotech</small>
      </div>
    </div>
  );
};

export default LoadingOverlay;
