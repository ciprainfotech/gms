-- =====================================================================
-- AutoCare PRO - FINAL Database Schema
-- Version: 7.0 (Schema Only, using SERIAL for auto-increment)
-- =====================================================================

-- This script creates the complete, empty database structure.
-- It is designed to be run on a clean database.

BEGIN;

-- === 1. SETUP: Helper function for `updated_at` columns ===
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =====================================================================
-- 2. SCHEMA CREATION (ALL TABLES)
-- =====================================================================

-- SaaS Subscription Tiers
CREATE TABLE plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    monthly_price DECIMAL(10,2) DEFAULT 0,
    max_users INTEGER DEFAULT 5,
    max_vehicles INTEGER DEFAULT 1000,
    whatsapp_enabled BOOLEAN DEFAULT TRUE,
    analytics_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Core tenancy and user tables
CREATE TABLE garages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    logo_url VARCHAR(255),
    gst_number VARCHAR(50),
    terms_and_conditions TEXT,
    invoice_prefix VARCHAR(20) DEFAULT 'INV-',
    invoice_next_num INTEGER DEFAULT 1,
    jobsheet_prefix VARCHAR(20) DEFAULT 'JS-',
    jobsheet_next_num INTEGER DEFAULT 1,
    plan_id INTEGER REFERENCES plans(id) ON DELETE SET NULL,
    custom_monthly_price DECIMAL(10,2) DEFAULT 0.00,
    subscription_status VARCHAR(20) DEFAULT 'active',
    subscription_expires_at TIMESTAMPTZ,
    whatsapp_credit_balance DECIMAL(10,2) DEFAULT 100.00,
    whatsapp_cost_per_msg DECIMAL(10,2) DEFAULT 0.15,
    whatsapp_api_token TEXT,
    whatsapp_phone_number_id VARCHAR(100),
    whatsapp_api_url VARCHAR(255),
    whatsapp_waba_id VARCHAR(100),
    whatsapp_phone_number VARCHAR(50),
    whatsapp_status VARCHAR(20) DEFAULT 'disconnected',
    feature_stock BOOLEAN DEFAULT TRUE,
    feature_purchase BOOLEAN DEFAULT TRUE,
    feature_analytics BOOLEAN DEFAULT TRUE,
    feature_reminders BOOLEAN DEFAULT TRUE,
    feature_tasks BOOLEAN DEFAULT TRUE,
    feature_whatsapp BOOLEAN DEFAULT TRUE,
    feature_whatsapp_utility BOOLEAN DEFAULT TRUE,
    feature_whatsapp_marketing BOOLEAN DEFAULT TRUE,
    feature_payroll BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash TEXT NOT NULL,
    is_super_admin BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master data for vehicles
CREATE TABLE makes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE models (
    id SERIAL PRIMARY KEY,
    make_id INTEGER NOT NULL REFERENCES makes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    start_year INTEGER,
    end_year INTEGER,
    available_fuel_types TEXT[],
    UNIQUE(make_id, name)
);

-- Many-to-many junction table for user-garage roles
CREATE TABLE garage_users (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    garage_id INTEGER NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'manager', 'mechanic')),
    PRIMARY KEY (user_id, garage_id)
);

-- Garage-specific business tables
CREATE TABLE master_items (
    id SERIAL PRIMARY KEY,
    garage_id INTEGER NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    part_no VARCHAR(50),
    type VARCHAR(50) NOT NULL CHECK (type IN ('Spare', 'Service')),
    cost_price DECIMAL(10,2) DEFAULT 0,
    unit_price DECIMAL(10,2) DEFAULT 0,
    lube_charge DECIMAL(10,2) DEFAULT 0,
    labour_charge DECIMAL(10,2) DEFAULT 0,
    stock_qty INTEGER,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(garage_id, part_no)
);

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    garage_id INTEGER NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(garage_id, phone)
);

CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    garage_id INTEGER NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    make_id INTEGER NOT NULL REFERENCES makes(id),
    model_id INTEGER NOT NULL REFERENCES models(id),
    car_number VARCHAR(20) NOT NULL,
    year INTEGER,
    vin VARCHAR(100),
    fuel_type VARCHAR(20),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(garage_id, car_number)
);

CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    garage_id INTEGER NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    city VARCHAR(100),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactional Tables
CREATE TABLE job_sheets (
    id BIGSERIAL PRIMARY KEY,
    garage_id INTEGER NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
    job_sheet_number VARCHAR(50) NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    km_reading INTEGER,
    date_created DATE NOT NULL,
    date_completed DATE,
    next_service_km INTEGER,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(garage_id, job_sheet_number)
);

CREATE TABLE job_sheet_items (
    id BIGSERIAL PRIMARY KEY,
    job_sheet_id BIGINT NOT NULL REFERENCES job_sheets(id) ON DELETE CASCADE,
    master_item_id INTEGER NOT NULL REFERENCES master_items(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) DEFAULT 0,
    lube_charge DECIMAL(10,2) DEFAULT 0,
    labour_charge DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,
    garage_id INTEGER NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL,
    job_sheet_id BIGINT NOT NULL REFERENCES job_sheets(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    date_issued DATE NOT NULL,
    due_date DATE,
    km_reading INTEGER,
    discount_type VARCHAR(10) CHECK (discount_type IN ('Fixed', 'Percent')),
    discount_value DECIMAL(10,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    grand_total DECIMAL(10,2),
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(garage_id, invoice_number)
);

CREATE TABLE invoice_items (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    master_item_id INTEGER NOT NULL REFERENCES master_items(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) DEFAULT 0,
    lube_charge DECIMAL(10,2) DEFAULT 0,
    labour_charge DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    garage_id INTEGER NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount_paid DECIMAL(10,2) NOT NULL,
    date_paid DATE NOT NULL,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_bills (
    id BIGSERIAL PRIMARY KEY,
    garage_id INTEGER NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
    supplier_id INTEGER REFERENCES suppliers(id),
    bill_number VARCHAR(100) NOT NULL,
    bill_date DATE NOT NULL,
    total_amount DECIMAL(10,2),
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_bill_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_bill_id BIGINT NOT NULL REFERENCES purchase_bills(id) ON DELETE CASCADE,
    master_item_id INTEGER NOT NULL REFERENCES master_items(id),
    quantity INTEGER NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL
);

CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    garage_id INTEGER NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Todo', 'In Progress', 'Done')) DEFAULT 'Todo',
    due_date DATE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE whatsapp_logs (
    id BIGSERIAL PRIMARY KEY,
    garage_id INTEGER NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
    recipient_phone VARCHAR(20) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    cost_deducted DECIMAL(10,2) DEFAULT 0.15,
    balance_after DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'sent',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    garage_id INTEGER NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    role VARCHAR(50) NOT NULL,
    salary_type VARCHAR(20) DEFAULT 'monthly',
    base_salary DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    garage_id INTEGER NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
    staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(staff_id, date)
);

CREATE TABLE staff_transactions (
    id SERIAL PRIMARY KEY,
    garage_id INTEGER NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
    staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Cash',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);



-- =====================================================================
-- 3. APPLY TRIGGERS AND INDEXES
-- =====================================================================

CREATE TRIGGER set_timestamp_garages BEFORE UPDATE ON garages FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_master_items BEFORE UPDATE ON master_items FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_customers BEFORE UPDATE ON customers FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_vehicles BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_suppliers BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_job_sheets BEFORE UPDATE ON job_sheets FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_invoices BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_purchase_bills BEFORE UPDATE ON purchase_bills FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_tasks BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_garage_users_user_id ON garage_users(user_id);
CREATE INDEX idx_garage_users_garage_id ON garage_users(garage_id);
CREATE INDEX idx_models_make_id ON models(make_id);
CREATE INDEX idx_master_items_garage_id ON master_items(garage_id);
CREATE INDEX idx_customers_garage_id ON customers(garage_id);
CREATE INDEX idx_vehicles_garage_id ON vehicles(garage_id);
CREATE INDEX idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX idx_suppliers_garage_id ON suppliers(garage_id);
CREATE INDEX idx_job_sheets_garage_id ON job_sheets(garage_id);
CREATE INDEX idx_job_sheets_customer_id ON job_sheets(customer_id);
CREATE INDEX idx_job_sheets_vehicle_id ON job_sheets(vehicle_id);
CREATE INDEX idx_invoices_garage_id ON invoices(garage_id);
CREATE INDEX idx_invoices_job_sheet_id ON invoices(job_sheet_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_purchase_bills_garage_id ON purchase_bills(garage_id);
CREATE INDEX idx_tasks_assigned_to_user_id ON tasks(assigned_to_user_id);


COMMIT;