// src/data/staticData.js

// --- Helper Functions ---
const getDateDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
};

// Helper to calculate totals (essential for consistency)
const calculateInvoiceTotals = (items, discount = { type: null, value: 0 }, taxRate = 0) => {
    let totalParts = 0;
    let totalLubes = 0;
    let totalLabour = 0;

    items.forEach(item => {
        totalParts += Number(item.lineParts) || 0;
        totalLubes += Number(item.lineLubes) || 0;
        totalLabour += Number(item.lineLabour) || 0;
    });

    const subTotal = totalParts + totalLubes + totalLabour;

    let discountAmount = 0;
    if (discount.type === 'Percent' && Number(discount.value) > 0) {
        discountAmount = (subTotal * Number(discount.value)) / 100;
    } else if (discount.type === 'Fixed' && Number(discount.value) > 0) {
        discountAmount = Number(discount.value);
    }
    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subTotal);


    // Ensure taxable amount is not negative
    const taxableAmount = Math.max(0, subTotal - discountAmount);

    const taxAmount = parseFloat(((taxableAmount * Number(taxRate)) / 100).toFixed(2));
    const grandTotal = parseFloat((taxableAmount + taxAmount).toFixed(2));

    return {
        totalParts: parseFloat(totalParts.toFixed(2)),
        totalLubes: parseFloat(totalLubes.toFixed(2)),
        totalLabour: parseFloat(totalLabour.toFixed(2)),
        subTotal: parseFloat(subTotal.toFixed(2)),
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        taxAmount: taxAmount,
        grandTotal: grandTotal,
        // Also return intermediate for display if needed
        amountBeforeTax: parseFloat(taxableAmount.toFixed(2)),
    };
};


// --- Customers ---
// Use 'let' so we can modify these arrays directly in this simulation
export let initialCustomers = [
    { id: 'C1001', name: 'Tej Kothadiya', phone: '9876543210', email: 'tej@example.com', city: 'Surat', address: '123 Diamond St' },
    { id: 'C1002', name: 'Savan Moradiya', phone: '8765432109', email: 'savan@example.com', city: 'Ahmedabad', address: '456 Textile Rd' },
    { id: 'C1003', name: 'Priya Patel', phone: '7654321098', email: 'priya@example.com', city: 'Vadodara', address: '789 Pharma Ln' },
];

// --- Vehicles ---
export let initialVehicles = [
    { id: 'V2001', customerId: 'C1001', carNumber: 'GJ23BD7498', make: 'Honda', model: 'Civic', year: 2019, vin: 'ABC123XYZ' },
    { id: 'V2002', customerId: 'C1002', carNumber: 'GJ23BD7499', make: 'Toyota', model: 'Corolla', year: 2020, vin: 'DEF456ABC' },
    { id: 'V2003', customerId: 'C1003', carNumber: 'GJ05AB1234', make: 'Maruti Suzuki', model: 'Swift', year: 2021, vin: 'GHI789DEF' },
    { id: 'V2004', customerId: 'C1001', carNumber: 'GJ01XY5678', make: 'Honda', model: 'City', year: 2018, vin: 'JKL012GHI' },
];

// --- Master Items ---
export let initialMasterItems = [
    // Services
    { id: 'S001', name: 'Engine Oil Change (Synthetic)', partNo: 'SVC-OIL-SYN', type: 'Service', costPrice: 0, unitPrice: 1800, lubeCharge: 250, labourCharge: 300, stockQty: null },
    { id: 'S002', name: 'General Service Checkup', partNo: 'SVC-GEN-CHK', type: 'Service', costPrice: 0, unitPrice: 0, lubeCharge: 0, labourCharge: 1200, stockQty: null },
    // ... other services
    // Spares (Ensure costPrice is present)
    { id: 'P001', name: 'Air Filter - Honda Civic', partNo: 'HF-AF-17220', type: 'Spare', costPrice: 300, unitPrice: 450, lubeCharge: 0, labourCharge: 50, stockQty: 8 },
    { id: 'P002', name: 'Oil Filter - Honda Civic', partNo: 'HF-OF-15400', type: 'Spare', costPrice: 210, unitPrice: 300, lubeCharge: 0, labourCharge: 0, stockQty: 25 },
    { id: 'P003', name: 'Brake Pad Set (Front) - Generic', partNo: 'GEN-BP-F01', type: 'Spare', costPrice: 1750, unitPrice: 2500, lubeCharge: 0, labourCharge: 450, stockQty: 15 },
    { id: 'P004', name: 'Wiper Blade (Pair) - Bosch', partNo: 'BCH-WB-2216', type: 'Spare', costPrice: 480, unitPrice: 650, lubeCharge: 0, labourCharge: 0, stockQty: 3 },
    { id: 'P007', name: 'Coolant (1L) - Generic', partNo: 'GEN-CLT-1L', type: 'Spare', costPrice: 250, unitPrice: 350, lubeCharge: 0, labourCharge: 0, stockQty: 30 },
    { id: 'P008', name: 'Spark Plug - NGK BKR6E-11', partNo: 'NGK-SP-BKR6E', type: 'Spare', costPrice: 100, unitPrice: 150, lubeCharge: 0, labourCharge: 75, stockQty: 0 },
    { id: 'P009', name: 'Headlight Bulb H4 - Philips', partNo: 'PHP-BLB-H4', type: 'Spare', costPrice: 180, unitPrice: 250, lubeCharge: 0, labourCharge: 100, stockQty: 12 },
    { id: 'S006', name: 'Car Wash (Exterior & Interior)', partNo: 'SVC-WASH', type: 'Service', costPrice: 0, unitPrice: 100, lubeCharge: 0, labourCharge: 650, stockQty: null }, // Added S006 for invoice 3
];

