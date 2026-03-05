-- Reports Table Migration
-- Run this on your existing LearnShare database

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN (
        'harassment', 'fraud', 'inappropriate_behavior',
        'no_show', 'spam', 'fake_profile', 'other'
    )),
    description TEXT NOT NULL,
    related_session_id UUID REFERENCES session_bookings(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
    action_taken TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- prevent duplicate reports for the same pair + session
    CONSTRAINT no_duplicate_report UNIQUE (reporter_id, reported_id, related_session_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_reporter  ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported  ON reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_status    ON reports(status);

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
