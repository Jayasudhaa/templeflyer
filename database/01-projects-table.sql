-- ============================================================================
-- FILE: database/01-projects-table.sql
-- PURPOSE: Flyer projects table (Canva-style project management)
-- RUN ORDER: 1st
-- ============================================================================

-- Create projects table
CREATE TABLE IF NOT EXISTS flyer_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Project info
  project_name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  
  -- Canvas data
  canvas_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Event data (for calendar sync)
  event_data JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_opened_at TIMESTAMP DEFAULT NOW(),
  
  -- Organization
  is_template BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'personal',
  tags TEXT[] DEFAULT '{}',
  
  -- Calendar link
  calendar_event_id TEXT,
  
  CONSTRAINT unique_user_project UNIQUE(user_id, project_name)
);

-- Enable RLS
ALTER TABLE flyer_projects ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users manage own projects"
ON flyer_projects
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can view templates"
ON flyer_projects
FOR SELECT
TO authenticated
USING (is_template = true);

-- Indexes
CREATE INDEX idx_projects_user ON flyer_projects(user_id, updated_at DESC);
CREATE INDEX idx_projects_templates ON flyer_projects(is_template) WHERE is_template = true;
CREATE INDEX idx_projects_calendar ON flyer_projects(calendar_event_id) WHERE calendar_event_id IS NOT NULL;

COMMENT ON TABLE flyer_projects IS 'Stores user flyer projects with Canva-style management';
