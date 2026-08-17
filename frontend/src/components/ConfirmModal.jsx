import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const ConfirmModal = ({ isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger', isLoading = false, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 100050 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 100051 }}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div className="modal-header border-0 bg-light p-4">
            <div className="d-flex align-items-center">
              <div className={`p-2 rounded-circle bg-${variant} bg-opacity-10 text-${variant} me-3`}>
                <FontAwesomeIcon icon={faExclamationTriangle} size="lg" />
              </div>
              <h5 className="modal-title fw-bold mb-0 text-dark">{title || 'Confirm Action'}</h5>
            </div>
            <button type="button" className="btn-close" onClick={onCancel} disabled={isLoading}></button>
          </div>
          <div className="modal-body p-4">
            <p className="text-secondary mb-0" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
              {message}
            </p>
          </div>
          <div className="modal-footer border-0 bg-light px-4 py-3">
            <button type="button" className="btn btn-outline-secondary px-4 fw-medium" onClick={onCancel} disabled={isLoading}>
              {cancelText}
            </button>
            <button type="button" className={`btn btn-${variant} px-4 fw-medium d-inline-flex align-items-center`} onClick={onConfirm} disabled={isLoading}>
              {isLoading && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
