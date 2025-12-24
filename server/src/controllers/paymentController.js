const pool = require('../config/database');

// Submit Payment
exports.submitPayment = async (req, res) => {
  try {
    const { note_id, amount, transaction_reference } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Payment screenshot is required' });
    }

    const result = await pool.query(
      `INSERT INTO payments (user_id, note_id, amount, screenshot_path, transaction_reference, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [req.user.id, note_id, amount, req.file.path, transaction_reference || null]
    );

    res.status(201).json({
      message: 'Payment submitted successfully. Awaiting admin approval.',
      payment: result.rows[0]
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

// Approve/Reject Payment (Admin)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE payments 
       SET status = $1, admin_notes = $2, approved_by = $3
       WHERE id = $4
       RETURNING *`,
      [status, admin_notes || null, req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

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
