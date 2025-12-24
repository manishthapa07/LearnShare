const pool = require('../config/database');

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
    console.error('Create reminder error:', error);
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
    console.error('Get user reminders error:', error);
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
    console.error('Update reminder error:', error);
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
    console.error('Delete reminder error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
