-- ============================================================================
-- FILE: database/05-indexes.sql
-- PURPOSE: Performance indexes and database optimizations
-- RUN ORDER: 5th (last)
-- ============================================================================

-- ============================================================================
-- COMPOSITE INDEXES for common queries
-- ============================================================================

-- Projects: User's recent projects
CREATE INDEX IF NOT EXISTS idx_projects_user_recent 
ON flyer_projects(user_id, updated_at DESC, is_template)
WHERE is_template = false;

-- Projects: Favorite projects
CREATE INDEX IF NOT EXISTS idx_projects_favorites
ON flyer_projects(user_id, is_favorite, updated_at DESC)
WHERE is_favorite = true;

-- Calendar events: Upcoming events
CREATE INDEX IF NOT EXISTS idx_calendar_upcoming
ON cached_calendar_events(user_id, start_time)
WHERE start_time > NOW();

-- RSVPs: Event attendance stats
CREATE INDEX IF NOT EXISTS idx_rsvp_event_stats
ON rsvp_submissions(event_id, attendance_status, created_at);

-- ============================================================================
-- FULL TEXT SEARCH indexes
-- ============================================================================

-- Projects: Search by name and description
CREATE INDEX IF NOT EXISTS idx_projects_search
ON flyer_projects
USING GIN (to_tsvector('english', project_name || ' ' || COALESCE(description, '')));

-- Calendar events: Search by title
CREATE INDEX IF NOT EXISTS idx_calendar_search
ON cached_calendar_events
USING GIN (to_tsvector('english', event_title || ' ' || COALESCE(event_description, '')));

-- ============================================================================
-- PARTIAL indexes for specific use cases
-- ============================================================================

-- Recently updated projects (last 30 days)
CREATE INDEX IF NOT EXISTS idx_projects_recent_activity
ON flyer_projects(user_id, updated_at DESC)
WHERE updated_at > NOW() - INTERVAL '30 days';

-- Active calendar connections
CREATE INDEX IF NOT EXISTS idx_active_calendar_connections
ON google_calendar_connections(user_id, last_sync_at)
WHERE sync_enabled = true;

-- Pending RSVPs (no calendar added yet)
CREATE INDEX IF NOT EXISTS idx_rsvp_pending_calendar
ON rsvp_submissions(event_id, user_email)
WHERE added_to_calendar = false;

-- ============================================================================
-- MATERIALIZED VIEWS for heavy queries
-- ============================================================================

-- Daily project creation stats
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_project_stats AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as projects_created,
  COUNT(DISTINCT user_id) as unique_users
FROM flyer_projects
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE UNIQUE INDEX ON daily_project_stats(date);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_daily_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_project_stats;
END;
$$ LANGUAGE plpgsql;

-- Auto-refresh trigger (runs daily at midnight)
-- Note: You'll need to set up a cron job or pg_cron extension

-- ============================================================================
-- VACUUM and ANALYZE for performance
-- ============================================================================

-- Run these periodically (set up as cron jobs)
COMMENT ON TABLE flyer_projects IS 'Run VACUUM ANALYZE flyer_projects weekly';
COMMENT ON TABLE cached_calendar_events IS 'Run VACUUM ANALYZE cached_calendar_events daily';
COMMENT ON TABLE rsvp_submissions IS 'Run VACUUM ANALYZE rsvp_submissions daily';

-- ============================================================================
-- QUERY PERFORMANCE HINTS
-- ============================================================================

COMMENT ON INDEX idx_projects_user_recent IS 'Use for: User dashboard recent projects query';
COMMENT ON INDEX idx_calendar_upcoming IS 'Use for: Upcoming events sidebar widget';
COMMENT ON INDEX idx_rsvp_event_stats IS 'Use for: Event analytics dashboard';
COMMENT ON INDEX idx_projects_search IS 'Use for: Project search functionality';
