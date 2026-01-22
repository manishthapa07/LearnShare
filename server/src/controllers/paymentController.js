const pool = require('../config/database');
const { createNotification } = require('./notificationController');

// Submit Payment
exports.submitPayment = async (req, res) => {
  try {
    const { note_id, amount, transaction_reference } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Payment screenshot is required' });
    }

    // Normalize path for URLs (replace backslashes with forward slashes)
    const screenshotPath = req.file.path.replace(/\\/g, '/');

    const result = await pool.query(
      `INSERT INTO payments (user_id, note_id, amount, screenshot_path, transaction_reference, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [req.user.id, note_id, amount, screenshotPath, transaction_reference || null]
    );

    const payment = result.rows[0];

    // Get note details and uploader
    const noteResult = await pool.query(
      `SELECT n.title, n.uploader_id, u.username as buyer_username 
       FROM notes n 
       JOIN users u ON u.id = $1
       WHERE n.id = $2`,
      [req.user.id, note_id]
    );

    if (noteResult.rows.length > 0) {
      const note = noteResult.rows[0];
      
      console.log(`[NOTIFICATION] Creating payment notification for uploader ${note.uploader_id}`);
      
      // Notify the note uploader about new payment
      await createNotification(
        note.uploader_id,
        'payment_request',
        `New payment of NPR ${amount} from ${note.buyer_username} for "${note.title}"`,
        payment.id
      );
      
      console.log(`[NOTIFICATION] Payment notification created successfully`);
    } else {
      console.log(`[NOTIFICATION] No note found for notification`);
    }

    res.status(201).json({
      message: 'Payment submitted successfully. Awaiting admin approval.',
      payment
    });
  } catch (error) {
    console.error('Submit payment error:', error);
    res.status(500).json({ error: 'Server error during payment submission' });
  }
};

// Get User Payments
exports.getUserPayments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, n.title as note_title 
       FROM payments p
       LEFT JOIN notes n ON p.note_id = n.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    res.json({ payments: result.rows });
  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get All Payments (Admin)
exports.getAllPayments = async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT p.*, u.username, u.email, n.title as note_title
      FROM payments p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN notes n ON p.note_id = n.id
    `;

    const params = [];
    if (status) {
      query += ' WHERE p.status = $1';
      params.push(status);
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);

    res.json({ payments: result.rows });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Approve/Reject Payment (Admin or Note Uploader)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get payment with note details
    const paymentCheck = await pool.query(
      `SELECT p.*, n.uploader_id 
       FROM payments p
       LEFT JOIN notes n ON p.note_id = n.id
       WHERE p.id = $1`,
      [id]
    );

    if (paymentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const paymentData = paymentCheck.rows[0];

    // Check authorization: Admin OR note uploader can approve
    const isAdmin = req.user.role === 'admin';
    const isUploader = paymentData.uploader_id === req.user.id;

    console.log(`[updatePaymentStatus] Payment ${id} - User: ${req.user.id}, isAdmin: ${isAdmin}, isUploader: ${isUploader}, NoteUploader: ${paymentData.uploader_id}`);

    if (!isAdmin && !isUploader) {
      return res.status(403).json({ error: 'Not authorized to update this payment' });
    }

    const result = await pool.query(
      `UPDATE payments 
       SET status = $1, admin_notes = $2, approved_by = $3
       WHERE id = $4
       RETURNING *`,
      [status, admin_notes || null, req.user.id, id]
    );

    const payment = result.rows[0];

    // If approved, create purchase record
    if (status === 'approved' && payment.note_id) {
      await pool.query(
        `INSERT INTO purchases (user_id, note_id, payment_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, note_id) DO NOTHING`,
        [payment.user_id, payment.note_id, payment.id]
      );
    }

    res.json({ 
      message: `Payment ${status} successfully`,
      payment: result.rows[0]
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Payments for Uploader's Notes
exports.getUploaderPayments = async (req, res) => {
  try {
    const { status } = req.query;

    console.log(`[getUploaderPayments] User ${req.user.id} (${req.user.username}) fetching earnings`);

    let query = `
      SELECT p.*, u.username as buyer_username, u.email as buyer_email, 
             u.full_name as buyer_name, n.title as note_title, n.id as note_id
      FROM payments p
      JOIN users u ON p.user_id = u.id
      JOIN notes n ON p.note_id = n.id
      WHERE n.uploader_id = $1
    `;

    const params = [req.user.id];

    if (status) {
      query += ' AND p.status = $2';
      params.push(status);
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);

    console.log(`[getUploaderPayments] Found ${result.rows.length} payments for uploader`);

    // Get summary stats
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_payments,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0) as total_earnings
       FROM payments p
       JOIN notes n ON p.note_id = n.id
       WHERE n.uploader_id = $1`,
      [req.user.id]
    );

    res.json({ 
      payments: result.rows,
      stats: statsResult.rows[0]
    });
  } catch (error) {
    console.error('Get uploader payments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
