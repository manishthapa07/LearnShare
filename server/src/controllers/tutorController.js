const pool = require('../config/database');

// Create/Update Tutor Profile
exports.createOrUpdateProfile = async (req, res) => {
  try {
    const { expertise, education, experience_years, hourly_rate, availability } = req.body;

    const expertiseArray = Array.isArray(expertise) ? expertise : expertise.split(',').map(e => e.trim());

    // Check if profile exists
    const existingProfile = await pool.query(
      'SELECT * FROM tutor_profiles WHERE user_id = $1',
      [req.user.id]
    );

    let result;
    if (existingProfile.rows.length > 0) {
      // Update existing profile
      result = await pool.query(
        `UPDATE tutor_profiles 
         SET expertise = $1, education = $2, experience_years = $3, hourly_rate = $4, availability = $5
         WHERE user_id = $6
         RETURNING *`,
        [expertiseArray, education, experience_years, hourly_rate, availability, req.user.id]
      );
    } else {
      // Create new profile
      result = await pool.query(
        `INSERT INTO tutor_profiles (user_id, expertise, education, experience_years, hourly_rate, availability)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [req.user.id, expertiseArray, education, experience_years, hourly_rate, availability]
      );
    }

    res.json({
      message: 'Tutor profile saved successfully',
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('Create/Update tutor profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Tutor Profile
exports.getTutorProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT tp.*, u.username, u.full_name, u.bio, u.email
       FROM tutor_profiles tp
       JOIN users u ON tp.user_id = u.id
       WHERE tp.user_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tutor profile not found' });
    }

    res.json({ profile: result.rows[0] });
  } catch (error) {
    console.error('Get tutor profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get All Tutors
exports.getAllTutors = async (req, res) => {
  try {
    const { expertise, search } = req.query;

    let query = `
      SELECT tp.*, u.username, u.full_name, u.bio
      FROM tutor_profiles tp
      JOIN users u ON tp.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (expertise) {
      query += ` AND $${paramCount} = ANY(tp.expertise)`;
      params.push(expertise);
      paramCount++;
    }

    if (search) {
      query += ` AND (u.full_name ILIKE $${paramCount} OR u.username ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY tp.rating DESC, tp.total_sessions DESC';

    const result = await pool.query(query, params);

    res.json({ tutors: result.rows });
  } catch (error) {
    console.error('Get all tutors error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Book Session
exports.bookSession = async (req, res) => {
  try {
    const { tutor_id, subject, description, scheduled_date, scheduled_time, duration_minutes } = req.body;

    // Verify tutor exists
    const tutorCheck = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND role = $2',
      [tutor_id, 'tutor']
    );

    if (tutorCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Tutor not found' });
    }

    const result = await pool.query(
      `INSERT INTO session_bookings (student_id, tutor_id, subject, description, scheduled_date, scheduled_time, duration_minutes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, tutor_id, subject, description, scheduled_date, scheduled_time, duration_minutes]
    );

    res.status(201).json({
      message: 'Session booked successfully',
      booking: result.rows[0]
    });
  } catch (error) {
    console.error('Book session error:', error);
    res.status(500).json({ error: 'Server error during session booking' });
  }
};

// Get User's Session Bookings
exports.getUserBookings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sb.*, 
        t.username as tutor_username, t.full_name as tutor_name,
        s.username as student_username, s.full_name as student_name
       FROM session_bookings sb
       JOIN users t ON sb.tutor_id = t.id
       JOIN users s ON sb.student_id = s.id
       WHERE sb.student_id = $1 OR sb.tutor_id = $1
       ORDER BY sb.scheduled_date DESC, sb.scheduled_time DESC`,
      [req.user.id]
    );

    res.json({ bookings: result.rows });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update Session Status
exports.updateSessionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, meeting_link, notes } = req.body;

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get booking
    const bookingResult = await pool.query(
      'SELECT * FROM session_bookings WHERE id = $1',
      [id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    // Only tutor or student can update
    if (booking.tutor_id !== req.user.id && booking.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await pool.query(
      `UPDATE session_bookings 
       SET status = $1, meeting_link = $2, notes = $3
       WHERE id = $4
       RETURNING *`,
      [status, meeting_link || booking.meeting_link, notes || booking.notes, id]
    );

    // Update tutor stats if completed
    if (status === 'completed' && booking.status !== 'completed') {
      await pool.query(
        'UPDATE tutor_profiles SET total_sessions = total_sessions + 1 WHERE user_id = $1',
        [booking.tutor_id]
      );
    }

    res.json({
      message: 'Session status updated successfully',
      booking: result.rows[0]
    });
  } catch (error) {
    console.error('Update session status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
