const pool = require('../config/database');
const logger = require('../utils/logger');

// Submit a report
exports.submitReport = async (req, res) => {
  try {
    const { reported_id, report_type, description, related_session_id } = req.body;
    const reporter_id = req.user.id;

    if (!reported_id || !report_type || !description?.trim()) {
      return res.status(400).json({ error: 'reported_id, report_type, and description are required' });
    }

    const wordCount = description.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 5) {
      return res.status(400).json({ error: 'Description must be at least 5 words' });
    }

    if (reported_id === reporter_id) {
      return res.status(400).json({ error: 'You cannot report yourself' });
    }

    const validTypes = ['harassment', 'fraud', 'inappropriate_behavior', 'no_show', 'spam', 'fake_profile', 'other'];
    if (!validTypes.includes(report_type)) {
      return res.status(400).json({ error: 'Invalid report type' });
    }

    // Verify reported user exists
    const userCheck = await pool.query('SELECT id, full_name FROM users WHERE id = $1', [reported_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Reported user not found' });
    }

    // If related_session_id given, verify reporter is part of that session
    if (related_session_id) {
      const sessionCheck = await pool.query(
        'SELECT id FROM session_bookings WHERE id = $1 AND (student_id = $2 OR tutor_id = $2)',
        [related_session_id, reporter_id]
      );
      if (sessionCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Session not found or you are not part of it' });
      }
    }

    const result = await pool.query(
      `INSERT INTO reports (reporter_id, reported_id, report_type, description, related_session_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [reporter_id, reported_id, report_type, description.trim(), related_session_id || null]
    );

    logger.info(`Report submitted by ${reporter_id} against ${reported_id}`);
    res.status(201).json({ message: 'Report submitted successfully', report: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'You have already submitted a report for this user/session' });
    }
    logger.error('Submit report error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get reports submitted by the current user
exports.getMyReports = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*,
              u.full_name AS reported_name, u.username AS reported_username, u.role AS reported_role,
              s.subject AS session_subject,
              s.scheduled_date AS session_date
       FROM reports r
       JOIN users u ON r.reported_id = u.id
       LEFT JOIN session_bookings s ON r.related_session_id = s.id
       WHERE r.reporter_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    res.json({ reports: result.rows });
  } catch (error) {
    logger.error('Get my reports error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
