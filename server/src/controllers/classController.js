const pool = require('../config/database');
const { createNotification } = require('./notificationController');
const logger = require('../utils/logger');

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
      max_students,
      payment_bank_account,
      payment_esewa_id,
      payment_khalti_id,
      payment_qr_code
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

    // Validate at least one payment method is provided
    if (!payment_bank_account && !payment_esewa_id && !payment_khalti_id && !payment_qr_code) {
      return res.status(400).json({ error: 'Please provide at least one payment receiving method' });
    }

    const result = await pool.query(
      `INSERT INTO tuition_classes 
       (tutor_id, title, subject, description, class_type, start_date, end_date, 
        class_days, start_time, end_time, monthly_fee, hourly_rate, max_students,
        payment_bank_account, payment_esewa_id, payment_khalti_id, payment_qr_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [req.user.id, title, subject, description, class_type, start_date, end_date,
       class_days, start_time, end_time, 
       monthly_fee || null, 
       hourly_rate || null, 
       max_students || 20,
       payment_bank_account || null,
       payment_esewa_id || null,
       payment_khalti_id || null,
       payment_qr_code || null]
    );

    res.status(201).json({
      message: 'Class created successfully',
      class: result.rows[0]
    });
  } catch (error) {
    logger.error('Create class error:', error);
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
    logger.error('Get all classes error:', error);
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
    logger.error('Get tutor classes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Pending Enrollment Requests (Tutor only)
exports.getPendingEnrollments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ce.*, 
              tc.title as class_title,
              tc.subject,
              tc.class_type,
              tc.monthly_fee,
              tc.hourly_rate,
              u.full_name as student_name,
              u.email as student_email,
              u.username as student_username
       FROM class_enrollments ce
       JOIN tuition_classes tc ON ce.class_id = tc.id
       JOIN users u ON ce.student_id = u.id
       WHERE tc.tutor_id = $1 AND ce.status = 'pending'
       ORDER BY ce.created_at ASC`,
      [req.user.id]
    );

    res.json({ enrollmentRequests: result.rows });
  } catch (error) {
    logger.error('Get pending enrollments error:', error);
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
    logger.error('Get class details error:', error);
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
    logger.error('Update class error:', error);
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

    // Check if class exists and is active
    const classResult = await client.query(
      `SELECT * FROM tuition_classes WHERE id = $1 AND status = 'active'`,
      [classId]
    );

    if (classResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Class not found or inactive' });
    }

    const classData = classResult.rows[0];

    // Check current active enrollment count
    const enrollmentCount = await client.query(
      'SELECT COUNT(*) as count FROM class_enrollments WHERE class_id = $1 AND status = $2',
      [classId, 'active']
    );

    if (parseInt(enrollmentCount.rows[0].count) >= classData.max_students) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Class is full' });
    }

    // Check if already enrolled or has any previous enrollment
    const existingEnrollment = await client.query(
      `SELECT * FROM class_enrollments 
       WHERE class_id = $1 AND student_id = $2`,
      [classId, req.user.id]
    );

    let result;
    
    if (existingEnrollment.rows.length > 0) {
      const status = existingEnrollment.rows[0].status;
      
      // If rejected or cancelled, allow re-enrollment by updating to pending
      if (status === 'rejected' || status === 'cancelled') {
        result = await client.query(
          `UPDATE class_enrollments 
           SET status = 'pending', 
               enrollment_date = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE class_id = $1 AND student_id = $2
           RETURNING *`,
          [classId, req.user.id]
        );
      } else {
        // For other statuses, show appropriate error
        await client.query('ROLLBACK');
        
        let errorMessage = 'Already enrolled in this class';
        if (status === 'pending') {
          errorMessage = 'You already have a pending enrollment request for this class';
        } else if (status === 'awaiting_payment') {
          errorMessage = 'Enrollment approved - Please complete payment';
        } else if (status === 'payment_submitted') {
          errorMessage = 'Payment submitted - Waiting for tutor verification';
        }
        
        return res.status(400).json({ error: errorMessage });
      }
    } else {
      // Create new pending enrollment request
      result = await client.query(
        `INSERT INTO class_enrollments (class_id, student_id, status)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [classId, req.user.id, 'pending']
      );
    }

    await client.query('COMMIT');

    // Send response first
    res.status(201).json({
      message: 'Enrollment request sent successfully! Waiting for tutor approval.',
      enrollment: result.rows[0]
    });

    // Notify tutor about enrollment request (non-blocking)
    try {
      await createNotification(
        classData.tutor_id,
        'enrollment_request',
        `New enrollment request for your "${classData.title}" class from a student.`,
        classId
      );
    } catch (notifError) {
      logger.error('Failed to create notification:', notifError);
      // Don't fail the enrollment if notification fails
    }
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Enroll in class error:', error);
    logger.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint
    });
    res.status(500).json({ error: 'Server error: ' + error.message });
  } finally {
    client.release();
  }
};

// Approve Enrollment Request - Uses class payment details (Tutor only)
exports.approveEnrollment = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { enrollmentId } = req.params;

    // Get enrollment details and verify tutor owns the class
    const enrollmentResult = await client.query(
      `SELECT ce.*, 
       tc.id as class_id,
       tc.title as class_title,
       tc.tutor_id,
       tc.max_students,
       tc.class_type,
       tc.monthly_fee,
       tc.hourly_rate,
       tc.start_date,
       tc.end_date,
       tc.class_days,
       tc.start_time,
       tc.end_time,
       tc.payment_bank_account as class_payment_bank_account,
       tc.payment_esewa_id as class_payment_esewa_id,
       tc.payment_khalti_id as class_payment_khalti_id,
       tc.payment_qr_code as class_payment_qr_code,
       u.full_name as student_name
       FROM class_enrollments ce
       JOIN tuition_classes tc ON ce.class_id = tc.id
       JOIN users u ON ce.student_id = u.id
       WHERE ce.id = $1 AND tc.tutor_id = $2`,
      [enrollmentId, req.user.id]
    );

    if (enrollmentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Enrollment request not found or unauthorized' });
    }

    const enrollment = enrollmentResult.rows[0];

    logger.debug('Enrollment approval attempt:', {
      enrollmentId,
      currentStatus: enrollment.status,
      studentId: enrollment.student_id
    });

    if (enrollment.status !== 'pending') {
      await client.query('ROLLBACK');
      let message = 'Enrollment request already processed';
      if (enrollment.status === 'awaiting_payment') {
        message = 'This enrollment has already been approved. Student is awaiting payment.';
      } else if (enrollment.status === 'payment_submitted') {
        message = 'This enrollment has been approved and payment has been submitted. Pending verification.';
      } else if (enrollment.status === 'active') {
        message = 'This enrollment is already active.';
      } else if (enrollment.status === 'rejected') {
        message = 'This enrollment has been rejected.';
      }
      return res.status(400).json({ error: message });
    }

    // Validate class has payment details
    if (!enrollment.class_payment_bank_account && !enrollment.class_payment_esewa_id && 
        !enrollment.class_payment_khalti_id && !enrollment.class_payment_qr_code) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Class does not have payment details set up. Please update your class settings.' });
    }

    // Check if class is full
    const enrollmentCount = await client.query(
      'SELECT COUNT(*) as count FROM class_enrollments WHERE class_id = $1 AND status IN ($2, $3, $4)',
      [enrollment.class_id, 'active', 'awaiting_payment', 'payment_submitted']
    );

    if (parseInt(enrollmentCount.rows[0].count) >= enrollment.max_students) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Class is now full' });
    }

    // Calculate total amount
    const sessionDates = generateSessionDates(
      enrollment.start_date,
      enrollment.end_date,
      enrollment.class_days
    );
    const [startHour, startMin] = enrollment.start_time.split(':').map(Number);
    const [endHour, endMin] = enrollment.end_time.split(':').map(Number);
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    
    let totalAmount;
    if (enrollment.class_type === 'monthly') {
      totalAmount = parseFloat(enrollment.monthly_fee) || 0;
    } else {
      const hourlyRate = parseFloat(enrollment.hourly_rate) || 0;
      totalAmount = (hourlyRate * durationMinutes * sessionDates.length) / 60;
    }

    // Copy payment details from class to enrollment and set status to awaiting_payment
    await client.query(
      `UPDATE class_enrollments SET 
        status = 'awaiting_payment',
        payment_bank_account = $1,
        payment_esewa_id = $2,
        payment_khalti_id = $3,
        payment_qr_code = $4,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [enrollment.class_payment_bank_account, enrollment.class_payment_esewa_id, 
       enrollment.class_payment_khalti_id, enrollment.class_payment_qr_code, enrollmentId]
    );

    await client.query('COMMIT');

    // Send response first
    res.json({
      message: 'Enrollment approved! Student notified to make payment.',
      totalAmount: totalAmount.toFixed(2)
    });

    // Notify student with payment details (non-blocking)
    try {
      await createNotification(
        enrollment.student_id,
        'enrollment_approved',
        `Your enrollment request for "${enrollment.class_title}" has been approved! Please complete the payment of NPR ${totalAmount.toFixed(2)}.`,
        enrollment.class_id
      );
    } catch (notifError) {
      logger.error('Failed to create approval notification:', notifError);
    }
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Approve enrollment error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

// Reject Enrollment Request (Tutor only)
exports.rejectEnrollment = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { enrollmentId } = req.params;
    const { reason } = req.body;

    // Get enrollment details and verify tutor owns the class
    const enrollmentResult = await client.query(
      `SELECT ce.*, tc.title as class_title
       FROM class_enrollments ce
       JOIN tuition_classes tc ON ce.class_id = tc.id
       WHERE ce.id = $1 AND tc.tutor_id = $2`,
      [enrollmentId, req.user.id]
    );

    if (enrollmentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Enrollment request not found or unauthorized' });
    }

    const enrollment = enrollmentResult.rows[0];

    if (enrollment.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Enrollment request already processed' });
    }

    // Update enrollment status to rejected
    await client.query(
      `UPDATE class_enrollments SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [enrollmentId]
    );

    await client.query('COMMIT');

    // Send response first
    res.json({ message: 'Enrollment request rejected' });

    // Notify student (non-blocking)
    try {
      await createNotification(
        enrollment.student_id,
        'enrollment_rejected',
        `Your enrollment request for "${enrollment.class_title}" was not approved.${reason ? ' Reason: ' + reason : ''}`,
        enrollment.class_id
      );
    } catch (notifError) {
      logger.error('Failed to create rejection notification:', notifError);
    }
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Reject enrollment error:', error);
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
    logger.error('Cancel enrollment error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

// Get Student's Enrolled Classes
exports.getMyEnrolledClasses = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tc.*, ce.id as enrollment_id, ce.enrollment_date, ce.status as enrollment_status,
              ce.payment_bank_account, ce.payment_esewa_id, ce.payment_khalti_id, ce.payment_qr_code,
              ce.payment_screenshot, ce.payment_verified, ce.tutor_payment_notes,
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
    logger.error('Get enrolled classes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Submit Enrollment Payment (Student uploads screenshot)
exports.submitEnrollmentPayment = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { enrollmentId } = req.params;
    
    if (!req.file) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Payment screenshot is required' });
    }

    // Store relative path for HTTP access
    const paymentScreenshot = req.file.path.replace(/\\/g, '/').split('server/')[1];

    // Get enrollment and verify student owns it
    const enrollmentResult = await client.query(
      `SELECT ce.*, tc.title, tc.tutor_id
       FROM class_enrollments ce
       JOIN tuition_classes tc ON ce.class_id = tc.id
       WHERE ce.id = $1 AND ce.student_id = $2`,
      [enrollmentId, req.user.id]
    );

    if (enrollmentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Enrollment not found or unauthorized' });
    }

    const enrollment = enrollmentResult.rows[0];

    if (enrollment.status !== 'awaiting_payment') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Enrollment is not awaiting payment' });
    }

    // Update enrollment with payment screenshot
    await client.query(
      `UPDATE class_enrollments SET 
        payment_screenshot = $1,
        status = 'payment_submitted',
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [paymentScreenshot, enrollmentId]
    );

    await client.query('COMMIT');

    // Notify tutor
    await createNotification(
      enrollment.tutor_id,
      'payment_submitted',
      `Student submitted payment for "${enrollment.title}" class. Please verify the payment.`,
      enrollment.class_id
    );

    res.json({ message: 'Payment screenshot submitted successfully! Waiting for tutor verification.' });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Submit enrollment payment error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

// Verify Enrollment Payment - Tutor approves/rejects payment and creates sessions (Tutor only)
exports.verifyEnrollmentPayment = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { enrollmentId } = req.params;
    const { approved, notes } = req.body;

    logger.debug('Payment verification request:', { enrollmentId, approved });

    // First, check current status directly
    const statusCheck = await client.query(
      'SELECT id, status, payment_screenshot FROM class_enrollments WHERE id = $1',
      [enrollmentId]
    );
    logger.debug('Enrollment status check:', statusCheck.rows[0]);

    // Get enrollment details and verify tutor owns the class
    const enrollmentResult = await client.query(
      `SELECT ce.id, ce.student_id, ce.class_id, ce.status as enrollment_status, 
              ce.payment_screenshot, ce.payment_verified, ce.tutor_payment_notes,
              ce.payment_bank_account, ce.payment_esewa_id, ce.payment_khalti_id, ce.payment_qr_code,
              tc.id as class_id_tc, tc.tutor_id, tc.title, tc.subject, tc.description,
              tc.class_type, tc.start_date, tc.end_date, tc.class_days, tc.start_time, tc.end_time,
              tc.monthly_fee, tc.hourly_rate, tc.status as class_status,
              u.full_name as student_name
       FROM class_enrollments ce
       JOIN tuition_classes tc ON ce.class_id = tc.id
       JOIN users u ON ce.student_id = u.id
       WHERE ce.id = $1 AND tc.tutor_id = $2`,
      [enrollmentId, req.user.id]
    );

    logger.debug('Found enrollments:', enrollmentResult.rows.length);

    if (enrollmentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Enrollment not found or unauthorized' });
    }

    const enrollment = enrollmentResult.rows[0];
    logger.debug('Enrollment details:', {
      status: enrollment.enrollment_status,
      hasScreenshot: !!enrollment.payment_screenshot
    });

    if (enrollment.enrollment_status !== 'payment_submitted') {
      await client.query('ROLLBACK');
      const statusMsg = enrollment.enrollment_status === 'awaiting_payment' 
        ? 'Student has not submitted payment yet. Please wait for payment submission.'
        : enrollment.enrollment_status === 'active'
        ? 'This enrollment has already been approved and activated.'
        : `Cannot verify - enrollment status is '${enrollment.enrollment_status}'.`;
      return res.status(400).json({ error: statusMsg });
    }

    if (!enrollment.payment_screenshot) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No payment screenshot found for this enrollment' });
    }

    if (!approved) {
      // Reject payment - send back to awaiting_payment
      await client.query(
        `UPDATE class_enrollments SET 
          status = 'awaiting_payment',
          tutor_payment_notes = $1,
          payment_screenshot = NULL,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [notes || 'Payment rejected', enrollmentId]
      );

      await client.query('COMMIT');

      // Notify student
      await createNotification(
        enrollment.student_id,
        'payment_rejected',
        `Payment for "${enrollment.title}" was rejected. ${notes ? 'Reason: ' + notes : 'Please resubmit.'}`,
        enrollment.class_id
      );

      return res.json({ message: 'Payment rejected' });
    }

    // Payment approved - create sessions
    await client.query(
      `UPDATE class_enrollments SET 
        status = 'active',
        payment_verified = true,
        payment_verified_at = CURRENT_TIMESTAMP,
        tutor_payment_notes = $1,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [notes || 'Payment approved', enrollmentId]
    );

    // Update class enrollment count
    await client.query(
      'UPDATE tuition_classes SET current_enrolled = current_enrolled + 1 WHERE id = $1',
      [enrollment.class_id]
    );

    // Generate session bookings
    const sessionDates = generateSessionDates(
      enrollment.start_date,
      enrollment.end_date,
      enrollment.class_days
    );

    const [startHour, startMin] = enrollment.start_time.split(':').map(Number);
    const [endHour, endMin] = enrollment.end_time.split(':').map(Number);
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    // Create a single payment entry
    let classPaymentId = null;
    const totalAmount = enrollment.class_type === 'monthly' 
      ? enrollment.monthly_fee 
      : (enrollment.hourly_rate * durationMinutes * sessionDates.length) / 60;
    
    const paymentResult = await client.query(
      `INSERT INTO session_payments 
       (session_id, student_id, tutor_id, amount, class_id, payment_type, status, screenshot_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [null, enrollment.student_id, enrollment.tutor_id, totalAmount, enrollment.class_id, enrollment.class_type, 'approved', enrollment.payment_screenshot]
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
          enrollment.student_id,
          enrollment.tutor_id,
          enrollment.subject,
          `Class: ${enrollment.title}`,
          sessionDate.toISOString().split('T')[0],
          enrollment.start_time,
          durationMinutes,
          'confirmed',
          enrollment.class_id,
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
        classPaymentId = null;
      }
    }

    await client.query('COMMIT');

    // Notify student
    await createNotification(
      enrollment.student_id,
      'payment_verified',
      `Payment verified! You are now enrolled in "${enrollment.title}". ${sessionDates.length} sessions created.`,
      enrollment.class_id
    );

    res.json({
      message: `Payment verified! ${sessionDates.length} sessions created.`,
      sessionsCreated: sessionDates.length
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Verify enrollment payment error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

// Get Enrollment Payment Details (Student)
exports.getEnrollmentPaymentDetails = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const result = await pool.query(
      `SELECT ce.*, 
       tc.title, 
       tc.subject, 
       tc.tutor_id, 
       tc.class_type,
       tc.monthly_fee,
       tc.hourly_rate,
       tc.start_date,
       tc.end_date,
       tc.class_days,
       tc.start_time,
       tc.end_time,
       u.full_name as tutor_name
       FROM class_enrollments ce
       JOIN tuition_classes tc ON ce.class_id = tc.id
       JOIN users u ON tc.tutor_id = u.id
       WHERE ce.id = $1 AND ce.student_id = $2`,
      [enrollmentId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    // Calculate total amount
    const enrollment = result.rows[0];
    const sessionDates = generateSessionDates(
      enrollment.start_date,
      enrollment.end_date,
      enrollment.class_days
    );
    const [startHour, startMin] = enrollment.start_time.split(':').map(Number);
    const [endHour, endMin] = enrollment.end_time.split(':').map(Number);
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    
    let totalAmount;
    if (enrollment.class_type === 'monthly') {
      totalAmount = parseFloat(enrollment.monthly_fee) || 0;
    } else {
      const hourlyRate = parseFloat(enrollment.hourly_rate) || 0;
      totalAmount = (hourlyRate * durationMinutes * sessionDates.length) / 60;
    }

    res.json({
      ...enrollment,
      totalAmount: totalAmount.toFixed(2),
      sessionCount: sessionDates.length
    });
  } catch (error) {
    logger.error('Get enrollment payment details error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Pending Payment Verifications (Tutor)
exports.getPendingPaymentVerifications = async (req, res) => {
  try {
    logger.debug('Getting pending payment verifications for tutor:', req.user.id);
    
    const result = await pool.query(
      `SELECT ce.*, tc.title, tc.subject, tc.class_type, tc.monthly_fee, tc.hourly_rate,
              u.full_name as student_name, u.username as student_username
       FROM class_enrollments ce
       JOIN tuition_classes tc ON ce.class_id = tc.id
       JOIN users u ON ce.student_id = u.id
       WHERE tc.tutor_id = $1 
         AND ce.status = 'payment_submitted'
         AND ce.payment_screenshot IS NOT NULL
       ORDER BY ce.updated_at DESC`,
      [req.user.id]
    );

    logger.debug(`Found ${result.rows.length} pending payment verifications`);

    res.json({ verifications: result.rows });
  } catch (error) {
    logger.error('Get pending payment verifications error:', error);
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
    logger.error('Delete class error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = exports;