export let initialSuppliers = [
    { id: 'SUP001', name: 'Reliable Auto Spares', contactPerson: 'Mr. Sharma', phone: '9123456780', city: 'Surat' },
    { id: 'SUP002', name: 'Bosch Authorized Dealer', contactPerson: 'Ms. Gupta', phone: '9234567891', city: 'Ahmedabad' },
    { id: 'SUP003', name: 'General Parts Co.', contactPerson: '', phone: '9345678902', city: 'Vadodara' },
];

export const LOW_STOCK_THRESHOLD = 10;
let nextMasterItemIdSuffix = 10;
let nextPurchaseBillId = 2;
let nextSupplierId = 4;

export const carMakes = [
    { id: 'make_honda', name: 'Honda' },
    { id: 'make_maruti', name: 'Maruti Suzuki' },
    { id: 'make_toyota', name: 'Toyota' },
    { id: 'make_hyundai', name: 'Hyundai' },
    { id: 'make_tata', name: 'Tata' },
    { id: 'make_mahindra', name: 'Mahindra' },
    { id: 'make_bmw', name: 'BMW' },
    { id: 'make_mercedes', name: 'Mercedes-Benz' },
    { id: 'make_audi', name: 'Audi' },
    // Add many more makes...
];

// Structured models (maps models to makes)
// Use the make *name* for easier matching in the component for now
export const carModels = [
    { makeName: 'Honda', models: ['Civic', 'City', 'Accord', 'CR-V', 'Amaze', 'Jazz', 'WR-V'] },
    { makeName: 'Maruti Suzuki', models: ['Swift', 'Baleno', 'Dzire', 'Wagon R', 'Alto 800', 'Alto K10', 'Ertiga', 'Brezza', 'S-Presso', 'Celerio', 'Ignis', 'XL6'] },
    { makeName: 'Toyota', models: ['Corolla', 'Camry', 'Fortuner', 'Innova Crysta', 'Glanza', 'Urban Cruiser', 'Yaris'] },
    { makeName: 'Hyundai', models: ['i20', 'Creta', 'Venue', 'Verna', 'Grand i10 Nios', 'Aura', 'Santro', 'Alcazar', 'Tucson'] },
    { makeName: 'Tata', models: ['Nexon', 'Altroz', 'Harrier', 'Safari', 'Punch', 'Tiago', 'Tigor'] },
    { makeName: 'Mahindra', models: ['XUV700', 'Thar', 'Scorpio-N', 'Scorpio Classic', 'Bolero', 'Bolero Neo', 'XUV300'] },
    { makeName: 'BMW', models: ['3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X7'] },
    { makeName: 'Mercedes-Benz', models: ['C-Class', 'E-Class', 'S-Class', 'GLA', 'GLC', 'GLE', 'GLS'] },
    { makeName: 'Audi', models: ['A4', 'A6', 'Q3', 'Q5', 'Q7', 'e-tron'] },
    // Add many more models linked to makes...
];

export const vehicleColors = ['White', 'Black', 'Silver', 'Grey', 'Red', 'Blue', 'Brown', 'Beige', 'Green', 'Yellow', 'Orange', 'Purple', 'Other'];
export const fuelTypes = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'LPG'];

export const getCarMakes = () => JSON.parse(JSON.stringify(carMakes));
export const getCarModelsByMake = (makeName) => {
    const makeData = carModels.find(m => m.makeName === makeName);
    return makeData ? JSON.parse(JSON.stringify(makeData.models)) : []; // Return copy
};
export const getVehicleColors = () => [...vehicleColors]; // Simple array copy
export const getFuelTypes = () => [...fuelTypes];
export const getSuppliers = () => JSON.parse(JSON.stringify(initialSuppliers)); // New Getter

