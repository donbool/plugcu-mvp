-- Fix RLS policies for users table to allow role queries after login

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for auth trigger" ON public.users;

-- Create new, clearer policies
-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow authenticated users to view all profiles (for role-based routing)
CREATE POLICY "Authenticated users can view all profiles"
  ON public.users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow the auth trigger to insert user profiles
CREATE POLICY "Enable insert for auth trigger"
  ON public.users
  FOR INSERT
  WITH CHECK (true);
