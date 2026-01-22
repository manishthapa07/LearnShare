const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');
const { uploadNote } = require('../middleware/upload');

// Upload Note
router.post('/upload', authMiddleware, uploadNote.single('file'), noteController.uploadNote);

// Get All Notes
router.get('/', noteController.getAllNotes);

// Get Single Note (with optional auth to check purchase status)
router.get('/:id', optionalAuthMiddleware, noteController.getNote);

// Download Note
router.get('/:id/download', authMiddleware, noteController.downloadNote);

// Get User's Notes
router.get('/user/my-notes', authMiddleware, noteController.getUserNotes);

// Get User's Purchased Notes (including free notes)
router.get('/user/purchased', authMiddleware, noteController.getPurchasedNotes);

// Update Note
router.put('/:id', authMiddleware, noteController.updateNote);

// Delete Note
router.delete('/:id', authMiddleware, noteController.deleteNote);

module.exports = router;