export const addMasterItem = (itemData) => {
    try {
       const prefix = itemData.type === 'Spare' ? 'P' : 'S';
       // Basic check for uniqueness (in real app, backend handles this)
       if (initialMasterItems.some(i => i.partNo === itemData.partNo && itemData.partNo)) {
           console.warn("Part No already exists:", itemData.partNo);
          // return null; // Or handle differently
       }
       const newId = `${prefix}${String(nextMasterItemIdSuffix++).padStart(3, '0')}`;
       const newItem = {
           unitPrice: 0, lubeCharge: 0, labourCharge: 0, stockQty: null, // Defaults
           ...itemData,
           id: newId,
           // Ensure numerical values are stored as numbers
           unitPrice: Number(itemData.unitPrice) || 0,
           lubeCharge: Number(itemData.lubeCharge) || 0,
           labourCharge: Number(itemData.labourCharge) || 0,
           stockQty: itemData.type === 'Spare' ? (Number(itemData.stockQty) || 0) : null
       };
       initialMasterItems.push(newItem);
       console.log("Simulated Add Master Item:", newItem);
       return { ...newItem };
    } catch (error) {
        console.error("Error adding master item:", error);
        return null;
    }
};

export const updateMasterItem = (itemId, updatedData) => {
    try {
        const index = initialMasterItems.findIndex(i => i.id === itemId);
        if (index !== -1) {
            const originalItem = initialMasterItems[index];
             // Basic check for uniqueness on update (if partNo changes)
            if (updatedData.partNo && updatedData.partNo !== originalItem.partNo && initialMasterItems.some(i => i.partNo === updatedData.partNo && i.id !== itemId)) {
                console.warn("Part No already exists:", updatedData.partNo);
                // return null; // Or handle error state
            }

            initialMasterItems[index] = {
                ...originalItem,
                ...updatedData,
                id: itemId, // Ensure ID doesn't change
                // Ensure numerical values
                unitPrice: Number(updatedData.unitPrice) || 0,
                lubeCharge: Number(updatedData.lubeCharge) || 0,
                labourCharge: Number(updatedData.labourCharge) || 0,
                // Only update stockQty if type is Spare, otherwise keep it null
                stockQty: updatedData.type === 'Spare' ? (Number(updatedData.stockQty) ?? originalItem.stockQty ?? 0) : null
            };
            // If type changed from Spare to Service, nullify stock
            if (originalItem.type === 'Spare' && updatedData.type === 'Service') {
                initialMasterItems[index].stockQty = null;
            }

            console.log("Simulated Update Master Item:", initialMasterItems[index]);
            return { ...initialMasterItems[index] };
        }
        console.warn("Simulated Update Master Item: ID not found", itemId);
        return null;
    } catch (error) {
        console.error("Error updating master item:", error);
        return null;
    }
};

export const deleteMasterItemById = (itemId) => {
    try {
        const initialLength = initialMasterItems.length;
        initialMasterItems = initialMasterItems.filter(i => i.id !== itemId);
        // In real app: Check if item is used in active jobsheets/invoices before deleting
        const success = initialMasterItems.length < initialLength;
        console.log(`Simulated Delete Master Item: ${itemId}. Success: ${success}`);
        return success;
    } catch (error) {
        console.error("Error deleting master item:", error);
        return false;
    }
};

export const findMasterItemById = (id) => {
    const item = initialMasterItems.find(i => i.id === id);
    return item ? { ...item } : null; // Return copy
};
export const findPurchaseBillById = (id) => { // New finder
    const bill = initialPurchaseBills.find(pb => pb.id === id);
    return bill ? { ...bill } : null;
};

export let initialPurchaseBills = [
    // Example structure - add more if needed for testing
    {
        id: 'PB-001',
        supplierId: 'SUP001', // Added supplierId
        supplierName: 'Reliable Auto Spares',
        billNumber: 'RAS-INV-9876',
        billDate: getDateDaysAgo(15),
        items: [
            { masterItemId: 'P002', quantity: 50, purchasePrice: 220.50 },
            { masterItemId: 'P003', quantity: 10, purchasePrice: 1800.00 },
        ],
        totalAmount: (50 * 220.50) + (10 * 1800), // Example calculation
        notes: 'Stock replenishment order',
        dateRecorded: getDateDaysAgo(14) // When it was entered in system
    }
];

export const getPurchaseBills = () => JSON.parse(JSON.stringify(initialPurchaseBills));

