const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { authMiddleware } = require('../middleware/auth');
const { uploadNote } = require('../middleware/upload');

// Upload Note
router.post('/upload', authMiddleware, uploadNote.single('file'), noteController.uploadNote);

// Get All Notes
router.get('/', noteController.getAllNotes);

// Get Single Note
router.get('/:id', noteController.getNote);

// Download Note
router.get('/:id/download', authMiddleware, noteController.downloadNote);

// Get User's Notes
router.get('/user/my-notes', authMiddleware, noteController.getUserNotes);

// Delete Note
router.delete('/:id', authMiddleware, noteController.deleteNote);

module.exports = router;
