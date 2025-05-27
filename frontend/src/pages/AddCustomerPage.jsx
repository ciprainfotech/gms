import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Card, Form, Row, Col, Button, Alert, Spinner } from 'react-bootstrap';
import { FaUserPlus, FaUser, FaCar, FaSave, FaTimes, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCity } from 'react-icons/fa';
import { addCustomer, addVehicle } from '../data/staticData'; // Import simulation functions

const AddCustomerPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Get the car number passed from the dashboard, default to null if not passed
    const carNumberFromState = location.state?.carNumber || null;
    // Determine if the car number field should be editable
    const isCarNumberEditable = !carNumberFromState;

    // Initialize form state
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        city: "",
        address: "",
        vehicleModel: "",
        // If navigated directly, carNumber starts blank; otherwise, pre-fill
        carNumber: carNumberFromState || "",
        vehicleMake: "",
        vehicleYear: "",
        vehicleVin: ""
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- REMOVED useEffect redirect ---
    // We allow users to land here directly now.

    // Update form data state on input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        // Prevent changing carNumber if it was pre-filled from state
        if (name === 'carNumber' && !isCarNumberEditable) {
            return;
        }
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    // Navigate back to dashboard on cancel
    const handleCancel = () => {
        // Go back in history if possible, otherwise to dashboard
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/dashboard');
        }
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        // Get potentially updated carNumber from formData
        const { name, phone, vehicleModel, carNumber, vehicleMake } = formData;

        // Validation: Check required fields
        if (!name || !phone || !vehicleMake || !vehicleModel || !carNumber) {
            setError("Please fill in all required fields: Name, Phone, Vehicle Make, Model, and Number.");
            return;
        }

        setIsSubmitting(true);

        // --- Simulation Logic ---
        const savedCustomer = addCustomer({
            name: name, phone: phone, email: formData.email,
            city: formData.city, address: formData.address
        });
        if (!savedCustomer || !savedCustomer.id) {
            setError("Failed to save customer data (Simulated Error).");
            setIsSubmitting(false); return;
        }

        const savedVehicle = addVehicle({
            customerId: savedCustomer.id, carNumber: carNumber.trim().toUpperCase(), // Ensure consistent format
            make: vehicleMake, model: vehicleModel,
            year: formData.vehicleYear, vin: formData.vehicleVin
        });
        if (!savedVehicle || !savedVehicle.id) {
            setError("Failed to save vehicle data (Simulated Error).");
            setIsSubmitting(false); return;
        }

        // If we arrived via check-in flow, navigate back and pass check-in data
        if (carNumberFromState) {
            const newCheckInData = {
                id: Date.now(), customer: savedCustomer.name, carNumber: savedVehicle.carNumber,
                vehicleModel: `${savedVehicle.make || ''} ${savedVehicle.model || ''}`.trim(),
                status: "Waiting",
                checkIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                customerId: savedCustomer.id, vehicleId: savedVehicle.id,
            };
            console.log("Navigating back to dashboard with new check-in data:", newCheckInData);
            setTimeout(() => {
                navigate('/dashboard', { state: { newCheckIn: newCheckInData }, replace: true });
            }, 300);
        } else {
            // If navigated directly, maybe navigate to the customer/vehicle list or dashboard
            console.log("Customer and Vehicle added directly. Navigating to Customers page.");
             setTimeout(() => {
                 // Consider navigating to the customers page to see the new entry
                 navigate('/customers-vehicles');
                 // Or just back to dashboard
                 // navigate('/dashboard');
                 setIsSubmitting(false); // Need to reset here as we are not unmounting immediately
             }, 300);
             alert(`Customer ${savedCustomer.name} and Vehicle ${savedVehicle.carNumber} added successfully!`); // Provide feedback
        }
    };

    // --- Render Component ---
    return (
        <Container fluid className="py-4 px-md-4">
            <Row className="justify-content-center">
                <Col md={9} lg={8} xl={7}>
                    <Card className="shadow-lg border-0 rounded-lg">
                        <Card.Header className="bg-primary text-white text-center py-3">
                            <h3 className="mb-0"><FaUserPlus className="me-2" /> Add New Customer & Vehicle</h3>
                        </Card.Header>
                        <Card.Body className="p-4 p-md-5">
                             {/* Informational alert (only show if coming from check-in) */}
                             {carNumberFromState && (
                                 <Alert variant="info" className="d-flex align-items-center">
                                     <FaCar className="me-2 flex-shrink-0" size="1.5em"/>
                                     <span>Vehicle with number <strong>{carNumberFromState}</strong> was not found. Please add details.</span>
                                 </Alert>
                             )}

                            {/* Display submission error */}
                            {error && <Alert variant="danger">{error}</Alert>}

                            {/* Form */}
                            <Form noValidate onSubmit={handleSubmit}>
                                {/* Customer Information Section */}
                                <h5 className="text-secondary mb-3 border-bottom pb-2"><FaUser className="me-2"/>Customer Information</h5>
                                <Row className="mb-3">
                                    <Form.Group as={Col} md={6} controlId="formCustomerName">
                                        <Form.Label>Customer Name <span className="text-danger">*</span></Form.Label>
                                        <Form.Control type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="Enter full name" disabled={isSubmitting}/>
                                    </Form.Group>
                                    <Form.Group as={Col} md={6} controlId="formCustomerPhone">
                                        <Form.Label>Phone Number <span className="text-danger">*</span></Form.Label>
                                        <Form.Control type="tel" name="phone" required value={formData.phone} onChange={handleChange} placeholder="Enter 10-digit mobile number" disabled={isSubmitting}/>
                                    </Form.Group>
                                </Row>
                                <Row className="mb-4">
                                    <Form.Group as={Col} md={6} controlId="formCustomerEmail">
                                        <Form.Label><FaEnvelope className="me-1 text-muted"/>Email Address</Form.Label>
                                        <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email (optional)" disabled={isSubmitting}/>
                                    </Form.Group>
                                    <Form.Group as={Col} md={6} controlId="formCustomerCity">
                                        <Form.Label><FaCity className="me-1 text-muted"/>City</Form.Label>
                                        <Form.Control type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Enter city (optional)" disabled={isSubmitting}/>
                                    </Form.Group>
                                     <Form.Group as={Col} xs={12} className="mt-3" controlId="formCustomerAddress">
                                        <Form.Label><FaMapMarkerAlt className="me-1 text-muted"/>Address</Form.Label>
                                        <Form.Control as="textarea" rows={2} name="address" value={formData.address} onChange={handleChange} placeholder="Enter full address (optional)" disabled={isSubmitting}/>
                                    </Form.Group>
                                </Row>

                                {/* Vehicle Information Section */}
                                <h5 className="text-secondary mb-3 border-bottom pb-2"><FaCar className="me-2"/>Vehicle Information</h5>
                                <Row className="mb-3">
                                     <Form.Group as={Col} md={6} controlId="formVehicleNumber">
                                        <Form.Label>Vehicle Number <span className="text-danger">*</span></Form.Label>
                                        {/* Conditional ReadOnly/Disabled */}
                                        <Form.Control
                                            type="text"
                                            name="carNumber"
                                            required
                                            value={formData.carNumber} // Value from state
                                            onChange={handleChange} // Handler to update state
                                            placeholder={isCarNumberEditable ? "e.g., GJ01AB1234" : ""} // Placeholder only if editable
                                            readOnly={!isCarNumberEditable} // ReadOnly if NOT editable
                                            disabled={isSubmitting} // Always disable during submit
                                            className={!isCarNumberEditable ? "fw-bold bg-light" : ""} // Style if pre-filled
                                        />
                                    </Form.Group>
                                     <Form.Group as={Col} md={6} controlId="formVehicleMake">
                                        <Form.Label>Vehicle Make <span className="text-danger">*</span></Form.Label>
                                        <Form.Control type="text" name="vehicleMake" required value={formData.vehicleMake} onChange={handleChange} placeholder="e.g., Maruti Suzuki, Honda" disabled={isSubmitting}/>
                                    </Form.Group>
                                </Row>
                                <Row className="mb-4">
                                   <Form.Group as={Col} md={6} controlId="formVehicleModel">
                                        <Form.Label>Vehicle Model <span className="text-danger">*</span></Form.Label>
                                        <Form.Control type="text" name="vehicleModel" required value={formData.vehicleModel} onChange={handleChange} placeholder="e.g., Swift VXi, Civic" disabled={isSubmitting}/>
                                    </Form.Group>
                                     <Form.Group as={Col} md={6} controlId="formVehicleYear">
                                        <Form.Label>Manufacturing Year</Form.Label>
                                        <Form.Control type="number" name="vehicleYear" min="1980" max={new Date().getFullYear() + 1} value={formData.vehicleYear} onChange={handleChange} placeholder="e.g., 2019 (optional)" disabled={isSubmitting}/>
                                    </Form.Group>
                                    <Form.Group as={Col} xs={12} className="mt-3" controlId="formVehicleVin">
                                        <Form.Label>VIN (Chassis Number)</Form.Label>
                                        <Form.Control type="text" name="vehicleVin" value={formData.vehicleVin} onChange={handleChange} placeholder="Enter VIN (optional)" disabled={isSubmitting} maxLength={17}/>
                                    </Form.Group>
                                </Row>

                                {/* Footer */}
                                <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                                     <small className="text-muted">Fields marked with <span className="text-danger">*</span> are required.</small>
                                     <div className="d-flex gap-2">
                                         <Button variant="outline-secondary" type="button" onClick={handleCancel} disabled={isSubmitting}>
                                             <FaTimes className="me-1" /> Cancel
                                         </Button>
                                         <Button variant="primary" type="submit" disabled={isSubmitting}>
                                             {isSubmitting ? (
                                                 <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1"/> Saving...</>
                                             ) : (
                                                  // Change button text based on context
                                                 <><FaSave className="me-1" /> {carNumberFromState ? 'Save & Check-in' : 'Save Customer & Vehicle'}</>
                                             )}
                                         </Button>
                                     </div>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AddCustomerPage;