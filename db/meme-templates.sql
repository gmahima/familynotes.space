-- Create meme_templates table
CREATE TABLE IF NOT EXISTS meme_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  text_positions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE meme_templates ENABLE ROW LEVEL SECURITY;

-- Users can view public templates and their own templates
CREATE POLICY "Users can view public templates and their own templates" 
ON meme_templates FOR SELECT 
USING (is_public = true OR auth.uid() = user_id);

-- Users can create their own templates
CREATE POLICY "Users can create their own templates" 
ON meme_templates FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own templates
CREATE POLICY "Users can update their own templates" 
ON meme_templates FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own templates
CREATE POLICY "Users can delete their own templates" 
ON meme_templates FOR DELETE 
USING (auth.uid() = user_id);

-- Create meme_generations table to track created memes
CREATE TABLE IF NOT EXISTS meme_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES meme_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text_inputs JSONB NOT NULL,
  output_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for meme_generations
ALTER TABLE meme_generations ENABLE ROW LEVEL SECURITY;

-- Users can view their own generated memes
CREATE POLICY "Users can view their own generated memes" 
ON meme_generations FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own meme generations
CREATE POLICY "Users can create their own meme generations" 
ON meme_generations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own meme generations
CREATE POLICY "Users can delete their own meme generations" 
ON meme_generations FOR DELETE 
USING (auth.uid() = user_id);
