/*
  # Add user profiles table for authentication and role management

  1. New Tables
    - `user_profiles` - Store user profile information and roles
    - `restaurant_access` - Store user access to restaurants

  2. Security
    - Enable RLS on all tables
    - Add policies for appropriate access control
*/

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  first_name text,
  last_name text,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Restaurant Access Table
CREATE TABLE IF NOT EXISTS restaurant_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, restaurant_id)
);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_access ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for restaurant_access
CREATE POLICY "Users can view their own restaurant access"
  ON restaurant_access
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all restaurant access"
  ON restaurant_access
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Managers can view access for their restaurants"
  ON restaurant_access
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_access
      WHERE user_id = auth.uid() 
      AND role = 'manager'
      AND restaurant_id IN (
        SELECT restaurant_id FROM restaurant_access
        WHERE user_id = auth.uid()
      )
    )
  );

-- Add comments to document the tables
COMMENT ON TABLE user_profiles IS 'Stores user profile information and roles';
COMMENT ON TABLE restaurant_access IS 'Stores user access to restaurants';