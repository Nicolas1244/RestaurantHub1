/*
  # Add employee management tables and policies

  1. New Tables
    - `employees` table with fields for:
      - Personal information (name, address, contact)
      - Contract details (type, dates)
      - Position and restaurant association
  
  2. Security
    - Enable RLS on employees table
    - Add policies for viewing and managing employees
*/

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
  DROP POLICY IF EXISTS "Restaurant staff can view employees" ON employees;
  DROP POLICY IF EXISTS "Restaurant managers can manage employees" ON employees;
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