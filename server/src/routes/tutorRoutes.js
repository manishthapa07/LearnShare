const express = require('express');
const router = express.Router();
const tutorController = require('../controllers/tutorController');
const { authMiddleware, tutorMiddleware } = require('../middleware/auth');

// Tutor Profile
router.post('/profile', authMiddleware, tutorMiddleware, tutorController.createOrUpdateProfile);
router.get('/profile/:id', tutorController.getTutorProfile);
router.get('/', tutorController.getAllTutors);

// Session Bookings
router.post('/sessions/book', authMiddleware, tutorController.bookSession);
router.get('/sessions/my-bookings', authMiddleware, tutorController.getUserBookings);
router.put('/sessions/:id/status', authMiddleware, tutorController.updateSessionStatus);

module.exports = router;
