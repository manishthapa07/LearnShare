const pool = require('../config/database');

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
    console.error('Create question error:', error);
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
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Single Question with Answers
exports.getQuestion = async (req, res) => {
  try {
    const { id } = req.params;

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

    // Get answers
    const answersResult = await pool.query(
      `SELECT a.*, u.username, u.full_name
       FROM answers a
       JOIN users u ON a.user_id = u.id
       WHERE a.question_id = $1
       ORDER BY a.is_accepted DESC, a.votes DESC, a.created_at ASC`,
      [id]
    );

    // Increment views
    await pool.query('UPDATE questions SET views = views + 1 WHERE id = $1', [id]);

    res.json({
      question: questionResult.rows[0],
      answers: answersResult.rows
    });
  } catch (error) {
    console.error('Get question error:', error);
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
    console.error('Create answer error:', error);
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
    console.error('Accept answer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Vote Question
exports.voteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { vote } = req.body; // 'up' or 'down'

    const increment = vote === 'up' ? 1 : -1;

    const result = await pool.query(
      `UPDATE questions SET votes = votes + $1 WHERE id = $2 RETURNING *`,
      [increment, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({ question: result.rows[0] });
  } catch (error) {
    console.error('Vote question error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Vote Answer
exports.voteAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { vote } = req.body; // 'up' or 'down'

    const increment = vote === 'up' ? 1 : -1;

    const result = await pool.query(
      `UPDATE answers SET votes = votes + $1 WHERE id = $2 RETURNING *`,
      [increment, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    res.json({ answer: result.rows[0] });
  } catch (error) {
    console.error('Vote answer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