export const addPurchaseBill = (billData) => {
    try {
        // Ensure supplierId exists now instead of supplierName
        if (!billData.supplierId || !billData.billNumber || !billData.billDate) {
            throw new Error("Supplier, Bill Number, and Bill Date are required.");
        }
        if (!billData || !billData.items || billData.items.length === 0) {
            throw new Error("Purchase bill must contain items.");
        }
        const supplier = findSupplierById(billData.supplierId); // Verify supplier exists
        if (!supplier) throw new Error(`Supplier with ID ${billData.supplierId} not found.`);

        const newId = `PB-${String(nextPurchaseBillId++).padStart(3, '0')}`;
        const dateRecorded = new Date().toISOString().split('T')[0];

        // *** CORRECTED: Calculate total based on items provided ***
        const calculatedTotal = billData.items.reduce((sum, item) => {
             const qty = Number(item.quantity) || 0;
             const price = Number(item.purchasePrice) || 0;
             return sum + (qty * price);
        }, 0);

        const newBill = {
            notes: '',
            supplierName: supplier.name, // Store name for easy display later
            ...billData, // includes supplierId
            id: newId,
            dateRecorded: dateRecorded,
            totalAmount: parseFloat(calculatedTotal.toFixed(2)) // Use calculated total
        };

        let stockUpdateErrors = [];
        newBill.items.forEach(billItem => {
            const itemIndex = initialMasterItems.findIndex(master => master.id === billItem.masterItemId);
            if (itemIndex !== -1) {
                const masterItem = initialMasterItems[itemIndex];
                if (masterItem.type === 'Spare') {
                    const quantityToAdd = Number(billItem.quantity);
                    const purchasePrice = Number(billItem.purchasePrice);
                    if (!isNaN(quantityToAdd) && quantityToAdd > 0) {
                        masterItem.stockQty = (Number(masterItem.stockQty) || 0) + quantityToAdd;
                        // Update Master Cost Price (Last Purchase Price)
                        if (!isNaN(purchasePrice) && purchasePrice >= 0) {
                            masterItem.costPrice = purchasePrice;
                        } else {
                             stockUpdateErrors.push(`Invalid purchase price (${billItem.purchasePrice}) for item ${masterItem.name}. Cost price not updated.`);
                        }
                    } else {
                        stockUpdateErrors.push(`Invalid quantity (${billItem.quantity}) for item ${masterItem.name}. Stock not updated.`);
                    }
                }
                // Note: Service type items don't affect stock or cost price here
            } else {
                 stockUpdateErrors.push(`Master item with ID ${billItem.masterItemId} not found. Stock not updated.`);
            }
        });

        if (stockUpdateErrors.length > 0) console.warn("Warnings during stock update:", stockUpdateErrors);

        initialPurchaseBills.push(newBill);
        console.log("Simulated Add Purchase Bill:", newBill);
        return { bill: { ...newBill }, errors: stockUpdateErrors };

    } catch (error) {
        console.error("Error adding purchase bill:", error);
        return { bill: null, errors: [error.message] };
    }
};

export const addSupplier = (supplierData) => {
    try {
        if (!supplierData.name || !supplierData.phone) {
            throw new Error("Supplier Name and Phone are required.");
        }
        const newId = `SUP${String(nextSupplierId++).padStart(3, '0')}`;
        const newSupplier = {
            contactPerson: '', city: '', // Defaults
            ...supplierData,
            id: newId
        };
        initialSuppliers.push(newSupplier);
        console.log("Simulated Add Supplier:", newSupplier);
        return { ...newSupplier };
    } catch (error) {
        console.error("Error adding supplier:", error);
        return null;
    }
};
export const findSupplierById = (id) => { // New finder
    const supplier = initialSuppliers.find(s => s.id === id);
    return supplier ? { ...supplier } : null;
};



