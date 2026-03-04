import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import { useAuth } from '../context/AuthContext';
import './Notes.css';

const AdminPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Access denied. Admin only.');
      setLoading(false);
      return;
    }
    fetchPayments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, user]);

  const fetchPayments = async () => {
    try {
      const data = await paymentService.getAllPayments(filter);
      setPayments(data.payments || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (paymentId, status) => {
    const adminNotes = prompt(`Enter admin notes for ${status} (optional):`);
    
    setProcessingId(paymentId);
    try {
      await paymentService.updatePaymentStatus(paymentId, status, adminNotes || '');
      alert(`Payment ${status} successfully!`);
      fetchPayments();
    } catch (err) {
      alert(err.response?.data?.error || `Error updating payment status`);
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

  if (user?.role !== 'admin') {
    return (
      <div className="notes-container">
        <h1>Access Denied</h1>
        <p>You must be an admin to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading payments...</div>;
  }

  return (
    <div className="notes-container">
      <h1>Payment Management (Admin)</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>Filter by status:</label>
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '5px',
            border: '1px solid #ddd'
          }}
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
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
                <th style={{ padding: '12px', textAlign: 'left' }}>User</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Note</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Reference</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Screenshot</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px' }}>
                    {new Date(payment.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {payment.username}<br/>
                    <small style={{ color: '#666' }}>{payment.email}</small>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {payment.note_title ? (
                      <Link to={`/notes/${payment.note_id}`} style={{ color: '#667eea' }}>
                        {payment.note_title}
                      </Link>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>NPR {payment.amount}</td>
                  <td style={{ padding: '12px' }}>
                    {payment.transaction_reference || 'N/A'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {getStatusBadge(payment.status)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <a 
                      href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${payment.screenshot_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#667eea' }}
                    >
                      View
                    </a>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {payment.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => handleStatusUpdate(payment.id, 'approved')}
                          disabled={processingId === payment.id}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(payment.id, 'rejected')}
                          disabled={processingId === payment.id}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {payment.status !== 'pending' && (
                      <span style={{ color: '#666', fontSize: '12px' }}>
                        {payment.admin_notes || 'No notes'}
                      </span>
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
          <p>No payments found</p>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
