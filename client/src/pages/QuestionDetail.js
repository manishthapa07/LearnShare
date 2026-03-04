import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { forumService } from '../services/forumService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import './Notes.css';

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answerContent, setAnswerContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState({ show: false, message: '', type: 'info' });
  const viewIncremented = useRef(false);

  useEffect(() => {
    fetchQuestionAndAnswers(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchQuestionAndAnswers = async (isInitialLoad = false) => {
    try {
      setLoading(true);
      // Only increment view on initial load, not on refreshes
      const shouldIncrementView = isInitialLoad && !viewIncremented.current;
      const data = await forumService.getQuestion(id, shouldIncrementView);
      
      if (shouldIncrementView) {
        viewIncremented.current = true;
      }
      
      setQuestion(data.question);
      setAnswers(data.answers);
    } catch (err) {
      setError('Failed to load question');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVoteQuestion = async (vote) => {
    if (!user) {
      setModal({ show: true, message: 'Please login to vote', type: 'warning' });
      return;
    }

    try {
      await forumService.voteQuestion(id, vote);
      fetchQuestionAndAnswers();
    } catch (err) {
      setModal({ show: true, message: 'Failed to vote', type: 'error' });
    }
  };

  const handleVoteAnswer = async (answerId, vote) => {
    if (!user) {
      setModal({ show: true, message: 'Please login to vote', type: 'warning' });
      return;
    }

    try {
      await forumService.voteAnswer(answerId, vote);
      fetchQuestionAndAnswers();
    } catch (err) {
      setModal({ show: true, message: 'Failed to vote', type: 'error' });
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    if (!user || user.id !== question.user_id) {
      setModal({ show: true, message: 'Only the question owner can accept answers', type: 'warning' });
      return;
    }

    try {
      await forumService.acceptAnswer(answerId);
      fetchQuestionAndAnswers();
    } catch (err) {
      setModal({ show: true, message: 'Failed to accept answer', type: 'error' });
    }
  };

  const handleRateAnswer = async (answerId, rating) => {
    if (!user) {
      setModal({ show: true, message: 'Please login to rate answers', type: 'warning' });
      return;
    }

    try {
      await forumService.rateAnswer(answerId, rating);
      fetchQuestionAndAnswers();
    } catch (err) {
      setModal({ show: true, message: 'Failed to rate answer', type: 'error' });
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setModal({ show: true, message: 'Please login to post an answer', type: 'warning' });
      return;
    }

    if (!answerContent.trim()) {
      setModal({ show: true, message: 'Please enter your answer', type: 'warning' });
      return;
    }

    try {
      setSubmitting(true);
      await forumService.createAnswer({
        question_id: id,
        content: answerContent
      });
      setAnswerContent('');
      fetchQuestionAndAnswers();
      setModal({ show: true, message: 'Answer posted successfully!', type: 'success' });
    } catch (err) {
      setModal({ show: true, message: 'Failed to post answer', type: 'error' });
    } finally {
      setSubmitting(false);
        }
  };

  const StarRating = ({ answerId, avgRating, ratingCount, isOwnAnswer }) => {
    const [hoverRating, setHoverRating] = useState(0);
    const stars = [1, 2, 3, 4, 5];

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
        <div style={{ display: 'flex', gap: '2px' }}>
          {stars.map((star) => (
            <span
              key={star}
              onClick={() => !isOwnAnswer && user && handleRateAnswer(answerId, star)}
              onMouseEnter={() => !isOwnAnswer && user && setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              style={{
                cursor: !isOwnAnswer && user ? 'pointer' : 'default',
                fontSize: '20px',
                color: (hoverRating || avgRating) >= star ? '#f39c12' : '#ddd',
                transition: 'color 0.2s'
              }}
              title={isOwnAnswer ? 'Cannot rate your own answer' : user ? `Rate ${star} stars` : 'Login to rate'}
            >
              ★
            </span>
          ))}
        </div>
        <span style={{ fontSize: '14px', color: '#666' }}>
          {avgRating > 0 ? `${parseFloat(avgRating).toFixed(1)} (${ratingCount} ${ratingCount === 1 ? 'rating' : 'ratings'})` : 'No ratings yet'}
        </span>
      </div>
    );
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const posted = new Date(date);
    const seconds = Math.floor((now - posted) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return posted.toLocaleDateString();
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>;
  }

  if (error || !question) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'red' }}>{error || 'Question not found'}</p>
        <button onClick={() => navigate('/forum')} className="btn-primary">
          Back to Forum
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <button 
        onClick={() => navigate('/forum')} 
        style={{ 
          marginBottom: '20px', 
          padding: '8px 16px',
          background: '#ecf0f1',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        ← Back to Forum
      </button>

      {/* Question Section */}
      <div style={{ 
        background: 'white', 
        borderRadius: '8px', 
        padding: '30px',
        marginBottom: '30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Vote Section */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            minWidth: '60px'
          }}>
            <button 
              onClick={() => handleVoteQuestion('up')}
              disabled={!user}
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: '28px', 
                cursor: user ? 'pointer' : 'not-allowed',
                color: question.userVote === 1 ? '#27ae60' : '#666',
                fontWeight: question.userVote === 1 ? 'bold' : 'normal'
              }}
              title={question.userVote === 1 ? 'Remove upvote' : 'Upvote'}
            >
              ▲
            </button>
            <span style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>
              {question.votes || 0}
            </span>
            <button 
              onClick={() => handleVoteQuestion('down')}
              disabled={!user}
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: '28px', 
                cursor: user ? 'pointer' : 'not-allowed',
                color: question.userVote === -1 ? '#e74c3c' : '#666',
                fontWeight: question.userVote === -1 ? 'bold' : 'normal'
              }}
              title={question.userVote === -1 ? 'Remove downvote' : 'Downvote'}
            >
              ▼
            </button>
          </div>

          {/* Question Content */}
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '28px' }}>
              {question.title}
            </h1>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {question.subject && (
                <span style={{ 
                  fontSize: '13px', 
                  padding: '5px 12px', 
                  background: '#3498db', 
                  color: 'white', 
                  borderRadius: '4px' 
                }}>
                  {question.subject}
                </span>
              )}
              {question.tags && question.tags.map((tag, idx) => (
                <span key={idx} style={{ 
                  fontSize: '13px', 
                  padding: '5px 12px', 
                  background: '#ecf0f1', 
                  color: '#555', 
                  borderRadius: '4px' 
                }}>
                  {tag}
                </span>
              ))}
            </div>

            <p style={{ 
              color: '#555', 
              lineHeight: '1.8',
              fontSize: '16px',
              whiteSpace: 'pre-wrap',
              marginBottom: '20px'
            }}>
              {question.content}
            </p>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              paddingTop: '20px',
              borderTop: '1px solid #ecf0f1',
              fontSize: '14px',
              color: '#888'
            }}>
              <span>
                Asked by <strong>{question.full_name || question.username}</strong>
              </span>
              <div style={{ display: 'flex', gap: '15px' }}>
                <span>{question.views || 0} views</span>
                <span>{getTimeAgo(question.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answers Section */}
      <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>
        {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
      </h2>

      {answers.length > 0 && answers.map(answer => (
        <div 
          key={answer.id}
          style={{ 
            background: 'white', 
            borderRadius: '8px', 
            padding: '25px',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: answer.is_accepted ? '2px solid #27ae60' : 'none'
          }}
        >
          <div style={{ display: 'flex', gap: '20px' }}>
            {/* Vote Section */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              minWidth: '60px'
            }}>
              <button 
                onClick={() => handleVoteAnswer(answer.id, 'up')}
                disabled={!user}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '24px', 
                  cursor: user ? 'pointer' : 'not-allowed',
                  color: answer.userVote === 1 ? '#27ae60' : '#666',
                  fontWeight: answer.userVote === 1 ? 'bold' : 'normal'
                }}
                title={answer.userVote === 1 ? 'Remove upvote' : 'Upvote'}
              >
                ▲
              </button>
              <span style={{ fontSize: '20px', fontWeight: 'bold', margin: '8px 0' }}>
                {answer.votes || 0}
              </span>
              <button 
                onClick={() => handleVoteAnswer(answer.id, 'down')}
                disabled={!user}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '24px', 
                  cursor: user ? 'pointer' : 'not-allowed',
                  color: answer.userVote === -1 ? '#e74c3c' : '#666',
                  fontWeight: answer.userVote === -1 ? 'bold' : 'normal'
                }}
                title={answer.userVote === -1 ? 'Remove downvote' : 'Downvote'}
              >
                ▼
              </button>
              
              {user && user.id === question.user_id && !answer.is_accepted && (
                <button
                  onClick={() => handleAcceptAnswer(answer.id)}
                  style={{
                    marginTop: '10px',
                    padding: '5px 10px',
                    background: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                  title="Mark as accepted answer"
                >
                  ✓ Accept
                </button>
              )}

              {answer.is_accepted && (
                <div style={{
                  marginTop: '10px',
                  padding: '5px 10px',
                  background: '#27ae60',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  ✓ Accepted
                </div>
              )}
            </div>

            {/* Answer Content */}
            <div style={{ flex: 1 }}>
              <p style={{ 
                color: '#555', 
                lineHeight: '1.8',
                fontSize: '15px',
                whiteSpace: 'pre-wrap',
                marginBottom: '15px'
              }}>
                {answer.content}
              </p>

              {/* Star Rating */}
              <StarRating 
                answerId={answer.id}
                avgRating={answer.avg_rating || 0}
                ratingCount={answer.rating_count || 0}
                isOwnAnswer={user && user.id === answer.user_id}
              />

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                paddingTop: '15px',
                borderTop: '1px solid #ecf0f1',
                fontSize: '14px',
                color: '#888',
                marginTop: '15px'
              }}>
                <span>
                  Answered by <strong>{answer.full_name || answer.username}</strong>
                </span>
                <span>{getTimeAgo(answer.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Answer Form */}
      {user ? (
        <div style={{ 
          background: 'white', 
          borderRadius: '8px', 
          padding: '25px',
          marginTop: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>Your Answer</h3>
          <form onSubmit={handleSubmitAnswer}>
            <textarea
              value={answerContent}
              onChange={(e) => setAnswerContent(e.target.value)}
              placeholder="Write your answer here... Provide a detailed and helpful response."
              rows="8"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                fontSize: '15px',
                fontFamily: 'inherit',
                resize: 'vertical',
                marginBottom: '15px'
              }}
              required
            />
            <button 
              type="submit" 
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Posting...' : 'Post Your Answer'}
            </button>
          </form>
        </div>
      ) : (
        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          marginTop: '30px'
        }}>
          <p style={{ color: '#666', marginBottom: '15px' }}>
            Please login to post an answer
          </p>
          <button 
            onClick={() => navigate('/login')} 
            className="btn-primary"
          >
            Login
          </button>
        </div>
      )}

      <Modal
        show={modal.show}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ show: false, message: '', type: 'info' })}
      />
    </div>
  );
};

export default QuestionDetail;
