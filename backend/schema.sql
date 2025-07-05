-- AutoCare Management System - SQL Schema with Full Audit Support
-- Includes: created_at, soft delete (is_deleted), and normalized structure

-- === CUSTOMERS ===
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(100),
    city VARCHAR(100),
    address TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- === VEHICLES ===
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    car_number VARCHAR(20) UNIQUE NOT NULL,
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    vin VARCHAR(100),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- === SUPPLIERS ===
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(15),
    city VARCHAR(100),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- === MASTER ITEMS ===
CREATE TABLE master_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    part_no VARCHAR(50),
    type VARCHAR(50) CHECK (type IN ('Spare', 'Service')),
    cost_price DECIMAL(10,2) DEFAULT 0,
    unit_price DECIMAL(10,2) DEFAULT 0,
    lube_charge DECIMAL(10,2) DEFAULT 0,
    labour_charge DECIMAL(10,2) DEFAULT 0,
    stock_qty INTEGER,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- === PURCHASE BILLS ===
CREATE TABLE purchase_bills (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    bill_number VARCHAR(100) NOT NULL,
    bill_date DATE NOT NULL,
    notes TEXT,
    total_amount DECIMAL(10,2) NOT NULL,
    date_recorded DATE DEFAULT CURRENT_DATE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- === PURCHASE BILL ITEMS ===
CREATE TABLE purchase_bill_items (
    id SERIAL PRIMARY KEY,
    purchase_bill_id INTEGER NOT NULL REFERENCES purchase_bills(id) ON DELETE CASCADE,
    master_item_id INTEGER NOT NULL REFERENCES master_items(id),
    quantity INTEGER NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL
);

-- === JOB SHEETS ===
CREATE TABLE job_sheets (
    id SERIAL PRIMARY KEY,
    job_sheet_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    km_reading VARCHAR(20),
    date_created DATE NOT NULL,
    date_completed DATE,
    next_service_km VARCHAR(20),
    status VARCHAR(50),
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- === JOB SHEET ITEMS ===
CREATE TABLE job_sheet_items (
    id SERIAL PRIMARY KEY,
    job_sheet_id INTEGER NOT NULL REFERENCES job_sheets(id) ON DELETE CASCADE,
    master_item_id INTEGER NOT NULL REFERENCES master_items(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) DEFAULT 0,
    lube_charge DECIMAL(10,2) DEFAULT 0,
    labour_charge DECIMAL(10,2) DEFAULT 0,
    line_parts DECIMAL(10,2) DEFAULT 0,
    line_lubes DECIMAL(10,2) DEFAULT 0,
    line_labour DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(10,2) DEFAULT 0
);

-- === INVOICES ===
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    job_sheet_id INTEGER NOT NULL REFERENCES job_sheets(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    km_reading VARCHAR(20),
    bill_book_no VARCHAR(50),
    jc_no VARCHAR(50),
    date_issued DATE NOT NULL,
    due_date DATE,
    discount_type VARCHAR(10) CHECK (discount_type IN ('Fixed', 'Percent')),
    discount_value DECIMAL(10,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    total_parts DECIMAL(10,2) DEFAULT 0,
    total_lubes DECIMAL(10,2) DEFAULT 0,
    total_labour DECIMAL(10,2) DEFAULT 0,
    sub_total DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    amount_before_tax DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    grand_total DECIMAL(10,2) DEFAULT 0,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20),
    bank_branch VARCHAR(100),
    bank_account_no VARCHAR(50),
    bank_ifsc VARCHAR(20),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- === INVOICE ITEMS ===
CREATE TABLE invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    master_item_id INTEGER NOT NULL REFERENCES master_items(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) DEFAULT 0,
    lube_charge DECIMAL(10,2) DEFAULT 0,
    labour_charge DECIMAL(10,2) DEFAULT 0,
    line_parts DECIMAL(10,2) DEFAULT 0,
    line_lubes DECIMAL(10,2) DEFAULT 0,
    line_labour DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(10,2) DEFAULT 0
);

-- === TASKS ===
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to VARCHAR(100),
    status VARCHAR(50) CHECK (status IN ('Todo', 'In Progress', 'Done')) DEFAULT 'Todo',
    due_date DATE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
