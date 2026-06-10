// src/components/RecordPaymentModal.js
import React, { useState, useMemo, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, ListGroup, Table, Badge, Alert } from 'react-bootstrap';
import { FaMoneyBillWave, FaSave, FaEdit, FaTrash, FaPlusCircle } from 'react-icons/fa';
import api from '../api/api';

// Robust Currency Formatter
const formatCurrency = (amount) => {
    const numericAmount = Number(amount) || 0;
    return numericAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const RecordPaymentModal = ({ show, onHide, invoice, onPaymentActionSuccess }) => {
    const [amount, setAmount] = useState('');
    const [datePaid, setDatePaid] = useState(new Date().toISOString().split('T')[0]); 
    const [paymentMethod, setPaymentMethod] = useState('UPI');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState(null);

    // Determine if the invoice is fully paid or has no amount due
    // This will control the "view-only" mode for new payments
    const isInvoiceFullyPaid = useMemo(() => {
        return invoice?.status === 'Paid';
    }, [invoice]);

    // Calculate total paid and amount due based on the invoice prop
    const { totalPaid, amountDue } = useMemo(() => {
        if (!invoice) {
            return { totalPaid: 0, amountDue: 0 };
        }

        const grandTotal = parseFloat(invoice.grand_total) || 0;

        // 👉 THE FIX: Look for both camelCase and snake_case array keys
        let historyArray = [];
        if (invoice.paymentRecords && Array.isArray(invoice.paymentRecords)) {
            historyArray = invoice.paymentRecords;
        } else if (invoice.payment_records && Array.isArray(invoice.payment_records)) {
            historyArray = invoice.payment_records;
        } else if (invoice.paymentrecords && Array.isArray(invoice.paymentrecords)) {
            historyArray = invoice.paymentrecords;
        }

        const paid = historyArray.reduce((sum, record) => {
            const recordAmount = parseFloat(record.amountPaid || record.amount_paid) || 0;
            return sum + recordAmount;
        }, 0);

        const currentAmountDue = grandTotal - paid;

        return {
            totalPaid: paid,
            amountDue: currentAmountDue
        };
    }, [invoice]);

    // Effect to reset form state when modal opens, invoice changes, or edit mode changes
    useEffect(() => {
        if (show && !editingPayment) {
            resetForm();
        } else if (editingPayment) {
            setAmount((editingPayment.amountPaid || 0).toString());
            setDatePaid(editingPayment.datePaid || new Date().toISOString().split('T')[0]);
            setPaymentMethod(editingPayment.paymentMethod || 'UPI');
            setNotes(editingPayment.notes || '');
        }
    }, [show, invoice, editingPayment]);

    // Helper function to reset all form fields and error state
    const resetForm = () => {
        setAmount('');
        setDatePaid(new Date().toISOString().split('T')[0]);
        setPaymentMethod('UPI');
        setNotes('');
        setError('');
        setEditingPayment(null); // Clear any active editing state
    };

    // Handler for saving a new payment or updating an existing one
    const handleSave = async () => {
        // Prevent adding new payments if invoice is fully paid, unless editing an existing one
        if (isInvoiceFullyPaid && !editingPayment) {
            setError('This invoice is already fully paid. Cannot add new payments.');
            return;
        }

        setError(''); // Clear previous errors
        const paidAmount = parseFloat(amount);

        if (isNaN(paidAmount) || paidAmount <= 0) {
            setError('Please enter a valid, positive payment amount.');
            return;
        }

        // Confirmation for overpayment: compares entered amount against remaining due
        // Adjusted amountDue for editing scenario: re-adds current payment amount if editing
        const effectiveAmountDue = amountDue + (editingPayment ? parseFloat(editingPayment.amountPaid || 0) : 0);
        if (paidAmount > effectiveAmountDue + 0.01) { // Adding a small epsilon for float comparison
            if (!window.confirm(`The amount entered (${formatCurrency(paidAmount)}) is more than the amount due (${formatCurrency(effectiveAmountDue)}). Do you want to proceed?`)) {
                return;
            }
        }

        setLoading(true); // Start loading state
        try {
            const paymentData = {
                amountPaid: paidAmount,
                datePaid,
                paymentMethod,
                notes
            };

            let response;
            if (editingPayment) {
                response = await api.put(`/payments/${invoice.id}/payments/${editingPayment.id}`, paymentData);
            } else {
                response = await api.post(`/payments/${invoice.id}`, paymentData);
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Server error occurred.');
            }

            const successData = await response.json();
            // Call parent's success handler with action type and the updated invoice object
            onPaymentActionSuccess(editingPayment ? 'edit' : 'add', successData.invoice);

            onHide(); // Close the modal
        } catch (err) {
            console.error('Error saving payment:', err); // Keep error logging for debugging API issues
            setError(err.message || 'Failed to record payment. Please try again.');
        } finally {
            setLoading(false); // End loading state
        }
    };

    // Handler to set the payment for editing mode
    const handleEditClick = (payment) => {
        // Allow editing even if fully paid, but confirm with user for overpayment
        setEditingPayment(payment);
        setError(''); // Clear any previous errors when starting edit
    };

    // Handler to cancel editing and return to "Add New Payment" form
    const handleCancelEdit = () => {
        resetForm(); // Resets form and clears editingPayment state
    };

    // Handler to initiate payment deletion confirmation
    const handleDeleteClick = (payment) => {
        setPaymentToDelete(payment);
        setShowDeleteConfirm(true);
    };

    // Handler to confirm and execute payment deletion
    const confirmDeletePayment = async () => {
        setLoading(true);
        setError('');
        setShowDeleteConfirm(false); // Hide confirmation modal
        try {
            const response = await api.delete(`/payments/${invoice.id}/payments/${paymentToDelete.id}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Server error occurred.');
            }
            const successData = await response.json();
            onPaymentActionSuccess('delete', successData.invoice); // Notify parent
            onHide(); // Close modal
        } catch (err) {
            console.error('Error deleting payment:', err); // Keep error logging
            setError(err.message || 'Failed to delete payment. Please try again.');
        } finally {
            setLoading(false);
            setPaymentToDelete(null); // Clear payment to delete state
        }
    };

    // Handler for hiding the modal (resets form state)
    const handleHide = () => {
        resetForm(); // Always reset form when modal closes
        onHide();
    };

    // Render nothing if no invoice is provided (should ideally not happen due to conditional rendering in parent)
    if (!invoice) return null;

    return (
        <Modal show={show} onHide={handleHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    <FaMoneyBillWave className="me-2 text-success" />
                    {editingPayment ? 'Edit Payment' : (isInvoiceFullyPaid ? 'View Payment History' : 'Record Payment')} for Invoice: <span className="text-primary">{invoice.invoice_number}</span>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* Invoice Summary (Total, Paid, Due) */}
                <ListGroup horizontal className="mb-4 text-center">
                    <ListGroup.Item className="flex-fill">
                        <small className="text-muted">Total Amount</small>
                        <h5>{formatCurrency(invoice.grand_total)}</h5>
                    </ListGroup.Item>
                    <ListGroup.Item className="flex-fill text-success">
                        <small>Amount Paid</small>
                        <h5>{formatCurrency(totalPaid)}</h5>
                    </ListGroup.Item>
                    <ListGroup.Item className="flex-fill text-danger">
                        <small>Amount Due</small>
                        <h5>{formatCurrency(amountDue)}</h5>
                    </ListGroup.Item>
                </ListGroup>

                <Row>
                    {/* Payment History Table */}
                    <Col md={6} className="mb-4 mb-md-0">
                        <h6><Badge bg="secondary">Payment History</Badge></h6>
                        <div className="table-responsive" style={{ maxHeight: '250px' }}>
                            <Table striped bordered size="sm">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Method</th>
                                        <th className="text-end">Amount</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        // 1. Safely find the array
                                        let historyArray = [];
                                        if (invoice.paymentRecords && Array.isArray(invoice.paymentRecords)) historyArray = invoice.paymentRecords;
                                        else if (invoice.payment_records && Array.isArray(invoice.payment_records)) historyArray = invoice.payment_records;
                                        else if (invoice.paymentrecords && Array.isArray(invoice.paymentrecords)) historyArray = invoice.paymentrecords;

                                        // 2. If we have payments, map them
                                        if (historyArray.length > 0) {
                                            return historyArray.map((p, index) => (
                                                <tr key={`${p.id || 'p'}-${index}`}>
                                                    <td>{formatDate(p.datePaid || p.date_paid)}</td>
                                                    <td>{p.paymentMethod || p.payment_method}</td>
                                                    <td className="text-end">{formatCurrency(p.amountPaid || p.amount_paid)}</td>
                                                    <td className="text-center">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            className="me-1"
                                                            onClick={() => handleEditClick(p)}
                                                            disabled={loading || editingPayment?.id === p.id || isInvoiceFullyPaid}
                                                            title="Edit Payment"
                                                        >
                                                            <FaEdit />
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDeleteClick(p)}
                                                            disabled={loading || isInvoiceFullyPaid}
                                                            title="Delete Payment"
                                                        >
                                                            <FaTrash />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ));
                                        } else {
                                            // 3. If no payments, show the empty state
                                            return (
                                                <tr>
                                                    <td colSpan="4" className="text-center text-muted">No payments recorded.</td>
                                                </tr>
                                            );
                                        }
                                    })()}
                                </tbody>
                            </Table>
                        </div>
                    </Col>

                    {/* New/Edit Payment Form */}
                    <Col md={6}>
                        <h6>
                            <Badge bg={editingPayment ? 'warning' : 'primary'}>
                                {isInvoiceFullyPaid ? 'Invoice Paid' : (editingPayment ? 'Edit Payment' : 'Add New Payment')}
                            </Badge>
                        </h6>
                        {error && <Alert variant="danger" className="py-2">{error}</Alert>}
                        <Form>
                            <Form.Group as={Row} className="mb-3" controlId="formAmount">
                                <Form.Label column sm="4">Amount</Form.Label>
                                <Col sm="8">
                                    <Form.Control
                                        type="number"
                                        placeholder={amountDue.toFixed(2)}
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                        disabled={loading || (isInvoiceFullyPaid && !editingPayment)} // Disable if paid AND not editing
                                    />
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row} className="mb-3" controlId="formDate">
                                <Form.Label column sm="4">Date</Form.Label>
                                <Col sm="8">
                                    <Form.Control
                                        type="date"
                                        value={datePaid}
                                        onChange={(e) => setDatePaid(e.target.value)}
                                        required
                                        disabled={loading || (isInvoiceFullyPaid && !editingPayment)} // Disable if paid AND not editing
                                    />
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row} className="mb-3" controlId="formMethod">
                                <Form.Label column sm="4">Method</Form.Label>
                                <Col sm="8">
                                    <Form.Select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        disabled={loading || (isInvoiceFullyPaid && !editingPayment)} // Disable if paid AND not editing
                                    >
                                        <option>UPI</option>
                                        <option>Card</option>
                                        <option>Cash</option>
                                        <option>Bank Transfer</option>
                                        <option>Cheque</option>
                                        <option>Other</option>
                                    </Form.Select>
                                </Col>
                            </Form.Group>
                             <Form.Group as={Row} className="mb-3" controlId="formNotes">
                                <Form.Label column sm="4">Notes</Form.Label>
                                <Col sm="8">
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        placeholder="e.g., Transaction ID, Cheque No."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        disabled={loading || (isInvoiceFullyPaid && !editingPayment)} // Disable if paid AND not editing
                                    />
                                </Col>
                            </Form.Group>
                        </Form>
                        {editingPayment && ( // Only show "Add New Payment" button if currently editing
                            <Button variant="outline-secondary" size="sm" onClick={handleCancelEdit} disabled={loading} className="mt-2">
                                <FaPlusCircle className="me-1" /> Add New Payment
                            </Button>
                        )}
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleHide} disabled={loading}>Cancel</Button>
                <Button
                    variant="success"
                    onClick={handleSave}
                    // Disable save if loading, or if fully paid (and not specifically editing an existing payment),
                    // or if trying to save zero amount for zero due amount
                    disabled={loading || (isInvoiceFullyPaid && !editingPayment) || (amountDue <= 0 && parseFloat(amount || 0) <= 0 && !editingPayment)}
                >
                    <FaSave className="me-2" /> {loading ? 'Saving...' : (editingPayment ? 'Update Payment' : 'Save Payment')}
                </Button>
            </Modal.Footer>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete this payment record? This action cannot be undone.
                    <br/>
                    <strong>Amount:</strong> {paymentToDelete && formatCurrency(paymentToDelete.amountPaid)}
                    <br/>
                    <strong>Date:</strong> {paymentToDelete && new Date(paymentToDelete.datePaid).toLocaleDateString()}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDeletePayment} disabled={loading}>
                        {loading ? 'Deleting...' : 'Delete'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Modal>
    );
};

export default RecordPaymentModal;