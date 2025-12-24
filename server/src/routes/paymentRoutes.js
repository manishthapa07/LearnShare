const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { uploadPayment } = require('../middleware/upload');

// Submit Payment
router.post('/submit', authMiddleware, uploadPayment.single('screenshot'), paymentController.submitPayment);

// Get User Payments
router.get('/my-payments', authMiddleware, paymentController.getUserPayments);

// Get All Payments (Admin)
router.get('/all', authMiddleware, adminMiddleware, paymentController.getAllPayments);

// Approve/Reject Payment (Admin)
router.put('/:id/status', authMiddleware, adminMiddleware, paymentController.updatePaymentStatus);

module.exports = router;
