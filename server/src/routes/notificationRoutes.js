const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/auth');

// Get user notifications
router.get('/', authMiddleware, notificationController.getNotifications);

// Get unread count
router.get('/unread-count', authMiddleware, notificationController.getUnreadCount);

// Mark notification as read
router.put('/:id/read', authMiddleware, notificationController.markAsRead);

// Mark all as read
router.put('/mark-all-read', authMiddleware, notificationController.markAllAsRead);

// Test endpoint to create a notification
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const notification = await notificationController.createNotification(
      req.user.id,
      'test',
      'This is a test notification',
      null
    );
    res.json({ message: 'Test notification created', notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
