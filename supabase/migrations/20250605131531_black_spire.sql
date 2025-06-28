/*
  # Create employees table with address and contact information

  1. New Tables
    - `employees`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `street_address` (text)
      - `city` (text)
      - `postal_code` (text)
      - `phone` (text)
      - `contract_type` (text, with check constraint)
      - `start_date` (date)
      - `end_date` (date, nullable)
      - `position` (text)
      - `restaurant_id` (uuid, foreign key)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `notification_days` (integer)

  2. Security
    - Enable RLS on employees table
    - Add policy for staff to view employees
    - Add policy for managers to manage employees

  3. Constraints
    - Contract type must be one of: CDI, CDD, Extra
    - End date required for CDD and Extra contracts
*/

-- Create employees table if it doesn't exist
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  street_address text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  phone text NOT NULL,
  contract_type text NOT NULL CHECK (contract_type IN ('CDI', 'CDD', 'Extra')),
  start_date date NOT NULL,
  end_date date,
  position text NOT NULL,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  notification_days integer DEFAULT 30,
  CONSTRAINT end_date_required CHECK (
    (contract_type = 'CDI') OR 
    (contract_type IN ('CDD', 'Extra') AND end_date IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'employees' 
    AND policyname = 'Restaurant staff can view employees'
  ) THEN
    DROP POLICY "Restaurant staff can view employees" ON employees;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'employees' 
    AND policyname = 'Restaurant managers can manage employees'
  ) THEN
    DROP POLICY "Restaurant managers can manage employees" ON employees;
  END IF;
END $$;

-- Create policies
CREATE POLICY "Restaurant staff can view employees"
  ON employees
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_restaurant_access
      WHERE user_id = auth.uid()
      AND restaurant_id = employees.restaurant_id
    )
  );

CREATE POLICY "Restaurant managers can manage employees"
  ON employees
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_restaurant_access
      WHERE user_id = auth.uid()
      AND restaurant_id = employees.restaurant_id
      AND role IN ('owner', 'manager')
    )
  );