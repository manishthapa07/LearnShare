import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tutorService } from '../services/tutorService';
import { reviewService } from '../services/reviewService';
import './Notes.css';

const MyClassSessions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [reviewModal, setReviewModal] = useState({ show: false, session: null });
  const [reviewForm, setReviewForm] = useState({ rating: 5, review_text: '' });

  useEffect(() => {
    fetchClassSessions();
  }, []);

  const fetchClassSessions = async () => {
    try {
      const data = await tutorService.getUserBookings();
      // Filter only class sessions
      const classSessions = (data.bookings || []).filter(s => s.session_type === 'class');
      console.log('Class sessions with payment status:', classSessions.map(s => ({
        id: s.id,
        subject: s.subject,
        date: s.scheduled_date,
        payment_status: s.payment_status,
        payment_id: s.payment_id
      })));
      setSessions(classSessions);
    } catch (err) {
      console.error('Error fetching class sessions:', err);
      setError('Failed to load class sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (sessionId, status, additionalData = {}) => {
    setProcessingId(sessionId);
    try {
      await tutorService.updateSessionStatus(sessionId, { status, ...additionalData });
      alert(`Session ${status} successfully!`);
      fetchClassSessions();
    } catch (err) {
      alert(err.response?.data?.error || `Error updating session status`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirm = (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    const meetingLink = prompt(`Add meeting link for ${new Date(session.scheduled_date).toLocaleDateString()}:`);
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
      fetchClassSessions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit review');
    }
  };

  const handleCancelEnrollment = async (classId, className) => {
    if (!window.confirm(`Are you sure you want to cancel your enrollment in "${className}"? All scheduled sessions will be removed.`)) {
      return;
    }

    try {
      await tutorService.cancelClassEnrollment(classId);
      alert('Enrollment cancelled successfully');
      fetchClassSessions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel enrollment');
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

  // Group sessions by class_id
  const groupedSessions = sessions.reduce((acc, session) => {
    const classId = session.class_id || 'unknown';
    if (!acc[classId]) {
      acc[classId] = {
        sessions: [],
        classType: null,
        hasSharedPayment: false
      };
    }
    acc[classId].sessions.push(session);
    // Determine class type from description or other field
    if (!acc[classId].classType && session.description) {
      acc[classId].classType = session.description.includes('Monthly') ? 'monthly' : 'hourly';
    }
    return acc;
  }, {});

  if (loading) {
    return <div className="loading">Loading class sessions...</div>;
  }

  return (
    <div className="notes-container">
      <h1>📚 My Class Sessions</h1>

      {error && <div className="error-message">{error}</div>}

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/classes')}
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
          🔍 Browse All Classes
        </button>
        <button
          onClick={() => navigate('/my-sessions')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          👤 View Individual Sessions
        </button>
        {user?.role === 'tutor' && (
          <button
            onClick={() => navigate('/my-classes')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            📋 Manage My Classes
          </button>
        )}
      </div>

      {Object.keys(groupedSessions).length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {Object.entries(groupedSessions).map(([classId, classGroup]) => {
            const classSessions = classGroup.sessions;
            const firstSession = classSessions[0];
            const isMonthly = firstSession.description && firstSession.description.toLowerCase().includes('month');
            // Check if any session has a payment record (pending or submitted)
            const hasPayment = classSessions.some(s => s.payment_status && s.payment_status !== null);
            // Check if all sessions have approved payment
            const allPaid = classSessions.length > 0 && classSessions.every(s => s.payment_status === 'approved');
            // Check if payment is submitted but pending approval
            const isPending = classSessions.some(s => s.payment_status === 'pending' || s.payment_status === 'submitted');
            
            return (
              <div key={classId} style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '2px solid #667eea'
              }}>
                {/* Class Header */}
                <div style={{
                  borderBottom: '2px solid #e0e0e0',
                  paddingBottom: '15px',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  <div>
                    <h2 style={{ margin: '0 0 10px 0', color: '#667eea' }}>
                      {firstSession.subject}
                    </h2>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>
                        {isTutor(firstSession) ? '👨‍🎓 Students in this class' : `👨‍🏫 Tutor: ${firstSession.tutor_name}`}
                      </strong>
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#999' }}>
                      {classSessions.length} sessions scheduled
                      <span style={{
                        marginLeft: '10px',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: isMonthly ? '#667eea' : '#28a745',
                        color: 'white'
                      }}>
                        {isMonthly ? '📅 Monthly' : '⏰ Hourly'}
                      </span>
                    </p>
                    <p style={{ margin: '10px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#667eea' }}>
                      💰 Total Fee: NPR {isMonthly 
                        ? (firstSession.tutor_monthly_fee ? Number(firstSession.tutor_monthly_fee).toFixed(2) : 'N/A')
                        : (classSessions.length > 0 && firstSession.tutor_hourly_rate 
                          ? ((firstSession.tutor_hourly_rate * firstSession.duration_minutes * classSessions.length) / 60).toFixed(2)
                          : 'N/A'
                        )
                      }
                    </p>
                  </div>
                  
                  {/* Class Payment & Cancel Buttons (for both Monthly and Hourly) */}
                  {!isTutor(firstSession) && !allPaid && (
                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <button
                        onClick={() => navigate(`/session-payment/${firstSession.id}`)}
                        style={{
                          padding: '12px 24px',
                          backgroundColor: isPending ? '#ffc107' : '#667eea',
                          color: isPending ? '#000' : 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          fontWeight: 'bold'
                        }}
                      >
                        {isPending ? '⏳ Payment Pending' : `💰 Pay ${isMonthly ? 'Monthly' : 'Class'} Fee`}
                      </button>
                      {!allPaid && (
                        <button
                          onClick={() => handleCancelEnrollment(classId, firstSession.subject)}
                          style={{
                            padding: '12px 24px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold'
                          }}
                        >
                          ❌ Cancel Enrollment
                        </button>
                      )}
                      {hasPayment && (
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                          Payment submitted for approval
                        </p>
                      )}
                    </div>
                  )}
                  {!isTutor(firstSession) && allPaid && (
                    <div style={{
                      padding: '12px 24px',
                      backgroundColor: '#d4edda',
                      color: '#155724',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}>
                      ✓ Paid
                    </div>
                  )}
                </div>

                {/* Sessions Table */}
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Date</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Time</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Duration</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Status</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Payment</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Meeting Link</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classSessions.map(session => (
                      <tr key={session.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '10px' }}>
                          {new Date(session.scheduled_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td style={{ padding: '10px' }}>{session.scheduled_time}</td>
                        <td style={{ padding: '10px' }}>{session.duration_minutes} min</td>
                        <td style={{ padding: '10px' }}>{getStatusBadge(session.status)}</td>
                        <td style={{ padding: '10px' }}>
                          {/* Show shared payment status for all class types (monthly and hourly) */}
                          {allPaid ? (
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              backgroundColor: '#d4edda',
                              color: '#155724'
                            }}>
                              ✓ Paid
                            </span>
                          ) : hasPayment ? (
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              backgroundColor: '#fff3cd',
                              color: '#856404'
                            }}>
                              ⏳ Pending
                            </span>
                          ) : (
                            <span style={{ color: '#999', fontSize: '12px' }}>Not paid</span>
                          )}
                        </td>
                        <td style={{ padding: '10px' }}>
                          {session.meeting_link ? (
                            session.payment_status === 'approved' || isTutor(session) ? (
                              <a
                                href={session.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#667eea', fontWeight: 'bold', textDecoration: 'none' }}
                              >
                                🔗 Join
                              </a>
                            ) : (
                              <span style={{ color: '#999', fontSize: '12px' }}>
                                Pay first
                              </span>
                            )
                          ) : (
                            <span style={{ color: '#999', fontSize: '12px' }}>Not set</span>
                          )}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {/* Tutor Actions */}
                            {isTutor(session) && (
                              <>
                                {/* Allow adding meeting link when payment is approved */}
                                {session.payment_status === 'approved' && !session.meeting_link && (
                                  <button
                                    onClick={() => handleConfirm(session.id)}
                                    disabled={processingId === session.id}
                                    style={{
                                      padding: '6px 12px',
                                      backgroundColor: '#667eea',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    🔗 Add Link
                                  </button>
                                )}
                                {session.status === 'pending' && (
                                  <button
                                    onClick={() => handleConfirm(session.id)}
                                    disabled={processingId === session.id}
                                    style={{
                                      padding: '6px 12px',
                                      backgroundColor: '#28a745',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    ✓ Confirm
                                  </button>
                                )}
                                {session.status === 'confirmed' && (
                                  <button
                                    onClick={() => handleComplete(session.id)}
                                    disabled={processingId === session.id}
                                    style={{
                                      padding: '6px 12px',
                                      backgroundColor: '#17a2b8',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    ✓ Complete
                                  </button>
                                )}
                                {(session.status === 'pending' || session.status === 'confirmed') && (
                                  <button
                                    onClick={() => handleStatusUpdate(session.id, 'cancelled')}
                                    disabled={processingId === session.id}
                                    style={{
                                      padding: '6px 12px',
                                      backgroundColor: '#dc3545',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    ✗ Cancel
                                  </button>
                                )}
                              </>
                            )}
                            
                            {/* Student Actions */}
                            {!isTutor(session) && (
                              <>
                                {/* Removed individual payment buttons - now handled at class level */}
                                {session.status === 'completed' && session.user_has_reviewed === 0 && (
                                  <button
                                    onClick={() => openReviewModal(session)}
                                    style={{
                                      padding: '6px 12px',
                                      backgroundColor: '#667eea',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    ⭐ Review
                                  </button>
                                )}
                                {session.user_has_reviewed === 1 && (
                                  <span style={{ color: '#28a745', fontSize: '12px', fontWeight: 'bold' }}>
                                    ✓ Reviewed
                                  </span>
                                )}
                                {session.status === 'pending' && (
                                  <button
                                    onClick={() => handleStatusUpdate(session.id, 'cancelled')}
                                    disabled={processingId === session.id}
                                    style={{
                                      padding: '6px 12px',
                                      backgroundColor: '#dc3545',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    ✗ Cancel
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px'
        }}>
          <h2 style={{ color: '#666' }}>No class sessions found</h2>
          <p style={{ color: '#999', marginBottom: '20px' }}>
            {user?.role === 'student' 
              ? 'Enroll in a class to see your upcoming sessions'
              : 'Create a class and wait for students to enroll'}
          </p>
          <button
            onClick={() => navigate(user?.role === 'student' ? '/classes' : '/create-class')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {user?.role === 'student' ? '🔍 Browse Classes' : '➕ Create Class'}
          </button>
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
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginTop: 0 }}>Leave a Review</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Session: {reviewModal.session?.subject} on {new Date(reviewModal.session?.scheduled_date).toLocaleDateString()}
            </p>
            
            <form onSubmit={handleReviewSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                  Rating: {reviewForm.rating}/5
                </label>
                <div style={{ display: 'flex', gap: '10px', fontSize: '32px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      style={{
                        cursor: 'pointer',
                        color: star <= reviewForm.rating ? '#ffc107' : '#ddd'
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                  Review (optional):
                </label>
                <textarea
                  value={reviewForm.review_text}
                  onChange={(e) => setReviewForm({ ...reviewForm, review_text: e.target.value })}
                  rows="4"
                  placeholder="Share your experience with this session..."
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
                  onClick={() => {
                    setReviewModal({ show: false, session: null });
                    setReviewForm({ rating: 5, review_text: '' });
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
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

export default MyClassSessions;
