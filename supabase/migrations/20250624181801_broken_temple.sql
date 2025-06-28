/*
  # Add Time Clock (Badgeuse) tables

  1. New Tables
    - `time_clock` - Store clock in/out records
    - `time_clock_summary` - Store daily summaries of worked hours

  2. Security
    - Enable RLS on all tables
    - Add policies for restaurant owners, managers and employees
*/

-- Time Clock Table
CREATE TABLE IF NOT EXISTS time_clock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  clock_in_time timestamptz NOT NULL,
  clock_out_time timestamptz,
  total_hours numeric,
  status text NOT NULL CHECK (status IN ('active', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Time Clock Summary Table (for reporting)
CREATE TABLE IF NOT EXISTS time_clock_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  date date NOT NULL,
  total_hours numeric NOT NULL,
  scheduled_hours numeric NOT NULL,
  difference numeric NOT NULL,
  status text NOT NULL CHECK (status IN ('on_time', 'late', 'early', 'overtime', 'undertime')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Enable RLS on all tables
ALTER TABLE time_clock ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_clock_summary ENABLE ROW LEVEL SECURITY;

-- Create policies for restaurant owners and managers
CREATE POLICY "Restaurant owners and managers can manage time clock records"
  ON time_clock
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_restaurant_access
      WHERE user_id = auth.uid()
      AND restaurant_id = time_clock.restaurant_id
      AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Employees can view and create their own time clock records"
  ON time_clock
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = time_clock.employee_id
      AND employees.id = (
        SELECT id FROM employees
        WHERE restaurant_id = time_clock.restaurant_id
        AND id = time_clock.employee_id
      )
    )
  );

CREATE POLICY "Employees can insert their own time clock records"
  ON time_clock
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = time_clock.employee_id
      AND employees.id = (
        SELECT id FROM employees
        WHERE restaurant_id = time_clock.restaurant_id
        AND id = time_clock.employee_id
      )
    )
  );

CREATE POLICY "Restaurant owners and managers can manage time clock summaries"
  ON time_clock_summary
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_restaurant_access
      WHERE user_id = auth.uid()
      AND restaurant_id = time_clock_summary.restaurant_id
      AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Employees can view their own time clock summaries"
  ON time_clock_summary
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = time_clock_summary.employee_id
      AND employees.id = (
        SELECT id FROM employees
        WHERE restaurant_id = time_clock_summary.restaurant_id
        AND id = time_clock_summary.employee_id
      )
    )
  );

-- Add comments to document the tables
COMMENT ON TABLE time_clock IS 'Stores employee clock in/out records';
COMMENT ON TABLE time_clock_summary IS 'Stores daily summaries of employee worked hours';