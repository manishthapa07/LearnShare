const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authMiddleware, tutorMiddleware } = require('../middleware/auth');

// Public routes
router.get('/', classController.getAllClasses);

// Tutor routes (allow any authenticated user to create classes)
router.post('/', authMiddleware, classController.createClass);
router.get('/tutor/my-classes', authMiddleware, classController.getTutorClasses);
router.put('/:id', authMiddleware, classController.updateClass);
router.delete('/:id', authMiddleware, classController.deleteClass);

// Student routes
router.post('/:classId/enroll', authMiddleware, classController.enrollInClass);
router.delete('/:classId/cancel-enrollment', authMiddleware, classController.cancelEnrollment);
router.get('/student/enrolled', authMiddleware, classController.getMyEnrolledClasses);

// Class details - must be after specific routes to avoid conflicts
router.get('/:id', classController.getClassDetails);

module.exports = router;
