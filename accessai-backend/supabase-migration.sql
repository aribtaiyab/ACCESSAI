-- ============================================================================
-- AccessAI Supabase Migration SQL
-- ============================================================================
-- Run all SQL in this file in your Supabase SQL Editor
-- This creates all necessary tables with Row Level Security enabled

-- ============================================================================
-- 1. HISTORY TABLE - Stores all AI processing requests
-- ============================================================================
CREATE TABLE IF NOT EXISTS history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'simplify', 'explain', 'summarize', 'altText'
  input_text TEXT NOT NULL,
  output_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_history_user_id ON history(user_id);
CREATE INDEX idx_history_created_at ON history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own history
CREATE POLICY "Users can view their own history"
  ON history FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own history
CREATE POLICY "Users can insert their own history"
  ON history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own history
CREATE POLICY "Users can delete their own history"
  ON history FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. SETTINGS TABLE - Stores user preferences
-- ============================================================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  font_size INT DEFAULT 16, -- pixels
  font_family TEXT DEFAULT 'sans-serif', -- 'sans-serif', 'serif', 'monospace'
  language TEXT DEFAULT 'en', -- language code
  dyslexia_mode BOOLEAN DEFAULT FALSE,
  high_contrast BOOLEAN DEFAULT FALSE,
  speech_rate FLOAT DEFAULT 1.0, -- playback speed multiplier
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for performance
CREATE INDEX idx_settings_user_id ON settings(user_id);

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own settings
CREATE POLICY "Users can view their own settings"
  ON settings FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only update their own settings
CREATE POLICY "Users can update their own settings"
  ON settings FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own settings
CREATE POLICY "Users can insert their own settings"
  ON settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 3. ORG_AUDITS TABLE - Stores website accessibility audit results
-- ============================================================================
CREATE TABLE IF NOT EXISTS org_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  url TEXT NOT NULL,
  score INT, -- 0-100 accessibility score
  recommendations TEXT[] DEFAULT ARRAY[]::TEXT[], -- array of recommendations
  audited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_org_audits_user_id ON org_audits(user_id);
CREATE INDEX idx_org_audits_created_at ON org_audits(created_at DESC);

-- Enable Row Level Security
ALTER TABLE org_audits ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own audits
CREATE POLICY "Users can view their own audits"
  ON org_audits FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own audits
CREATE POLICY "Users can insert their own audits"
  ON org_audits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own audits
CREATE POLICY "Users can delete their own audits"
  ON org_audits FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFY TABLES CREATED
-- ============================================================================
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
