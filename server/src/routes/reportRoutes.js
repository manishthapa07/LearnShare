const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/auth');

router.post('/',         authMiddleware, reportController.submitReport);
router.get('/my',        authMiddleware, reportController.getMyReports);

module.exports = router;
