const pool = require('../config/database');
const logger = require('../utils/logger');

// Create Reminder
exports.createReminder = async (req, res) => {
  try {
    const { title, description, reminder_date, reminder_time, type, related_id } = req.body;

    const result = await pool.query(
      `INSERT INTO reminders (user_id, title, description, reminder_date, reminder_time, type, related_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, title, description, reminder_date, reminder_time, type || null, related_id || null]
    );

    res.status(201).json({
      message: 'Reminder created successfully',
      reminder: result.rows[0]
    });
  } catch (error) {
    logger.error('Create reminder error:', error);
    res.status(500).json({ error: 'Server error during reminder creation' });
  }
};

// Get User's Reminders
exports.getUserReminders = async (req, res) => {
  try {
    const { is_completed } = req.query;

    let query = 'SELECT * FROM reminders WHERE user_id = $1';
    const params = [req.user.id];

    if (is_completed !== undefined) {
      query += ' AND is_completed = $2';
      params.push(is_completed === 'true');
    }

    query += ' ORDER BY reminder_date ASC, reminder_time ASC';

    const result = await pool.query(query, params);

    res.json({ reminders: result.rows });
  } catch (error) {
    logger.error('Get user reminders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update Reminder
exports.updateReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, reminder_date, reminder_time, is_completed } = req.body;

    const result = await pool.query(
      `UPDATE reminders 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           reminder_date = COALESCE($3, reminder_date),
           reminder_time = COALESCE($4, reminder_time),
           is_completed = COALESCE($5, is_completed)
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [title, description, reminder_date, reminder_time, is_completed, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json({
      message: 'Reminder updated successfully',
      reminder: result.rows[0]
    });
  } catch (error) {
    logger.error('Update reminder error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete Reminder
exports.deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM reminders WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    logger.error('Delete reminder error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Aggregated Reminders (all types consolidated)
exports.getAggregatedReminders = async (req, res) => {
  try {
    const userId = req.user.id;
    const allReminders = [];

    // 1. Get user-created reminders (not completed)
    const userReminders = await pool.query(
      `SELECT id, title, description, reminder_date as date, reminder_time as time, 
              'custom' as reminder_type, type, related_id, is_completed, created_at
       FROM reminders 
       WHERE user_id = $1 AND is_completed = false
       ORDER BY reminder_date ASC, reminder_time ASC`,
      [userId]
    );

    userReminders.rows.forEach(r => {
      allReminders.push({
        id: r.id,
        type: 'custom',
        subtype: r.type,
        title: r.title,
        description: r.description,
        date: r.date,
        time: r.time,
        priority: isPastDue(r.date, r.time) ? 'high' : 'medium',
        actionRequired: false,
        relatedId: r.related_id
      });
    });

    // 2. Get classes starting within next 2 hours (as student)
    const upcomingClasses = await pool.query(
      `SELECT ce.id, tc.title, tc.description, sb.scheduled_date, sb.scheduled_time, 
              tc.id as class_id, tc.subject
       FROM class_enrollments ce
       JOIN tuition_classes tc ON ce.class_id = tc.id
       LEFT JOIN session_bookings sb ON sb.class_id = tc.id 
       WHERE ce.student_id = $1 
         AND ce.status = 'active'
         AND sb.scheduled_date = CURRENT_DATE
         AND sb.scheduled_time BETWEEN CURRENT_TIME AND (CURRENT_TIME + INTERVAL '2 hours')
         AND sb.status IN ('pending', 'confirmed')
       ORDER BY sb.scheduled_time ASC`,
      [userId]
    );

    upcomingClasses.rows.forEach(c => {
      const minutesUntil = getMinutesUntil(c.scheduled_date, c.scheduled_time);
      allReminders.push({
        id: `class_${c.id}`,
        type: 'class_starting',
        title: `Class Starting Soon: ${c.title}`,
        description: `${c.subject} class starts in ${minutesUntil} minutes`,
        date: c.scheduled_date,
        time: c.scheduled_time,
        priority: minutesUntil <= 15 ? 'critical' : 'high',
        actionRequired: false,
        relatedId: c.class_id
      });
    });

    // 3. Get upcoming individual sessions (as student)
    const upcomingSessions = await pool.query(
      `SELECT sb.id, sb.subject, sb.description, sb.scheduled_date, sb.scheduled_time,
              u.full_name as tutor_name
       FROM session_bookings sb
       JOIN users u ON sb.tutor_id = u.id
       WHERE sb.student_id = $1 
         AND sb.session_type = 'individual'
         AND sb.scheduled_date = CURRENT_DATE
         AND sb.scheduled_time BETWEEN CURRENT_TIME AND (CURRENT_TIME + INTERVAL '2 hours')
         AND sb.status IN ('pending', 'confirmed')
       ORDER BY sb.scheduled_time ASC`,
      [userId]
    );

    upcomingSessions.rows.forEach(s => {
      const minutesUntil = getMinutesUntil(s.scheduled_date, s.scheduled_time);
      allReminders.push({
        id: `session_${s.id}`,
        type: 'session_starting',
        title: `Session Starting Soon: ${s.subject}`,
        description: `Session with ${s.tutor_name} starts in ${minutesUntil} minutes`,
        date: s.scheduled_date,
        time: s.scheduled_time,
        priority: minutesUntil <= 15 ? 'critical' : 'high',
        actionRequired: false,
        relatedId: s.id
      });
    });

    // 4. Get pending enrollment requests (as tutor)
    const pendingEnrollments = await pool.query(
      `SELECT ce.id, tc.title, tc.subject, u.full_name as student_name, 
              ce.created_at, ce.status
       FROM class_enrollments ce
       JOIN tuition_classes tc ON ce.class_id = tc.id
       JOIN users u ON ce.student_id = u.id
       WHERE tc.tutor_id = $1 
         AND ce.status = 'pending'
       ORDER BY ce.created_at DESC`,
      [userId]
    );

    pendingEnrollments.rows.forEach(e => {
      allReminders.push({
        id: `enrollment_${e.id}`,
        type: 'enrollment_request',
        title: `New Enrollment Request: ${e.title}`,
        description: `${e.student_name} wants to join your ${e.subject} class`,
        date: new Date(e.created_at).toISOString().split('T')[0],
        time: new Date(e.created_at).toTimeString().split(' ')[0],
        priority: 'medium',
        actionRequired: true,
        relatedId: e.id,
        actionLabel: 'Review Request'
      });
    });

    // 5. Get enrollments awaiting payment (as student)
    const awaitingPayment = await pool.query(
      `SELECT ce.id, tc.title, tc.subject, tc.monthly_fee, ce.status, ce.created_at
       FROM class_enrollments ce
       JOIN tuition_classes tc ON ce.class_id = tc.id
       WHERE ce.student_id = $1 
         AND ce.status = 'awaiting_payment'
       ORDER BY ce.created_at ASC`,
      [userId]
    );

    awaitingPayment.rows.forEach(e => {
      allReminders.push({
        id: `payment_needed_${e.id}`,
        type: 'payment_required',
        title: `Payment Required: ${e.title}`,
        description: `Submit payment of Rs. ${e.monthly_fee} to complete enrollment`,
        date: new Date(e.created_at).toISOString().split('T')[0],
        time: new Date(e.created_at).toTimeString().split(' ')[0],
        priority: 'high',
        actionRequired: true,
        relatedId: e.id,
        actionLabel: 'Submit Payment',
        amount: e.monthly_fee
      });
    });

    // 6. Get payment verifications pending (as tutor)
    const pendingPayments = await pool.query(
      `SELECT ce.id, tc.title, u.full_name as student_name, ce.created_at,
              ce.payment_screenshot
       FROM class_enrollments ce
       JOIN tuition_classes tc ON ce.class_id = tc.id
       JOIN users u ON ce.student_id = u.id
       WHERE tc.tutor_id = $1 
         AND ce.status = 'payment_submitted'
         AND ce.payment_verified = false
       ORDER BY ce.created_at ASC`,
      [userId]
    );

    pendingPayments.rows.forEach(p => {
      allReminders.push({
        id: `verify_payment_${p.id}`,
        type: 'verify_payment',
        title: `Payment Verification: ${p.title}`,
        description: `${p.student_name} has submitted payment proof`,
        date: new Date(p.created_at).toISOString().split('T')[0],
        time: new Date(p.created_at).toTimeString().split(' ')[0],
        priority: 'medium',
        actionRequired: true,
        relatedId: p.id,
        actionLabel: 'Verify Payment'
      });
    });

    // 7. Get upcoming sessions as tutor (within 2 hours)
    const tutorSessions = await pool.query(
      `SELECT sb.id, sb.subject, sb.scheduled_date, sb.scheduled_time,
              u.full_name as student_name
       FROM session_bookings sb
       JOIN users u ON sb.student_id = u.id
       WHERE sb.tutor_id = $1 
         AND sb.scheduled_date = CURRENT_DATE
         AND sb.scheduled_time BETWEEN CURRENT_TIME AND (CURRENT_TIME + INTERVAL '2 hours')
         AND sb.status IN ('pending', 'confirmed')
       ORDER BY sb.scheduled_time ASC`,
      [userId]
    );

    tutorSessions.rows.forEach(s => {
      const minutesUntil = getMinutesUntil(s.scheduled_date, s.scheduled_time);
      allReminders.push({
        id: `tutor_session_${s.id}`,
        type: 'tutor_session',
        title: `Teaching Session: ${s.subject}`,
        description: `Session with ${s.student_name} starts in ${minutesUntil} minutes`,
        date: s.scheduled_date,
        time: s.scheduled_time,
        priority: minutesUntil <= 15 ? 'critical' : 'high',
        actionRequired: false,
        relatedId: s.id
      });
    });

    // 8. Get pending session payment verifications (as tutor)
    const sessionPayments = await pool.query(
      `SELECT sp.id, sb.subject, u.full_name as student_name, sp.amount,
              sp.created_at
       FROM session_payments sp
       JOIN session_bookings sb ON sp.session_id = sb.id
       JOIN users u ON sp.student_id = u.id
       WHERE sp.tutor_id = $1 
         AND sp.status = 'pending'
       ORDER BY sp.created_at ASC`,
      [userId]
    );

    sessionPayments.rows.forEach(p => {
      allReminders.push({
        id: `session_payment_${p.id}`,
        type: 'session_payment_verify',
        title: `Session Payment: ${p.subject}`,
        description: `${p.student_name} paid Rs. ${p.amount} - verify payment`,
        date: new Date(p.created_at).toISOString().split('T')[0],
        time: new Date(p.created_at).toTimeString().split(' ')[0],
        priority: 'medium',
        actionRequired: true,
        relatedId: p.id,
        actionLabel: 'Verify Payment',
        amount: p.amount
      });
    });

    // Sort all reminders by priority and time
    allReminders.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      // Then by date and time
      const dateTimeA = new Date(`${a.date}T${a.time || '00:00'}`);
      const dateTimeB = new Date(`${b.date}T${b.time || '00:00'}`);
      return dateTimeA - dateTimeB;
    });

    res.json({ 
      reminders: allReminders,
      count: allReminders.length,
      criticalCount: allReminders.filter(r => r.priority === 'critical').length,
      actionRequiredCount: allReminders.filter(r => r.actionRequired).length
    });
  } catch (error) {
    logger.error('Get aggregated reminders error:', error);
    res.status(500).json({ error: 'Server error fetching reminders' });
  }
};

// Helper function to check if reminder is past due
function isPastDue(date, time) {
  const reminderDateTime = new Date(`${date}T${time || '00:00'}`);
  return reminderDateTime < new Date();
}

// Helper function to get minutes until event
function getMinutesUntil(date, time) {
  const eventDateTime = new Date(`${date}T${time}`);
  const now = new Date();
  const diffMs = eventDateTime - now;
  return Math.max(0, Math.round(diffMs / 60000));
}
