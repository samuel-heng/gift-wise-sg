-- Migration: Remove email and phone columns from contacts table
ALTER TABLE contacts DROP COLUMN IF EXISTS email;
ALTER TABLE contacts DROP COLUMN IF EXISTS phone; 