// --- Job Sheets ---
export let initialJobSheets = [
    // Job Sheet for Invoice 1
    {
        id: 'JS101',
        jobSheetNumber: 'JS-00101',
        vehicleId: 'V2001',
        customerId: 'C1001',
        dateCreated: '2024-02-15',
        dateCompleted: '2024-02-16',
        kmReading: '25000',
        status: 'Invoiced',
        notes: 'Engine light check, oil change.',
        nextServiceKm: "35000",
        serviceReminderSent: false, // <-- ADD THIS LINE
        items: [
            { masterItemId: 'S001', name: 'Engine Oil Change (Synthetic)', partNo: 'SVC-OIL-SYN', quantity: 1, unitPrice: 1800, lubeCharge: 250, labourCharge: 300, lineParts: 1800, lineLubes: 250, lineLabour: 300, lineTotal: 2350 },
            { masterItemId: 'P002', name: 'Oil Filter - Honda Civic', partNo: 'HF-OF-15400', quantity: 1, unitPrice: 300, lubeCharge: 0, labourCharge: 0, lineParts: 300, lineLubes: 0, lineLabour: 0, lineTotal: 300 }
        ],
        totalParts: 2100, totalLubes: 250, totalLabour: 300, grandTotal: 2650
    },
    // Job Sheet for Invoice 2
     {
        id: 'JS102',
        jobSheetNumber: 'JS-00102',
        vehicleId: 'V2002',
        customerId: 'C1002',
        dateCreated: '2024-01-10',
        dateCompleted: '2024-01-11',
        kmReading: '40000',
        status: 'Invoiced',
        notes: 'Annual service.',
        nextServiceKm: "50000",
        serviceReminderSent: false, // <-- ADD THIS LINE
        items: [
             { masterItemId: 'S002', name: 'General Service Checkup', partNo: 'SVC-GEN-CHK', quantity: 1, unitPrice: 0, lubeCharge: 0, labourCharge: 1200, lineParts: 0, lineLubes: 0, lineLabour: 1200, lineTotal: 1200 },
             { masterItemId: 'P007', name: 'Coolant (1L) - Generic', partNo: 'GEN-CLT-1L', quantity: 1, unitPrice: 350, lubeCharge: 0, labourCharge: 0, lineParts: 350, lineLubes: 0, lineLabour: 0, lineTotal: 350 }
        ],
        totalParts: 350, totalLubes: 0, totalLabour: 1200, grandTotal: 1550
     },
     // Job Sheet for Invoice 3
     {
        id: 'JS103',
        jobSheetNumber: 'JS-00103',
        vehicleId: 'V2003',
        customerId: 'C1003',
        dateCreated: '2024-03-01',
        dateCompleted: '2024-03-01',
        kmReading: '15000',
        status: 'Invoiced',
        notes: 'Wash requested.',
        nextServiceKm: "25000",
        serviceReminderSent: false, // <-- ADD THIS LINE
        items: [
             { masterItemId: 'S006', name: 'Car Wash (Exterior & Interior)', partNo: 'SVC-WASH', quantity: 1, unitPrice: 100, lubeCharge: 0, labourCharge: 650, lineParts: 100, lineLubes: 0, lineLabour: 650, lineTotal: 750 }
        ],
        totalParts: 100, totalLubes: 0, totalLabour: 650, grandTotal: 750
    },
    // Job Sheet not yet invoiced
     {
        id: 'JS104',
        jobSheetNumber: 'JS-00104',
        vehicleId: 'V2004',
        customerId: 'C1001',
        dateCreated: '2024-03-10',
        dateCompleted: null,
        kmReading: '55000',
        status: 'In Progress',
        notes: 'Check brakes, slight noise.',
        nextServiceKm: null,
        serviceReminderSent: false, // <-- ADD THIS LINE
        items: [
             { masterItemId: 'P003', name: 'Brake Pad Set (Front) - Generic', partNo: 'GEN-BP-F01', quantity: 1, unitPrice: 2500, lubeCharge: 0, labourCharge: 450, lineParts: 2500, lineLubes: 0, lineLabour: 450, lineTotal: 2950 }
        ],
        totalParts: 2500, totalLubes: 0, totalLabour: 450, grandTotal: 2950
    },
];

