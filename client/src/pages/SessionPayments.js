import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionPaymentService } from '../services/sessionPaymentService';
import './Notes.css';

const SessionPayments = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const data = await sessionPaymentService.getTutorPayments();
      setPayments(data.payments || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (paymentId, status) => {
    const reviewNotes = status === 'rejected' 
      ? prompt('Enter reason for rejection:') 
      : '';
    
    if (status === 'rejected' && !reviewNotes) {
      return; // User cancelled
    }

    setProcessingId(paymentId);
    try {
      await sessionPaymentService.reviewPayment(paymentId, status, reviewNotes);
      alert(`Payment ${status} successfully!`);
      fetchPayments();
    } catch (err) {
      alert(err.response?.data?.error || 'Error reviewing payment');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { backgroundColor: '#ffc107', color: '#000' },
      approved: { backgroundColor: '#28a745', color: '#fff' },
      rejected: { backgroundColor: '#dc3545', color: '#fff' }
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

  if (loading) {
    return <div className="loading">Loading payments...</div>;
  }

  return (
    <div className="notes-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/my-sessions')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          ← Back to Sessions
        </button>
        <h1 style={{ margin: 0 }}>Session Payment Reviews</h1>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div style={{ 
        padding: '15px', 
        backgroundColor: '#f0f4ff', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <strong>💡 Instructions:</strong>
        <ul style={{ marginTop: '10px', marginBottom: 0 }}>
          <li>Review payment screenshots from students</li>
          <li>Approve valid payments to unlock meeting link access</li>
          <li>Reject invalid payments with a reason</li>
        </ul>
      </div>

      {payments.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderRadius: '8px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Student</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Session</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Screenshot</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px' }}>
                    {new Date(payment.created_at).toLocaleDateString()}<br/>
                    <small style={{ color: '#666' }}>
                      {new Date(payment.created_at).toLocaleTimeString()}
                    </small>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <strong>{payment.student_name}</strong><br/>
                    <small style={{ color: '#666' }}>@{payment.student_username}</small>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <strong>{payment.subject}</strong><br/>
                    <small style={{ color: '#666' }}>
                      {new Date(payment.scheduled_date).toLocaleDateString()} • {payment.duration_minutes} min
                    </small>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <strong style={{ color: '#28a745', fontSize: '16px' }}>
                      NPR {parseFloat(payment.amount).toFixed(2)}
                    </strong>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {payment.screenshot_path ? (
                      <a 
                        href={`http://localhost:5000/${payment.screenshot_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#667eea',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          display: 'inline-block'
                        }}
                      >
                        📷 View
                      </a>
                    ) : (
                      <span style={{ color: '#999' }}>No screenshot</span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {getStatusBadge(payment.status)}
                    {payment.review_notes && (
                      <div style={{ marginTop: '5px' }}>
                        <small style={{ color: '#666' }}>
                          Note: {payment.review_notes}
                        </small>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {payment.status === 'pending' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <button
                          onClick={() => handleReview(payment.id, 'approved')}
                          disabled={processingId === payment.id}
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
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleReview(payment.id, 'rejected')}
                          disabled={processingId === payment.id}
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
                          ✗ Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: '#999', fontSize: '12px' }}>Reviewed</span>
                    )}
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
          <p>No payment submissions yet</p>
        </div>
      )}
    </div>
  );
};

export default SessionPayments;
