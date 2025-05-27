import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Select from 'react-select'; // Ensure 'react-select' is installed
import {
    Container, Row, Col, Card, Button, Badge, Table, Form, InputGroup, Spinner, Alert, Stack, Tooltip, OverlayTrigger, ListGroup // Added ListGroup
} from 'react-bootstrap';
import {
    FaArrowLeft, FaSave, FaPrint, FaCheckSquare, FaTrash, FaPencilAlt, FaPlus, FaCheck, FaTimes, FaUser, FaCar,
    FaMapMarkerAlt, FaPhone, FaEnvelope, FaCalendarAlt, FaTachometerAlt, FaStickyNote, FaBarcode, FaHashtag // Added more icons
} from 'react-icons/fa';
import {
    initialMasterItems,vi
    findJobSheetById,
    updateJobSheet,
    findMasterItemById,
    findCustomerById,
    findVehicleById
} from '../data/staticData';

// Helper to format currency (keep as is)
const formatCurrency = (amount) => amount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }) || '₹ 0.00';

// --- Custom CSS (Optional: Add to App.css for fine-tuning) ---
/*


*/

const JobSheetDetailPage = () => {
    const { jobSheetId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // State (Keep existing state variables)
    const [jobSheetDetails, setJobSheetDetails] = useState(null);
    const [customerDetails, setCustomerDetails] = useState(null);
    const [vehicleDetails, setVehicleDetails] = useState(null);
    const [addedItems, setAddedItems] = useState([]);
    const [kmReading, setKmReading] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMasterItem, setSelectedMasterItem] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [editingItemId, setEditingItemId] = useState(null);
    const [editingQuantity, setEditingQuantity] = useState('');
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);

    // Data Loading Effect (Keep as is)
    useEffect(() => {
        setLoading(true); setError(null);
        setCustomerDetails(null); setVehicleDetails(null);
        const timer = setTimeout(() => {
            const foundSheet = findJobSheetById(jobSheetId);
            if (foundSheet) {
                setJobSheetDetails(foundSheet);
                const customer = findCustomerById(foundSheet.customerId);
                const vehicle = findVehicleById(foundSheet.vehicleId);
                setCustomerDetails(customer);
                setVehicleDetails(vehicle);
                setAddedItems(foundSheet.items ? JSON.parse(JSON.stringify(foundSheet.items)) : []);
                setKmReading(foundSheet.kmReading || '');
                setNotes(foundSheet.notes || '');
                 if (!customer || !vehicle) { console.warn(`Missing details for JS ${jobSheetId}`); }
            } else {
                setError(`Job Sheet ${jobSheetId} not found.`);
            }
            setLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [jobSheetId]);

    // Read-Only Check (Keep as is)
    const isReadOnly = useMemo(() =>
        jobSheetDetails?.status === 'Completed' || jobSheetDetails?.status === 'Invoiced',
        [jobSheetDetails?.status]
    );

    // Select Options (Keep as is, maybe refine label slightly)
     const selectOptions = useMemo(() => initialMasterItems.map(item => ({
        value: item.id,
        label: `${item.name} (${item.partNo || 'SVC'}) - [${formatCurrency(item.unitPrice)}]`, // Slightly adjusted label
        ...item
    })), []);

    // Calculations (Keep as is)
     const calculateLineTotals = (masterItemData, qty) => { /* ... no change ... */
        if (!masterItemData) return { lineParts: 0, lineLubes: 0, lineLabour: 0, lineTotal: 0 };
        const price = parseFloat(masterItemData.unitPrice) || 0;
        const lube = parseFloat(masterItemData.lubeCharge) || 0;
        const labour = parseFloat(masterItemData.labourCharge) || 0;
        const q = parseInt(qty) || 0;
        const lineParts = q * price;
        const lineLubes = q > 0 ? lube : 0; // Assuming lube/labour charges are per instance, not per quantity
        const lineLabour = q > 0 ? labour : 0;
        const lineTotal = lineParts + lineLubes + lineLabour;
        return { lineParts, lineLubes, lineLabour, lineTotal };
     };
     const totals = useMemo(() => { /* ... no change ... */
        let totalP = 0, totalLube = 0, totalLab = 0, grandT = 0;
        addedItems.forEach(item => {
            totalP += item.lineParts || 0;
            totalLube += item.lineLubes || 0;
            totalLab += item.lineLabour || 0;
            grandT += item.lineTotal || 0;
        });
        return { totalParts: totalP, totalLubes: totalLube, totalLabour: totalLab, grandTotal: grandT };
     }, [addedItems]);

    // Item Add/Edit/Remove Handlers (Keep logic, adjust confirmation/alerts maybe)
    const handleAddItem = () => { /* ... no change needed in core logic ... */
        if (!selectedMasterItem || quantity <= 0 || isReadOnly) return;
        const masterItemData = findMasterItemById(selectedMasterItem.value);
        if (!masterItemData) { return; }
        const existingItemIndex = addedItems.findIndex(item => item.masterItemId === selectedMasterItem.value);
        let updatedItems;
        if (existingItemIndex > -1) {
            updatedItems = addedItems.map((item, index) => {
                if (index === existingItemIndex) {
                    const newQuantity = item.quantity + parseInt(quantity);
                    const newTotals = calculateLineTotals(masterItemData, newQuantity);
                    return { ...item, quantity: newQuantity, ...newTotals };
                } return item;
            });
        } else {
            const newTotals = calculateLineTotals(masterItemData, quantity);
            const newItem = {
                masterItemId: masterItemData.id, name: masterItemData.name, partNo: masterItemData.partNo,
                quantity: parseInt(quantity), unitPrice: masterItemData.unitPrice,
                lubeCharge: masterItemData.lubeCharge, labourCharge: masterItemData.labourCharge, ...newTotals
            };
            updatedItems = [...addedItems, newItem];
        }
        setAddedItems(updatedItems);
        setSelectedMasterItem(null); setQuantity(1);
    };
    const handleRemoveItem = (itemIdToRemove) => { /* ... no change needed in core logic ... */
        if (isReadOnly) return;
        if (window.confirm("Remove this item?")) {
            setAddedItems(prev => prev.filter(item => item.masterItemId !== itemIdToRemove));
        }
    };
    const startEditing = (item) => { /* ... no change ... */
        if (isReadOnly) return;
        setEditingItemId(item.masterItemId);
        setEditingQuantity(item.quantity.toString());
    };
    const cancelEditing = () => { /* ... no change ... */
        setEditingItemId(null);
        setEditingQuantity('');
    };
    const saveEditing = (itemId) => { /* ... no change needed in core logic ... */
        if (isReadOnly) return;
        const newQty = parseInt(editingQuantity);
        if (isNaN(newQty) || newQty <= 0) { alert("Invalid quantity."); return; }
        const masterItemData = findMasterItemById(itemId);
        if (!masterItemData) return;
        setAddedItems(prev => prev.map(item => {
            if (item.masterItemId === itemId) {
                const newTotals = calculateLineTotals(masterItemData, newQty);
                return { ...item, quantity: newQty, ...newTotals };
            } return item;
        }));
        cancelEditing();
    };

    // Save Draft Handler (Keep logic)
    const handleSaveDraft = () => { /* ... no change needed in core logic ... */
        if (isReadOnly) return;
        setIsSavingDraft(true);
        const draftData = {
            ...jobSheetDetails, items: addedItems, kmReading: kmReading, notes: notes,
            status: jobSheetDetails?.status === 'In Progress' ? 'In Progress' : 'Draft',
            totalParts: totals.totalParts, totalLubes: totals.totalLubes,
            totalLabour: totals.totalLabour, grandTotal: totals.grandTotal,
        };
        setTimeout(() => {
            updateJobSheet(draftData); setJobSheetDetails(draftData); setIsSavingDraft(false);
            // Use a less intrusive notification like a toast if available
            alert("Draft Saved (Simulated)");
        }, 500);
    };

    // Finalize Handler (Keep logic)
    const handleFinalize = () => { /* ... no change needed in core logic ... */
        if (isReadOnly) return;
        if (window.confirm("Finalize Job Sheet? This marks it as completed and prepares it for invoicing. No further edits allowed.")) {
            setIsFinalizing(true);
            const finalData = {
                ...jobSheetDetails, items: addedItems, kmReading: kmReading, notes: notes,
                status: 'Completed', dateCompleted: new Date().toISOString().split('T')[0],
                totalParts: totals.totalParts, totalLubes: totals.totalLubes,
                totalLabour: totals.totalLabour, grandTotal: totals.grandTotal,
            };
            setTimeout(() => {
                updateJobSheet(finalData); setJobSheetDetails(finalData); setIsFinalizing(false);
                alert("Job Sheet Finalized (Simulated)");
                navigate('/create-invoice', { state: { finalizedJobSheet: finalData } });
            }, 500);
        }
    };

    // --- Render Logic ---
    if (loading) return <Container className="text-center py-5"><Spinner animation="border" variant="primary" role="status"><span className="visually-hidden">Loading...</span></Spinner><p className="mt-2 text-muted">Loading Job Sheet Details...</p></Container>;
    if (error) return <Container className="py-5"><Alert variant="danger" className="shadow-sm"><Alert.Heading>Error Loading Job Sheet</Alert.Heading><p>{error}</p><hr/><Button variant="outline-secondary" onClick={()=>navigate(-1)} size="sm"><FaArrowLeft className="me-1"/> Go Back</Button></Alert></Container>;
    if (!jobSheetDetails) return <Container className="py-5 text-center text-muted">Job sheet data is unavailable.</Container>;

    // --- Render Component ---
    return (
      <Container fluid className="py-4 px-lg-5 job-sheet-detail-page">
           {/* ========================== Header ========================== */}
           <Row className="mb-4 align-items-center">
              <Col xs="auto" className="no-print">
                  <Button variant="link" className="text-secondary text-decoration-none p-0" onClick={() => navigate(-1)} title="Go Back">
                      <FaArrowLeft className="me-1"/> Back
                  </Button>
              </Col>
              <Col>
                   <h1 className="h3 fw-bold text-dark mb-0">Job Sheet: {jobSheetDetails.jobSheetNumber || jobSheetId}</h1>
              </Col>
              <Col xs="auto" className="text-end">
                   <Badge pill bg={
                      jobSheetDetails.status === 'Completed' ? 'success' :
                      jobSheetDetails.status === 'Invoiced' ? 'info' :
                      jobSheetDetails.status === 'In Progress' ? 'warning' :
                      jobSheetDetails.status === 'Draft' ? 'secondary' : 'dark' // Draft as secondary
                      }
                      className="fs-6 px-3 py-2 shadow-sm"
                  >
                      {jobSheetDetails.status}
                  </Badge>
                   {isReadOnly && <Badge pill bg="light" text="dark" className="ms-2 fs-6 px-3 py-2 border">Read Only</Badge>}
              </Col>
           </Row>

        <div className="printable-section"> {/* Wrap content intended for printing */}
           {/* ========================== Customer & Vehicle Info ========================== */}
           <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-light-subtle">
                    <FaUser className="me-2 text-primary"/>Customer & <FaCar className="ms-3 me-2 text-primary"/>Vehicle Information
                </Card.Header>
                <Card.Body>
                    {(!customerDetails || !vehicleDetails) && <Alert variant="warning" size="sm" className="mb-3">Warning: Customer or Vehicle details might be incomplete.</Alert>}
                    <Row>
                        {/* Customer Details */}
                        <Col md={6} className="border-end-md mb-3 mb-md-0">
                            <h5 className="h6 text-muted mb-3">Customer Details</h5>
                            <ListGroup variant="flush">
                                <ListGroup.Item className="d-flex px-0">
                                    <FaUser className="me-2 mt-1 text-secondary" style={{width: '16px'}} />
                                    <span className="fw-medium flex-fill">{customerDetails?.name || 'N/A'}</span>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex px-0">
                                    <FaPhone className="me-2 mt-1 text-secondary" style={{width: '16px'}} />
                                    <span className="flex-fill">{customerDetails?.phone || 'N/A'}</span>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex px-0">
                                    <FaEnvelope className="me-2 mt-1 text-secondary" style={{width: '16px'}} />
                                    <span className="flex-fill">{customerDetails?.email || 'N/A'}</span>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex px-0">
                                    <FaMapMarkerAlt className="me-2 mt-1 text-secondary" style={{width: '16px'}} />
                                    <span className="flex-fill">{customerDetails?.address || 'N/A'}, {customerDetails?.city || 'N/A'}</span>
                                </ListGroup.Item>
                            </ListGroup>
                        </Col>
                        {/* Vehicle Details */}
                        <Col md={6} className="ps-md-4">
                            <h5 className="h6 text-muted mb-3">Vehicle Details</h5>
                             <ListGroup variant="flush">
                                <ListGroup.Item className="d-flex px-0">
                                    <FaCar className="me-2 mt-1 text-secondary" style={{width: '16px'}}/>
                                    <span className="fw-medium flex-fill">{`${vehicleDetails?.make || ''} ${vehicleDetails?.model || ''}`}</span>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex px-0">
                                    <FaHashtag className="me-2 mt-1 text-secondary" style={{width: '16px'}}/>
                                    <span className="flex-fill">Reg No: <Badge bg="dark">{vehicleDetails?.carNumber || jobSheetDetails?.vehicleNumber || 'N/A'}</Badge></span>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex px-0">
                                    <FaCalendarAlt className="me-2 mt-1 text-secondary" style={{width: '16px'}}/>
                                    <span className="flex-fill">Year: {vehicleDetails?.year || 'N/A'}</span>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex px-0">
                                    <FaBarcode className="me-2 mt-1 text-secondary" style={{width: '16px'}}/>
                                    <span className="flex-fill">VIN: {vehicleDetails?.vin || 'N/A'}</span>
                                </ListGroup.Item>
                            </ListGroup>
                        </Col>
                    </Row>
                </Card.Body>
           </Card>

           {/* ========================== Job Details (KM & Notes) ========================== */}
            <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-light-subtle">
                    <FaTachometerAlt className="me-2 text-primary"/>Job Details
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={4} className="mb-3">
                            <Form.Group controlId="kmReading">
                                <Form.Label className="fw-semibold text-muted small text-uppercase">KM Reading</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text><FaTachometerAlt /></InputGroup.Text>
                                    <Form.Control
                                        type="text" value={kmReading} onChange={(e) => setKmReading(e.target.value)}
                                        readOnly={isReadOnly} placeholder="e.g., 45120" disabled={isSavingDraft || isFinalizing}
                                    />
                                </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col md={8} className="mb-3">
                            <Form.Group controlId="notes">
                                <Form.Label className="fw-semibold text-muted small text-uppercase">Notes / Customer Request</Form.Label>
                                <InputGroup>
                                     <InputGroup.Text><FaStickyNote /></InputGroup.Text>
                                    <Form.Control
                                        as="textarea" rows={1} // Start with 1 row, auto-expands slightly
                                        value={notes} onChange={(e) => setNotes(e.target.value)}
                                        readOnly={isReadOnly} placeholder="Technician notes or customer instructions..."
                                        disabled={isSavingDraft || isFinalizing}
                                        style={{ minHeight: '38px' }} // Match input group height
                                    />
                                </InputGroup>
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* ========================== Items Section (Add + Table) ========================== */}
            <Card className="shadow-sm">
                 {/* --- Add Item Form (Only if not read-only) --- */}
                 {!isReadOnly && (
                    <Card.Header className="bg-light-subtle border-bottom-0">
                         <h5 className="h6 mb-0 text-muted"><FaPlus className="me-2"/>Add Service / Spare Part</h5>
                    </Card.Header>
                 )}
                 {!isReadOnly && (
                    <Card.Body className="pt-3 pb-4 bg-light-subtle">
                         <Row className="g-2 align-items-end"> {/* Reduced gap */}
                             <Col lg={6} md={12} sm={12} className="mb-2 mb-lg-0">
                                 <Form.Label htmlFor="itemSelect" className="visually-hidden">Select Item</Form.Label>
                                 <Select
                                     id="itemSelect" options={selectOptions} value={selectedMasterItem}
                                     onChange={setSelectedMasterItem} placeholder="Search or select item..."
                                     isClearable isDisabled={isSavingDraft || isFinalizing}
                                     classNamePrefix="react-select" // For potential global styling
                                 />
                             </Col>
                             <Col lg={2} md={4} sm={5}>
                                 <Form.Label htmlFor="quantityInput" className="visually-hidden">Quantity</Form.Label>
                                 <Form.Control id="quantityInput" type="number" min="1" value={quantity}
                                     onChange={(e) => setQuantity(e.target.value)}
                                     disabled={!selectedMasterItem || isSavingDraft || isFinalizing}
                                     placeholder="Qty"
                                 />
                             </Col>
                             <Col lg={4} md={8} sm={7}>
                                 <Button variant="primary" className="w-100" onClick={handleAddItem}
                                     disabled={!selectedMasterItem || quantity <= 0 || isSavingDraft || isFinalizing}>
                                     <FaPlus className="me-1" /> Add to Job Sheet
                                 </Button>
                             </Col>
                         </Row>
                     </Card.Body>
                 )}

                {/* --- Added Items Table --- */}
                <Card.Header className={!isReadOnly ? "border-top" : ""}>
                    <h5 className="h6 mb-0 text-muted">Added Items & Services</h5>
                </Card.Header>
                <Card.Body className="p-0">
                    <div className="table-responsive">
                       <Table hover className="mb-0 align-middle jobsheet-items-table">
                           <thead className="table-light small text-uppercase text-secondary">
                               <tr>
                                   <th className="py-2 px-3 text-center" style={{width: '5%'}}>#</th>
                                   <th className="py-2 px-3" style={{width: '15%'}}>Part No.</th>
                                   <th className="py-2 px-3" style={{width: '30%'}}>Description</th>
                                   <th className="py-2 px-3 text-center" style={{width: '15%'}}>Qty</th>
                                   <th className="py-2 px-3 text-end" style={{width: '10%'}}>Parts</th>
                                   <th className="py-2 px-3 text-end" style={{width: '10%'}}>Lubes</th>
                                   <th className="py-2 px-3 text-end" style={{width: '10%'}}>Labour</th>
                                   <th className="py-2 px-3 text-end fw-bold" style={{width: '10%'}}>Total</th>
                                   {!isReadOnly && <th className="py-2 px-3 text-center no-print" style={{width: '5%'}}></th>} {/* Actions */}
                               </tr>
                           </thead>
                           <tbody>
                               {addedItems.length === 0 ? (
                                    <tr><td colSpan={isReadOnly ? 8 : 9} className="text-center text-muted py-5"><i>No items or services added yet.</i></td></tr>
                               ) : (
                                   addedItems.map((item, index) => (
                                        <tr key={item.masterItemId || index}>
                                            <td className="px-3 text-center text-muted small">{index + 1}</td>
                                            <td className="px-3 small">{item.partNo || '-'}</td>
                                            <td className="px-3">{item.name}</td>
                                            <td className="px-3 text-center">
                                                {editingItemId === item.masterItemId ? (
                                                    // Inline Edit Form
                                                    <InputGroup size="sm" className="w-auto mx-auto" style={{maxWidth: '150px'}}>
                                                        <Form.Control type="number" min="1" value={editingQuantity} onChange={(e) => setEditingQuantity(e.target.value)} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') saveEditing(item.masterItemId); if (e.key === 'Escape') cancelEditing(); }}/>
                                                        <OverlayTrigger placement="top" overlay={<Tooltip>Save Qty</Tooltip>}>
                                                           <Button variant="outline-success" size="sm" onClick={() => saveEditing(item.masterItemId)}><FaCheck/></Button>
                                                        </OverlayTrigger>
                                                        <OverlayTrigger placement="top" overlay={<Tooltip>Cancel</Tooltip>}>
                                                           <Button variant="outline-secondary" size="sm" onClick={cancelEditing}><FaTimes/></Button>
                                                        </OverlayTrigger>
                                                    </InputGroup>
                                                ) : (
                                                    // Display Quantity with Edit Trigger
                                                    <span className="d-inline-block align-middle me-1">{item.quantity}</span>
                                                )}
                                                 {/* Edit button shown only when not editing */}
                                                 {!isReadOnly && editingItemId !== item.masterItemId && (
                                                     <Button variant="link" size="sm" className="p-0 edit-quantity-btn no-print align-middle" onClick={() => startEditing(item)} title="Edit Quantity">
                                                         <FaPencilAlt className="text-muted small" />
                                                     </Button>
                                                 )}
                                            </td>
                                            <td className="px-3 text-end small">{formatCurrency(item.lineParts)}</td>
                                            <td className="px-3 text-end small">{formatCurrency(item.lineLubes)}</td>
                                            <td className="px-3 text-end small">{formatCurrency(item.lineLabour)}</td>
                                            <td className="px-3 text-end fw-semibold">{formatCurrency(item.lineTotal)}</td>
                                            {!isReadOnly && (
                                                <td className="px-3 text-center no-print">
                                                     <OverlayTrigger placement="top" overlay={<Tooltip>Remove Item</Tooltip>}>
                                                        <Button variant="link" size="sm" className="text-danger p-0" onClick={() => handleRemoveItem(item.masterItemId)} disabled={isSavingDraft || isFinalizing}>
                                                            <FaTrash />
                                                        </Button>
                                                     </OverlayTrigger>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                               )}
                            </tbody>
                            {/* Totals Footer */}
                             {addedItems.length > 0 && (
                                <tfoot className="border-top">
                                    <tr className="bg-light-subtle">
                                        <td colSpan={isReadOnly ? 4 : 5} className="text-end px-3 py-2 fw-semibold small text-uppercase text-secondary">Item Totals:</td>
                                        <td className="text-end px-3 py-2 fw-semibold">{formatCurrency(totals.totalParts)}</td>
                                        <td className="text-end px-3 py-2 fw-semibold">{formatCurrency(totals.totalLubes)}</td>
                                        <td className="text-end px-3 py-2 fw-semibold">{formatCurrency(totals.totalLabour)}</td>
                                        <td colSpan={isReadOnly ? 1 : 2}></td>
                                    </tr>
                                     <tr className="bg-dark text-white fs-5">
                                        <td colSpan={isReadOnly ? 7 : 8} className="text-end px-3 py-3 fw-bold">Grand Total</td>
                                        <td className="text-end px-3 py-3 fw-bold">{formatCurrency(totals.grandTotal)}</td>
                                        {!isReadOnly && <td className="no-print"></td>}
                                    </tr>
                                </tfoot>
                            )}
                       </Table>
                   </div>
               </Card.Body>
            </Card>
        </div> {/* End of printable-section */}


           {/* ========================== Action Buttons Footer ========================== */}
            <div className="mt-4 d-flex justify-content-end align-items-center gap-2 flex-wrap no-print">
                <Button variant="outline-secondary" onClick={() => window.print()} disabled={isSavingDraft || isFinalizing} size="sm">
                    <FaPrint className="me-1" /> Print
                </Button>
               {!isReadOnly && (
                   <>
                        <Button variant="outline-primary" onClick={handleSaveDraft} disabled={isSavingDraft || isFinalizing} size="sm">
                            {isSavingDraft ? <><Spinner as="span" size="sm" animation="border" className="me-1"/> Saving...</> : <><FaSave className="me-1" /> Save Draft</>}
                        </Button>
                       <Button variant="success" onClick={handleFinalize} disabled={isFinalizing || isSavingDraft} size="sm">
                           {isFinalizing ? <><Spinner as="span" size="sm" animation="border" className="me-1"/> Finalizing...</> : <><FaCheckSquare className="me-1" /> Finalize & Proceed</>}
                       </Button>
                   </>
               )}
           </div>

      </Container>
  );
};

export default JobSheetDetailPage;