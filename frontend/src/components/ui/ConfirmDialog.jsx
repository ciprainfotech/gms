import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { FaExclamationTriangle } from 'react-icons/fa';

const ConfirmDialog = ({
  isOpen,
  title = 'Are you sure?',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  typedConfirmation = null, // e.g. "DELETE"
  isProcessing = false,
  onConfirm,
  onCancel
}) => {
  const [typedInput, setTypedInput] = useState('');

  const handleConfirm = () => {
    if (typedConfirmation && typedInput !== typedConfirmation) {
      return;
    }
    onConfirm();
  };

  const isConfirmDisabled = isProcessing || (typedConfirmation && typedInput !== typedConfirmation);

  return (
    <Modal show={isOpen} onHide={onCancel} centered backdrop="static" className="modal-shell">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="d-flex align-items-center gap-2 text-danger fs-6 fw-bold">
          <FaExclamationTriangle />
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-3">
        <p className="text-secondary fs-6 mb-3">{message}</p>

        {typedConfirmation && (
          <div className="bg-light p-3 rounded border mb-3">
            <Form.Label className="form-label-saas mb-2">
              Type <strong className="text-danger">{typedConfirmation}</strong> to confirm:
            </Form.Label>
            <Form.Control
              type="text"
              value={typedInput}
              onChange={e => setTypedInput(e.target.value)}
              placeholder={typedConfirmation}
              className="form-control-saas"
            />
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button variant="light" onClick={onCancel} disabled={isProcessing} className="btn-saas btn-saas-secondary">
          {cancelText}
        </Button>
        <Button
          variant={variant}
          onClick={handleConfirm}
          disabled={isConfirmDisabled}
          className={`btn-saas btn-saas-${variant}`}
        >
          {isProcessing ? 'Processing...' : confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmDialog;
