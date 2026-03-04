const pool = require('../config/database');
const logger = require('../utils/logger');

// Create Question
exports.createQuestion = async (req, res) => {
  try {
    const { title, content, subject, tags } = req.body;

    const tagsArray = tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [];

    const result = await pool.query(
      `INSERT INTO questions (title, content, user_id, subject, tags)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, content, req.user.id, subject || null, tagsArray]
    );

    res.status(201).json({
      message: 'Question created successfully',
      question: result.rows[0]
    });
  } catch (error) {
    logger.error('Create question error:', error);
    res.status(500).json({ error: 'Server error during question creation' });
  }
};

// Get All Questions
exports.getAllQuestions = async (req, res) => {
  try {
    const { subject, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT q.*, u.username, u.full_name,
        (SELECT COUNT(*) FROM answers WHERE question_id = q.id) as answer_count
      FROM questions q
      JOIN users u ON q.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (subject) {
      query += ` AND q.subject ILIKE $${paramCount}`;
      params.push(`%${subject}%`);
      paramCount++;
    }

    if (search) {
      query += ` AND (q.title ILIKE $${paramCount} OR q.content ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY q.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({ questions: result.rows });
  } catch (error) {
    logger.error('Get questions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Single Question with Answers
exports.getQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { incrementView } = req.query;
    const userId = req.user?.id;

    // Get question
    const questionResult = await pool.query(
      `SELECT q.*, u.username, u.full_name
       FROM questions q
       JOIN users u ON q.user_id = u.id
       WHERE q.id = $1`,
      [id]
    );

    if (questionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const question = questionResult.rows[0];

    // Get user's vote on this question if logged in
    if (userId) {
      const userVote = await pool.query(
        'SELECT vote_type FROM question_votes WHERE question_id = $1 AND user_id = $2',
        [id, userId]
      );
      question.userVote = userVote.rows.length > 0 ? userVote.rows[0].vote_type : 0;
    }

    // Get answers with average rating
    const answersResult = await pool.query(
      `SELECT a.*, u.username, u.full_name,
        COALESCE(AVG(ar.rating), 0) as avg_rating,
        COUNT(ar.id) as rating_count
       FROM answers a
       JOIN users u ON a.user_id = u.id
       LEFT JOIN answer_ratings ar ON a.id = ar.answer_id
       WHERE a.question_id = $1
       GROUP BY a.id, u.username, u.full_name
       ORDER BY a.is_accepted DESC, a.votes DESC, a.created_at ASC`,
      [id]
    );

    const answers = answersResult.rows;

    // Get user's votes on answers if logged in
    if (userId) {
      const answerIds = answers.map(a => a.id);
      if (answerIds.length > 0) {
        const userAnswerVotes = await pool.query(
          'SELECT answer_id, vote_type FROM answer_votes WHERE answer_id = ANY($1) AND user_id = $2',
          [answerIds, userId]
        );
        const voteMap = {};
        userAnswerVotes.rows.forEach(v => {
          voteMap[v.answer_id] = v.vote_type;
        });
        answers.forEach(a => {
          a.userVote = voteMap[a.id] || 0;
        });
      }
    }

    // Increment views only when incrementView parameter is true
    if (incrementView === 'true') {
      await pool.query('UPDATE questions SET views = views + 1 WHERE id = $1', [id]);
    }

    res.json({
      question,
      answers
    });
  } catch (error) {
    logger.error('Get question error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create Answer
exports.createAnswer = async (req, res) => {
  try {
    const { question_id, content } = req.body;

    const result = await pool.query(
      `INSERT INTO answers (question_id, content, user_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [question_id, content, req.user.id]
    );

    res.status(201).json({
      message: 'Answer created successfully',
      answer: result.rows[0]
    });
  } catch (error) {
    logger.error('Create answer error:', error);
    res.status(500).json({ error: 'Server error during answer creation' });
  }
};

// Accept Answer (Question Owner)
exports.acceptAnswer = async (req, res) => {
  try {
    const { id } = req.params;

    // Get answer and question
    const answerResult = await pool.query(
      `SELECT a.*, q.user_id as question_owner_id
       FROM answers a
       JOIN questions q ON a.question_id = q.id
       WHERE a.id = $1`,
      [id]
    );

    if (answerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    const answer = answerResult.rows[0];

    if (answer.question_owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only question owner can accept answers' });
    }

    // Unaccept other answers for this question
    await pool.query(
      'UPDATE answers SET is_accepted = false WHERE question_id = $1',
      [answer.question_id]
    );

    // Accept this answer
    const result = await pool.query(
      `UPDATE answers SET is_accepted = true WHERE id = $1 RETURNING *`,
      [id]
    );

    // Mark question as answered
    await pool.query(
      'UPDATE questions SET is_answered = true WHERE id = $1',
      [answer.question_id]
    );

    res.json({
      message: 'Answer accepted successfully',
      answer: result.rows[0]
    });
  } catch (error) {
    logger.error('Accept answer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Vote Question
exports.voteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { vote } = req.body; // 'up' or 'down'
    const userId = req.user.id;
    const voteValue = vote === 'up' ? 1 : -1;

    // Get current vote (default to 0 if no record)
    const existingVote = await pool.query(
      'SELECT vote_type FROM question_votes WHERE question_id = $1 AND user_id = $2',
      [id, userId]
    );

    const currentVote = existingVote.rows.length > 0 ? existingVote.rows[0].vote_type : 0;
    
    // Determine new vote: if clicking same button, toggle to 0; otherwise set to new value
    const newVote = (currentVote === voteValue) ? 0 : voteValue;
    const voteChange = newVote - currentVote;

    // UPSERT the vote using ON CONFLICT
    await pool.query(
      `INSERT INTO question_votes (question_id, user_id, vote_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (question_id, user_id)
       DO UPDATE SET vote_type = $3`,
      [id, userId, newVote]
    );

    // Update question votes count
    await pool.query(
      'UPDATE questions SET votes = votes + $1 WHERE id = $2',
      [voteChange, id]
    );

    const result = await pool.query('SELECT * FROM questions WHERE id = $1', [id]);
    res.json({ question: result.rows[0] });
  } catch (error) {
    logger.error('Vote question error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Vote Answer
exports.voteAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { vote } = req.body; // 'up' or 'down'
    const userId = req.user.id;
    const voteValue = vote === 'up' ? 1 : -1;

    // Get current vote (default to 0 if no record)
    const existingVote = await pool.query(
      'SELECT vote_type FROM answer_votes WHERE answer_id = $1 AND user_id = $2',
      [id, userId]
    );

    const currentVote = existingVote.rows.length > 0 ? existingVote.rows[0].vote_type : 0;
    
    // Determine new vote: if clicking same button, toggle to 0; otherwise set to new value
    const newVote = (currentVote === voteValue) ? 0 : voteValue;
    const voteChange = newVote - currentVote;

    // UPSERT the vote using ON CONFLICT
    await pool.query(
      `INSERT INTO answer_votes (answer_id, user_id, vote_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (answer_id, user_id)
       DO UPDATE SET vote_type = $3`,
      [id, userId, newVote]
    );

    // Update answer votes count
    await pool.query(
      'UPDATE answers SET votes = votes + $1 WHERE id = $2',
      [voteChange, id]
    );

    const result = await pool.query('SELECT * FROM answers WHERE id = $1', [id]);
    res.json({ answer: result.rows[0] });
  } catch (error) {
    logger.error('Vote answer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Rate Answer (1-5 stars)
exports.rateAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if answer exists
    const answerCheck = await pool.query('SELECT id FROM answers WHERE id = $1', [id]);
    if (answerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    // Check if user already rated this answer
    const existingRating = await pool.query(
      'SELECT id FROM answer_ratings WHERE answer_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existingRating.rows.length > 0) {
      // Update existing rating
      await pool.query(
        'UPDATE answer_ratings SET rating = $1, updated_at = CURRENT_TIMESTAMP WHERE answer_id = $2 AND user_id = $3',
        [rating, id, req.user.id]
      );
    } else {
      // Insert new rating
      await pool.query(
        'INSERT INTO answer_ratings (answer_id, user_id, rating) VALUES ($1, $2, $3)',
        [id, req.user.id, rating]
      );
    }

    // Get updated average rating
    const avgResult = await pool.query(
      `SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as rating_count
       FROM answer_ratings
       WHERE answer_id = $1`,
      [id]
    );

    res.json({
      message: 'Rating submitted successfully',
      avgRating: parseFloat(avgResult.rows[0].avg_rating).toFixed(1),
      ratingCount: parseInt(avgResult.rows[0].rating_count)
    });
  } catch (error) {
    logger.error('Rate answer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
