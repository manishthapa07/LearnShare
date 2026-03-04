const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authMiddleware, tutorMiddleware } = require('../middleware/auth');
const { uploadPayment } = require('../middleware/upload');

// Public routes
router.get('/', classController.getAllClasses);

// Tutor routes (allow any authenticated user to create classes)
router.post('/', authMiddleware, classController.createClass);
router.get('/tutor/my-classes', authMiddleware, classController.getTutorClasses);
router.get('/tutor/enrollment-requests', authMiddleware, classController.getPendingEnrollments);
router.get('/tutor/payment-verifications', authMiddleware, classController.getPendingPaymentVerifications);
router.post('/enrollment/:enrollmentId/approve', authMiddleware, classController.approveEnrollment);
router.post('/enrollment/:enrollmentId/reject', authMiddleware, classController.rejectEnrollment);
router.post('/enrollment/:enrollmentId/verify-payment', authMiddleware, classController.verifyEnrollmentPayment);
router.put('/:id', authMiddleware, classController.updateClass);
router.delete('/:id', authMiddleware, classController.deleteClass);

// Student routes
router.post('/:classId/enroll', authMiddleware, classController.enrollInClass);
router.delete('/:classId/cancel-enrollment', authMiddleware, classController.cancelEnrollment);
router.get('/student/enrolled', authMiddleware, classController.getMyEnrolledClasses);
router.get('/enrollment/:enrollmentId/payment-details', authMiddleware, classController.getEnrollmentPaymentDetails);
router.post('/enrollment/:enrollmentId/submit-payment', authMiddleware, uploadPayment.single('payment'), classController.submitEnrollmentPayment);

// Class details - must be after specific routes to avoid conflicts
router.get('/:id', classController.getClassDetails);

module.exports = router;