// --- Invoices ---
export let initialInvoices = [
    // Invoice based on JS101
    {
        id: 'INV-2024-101', invoiceNumber: 'INV-2024-101', jobSheetId: 'JS101',
        dateIssued: getDateDaysAgo(20), dueDate: getDateDaysAgo(-10),
        customerId: 'C1001', vehicleId: 'V2001', kmReading: '25000',
        billBookNo: 'BBK-A/01', jcNo: 'JC-0101',
        items: [
            { masterItemId: 'S001', name: 'Engine Oil Change (Synthetic)', partNo: 'SVC-OIL-SYN', quantity: 1, unitPrice: 1800, lubeCharge: 250, labourCharge: 300, lineParts: 1800, lineLubes: 250, lineLabour: 300, lineTotal: 2350 },
            { masterItemId: 'P002', name: 'Oil Filter - Honda Civic', partNo: 'HF-OF-15400', quantity: 1, unitPrice: 300, lubeCharge: 0, labourCharge: 0, lineParts: 300, lineLubes: 0, lineLabour: 0, lineTotal: 300 }
        ],
        discountType: null, discountValue: 0, taxRate: 18,
        ...calculateInvoiceTotals([
            { masterItemId: 'S001', lineParts: 1800, lineLubes: 250, lineLabour: 300 },
            { masterItemId: 'P002', lineParts: 300, lineLubes: 0, lineLabour: 0 }
        ], { type: null, value: 0 }, 18),
        paymentRecords: [
            { id: 'pay-1', datePaid: getDateDaysAgo(18), amountPaid: 3127.00, paymentMethod: 'UPI', notes: 'Full payment via GPay.' }
        ],
        status: 'Paid',
        bankBranch: 'BORSAD', bankAccountNo: '07492000002739', bankIfsc: 'HDFC0000749',
    },
    // Invoice based on JS102
    {
        id: 'INV-2024-102', invoiceNumber: 'INV-2024-102', jobSheetId: 'JS102',
        dateIssued: getDateDaysAgo(60), dueDate: getDateDaysAgo(30),
        customerId: 'C1002', vehicleId: 'V2002', kmReading: '40000',
        billBookNo: 'BBK-A/02', jcNo: 'JC-0102',
        items: [
             { masterItemId: 'S002', name: 'General Service Checkup', partNo: 'SVC-GEN-CHK', quantity: 1, unitPrice: 0, lubeCharge: 0, labourCharge: 1200, lineParts: 0, lineLubes: 0, lineLabour: 1200, lineTotal: 1200 },
             { masterItemId: 'P007', name: 'Coolant (1L) - Generic', partNo: 'GEN-CLT-1L', quantity: 1, unitPrice: 350, lubeCharge: 0, labourCharge: 0, lineParts: 350, lineLubes: 0, lineLabour: 0, lineTotal: 350 }
        ],
        discountType: 'Fixed', discountValue: 50, taxRate: 18,
        ...calculateInvoiceTotals([
             { masterItemId: 'S002', lineParts: 0, lineLubes: 0, lineLabour: 1200 },
             { masterItemId: 'P007', lineParts: 350, lineLubes: 0, lineLabour: 0 }
        ], { type: 'Fixed', value: 50 }, 18),
        paymentRecords: [],
        status: 'Overdue',
        bankBranch: 'BORSAD', bankAccountNo: '07492000002739', bankIfsc: 'HDFC0000749',
    },
    // Invoice based on JS103
    {
        id: 'INV-2024-103', invoiceNumber: 'INV-2024-103', jobSheetId: 'JS103',
        dateIssued: getDateDaysAgo(5), dueDate: getDateDaysAgo(-25),
        customerId: 'C1003', vehicleId: 'V2003', kmReading: '15000',
        billBookNo: 'BBK-B/01', jcNo: 'JC-0103',
        items: [
            { masterItemId: 'S006', name: 'Car Wash (Exterior & Interior)', partNo: 'SVC-WASH', quantity: 1, unitPrice: 100, lubeCharge: 0, labourCharge: 650, lineParts: 100, lineLubes: 0, lineLabour: 650, lineTotal: 750 }
        ],
        discountType: null, discountValue: 0, taxRate: 0,
        ...calculateInvoiceTotals([ { masterItemId: 'S006', lineParts: 100, lineLubes: 0, lineLabour: 650 } ], { type: null, value: 0 }, 0),
        paymentRecords: [
            { id: 'pay-2', datePaid: getDateDaysAgo(4), amountPaid: 300.00, paymentMethod: 'Cash', notes: 'Advance payment.' }
        ],
        status: 'Partially Paid',
        bankBranch: 'BORSAD', bankAccountNo: '07492000002739', bankIfsc: 'HDFC0000749',
    }
];

// --- Tasks ---
export let initialTasks = [
    { id: 'T001', title: 'Order more Air Filters', description: 'Stock is low for P001', assignedTo: 'Admin', status: 'Todo', dueDate: '2024-03-20' },
    { id: 'T002', title: 'Follow up with Savan Moradiya payment', description: 'Invoice INV-2024-102 overdue', assignedTo: 'Admin', status: 'In Progress', dueDate: '2024-03-18' },
];

// --- Getter Functions ---
// Return copies to prevent accidental direct modification outside of helper functions
export const getCustomers = () => JSON.parse(JSON.stringify(initialCustomers));
export const getVehicles = () => JSON.parse(JSON.stringify(initialVehicles));
export const getJobSheets = () => JSON.parse(JSON.stringify(initialJobSheets));
export const getInvoices = () => JSON.parse(JSON.stringify(initialInvoices));
export const getMasterItems = () => JSON.parse(JSON.stringify(initialMasterItems));
export const getTasks = () => JSON.parse(JSON.stringify(initialTasks));

// --- Finder Functions ---
export const findCustomerById = (id) => initialCustomers.find(c => c.id === id);
export const findVehicleById = (id) => initialVehicles.find(v => v.id === id);
export const findVehiclesByCustomerId = (customerId) => initialVehicles.filter(v => v.customerId === customerId);
export const findJobSheetById = (id) => initialJobSheets.find(js => js.id === id);
export const findInvoiceById = (id) => initialInvoices.find(inv => inv.id === id);


// --- Simulation "Mutator" Functions (Modify the exported 'let' arrays) ---

// Use these IDs for simple simulation; replace with real IDs in a backend
let nextCustomerId = initialCustomers.length + 1004;
let nextVehicleId = initialVehicles.length + 2005;
let nextJobSheetId = initialJobSheets.length + 105;
let nextInvoiceId = initialInvoices.length + 104;
let nextTaskId = initialTasks.length + 3;

export const addCustomer = (customerData) => {
    const newId = `C${nextCustomerId++}`;
    const newCustomer = { ...customerData, id: newId };
    initialCustomers.push(newCustomer);
    console.log("Simulated Add Customer:", newCustomer);
    return { ...newCustomer }; // Return a copy
};

