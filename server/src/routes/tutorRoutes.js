const express = require('express');
const router = express.Router();
const tutorController = require('../controllers/tutorController');
const { authMiddleware, tutorMiddleware } = require('../middleware/auth');
const { uploadPayment } = require('../middleware/upload');

// Tutor Profile
router.post('/profile', authMiddleware, tutorMiddleware, tutorController.createOrUpdateProfile);
router.get('/profile/:id', tutorController.getTutorProfile);
router.get('/', tutorController.getAllTutors);

// Session Bookings
router.post('/sessions/book', authMiddleware, tutorController.bookSession);
router.get('/sessions/my-bookings', authMiddleware, tutorController.getUserBookings);
router.put('/sessions/:id/status', authMiddleware, tutorController.updateSessionStatus);

// Session Payments
router.post('/sessions/payments', authMiddleware, uploadPayment.single('screenshot'), tutorController.submitSessionPayment);
router.get('/sessions/payments/tutor', authMiddleware, tutorController.getSessionPayments);
router.get('/sessions/payments/student', authMiddleware, tutorController.getMySessionPayments);
router.put('/sessions/payments/:id/review', authMiddleware, tutorController.reviewSessionPayment);

// Session Reviews
router.post('/sessions/:sessionId/review', authMiddleware, tutorController.createSessionReview);
router.get('/sessions/:sessionId/reviews', tutorController.getSessionReviews);
router.get('/users/:userId/reviews', tutorController.getUserReviews);

module.exports = router;
