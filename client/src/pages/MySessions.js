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
      alert(`Session ${status} successfully!`);
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.error || `Error updating session status`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirm = (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    
    // Show student details to tutor
    const studentDetails = `
Student Details:
Name: ${session.student_name}
Email: ${session.student_email}
Subject: ${session.subject}
Description: ${session.description}
Duration: ${session.duration_minutes} minutes
Date: ${new Date(session.scheduled_date).toLocaleDateString()}
Time: ${session.scheduled_time}

Please provide the meeting link to confirm this session:
    `.trim();
    
    const meetingLink = prompt(studentDetails);
    if (meetingLink) {
      handleStatusUpdate(sessionId, 'confirmed', { meeting_link: meetingLink });
    }
  };

  const handleComplete = (sessionId) => {
    const notes = prompt('Add session notes (optional):');
    handleStatusUpdate(sessionId, 'completed', { notes: notes || '' });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await reviewService.createSessionReview(reviewModal.session.id, reviewForm);
      alert('Review submitted successfully!');
      setReviewModal({ show: false, session: null });
      setReviewForm({ rating: 5, review_text: '' });
      fetchSessions(); // Refresh to update review status
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit review');
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
      <div className="filter-buttons" style={{ 
        marginBottom: '20px', 
        display: 'flex', 
        gap: '10px', 
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <span style={{ fontWeight: 'bold', marginRight: '10px' }}>Filter:</span>
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className="filter-btn"
            style={{
              padding: '8px 16px',
              backgroundColor: statusFilter === status ? '#667eea' : '#f8f9fa',
              color: statusFilter === status ? 'white' : '#333',
              border: statusFilter === status ? 'none' : '1px solid #dee2e6',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: statusFilter === status ? 'bold' : 'normal',
              textTransform: 'capitalize',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (statusFilter !== status) {
                e.target.style.backgroundColor = '#e9ecef';
              }
            }}
            onMouseLeave={(e) => {
              if (statusFilter !== status) {
                e.target.style.backgroundColor = '#f8f9fa';
              }
            }}
          >
            {status === 'all' ? 'All Sessions' : status}
          </button>
        ))}
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/my-class-sessions')}
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            marginRight: '10px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          📚 View Class Sessions
        </button>
        {user?.role === 'student' && (
          <Link to="/tutors" className="btn-action" style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            marginRight: '10px'
          }}>
            ➕ Book New Session
          </Link>
        )}
        {user?.role === 'tutor' && (
          <Link to="/session-payments-review" className="btn-action" style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px'
          }}>
            💰 Review Payments
          </Link>
        )}
      </div>

      {filteredSessions.length > 0 ? (
        <div className="sessions-table-container" key={`filter-${statusFilter}`}>
          <table className="sessions-table" style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderRadius: '8px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Date & Time</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>
                  {user?.role === 'tutor' ? 'Student' : 'Tutor'}
                </th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Subject</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Duration</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Fee</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Payment</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Meeting Link</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody key={`tbody-${statusFilter}-${filteredSessions.length}`}>
              {filteredSessions.map(session => (
                <tr key={session.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px' }}>
                    {new Date(session.scheduled_date).toLocaleDateString()}<br/>
                    <small style={{ color: '#666' }}>{session.scheduled_time}</small>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {isTutor(session) ? (
                      <div>
                        {session.student_name}<br/>
                        <small style={{ color: '#666' }}>@{session.student_username}</small><br/>
                        {session.status === 'pending' && (
                          <small style={{ color: '#999', fontSize: '11px' }}>
                            📧 {session.student_email}
                          </small>
                        )}
                      </div>
                    ) : (
                      <div>
                        {session.tutor_name}<br/>
                        <small style={{ color: '#666' }}>@{session.tutor_username}</small>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <strong>{session.subject}</strong><br/>
                    <small style={{ color: '#666' }}>{session.description}</small>
                  </td>
                  <td style={{ padding: '12px' }}>{session.duration_minutes} min</td>
                  <td style={{ padding: '12px' }}>
                    <strong style={{ color: '#667eea', fontSize: '15px' }}>
                      NPR {session.tutor_hourly_rate ? 
                        ((session.tutor_hourly_rate * session.duration_minutes) / 60).toFixed(2) : 
                        'N/A'
                      }
                    </strong>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {getStatusBadge(session.status)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {session.payment_status ? (
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: session.payment_status === 'approved' ? '#d4edda' : 
                                       session.payment_status === 'rejected' ? '#f8d7da' : '#fff3cd',
                        color: session.payment_status === 'approved' ? '#155724' : 
                               session.payment_status === 'rejected' ? '#721c24' : '#856404'
                      }}>
                        {session.payment_status === 'approved' ? '✓ Paid' : 
                         session.payment_status === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                      </span>
                    ) : (
                      <span style={{ color: '#999', fontSize: '12px' }}>Not paid</span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {session.meeting_link ? (
                      session.payment_status === 'approved' ? (
                        <a 
                          href={session.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#667eea', fontWeight: 'bold' }}
                        >
                          🔗 Join Meeting
                        </a>
                      ) : (
                        <span style={{ color: '#999' }} title="Payment must be approved to access meeting link">
                          🔒 Locked
                        </span>
                      )
                    ) : (
                      <span style={{ color: '#999' }}>Not set</span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {/* Student can pay for confirmed sessions only if no payment exists */}
                      {!isTutor(session) && session.status === 'confirmed' && !session.payment_id && (
                        <Link
                          to={`/session-payment/${session.id}`}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            textDecoration: 'none',
                            fontSize: '12px',
                            textAlign: 'center',
                            display: 'block'
                          }}
                        >
                          💳 Pay Now
                        </Link>
                      )}
                      
                      {/* Tutor can confirm pending sessions */}
                      {isTutor(session) && session.status === 'pending' && (
                        <button
                          onClick={() => handleConfirm(session.id)}
                          disabled={processingId === session.id}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Confirm
                        </button>
                      )}
                      
                      {/* Tutor can mark confirmed sessions as complete */}
                      {isTutor(session) && session.status === 'confirmed' && (
                        <button
                          onClick={() => handleComplete(session.id)}
                          disabled={processingId === session.id}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Complete
                        </button>
                      )}
                      
                      {/* Anyone can cancel pending/confirmed sessions */}
                      {(session.status === 'pending' || session.status === 'confirmed') && (
                        <button
                          onClick={() => handleStatusUpdate(session.id, 'cancelled')}
                          disabled={processingId === session.id}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
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
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p>
            {statusFilter === 'all' 
              ? 'No sessions found' 
              : `No ${statusFilter} sessions found`}
          </p>
          {user?.role === 'student' && statusFilter === 'all' && (
            <Link to="/tutors" style={{ color: '#667eea' }}>
              Browse tutors and book a session
            </Link>
          )}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
              Review {reviewModal.session.tutor_id === user?.id ? reviewModal.session.student_name : reviewModal.session.tutor_name}
            </h3>
            <form onSubmit={handleReviewSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                  Rating:
                </label>
                <div style={{ display: 'flex', gap: '10px', fontSize: '24px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      style={{
                        cursor: 'pointer',
                        color: star <= reviewForm.rating ? '#ffc107' : '#ddd',
                        transition: 'color 0.2s'
                      }}
                    >
                      ★
                    </span>
                  ))}
                  <span style={{ fontSize: '16px', marginLeft: '10px', alignSelf: 'center' }}>
                    {reviewForm.rating}/5
                  </span>
                </div>
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
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setReviewModal({ show: false, session: null })}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySessions;