export const updateCustomer = (customerId, updatedData) => {
    const index = initialCustomers.findIndex(c => c.id === customerId);
    if (index !== -1) {
        initialCustomers[index] = { ...initialCustomers[index], ...updatedData };
        console.log("Simulated Update Customer:", initialCustomers[index]);
        return { ...initialCustomers[index] }; // Return updated copy
    }
    console.warn("Simulated Update Customer: ID not found", customerId);
    return null; // Not found
};

export const deleteCustomerById = (customerId) => {
    const initialCustLength = initialCustomers.length;
    const initialVehiLength = initialVehicles.length;
    // Filter out the customer
    initialCustomers = initialCustomers.filter(c => c.id !== customerId);
    // Filter out vehicles associated with that customer
    initialVehicles = initialVehicles.filter(v => v.customerId !== customerId);
    // In a real app, you might need to handle/delete related jobsheets, invoices etc. too
    console.log(`Simulated Delete Customer: ${customerId}. Removed ${initialCustLength - initialCustomers.length} customer and ${initialVehiLength - initialVehicles.length} vehicles.`);
    return initialCustomers.length < initialCustLength; // Indicate success if length decreased
};

export const addVehicle = (vehicleData) => {
     const newId = `V${nextVehicleId++}`;
     if (!vehicleData.customerId) {
         console.error("Cannot add vehicle without customerId", vehicleData);
         return null;
     }
    const newVehicle = { ...vehicleData, id: newId };
    initialVehicles.push(newVehicle);
    console.log("Simulated Add Vehicle:", newVehicle);
    return { ...newVehicle }; // Return a copy
};

export const updateVehicle = (vehicleId, updatedData) => {
    const index = initialVehicles.findIndex(v => v.id === vehicleId);
    if (index !== -1) {
        const existingCustomerId = initialVehicles[index].customerId;
        initialVehicles[index] = {
            ...initialVehicles[index],
            ...updatedData,
            customerId: updatedData.customerId ?? existingCustomerId // Keep original customerId if not changing
         };
        console.log("Simulated Update Vehicle:", initialVehicles[index]);
        return { ...initialVehicles[index] }; // Return updated copy
    }
    console.warn("Simulated Update Vehicle: ID not found", vehicleId);
    return null; // Not found
};

// This file simulates a basic user database.
// In a real application, you would fetch this data from a secure backend API.

export const users = [
  {
    name: 'Admin User',
    email: 'admin',
    password: '123', // In a real app, this would be a hashed password
  },
  {
    name: 'Test User',
    email: 'test@example.com',
    password: 'testpassword',
  },
];

export const deleteVehicleById = (vehicleId) => {
    const initialLength = initialVehicles.length;
    initialVehicles = initialVehicles.filter(v => v.id !== vehicleId);
    console.log(`Simulated Delete Vehicle: ${vehicleId}. Success: ${initialVehicles.length < initialLength}`);
    return initialVehicles.length < initialLength; // Indicate success if length decreased
};


export const addJobSheet = (jobSheetData) => {
     if (!jobSheetData.vehicleId || !jobSheetData.customerId) {
         console.error("Cannot add job sheet without vehicleId or customerId", jobSheetData);
         return null;
     }
     const newId = `JS${nextJobSheetId++}`;
     const newJobSheet = { ...jobSheetData, id: newId };
    initialJobSheets.push(newJobSheet);
    console.log("Simulated Add Job Sheet:", newJobSheet);
    return { ...newJobSheet };
};

export const updateJobSheet = (updatedData) => {
    const index = initialJobSheets.findIndex(js => js.id === updatedData.id);
    if (index > -1) {
        initialJobSheets[index] = { ...initialJobSheets[index], ...updatedData };
        console.log("Simulated Update Job Sheet:", initialJobSheets[index]);
        return { ...initialJobSheets[index] };
    } else {
        console.warn("Simulated Update Job Sheet: ID not found", updatedData.id);
        return null;
    }
};

