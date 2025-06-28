/*
  # Add employee preferences and availability tables

  1. New Tables
    - `employee_preferences` - Store employee work preferences
    - `employee_availabilities` - Store employee availability/unavailability periods

  2. Security
    - Enable RLS on all tables
    - Add policies for restaurant owners and managers
*/

-- Employee Preferences Table
CREATE TABLE IF NOT EXISTS employee_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  preferred_days integer[] NOT NULL,
  preferred_shifts text[] NOT NULL,
  preferred_positions text[] NOT NULL,
  preferred_hours jsonb NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Employee Availabilities Table
CREATE TABLE IF NOT EXISTS employee_availabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('PREFERRED', 'AVAILABLE', 'LIMITED', 'UNAVAILABLE')),
  day_of_week integer,
  date date,
  start_time text NOT NULL,
  end_time text NOT NULL,
  recurrence text NOT NULL CHECK (recurrence IN ('ONCE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY')),
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Either day_of_week or date must be provided, but not both
  CONSTRAINT day_or_date_required CHECK (
    (day_of_week IS NOT NULL AND date IS NULL) OR
    (day_of_week IS NULL AND date IS NOT NULL)
  ),
  -- For recurring availabilities, day_of_week is required
  CONSTRAINT recurring_requires_day CHECK (
    recurrence = 'ONCE' OR day_of_week IS NOT NULL
  )
);

-- Enable RLS on all tables
ALTER TABLE employee_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_availabilities ENABLE ROW LEVEL SECURITY;

-- Create policies for restaurant owners and managers
CREATE POLICY "Restaurant staff can view employee preferences"
  ON employee_preferences
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_restaurant_access ura
      JOIN employees e ON e.restaurant_id = ura.restaurant_id
      WHERE ura.user_id = auth.uid()
      AND e.id = employee_preferences.employee_id
    )
  );

CREATE POLICY "Restaurant managers can manage employee preferences"
  ON employee_preferences
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_restaurant_access ura
      JOIN employees e ON e.restaurant_id = ura.restaurant_id
      WHERE ura.user_id = auth.uid()
      AND ura.role IN ('owner', 'manager')
      AND e.id = employee_preferences.employee_id
    )
  );

CREATE POLICY "Restaurant staff can view employee availabilities"
  ON employee_availabilities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_restaurant_access ura
      JOIN employees e ON e.restaurant_id = ura.restaurant_id
      WHERE ura.user_id = auth.uid()
      AND e.id = employee_availabilities.employee_id
    )
  );

CREATE POLICY "Restaurant managers can manage employee availabilities"
  ON employee_availabilities
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_restaurant_access ura
      JOIN employees e ON e.restaurant_id = ura.restaurant_id
      WHERE ura.user_id = auth.uid()
      AND ura.role IN ('owner', 'manager')
      AND e.id = employee_availabilities.employee_id
    )
  );

-- Add comments to document the tables
COMMENT ON TABLE employee_preferences IS 'Stores employee work preferences for scheduling';
COMMENT ON TABLE employee_availabilities IS 'Stores employee availability and unavailability periods';