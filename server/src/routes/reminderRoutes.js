const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const { authMiddleware } = require('../middleware/auth');

// Create Reminder
router.post('/', authMiddleware, reminderController.createReminder);

// Get User's Reminders
router.get('/', authMiddleware, reminderController.getUserReminders);

// Update Reminder
router.put('/:id', authMiddleware, reminderController.updateReminder);

// Delete Reminder
router.delete('/:id', authMiddleware, reminderController.deleteReminder);

module.exports = router;
