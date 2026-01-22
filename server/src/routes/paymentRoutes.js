const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { uploadPayment } = require('../middleware/upload');

// Submit Payment
router.post('/submit', authMiddleware, uploadPayment.single('screenshot'), paymentController.submitPayment);

// Get User Payments
router.get('/my-payments', authMiddleware, paymentController.getUserPayments);

// Get Payments for Uploader's Notes
router.get('/my-note-payments', authMiddleware, paymentController.getUploaderPayments);

// Get All Payments (Admin)
router.get('/all', authMiddleware, adminMiddleware, paymentController.getAllPayments);

// Approve/Reject Payment (Admin or Note Uploader)
router.put('/:id/status', authMiddleware, paymentController.updatePaymentStatus);

module.exports = router;
