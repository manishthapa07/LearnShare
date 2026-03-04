import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tutorService } from '../services/tutorService';
import { reviewService } from '../services/reviewService';
import './Notes.css';
import './MySessions.css';

const MySessions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviewModal, setReviewModal] = useState({ show: false, session: null });
  const [reviewForm, setReviewForm] = useState({ rating: 5, review_text: '' });
  const [alertModal, setAlertModal] = useState({ show: false, message: '', type: 'success' });
  const [promptModal, setPromptModal] = useState({ show: false, title: '', details: '', value: '', onConfirm: null });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const data = await tutorService.getUserBookings();
      // Filter OUT class sessions - only show individual sessions
      const individualSessions = (data.bookings || []).filter(s => s.session_type !== 'class');
      setSessions(individualSessions);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (sessionId, status, additionalData = {}) => {
    setProcessingId(sessionId);
    try {
      await tutorService.updateSessionStatus(sessionId, { status, ...additionalData });
      setAlertModal({ show: true, message: `Session ${status} successfully!`, type: 'success' });
      fetchSessions();
    } catch (err) {
      setAlertModal({ show: true, message: err.response?.data?.error || `Error updating session status`, type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirm = (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    setPromptModal({
      show: true,
      title: 'Enter Meeting Link',
      details: `Student: ${session.student_name} | ${session.subject} | ${new Date(session.scheduled_date).toLocaleDateString()} ${session.scheduled_time}`,
      value: '',
      onConfirm: (link) => {
        setPromptModal({ show: false, title: '', details: '', value: '', onConfirm: null });
        if (link) handleStatusUpdate(sessionId, 'confirmed', { meeting_link: link });
      }
    });
  };

  const handleComplete = (sessionId) => {
    setPromptModal({
      show: true,
      title: 'Add session notes (optional):',
      details: '',
      value: '',
      onConfirm: (notes) => {
        setPromptModal({ show: false, title: '', details: '', value: '', onConfirm: null });
        handleStatusUpdate(sessionId, 'completed', { notes: notes || '' });
      }
    });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await reviewService.createSessionReview(reviewModal.session.id, reviewForm);
      setAlertModal({ show: true, message: 'Review submitted successfully!', type: 'success' });
      setReviewModal({ show: false, session: null });
      setReviewForm({ rating: 5, review_text: '' });
      fetchSessions();
    } catch (err) {
      setAlertModal({ show: true, message: err.response?.data?.error || 'Failed to submit review', type: 'error' });
    }
  };

  const openReviewModal = (session) => {
    setReviewModal({ show: true, session });
    setReviewForm({ rating: 5, review_text: '' });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { backgroundColor: '#ffc107', color: '#000' },
      confirmed: { backgroundColor: '#17a2b8', color: '#fff' },
      completed: { backgroundColor: '#28a745', color: '#fff' },
      cancelled: { backgroundColor: '#dc3545', color: '#fff' }
    };

    return (
      <span style={{
        padding: '5px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        ...styles[status]
      }}>
        {status}
      </span>
    );
  };

  const isTutor = (session) => session.tutor_id === user?.id;

  // Filter sessions based on selected status
  const filteredSessions = statusFilter === 'all' 
    ? sessions 
    : sessions.filter(session => {
        const sessionStatus = (session.status || '').toLowerCase();
        const filterStatus = statusFilter.toLowerCase();
        return sessionStatus === filterStatus;
      });

  if (loading) {
    return <div className="loading">Loading sessions...</div>;
  }

  return (
    <div className="notes-container">
      <h1>👤 Individual Sessions</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Filter Buttons */}
      <div className="filter-buttons">
        <span>Filter:</span>
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={statusFilter === status ? 'filter-btn filter-btn-active' : 'filter-btn'}
          >
            {status === 'all' ? 'All Sessions' : status}
          </button>
        ))}
      </div>
      
      <div className="nav-buttons-container">
        <button
          onClick={() => navigate('/my-class-sessions')}
          className="session-nav-btn btn-primary"
        >
          📚 View Class Sessions
        </button>
        {user?.role === 'student' && (
          <Link to="/tutors" className="session-nav-btn btn-success">
            ➕ Book New Session
          </Link>
        )}
        {user?.role === 'tutor' && (
          <Link to="/session-payments-review" className="session-nav-btn btn-success">
            💰 Review Payments
          </Link>
        )}
      </div>

      {filteredSessions.length > 0 ? (
        <div className="sessions-table-container" key={`filter-${statusFilter}`}>
          <table className="sessions-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>
                  {user?.role === 'tutor' ? 'Student' : 'Tutor'}
                </th>
                <th>Subject</th>
                <th>Duration</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Meeting Link</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody key={`tbody-${statusFilter}-${filteredSessions.length}`}>
              {filteredSessions.map(session => (
                <tr key={session.id}>
                  <td>
                    <span className="session-date">{new Date(session.scheduled_date).toLocaleDateString()}</span><br/>
                    <small className="session-time">{session.scheduled_time}</small>
                  </td>
                  <td>
                    {isTutor(session) ? (
                      <div>
                        <span className="session-participant">{session.student_name}</span><br/>
                        <small className="session-participant-username">@{session.student_username}</small><br/>
                        {session.status === 'pending' && (
                          <small className="session-participant-email">
                            📧 {session.student_email}
                          </small>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className="session-participant">{session.tutor_name}</span><br/>
                        <small className="session-participant-username">@{session.tutor_username}</small>
                      </div>
                    )}
                  </td>
                  <td>
                    <strong>{session.subject}</strong><br/>
                    <small className="session-time">{session.description}</small>
                  </td>
                  <td>{session.duration_minutes} min</td>
                  <td>
                    <strong className="session-fee">
                      NPR {(() => {
                        // If session has class_id, use class fees
                        if (session.class_id) {
                          if (session.class_type === 'monthly') {
                            return session.tutor_monthly_fee ? Number(session.tutor_monthly_fee).toFixed(2) : 'N/A';
                          } else {
                            // For hourly classes, use class hourly_rate (not tutor's individual rate)
                            return session.class_hourly_rate ? 
                              ((session.class_hourly_rate * session.duration_minutes) / 60).toFixed(2) : 
                              'N/A';
                          }
                        }
                        // For individual sessions, use tutor's hourly rate
                        return session.tutor_hourly_rate ? 
                          ((session.tutor_hourly_rate * session.duration_minutes) / 60).toFixed(2) : 
                          'N/A';
                      })()}
                    </strong>
                  </td>
                  <td>
                    {getStatusBadge(session.status)}
                  </td>
                  <td>
                    {session.payment_status ? (
                      <span className={`payment-status-badge ${session.payment_status}`}>
                        {session.payment_status === 'approved' ? '✓ Paid' : 
                         session.payment_status === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                      </span>
                    ) : (
                      <span className="payment-status-none">Not paid</span>
                    )}
                  </td>
                  <td>
                    {session.meeting_link ? (
                      session.payment_status === 'approved' ? (
                        <a 
                          href={session.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="meeting-link"
                        >
                          🔗 Join Meeting
                        </a>
                      ) : (
                        <span className="meeting-locked" title="Payment must be approved to access meeting link">
                          🔒 Locked
                        </span>
                      )
                    ) : (
                      <span className="meeting-not-set">Not set</span>
                    )}
                  </td>
                  <td>
                    <div className="session-actions-cell">
                      {/* Student can pay for confirmed sessions only if no payment exists */}
                      {!isTutor(session) && session.status === 'confirmed' && !session.payment_id && (
                        <Link
                          to={`/session-payment/${session.id}`}
                          className="session-action-link pay"
                        >
                          💳 Pay Now
                        </Link>
                      )}
                      
                      {/* Tutor can confirm pending sessions */}
                      {isTutor(session) && session.status === 'pending' && (
                        <button
                          onClick={() => handleConfirm(session.id)}
                          disabled={processingId === session.id}
                          className="session-action-btn btn-confirm"
                        >
                          Confirm
                        </button>
                      )}
                      
                      {/* Tutor can mark confirmed sessions as complete */}
                      {isTutor(session) && session.status === 'confirmed' && (
                        <button
                          onClick={() => handleComplete(session.id)}
                          disabled={processingId === session.id}
                          className="session-action-btn btn-complete"
                        >
                          Complete
                        </button>
                      )}
                      
                      {/* Anyone can cancel pending/confirmed sessions */}
                      {(session.status === 'pending' || session.status === 'confirmed') && (
                        <button
                          onClick={() => handleStatusUpdate(session.id, 'cancelled')}
                          disabled={processingId === session.id}
                          className="session-action-btn btn-cancel"
                        >
                          Cancel
                        </button>
                      )}
                      
                      {/* Review button for completed sessions */}
                      {session.status === 'completed' && (!session.user_has_reviewed || session.user_has_reviewed === 0) && (
                        <button
                          onClick={() => openReviewModal(session)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#ffc107',
                            color: '#000',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          ⭐ Leave Review
                        </button>
                      )}
                      
                      {session.status === 'completed' && session.user_has_reviewed > 0 && (
                        <small style={{ color: '#28a745', fontSize: '11px', fontWeight: 'bold' }}>
                          ✓ Reviewed
                        </small>
                      )}
                      
                      {session.status === 'completed' && session.notes && (
                        <small style={{ color: '#666', fontSize: '11px' }}>
                          Notes: {session.notes}
                        </small>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-sessions">
          <p>
            {statusFilter === 'all' 
              ? 'No sessions found' 
              : `No ${statusFilter} sessions found`}
          </p>
          {user?.role === 'student' && statusFilter === 'all' && (
            <Link to="/tutors">
              Browse tutors and book a session
            </Link>
          )}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.show && (
        <div className="review-modal-overlay">
          <div className="review-modal">
            <h3>
              Review {reviewModal.session.tutor_id === user?.id ? reviewModal.session.student_name : reviewModal.session.tutor_name}
            </h3>
            <form onSubmit={handleReviewSubmit}>
              <div className="rating-selector">
                <strong>Rating:</strong>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    className={`star-btn ${star <= reviewForm.rating ? 'filled' : 'empty'}`}
                  >
                    ★
                  </button>
                ))}
                <span>{reviewForm.rating}/5</span>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                  Review (optional):
                </label>
                <textarea
                  value={reviewForm.review_text}
                  onChange={(e) => setReviewForm({ ...reviewForm, review_text: e.target.value })}
                  placeholder="Share your experience..."
                  rows="4"
                />
              </div>
              <div className="review-modal-buttons">
                <button
                  type="button"
                  onClick={() => setReviewModal({ show: false, session: null })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '30px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>{alertModal.type === 'success' ? '✅' : '❌'}</div>
            <p style={{ fontSize: '16px', color: '#2c3e50', marginBottom: '20px' }}>{alertModal.message}</p>
            <button onClick={() => setAlertModal({ show: false, message: '', type: 'success' })} style={{ padding: '10px 30px', backgroundColor: alertModal.type === 'success' ? '#28a745' : '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>OK</button>
          </div>
        </div>
      )}

      {/* Prompt Modal */}
      {promptModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '30px', maxWidth: '450px', width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, color: '#2c3e50', marginBottom: '10px' }}>{promptModal.title}</h3>
            {promptModal.details && <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>{promptModal.details}</p>}
            <input
              type="text"
              value={promptModal.value}
              onChange={(e) => setPromptModal(p => ({ ...p, value: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && promptModal.onConfirm(promptModal.value)}
              autoFocus
              style={{ width: '100%', padding: '10px', border: '2px solid #667eea', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setPromptModal({ show: false, title: '', details: '', value: '', onConfirm: null })} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
              <button onClick={() => promptModal.onConfirm(promptModal.value)} style={{ padding: '10px 20px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySessions;
