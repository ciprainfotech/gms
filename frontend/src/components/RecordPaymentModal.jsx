import React, { useState, useMemo } from 'react';
import { Modal, Button, Form, Row, Col, ListGroup, Table, Badge, Alert } from 'react-bootstrap';
import { FaMoneyBillWave, FaSave } from 'react-icons/fa';

const formatCurrency = (amount) => amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

const RecordPaymentModal = ({ show, onHide, invoice, onSavePayment }) => {
    const [amount, setAmount] = useState('');
    const [datePaid, setDatePaid] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState('UPI');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    const { totalPaid, amountDue } = useMemo(() => {
        if (!invoice) return { totalPaid: 0, amountDue: 0 };
        const paid = invoice.paymentRecords.reduce((sum, record) => sum + record.amountPaid, 0);
        return {
            totalPaid: paid,
            amountDue: invoice.grandTotal - paid
        };
    }, [invoice]);

    const handleSave = () => {
        const paidAmount = parseFloat(amount);
        if (isNaN(paidAmount) || paidAmount <= 0) {
            setError('Please enter a valid, positive payment amount.');
            return;
        }
        if (paidAmount > amountDue) {
            if (!window.confirm(`The amount entered (${formatCurrency(paidAmount)}) is more than the amount due (${formatCurrency(amountDue)}). Do you want to proceed?`)) {
                return;
            }
        }

        onSavePayment(invoice.id, {
            amountPaid: paidAmount,
            datePaid,
            paymentMethod,
            notes
        });
        resetForm();
        onHide();
    };
    
    const resetForm = () => {
        setAmount('');
        setDatePaid(new Date().toISOString().split('T')[0]);
        setPaymentMethod('UPI');
        setNotes('');
        setError('');
    };

    const handleHide = () => {
        resetForm();
        onHide();
    };

    if (!invoice) return null;

    return (
        <Modal show={show} onHide={handleHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    <FaMoneyBillWave className="me-2 text-success" />
                    Record Payment for Invoice: <span className="text-primary">{invoice.invoiceNumber}</span>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* Invoice Summary */}
                <ListGroup horizontal className="mb-4 text-center">
                    <ListGroup.Item className="flex-fill">
                        <small className="text-muted">Total Amount</small>
                        <h5>{formatCurrency(invoice.grandTotal)}</h5>
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
                    {/* Payment History */}
                    <Col md={6} className="mb-4 mb-md-0">
                        <h6><Badge bg="secondary">Payment History</Badge></h6>
                        <div className="table-responsive" style={{ maxHeight: '250px' }}>
                            <Table striped bordered size="sm">
                                <thead>
                                    <tr><th>Date</th><th>Method</th><th className="text-end">Amount</th></tr>
                                </thead>
                                <tbody>
                                    {invoice.paymentRecords.length > 0 ? (
                                        invoice.paymentRecords.map(p => (
                                            <tr key={p.id}>
                                                <td>{new Date(p.datePaid).toLocaleDateString()}</td>
                                                <td>{p.paymentMethod}</td>
                                                <td className="text-end">{formatCurrency(p.amountPaid)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="3" className="text-center text-muted">No payments recorded.</td></tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </Col>

                    {/* New Payment Form */}
                    <Col md={6}>
                        <h6><Badge bg="primary">Add New Payment</Badge></h6>
                        {error && <Alert variant="danger" size="sm">{error}</Alert>}
                        <Form>
                            <Form.Group as={Row} className="mb-3" controlId="formAmount">
                                <Form.Label column sm="4">Amount</Form.Label>
                                <Col sm="8">
                                    <Form.Control type="number" placeholder={amountDue.toFixed(2)} value={amount} onChange={(e) => setAmount(e.target.value)} required />
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row} className="mb-3" controlId="formDate">
                                <Form.Label column sm="4">Date</Form.Label>
                                <Col sm="8">
                                    <Form.Control type="date" value={datePaid} onChange={(e) => setDatePaid(e.target.value)} required/>
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row} className="mb-3" controlId="formMethod">
                                <Form.Label column sm="4">Method</Form.Label>
                                <Col sm="8">
                                    <Form.Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                        <option>UPI</option>
                                        <option>Card</option>
                                        <option>Cash</option>
                                        <option>Bank Transfer</option>
                                        <option>Cheque</option>
                                    </Form.Select>
                                </Col>
                            </Form.Group>
                             <Form.Group as={Row} className="mb-3" controlId="formNotes">
                                <Form.Label column sm="4">Notes</Form.Label>
                                <Col sm="8">
                                    <Form.Control as="textarea" rows={2} placeholder="e.g., Transaction ID, Cheque No." value={notes} onChange={(e) => setNotes(e.target.value)} />
                                </Col>
                            </Form.Group>
                        </Form>
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleHide}>Cancel</Button>
                <Button variant="success" onClick={handleSave} disabled={amountDue <= 0}>
                    <FaSave className="me-2" /> Save Payment
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default RecordPaymentModal;