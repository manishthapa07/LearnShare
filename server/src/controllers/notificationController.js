const pool = require('../config/database');
const logger = require('../utils/logger');

// Get user notifications
exports.getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user.id]
    );

    res.json({ notifications: result.rows });
  } catch (error) {
    logger.error('Get notifications error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count 
       FROM notifications 
       WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    logger.error('Get unread count error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    logger.error('Mark as read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE user_id = $1`,
      [req.user.id]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Mark all as read error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create notification helper function
exports.createNotification = async (userId, type, message, relatedId = null) => {
  try {
    logger.debug(`Creating notification for user ${userId}, type: ${type}`);
    
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, message, related_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, type, message, relatedId]
    );
    
    logger.debug('Notification created successfully');
    return result.rows[0];
  } catch (error) {
    logger.error('Create notification error:', error.message);
    throw error;
  }
};
