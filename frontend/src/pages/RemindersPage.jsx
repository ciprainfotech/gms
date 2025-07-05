import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Table, Button, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { FaPaperPlane, FaExclamationCircle, FaTools } from 'react-icons/fa';
import { initialInvoices, initialJobSheets } from '../data/staticData';
import { sendPaymentReminder, sendServiceReminder } from '../api/communicationAPI';

const SERVICE_REMINDER_DAYS = 90; // e.g., 3 months

const RemindersPage = () => {
    const [loadingStates, setLoadingStates] = useState({});
    const [dataVersion, setDataVersion] = useState(0); // To force re-render after sending

    // --- Derive data on each render ---
    const { duePayments, dueServices } = useMemo(() => {
        const today = new Date();
        
        // Find overdue payments
        const payments = initialInvoices.filter(inv => inv.status === 'Overdue');
        
        // Find services due for a reminder
        const services = initialJobSheets.filter(js => {
            if (js.serviceReminderSent || !js.dateCompleted) return false;
            const completedDate = new Date(js.dateCompleted);
            const reminderDate = new Date(completedDate.setDate(completedDate.getDate() + SERVICE_REMINDER_DAYS));
            return today >= reminderDate;
        });

        return { duePayments: payments, dueServices: services };
    }, [dataVersion]);

    const handleSendPayment = async (invoiceId) => {
        setLoadingStates(prev => ({ ...prev, [`pay-${invoiceId}`]: true }));
        try {
            await sendPaymentReminder(invoiceId);
            // Optionally, you could add a "lastReminderSent" field to the invoice
            // and update it here to prevent re-sending too often.
        } finally {
            setLoadingStates(prev => ({ ...prev, [`pay-${invoiceId}`]: false }));
        }
    };
    
    const handleSendService = async (jobSheetId) => {
        setLoadingStates(prev => ({ ...prev, [`svc-${jobSheetId}`]: true }));
        try {
            await sendServiceReminder(jobSheetId);
            setDataVersion(v => v + 1); // Force re-render to remove from list
        } finally {
            setLoadingStates(prev => ({ ...prev, [`svc-${jobSheetId}`]: false }));
        }
    };

    return (
        <Container fluid className="py-0">
            <div className="page-header-row">
                <h2 className="page-title-active mb-0"><FaPaperPlane /> Communication & Reminders</h2>
            </div>
            <div className="main-content pt-0">
                <Row>
                    {/* Overdue Payment Reminders */}
                    <Col lg={6} className="mb-4">
                        <Card>
                            <Card.Header className="bg-danger text-white fw-bold"><FaExclamationCircle /> Overdue Payment Reminders</Card.Header>
                            <Table responsive hover className="mb-0">
                                <thead><tr><th>Invoice #</th><th>Customer</th><th>Action</th></tr></thead>
                                <tbody>
                                    {duePayments.length > 0 ? duePayments.map(inv => (
                                        <tr key={inv.id}>
                                            <td><Link to={`/invoice/${inv.id}/view`}>{inv.invoiceNumber}</Link></td>
                                            <td>{inv.customerName}</td>
                                            <td><Button size="sm" variant="outline-danger" onClick={() => handleSendPayment(inv.id)} disabled={loadingStates[`pay-${inv.id}`]}>
                                                {loadingStates[`pay-${inv.id}`] ? <Spinner size="sm" /> : <>Send Reminder</>}
                                            </Button></td>
                                        </tr>
                                    )) : <tr><td colSpan="3" className="text-center text-muted p-4">No overdue payments.</td></tr>}
                                </tbody>
                            </Table>
                        </Card>
                    </Col>
                    
                    {/* Service Reminders */}
                    <Col lg={6} className="mb-4">
                        <Card>
                             <Card.Header className="bg-primary text-white fw-bold"><FaTools /> Upcoming Service Reminders</Card.Header>
                             <Table responsive hover className="mb-0">
                                <thead><tr><th>Vehicle</th><th>Last Service</th><th>Action</th></tr></thead>
                                <tbody>
                                    {dueServices.length > 0 ? dueServices.map(js => (
                                        <tr key={js.id}>
                                            <td>{js.vehicleNumber}</td>
                                            <td>{new Date(js.dateCompleted).toLocaleDateString()}</td>
                                            <td><Button size="sm" variant="outline-primary" onClick={() => handleSendService(js.id)} disabled={loadingStates[`svc-${js.id}`]}>
                                                {loadingStates[`svc-${js.id}`] ? <Spinner size="sm" /> : <>Send Reminder</>}
                                            </Button></td>
                                        </tr>
                                    )) : <tr><td colSpan="3" className="text-center text-muted p-4">No vehicles are due for a service reminder.</td></tr>}
                                </tbody>
                            </Table>
                        </Card>
                    </Col>
                </Row>
            </div>
        </Container>
    );
};

export default RemindersPage;