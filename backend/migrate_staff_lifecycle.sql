-- =====================================================================
-- Migration: Add Staff Lifecycle Fields
-- Version: 8.1 — Run this on EXISTING databases that were set up before v8.0
-- =====================================================================
-- If you already ran schema.sql v8.0, this adds the new lifecycle columns.
-- Safe to run multiple times (uses IF NOT EXISTS checks).

BEGIN;

-- Add status column
ALTER TABLE staff ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'
  CHECK (status IN ('active', 'resigned', 'terminated'));

-- Add leaving_date column
ALTER TABLE staff ADD COLUMN IF NOT EXISTS leaving_date DATE DEFAULT NULL;

-- Add leaving_notes column
ALTER TABLE staff ADD COLUMN IF NOT EXISTS leaving_notes TEXT DEFAULT NULL;

-- Ensure all existing rows have status = 'active'
UPDATE staff SET status = 'active' WHERE status IS NULL;

COMMIT;

-- Verify
SELECT id, name, status, joined_date, leaving_date FROM staff LIMIT 10;
