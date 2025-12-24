const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

const tutorMiddleware = (req, res, next) => {
  if (req.user.role !== 'tutor' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Tutor only.' });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware, tutorMiddleware };
