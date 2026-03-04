import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { forumService } from '../services/forumService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import './Notes.css';

const Forum = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [modal, setModal] = useState({ show: false, message: '', type: 'info' });

  useEffect(() => {
    fetchQuestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectFilter]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (subjectFilter) params.subject = subjectFilter;
      
      const data = await forumService.getAllQuestions(params);
      setQuestions(data.questions);
    } catch (err) {
      setError('Failed to load questions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const params = { search: searchTerm };
      if (subjectFilter) params.subject = subjectFilter;
      
      const data = await forumService.getAllQuestions(params);
      setQuestions(data.questions);
    } catch (err) {
      setError('Failed to search questions');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (questionId, vote) => {
    if (!user) {
      setModal({ show: true, message: 'Please login to vote', type: 'warning' });
      return;
    }

    try {
      await forumService.voteQuestion(questionId, vote);
      fetchQuestions(); // Refresh the list
    } catch (err) {
      setModal({ show: true, message: 'Failed to vote', type: 'error' });
    }
  };

  const filteredQuestions = questions.filter(q => 
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="notes-container">
      <div className="notes-header">
        <h1>Community Forum</h1>
        {user && (
          <button 
            className="btn-primary"
            onClick={() => navigate('/forum/create')}
          >
            Ask Question
          </button>
        )}
      </div>

      <div className="search-filters">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>

        <div style={{ marginBottom: '20px' }}>
          <select 
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd', minWidth: '200px' }}
          >
            <option value="">All Subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Biology">Biology</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Programming">Programming</option>
            <option value="Engineering">Engineering</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading questions...</div>
      ) : filteredQuestions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No questions found. {user && 'Be the first to ask!'}
        </div>
      ) : (
        <div className="notes-grid">
          {filteredQuestions.map(question => (
            <div key={question.id} className="note-card" style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '50px' }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleVote(question.id, 'up'); }}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      fontSize: '20px', 
                      cursor: 'pointer',
                      color: '#666'
                    }}
                    disabled={!user}
                  >
                    ▲
                  </button>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', margin: '5px 0' }}>
                    {question.votes || 0}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleVote(question.id, 'down'); }}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      fontSize: '20px', 
                      cursor: 'pointer',
                      color: '#666'
                    }}
                    disabled={!user}
                  >
                    ▼
                  </button>
                </div>
                
                <div style={{ flex: 1 }} onClick={() => navigate(`/forum/questions/${question.id}`)}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>
                    {question.title}
                    {question.is_answered && (
                      <span style={{ 
                        marginLeft: '10px', 
                        fontSize: '12px', 
                        padding: '3px 8px', 
                        background: '#27ae60', 
                        color: 'white', 
                        borderRadius: '3px' 
                      }}>
                        ✓ Answered
                      </span>
                    )}
                  </h3>
                  
                  <p style={{ 
                    color: '#666', 
                    margin: '0 0 15px 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {question.content}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {question.subject && (
                      <span style={{ 
                        fontSize: '12px', 
                        padding: '3px 8px', 
                        background: '#3498db', 
                        color: 'white', 
                        borderRadius: '3px' 
                      }}>
                        {question.subject}
                      </span>
                    )}
                    {question.tags && question.tags.map((tag, idx) => (
                      <span key={idx} style={{ 
                        fontSize: '12px', 
                        padding: '3px 8px', 
                        background: '#ecf0f1', 
                        color: '#555', 
                        borderRadius: '3px' 
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    fontSize: '14px',
                    color: '#888'
                  }}>
                    <span>
                      Asked by <strong>{question.full_name || question.username}</strong>
                    </span>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <span>{question.answer_count || 0} answers</span>
                      <span>{question.views || 0} views</span>
                      <span>{getTimeAgo(question.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}        </div>
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

export default Forum;
