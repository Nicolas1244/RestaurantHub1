/*
  # Add comprehensive employee directory fields

  1. Changes
    - Add new fields to `employees` table for comprehensive directory:
      - `date_of_birth` (date)
      - `place_of_birth` (text)
      - `country_of_birth` (text)
      - `employee_status` (text, with check constraint)
      - `hiring_date` (date)
      - `hourly_rate` (numeric)
      - `gross_monthly_salary` (numeric)

  2. Security
    - No changes to RLS policies needed
    - New fields follow same access patterns as other employee data
*/

-- Add new fields to employees table
DO $$ 
BEGIN
  -- Date of Birth
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE employees ADD COLUMN date_of_birth date;
  END IF;

  -- Place of Birth
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'place_of_birth'
  ) THEN
    ALTER TABLE employees ADD COLUMN place_of_birth text;
  END IF;

  -- Country of Birth
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'country_of_birth'
  ) THEN
    ALTER TABLE employees ADD COLUMN country_of_birth text;
  END IF;

  -- Employee Status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'employee_status'
  ) THEN
    ALTER TABLE employees ADD COLUMN employee_status text;
    ALTER TABLE employees ADD CONSTRAINT employee_status_check CHECK (
      employee_status IS NULL OR employee_status IN ('Cadre', 'Employe')
    );
  END IF;

  -- Hiring Date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'hiring_date'
  ) THEN
    ALTER TABLE employees ADD COLUMN hiring_date date;
  END IF;

  -- Hourly Rate
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'hourly_rate'
  ) THEN
    ALTER TABLE employees ADD COLUMN hourly_rate numeric;
  END IF;

  -- Gross Monthly Salary
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'gross_monthly_salary'
  ) THEN
    ALTER TABLE employees ADD COLUMN gross_monthly_salary numeric;
  END IF;
END $$;

-- Add comments to document the fields
COMMENT ON COLUMN employees.date_of_birth IS 'Employee date of birth';
COMMENT ON COLUMN employees.place_of_birth IS 'Employee place of birth (city)';
COMMENT ON COLUMN employees.country_of_birth IS 'Employee country of birth';
COMMENT ON COLUMN employees.employee_status IS 'Employee status (Cadre or Employé(e))';
COMMENT ON COLUMN employees.hiring_date IS 'Official hiring date (may differ from contract start date)';
COMMENT ON COLUMN employees.hourly_rate IS 'Employee hourly rate in euros';
COMMENT ON COLUMN employees.gross_monthly_salary IS 'Employee gross monthly salary in euros';