-- Fix serial_number NOT NULL constraint to allow nullable
-- Run this in Supabase SQL Editor once

BEGIN;

-- Make serial_number nullable (it's not always required)
ALTER TABLE letters
ALTER COLUMN serial_number DROP NOT NULL;

-- Keep the UNIQUE constraint but allow multiple NULLs (PostgreSQL treats NULL as distinct)
-- The constraint should still work with NULLs since NULL != NULL in SQL

COMMIT;
