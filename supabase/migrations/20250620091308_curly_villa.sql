/*
  # Add email field to employees table

  1. Changes
    - Add optional `email` column to `employees` table
    - Email field is optional (nullable)
    - No constraints on email format (handled by application)

  2. Security
    - No changes to RLS policies needed
    - Email field follows same access patterns as other employee data
*/

-- Add email column to employees table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'email'
  ) THEN
    ALTER TABLE employees ADD COLUMN email text;
  END IF;
END $$;

-- Add comment to document the field
COMMENT ON COLUMN employees.email IS 'Optional email address for professional communications';