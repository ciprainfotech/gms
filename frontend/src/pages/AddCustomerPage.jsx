import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Card, Form, Row, Col, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { FaUserPlus, FaUser, FaCar, FaSave, FaTimes, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCity } from 'react-icons/fa';
import api from '../api/api.js';

const AddCustomerPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Data from previous page
    const carNumberFromState = location.state?.carNumber || '';
    const keyProblemsFromState = location.state?.keyProblems || '';
    const isCarNumberEditable = !carNumberFromState;

    // --- Structured State for Forms ---
    const [customer, setCustomer] = useState({ name: "", phone: "", email: "", city: "", address: "" });
    const [vehicle, setVehicle] = useState({
        carNumber: carNumberFromState,
        make_id: "",
        model_id: "",
        vehicleYear: "",
        vehicleVin: "",
        fuel_type: ""
    });
    
    // Dropdown data and selected model info
    const [makes, setMakes] = useState([]);
    const [models, setModels] = useState([]);
    const [selectedModelInfo, setSelectedModelInfo] = useState(null);
    const [yearOptions, setYearOptions] = useState([]); // <<< NEW: For year dropdown options

    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    // 👉 NEW: Track if we found an existing customer
    const [isCheckingPhone, setIsCheckingPhone] = useState(false);
    const [foundCustomerAlert, setFoundCustomerAlert] = useState(false);

    // --- Data Fetching Effect ---
    useEffect(() => {
        const fetchMakes = async () => {
            try {
                const res = await api.get('/meta/makes');
                if (!res.ok) throw new Error('Could not fetch vehicle makes.');
                const data = await res.json();
                setMakes(data.data);
            } catch (err) {
                setError(err.message);
            }
        };
        fetchMakes();
    }, []);

    // --- Event Handlers ---
    const handleCustomerChange = (e) => setCustomer({ ...customer, [e.target.name]: e.target.value });
    const handlePhoneBlur = async () => {
        // Only check if they typed a standard length phone number
        if (customer.phone.length < 8) return; 
        
        setIsCheckingPhone(true);
        setFoundCustomerAlert(false);
        try {
            const res = await api.get(`/customers/check-phone/${customer.phone}`);
            const result = await res.json();
            
            if (result.exists) {
                // Auto-fill the form!
                setCustomer(prev => ({
                    ...prev,
                    name: result.data.name,
                    email: result.data.email || "",
                    address: result.data.address || ""
                }));
                setFoundCustomerAlert(true); // Show the success banner
            }
        } catch (err) {
            console.error("Error looking up phone:", err);
        } finally {
            setIsCheckingPhone(false);
        }
    };
    const handleVehicleChange = (e) => setVehicle(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleMakeChange = async (e) => {
        const makeId = e.target.value;
        // Update the vehicle state directly
        setVehicle(prev => ({ ...prev, make_id: makeId, model_id: '', vehicleYear: '', fuel_type: '' }));
        
        setModels([]);
        setSelectedModelInfo(null);
        setYearOptions([]);
        
        if (makeId) {
            try {
                const res = await api.get(`/meta/models/${makeId}`);
                if (!res.ok) throw new Error('Could not fetch models.');
                const data = await res.json();
                setModels(data.data);
            } catch (err) {
                setError(err.message);
            }
        }
    };

    const handleModelChange = (e) => {
        const modelId = e.target.value;
        const selectedModel = models.find(m => m.id.toString() === modelId);
        
        setVehicle(prev => ({ ...prev, model_id: modelId, vehicleYear: '', fuel_type: '' }));
        setSelectedModelInfo(selectedModel || null);

        // <<< NEW: Logic to populate year dropdown >>>
        if (selectedModel) {
            const start = selectedModel.start_year;
            const end = selectedModel.end_year || new Date().getFullYear();
            const years = [];
            for (let y = end; y >= start; y--) {
                years.push(y);
            }
            setYearOptions(years);
        } else {
            setYearOptions([]);
        }
    };

    const handleCancel = () => {
        if (window.history.length > 1) navigate(-1);
        else navigate('/dashboard');
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // 1. Validation
        if (!customer.name || !customer.phone || !vehicle.make_id || !vehicle.model_id || !vehicle.carNumber) {
            setError("Please fill in all required fields: Name, Phone, Vehicle Make, Model, and Number.");
            return;
        }
        
        setIsSubmitting(true);
        try {
            // FIX #1: Merge 'city' into 'address'
            const fullAddress = customer.city 
                ? `${customer.address ? customer.address + ', ' : ''}${customer.city}` 
                : customer.address;

            const customerPayload = { ...customer, address: fullAddress };

            // 1. POST the new customer
            const customerRes = await api.post('/customers', customerPayload);
            
            // 2. Parse the raw response!
            const customerResult = await customerRes.json();

            // 3. 👉 THE SHIELD: Catch the 409 Conflict immediately!
            if (!customerRes.ok || customerResult.success === false) {
                throw new Error(customerResult.message || 'Error creating customer. Check if phone number already exists.');
            }

            // 4. Safe to extract the ID now
            const createdCustomer = customerResult.data;

            // --- 5. Save Vehicle ---
            const vehiclePayload = {
                customer_id: createdCustomer.id, 
                make_id: vehicle.make_id,
                model_id: vehicle.model_id,
                car_number: vehicle.carNumber,
                year: vehicle.vehicleYear || null,
                vin: vehicle.vehicleVin || null,
                fuel_type: vehicle.fuel_type || null
            };
            
            const vehicleRes = await api.post('/vehicles', vehiclePayload);
            const vehicleResult = await vehicleRes.json();

            // 👉 THE FRONTEND ROLLBACK: If vehicle creation fails, delete the orphaned customer!
            if (!vehicleRes.ok || vehicleResult.success === false) {
                 // Silently delete the customer we just created
                 await api.delete(`/customers/${createdCustomer.id}`);
                 
                 // Now throw the error to the screen
                 throw new Error(vehicleResult.message || 'Error creating vehicle. Customer creation rolled back.');
            }

            const createdVehicle = vehicleResult.data;

            // --- 6. Create Job Sheet (if applicable) ---
            if (carNumberFromState) {
                const jobSheetPayload = {
                    vehicle_id: createdVehicle.id,
                    customer_id: createdCustomer.id,
                    notes: keyProblemsFromState || 'New vehicle check-in.'
                };
                
                // 👉 THE FIX: Use the exact URL your Dashboard uses!
                const jobRes = await api.post('/jobsheets/check-in', jobSheetPayload, {
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
                });
                
                const jobResult = await jobRes.json();
                
                if (!jobRes.ok || jobResult.success === false) {
                     throw new Error(jobResult.message || 'Error creating check-in ticket.');
                }
            }

            // --- 7. Success Navigation ---
            if (carNumberFromState) {
                // This state refresh tells Dashboard.jsx's useEffect to instantly re-fetch the columns!
                navigate('/dashboard', { state: { refresh: true } }); 
            } else {
                alert('Customer and vehicle added successfully!');
                navigate('/customers-vehicles', { state: { refresh: true } }); 
            }

        } catch (err) {
            console.error("Add Customer Error:", err);
            // This will now gracefully show the red error text on your form 
            // instead of a white screen of death!
            setError(err.message || 'An unknown error occurred while saving.');
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <Container fluid className="py-4 px-md-4">
            <Row className="justify-content-center">
                <Col md={9} lg={8} xl={7}>
                    <Card className="shadow-lg border-0 rounded-lg">
                        <Card.Header className="bg-primary text-white text-center py-3">
                            <h3 className="mb-0"><FaUserPlus className="me-2" /> Add New Customer & Vehicle</h3>
                        </Card.Header>
                        <Card.Body className="p-4 p-md-5">
                            {carNumberFromState && (
                                <Alert variant="info" className="d-flex align-items-center">
                                    <FaCar className="me-2 flex-shrink-0" size="1.5em"/>
                                    <span>Vehicle with number <strong>{carNumberFromState}</strong> was not found. Please add details.</span>
                                </Alert>
                            )}
                            {error && <Alert variant="danger">{error}</Alert>}
                            
                            {/* 👉 SUCCESS BANNER */}
                            {foundCustomerAlert && (
                                <Alert variant="success" className="d-flex align-items-center py-2" dismissible onClose={() => setFoundCustomerAlert(false)}>
                                    <FaUser className="me-2" />
                                    <div><strong>Existing Customer Found!</strong> Details have been pre-filled.</div>
                                </Alert>
                            )}

                            <Form noValidate onSubmit={handleSubmit}>
                                {/* --- CUSTOMER INFO --- */}
                                <h5 className="text-secondary mb-3 border-bottom pb-2"><FaUser className="me-2"/>Customer Information</h5>
                                <Row className="mb-3">
                                    <Form.Group as={Col} md={6} controlId="formCustomerName">
                                        <Form.Label>Customer Name <span className="text-danger">*</span></Form.Label>
                                        <Form.Control type="text" name="name" required value={customer.name} onChange={handleCustomerChange} placeholder="Enter full name" disabled={isSubmitting}/>
                                    </Form.Group>
                                    <Form.Group as={Col} md={6} controlId="formCustomerPhone">
                                        <Form.Label>Phone Number <span className="text-danger">*</span></Form.Label>
                                        <InputGroup>
                                            <Form.Control type="tel" name="phone" required value={customer.phone} onChange={handleCustomerChange} onBlur={handlePhoneBlur} placeholder="Enter 10-digit number" disabled={isSubmitting}/>
                                            {isCheckingPhone && <InputGroup.Text><Spinner animation="border" size="sm" /></InputGroup.Text>}
                                        </InputGroup>
                                    </Form.Group>
                                </Row>
                                <Row className="mb-4">
                                    <Form.Group as={Col} md={6} controlId="formCustomerEmail">
                                        <Form.Label><FaEnvelope className="me-1 text-muted"/>Email</Form.Label>
                                        <Form.Control type="email" name="email" value={customer.email} onChange={handleCustomerChange} placeholder="Email (optional)" disabled={isSubmitting}/>
                                    </Form.Group>
                                    <Form.Group as={Col} md={6} controlId="formCustomerCity">
                                        <Form.Label><FaCity className="me-1 text-muted"/>City</Form.Label>
                                        <Form.Control type="text" name="city" value={customer.city} onChange={handleCustomerChange} placeholder="City (optional)" disabled={isSubmitting}/>
                                    </Form.Group>
                                    <Form.Group as={Col} xs={12} className="mt-3" controlId="formCustomerAddress">
                                        <Form.Label><FaMapMarkerAlt className="me-1 text-muted"/>Address</Form.Label>
                                        <Form.Control as="textarea" rows={2} name="address" value={customer.address} onChange={handleCustomerChange} placeholder="Full address (optional)" disabled={isSubmitting}/>
                                    </Form.Group>
                                </Row>

                                {/* --- VEHICLE INFO --- */}
                                <h5 className="text-secondary mb-3 border-bottom pb-2"><FaCar className="me-2"/>Vehicle Information</h5>
                                <Row className="mb-3">
                                    <Form.Group as={Col} md={6} controlId="formVehicleNumber">
                                        <Form.Label>Vehicle Number <span className="text-danger">*</span></Form.Label>
                                        <Form.Control type="text" name="carNumber" required value={vehicle.carNumber} onChange={handleVehicleChange} readOnly={!isCarNumberEditable} disabled={isSubmitting} className={!isCarNumberEditable ? "fw-bold bg-light" : ""} />
                                    </Form.Group>
                                    <Form.Group as={Col} md={6} controlId="formVehicleMake">
                                        <Form.Label>Vehicle Make <span className="text-danger">*</span></Form.Label>
                                        <Form.Select name="make_id" required value={vehicle.make_id} onChange={handleMakeChange} disabled={isSubmitting}>
                                            <option value="">-- Select Make --</option>
                                            {makes.map(make => <option key={make.id} value={make.id}>{make.name}</option>)}
                                        </Form.Select>
                                    </Form.Group>
                                </Row>
                                <Row className="mb-4">
                                    <Form.Group as={Col} md={6} controlId="formVehicleModel">
                                        <Form.Label>Vehicle Model <span className="text-danger">*</span></Form.Label>
                                        <Form.Select name="model_id" required value={vehicle.model_id} onChange={handleModelChange} disabled={!vehicle.make_id || isSubmitting}>
                                            <option value="">-- Select Model --</option>
                                            {models.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group as={Col} md={6} controlId="formVehicleYear">
                                        <Form.Label>Manufacturing Year</Form.Label>
                                        <Form.Select name="vehicleYear" value={vehicle.vehicleYear} onChange={handleVehicleChange} disabled={!vehicle.model_id || isSubmitting}>
                                            <option value="">-- Select Year --</option>
                                            {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group as={Col} md={6} className="mt-3" controlId="formFuelType">
                                        <Form.Label>Fuel Type</Form.Label>
                                        <Form.Select name="fuel_type" value={vehicle.fuel_type} onChange={handleVehicleChange} disabled={!vehicle.model_id || isSubmitting}>
                                            <option value="">-- Select Fuel Type --</option>
                                            {selectedModelInfo?.available_fuel_types?.map(fuel => <option key={fuel} value={fuel}>{fuel}</option>)}
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group as={Col} md={6} className="mt-3" controlId="formVehicleVin">
                                        <Form.Label>VIN (Chassis Number)</Form.Label>
                                        <Form.Control type="text" name="vehicleVin" value={vehicle.vehicleVin} onChange={handleVehicleChange} placeholder="VIN (optional)" disabled={isSubmitting} maxLength={17}/>
                                    </Form.Group>
                                </Row>

                                <div className="d-flex justify-content-end align-items-center mt-4 pt-3 border-top">
                                     <Button variant="outline-secondary" type="button" onClick={handleCancel} className="me-2" disabled={isSubmitting}>Cancel</Button>
                                     <Button variant="primary" type="submit" disabled={isSubmitting}>
                                         {isSubmitting ? <><Spinner as="span" animation="border" size="sm" className="me-1"/> Saving...</> : <><FaSave className="me-1" /> {carNumberFromState ? 'Save & Check-in' : 'Save Customer & Vehicle'}</>}
                                     </Button>
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