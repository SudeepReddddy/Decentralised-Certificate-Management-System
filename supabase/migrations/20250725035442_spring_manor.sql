/*
  # Add grade field to certificates

  1. Changes
    - Add `grade` column to certificates table
    - Update existing certificates with default grade if needed
    - Add check constraint for valid grades

  2. Security
    - No changes to existing RLS policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'certificates' AND column_name = 'grade'
  ) THEN
    ALTER TABLE certificates ADD COLUMN grade text;
  END IF;
END $$;

-- Add check constraint for valid grades
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'certificates_grade_check'
  ) THEN
    ALTER TABLE certificates ADD CONSTRAINT certificates_grade_check 
    CHECK (grade IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'Pass', 'Fail', 'Distinction', 'Merit', 'Credit'));
  END IF;
END $$;