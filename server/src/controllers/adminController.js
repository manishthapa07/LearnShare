const pool = require('../config/database');
const logger = require('../utils/logger');

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const [users, notes, payments, questions, sessions, sessionPayments, reports] =
      await Promise.all([
        pool.query('SELECT COUNT(*) FROM users'),
        pool.query('SELECT COUNT(*) FROM notes'),
        pool.query(`
          SELECT
            COUNT(*) FILTER (WHERE status = 'pending')  AS pending,
            COUNT(*) FILTER (WHERE status = 'approved') AS approved,
            COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
            COUNT(*) AS total
          FROM payments
        `),
        pool.query('SELECT COUNT(*) FROM questions'),
        pool.query('SELECT COUNT(*) FROM session_bookings'),
        pool.query(`
          SELECT
            COUNT(*) FILTER (WHERE status = 'pending')  AS pending,
            COUNT(*) FILTER (WHERE status = 'approved') AS approved,
            COUNT(*) AS total
          FROM session_payments
        `),
        pool.query(`
          SELECT
            COUNT(*) FILTER (WHERE status = 'pending')      AS pending,
            COUNT(*) FILTER (WHERE status = 'under_review') AS under_review,
            COUNT(*) AS total
          FROM reports
        `),
      ]);

    const roleBreakdown = await pool.query(
      `SELECT role, COUNT(*) AS count FROM users GROUP BY role`
    );

    res.json({
      users: {
        total: parseInt(users.rows[0].count),
        byRole: Object.fromEntries(
          roleBreakdown.rows.map(r => [r.role, parseInt(r.count)])
        ),
      },
      notes: { total: parseInt(notes.rows[0].count) },
      payments: {
        total: parseInt(payments.rows[0].total),
        pending: parseInt(payments.rows[0].pending),
        approved: parseInt(payments.rows[0].approved),
        rejected: parseInt(payments.rows[0].rejected),
      },
      questions: { total: parseInt(questions.rows[0].count) },
      sessions: { total: parseInt(sessions.rows[0].count) },
      sessionPayments: {
        total: parseInt(sessionPayments.rows[0].total),
        pending: parseInt(sessionPayments.rows[0].pending),
        approved: parseInt(sessionPayments.rows[0].approved),
      },
      reports: {
        total: parseInt(reports.rows[0].total),
        pending: parseInt(reports.rows[0].pending),
        under_review: parseInt(reports.rows[0].under_review),
      },
    });
  } catch (error) {
    logger.error('Admin getDashboardStats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── User Management ──────────────────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (u.username ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.full_name ILIKE $${params.length})`;
    }
    if (role) {
      params.push(role);
      where += ` AND u.role = $${params.length}`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users u ${where}`,
      params
    );

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.full_name, u.mobile,
              u.role, u.created_at,
              (SELECT COUNT(*) FROM notes n WHERE n.uploader_id = u.id) AS notes_count,
              (SELECT COUNT(*) FROM payments p WHERE p.user_id = u.id) AS payments_count
       FROM users u
       ${where}
       ORDER BY u.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    logger.error('Admin getAllUsers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['student', 'tutor', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const result = await pool.query(
      `UPDATE users SET role = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, username, email, full_name, role`,
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Role updated', user: result.rows[0] });
  } catch (error) {
    logger.error('Admin updateUserRole error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, username',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: `User ${result.rows[0].username} deleted` });
  } catch (error) {
    logger.error('Admin deleteUser error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Notes Management ─────────────────────────────────────────────────────────
exports.getAllNotes = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (n.title ILIKE $${params.length} OR n.subject ILIKE $${params.length})`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM notes n ${where}`,
      params
    );

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT n.id, n.title, n.subject, n.category, n.price, n.is_free,
              n.downloads, n.rating, n.created_at,
              u.username AS uploader, u.id AS uploader_id
       FROM notes n
       JOIN users u ON n.uploader_id = u.id
       ${where}
       ORDER BY n.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      notes: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    logger.error('Admin getAllNotes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM notes WHERE id = $1 RETURNING id, title',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ message: `Note "${result.rows[0].title}" deleted` });
  } catch (error) {
    logger.error('Admin deleteNote error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Forum Management ─────────────────────────────────────────────────────────
exports.getAllQuestions = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (q.title ILIKE $${params.length} OR q.subject ILIKE $${params.length})`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM questions q ${where}`,
      params
    );

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT q.id, q.title, q.subject, q.votes, q.views, q.is_answered,
              q.created_at,
              u.username AS author, u.id AS author_id,
              (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.id) AS answer_count
       FROM questions q
       JOIN users u ON q.user_id = u.id
       ${where}
       ORDER BY q.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      questions: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    logger.error('Admin getAllQuestions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM questions WHERE id = $1 RETURNING id, title',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({ message: `Question deleted` });
  } catch (error) {
    logger.error('Admin deleteQuestion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─── Reports Management ───────────────────────────────────────────────────────
exports.getAllReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params = [];

    if (status) {
      params.push(status);
      where += ` AND r.status = $${params.length}`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM reports r ${where}`,
      params
    );

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT r.*,
              rep.full_name  AS reporter_name,  rep.username  AS reporter_username,  rep.role AS reporter_role,
              rep2.full_name AS reported_name,  rep2.username AS reported_username, rep2.role AS reported_role,
              adm.full_name  AS reviewer_name,
              s.subject      AS session_subject,
              s.scheduled_date AS session_date
       FROM reports r
       JOIN users rep  ON r.reporter_id  = rep.id
       JOIN users rep2 ON r.reported_id  = rep2.id
       LEFT JOIN users adm ON r.reviewed_by = adm.id
       LEFT JOIN session_bookings s ON r.related_session_id = s.id
       ${where}
       ORDER BY
         CASE r.status WHEN 'pending' THEN 0 WHEN 'under_review' THEN 1 ELSE 2 END,
         r.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      reports: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    logger.error('Admin getAllReports error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, action_taken } = req.body;

    const valid = ['pending', 'under_review', 'resolved', 'dismissed'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE reports
       SET status = $1, action_taken = $2, reviewed_by = $3,
           reviewed_at = CASE WHEN $1 IN ('resolved','dismissed') THEN NOW() ELSE reviewed_at END
       WHERE id = $4
       RETURNING *`,
      [status, action_taken || null, req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report updated', report: result.rows[0] });
  } catch (error) {
    logger.error('Admin updateReportStatus error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
