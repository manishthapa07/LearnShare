const pool = require('../config/database');
const { createNotification } = require('./notificationController');

// Create Tuition Class
exports.createClass = async (req, res) => {
  try {
    const {
      title,
      subject,
      description,
      class_type,
      start_date,
      end_date,
      class_days,
      start_time,
      end_time,
      monthly_fee,
      hourly_rate,
      max_students
    } = req.body;

    // Validate required fields
    if (!title || !subject || !class_type || !start_date || !end_date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate class type pricing
    if (class_type === 'monthly' && !monthly_fee) {
      return res.status(400).json({ error: 'Monthly fee is required for monthly classes' });
    }
    if (class_type === 'hourly' && !hourly_rate) {
      return res.status(400).json({ error: 'Hourly rate is required for hourly classes' });
    }

    const result = await pool.query(
      `INSERT INTO tuition_classes 
       (tutor_id, title, subject, description, class_type, start_date, end_date, 
        class_days, start_time, end_time, monthly_fee, hourly_rate, max_students)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [req.user.id, title, subject, description, class_type, start_date, end_date,
       class_days, start_time, end_time, 
       monthly_fee || null, 
       hourly_rate || null, 
       max_students || 20]
    );

    res.status(201).json({
      message: 'Class created successfully',
      class: result.rows[0]
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get All Active Classes
exports.getAllClasses = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tc.*, 
              u.username as tutor_username, 
              u.full_name as tutor_name,
              u.average_rating as tutor_rating,
              tp.expertise
       FROM tuition_classes tc
       JOIN users u ON tc.tutor_id = u.id
       LEFT JOIN tutor_profiles tp ON tc.tutor_id = tp.user_id
       WHERE tc.status = 'active' AND tc.end_date >= CURRENT_DATE
       ORDER BY tc.created_at DESC`
    );

    res.json({ classes: result.rows });
  } catch (error) {
    console.error('Get all classes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Tutor's Classes
exports.getTutorClasses = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tc.*,
              COUNT(DISTINCT ce.id) as enrolled_count
       FROM tuition_classes tc
       LEFT JOIN class_enrollments ce ON tc.id = ce.class_id AND ce.status = 'active'
       WHERE tc.tutor_id = $1
       GROUP BY tc.id
       ORDER BY tc.created_at DESC`,
      [req.user.id]
    );

    res.json({ classes: result.rows });
  } catch (error) {
    console.error('Get tutor classes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Class Details
exports.getClassDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT tc.*, 
              u.username as tutor_username, 
              u.full_name as tutor_name,
              u.email as tutor_email,
              u.average_rating as tutor_rating,
              tp.expertise,
              tp.education,
              COUNT(DISTINCT ce.id) as enrolled_count
       FROM tuition_classes tc
       JOIN users u ON tc.tutor_id = u.id
       LEFT JOIN tutor_profiles tp ON tc.tutor_id = tp.user_id
       LEFT JOIN class_enrollments ce ON tc.id = ce.class_id AND ce.status = 'active'
       WHERE tc.id = $1
       GROUP BY tc.id, u.id, tp.user_id, tp.expertise, tp.education`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json({ class: result.rows[0] });
  } catch (error) {
    console.error('Get class details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update Class
exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      subject,
      description,
      class_type,
      start_date,
      end_date,
      class_days,
      start_time,
      end_time,
      monthly_fee,
      hourly_rate,
      max_students,
      status
    } = req.body;

    // Verify tutor owns the class
    const classCheck = await pool.query(
      'SELECT * FROM tuition_classes WHERE id = $1 AND tutor_id = $2',
      [id, req.user.id]
    );

    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found or unauthorized' });
    }

    const result = await pool.query(
      `UPDATE tuition_classes 
       SET title = COALESCE($1, title),
           subject = COALESCE($2, subject),
           description = COALESCE($3, description),
           class_type = COALESCE($4, class_type),
           start_date = COALESCE($5, start_date),
           end_date = COALESCE($6, end_date),
           class_days = COALESCE($7, class_days),
           start_time = COALESCE($8, start_time),
           end_time = COALESCE($9, end_time),
           monthly_fee = COALESCE($10, monthly_fee),
           hourly_rate = COALESCE($11, hourly_rate),
           max_students = COALESCE($12, max_students),
           status = COALESCE($13, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $14
       RETURNING *`,
      [title, subject, description, class_type, start_date, end_date, class_days, 
       start_time, end_time, monthly_fee, hourly_rate, max_students, status, id]
    );

    res.json({
      message: 'Class updated successfully',
      class: result.rows[0]
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Helper function to generate session dates based on class schedule
const generateSessionDates = (startDate, endDate, classDays) => {
  const sessions = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const dayMap = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };
  
  const targetDays = classDays.map(day => dayMap[day]);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (targetDays.includes(d.getDay())) {
      sessions.push(new Date(d));
    }
  }
  
  return sessions;
};

// Enroll in Class
exports.enrollInClass = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { classId } = req.params;

    // Check if class exists and has space
    const classResult = await client.query(
      `SELECT * FROM tuition_classes WHERE id = $1 AND status = 'active'`,
      [classId]
    );

    if (classResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Class not found or inactive' });
    }

    const classData = classResult.rows[0];

    // Check current enrollment
    const enrollmentCount = await client.query(
      'SELECT COUNT(*) as count FROM class_enrollments WHERE class_id = $1 AND status = $2',
      [classId, 'active']
    );

    if (parseInt(enrollmentCount.rows[0].count) >= classData.max_students) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Class is full' });
    }

    // Check if already enrolled
    const existingEnrollment = await client.query(
      'SELECT * FROM class_enrollments WHERE class_id = $1 AND student_id = $2',
      [classId, req.user.id]
    );

    if (existingEnrollment.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Already enrolled in this class' });
    }

    // Enroll student
    const result = await client.query(
      `INSERT INTO class_enrollments (class_id, student_id)
       VALUES ($1, $2)
       RETURNING *`,
      [classId, req.user.id]
    );

    // Update enrollment count
    await client.query(
      'UPDATE tuition_classes SET current_enrolled = current_enrolled + 1 WHERE id = $1',
      [classId]
    );

    // Generate session bookings for all class dates
    const sessionDates = generateSessionDates(
      classData.start_date,
      classData.end_date,
      classData.class_days
    );

    // Calculate duration in minutes
    const [startHour, startMin] = classData.start_time.split(':').map(Number);
    const [endHour, endMin] = classData.end_time.split(':').map(Number);
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    // Create a single payment entry for both monthly and hourly classes
    let classPaymentId = null;
    const totalAmount = classData.class_type === 'monthly' 
      ? classData.monthly_fee 
      : (classData.hourly_rate * durationMinutes * sessionDates.length) / 60;
    
    const paymentResult = await client.query(
      `INSERT INTO session_payments 
       (session_id, student_id, tutor_id, amount, class_id, payment_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [null, req.user.id, classData.tutor_id, totalAmount, classId, classData.class_type]
    );
    classPaymentId = paymentResult.rows[0].id;

    // Create session bookings for each class date
    for (const sessionDate of sessionDates) {
      const sessionResult = await client.query(
        `INSERT INTO session_bookings 
         (student_id, tutor_id, subject, description, scheduled_date, scheduled_time, 
          duration_minutes, status, class_id, session_type, is_recurring)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [
          req.user.id,
          classData.tutor_id,
          classData.subject,
          `Class: ${classData.title}`,
          sessionDate.toISOString().split('T')[0],
          classData.start_time,
          durationMinutes,
          'confirmed', // Auto-confirm class sessions
          classId,
          'class',
          true
        ]
      );

      // Link the single payment to the first session
      if (classPaymentId) {
        await client.query(
          `UPDATE session_payments SET session_id = $1 WHERE id = $2 AND session_id IS NULL`,
          [sessionResult.rows[0].id, classPaymentId]
        );
        classPaymentId = null; // Only link to first session
      }
    }

    await client.query('COMMIT');

    // Notify tutor
    await createNotification(
      classData.tutor_id,
      'class_enrollment',
      `New student enrolled in your ${classData.title} class. ${sessionDates.length} sessions created.`,
      classId
    );

    res.status(201).json({
      message: `Enrolled successfully! ${sessionDates.length} sessions created.`,
      enrollment: result.rows[0],
      sessionsCreated: sessionDates.length
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Enroll in class error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

// Cancel Enrollment
exports.cancelEnrollment = async (req, res) => {
  const client = await pool.connect();
  try {
    const { classId } = req.params;
    await client.query('BEGIN');

    // Check enrollment exists and belongs to user
    const enrollmentCheck = await client.query(
      `SELECT ce.*, tc.class_type, tc.monthly_fee, tc.hourly_rate 
       FROM class_enrollments ce
       JOIN tuition_classes tc ON ce.class_id = tc.id
       WHERE ce.class_id = $1 AND ce.student_id = $2`,
      [classId, req.user.id]
    );

    if (enrollmentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    const enrollment = enrollmentCheck.rows[0];

    // Check if any payment has been approved (prevent cancellation if paid)
    const paidSessionsCheck = await client.query(
      `SELECT COUNT(*) as paid_count
       FROM session_payments sp
       WHERE (sp.class_id = $1 OR sp.session_id IN (
         SELECT id FROM session_bookings WHERE class_id = $1
       ))
       AND sp.student_id = $2
       AND sp.status = 'approved'`,
      [classId, req.user.id]
    );

    if (parseInt(paidSessionsCheck.rows[0].paid_count) > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot cancel enrollment - payment already approved. Please contact support.' });
    }

    // Delete all unpaid/pending payment records
    await client.query(
      `DELETE FROM session_payments
       WHERE (class_id = $1 OR session_id IN (
         SELECT id FROM session_bookings WHERE class_id = $1 AND student_id = $2
       ))
       AND student_id = $2
       AND status IN ('pending', 'submitted')`,
      [classId, req.user.id]
    );

    // Delete all session bookings for this class
    await client.query(
      `DELETE FROM session_bookings
       WHERE class_id = $1 AND student_id = $2`,
      [classId, req.user.id]
    );

    // Delete enrollment
    await client.query(
      `DELETE FROM class_enrollments
       WHERE class_id = $1 AND student_id = $2`,
      [classId, req.user.id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Enrollment cancelled successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cancel enrollment error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

// Get Student's Enrolled Classes
exports.getMyEnrolledClasses = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tc.*, ce.enrollment_date, ce.status as enrollment_status, ce.payment_status,
              u.username as tutor_username, u.full_name as tutor_name
       FROM class_enrollments ce
       JOIN tuition_classes tc ON ce.class_id = tc.id
       JOIN users u ON tc.tutor_id = u.id
       WHERE ce.student_id = $1
       ORDER BY ce.enrollment_date DESC`,
      [req.user.id]
    );

    res.json({ classes: result.rows });
  } catch (error) {
    console.error('Get enrolled classes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete Class
exports.deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify tutor owns the class
    const classCheck = await pool.query(
      'SELECT * FROM tuition_classes WHERE id = $1 AND tutor_id = $2',
      [id, req.user.id]
    );

    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found or unauthorized' });
    }

    await pool.query('DELETE FROM tuition_classes WHERE id = $1', [id]);

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = exports;
