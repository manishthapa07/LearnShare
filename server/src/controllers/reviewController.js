const pool = require('../config/database');

// Add/Update Review
exports.addOrUpdateReview = async (req, res) => {
  try {
    const { note_id, rating, review_text } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if note exists
    const noteCheck = await pool.query('SELECT * FROM notes WHERE id = $1', [note_id]);
    if (noteCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check if user purchased the note (or it's free)
    const note = noteCheck.rows[0];
    if (!note.is_free && note.uploader_id !== req.user.id) {
      const purchaseCheck = await pool.query(
        'SELECT * FROM purchases WHERE user_id = $1 AND note_id = $2',
        [req.user.id, note_id]
      );
      if (purchaseCheck.rows.length === 0) {
        return res.status(403).json({ error: 'You must purchase this note before reviewing it' });
      }
    }

    // Check if review already exists
    const existingReview = await pool.query(
      'SELECT * FROM note_reviews WHERE user_id = $1 AND note_id = $2',
      [req.user.id, note_id]
    );

    let result;
    if (existingReview.rows.length > 0) {
      // Update existing review
      result = await pool.query(
        `UPDATE note_reviews 
         SET rating = $1, review_text = $2, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $3 AND note_id = $4
         RETURNING *`,
        [rating, review_text || null, req.user.id, note_id]
      );
    } else {
      // Create new review
      result = await pool.query(
        `INSERT INTO note_reviews (note_id, user_id, rating, review_text)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [note_id, req.user.id, rating, review_text || null]
      );
    }

    res.status(201).json({
      message: 'Review submitted successfully',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Add/Update review error:', error);
    res.status(500).json({ error: 'Server error during review submission' });
  }
};

// Get Reviews for a Note
exports.getNoteReviews = async (req, res) => {
  try {
    const { note_id } = req.params;

    const result = await pool.query(
      `SELECT nr.*, u.username, u.full_name
       FROM note_reviews nr
       JOIN users u ON nr.user_id = u.id
       WHERE nr.note_id = $1
       ORDER BY nr.created_at DESC`,
      [note_id]
    );

    // Get average rating
    const avgResult = await pool.query(
      `SELECT AVG(rating)::numeric(3,2) as avg_rating, COUNT(*) as review_count
       FROM note_reviews
       WHERE note_id = $1`,
      [note_id]
    );

    res.json({
      reviews: result.rows,
      average_rating: parseFloat(avgResult.rows[0].avg_rating) || 0,
      review_count: parseInt(avgResult.rows[0].review_count)
    });
  } catch (error) {
    console.error('Get note reviews error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get User's Review for a Note
exports.getUserReview = async (req, res) => {
  try {
    const { note_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM note_reviews WHERE user_id = $1 AND note_id = $2',
      [req.user.id, note_id]
    );

    if (result.rows.length === 0) {
      return res.json({ review: null });
    }

    res.json({ review: result.rows[0] });
  } catch (error) {
    console.error('Get user review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete Review
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const reviewCheck = await pool.query(
      'SELECT * FROM note_reviews WHERE id = $1',
      [id]
    );

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const review = reviewCheck.rows[0];

    // Only review owner or admin can delete
    if (review.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    await pool.query('DELETE FROM note_reviews WHERE id = $1', [id]);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
