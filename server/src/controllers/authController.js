const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const pool = require('../config/database');
const logger = require('../utils/logger');

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Register User
exports.register = async (req, res) => {
  try {
    const { username, email, password, full_name, mobile, role, bio } = req.body;

    // Validate required fields
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Validate email format
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    
    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
    }
    
    // Check for number
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one number' });
    }
    
    // Check for special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one symbol (!@#$%^&*...)' });
    }

    // Validate mobile if provided
    if (mobile && !/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({ error: 'Please provide a valid 10-digit mobile number' });
    }

    // Validate role
    const validRoles = ['student', 'tutor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, mobile, role, bio) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, username, email, full_name, mobile, role, bio, created_at`,
      [username, email, password_hash, full_name, mobile || null, role, bio || null]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        mobile: user.mobile,
        role: user.role,
        bio: user.bio
      },
      token
    });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        mobile: user.mobile,
        role: user.role,
        bio: user.bio
      },
      token
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// Get User Profile
exports.getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, full_name, mobile, role, bio, profile_picture, created_at,
              average_rating, total_reviews
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, mobile, bio } = req.body;
    
    // Validate mobile if provided
    if (mobile && mobile.trim() !== '' && !/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({ error: 'Please provide a valid 10-digit mobile number' });
    }
    
    const result = await pool.query(
      `UPDATE users SET full_name = $1, mobile = $2, bio = $3 
       WHERE id = $4 
       RETURNING id, username, email, full_name, mobile, role, bio, profile_picture`,
      [full_name, mobile || null, bio, req.user.id]
    );

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      // Don't reveal whether the email exists
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const user = result.rows[0];

    // Generate a secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await pool.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
      [tokenHash, expires, user.id]
    );

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"LearnShare" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset</h2>
        <p>Hi ${user.full_name},</p>
        <p>You requested a password reset. Click the link below to set a new password. The link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#667eea;color:#fff;text-decoration:none;border-radius:5px;">Reset Password</a>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'New password is required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one number' });
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one symbol (!@#$%^&*...)' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await pool.query(
      'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    const user = result.rows[0];

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    await pool.query(
      'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
      [password_hash, user.id]
    );

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};