export const addInvoice = (invoiceData) => {
    const newId = invoiceData.id || `INV-${nextInvoiceId++}`;
    const newInvoiceNumber = invoiceData.invoiceNumber || newId;

     const { items = [], discountType = null, discountValue = 0, taxRate = 0 } = invoiceData;
     const calculatedTotals = calculateInvoiceTotals(items, { type: discountType, value: discountValue }, taxRate);

     if (!invoiceData.jobSheetId || !invoiceData.customerId || !invoiceData.vehicleId) {
         console.error("Cannot add invoice without jobSheetId, customerId, and vehicleId", invoiceData);
         return null;
     }

    const newInvoice = {
        billBookNo: 'N/A', jcNo: 'N/A', status: 'Pending',
        paymentRecords: [], // Start with no payments
        bankBranch: 'BORSAD', bankAccountNo: '07492000002739', bankIfsc: 'HDFC0000749',
        ...invoiceData,
        id: newId, invoiceNumber: newInvoiceNumber,
        ...calculatedTotals,
    };

    if (newInvoice.dueDate && new Date(newInvoice.dueDate) < new Date()) {
         newInvoice.status = 'Overdue';
    } else {
         newInvoice.status = 'Pending';
    }

    initialInvoices.push(newInvoice);
    console.log("Simulated Add Invoice:", newInvoice);

    const jsIndex = initialJobSheets.findIndex(js => js.id === invoiceData.jobSheetId);
    if (jsIndex > -1) {
        initialJobSheets[jsIndex].status = 'Invoiced';
        console.log(`Updated Job Sheet ${initialJobSheets[jsIndex].jobSheetNumber} status to Invoiced`);
    } else {
        console.warn(`Job Sheet with ID ${invoiceData.jobSheetId} not found to update status.`);
    }
    return { ...newInvoice };
};

// ADDED: New function to handle payments
export const addPaymentToInvoice = (invoiceId, paymentData) => {
    const invoiceIndex = initialInvoices.findIndex(inv => inv.id === invoiceId);
    if (invoiceIndex === -1) {
        throw new Error("Invoice not found");
    }

    const invoice = initialInvoices[invoiceIndex];

    const newPayment = {
        id: `pay-${Date.now()}`,
        ...paymentData,
        amountPaid: parseFloat(paymentData.amountPaid)
    };
    invoice.paymentRecords.push(newPayment);

    // Recalculate total paid amount
    const totalPaid = invoice.paymentRecords.reduce((sum, record) => sum + record.amountPaid, 0);

    // Update status based on payment
    if (totalPaid >= invoice.grandTotal) {
        invoice.status = 'Paid';
    } else if (totalPaid > 0) {
        invoice.status = 'Partially Paid';
    } else if (new Date(invoice.dueDate) < new Date()) {
        invoice.status = 'Overdue';
    } else {
        invoice.status = 'Pending';
    }

    initialInvoices[invoiceIndex] = { ...invoice };
    return { ...initialInvoices[invoiceIndex] };
};


export const updateInvoice = (invoiceId, updatedData) => {
    const index = initialInvoices.findIndex(inv => inv.id === invoiceId);
    if (index !== -1) {
        const originalInvoice = initialInvoices[index];
        // Recalculate if items/discount/tax change
        const items = updatedData.items ?? originalInvoice.items;
        const discountType = updatedData.discountType ?? originalInvoice.discountType;
        const discountValue = updatedData.discountValue ?? originalInvoice.discountValue;
        const taxRate = updatedData.taxRate ?? originalInvoice.taxRate;
        const calculatedTotals = calculateInvoiceTotals(items, {type: discountType, value: discountValue }, taxRate);

        initialInvoices[index] = {
             ...originalInvoice,
             ...updatedData,
             ...calculatedTotals // Overwrite totals with recalculated values
        };

        // Recalculate status based on payment records
        const currentInvoice = initialInvoices[index];
        const totalPaid = currentInvoice.paymentRecords.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
        
        if (totalPaid >= currentInvoice.grandTotal && currentInvoice.grandTotal > 0) {
            currentInvoice.status = 'Paid';
        } else if (totalPaid > 0) {
            currentInvoice.status = 'Partially Paid';
        } else if (currentInvoice.dueDate && new Date(currentInvoice.dueDate) < new Date()) {
            currentInvoice.status = 'Overdue';
        } else {
            currentInvoice.status = 'Pending';
        }

        console.log("Simulated Update Invoice:", currentInvoice);
        return { ...currentInvoice };
    }
    console.warn("Simulated Update Invoice: ID not found", invoiceId);
    return null;
};


// --- ADDED Task functions (basic examples) ---
export const addTask = (taskData) => {
    const newId = `T${nextTaskId++}`;
    const newTask = { ...taskData, id: newId, status: taskData.status || 'Todo' }; // Default status
    initialTasks.push(newTask);
    console.log("Simulated Add Task:", newTask);
    return { ...newTask };
};

export const updateTask = (taskId, updatedData) => {
     const index = initialTasks.findIndex(t => t.id === taskId);
     if (index !== -1) {
         initialTasks[index] = { ...initialTasks[index], ...updatedData };
         console.log("Simulated Update Task:", initialTasks[index]);
         return { ...initialTasks[index] };
     }
     console.warn("Simulated Update Task: ID not found", taskId);
     return null;
};

export const deleteTask = (taskId) => {
     const initialLength = initialTasks.length;
     initialTasks = initialTasks.filter(t => t.id !== taskId);
     console.log(`Simulated Delete Task: ${taskId}. Success: ${initialTasks.length < initialLength}`);
     return initialTasks.length < initialLength;
};