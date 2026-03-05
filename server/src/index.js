const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const logger = require('./utils/logger');
const { validateEnv, checkRecommendedEnv } = require('./utils/envValidator');

// Validate environment variables
validateEnv(['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET']);
checkRecommendedEnv(['NODE_ENV', 'PORT']);

const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const forumRoutes = require('./routes/forumRoutes');
const tutorRoutes = require('./routes/tutorRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const classRoutes = require('./routes/classRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));
logger.info(`Serving static files from: ${uploadsPath}`);

// Test route to verify upload serving (development only)
if (process.env.NODE_ENV !== 'production') {
  app.get('/test-uploads', (req, res) => {
    const fs = require('fs');
    const paymentsDir = path.join(uploadsPath, 'payments');
    
    fs.readdir(paymentsDir, (err, files) => {
      if (err) {
        return res.json({ error: err.message, path: paymentsDir });
      }
      res.json({ 
        uploadsPath, 
        paymentsDir,
        files: files.map(f => ({
          name: f,
          url: `/uploads/payments/${f}`
        }))
      });
    });
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'LearnShare API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Stack trace:', err.stack);
  }
  res.status(500).json({ 
    error: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  logger.success(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`API available at: http://localhost:${PORT}/api`);
});

module.exports = app;
