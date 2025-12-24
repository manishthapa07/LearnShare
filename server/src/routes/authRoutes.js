const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Register
router.post('/register',
  [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('role').isIn(['student', 'tutor', 'admin']).withMessage('Valid role is required')
  ],
  authController.register
);

// Login
router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  authController.login
);

// Get Profile (Protected)
router.get('/profile', authMiddleware, authController.getProfile);

// Update Profile (Protected)
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;
