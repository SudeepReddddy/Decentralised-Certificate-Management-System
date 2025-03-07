/*
  # Fix certificate storage constraint

  1. Changes
    - Drop the check_certificate_storage constraint that was causing errors
    - Make storage_path and pdf_url columns nullable
  
  2. Notes
    - This allows certificates to be stored without requiring storage_path or pdf_url
    - Blockchain verification is now the primary verification method
*/

-- Drop the existing constraint
ALTER TABLE certificates
DROP CONSTRAINT IF EXISTS check_certificate_storage;

-- Make sure both fields can be null
ALTER TABLE certificates
ALTER COLUMN storage_path DROP NOT NULL,
ALTER COLUMN pdf_url DROP NOT NULL;