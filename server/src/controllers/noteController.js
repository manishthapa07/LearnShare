const pool = require('../config/database');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

// Upload Note
exports.uploadNote = async (req, res) => {
  try {
    const { title, description, subject, category, price, is_free, tags } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const tagsArray = tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [];

    const result = await pool.query(
      `INSERT INTO notes (title, description, subject, category, file_path, file_name, file_size, price, uploader_id, is_free, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        title,
        description,
        subject,
        category,
        req.file.path,
        req.file.originalname,
        req.file.size,
        is_free === 'true' ? 0 : parseFloat(price) || 0,
        req.user.id,
        is_free === 'true',
        tagsArray
      ]
    );

    res.status(201).json({
      message: 'Note uploaded successfully',
      note: result.rows[0]
    });
  } catch (error) {
    logger.error('Upload note error:', error);
    res.status(500).json({ error: 'Server error during note upload' });
  }
};

// Get All Notes
exports.getAllNotes = async (req, res) => {
  try {
    const { subject, category, search, is_free, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT n.*, u.username as uploader_name, u.full_name as uploader_full_name
      FROM notes n
      JOIN users u ON n.uploader_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (subject) {
      query += ` AND n.subject ILIKE $${paramCount}`;
      params.push(`%${subject}%`);
      paramCount++;
    }

    if (category) {
      query += ` AND n.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (search) {
      query += ` AND (n.title ILIKE $${paramCount} OR n.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (is_free !== undefined && is_free !== '') {
      const isFreeBoolean = is_free === 'true' || is_free === true;
      query += ` AND n.is_free = $${paramCount}`;
      params.push(isFreeBoolean);
      paramCount++;
    }

    query += ` ORDER BY n.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM notes WHERE 1=1';
    const countParams = [];
    let countParamCount = 1;

    if (subject) {
      countQuery += ` AND subject ILIKE $${countParamCount}`;
      countParams.push(`%${subject}%`);
      countParamCount++;
    }

    if (category) {
      countQuery += ` AND category = $${countParamCount}`;
      countParams.push(category);
      countParamCount++;
    }

    if (search) {
      countQuery += ` AND (title ILIKE $${countParamCount} OR description ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      notes: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get notes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Single Note
exports.getNote = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT n.*, u.username as uploader_name, u.full_name as uploader_full_name
       FROM notes n
       JOIN users u ON n.uploader_id = u.id
       WHERE n.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = result.rows[0];

    // Check if user has purchased this note (if logged in)
    let hasPurchased = false;
    if (req.user) {
      const purchaseCheck = await pool.query(
        `SELECT id FROM purchases WHERE user_id = $1 AND note_id = $2`,
        [req.user.id, id]
      );
      hasPurchased = purchaseCheck.rows.length > 0;
    }

    res.json({ note, hasPurchased });
  } catch (error) {
    logger.error('Get note error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Download Note
exports.downloadNote = async (req, res) => {
  try {
    const { id } = req.params;

    // Get note details
    const noteResult = await pool.query('SELECT * FROM notes WHERE id = $1', [id]);

    if (noteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = noteResult.rows[0];

    // Check if note is free or user has purchased it
    if (!note.is_free) {
      const purchaseResult = await pool.query(
        'SELECT * FROM purchases WHERE user_id = $1 AND note_id = $2',
        [req.user.id, id]
      );

      if (purchaseResult.rows.length === 0 && note.uploader_id !== req.user.id) {
        return res.status(403).json({ error: 'Purchase required to download this note' });
      }
    } else {
      // For free notes, create a purchase record if it doesn't exist (for tracking downloads)
      const existingPurchase = await pool.query(
        'SELECT * FROM purchases WHERE user_id = $1 AND note_id = $2',
        [req.user.id, id]
      );
      
      if (existingPurchase.rows.length === 0) {
        await pool.query(
          'INSERT INTO purchases (user_id, note_id) VALUES ($1, $2)',
          [req.user.id, id]
        );
      }
    }

    // Increment download count
    await pool.query('UPDATE notes SET downloads = downloads + 1 WHERE id = $1', [id]);

    // Construct absolute file path
    const filePath = path.isAbsolute(note.file_path) 
      ? note.file_path 
      : path.join(__dirname, '../../', note.file_path);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (err) {
      logger.error('File not found:', filePath);
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Send file
    res.download(filePath, note.file_name);
  } catch (error) {
    logger.error('Download note error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get User's Uploaded Notes
exports.getUserNotes = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notes WHERE uploader_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({ notes: result.rows });
  } catch (error) {
    logger.error('Get user notes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete Note
exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    const noteResult = await pool.query('SELECT * FROM notes WHERE id = $1', [id]);

    if (noteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = noteResult.rows[0];

    // Check if user is the uploader or admin
    if (note.uploader_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this note' });
    }

    // Delete file
    try {
      await fs.unlink(note.file_path);
    } catch (err) {
      logger.error('Error deleting file:', err);
    }

    // Delete from database
    await pool.query('DELETE FROM notes WHERE id = $1', [id]);

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    logger.error('Delete note error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update Note
exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, subject, category, price, is_free, tags } = req.body;

    const noteResult = await pool.query('SELECT * FROM notes WHERE id = $1', [id]);

    if (noteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = noteResult.rows[0];

    // Check if user is the uploader or admin
    if (note.uploader_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this note' });
    }

    const tagsArray = tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : note.tags;

    // Update note details
    const result = await pool.query(
      `UPDATE notes 
       SET title = $1, description = $2, subject = $3, category = $4, 
           price = $5, is_free = $6, tags = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [
        title || note.title,
        description || note.description,
        subject || note.subject,
        category || note.category,
        is_free === true || is_free === 'true' ? 0 : parseFloat(price) || note.price,
        is_free === true || is_free === 'true',
        tagsArray,
        id
      ]
    );

    res.json({
      message: 'Note updated successfully',
      note: result.rows[0]
    });
  } catch (error) {
    logger.error('Update note error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get User's Purchased Notes (only actual purchases and downloads)
exports.getPurchasedNotes = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT n.*, u.username as uploader_name, u.full_name as uploader_full_name,
              pu.purchased_at as purchase_date,
              CASE WHEN n.is_free = true THEN 'downloaded' ELSE 'purchased' END as access_type
       FROM notes n
       JOIN users u ON n.uploader_id = u.id
       INNER JOIN purchases pu ON n.id = pu.note_id AND pu.user_id = $1
       ORDER BY pu.purchased_at DESC`,
      [req.user.id]
    );

    res.json({ notes: result.rows });
  } catch (error) {
    logger.error('Get purchased notes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

