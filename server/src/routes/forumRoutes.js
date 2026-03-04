const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { authMiddleware } = require('../middleware/auth');

// Questions
router.post('/questions', authMiddleware, forumController.createQuestion);
router.get('/questions', forumController.getAllQuestions);
router.get('/questions/:id', forumController.getQuestion);
router.post('/questions/:id/vote', authMiddleware, forumController.voteQuestion);

// Answers
router.post('/answers', authMiddleware, forumController.createAnswer);
router.post('/answers/:id/accept', authMiddleware, forumController.acceptAnswer);
router.post('/answers/:id/vote', authMiddleware, forumController.voteAnswer);
router.post('/answers/:id/rate', authMiddleware, forumController.rateAnswer);

module.exports = router;
