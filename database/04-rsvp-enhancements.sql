-- ============================================================================
-- FILE: database/04-rsvp-enhancements.sql
-- PURPOSE: Enhanced RSVP with "Add to Calendar" functionality
-- RUN ORDER: 4th
-- ============================================================================

-- Drop old table if exists and create new enhanced version
DROP TABLE IF EXISTS rsvp_submissions CASCADE;

CREATE TABLE rsvp_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event reference
  event_id TEXT NOT NULL,
  
  -- Attendee info
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phone TEXT,
  
  -- RSVP details
  attendance_status TEXT DEFAULT 'attending' CHECK (attendance_status IN ('attending', 'maybe', 'not_attending')),
  number_of_guests INTEGER DEFAULT 1 CHECK (number_of_guests >= 1 AND number_of_guests <= 10),
  dietary_restrictions TEXT,
  special_requests TEXT,
  
  -- Calendar integration
  added_to_calendar BOOLEAN DEFAULT false,
  calendar_platform TEXT, -- 'google', 'apple', 'outlook', 'yahoo'
  
  -- Reminder preferences
  reminder_24h BOOLEAN DEFAULT true,
  reminder_1h BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_email_per_event UNIQUE(event_id, user_email)
);

-- Enable RLS
ALTER TABLE rsvp_submissions ENABLE ROW LEVEL SECURITY;

-- Public can insert RSVPs
CREATE POLICY "Anyone can submit RSVP"
ON rsvp_submissions
FOR INSERT
TO public
WITH CHECK (true);

-- Users can view their own RSVPs
CREATE POLICY "Users view own RSVPs"
ON rsvp_submissions
FOR SELECT
TO public
USING (true);

-- Event creators can view all RSVPs for their events
CREATE POLICY "Creators view event RSVPs"
ON rsvp_submissions
FOR SELECT
TO authenticated
USING (
  event_id IN (
    SELECT event_id FROM event_metadata WHERE created_by = auth.uid()
  )
);

-- Users can update their own RSVPs
CREATE POLICY "Users update own RSVPs"
ON rsvp_submissions
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Indexes
CREATE INDEX idx_rsvp_event ON rsvp_submissions(event_id, created_at DESC);
CREATE INDEX idx_rsvp_email ON rsvp_submissions(user_email);
CREATE INDEX idx_rsvp_status ON rsvp_submissions(attendance_status);

-- Add calendar file cache table (for .ics files)
CREATE TABLE IF NOT EXISTS calendar_file_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  file_content TEXT NOT NULL, -- .ics file content
  file_url TEXT, -- CDN URL if stored
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
  
  UNIQUE(event_id)
);

CREATE INDEX idx_calendar_cache_event ON calendar_file_cache(event_id);
CREATE INDEX idx_calendar_cache_expiry ON calendar_file_cache(expires_at);

COMMENT ON TABLE rsvp_submissions IS 'Enhanced RSVP submissions with calendar integration';
COMMENT ON TABLE calendar_file_cache IS 'Cached .ics calendar files for events';
