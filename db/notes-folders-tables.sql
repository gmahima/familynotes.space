-- Create the folders table if it doesn't exist
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on folders table
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for folders if they don't already exist
DO $$
BEGIN
  -- Check if the policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'folders' AND policyname = 'Users can view their own folders'
  ) THEN
    CREATE POLICY "Users can view their own folders" 
    ON folders FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;

  -- Check if the policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'folders' AND policyname = 'Users can create their own folders'
  ) THEN
    CREATE POLICY "Users can create their own folders" 
    ON folders FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Check if the policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'folders' AND policyname = 'Users can update their own folders'
  ) THEN
    CREATE POLICY "Users can update their own folders" 
    ON folders FOR UPDATE 
    USING (auth.uid() = user_id);
  END IF;

  -- Check if the policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'folders' AND policyname = 'Users can delete their own folders'
  ) THEN
    CREATE POLICY "Users can delete their own folders" 
    ON folders FOR DELETE 
    USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Enable RLS on notes table
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notes if they don't already exist
DO $$
BEGIN
  -- Check if the policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notes' AND policyname = 'Users can view their own notes'
  ) THEN
    CREATE POLICY "Users can view their own notes" 
    ON notes FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;

  -- Check if the policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notes' AND policyname = 'Users can create their own notes'
  ) THEN
    CREATE POLICY "Users can create their own notes" 
    ON notes FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Check if the policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notes' AND policyname = 'Users can update their own notes'
  ) THEN
    CREATE POLICY "Users can update their own notes" 
    ON notes FOR UPDATE 
    USING (auth.uid() = user_id);
  END IF;

  -- Check if the policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notes' AND policyname = 'Users can delete their own notes'
  ) THEN
    CREATE POLICY "Users can delete their own notes" 
    ON notes FOR DELETE 
    USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Create function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at timestamps
DROP TRIGGER IF EXISTS set_folders_timestamp ON folders;
CREATE TRIGGER set_folders_timestamp
BEFORE UPDATE ON folders
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS set_notes_timestamp ON notes;
CREATE TRIGGER set_notes_timestamp
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create a default folder for new users
CREATE OR REPLACE FUNCTION create_default_folder() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.folders (name, user_id, created_at, updated_at)
  VALUES ('My Notes', NEW.id, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger on the user_profiles table to create a default folder
DROP TRIGGER IF EXISTS on_user_profile_created ON user_profiles;
CREATE TRIGGER on_user_profile_created
  AFTER INSERT ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_folder(); 