import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import {
    Container, Row, Col, Card, Button, Badge, Table, Form, InputGroup, Spinner, Alert, ListGroup, Tooltip, OverlayTrigger, Modal
} from 'react-bootstrap';
import {
    FaArrowLeft, FaSave, FaPrint, FaCheckSquare, FaTrash, FaPencilAlt, FaPlus, FaCheck, FaTimes, FaUser, FaCar,
    FaMapMarkerAlt, FaPhone, FaEnvelope, FaCalendarAlt, FaTachometerAlt, FaStickyNote, FaBarcode, FaHashtag, FaExclamationTriangle, FaInfoCircle, FaBolt, FaBoxes
} from 'react-icons/fa';
import api from '../api/api'; 
import { useGlobalDate } from '../contexts/GlobalDateContext';
import { useToast } from '../contexts/ToastContext';
import { validateKMReading, validateNumber, sanitizeString } from '../utils/validators';

// --- HELPER FUNCTIONS ---
const formatCurrency = (amount) => {
    const num = amount != null ? parseFloat(amount) : 0;
    return num.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    });
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

const JobSheetDetailPage = () => {
    const toast = useToast();
    const { today } = useGlobalDate();
    const { jobSheetId } = useParams();
    const navigate = useNavigate();

    // --- UX REFS FOR KEYBOARD NAVIGATION ---
    const selectRef = useRef(null);
    const qtyRef = useRef(null);
    const rateRef = useRef(null);

    // --- STATE MANAGEMENT ---
    const [jobSheetDetails, setJobSheetDetails] = useState(null);
    const [customerDetails, setCustomerDetails] = useState(null);
    const [vehicleDetails, setVehicleDetails] = useState(null);
    const [addedItems, setAddedItems] = useState([]);
    const [masterItems, setMasterItems] = useState([]); 
    const [enforceStockValidation, setEnforceStockValidation] = useState(true);
    const [garageProfile, setGarageProfile] = useState(null);

    const [kmReading, setKmReading] = useState('');
    const [notes, setNotes] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { workingDate } = useGlobalDate();
    const [validationErrors, setValidationErrors] = useState({});

    // Forms
    const [selectedMasterItem, setSelectedMasterItem] = useState(null);
    const [selectInputValue, setSelectInputValue] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [unitPrice, setUnitPrice] = useState('');
    const [lubeCharge, setLubeCharge] = useState('');
    const [labourCharge, setLabourCharge] = useState('');
    const kmReadingRef = useRef(null);
    const notesRef = useRef(null);
    const lubeRef = useRef(null);
    const labourRef = useRef(null);
    const tableEndRef = useRef(null);
    const [editingItemId, setEditingItemId] = useState(null);
    const [editingQuantity, setEditingQuantity] = useState('');

    // --- MODAL STATES ---
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showItemRemoveModal, setShowItemRemoveModal] = useState(false);
    const [itemToRemove, setItemToRemove] = useState(null);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [validationMessage, setValidationMessage] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [successNavigation, setSuccessNavigation] = useState(null);

    // In-Place Master Item Creation Modal State
    const [showNewItemModal, setShowNewItemModal] = useState(false);
    const [savingNewItem, setSavingNewItem] = useState(false);
    const [newItemForm, setNewItemForm] = useState({
        name: '', partNo: '', type: 'Spare', unitPrice: '', stockQty: '10', lubeCharge: '0', labourCharge: '0'
    });

    // Quick Restock Modal State
    const [showRestockModal, setShowRestockModal] = useState(false);
    const [restocking, setRestocking] = useState(false);
    const [restockQty, setRestockQty] = useState('5');

    // --- DATA FETCHING & INITIALIZATION ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [detailsResponse, masterItemsResponse, profileResponse] = await Promise.all([
                    api.get(`/jobsheets/${jobSheetId}/details`),
                    api.get('/master-items'),
                    api.get('/profile')
                ]);

                if (!detailsResponse.ok) {
                    const errorData = await detailsResponse.json().catch(() => ({ message: `Job Sheet with ID ${jobSheetId} not found.` }));
                    throw new Error(errorData.message);
                }
                if (!masterItemsResponse.ok) {
                    const errorData = await masterItemsResponse.json().catch(() => ({ message: 'Failed to load the master item list.' }));
                    throw new Error(errorData.message);
                }

                const detailsData = await detailsResponse.json();
                const masterItemsData = await masterItemsResponse.json();

                setJobSheetDetails(detailsData.jobSheetDetails);
                setCustomerDetails(detailsData.customerDetails);
                setVehicleDetails(detailsData.vehicleDetails);
                setAddedItems((detailsData.addedItems || []).map(item => {
                    const price = item.unitPrice ?? item.unit_price ?? 0;
                    const lube = item.lubeCharge ?? item.lube_charge ?? 0;
                    const labour = item.labourCharge ?? item.labour_charge ?? 0;
                    return { 
                        ...item, 
                        unitPrice: price,
                        lubeCharge: lube,
                        labourCharge: labour,
                        ...calculateLineTotals(item, item.quantity, price, lube, labour) 
                    };
                }));
                setKmReading(detailsData.jobSheetDetails.kmReading || '');
                setNotes(detailsData.jobSheetDetails.notes || '');
                setMasterItems(masterItemsData);

                if (profileResponse.ok) {
                    const pData = await profileResponse.json();
                    if (pData.garage) {
                        setGarageProfile(pData.garage);
                        setEnforceStockValidation(pData.garage.enforce_stock_validation !== false);
                    }
                }

            } catch (err) {
                setError(err.message);
                console.error("Error fetching page data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [jobSheetId]); 

    // --- MEMOIZED DERIVED STATE ---
    const isReadOnly = useMemo(() =>
        jobSheetDetails?.status === 'Completed' || jobSheetDetails?.status === 'Invoiced',
        [jobSheetDetails?.status]
    );

    const selectOptions = useMemo(() => (Array.isArray(masterItems) ? masterItems : []).map(item => ({
        value: item.id,
        label: `${item.name} (${item.partNo || item.part_no || 'SVC'}) - [${formatCurrency(item.unitPrice ?? item.unit_price ?? 0)}]`,
        ...item 
    })), [masterItems]);


    // --- CALCULATIONS ---
    const calculateLineTotals = (masterItemData, qty, customPrice, customLube, customLabour) => {
        if (!masterItemData) return { lineParts: 0, lineLubes: 0, lineLabour: 0, lineTotal: 0 };
        
        const price = customPrice !== undefined && !isNaN(parseFloat(customPrice))
            ? parseFloat(customPrice)
            : parseFloat(unitPrice !== '' ? unitPrice : (masterItemData.unitPrice ?? masterItemData.unit_price ?? 0));
            
        const lube = customLube !== undefined && !isNaN(parseFloat(customLube))
            ? parseFloat(customLube)
            : parseFloat(lubeCharge !== '' ? lubeCharge : (masterItemData.lubeCharge ?? masterItemData.lube_charge ?? 0));

        const labour = customLabour !== undefined && !isNaN(parseFloat(customLabour))
            ? parseFloat(customLabour)
            : parseFloat(labourCharge !== '' ? labourCharge : (masterItemData.labourCharge ?? masterItemData.labour_charge ?? 0));
        
        const q = parseFloat(qty) || 0; 
        
        const lineParts = q * price;
        const lineLubes = q > 0 ? (lube * q) : 0;
        const lineLabour = q > 0 ? (labour * q) : 0;
        const lineTotal = lineParts + lineLubes + lineLabour;
        
        return { lineParts, lineLubes, lineLabour, lineTotal };
    };

    const totals = useMemo(() => {
        const list = Array.isArray(addedItems) ? addedItems : [];
        return list.reduce((acc, item) => {
            acc.totalParts += item.lineParts || 0;
            acc.totalLubes += item.lineLubes || 0;
            acc.totalLabour += item.lineLabour || 0;
            acc.grandTotal += item.lineTotal || 0;
            return acc;
        }, { totalParts: 0, totalLubes: 0, totalLabour: 0, grandTotal: 0 });
    }, [addedItems]);

    const validateForm = (isFinalizingAction) => {
        const errors = {};

        if (isFinalizingAction) {
            if (!kmReading || String(kmReading).trim() === '') {
                errors.kmReading = 'KM Reading is required to finalize a job sheet.';
            }
            if (!addedItems || addedItems.length === 0) {
                errors.items = 'At least one item or service must be added to finalize.';
            }
        }
        
        if (kmReading && String(kmReading).trim() !== '') {
            const kmRes = validateKMReading(kmReading, vehicleDetails?.km_reading, isFinalizingAction);
            if (!kmRes.isValid) {
                errors.kmReading = kmRes.error;
            }
        }

        setValidationErrors(errors);
        return errors;
    };

    // Dynamically compute uncommitted draft quantity and remaining available stock for the selected item
    const selectedItemStockInfo = useMemo(() => {
        if (!selectedMasterItem) return { totalStock: 0, draftedQty: 0, availableStock: 0 };
        
        const itemId = selectedMasterItem.value || selectedMasterItem.id;
        const totalStock = parseFloat(selectedMasterItem.stockQty ?? selectedMasterItem.stock_qty ?? 0);
        
        const currentItems = Array.isArray(addedItems) ? addedItems : [];
        const draftedQty = currentItems.reduce((acc, item) => {
            const mId = item.masterItemId || item.master_item_id;
            return mId === itemId ? acc + (parseFloat(item.quantity) || 0) : acc;
        }, 0);

        const availableStock = Math.max(0, totalStock - draftedQty);
        return { totalStock, draftedQty, availableStock };
    }, [selectedMasterItem, addedItems]);

    // Ensure React-Select value prop matches option by value property
    const currentSelectValue = useMemo(() => {
        if (!selectedMasterItem) return null;
        const targetId = selectedMasterItem.value || selectedMasterItem.id;
        return selectOptions.find(opt => opt.value === targetId) || selectedMasterItem;
    }, [selectedMasterItem, selectOptions]);

    // Auto-focus quantity field when an item is selected and pre-fill all 3 prices
    const handleSelectChange = (selectedOption) => {
        setSelectedMasterItem(selectedOption);
        setSelectInputValue('');
        if (selectedOption) {
            const masterItemData = masterItems.find(item => item.id === selectedOption.value) || selectedOption;
            const price = masterItemData.unit_price ?? masterItemData.unitPrice ?? 0;
            const lube = masterItemData.lube_charge ?? masterItemData.lubeCharge ?? 0;
            const labour = masterItemData.labour_charge ?? masterItemData.labourCharge ?? 0;

            setUnitPrice(price.toString());
            setLubeCharge(lube.toString());
            setLabourCharge(labour.toString());

            setTimeout(() => {
                if (qtyRef.current) {
                    qtyRef.current.focus();
                    qtyRef.current.select();
                }
            }, 0);
        } else {
            setUnitPrice('');
            setLubeCharge('');
            setLabourCharge('');
        }
    };

    // Auto-focus KM Reading field on page load
    useEffect(() => {
        if (!loading && !isReadOnly && kmReadingRef.current) {
            setTimeout(() => {
                kmReadingRef.current?.focus();
            }, 150);
        }
    }, [loading, isReadOnly]);

    // Auto-scroll to newly added item in table
    const prevItemsLength = useRef(addedItems.length);
    useEffect(() => {
        if (addedItems.length > prevItemsLength.current) {
            setTimeout(() => {
                tableEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
        prevItemsLength.current = addedItems.length;
    }, [addedItems.length]);

    // Helper to open the new item modal pre-filled with search text
    const openNewItemModalWithSearch = (searchName) => {
        setNewItemForm({
            name: searchName || '',
            partNo: '',
            type: 'Spare',
            unitPrice: '',
            stockQty: '10',
            lubeCharge: '0',
            labourCharge: '0'
        });
        setShowNewItemModal(true);
    };

    // --- ENTER KEY MASTER NAVIGATION SEQUENCE ---
    // 1. KM Reading Enter -> Notes
    const handleKmKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (notesRef.current) {
                notesRef.current.focus();
                notesRef.current.select?.();
            }
        }
    };

    // 2. Notes Enter -> Search Item Dropdown
    const handleNotesKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (selectRef.current) {
                selectRef.current.focus();
            }
        }
    };

    // 3. Qty Enter -> Parts Rate (unitPrice)
    const handleQuantityKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (rateRef.current) {
                rateRef.current.focus();
                rateRef.current.select();
            }
        }
    };

    // 4. Parts Rate Enter -> Lubes Charge
    const handleRateKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (lubeRef.current) {
                lubeRef.current.focus();
                lubeRef.current.select();
            }
        }
    };

    // 5. Lubes Charge Enter -> Labour Charge
    const handleLubeKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (labourRef.current) {
                labourRef.current.focus();
                labourRef.current.select();
            }
        }
    };

    // 6. Labour Charge Enter -> Add Item & Return Focus to Item Search
    const handleLabourKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddItem();
        }
    };

    // Execute actual item insertion or reduction in addedItems array
    const executeAddItem = (masterItemData, parsedQty) => {
        const currentItems = Array.isArray(addedItems) ? addedItems : [];
        const targetId = masterItemData.value || masterItemData.id;
        const existingItemIndex = currentItems.findIndex(item => item.masterItemId === targetId || item.master_item_id === targetId);
        let updatedItems;

        const effectivePrice = parseFloat(unitPrice !== '' ? unitPrice : (masterItemData.unitPrice ?? masterItemData.unit_price ?? 0));
        const effectiveLube = parseFloat(lubeCharge !== '' ? lubeCharge : (masterItemData.lubeCharge ?? masterItemData.lube_charge ?? 0));
        const effectiveLabour = parseFloat(labourCharge !== '' ? labourCharge : (masterItemData.labourCharge ?? masterItemData.labour_charge ?? 0));

        if (existingItemIndex > -1) { 
            const newQuantity = currentItems[existingItemIndex].quantity + parsedQty;
            if (newQuantity <= 0) {
                updatedItems = currentItems.filter((_, index) => index !== existingItemIndex);
                if (toast?.info) toast.info(`Removed "${masterItemData.name}" from job sheet.`);
            } else {
                updatedItems = currentItems.map((item, index) => {
                    if (index === existingItemIndex) {
                        const lineTotals = calculateLineTotals(masterItemData, newQuantity, effectivePrice, effectiveLube, effectiveLabour);
                        return { 
                            ...item, 
                            quantity: newQuantity, 
                            unitPrice: effectivePrice, 
                            unit_price: effectivePrice,
                            lubeCharge: effectiveLube,
                            lube_charge: effectiveLube,
                            labourCharge: effectiveLabour,
                            labour_charge: effectiveLabour,
                            ...lineTotals
                        };
                    }
                    return item;
                });
                if (parsedQty < 0 && toast?.success) {
                    toast.success(`Reduced "${masterItemData.name}" by ${Math.abs(parsedQty)}. New quantity: ${newQuantity}`);
                }
            }
        } else { 
            if (parsedQty <= 0) {
                if (toast?.error) toast.error(`Item "${masterItemData.name}" is not in job sheet yet to reduce quantity.`);
                return;
            }
            const lineTotals = calculateLineTotals(masterItemData, parsedQty, effectivePrice, effectiveLube, effectiveLabour);

            const newItem = {
                masterItemId: targetId,
                master_item_id: targetId,
                name: masterItemData.name,
                partNo: masterItemData.partNo || masterItemData.part_no || '',
                quantity: parsedQty,
                unitPrice: effectivePrice,
                unit_price: effectivePrice,
                lubeCharge: effectiveLube,
                lube_charge: effectiveLube,
                labourCharge: effectiveLabour,
                labour_charge: effectiveLabour,
                ...lineTotals
            };
            updatedItems = [...currentItems, newItem];
        }
        
        setAddedItems(updatedItems);
        setSelectedMasterItem(null);
        setSelectInputValue('');
        setQuantity(1);
        setUnitPrice('');
        setLubeCharge('');
        setLabourCharge('');

        // Return focus to the search dropdown for the next item
        setTimeout(() => {
            if (selectRef.current) {
                selectRef.current.focus();
            }
        }, 0);
    };

    const handleAddItem = () => {
        const parsedQty = parseFloat(quantity);
        if (!selectedMasterItem || isNaN(parsedQty) || parsedQty === 0 || isReadOnly) return;
        
        const masterItemData = masterItems.find(item => item.id === selectedMasterItem.value) || selectedMasterItem;
        if (!masterItemData) return;

        // Check stock requirement for Spare parts when adding POSITIVE quantity ONLY IF Stock Validation is ENFORCED
        if (enforceStockValidation && masterItemData.type === 'Spare' && parsedQty > 0) {
            const availableStock = selectedItemStockInfo.availableStock;
            if (parsedQty > availableStock) {
                const deficit = parsedQty - availableStock;
                setRestockQty(Math.max(10, Math.ceil(deficit)).toString());
                setShowRestockModal(true);
                return; // Pauses addition until user confirms Quick Restock popup
            }
        }

        executeAddItem(masterItemData, parsedQty);
    };

    const handleBypassStockValidationFromModal = async () => {
        setShowRestockModal(false);
        setEnforceStockValidation(false);
        if (selectedMasterItem) {
            const masterItemData = masterItems.find(item => item.id === selectedMasterItem.value) || selectedMasterItem;
            executeAddItem(masterItemData, parseFloat(quantity));
        }

        if (garageProfile) {
            try {
                const updatedProfile = { ...garageProfile, enforce_stock_validation: false };
                await api.put('/profile/garage', updatedProfile);
                setGarageProfile(updatedProfile);
                if (toast?.info) toast.info("Stock Validation Bypassed. Item added to job sheet.");
            } catch (err) {
                console.error("Error bypassing stock validation:", err);
            }
        }
    };

    // --- IN-PLACE STOCK CREATION & QUICK RESTOCK HANDLERS ---
    const handleCreateNewItem = async (e) => {
        e.preventDefault();
        if (!newItemForm.name.trim()) {
            toast?.error ? toast.error('Item name is required.') : setError('Item name is required.');
            return;
        }
        setSavingNewItem(true);
        try {
            const res = await api.post('/master-items', {
                name: newItemForm.name.trim(),
                partNo: newItemForm.partNo.trim() || null,
                type: newItemForm.type,
                unitPrice: parseFloat(newItemForm.unitPrice) || 0,
                stockQty: newItemForm.type === 'Spare' ? (parseFloat(newItemForm.stockQty) || 0) : null,
                lubeCharge: parseFloat(newItemForm.lubeCharge) || 0,
                labourCharge: parseFloat(newItemForm.labourCharge) || 0
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to create item in inventory.');
            }
            const createdItem = await res.json();
            setMasterItems(prev => [...prev, createdItem]);

            const newOption = {
                value: createdItem.id,
                label: `${createdItem.name} (${createdItem.partNo || createdItem.part_no || 'SVC'}) - [${formatCurrency(createdItem.unitPrice ?? createdItem.unit_price ?? 0)}]`,
                ...createdItem
            };
            setSelectedMasterItem(newOption);
            setShowNewItemModal(false);
            setSelectInputValue('');
            setNewItemForm({ name: '', partNo: '', type: 'Spare', unitPrice: '', stockQty: '10', lubeCharge: '0', labourCharge: '0' });
            if (toast?.success) toast.success(`Item "${createdItem.name}" created & selected!`);

            // Shift focus directly to Quantity field so user can type quantity and press Enter!
            setTimeout(() => {
                if (qtyRef.current) {
                    qtyRef.current.focus();
                    qtyRef.current.select();
                }
            }, 100);
        } catch (err) {
            if (toast?.error) toast.error(err.message);
            else setError(err.message);
        } finally {
            setSavingNewItem(false);
        }
    };

    const handleQuickRestock = async (e) => {
        e.preventDefault();
        if (!selectedMasterItem) return;
        const addQty = parseFloat(restockQty);
        if (isNaN(addQty) || addQty <= 0) {
            if (toast?.error) toast.error('Please enter a valid stock quantity greater than 0.');
            return;
        }
        setRestocking(true);
        try {
            const itemId = selectedMasterItem.value || selectedMasterItem.id;
            const res = await api.patch(`/master-items/${itemId}/restock`, { addedQty: addQty });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to restock item.');
            }
            const data = await res.json();
            const updatedItem = data.item;

            setMasterItems(prev => prev.map(it => it.id === itemId ? { ...it, ...updatedItem } : it));
            const updatedMasterItemData = { ...selectedMasterItem, ...updatedItem, stockQty: updatedItem.stockQty, stock_qty: updatedItem.stockQty };
            setSelectedMasterItem(updatedMasterItemData);

            setShowRestockModal(false);
            if (toast?.success) toast.success(`Restocked ${addQty} units & added item to job sheet!`);

            // Automatically execute item addition in flow!
            const parsedQty = parseFloat(quantity) || 1;
            executeAddItem(updatedMasterItemData, parsedQty);
        } catch (err) {
            if (toast?.error) toast.error(err.message);
            else setError(err.message);
        } finally {
            setRestocking(false);
        }
    };

    const promptRemoveItem = (itemId) => {
        if (isReadOnly) return;
        setItemToRemove(itemId);
        setShowItemRemoveModal(true);
    };

    const confirmRemoveItem = () => {
        setAddedItems(prev => prev.filter(item => item.masterItemId !== itemToRemove));
        setShowItemRemoveModal(false);
        setItemToRemove(null);
    };

    const startEditing = (item) => {
        if (isReadOnly) return;
        setEditingItemId(item.masterItemId);
        setEditingQuantity(item.quantity.toString());
    };

    const cancelEditing = () => {
        setEditingItemId(null);
        setEditingQuantity('');
    };

    const saveEditing = (itemId) => {
        if (isReadOnly) return;
        const newQty = parseFloat(editingQuantity);
        if (isNaN(newQty) || newQty <= 0) {
            setValidationMessage("Please enter a valid quantity greater than 0.");
            setShowValidationModal(true);
            return;
        }
        const masterItemData = masterItems.find(item => item.id === itemId);
        if (!masterItemData) return;

        setAddedItems(prev => prev.map(item =>
            item.masterItemId === itemId
                ? { ...item, quantity: newQty, ...calculateLineTotals(masterItemData, newQty) }
                : item
        ));
        cancelEditing();
    };

    // --- API SUBMISSION HANDLERS ---
    const handleSaveOrFinalize = async (isFinalizingAction) => {
        if (isReadOnly) return;

        const errors = validateForm(isFinalizingAction);
        if (Object.keys(errors).length > 0) {
            const errorMsg = errors.items || errors.kmReading || "Please fix the form errors before proceeding.";
            setValidationMessage(errorMsg);
            setShowValidationModal(true);
            return; 
        }
        
        const actionStateSetter = isFinalizingAction ? setIsFinalizing : setIsSavingDraft;
        actionStateSetter(true);
        setError(null);

        const newStatus = isFinalizingAction ? 'Completed' : (jobSheetDetails?.status === 'In Progress' ? 'In Progress' : 'Draft');
        
        const payload = {
            kmReading: kmReading,
            notes: notes,
            status: newStatus,
            items: addedItems.map(item => ({
                masterItemId: item.masterItemId || item.master_item_id,
                quantity: item.quantity,
                unitPrice: item.unitPrice ?? item.unit_price ?? 0,
                lubeCharge: item.lubeCharge ?? item.lube_charge ?? 0,
                labourCharge: item.labourCharge ?? item.labour_charge ?? 0
            }))
        };

        try {
            const response = await api.put(`/jobsheets/${jobSheetId}/details`, payload);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred while saving.' }));
                throw new Error(errorData.message);
            }
            const updatedData = await response.json();

            setJobSheetDetails(prev => ({ ...prev, ...updatedData.jobSheet }));
            
            setSuccessMessage(`Job Sheet ${isFinalizingAction ? 'Finalized' : 'Saved'} Successfully!`);
            
            if (isFinalizingAction) {
                const flattenedJobSheetForInvoice = {
                    id: jobSheetDetails.id || jobSheetId,
                    jobSheetNumber: jobSheetDetails.jobSheetNumber,
                    job_sheet_number: jobSheetDetails.jobSheetNumber,
                    status: 'Completed',
                    notes: notes,
                    km_reading: kmReading,
                    date_completed: payload.dateCompleted,

                    customer_name: customerDetails?.name,
                    customer_address: customerDetails?.address,
                    customer_phone: customerDetails?.phone,
                    customerName: customerDetails?.name,
                    customerAddress: customerDetails?.address,
                    customerPhone: customerDetails?.phone,

                    make: vehicleDetails?.make,
                    model: vehicleDetails?.model,
                    year: vehicleDetails?.year,
                    car_number: vehicleDetails?.carNumber,
                    carNumber: vehicleDetails?.carNumber,
                    vin: vehicleDetails?.vin,

                    items: addedItems.map(item => ({
                        master_item_id: item.masterItemId,
                        masterItemId: item.masterItemId,
                        name: item.name,
                        part_no: item.partNo,
                        partNo: item.partNo,
                        quantity: Number(item.quantity),
                        line_parts: item.lineParts,
                        lineParts: item.lineParts,
                        line_lubes: item.lineLubes,
                        lineLubes: item.lineLubes,
                        line_labour: item.lineLabour,
                        lineLabour: item.lineLabour,
                        line_total: item.lineTotal,
                        lineTotal: item.lineTotal
                    })),

                    total_parts: totals.totalParts,
                    totalParts: totals.totalParts,
                    total_lubes: totals.totalLubes,
                    totalLubes: totals.totalLubes,
                    total_labour: totals.totalLabour,
                    totalLabour: totals.totalLabour,
                    grand_total: totals.grandTotal,
                    grandTotal: totals.grandTotal
                };

                setSuccessNavigation({ 
                    pathname: '/create-invoice', 
                    state: { 
                        finalizedJobSheet: flattenedJobSheetForInvoice,
                        items: addedItems,
                        customer: customerDetails 
                    } 
                });
            } else {
                setSuccessNavigation(null);
            }
            setShowSuccessModal(true);
            
        } catch (err) {
            console.error('Error saving job sheet:', err);
            setError(`Save Failed: ${err.message}`);
        } finally {
            actionStateSetter(false);
        }
    };

    const handleDeleteJobSheet = async () => {
        setIsDeleting(true);
        setError(null);
        try {
            const response = await api.delete(`/jobsheets/${jobSheetId}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to delete the job sheet.' }));
                throw new Error(errorData.message);
            }
            
            setShowDeleteModal(false);
            setSuccessMessage(`Job Sheet ${jobSheetDetails?.jobSheetNumber} has been permanently deleted.`);
            setSuccessNavigation({ pathname: '/jobsheets', state: null });
            setShowSuccessModal(true);
            
        } catch (err) {
            console.error("Error deleting job sheet:", err);
            setError(`Delete Failed: ${err.message}`);
            setShowDeleteModal(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const closeSuccessModal = () => {
        setShowSuccessModal(false);
        if (successNavigation) {
            navigate(successNavigation.pathname, { state: successNavigation.state });
        }
    };

    // --- RENDER LOGIC ---
    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner animation="border" variant="primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-2 text-muted">Loading Job Sheet Details...</p>
            </Container>
        );
    }
    
    if (!jobSheetDetails && !loading) {
        return (
            <Container className="py-5">
                <Alert variant="danger" className="shadow-sm">
                    <Alert.Heading>Error: Not Found</Alert.Heading>
                    <p>{error || 'The requested job sheet could not be found or you do not have permission to view it.'}</p>
                    <hr />
                    <Button variant="outline-secondary" onClick={() => navigate('/jobsheets')} size="sm">
                        <FaArrowLeft className="me-1" /> Back to Job Sheets List
                    </Button>
                </Alert>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4 px-lg-5 job-sheet-detail-page">
            
            <div className="d-none d-print-block mb-4 border-bottom pb-3">
                <Row className="align-items-center">
                    <Col xs={6}>
                        <h2 className="mb-0 fw-bold text-dark text-uppercase">Service Job Sheet</h2>
                    </Col>
                    <Col xs={6} className="text-end">
                        <h4 className="mb-1">#{jobSheetDetails.jobSheetNumber || jobSheetId}</h4>
                        <p className="mb-0 text-muted">Date: {formatDate(jobSheetDetails.dateCreated || jobSheetDetails.dateCompleted)}</p>
                    </Col>
                </Row>
            </div>

            <Row className="mb-4 align-items-center d-print-none">
                <Col xs="auto">
                    <Button variant="link" className="text-secondary text-decoration-none p-0" onClick={() => navigate(-1)} title="Go Back">
                        <FaArrowLeft className="me-1" /> Back
                    </Button>
                </Col>
                <Col>
                    <h1 className="h3 fw-bold text-dark mb-0">Job Sheet: {jobSheetDetails.jobSheetNumber || jobSheetId}</h1>
                </Col>
                <Col xs="auto" className="text-end">
                    <Badge pill bg={
                        { 'Completed': 'success', 'Invoiced': 'info', 'In Progress': 'warning', 'Draft': 'secondary' }[jobSheetDetails.status] || 'dark'
                    } className="fs-6 px-3 py-2 shadow-sm">
                        {jobSheetDetails.status}
                    </Badge>
                    {isReadOnly && <Badge pill bg="light" text="dark" className="ms-2 fs-6 px-3 py-2 border">Read Only</Badge>}
                </Col>
            </Row>

            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible className="shadow-sm d-print-none">{error}</Alert>}

            <div className="printable-section">
                <Card className="mb-4 shadow-sm border-print-0">
                    <Card.Header className="bg-light-subtle d-print-none">
                        <FaUser className="me-2 text-primary" />Customer & <FaCar className="ms-3 me-2 text-primary" />Vehicle Information
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col xs={12} sm={6} className="border-end mb-3 mb-sm-0">
                                <h5 className="h6 text-muted mb-3 text-uppercase fw-bold">Customer Details</h5>
                                <ListGroup variant="flush">
                                    <ListGroup.Item className="d-flex px-0 border-0 py-1"><FaUser className="me-2 mt-1 text-secondary" style={{ width: '16px' }} /><span className="fw-bold flex-fill">{customerDetails?.name || 'N/A'}</span></ListGroup.Item>
                                    <ListGroup.Item className="d-flex px-0 border-0 py-1"><FaPhone className="me-2 mt-1 text-secondary" style={{ width: '16px' }} /><span className="flex-fill">{customerDetails?.phone || 'N/A'}</span></ListGroup.Item>
                                    <ListGroup.Item className="d-flex px-0 border-0 py-1"><FaEnvelope className="me-2 mt-1 text-secondary" style={{ width: '16px' }} /><span className="flex-fill">{customerDetails?.email || 'N/A'}</span></ListGroup.Item>
                                    <ListGroup.Item className="d-flex px-0 border-0 py-1"><FaMapMarkerAlt className="me-2 mt-1 text-secondary" style={{ width: '16px' }} /><span className="flex-fill">{customerDetails?.address || 'N/A'}</span></ListGroup.Item>
                                </ListGroup>
                            </Col>
                            <Col xs={12} sm={6} className="ps-sm-4">
                                <h5 className="h6 text-muted mb-3 text-uppercase fw-bold">Vehicle Details</h5>
                                <ListGroup variant="flush">
                                    <ListGroup.Item className="d-flex px-0 border-0 py-1"><FaCar className="me-2 mt-1 text-secondary" style={{ width: '16px' }} /><span className="fw-bold flex-fill">{`${vehicleDetails?.make || ''} ${vehicleDetails?.model || ''}`}</span></ListGroup.Item>
                                    <ListGroup.Item className="d-flex px-0 border-0 py-1"><FaHashtag className="me-2 mt-1 text-secondary" style={{ width: '16px' }} /><span className="flex-fill">Reg No: <strong>{vehicleDetails?.carNumber || 'N/A'}</strong></span></ListGroup.Item>
                                    <ListGroup.Item className="d-flex px-0 border-0 py-1"><FaCalendarAlt className="me-2 mt-1 text-secondary" style={{ width: '16px' }} /><span className="flex-fill">Year: {vehicleDetails?.year || 'N/A'}</span></ListGroup.Item>
                                    <ListGroup.Item className="d-flex px-0 border-0 py-1"><FaBarcode className="me-2 mt-1 text-secondary" style={{ width: '16px' }} /><span className="flex-fill">VIN: {vehicleDetails?.vin || 'N/A'}</span></ListGroup.Item>
                                </ListGroup>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Card className="mb-4 shadow-sm border-print-0">
                    <Card.Header className="bg-light-subtle d-print-none"><FaTachometerAlt className="me-2 text-primary" />Job Details</Card.Header>
                    <Card.Body>
                        <Row>
                            <Col xs={12} sm={4} className="mb-3 mb-sm-0">
                                <Form.Group controlId="kmReading">
                                    <Form.Label className="fw-bold text-muted small text-uppercase">KM Reading</Form.Label>
                                    <InputGroup className="d-print-none">
                                        <InputGroup.Text><FaTachometerAlt /></InputGroup.Text>
                                        <Form.Control 
                                            ref={kmReadingRef}
                                            type="text" 
                                            value={kmReading} 
                                            onChange={(e) => setKmReading(e.target.value)} 
                                            onKeyDown={handleKmKeyDown}
                                            readOnly={isReadOnly} 
                                            placeholder="e.g., 45120" 
                                            disabled={isSavingDraft || isFinalizing} 
                                            isInvalid={!!validationErrors.kmReading}
                                        />
                                        <Form.Control.Feedback type="invalid">{validationErrors.kmReading}</Form.Control.Feedback>
                                    </InputGroup>
                                    <div className="d-none d-print-block fs-5 border rounded px-3 py-2">
                                        {kmReading || 'N/A'} KM
                                    </div>
                                </Form.Group>
                            </Col>
                            <Col xs={12} sm={8}>
                                <Form.Group controlId="notes">
                                    <Form.Label className="fw-bold text-muted small text-uppercase">Notes / Customer Request</Form.Label>
                                    <InputGroup className="d-print-none">
                                        <InputGroup.Text><FaStickyNote /></InputGroup.Text>
                                        <Form.Control 
                                            ref={notesRef}
                                            as="textarea" 
                                            rows={1} 
                                            value={notes} 
                                            onChange={(e) => setNotes(e.target.value)} 
                                            onKeyDown={handleNotesKeyDown}
                                            readOnly={isReadOnly} 
                                            placeholder="Technician notes or customer instructions... (Press Enter for items)" 
                                            disabled={isSavingDraft || isFinalizing} 
                                            style={{ minHeight: '38px' }} 
                                        />
                                    </InputGroup>
                                    <div className="d-none d-print-block border rounded px-3 py-2" style={{ minHeight: '80px' }}>
                                        {notes || <span className="text-muted fst-italic">No additional notes provided.</span>}
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Card className="shadow-sm border-print-0">
                    {!isReadOnly && (
                        <div className="d-print-none">
                            <Card.Header className="bg-light-subtle border-bottom-0 py-2 px-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                                <span className="fw-bold small text-muted text-uppercase">
                                    <FaPlus className="me-1 text-primary" /> Add Service / Spare Part
                                </span>
                                {selectedMasterItem && selectedMasterItem.type === 'Spare' && (
                                    <span>
                                        {selectedItemStockInfo.availableStock > 0 ? (
                                            <Badge bg="success" className="px-2 py-1">
                                                Available Stock: {selectedItemStockInfo.availableStock} units
                                            </Badge>
                                        ) : (
                                            <Badge bg={enforceStockValidation ? 'danger' : 'warning'} className="px-2 py-1">
                                                OUT OF STOCK ({selectedItemStockInfo.availableStock})
                                            </Badge>
                                        )}
                                    </span>
                                )}
                            </Card.Header>
                            <Card.Body className="p-3 bg-light-subtle border-top border-bottom">
                                <Row className="g-2 align-items-end">
                                     <Col lg={4} md={12} className="mb-2 mb-lg-0">
                                         <Form.Label htmlFor="itemSelect" className="fw-bold text-muted small text-uppercase mb-1" style={{ fontSize: '0.7rem' }}>Search Item / Service</Form.Label>
                                         <Select 
                                             ref={selectRef}
                                             id="itemSelect" 
                                             options={selectOptions} 
                                             value={currentSelectValue} 
                                             onChange={handleSelectChange} 
                                             inputValue={selectInputValue}
                                             onInputChange={(val, action) => {
                                                 if (action.action === 'input-change') {
                                                     setSelectInputValue(val);
                                                 } else if (action.action === 'set-value' || action.action === 'menu-close') {
                                                     setSelectInputValue('');
                                                 }
                                             }}
                                             onKeyDown={(e) => {
                                                 if (e.key === 'Enter' && selectInputValue.trim() && !selectedMasterItem) {
                                                     const query = selectInputValue.trim().toLowerCase();
                                                     const hasMatchingOption = selectOptions.some(opt => {
                                                         const labelStr = (opt.label || '').toLowerCase();
                                                         const nameStr = (opt.name || '').toLowerCase();
                                                         const partStr = (opt.partNo || opt.part_no || '').toLowerCase();
                                                         return labelStr.includes(query) || nameStr.includes(query) || partStr.includes(query);
                                                     });
                                                     if (!hasMatchingOption) {
                                                         e.preventDefault();
                                                         openNewItemModalWithSearch(selectInputValue.trim());
                                                     }
                                                 }
                                             }}
                                             noOptionsMessage={() => (
                                                 selectInputValue.trim() ? (
                                                     <div 
                                                         onClick={() => openNewItemModalWithSearch(selectInputValue.trim())}
                                                         className="text-primary fw-bold p-2 text-center"
                                                         style={{ cursor: 'pointer' }}
                                                     >
                                                         <FaPlus className="me-1" /> Add "{selectInputValue.trim()}" as new item
                                                     </div>
                                                 ) : "Type to search items..."
                                             )}
                                             placeholder="Type item or service name..." 
                                             isClearable 
                                             isDisabled={isSavingDraft || isFinalizing} 
                                             classNamePrefix="react-select" 
                                         />
                                     </Col>
                                     <Col lg={1.5} md={2} sm={3} xs={6}>
                                         <Form.Label htmlFor="quantityInput" className="fw-bold text-muted small text-uppercase mb-1" style={{ fontSize: '0.7rem' }}>Qty</Form.Label>
                                         <Form.Control 
                                             ref={qtyRef}
                                             id="quantityInput" 
                                             type="number" 
                                             step="any"
                                             value={quantity} 
                                             onChange={(e) => setQuantity(e.target.value)} 
                                             onKeyDown={handleQuantityKeyDown}
                                             disabled={!selectedMasterItem || isSavingDraft || isFinalizing} 
                                             placeholder="Qty" 
                                             style={{ height: '38px' }}
                                         />
                                     </Col>
                                     <Col lg={1.75} md={2} sm={3} xs={6}>
                                         <Form.Label htmlFor="rateInput" className="fw-bold text-muted small text-uppercase mb-1" style={{ fontSize: '0.7rem' }}>Parts (₹)</Form.Label>
                                         <Form.Control 
                                             ref={rateRef}
                                             id="rateInput" 
                                             type="number" 
                                             step="any"
                                             value={unitPrice} 
                                             onChange={(e) => setUnitPrice(e.target.value)} 
                                             onKeyDown={handleRateKeyDown}
                                             disabled={!selectedMasterItem || isSavingDraft || isFinalizing} 
                                             placeholder="Parts Rate" 
                                             style={{ height: '38px' }}
                                         />
                                     </Col>
                                     <Col lg={1.75} md={2} sm={3} xs={6}>
                                         <Form.Label htmlFor="lubeInput" className="fw-bold text-muted small text-uppercase mb-1" style={{ fontSize: '0.7rem' }}>Lubes (₹)</Form.Label>
                                         <Form.Control 
                                             ref={lubeRef}
                                             id="lubeInput" 
                                             type="number" 
                                             step="any"
                                             value={lubeCharge} 
                                             onChange={(e) => setLubeCharge(e.target.value)} 
                                             onKeyDown={handleLubeKeyDown}
                                             disabled={!selectedMasterItem || isSavingDraft || isFinalizing} 
                                             placeholder="Lubes Rate" 
                                             style={{ height: '38px' }}
                                         />
                                     </Col>
                                     <Col lg={1.75} md={2} sm={3} xs={6}>
                                         <Form.Label htmlFor="labourInput" className="fw-bold text-muted small text-uppercase mb-1" style={{ fontSize: '0.7rem' }}>Labour (₹)</Form.Label>
                                         <Form.Control 
                                             ref={labourRef}
                                             id="labourInput" 
                                             type="number" 
                                             step="any"
                                             value={labourCharge} 
                                             onChange={(e) => setLabourCharge(e.target.value)} 
                                             onKeyDown={handleLabourKeyDown}
                                             disabled={!selectedMasterItem || isSavingDraft || isFinalizing} 
                                             placeholder="Labour Rate" 
                                             style={{ height: '38px' }}
                                         />
                                     </Col>
                                     <Col lg={1.25} md={12} sm={12} xs={12}>
                                         <Button 
                                             variant="primary" 
                                             className="w-100 fw-bold shadow-xs d-flex align-items-center justify-content-center" 
                                             onClick={handleAddItem} 
                                             disabled={!selectedMasterItem || !quantity || parseFloat(quantity) === 0 || isSavingDraft || isFinalizing}
                                             style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', border: 'none', height: '38px' }}
                                         >
                                             <FaPlus className="me-1" /> Add
                                         </Button>
                                     </Col>
                                 </Row>
                            </Card.Body>
                        </div>
                    )}
                    <Card.Header className={`bg-light fw-bold text-uppercase ${!isReadOnly ? "border-top d-print-none" : ""}`}>
                        <h5 className="h6 mb-0 text-muted">Tasks & Required Parts</h5>
                    </Card.Header>
                    <Card.Body className="p-0" ref={tableEndRef}>
                        <div className="table-responsive">
                           <Table hover className="mb-0 align-middle jobsheet-items-table border-print-dark">
                                <thead className="table-light small text-uppercase text-secondary">
                                    <tr>
                                        <th className="py-2 px-3 text-center border-bottom border-dark" style={{ width: '5%' }}>#</th>
                                        <th className="py-2 px-3 border-bottom border-dark" style={{ width: '25%' }}>Part No.</th>
                                        <th className="py-2 px-3 border-bottom border-dark" style={{ width: '55%' }}>Description</th>
                                        <th className="py-2 px-3 text-center border-bottom border-dark" style={{ width: '15%' }}>Qty</th>
                                        
                                        <th className="py-2 px-3 text-end d-print-none" style={{ width: '10%' }}>Parts</th>
                                        <th className="py-2 px-3 text-end d-print-none" style={{ width: '10%' }}>Lubes</th>
                                        <th className="py-2 px-3 text-end d-print-none" style={{ width: '10%' }}>Labour</th>
                                        <th className="py-2 px-3 text-end fw-bold d-print-none" style={{ width: '10%' }}>Total</th>
                                        {!isReadOnly && <th className="py-2 px-3 text-center d-print-none" style={{ width: '5%' }}></th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(!addedItems || addedItems.length === 0) ? (
                                        <tr><td colSpan={isReadOnly ? 8 : 9} className="text-center text-muted py-5"><i>No items or services have been added yet.</i></td></tr>
                                    ) : (
                                        (addedItems || []).map((item, index) => (
                                            <tr key={item.masterItemId || index}>
                                                <td className="px-3 text-center text-muted small">{index + 1}</td>
                                                <td className="px-3 small">{item.partNo || '-'}</td>
                                                <td className="px-3">{item.name}</td>
                                                <td className="px-3 text-center fw-bold">
                                                    {editingItemId === item.masterItemId ? (
                                                        <InputGroup size="sm" className="w-auto mx-auto d-print-none" style={{ maxWidth: '150px' }}>
                                                            <Form.Control type="number" step="any" min="0.01" value={editingQuantity} onChange={(e) => setEditingQuantity(e.target.value)} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') saveEditing(item.masterItemId); if (e.key === 'Escape') cancelEditing(); }} />
                                                            <OverlayTrigger placement="top" overlay={<Tooltip>Save</Tooltip>}><Button variant="outline-success" size="sm" onClick={() => saveEditing(item.masterItemId)}><FaCheck /></Button></OverlayTrigger>
                                                            <OverlayTrigger placement="top" overlay={<Tooltip>Cancel</Tooltip>}><Button variant="outline-secondary" size="sm" onClick={cancelEditing}><FaTimes /></Button></OverlayTrigger>
                                                        </InputGroup>
                                                    ) : (
                                                        <>
                                                            <span className="d-inline-block align-middle me-1">{item.quantity}</span>
                                                            {!isReadOnly && (<Button variant="link" size="sm" className="p-0 edit-quantity-btn d-print-none align-middle" onClick={() => startEditing(item)} title="Edit Quantity"><FaPencilAlt className="text-muted small" /></Button>)}
                                                        </>
                                                    )}
                                                </td>
                                                
                                                <td className="px-3 text-end small d-print-none">{formatCurrency(item.lineParts)}</td>
                                                <td className="px-3 text-end small d-print-none">{formatCurrency(item.lineLubes)}</td>
                                                <td className="px-3 text-end small d-print-none">{formatCurrency(item.lineLabour)}</td>
                                                <td className="px-3 text-end fw-semibold d-print-none">{formatCurrency(item.lineTotal)}</td>
                                                {!isReadOnly && (
                                                    <td className="px-3 text-center d-print-none">
                                                        <OverlayTrigger placement="top" overlay={<Tooltip>Remove Item</Tooltip>}><Button variant="link" size="sm" className="text-danger p-0" onClick={() => promptRemoveItem(item.masterItemId)} disabled={isSavingDraft || isFinalizing}><FaTrash /></Button></OverlayTrigger>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {addedItems.length > 0 && (
                                    <tfoot className="border-top d-print-none">
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
                                            {!isReadOnly && <td className="d-print-none"></td>}
                                        </tr>
                                    </tfoot>
                                )}
                            </Table>
                        </div>
                        <div ref={tableEndRef} />
                    </Card.Body>
                </Card>

                <div className="d-none d-print-block mt-5 pt-5">
                    <Row>
                        <Col xs={6} className="text-center">
                            <div className="border-top border-dark d-inline-block pt-2" style={{ width: '200px' }}>
                                Customer Signature
                            </div>
                        </Col>
                        <Col xs={6} className="text-center">
                            <div className="border-top border-dark d-inline-block pt-2" style={{ width: '200px' }}>
                                Technician Signature
                            </div>
                        </Col>
                    </Row>
                </div>
            </div>

            <div className="mt-4 d-flex justify-content-between align-items-center gap-2 flex-wrap d-print-none">
                <div>
                    {!isReadOnly && (
                        <Button variant="outline-danger" onClick={() => setShowDeleteModal(true)} disabled={isSavingDraft || isFinalizing || isDeleting} size="sm">
                            <FaTrash className="me-1" /> Delete Job Sheet
                        </Button>
                    )}
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-secondary" onClick={() => window.print()} disabled={isSavingDraft || isFinalizing || isDeleting} size="sm"><FaPrint className="me-1" /> Print</Button>
                    {!isReadOnly && (
                        <>
                            <Button variant="outline-primary" onClick={() => handleSaveOrFinalize(false)} disabled={isSavingDraft || isFinalizing || isDeleting} size="sm">
                                {isSavingDraft ? <><Spinner as="span" size="sm" animation="border" className="me-1" /> Saving...</> : <><FaSave className="me-1" /> Save Draft</>}
                            </Button>
                            <Button variant="success" onClick={() => handleSaveOrFinalize(true)} disabled={isFinalizing || isSavingDraft || isDeleting || addedItems.length === 0} size="sm">
                                {isFinalizing ? <><Spinner as="span" size="sm" animation="border" className="me-1" /> Finalizing...</> : <><FaCheckSquare className="me-1" /> Finalize & Proceed</>}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* ========================== MODALS ========================== */}
            <Modal show={showItemRemoveModal} onHide={() => setShowItemRemoveModal(false)} centered backdrop="static" size="sm">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="h6 text-danger"><FaTrash className="me-2"/>Remove Item?</Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-3">
                    Are you sure you want to remove this item from the job sheet?
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="outline-secondary" size="sm" onClick={() => setShowItemRemoveModal(false)}>Cancel</Button>
                    <Button variant="danger" size="sm" onClick={confirmRemoveItem}>Remove</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showValidationModal} onHide={() => setShowValidationModal(false)} centered backdrop="static" size="sm">
                <Modal.Header closeButton className="bg-warning text-dark border-0">
                    <Modal.Title className="h6"><FaExclamationTriangle className="me-2"/>Missing Information</Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-4">
                    {validationMessage}
                </Modal.Body>
                <Modal.Footer className="border-0 bg-light">
                    <Button variant="secondary" className="w-100" onClick={() => setShowValidationModal(false)}>Okay</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered backdrop="static">
                <Modal.Header closeButton className="bg-light border-0">
                    <Modal.Title className="h5 text-danger"><FaExclamationTriangle className="me-2"/>Confirm Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-4">
                    <p>Are you sure you want to permanently delete Job Sheet <strong>{jobSheetDetails?.jobSheetNumber}</strong>?</p>
                    <Alert variant="warning" className="mb-0 small shadow-sm">
                        This is a <strong>Hard Delete</strong>. All linked parts, services, and calculations will be permanently wiped from the database. This cannot be undone.
                    </Alert>
                </Modal.Body>
                <Modal.Footer className="border-0 bg-light">
                    <Button variant="outline-secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>Cancel</Button>
                    <Button variant="danger" onClick={handleDeleteJobSheet} disabled={isDeleting}>
                        {isDeleting ? <><Spinner as="span" size="sm" animation="border" className="me-1" /> Deleting...</> : "Yes, Delete Permanently"}
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showSuccessModal} onHide={closeSuccessModal} centered backdrop="static">
                <Modal.Body className="text-center py-5">
                    <div className="mb-3">
                        <div className="rounded-circle bg-success bg-opacity-10 d-inline-flex p-3">
                            <FaCheck className="text-success fs-1" />
                        </div>
                    </div>
                    <h4 className="fw-bold mb-3">Success!</h4>
                    <p className="text-muted mb-4">
                        {successMessage}
                    </p>
                    <Button variant="success" size="lg" className="px-5" onClick={closeSuccessModal}>
                        Okay
                    </Button>
                </Modal.Body>
            </Modal>

            {/* Modal: Add New Item to Master Inventory In-Place */}
            <Modal show={showNewItemModal} onHide={() => setShowNewItemModal(false)} centered size="lg">
                <Form onSubmit={handleCreateNewItem}>
                    <Modal.Header closeButton className="bg-light">
                        <Modal.Title className="h5 fw-bold text-dark d-flex align-items-center gap-2">
                            <FaBoxes className="text-primary" /> Add New Item to Master Inventory
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md={8}>
                                <Form.Label className="fw-bold small">Item Name *</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. Engine Oil 5W30, Brake Pad Front"
                                    value={newItemForm.name}
                                    onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                                    required
                                />
                            </Col>
                            <Col md={4}>
                                <Form.Label className="fw-bold small">Type</Form.Label>
                                <Form.Select
                                    value={newItemForm.type}
                                    onChange={(e) => setNewItemForm({ ...newItemForm, type: e.target.value })}
                                >
                                    <option value="Spare">Spare Part</option>
                                    <option value="Service">Service / Labour</option>
                                </Form.Select>
                            </Col>
                            <Col md={6}>
                                <Form.Label className="fw-bold small">Part No. (Optional)</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. PART-9921"
                                    value={newItemForm.partNo}
                                    onChange={(e) => setNewItemForm({ ...newItemForm, partNo: e.target.value })}
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="fw-bold small">Unit Price (₹)</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={newItemForm.unitPrice}
                                    onChange={(e) => setNewItemForm({ ...newItemForm, unitPrice: e.target.value })}
                                />
                            </Col>
                            {newItemForm.type === 'Spare' && (
                                <Col md={4}>
                                    <Form.Label className="fw-bold small">Initial Stock Qty</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="any"
                                        placeholder="10"
                                        value={newItemForm.stockQty}
                                        onChange={(e) => setNewItemForm({ ...newItemForm, stockQty: e.target.value })}
                                    />
                                </Col>
                            )}
                            <Col md={4}>
                                <Form.Label className="fw-bold small">Lube Charge (₹)</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={newItemForm.lubeCharge}
                                    onChange={(e) => setNewItemForm({ ...newItemForm, lubeCharge: e.target.value })}
                                />
                            </Col>
                            <Col md={4}>
                                <Form.Label className="fw-bold small">Labour Charge (₹)</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={newItemForm.labourCharge}
                                    onChange={(e) => setNewItemForm({ ...newItemForm, labourCharge: e.target.value })}
                                />
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer className="bg-light">
                        <Button variant="secondary" onClick={() => setShowNewItemModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={savingNewItem}>
                            {savingNewItem ? <Spinner size="sm" animation="border" /> : <><FaCheck className="me-1" /> Save & Select Item</>}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modal: Quick Restock Quantity */}
            <Modal show={showRestockModal} onHide={() => setShowRestockModal(false)} centered>
                <Form onSubmit={handleQuickRestock}>
                    <Modal.Header closeButton className="bg-success text-white">
                        <Modal.Title className="h6 fw-bold mb-0 d-flex align-items-center gap-2">
                            <FaBolt /> Insufficient Stock — Quick Restock: {selectedMasterItem?.name}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="py-3">
                        <Alert variant="warning" className="small py-2 mb-3 shadow-sm">
                            {selectedItemStockInfo.draftedQty > 0 ? (
                                <>
                                    Item <strong>{selectedMasterItem?.name}</strong> has <strong>{selectedItemStockInfo.totalStock}</strong> units in stock, but your job sheet requires <strong>{(selectedItemStockInfo.draftedQty + parseFloat(quantity || 0))}</strong> units total (<strong>{selectedItemStockInfo.draftedQty}</strong> already drafted + <strong>{quantity}</strong> new).
                                </>
                            ) : (
                                <>
                                    Item <strong>{selectedMasterItem?.name}</strong> has only <strong>{selectedItemStockInfo.totalStock}</strong> units in stock (you requested <strong>{quantity}</strong>).
                                </>
                            )}
                        </Alert>
                        <Form.Group controlId="restockInput">
                            <Form.Label className="fw-bold small text-muted">Enter Units to Add to Stock</Form.Label>
                            <Form.Control
                                type="number"
                                step="any"
                                min="0.01"
                                value={restockQty}
                                onChange={(e) => setRestockQty(e.target.value)}
                                required
                                autoFocus
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="bg-light d-flex justify-content-between">
                        <Button 
                            variant="outline-warning" 
                            size="sm" 
                            className="fw-bold text-dark me-auto" 
                            onClick={handleBypassStockValidationFromModal}
                        >
                            ⚡ Disable Validation & Add Item
                        </Button>
                        <div>
                            <Button variant="secondary" size="sm" onClick={() => setShowRestockModal(false)} className="me-2">Cancel</Button>
                            <Button variant="success" size="sm" type="submit" disabled={restocking} className="fw-bold">
                                {restocking ? <Spinner size="sm" animation="border" /> : <><FaCheck className="me-1" /> Restock & Add</>}
                            </Button>
                        </div>
                    </Modal.Footer>
                </Form>
            </Modal>

        </Container>
    );
};

export default JobSheetDetailPage;