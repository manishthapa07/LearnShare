const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(authMiddleware, adminMiddleware);

// Dashboard
router.get('/stats',          adminController.getDashboardStats);

// Users
router.get('/users',          adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id',   adminController.deleteUser);

// Notes
router.get('/notes',          adminController.getAllNotes);
router.delete('/notes/:id',   adminController.deleteNote);

// Forum
router.get('/questions',         adminController.getAllQuestions);
router.delete('/questions/:id',  adminController.deleteQuestion);

// Reports
router.get('/reports',           adminController.getAllReports);
router.put('/reports/:id',       adminController.updateReportStatus);

module.exports = router;
