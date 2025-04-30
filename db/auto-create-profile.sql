-- ======================================================================
-- This SQL script automates profile creation whenever a new user signs up
-- ======================================================================

-- ======================================================================
-- Table Creation
-- This section creates the user_profiles table if it doesn't exist yet
-- The table stores user profile information and links to auth.users
-- Each profile has:
--   - Basic identifiers (UUID linked to auth system)
--   - Profile information (display name, avatar)
--   - Subscription details
--   - Timestamps for record management
-- ======================================================================
-- First, ensure the user_profiles table exists (in case it doesn't yet)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'inactive',
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================================================
-- Row-Level Security Setup
-- This enables Row Level Security (RLS) on the user_profiles table
-- RLS ensures users can only access their own profile data
-- ======================================================================
-- Enable RLS on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ======================================================================
-- RLS Policies Creation
-- This block creates three policies that control access to user profiles:
-- 1. SELECT policy: Users can only view their own profile
-- 2. UPDATE policy: Users can only update their own profile
-- 3. INSERT policy: Users can only insert their own profile
-- 
-- Each policy is only created if it doesn't already exist
-- The DO $$ BEGIN/END $$ block is a PL/pgSQL anonymous block
-- ======================================================================
-- Create RLS policies for user_profiles if they don't already exist
DO $$
BEGIN
  -- Check if the policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile" 
    ON user_profiles FOR SELECT 
    USING (auth.uid() = id);
  END IF;

  -- Check if the policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile" 
    ON user_profiles FOR UPDATE 
    USING (auth.uid() = id);
  END IF;

  -- Check if the policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile" 
    ON user_profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);
  END IF;
END
$$;

-- ======================================================================
-- Function for New User Handling
-- This function automatically creates a profile when a new user signs up
-- It runs with elevated permissions (SECURITY DEFINER)
-- When a new user is created in auth.users, this:
--   - Takes the new user's ID and email
--   - Creates a matching entry in the user_profiles table
-- ======================================================================
-- Create a function that will be triggered when a new user is created
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a row into user_profiles
  INSERT INTO public.user_profiles (id, display_name, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ======================================================================
-- Trigger Setup
-- This sets up the trigger that calls our function
-- First it removes any existing trigger (to avoid duplicates)
-- Then creates a new trigger that activates after each new user insert
-- The trigger runs the handle_new_user function we defined above
-- ======================================================================
-- Create a trigger on the auth.users table to call the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 