const pool = require('../config/database');
const { createNotification } = require('./notificationController');
const logger = require('../utils/logger');

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
    logger.error('Create/Update tutor profile error:', error.message);
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
    logger.error('Get tutor profile error:', error);
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
    logger.error('Get all tutors error:', error);
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

    // Get student username for notification
    const studentResult = await pool.query(
      'SELECT username, full_name FROM users WHERE id = $1',
      [req.user.id]
    );
    const studentName = studentResult.rows[0]?.full_name || studentResult.rows[0]?.username;

    const result = await pool.query(
      `INSERT INTO session_bookings (student_id, tutor_id, subject, description, scheduled_date, scheduled_time, duration_minutes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, tutor_id, subject, description, scheduled_date, scheduled_time, duration_minutes]
    );

    // Create notification for tutor
    logger.debug('Creating notification for tutor:', tutor_id);
    await createNotification(
      tutor_id,
      'session_booking',
      `New session booking from ${studentName} for ${subject} on ${scheduled_date}`,
      result.rows[0].id
    );
    logger.debug('Notification created successfully');

    res.status(201).json({
      message: 'Session booked successfully',
      booking: result.rows[0]
    });
  } catch (error) {
    logger.error('Book session error:', error);
    res.status(500).json({ error: 'Server error during session booking' });
  }
};

// Get User's Session Bookings
exports.getUserBookings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sb.*, 
        t.username as tutor_username, t.full_name as tutor_name, t.email as tutor_email,
        s.username as student_username, s.full_name as student_name, s.email as student_email,
        (
          CASE 
            WHEN sb.session_type = 'class' THEN 
              (SELECT status FROM session_payments WHERE class_id = sb.class_id AND student_id = sb.student_id LIMIT 1)
            ELSE 
              (SELECT status FROM session_payments WHERE session_id = sb.id LIMIT 1)
          END
        ) as payment_status,
        (
          CASE 
            WHEN sb.session_type = 'class' THEN 
              (SELECT id FROM session_payments WHERE class_id = sb.class_id AND student_id = sb.student_id LIMIT 1)
            ELSE 
              (SELECT id FROM session_payments WHERE session_id = sb.id LIMIT 1)
          END
        ) as payment_id,
        (
          CASE 
            WHEN sb.session_type = 'class' THEN 
              (SELECT amount FROM session_payments WHERE class_id = sb.class_id AND student_id = sb.student_id LIMIT 1)
            ELSE 
              (SELECT amount FROM session_payments WHERE session_id = sb.id LIMIT 1)
          END
        ) as payment_amount,
        tp.hourly_rate as tutor_hourly_rate,
        tc.monthly_fee as tutor_monthly_fee, 
        tc.hourly_rate as class_hourly_rate,
        tc.class_type,
        CAST((SELECT COUNT(*) FROM session_reviews WHERE session_id = sb.id AND reviewer_id = $1) AS INTEGER) as user_has_reviewed
       FROM session_bookings sb
       JOIN users t ON sb.tutor_id = t.id
       JOIN users s ON sb.student_id = s.id
       LEFT JOIN tutor_profiles tp ON sb.tutor_id = tp.user_id
       LEFT JOIN tuition_classes tc ON sb.class_id = tc.id
       WHERE sb.student_id = $1 OR sb.tutor_id = $1
       ORDER BY sb.scheduled_date DESC, sb.scheduled_time DESC`,
      [req.user.id]
    );

    res.json({ bookings: result.rows });
  } catch (error) {
    logger.error('Get user bookings error:', error);
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

    // Create notification for status change
    if (status === 'confirmed') {
      await createNotification(
        booking.student_id,
        'session_confirmed',
        `Your session for ${booking.subject} has been confirmed by the tutor`,
        id
      );
    } else if (status === 'cancelled') {
      const recipientId = req.user.id === booking.tutor_id ? booking.student_id : booking.tutor_id;
      await createNotification(
        recipientId,
        'session_cancelled',
        `Session for ${booking.subject} has been cancelled`,
        id
      );
    }

    res.json({
      message: 'Session status updated successfully',
      booking: result.rows[0]
    });
  } catch (error) {
    logger.error('Update session status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Submit Session Payment
exports.submitSessionPayment = async (req, res) => {
  try {
    const { session_id, amount } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Payment screenshot is required' });
    }

    // Get session details
    const sessionResult = await pool.query(
      'SELECT * FROM session_bookings WHERE id = $1',
      [session_id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Verify user is the student
    if (session.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the student can submit payment' });
    }

    const screenshotPath = req.file.path.replace(/\\/g, '/');

    const result = await pool.query(
      `INSERT INTO session_payments (session_id, student_id, tutor_id, amount, screenshot_path)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [session_id, req.user.id, session.tutor_id, amount, screenshotPath]
    );

    // Create notification for tutor
    await createNotification(
      session.tutor_id,
      'session_payment',
      `Payment of NPR ${amount} submitted for session: ${session.subject}`,
      result.rows[0].id
    );

    res.status(201).json({
      message: 'Payment submitted successfully',
      payment: result.rows[0]
    });
  } catch (error) {
    logger.error('Submit session payment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Session Payments (for tutor to review)
exports.getSessionPayments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sp.*, 
        sb.subject, sb.scheduled_date, sb.duration_minutes,
        s.username as student_username, s.full_name as student_name
       FROM session_payments sp
       JOIN session_bookings sb ON sp.session_id = sb.id
       JOIN users s ON sp.student_id = s.id
       WHERE sp.tutor_id = $1
       ORDER BY sp.created_at DESC`,
      [req.user.id]
    );

    res.json({ payments: result.rows });
  } catch (error) {
    logger.error('Get session payments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Student's Session Payments
exports.getMySessionPayments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sp.*, 
        sb.subject, sb.scheduled_date, sb.duration_minutes,
        t.username as tutor_username, t.full_name as tutor_name
       FROM session_payments sp
       JOIN session_bookings sb ON sp.session_id = sb.id
       JOIN users t ON sp.tutor_id = t.id
       WHERE sp.student_id = $1
       ORDER BY sp.created_at DESC`,
      [req.user.id]
    );

    res.json({ payments: result.rows });
  } catch (error) {
    logger.error('Get my session payments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Review Session Payment (tutor approves/rejects)
exports.reviewSessionPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, review_notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get payment details
    const paymentResult = await pool.query(
      'SELECT * FROM session_payments WHERE id = $1',
      [id]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = paymentResult.rows[0];

    // Verify user is the tutor
    if (payment.tutor_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the tutor can review this payment' });
    }

    const result = await pool.query(
      `UPDATE session_payments 
       SET status = $1, reviewed_by = $2, review_notes = $3
       WHERE id = $4
       RETURNING *`,
      [status, req.user.id, review_notes, id]
    );

    // Create notification for student
    const notificationMessage = status === 'approved' 
      ? `Your session payment has been approved!`
      : `Your session payment was rejected. ${review_notes || ''}`;
    
    await createNotification(
      payment.student_id,
      'payment_review',
      notificationMessage,
      id
    );

    res.json({
      message: `Payment ${status} successfully`,
      payment: result.rows[0]
    });
  } catch (error) {
    logger.error('Review session payment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create Session Review
exports.createSessionReview = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { rating, review_text } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Get session details
    const sessionResult = await pool.query(
      'SELECT * FROM session_bookings WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Only allow reviews for completed sessions
    if (session.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed sessions' });
    }

    // Determine reviewer and reviewee
    let reviewerId = req.user.id;
    let revieweeId;
    let reviewerRole;

    if (session.student_id === req.user.id) {
      revieweeId = session.tutor_id;
      reviewerRole = 'student';
    } else if (session.tutor_id === req.user.id) {
      revieweeId = session.student_id;
      reviewerRole = 'tutor';
    } else {
      return res.status(403).json({ error: 'You are not part of this session' });
    }

    // Check if review already exists
    const existingReview = await pool.query(
      'SELECT * FROM session_reviews WHERE session_id = $1 AND reviewer_id = $2',
      [sessionId, reviewerId]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({ error: 'You have already reviewed this session' });
    }

    // Create review
    const reviewResult = await pool.query(
      `INSERT INTO session_reviews (session_id, reviewer_id, reviewee_id, rating, review_text, reviewer_role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [sessionId, reviewerId, revieweeId, rating, review_text, reviewerRole]
    );

    // Update reviewee's average rating
    const avgResult = await pool.query(
      'SELECT AVG(rating)::DECIMAL(3,2) as avg_rating, COUNT(*) as total FROM session_reviews WHERE reviewee_id = $1',
      [revieweeId]
    );

    await pool.query(
      'UPDATE users SET average_rating = $1, total_reviews = $2 WHERE id = $3',
      [avgResult.rows[0].avg_rating, avgResult.rows[0].total, revieweeId]
    );

    // Create notification for reviewee
    await createNotification(
      revieweeId,
      'session_review',
      `You received a ${rating}-star review for your session!`,
      sessionId
    );

    res.json({
      message: 'Review submitted successfully',
      review: reviewResult.rows[0]
    });
  } catch (error) {
    logger.error('Create session review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Session Reviews
exports.getSessionReviews = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await pool.query(
      `SELECT sr.*, 
              u.username as reviewer_username, 
              u.full_name as reviewer_name
       FROM session_reviews sr
       JOIN users u ON sr.reviewer_id = u.id
       WHERE sr.session_id = $1
       ORDER BY sr.created_at DESC`,
      [sessionId]
    );

    res.json({ reviews: result.rows });
  } catch (error) {
    logger.error('Get session reviews error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get User Reviews (all reviews received by a user)
exports.getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT sr.*, 
              u.username as reviewer_username, 
              u.full_name as reviewer_name,
              sb.subject,
              sb.scheduled_date
       FROM session_reviews sr
       JOIN users u ON sr.reviewer_id = u.id
       JOIN session_bookings sb ON sr.session_id = sb.id
       WHERE sr.reviewee_id = $1
       ORDER BY sr.created_at DESC`,
      [userId]
    );

    res.json({ reviews: result.rows });
  } catch (error) {
    logger.error('Get user reviews error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
