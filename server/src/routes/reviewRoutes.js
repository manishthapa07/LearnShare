const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authMiddleware } = require('../middleware/auth');

// Add/Update Review
router.post('/', authMiddleware, reviewController.addOrUpdateReview);

// Get Reviews for a Note
router.get('/note/:note_id', reviewController.getNoteReviews);

// Get User's Review for a Note
router.get('/note/:note_id/my-review', authMiddleware, reviewController.getUserReview);

// Delete Review
router.delete('/:id', authMiddleware, reviewController.deleteReview);

module.exports = router;
