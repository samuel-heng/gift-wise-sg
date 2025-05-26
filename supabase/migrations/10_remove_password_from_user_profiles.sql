-- Migration: Remove password column from user_profiles
ALTER TABLE user_profiles DROP COLUMN IF EXISTS password; 