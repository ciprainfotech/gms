import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom'; // Assuming you use React Router for Add Customer link
import { Container, Row, Col, Card, Button, InputGroup, Form, Modal, Alert, Tooltip, OverlayTrigger, Badge, Image, Dropdown, Spinner } from 'react-bootstrap';
import {
    FaUserPlus, FaSearch, FaCar, FaPlus, FaEdit, FaTrashAlt, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaIdCardAlt, FaInfoCircle, FaEllipsisV, FaHistory, FaWrench, FaCarSide, FaUserCircle, FaTimes, FaBuilding, FaCity, FaClipboardList, FaUsers, FaGasPump, FaPalette, FaPlug // Added more icons
} from 'react-icons/fa';
import api from '../api/api.js';
import {
    getCustomers, getVehicles, findCustomerById, findVehiclesByCustomerId,
    addVehicle, updateCustomer, updateVehicle, deleteCustomerById, deleteVehicleById,
    getCarMakes, getCarModelsByMake, getVehicleColors, getFuelTypes // Import new getters
} from '../data/staticData'; // Ensure this path is correct
import '../App.css'; // Your main CSS with variables like --primary-color, --app-bg, etc.
import '../CustomersVehiclesPage.css'; // <-- Specific CSS file

// --- Logo & Color Helpers ---
const getVehicleLogo = (make) => {
    const makeLower = make?.toLowerCase() || '';
    if (makeLower.includes('honda')) return 'https://cdn.simpleicons.org/honda/000000';
    if (makeLower.includes('maruti') || makeLower.includes('suzuki')) return 'https://cdn.simpleicons.org/suzuki/E4002B';
    if (makeLower.includes('toyota')) return 'https://cdn.simpleicons.org/toyota/EB0A1E';
    if (makeLower.includes('hyundai')) return 'https://cdn.simpleicons.org/hyundai/002C5F';
    if (makeLower.includes('tata')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Tata_Motors_Logo.svg/64px-Tata_Motors_Logo.svg.png';
    if (makeLower.includes('mahindra')) return 'https://cdn.simpleicons.org/mahindra/EC1C24';
    // Add more brands...
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(make || 'Car')}&background=e5e7eb&color=4b5563&bold=true&size=64`;
};

const getVehicleBrandColor = (make) => {
    const makeLower = make?.toLowerCase() || '';
    if (makeLower.includes('honda')) return '#E4002B';
    if (makeLower.includes('maruti') || makeLower.includes('suzuki')) return '#2A6DBE';
    if (makeLower.includes('toyota')) return '#EB0A1E';
    if (makeLower.includes('hyundai')) return '#002C5F';
    if (makeLower.includes('tata')) return '#0079C1';
    if (makeLower.includes('mahindra')) return '#EC1C24';
    // Add more brands...
    return '#6c757d';
};


const CustomersVehiclesPage = () => {
    // --- State ---
    const [allCustomers, setAllCustomers] = useState([]);
    const [allVehicles, setAllVehicles] = useState([]);
    const [masterMakes, setMasterMakes] = useState([]);
    const [masterColors, setMasterColors] = useState([]);
    const [masterFuelTypes, setMasterFuelTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedCustomerVehicles, setSelectedCustomerVehicles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const customerListRef = useRef(null);

    // Modal & Form States
    const [modalState, setModalState] = useState({ type: null, data: null, show: false });
    // Notification Modal State
    const [notification, setNotification] = useState({
        show: false,
        title: '',
        message: '',
        type: 'alert', // can be 'alert' or 'confirm'
        onConfirm: null
    });

    // Helper to easily trigger notifications
    const triggerNotification = (title, message, type = 'alert', onConfirm = null) => {
        setNotification({ show: true, title, message, type, onConfirm });
    };

    const closeNotification = () => {
        setNotification(prev => ({ ...prev, show: false }));
    };

    const [formData, setFormData] = useState({});
    const [availableModels, setAvailableModels] = useState([]);
    const [formError, setFormError] = useState('');



    // --- Memoized Filtering ---
    const filteredCustomers = useMemo(() => {
        if (isLoading) return [];
        if (!searchTerm.trim()) return allCustomers;
        const lowerSearchTerm = searchTerm.toLowerCase();
        const customerIdsFromVehicleMatch = new Set(allVehicles.filter(v => v.carNumber.toLowerCase().includes(lowerSearchTerm)).map(v => v.customerId));
        return allCustomers.filter(c =>
            c.name.toLowerCase().includes(lowerSearchTerm) ||
            c.phone.includes(searchTerm) || // Keep exact search for phone
            (c.email && c.email.toLowerCase().includes(lowerSearchTerm)) ||
            customerIdsFromVehicleMatch.has(c.id)
        );
    }, [searchTerm, allCustomers, allVehicles, isLoading]);

    // --- Effects ---
    // Update vehicles list when selected customer or main vehicle list changes
    useEffect(() => {
        if (selectedCustomer) {
            const vehicles = allVehicles.filter(v => v.customerId === selectedCustomer.id);
            setSelectedCustomerVehicles(vehicles);
        } else {
            setSelectedCustomerVehicles([]);
        }
    }, [selectedCustomer, allVehicles]);

    // Deselect customer if they are removed from the main list
    useEffect(() => {
        if (selectedCustomer && !allCustomers.some(c => c.id === selectedCustomer.id)) {
            setSelectedCustomer(null);
        }
    }, [allCustomers, selectedCustomer]);

    // --- Initial Live Data Loading ---
    useEffect(() => {
        const fetchLiveData = async () => {
            setIsLoading(true);
           try {
                // 1. Get the raw responses (NOW INCLUDING LIVE MAKES!)
                const customerRes = await api.get('/customers');
                const vehicleRes = await api.get('/vehicles');
                const makesRes = await api.get('/meta/makes'); 
                
                // 2. Extract the JSON from the raw responses
                const customerData = await customerRes.json();
                const vehicleData = await vehicleRes.json();
                const makesData = await makesRes.json();

                // 3. 👉 THE SHIELD: Catch any loading errors early
                if (!customerRes.ok || !vehicleRes.ok || !makesRes.ok) {
                     throw new Error("Failed to load some dashboard data.");
                }

                // 4. Set the state using the parsed database data!
                setAllCustomers(customerData.data || []);
                setAllVehicles(vehicleData.data || []);
                
                // 👉 THIS FIXES THE CRASH: Save live makes (with number IDs) to state
                setMasterMakes(makesData.data || []); 

                // It is perfectly fine to leave Colors and Fuel static if you don't 
                // have database tables for them yet!
                setMasterColors(getVehicleColors());
                setMasterFuelTypes(getFuelTypes());
            } catch (error) {
                console.error("Error loading live data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLiveData();
    }, []);

     // Update available models when make changes in the form
     // Update available models when make changes in the form
     useEffect(() => {
        const fetchLiveModels = async () => {
            if (formData.make && modalState.type?.includes('Vehicle')) {
                // Find the numeric ID of the Make the user just selected
                const selectedMake = masterMakes.find(m => m.name === formData.make);
                
                if (selectedMake) {
                    try {
                        const res = await api.get(`/meta/models/${selectedMake.id}`);
                        const json = await res.json();
                        // Save the full model objects (which include their numeric IDs!)
                        setAvailableModels(json.data || []); 
                    } catch (err) {
                        console.error("Error fetching models:", err);
                    }
                }
            } else {
                setAvailableModels([]);
            }
        };

        fetchLiveModels();
    }, [formData.make, modalState.type, masterMakes]);


    // --- Event Handlers ---
    const handleSelectCustomer = useCallback((customer) => {
        if (selectedCustomer?.id !== customer.id) {
            setSelectedCustomer(customer);
            const detailPanel = document.querySelector('.cv-detail-panel');
            if (detailPanel) detailPanel.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [selectedCustomer]); // Depend on selectedCustomer to avoid re-selecting

    const clearSearch = () => setSearchTerm('');

    // --- Modal Management ---
    // --- Modal Management ---
    const showModal = (type, data = null) => {
        setFormError('');
        let initialFormData = {};
        
        if (type === 'addVehicle') {
            initialFormData = { carNumber: '', make: '', model: '', year: '', vin: '', color: '', fuelType: '', customerId: selectedCustomer?.id };
            setAvailableModels([]); // Clear it for new vehicles
        } else if (type === 'editVehicle' && data) {
            initialFormData = { ...data, year: data.year ?? '', color: data.color ?? '', fuelType: data.fuelType ?? '' };
            // 👉 THE FIX: We removed the staticData function here! 
            // We temporarily clear it, and let our useEffect fetch the live objects!
            setAvailableModels([]); 
        } else if (type === 'editCustomer' && data) {
            initialFormData = { ...data, email: data.email ?? '', address: data.address ?? '', city: data.city ?? '' };
        }
        
        setFormData(initialFormData);
        setModalState({ type, data, show: true });
    };

    const closeModal = () => {
        setModalState({ type: null, data: null, show: false });
        setFormData({}); // Clear form data on close
        setAvailableModels([]); // Clear dynamic models
        setFormError(''); // Clear errors
    };

    // --- Form Input Handler ---
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };


    // --- CRUD Operations ---
    const handleAddVehicleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.carNumber || !formData.make || !formData.model) { setFormError("Reg No, Make, and Model are required."); return; }
        if (formData.year && (isNaN(parseInt(formData.year)) || formData.year.toString().length !== 4)) { setFormError("Valid 4-digit year required."); return; }
        setFormError('');

        // Map text fields to the numeric IDs your backend requires
       // Match the payload to what your backend expects
        // Match the payload to what your backend expects
        const vehiclePayload = {
            // Find the ID from the dropdown, OR keep the existing one from the DB
            make_id: masterMakes.find(m => m.name === formData.make)?.id || formData.make_id, 
            
            // 👉 THE FIX: Find the model ID from the dropdown, OR keep the existing one. No more '|| 1' !!
            model_id: availableModels.find(m => m.name === formData.model)?.id || formData.model_id, 
            
            car_number: formData.carNumber,
            year: parseInt(formData.year) || null,
            vin: formData.vin || null,
            fuel_type: formData.fuelType || null,
            color: formData.color || null
        };

        try {
            const response = await api.post('/vehicles', vehiclePayload);
            const result = await response.json();

            if (!response.ok || result.success === false) {
                throw new Error(result.message || "Error adding vehicle to the server.");
            }

            // Map it back to CamelCase for your React UI
            const addedVehicle = {
                ...result.data,
                customerId: result.data.customer_id,
                carNumber: result.data.car_number,
                fuelType: result.data.fuel_type,
                make: formData.make,
                model: formData.model
            };

            setAllVehicles(prev => [addedVehicle, ...prev]); 
            closeModal();
            triggerNotification('Success', `Vehicle "${addedVehicle.carNumber}" added successfully.`, 'alert');
        } catch (err) {
            console.error("Add Vehicle Error:", err);
            setFormError(err.message || "Error adding vehicle.");
        }
    };

  const handleUpdateVehicleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.carNumber || !formData.make || !formData.model) { setFormError("Reg No, Make, and Model are required."); return; }
        if (formData.year && (isNaN(parseInt(formData.year)) || formData.year.toString().length !== 4)) { setFormError("Valid 4-digit year required."); return; }
        setFormError('');
        
        // 🛡️ THE BULLETPROOF PAYLOAD
        const vehiclePayload = {
            // Find dropdown ID, OR fallback to the exact ID the car came with
            make_id: masterMakes.find(m => m.name === formData.make)?.id || modalState.data.make_id, 
            
            // Find dropdown ID, OR fallback to exact ID. (NO MORE "|| 1" DEFAULT!)
            model_id: availableModels.find(m => m.name === formData.model)?.id || modalState.data.model_id, 
            
            car_number: formData.carNumber,
            year: parseInt(formData.year) || null,
            vin: formData.vin || null,
            fuel_type: formData.fuelType || null,
            color: formData.color || null
        };
        
        
        try {
            const response = await api.put(`/vehicles/${modalState.data.id}`, vehiclePayload);
            const result = await response.json();
            
            if (!response.ok || result.success === false) {
                throw new Error(result.message || "Error updating vehicle on the server.");
            }
            
            const updatedVehicle = {
                ...result.data,
                customerId: result.data.customer_id,
                carNumber: result.data.car_number,
                fuelType: result.data.fuel_type,
                color: result.data.color || formData.color, 
                make: formData.make, 
                model: formData.model 
            };
            
            setAllVehicles(prev => prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
            closeModal();
            triggerNotification('Success', `Vehicle "${updatedVehicle.carNumber}" updated successfully.`, 'alert');
        } catch (err) {
            console.error("Update Vehicle Error:", err);
            setFormError(err.message || "Error updating vehicle.");
        }
    };

     const handleUpdateCustomerSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.phone) { setFormError("Name and Phone are required."); return; }
        setFormError('');
        
        try {
            // 👉 THE FIX: Combine City into the Address string, because 
            // the database only has an 'address' column!
            let combinedAddress = formData.address || '';
            if (formData.city) {
                combinedAddress = combinedAddress ? `${combinedAddress}, ${formData.city}` : formData.city;
            }

            // Create the payload exactly how the backend expects it
            const payloadToSave = {
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                address: combinedAddress
            };

            // 1. Send the PUT request with the combined payload
            const response = await api.put(`/customers/${modalState.data.id}`, payloadToSave);
            
            // 2. Parse the raw HTTP response
            const result = await response.json();
            
            if (!response.ok || result.success === false) {
                throw new Error(result.message || "Error updating customer.");
            }
            
            const updatedCustomer = result.data;
            
            // 3. Update the UI state
            setAllCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
            if (selectedCustomer?.id === updatedCustomer.id) {
                setSelectedCustomer(updatedCustomer);
            }
            
            // 4. Close modal and show notification
            closeModal();
            triggerNotification('Success', `Customer "${updatedCustomer.name}" updated successfully.`, 'alert');
            
        } catch (err) {
            console.error("Update Error:", err);
            setFormError(err.message || "An unknown error occurred.");
        }
    };

    // --- 1. The Ask (Opens the Confirm Modal) ---
    const handleDeleteCustomerClick = (customerId, customerName) => {
        triggerNotification(
            'Confirm Deletion',
            `Are you sure you want to delete customer "${customerName}" and ALL their associated vehicles? This action cannot be undone.`,
            'confirm',
            () => executeDeleteCustomer(customerId, customerName) // Pass the execution function
        );
    };

    // --- 2. The Execution (Runs when they click 'Yes' in the modal) ---
    const executeDeleteCustomer = async (customerId, customerName) => {
        closeNotification(); // Hide the confirm modal
        try {
            await api.delete(`/customers/${customerId}`);
            
            setAllCustomers(prev => prev.filter(c => c.id !== customerId));
            setAllVehicles(prev => prev.filter(v => v.customerId !== customerId));
            if (selectedCustomer?.id === customerId) setSelectedCustomer(null);
            
            // Show Success Alert Modal!
            triggerNotification('Success', `Customer "${customerName}" was deleted successfully.`, 'alert');
        } catch (err) {
            triggerNotification('Error', err.message || "Error deleting customer.", 'alert');
        }
    };

    // --- Same setup for Vehicles ---
    const handleDeleteVehicleClick = (vehicleId, vehicleRegNo) => {
        triggerNotification(
            'Confirm Deletion',
            `Are you sure you want to delete vehicle "${vehicleRegNo}"?`,
            'confirm',
            () => executeDeleteVehicle(vehicleId, vehicleRegNo)
        );
    };

    const executeDeleteVehicle = async (vehicleId, vehicleRegNo) => {
        closeNotification();
        try {
            await api.delete(`/vehicles/${vehicleId}`);
            
            // 👉 THE FIX: filter by v.id !== vehicleId
            setAllVehicles(prev => prev.filter(v => v.id !== vehicleId));
            
            triggerNotification('Success', `Vehicle "${vehicleRegNo}" was deleted successfully.`, 'alert');
        } catch (err) {
            triggerNotification('Error', err.message || "Error deleting vehicle.", 'alert');
        }
    };      


    // --- Render Helpers ---
    const renderCustomerListItem = (customer) => {
      const vehicleCount = allVehicles.filter(v => v.customerId === customer.id).length;
        const isActive = selectedCustomer?.id === customer.id;
        return (
            <div key={customer.id} data-customer-id={customer.id} className={`cv-customer-item ${isActive ? 'active' : ''}`} onClick={() => handleSelectCustomer(customer)}>
                <div className="cv-customer-item-avatar"><FaUserCircle /></div>
                <div className="cv-customer-item-info">
                    <div className="cv-customer-item-name">{customer.name}</div>
                    <div className="cv-customer-item-phone">{customer.phone}</div>
                </div>
                <div className="cv-customer-item-details">
                    <Badge pill className="cv-vehicle-count"><FaCarSide />{vehicleCount}</Badge>
                </div>
                <Dropdown className="cv-customer-item-actions" onClick={(e) => e.stopPropagation()}>
                    <Dropdown.Toggle variant="link" bsPrefix="p-0" className="action-toggle"><FaEllipsisV /></Dropdown.Toggle>
                    <Dropdown.Menu align="end">
                        <Dropdown.Item onClick={() => showModal('editCustomer', customer)}><FaEdit className="me-2"/> Edit</Dropdown.Item>
                        {/* Change handleDeleteCustomer to handleDeleteCustomerClick */}
<Dropdown.Item onClick={() => handleDeleteCustomerClick(customer.id, customer.name)} className="text-danger"><FaTrashAlt className="me-2"/> Delete</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        );
    };

    const renderVehicleCard = (vehicle) => {
         const logoSrc = getVehicleLogo(vehicle.make);
         const brandColor = getVehicleBrandColor(vehicle.make);
         const isHighlighted = searchTerm && vehicle.carNumber.toLowerCase().includes(searchTerm.toLowerCase());
         const getFuelIcon = (fuel) => { /* ... same as before ... */ };

         return (
             <Col key={vehicle.id} xs={12} md={6} xl={6} className="mb-4 vehicle-card-col">
                <Card className={`cv-vehicle-card h-100 ${isHighlighted ? 'highlighted' : ''}`}>
                    <div className="cv-vehicle-brand-accent" style={{ backgroundColor: brandColor }}></div>
                    <Card.Body>
                         <div className="cv-vehicle-header">
                            <div className="cv-vehicle-logo">
                                {logoSrc && <Image src={logoSrc} alt="" fluid onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex'; }} />}
                                <div className="cv-vehicle-fallback-icon" style={{ display: logoSrc ? 'none' : 'flex' }}><FaCarSide /></div>
                            </div>
                            <div className="cv-vehicle-main-info">
                               <Badge className="cv-reg-no">{vehicle.carNumber}</Badge>
                               <div className="cv-make-model">{vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}</div>
                            </div>
                             <Dropdown className="cv-vehicle-actions" onClick={(e) => e.stopPropagation()} align="end">
                                <Dropdown.Toggle variant="link" bsPrefix="p-0" className="action-toggle"><FaEllipsisV /></Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={() => showModal('editVehicle', vehicle)}><FaEdit className="me-2"/> Edit</Dropdown.Item>
                                    {/* Change handleDeleteVehicle to handleDeleteVehicleClick */}
<Dropdown.Item onClick={() => handleDeleteVehicleClick(vehicle.id, vehicle.carNumber)} className="text-danger"><FaTrashAlt className="me-2"/> Delete</Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item onClick={() => alert(`History: ${vehicle.carNumber}`)}><FaHistory className="me-2"/> History</Dropdown.Item>
                                    <Dropdown.Item onClick={() => alert(`New Job: ${vehicle.carNumber}`)}><FaWrench className="me-2"/> New Job</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                         </div>
                         <div className="cv-vehicle-footer-details">
                            {vehicle.color && (<span className="detail-item color-detail" title={`Color: ${vehicle.color}`}><span className="color-swatch" style={{ backgroundColor: vehicle.color.toLowerCase() === 'white' ? '#eee' : vehicle.color }}></span>{vehicle.color}</span>)}
                            {vehicle.fuelType && (<span className="detail-item fuel-detail" title={`Fuel: ${vehicle.fuelType}`}>{getFuelIcon(vehicle.fuelType)}{vehicle.fuelType}</span>)}
                            {vehicle.vin && (<span className="detail-item vin-detail" title={`VIN: ${vehicle.vin}`}>VIN: {vehicle.vin}</span>)}
                        </div>
                    </Card.Body>
                </Card>
             </Col>
         );
     };


    // --- Main Render ---
    return (
        <div className="cv-page-container">
            <div className="cv-layout">
                {/* --- Left Panel --- */}
                <div className="cv-list-panel shadow-sm">
                    <div className="cv-panel-header">
                        <h5 className="cv-panel-title"><FaUsers className="me-2" />Customers</h5>
                        <Link to="/add-customer">
                            <Button variant="outline-primary" size="sm" className="cv-add-customer-btn" title="Add New Customer">
                                <FaUserPlus />
                            </Button>
                        </Link>
                    </div>
                    <div className="cv-panel-search">
                         <InputGroup size="sm">
                            <InputGroup.Text><FaSearch /></InputGroup.Text>
                             <Form.Control placeholder="Search Customers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                             {searchTerm && <Button variant="light" onClick={clearSearch} size="sm" className="cv-clear-search-btn" title="Clear Search"><FaTimes /></Button>}
                         </InputGroup>
                    </div>
                    <div className="cv-panel-list custom-scrollbar" ref={customerListRef}>
                         {isLoading ? (
                             <div className="loading-state"><Spinner animation="border" size="sm" /> Loading...</div>
                         ) : filteredCustomers.length === 0 ? (
                             <div className="empty-list-message"><FaInfoCircle className="me-2" />{searchTerm ? 'No matches found.' : 'No customers yet.'}</div>
                         ) : (
                            filteredCustomers.map(renderCustomerListItem) // Use map directly
                         )}
                    </div>
                </div>

                {/* --- Right Panel --- */}
                <div className="cv-detail-panel custom-scrollbar">
                    {!selectedCustomer ? (
                         <div className="cv-welcome-panel">
                            <FaClipboardList className="welcome-icon" />
                            <h4>Customer Details</h4>
                            <p>Select a customer from the list to view their profile and vehicles.</p>
                         </div>
                    ) : (
                        <div className="cv-selected-details">
                            {/* Customer Profile */}
                            <Card className="mb-4 shadow-sm cv-profile-card">
                                <Card.Body>
                                    <div className="cv-profile-header">
                                        <div className="cv-profile-avatar"><FaUserCircle /></div>
                                        <div className="cv-profile-info">
                                            <h4 className="cv-profile-name">{selectedCustomer.name}</h4>
                                            <div className="cv-profile-contact">
                                                <span><FaPhoneAlt /> {selectedCustomer.phone}</span>
                                                <span className="ms-3"><FaEnvelope /> {selectedCustomer.email || 'N/A'}</span>
                                            </div>
                                           <div className="cv-profile-address mt-1">
                                            <FaMapMarkerAlt /> {
                                                // This clever array trick removes empty values and only adds a comma if BOTH exist!
                                                [selectedCustomer.address, selectedCustomer.city].filter(Boolean).join(', ') || 'N/A'
                                            }
                                        </div>
                                        </div>
                                        <div className="cv-profile-actions">
                                            <Button variant="outline-primary" size="sm" onClick={() => showModal('editCustomer', selectedCustomer)}><FaEdit /> Edit</Button>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* Vehicles Section */}
                            <div className="cv-vehicles-section">
                                <div className="cv-section-header">
                                    <h5 className="cv-section-title"><FaCarSide className="me-2" />Vehicles ({selectedCustomerVehicles.length})</h5>
                                    <Button variant="primary" size="sm" onClick={() => showModal('addVehicle')}><FaPlus className="me-1" /> Add Vehicle</Button>
                                </div>
                                {selectedCustomerVehicles.length === 0 ? (
                                    <Alert variant="light" className="text-center mt-3 border cv-no-vehicles-alert"><FaInfoCircle className="me-2" />No vehicles registered.</Alert>
                                ) : (
                                    <Row className="g-3 mt-1">{selectedCustomerVehicles.map(renderVehicleCard)}</Row>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- Modals --- */}
                 {/* Add/Edit Vehicle Modal */}
                 <Modal show={modalState.type === 'addVehicle' || modalState.type === 'editVehicle'} onHide={closeModal} centered size="lg">
                       <Modal.Header closeButton>
                           <Modal.Title>
                               {modalState.type === 'addVehicle' ? <><FaPlus className="me-2" />Add Vehicle for {selectedCustomer?.name}</> : <><FaEdit className="me-2" />Edit Vehicle {modalState.data?.carNumber}</>}
                            </Modal.Title>
                       </Modal.Header>
                       <Form onSubmit={modalState.type === 'addVehicle' ? handleAddVehicleSubmit : handleUpdateVehicleSubmit}>
                           <Modal.Body>
                               {formError && <Alert variant="danger" size="sm" onClose={() => setFormError('')} dismissible>{formError}</Alert>}
                               <Row>
                                  <Col md={6}><Form.Group className="mb-3"><Form.Label>Reg No*</Form.Label><Form.Control size="sm" type="text" name="carNumber" value={formData.carNumber || ''} onChange={handleFormChange} required placeholder="e.g., GJ01AB1234" /></Form.Group></Col>
                                  <Col md={6}><Form.Group className="mb-3"><Form.Label>VIN</Form.Label><Form.Control size="sm" type="text" name="vin" value={formData.vin || ''} onChange={handleFormChange} placeholder="Chassis No."/></Form.Group></Col>
                               </Row>
                               <Row>
                                   <Col md={6}><Form.Group className="mb-3"><Form.Label>Make*</Form.Label><Form.Select size="sm" name="make" value={formData.make || ''} onChange={handleFormChange} required><option value="">-- Select Make --</option>{masterMakes.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</Form.Select></Form.Group></Col>
                                   <Col md={6}><Form.Group className="mb-3"><Form.Label>Model*</Form.Label><Form.Select size="sm" name="model" value={formData.model || ''} onChange={handleFormChange} required disabled={!formData.make || availableModels.length === 0}><option value="">-- Select Model --</option>{availableModels.map(model => <option key={model.id} value={model.name}>{model.name}</option>)}</Form.Select></Form.Group></Col>
                               </Row>
                               <Row>
                                   <Col md={4}><Form.Group className="mb-3"><Form.Label>Year</Form.Label><Form.Control size="sm" type="number" name="year" value={formData.year || ''} onChange={handleFormChange} placeholder="YYYY" min="1980" max={new Date().getFullYear() + 1}/></Form.Group></Col>
                                    <Col md={4}><Form.Group className="mb-3"><Form.Label>Color</Form.Label><Form.Select size="sm" name="color" value={formData.color || ''} onChange={handleFormChange}><option value="">-- Select Color --</option>{masterColors.map((c, index) => <option key={index} value={c}>{c}</option>)}</Form.Select></Form.Group></Col>
                                    <Col md={4}><Form.Group className="mb-3"><Form.Label>Fuel Type</Form.Label><Form.Select size="sm" name="fuelType" value={formData.fuelType || ''} onChange={handleFormChange}><option value="">-- Select Fuel --</option>{masterFuelTypes.map((f, index) => <option key={index} value={f}>{f}</option>)}</Form.Select></Form.Group></Col>
                               </Row>
                               <small className="text-muted">* Required fields</small>
                           </Modal.Body>
                           <Modal.Footer>
                               <Button variant="outline-secondary" onClick={closeModal}>Cancel</Button>
                               <Button variant="primary" type="submit" className="px-4">
                                   {modalState.type === 'addVehicle' ? <><FaPlus className="me-1"/> Add</> : <><FaEdit className="me-1"/> Save</>}
                               </Button>
                             </Modal.Footer>
                       </Form>
                 </Modal>

                  {/* Edit Customer Modal */}
                 <Modal show={modalState.type === 'editCustomer'} onHide={closeModal} centered>
                      <Modal.Header closeButton><Modal.Title><FaEdit className="me-2" />Edit Customer</Modal.Title></Modal.Header>
                      <Form onSubmit={handleUpdateCustomerSubmit}>
                          <Modal.Body>
                               {formError && <Alert variant="danger" size="sm" onClose={() => setFormError('')} dismissible>{formError}</Alert>}
                               <Form.Group className="mb-3"><Form.Label>Name*</Form.Label><Form.Control size="sm" type="text" name="name" value={formData.name || ''} onChange={handleFormChange} required /></Form.Group>
                               <Row>
                                 <Col md={6}><Form.Group className="mb-3"><Form.Label>Phone*</Form.Label><Form.Control size="sm" type="tel" name="phone" value={formData.phone || ''} onChange={handleFormChange} required /></Form.Group></Col>
                                 <Col md={6}><Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control size="sm" type="email" name="email" value={formData.email || ''} onChange={handleFormChange} /></Form.Group></Col>
                               </Row>
                               <Form.Group className="mb-3"><Form.Label>Address</Form.Label><Form.Control size="sm" type="text" name="address" value={formData.address || ''} onChange={handleFormChange} /></Form.Group>
                               <Form.Group className="mb-3"><Form.Label>City</Form.Label><Form.Control size="sm" type="text" name="city" value={formData.city || ''} onChange={handleFormChange} /></Form.Group>
                               <small className="text-muted">* Required fields</small>
                           </Modal.Body>
                          <Modal.Footer>
                               <Button variant="outline-secondary" onClick={closeModal}>Cancel</Button>
                               <Button variant="primary" type="submit" className="px-4"><FaEdit className="me-1"/> Save</Button>
                           </Modal.Footer>
                      </Form>
                 </Modal>
                 {/* --- Custom Notification / Confirm Modal --- */}
                <Modal show={notification.show} onHide={closeNotification} centered backdrop="static" size="sm">
                    <Modal.Header className={notification.title === 'Error' ? 'bg-danger text-white' : notification.title === 'Success' ? 'bg-success text-white' : 'bg-white'}>
                        <Modal.Title className="h6 mb-0">
                            {notification.title === 'Confirm Deletion' && <FaTrashAlt className="me-2 text-danger" />}
                            {notification.title === 'Success' && <FaInfoCircle className="me-2" />}
                            {notification.title}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="text-center py-4">
                        <p className="mb-0 text-muted">{notification.message}</p>
                    </Modal.Body>
                    <Modal.Footer className="justify-content-center border-0 pt-0">
                        {notification.type === 'confirm' ? (
                            <>
                                <Button variant="light" className="px-4" onClick={closeNotification}>Cancel</Button>
                                <Button variant="danger" className="px-4 shadow-sm" onClick={notification.onConfirm}>Yes, Delete</Button>
                            </>
                        ) : (
                            <Button variant="primary" className="px-5 shadow-sm" onClick={closeNotification}>OK</Button>
                        )}
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    );
};

export default CustomersVehiclesPage;