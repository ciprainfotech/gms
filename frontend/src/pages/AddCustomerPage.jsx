import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Card, Form, Row, Col, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { FaUserPlus, FaUser, FaCar, FaSave, FaTimes, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCity, FaEdit } from 'react-icons/fa';
import api from '../api/api.js';
import { validatePhone, validateVehicleNumber, validateEmail, sanitizeString } from '../utils/validators.js';
import { useGlobalDate } from '../contexts/GlobalDateContext';


const AddCustomerPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { workingDate } = useGlobalDate(); // Master working date for backdated check-ins

    // --- Detect Modes from Navigation State ---
    const vehicleData = location.state?.vehicleData || null;
    const isEditMode = !!vehicleData; 
    
    // Data from check-in flow (if applicable)
    const carNumberFromState = location.state?.carNumber || '';
    const keyProblemsFromState = location.state?.keyProblems || '';
    const isCarNumberEditable = isEditMode || !carNumberFromState; // Always editable in Edit Mode

    // --- Structured State for Forms ---
    const [customer, setCustomer] = useState({ 
        id: "", // Needed for tracking existing vs new customers
        name: "", 
        phone: "", 
        email: "", 
        city: "", 
        address: "" 
    });
    
    const [vehicle, setVehicle] = useState({
        id: vehicleData?.id || "",
        carNumber: vehicleData?.carNumber || carNumberFromState || "",
        make_id: vehicleData?.make_id || vehicleData?.makeId || "", // Handle potential camelCase differences
        model_id: vehicleData?.model_id || vehicleData?.modelId || "",
        vehicleYear: vehicleData?.year || "",
        vehicleVin: vehicleData?.vin || "",
        fuel_type: vehicleData?.fuelType || vehicleData?.fuel_type || "",
        color: vehicleData?.color || ""
    });
    
    // Dropdown data and selected model info
    const [makes, setMakes] = useState([]);
    const [models, setModels] = useState([]);
    const [selectedModelInfo, setSelectedModelInfo] = useState(null);
    const [yearOptions, setYearOptions] = useState([]);
    
    // Additional vehicle metadata
    const [masterColors, setMasterColors] = useState(['White', 'Black', 'Silver', 'Grey', 'Red', 'Blue', 'Brown', 'Green', 'Yellow', 'Orange']);
    const [masterFuelTypes, setMasterFuelTypes] = useState(['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid']);

    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isCheckingPhone, setIsCheckingPhone] = useState(false);
    const [foundCustomerAlert, setFoundCustomerAlert] = useState(false);

    // --- 1. Fetch Makes on Load ---
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

    // --- 2. Prefill Customer Data if in Edit Mode ---
    useEffect(() => {
        if (isEditMode && vehicleData.customerId) {
            const fetchExistingCustomer = async () => {
                try {
                    // Fetch the customer details to prefill the form
                    const res = await api.get(`/customers/${vehicleData.customerId}`);
                    const json = await res.json();
                    
                    if (res.ok && json.data) {
                        const c = json.data;
                        setCustomer({
                            id: c.id,
                            name: c.name,
                            phone: c.phone,
                            email: c.email || "",
                            city: "", // City is usually merged into address, leaving blank for user to add
                            address: c.address || ""
                        });
                    }
                } catch (err) {
                    console.error("Could not fetch customer data for edit:", err);
                }
            };
            fetchExistingCustomer();
        }
    }, [isEditMode, vehicleData]);

    // --- 3. Prefill Models & Years if Make is selected (crucial for Edit Mode) ---
    useEffect(() => {
        const fetchModels = async () => {
            if (vehicle.make_id) {
                try {
                    const res = await api.get(`/meta/models/${vehicle.make_id}`);
                    const data = await res.json();
                    setModels(data.data);

                    // If we already have a model selected (Edit Mode), setup the year dropdown
                    if (vehicle.model_id) {
                        const selectedModel = data.data.find(m => m.id.toString() === vehicle.model_id.toString());
                        setSelectedModelInfo(selectedModel || null);
                        if (selectedModel) {
                            const start = selectedModel.start_year;
                            const end = selectedModel.end_year || new Date().getFullYear();
                            const years = [];
                            for (let y = end; y >= start; y--) { years.push(y); }
                            setYearOptions(years);
                        }
                    }
                } catch (err) {
                    console.error("Could not fetch models:", err);
                }
            } else {
                setModels([]);
                setYearOptions([]);
            }
        };
        fetchModels();
    }, [vehicle.make_id, vehicle.model_id]);

    // --- Event Handlers ---
    const handleCustomerChange = (e) => setCustomer({ ...customer, [e.target.name]: e.target.value });
    
    const handlePhoneBlur = async () => {
        const phoneValidation = validatePhone(customer.phone, false);
        if (!phoneValidation.isValid || !phoneValidation.cleanPhone) return;
        
        setIsCheckingPhone(true);
        setFoundCustomerAlert(false);
        try {
            const res = await api.get(`/customers/check-phone/${phoneValidation.cleanPhone}`);
            const result = await res.json();
            
            if (result.exists) {
                setCustomer(prev => ({
                    ...prev,
                    id: result.data.id, // Save ID so we Update instead of Create
                    name: result.data.name,
                    phone: phoneValidation.cleanPhone,
                    email: result.data.email || "",
                    address: result.data.address || ""
                }));
                setFoundCustomerAlert(true);
            } else {
                // If phone doesn't exist, clear the ID so it creates a new customer
                setCustomer(prev => ({ ...prev, id: "", phone: phoneValidation.cleanPhone }));
            }
        } catch (err) {
            console.error("Error looking up phone:", err);
        } finally {
            setIsCheckingPhone(false);
        }
    };

    const handleVehicleChange = (e) => setVehicle(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleMakeChange = (e) => {
        const makeId = e.target.value;
        setVehicle(prev => ({ ...prev, make_id: makeId, model_id: '', vehicleYear: '', fuel_type: '' }));
    };

    const handleModelChange = (e) => {
        const modelId = e.target.value;
        const selectedModel = models.find(m => m.id.toString() === modelId);
        
        setVehicle(prev => ({ ...prev, model_id: modelId, vehicleYear: '', fuel_type: '' }));
        setSelectedModelInfo(selectedModel || null);

        if (selectedModel) {
            const start = selectedModel.start_year;
            const end = selectedModel.end_year || new Date().getFullYear();
            const years = [];
            for (let y = end; y >= start; y--) { years.push(y); }
            setYearOptions(years);
        } else {
            setYearOptions([]);
        }
    };

    const handleCancel = () => {
        if (window.history.length > 1) navigate(-1);
        else navigate('/customers-vehicles');
    };
    
    // --- Submission Logic with Strict Pre-API Validation ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 1. Mandatory Field Checks
        if (!customer.name.trim()) {
            setError("Customer name is required.");
            return;
        }

        // 2. Phone Validation (Strict 10-digit Indian Mobile)
        const phoneValidation = validatePhone(customer.phone, true);
        if (!phoneValidation.isValid) {
            setError(phoneValidation.error);
            return;
        }

        // 3. Email Validation (if provided)
        if (customer.email && customer.email.trim()) {
            const emailValidation = validateEmail(customer.email, false);
            if (!emailValidation.isValid) {
                setError(emailValidation.error);
                return;
            }
        }

        // 4. Vehicle Number Validation
        const vehicleValidation = validateVehicleNumber(vehicle.carNumber, true);
        if (!vehicleValidation.isValid) {
            setError(vehicleValidation.error);
            return;
        }

        // 5. Vehicle Make & Model
        if (!vehicle.make_id) {
            setError("Please select a vehicle make.");
            return;
        }
        if (!vehicle.model_id) {
            setError("Please select a vehicle model.");
            return;
        }
        
        setIsSubmitting(true);
        try {
            const fullAddress = customer.city 
                ? `${customer.address ? customer.address + ', ' : ''}${customer.city}` 
                : customer.address;

            const customerPayload = { 
                name: sanitizeString(customer.name), 
                phone: phoneValidation.cleanPhone, 
                email: sanitizeString(customer.email) || null, 
                address: sanitizeString(fullAddress) || null 
            };
            let finalCustomerId = customer.id; // May be filled from Edit Mode OR Phone Lookup

            // 1. Handle Customer (Update if exists, Create if new)
            if (finalCustomerId) {
                const custRes = await api.put(`/customers/${finalCustomerId}`, customerPayload);
                if (!custRes.ok) throw new Error("Failed to update existing customer details.");
            } else {
                const customerRes = await api.post('/customers', customerPayload);
                const customerResult = await customerRes.json();
                if (!customerRes.ok || customerResult.success === false) {
                    throw new Error(customerResult.message || 'Error creating customer. Check if phone number already exists.');
                }
                finalCustomerId = customerResult.data.id;
            }

            // 2. Handle Vehicle Payload
            const vehiclePayload = {
                customer_id: finalCustomerId, 
                make_id: vehicle.make_id,
                model_id: vehicle.model_id,
                car_number: vehicleValidation.formatted,
                year: vehicle.vehicleYear ? parseInt(vehicle.vehicleYear) : null,
                vin: sanitizeString(vehicle.vehicleVin) || null,
                fuel_type: vehicle.fuel_type || null,
                color: vehicle.color || null
            };
            
            let finalVehicleId = vehicle.id;

            // 3. Save Vehicle (Update if Edit Mode, Create if Add Mode)
            if (isEditMode) {
                const vehicleRes = await api.put(`/vehicles/${vehicle.id}`, vehiclePayload);
                if (!vehicleRes.ok) throw new Error("Failed to update vehicle details.");
            } else {
                const vehicleRes = await api.post('/vehicles', vehiclePayload);
                const vehicleResult = await vehicleRes.json();
                if (!vehicleRes.ok || vehicleResult.success === false) {
                    // Rollback customer if new
                    if (!customer.id) await api.delete(`/customers/${finalCustomerId}`);
                    throw new Error(vehicleResult.message || 'Error creating vehicle.');
                }
                finalVehicleId = vehicleResult.data.id;
            }

            // 4. Create Job Sheet (Only if we came from the Check-In modal)
            if (!isEditMode && carNumberFromState) {
                const jobSheetPayload = {
                    vehicle_id: finalVehicleId,
                    customer_id: finalCustomerId,
                    notes: keyProblemsFromState || 'New vehicle check-in.',
                    dateCreated: workingDate  // Use master working date — fixes backdated check-in bug
                };
                
                const jobRes = await api.post('/jobsheets/check-in', jobSheetPayload, {
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
                });
                if (!jobRes.ok) throw new Error('Error creating check-in ticket.');
            }


            // 5. Success Navigation
            if (carNumberFromState && !isEditMode) {
                navigate('/dashboard', { state: { refresh: true } }); 
            } else {
                navigate('/customers-vehicles', { state: { refresh: true } }); 
            }

        } catch (err) {
            console.error("Save Error:", err);
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
                            <h3 className="mb-0">
                                {isEditMode ? <FaEdit className="me-2" /> : <FaUserPlus className="me-2" />} 
                                {isEditMode ? 'Modify Customer & Vehicle' : 'Add New Customer & Vehicle'}
                            </h3>
                        </Card.Header>
                        <Card.Body className="p-4 p-md-5">
                            {carNumberFromState && !isEditMode && (
                                <Alert variant="info" className="d-flex align-items-center">
                                    <FaCar className="me-2 flex-shrink-0" size="1.5em"/>
                                    <span>Vehicle with number <strong>{carNumberFromState}</strong> was not found. Please add details.</span>
                                </Alert>
                            )}
                            {error && <Alert variant="danger">{error}</Alert>}
                            
                            {foundCustomerAlert && !isEditMode && (
                                <Alert variant="success" className="d-flex align-items-center py-2" dismissible onClose={() => setFoundCustomerAlert(false)}>
                                    <FaUser className="me-2" />
                                    <div><strong>Existing Customer Found!</strong> Details have been pre-filled. Saving will assign the vehicle to them.</div>
                                </Alert>
                            )}

                            <Form noValidate onSubmit={handleSubmit}>
                                {/* --- CUSTOMER INFO --- */}
                                <h5 className="text-secondary mb-3 border-bottom pb-2"><FaUser className="me-2"/>Customer (Owner) Information</h5>
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
                                    
                                    {/* Additional Metadata Fields */}
                                    <Form.Group as={Col} md={4} className="mt-3" controlId="formFuelType">
                                        <Form.Label>Fuel Type</Form.Label>
                                        <Form.Select name="fuel_type" value={vehicle.fuel_type} onChange={handleVehicleChange} disabled={isSubmitting}>
                                            <option value="">-- Select Fuel Type --</option>
                                            {masterFuelTypes.map(fuel => <option key={fuel} value={fuel}>{fuel}</option>)}
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group as={Col} md={4} className="mt-3" controlId="formColor">
                                        <Form.Label>Color</Form.Label>
                                        <Form.Select name="color" value={vehicle.color} onChange={handleVehicleChange} disabled={isSubmitting}>
                                            <option value="">-- Select Color --</option>
                                            {masterColors.map(c => <option key={c} value={c}>{c}</option>)}
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group as={Col} md={4} className="mt-3" controlId="formVehicleVin">
                                        <Form.Label>VIN (Chassis Number)</Form.Label>
                                        <Form.Control type="text" name="vehicleVin" value={vehicle.vehicleVin} onChange={handleVehicleChange} placeholder="VIN (optional)" disabled={isSubmitting} maxLength={17}/>
                                    </Form.Group>
                                </Row>

                                <div className="d-flex justify-content-end align-items-center mt-4 pt-3 border-top">
                                     <Button variant="outline-secondary" type="button" onClick={handleCancel} className="me-2" disabled={isSubmitting}>Cancel</Button>
                                     <Button variant="primary" type="submit" disabled={isSubmitting}>
                                         {isSubmitting ? <><Spinner as="span" animation="border" size="sm" className="me-1"/> Saving...</> : <><FaSave className="me-1" /> {isEditMode ? 'Save Changes' : (carNumberFromState ? 'Save & Check-in' : 'Save Customer & Vehicle')}</>}
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