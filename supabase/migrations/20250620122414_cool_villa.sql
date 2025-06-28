/*
  # Add Performance Dashboard tables

  1. New Tables
    - `pos_credentials` - Store POS system connection credentials
    - `pos_data` - Store daily POS data (turnover, covers, etc.)
    - `performance_metrics` - Store calculated performance metrics
    - `forecasts` - Store turnover and covers forecasts
    - `manual_data_entries` - Store manually entered data

  2. Security
    - Enable RLS on all tables
    - Add policies for restaurant owners and managers
*/

-- POS Credentials Table
CREATE TABLE IF NOT EXISTS pos_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  provider text NOT NULL,
  api_key text,
  username text,
  password text,
  store_id text,
  endpoint text,
  is_active boolean DEFAULT true,
  last_sync timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- POS Data Table
CREATE TABLE IF NOT EXISTS pos_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  date date NOT NULL,
  turnover numeric NOT NULL,
  covers integer NOT NULL,
  average_check numeric,
  sales_by_hour jsonb,
  sales_by_category jsonb,
  sales_by_service jsonb,
  source text NOT NULL, -- 'pos', 'manual'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(restaurant_id, date)
);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  date date NOT NULL,
  turnover numeric NOT NULL,
  covers integer NOT NULL,
  average_check numeric NOT NULL,
  gross_payroll_mass numeric NOT NULL,
  staff_cost_ratio numeric NOT NULL,
  total_hours_worked numeric NOT NULL,
  average_hourly_cost numeric NOT NULL,
  scheduled_hours numeric NOT NULL,
  overtime_hours numeric NOT NULL,
  absence_hours numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(restaurant_id, date)
);

-- Forecasts Table
CREATE TABLE IF NOT EXISTS forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  date date NOT NULL,
  forecasted_turnover numeric NOT NULL,
  forecasted_covers integer NOT NULL,
  confidence integer NOT NULL,
  based_on text NOT NULL, -- 'historical', 'seasonal', 'manual'
  factors jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(restaurant_id, date)
);

-- Manual Data Entry Table
CREATE TABLE IF NOT EXISTS manual_data_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  date date NOT NULL,
  turnover numeric NOT NULL,
  covers integer NOT NULL,
  lunch_turnover numeric,
  dinner_turnover numeric,
  notes text,
  entered_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(restaurant_id, date)
);

-- Enable RLS on all tables
ALTER TABLE pos_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_data_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for restaurant owners and managers
CREATE POLICY "Restaurant owners and managers can manage POS credentials"
  ON pos_credentials
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_restaurant_access
      WHERE user_id = auth.uid()
      AND restaurant_id = pos_credentials.restaurant_id
      AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Restaurant staff can view POS data"
  ON pos_data
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_restaurant_access
      WHERE user_id = auth.uid()
      AND restaurant_id = pos_data.restaurant_id
    )
  );

CREATE POLICY "Restaurant owners and managers can manage POS data"
  ON pos_data
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_restaurant_access
      WHERE user_id = auth.uid()
      AND restaurant_id = pos_data.restaurant_id
      AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Restaurant staff can view performance metrics"
  ON performance_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_restaurant_access
      WHERE user_id = auth.uid()
      AND restaurant_id = performance_metrics.restaurant_id
    )
  );

CREATE POLICY "Restaurant owners and managers can manage performance metrics"
  ON performance_metrics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_restaurant_access
      WHERE user_id = auth.uid()
      AND restaurant_id = performance_metrics.restaurant_id
      AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Restaurant staff can view forecasts"
  ON forecasts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_restaurant_access
      WHERE user_id = auth.uid()
      AND restaurant_id = forecasts.restaurant_id
    )
  );

CREATE POLICY "Restaurant owners and managers can manage forecasts"
  ON forecasts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_restaurant_access
      WHERE user_id = auth.uid()
      AND restaurant_id = forecasts.restaurant_id
      AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Restaurant owners and managers can manage manual data entries"
  ON manual_data_entries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_restaurant_access
      WHERE user_id = auth.uid()
      AND restaurant_id = manual_data_entries.restaurant_id
      AND role IN ('owner', 'manager')
    )
  );

-- Add email column to employees table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'email'
  ) THEN
    ALTER TABLE employees ADD COLUMN email text;
    COMMENT ON COLUMN employees.email IS 'Optional email address for professional communications';
  END IF;
END $$;