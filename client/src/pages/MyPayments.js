import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import './Notes.css';

const MyPayments = () => {
  const [activeTab, setActiveTab] = useState('purchases'); // 'purchases' or 'earnings'
  const [payments, setPayments] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchPayments();
    fetchEarnings();
  }, []);

  const fetchPayments = async () => {
    try {
      const data = await paymentService.getUserPayments();
      setPayments(data.payments || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchEarnings = async () => {
    try {
      const data = await paymentService.getUploaderPayments();
      setEarnings(data.payments || []);
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching earnings:', err);
    }
  };

  const handlePaymentStatusUpdate = async (paymentId, status) => {
    const notes = prompt(`Enter notes for ${status} (optional):`);
    
    setProcessingId(paymentId);
    try {
      await paymentService.updatePaymentStatus(paymentId, status, notes || '');
      alert(`Payment ${status} successfully!`);
      fetchEarnings(); // Refresh earnings
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

  if (loading) {
    return <div className="loading">Loading payments...</div>;
  }

  return (
    <div className="notes-container">
      <h1>My Payments & Earnings</h1>
      
      {/* Info Banner */}
      <div style={{
        backgroundColor: '#fff3cd',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #ffc107'
      }}>
        <p style={{ margin: 0, fontSize: '14px' }}>
          <strong>📌 Two Tabs:</strong> <br/>
          • <strong>My Purchases</strong> - Payments you submitted for notes you bought<br/>
          • <strong>My Earnings</strong> - Payments received for YOUR uploaded notes (review & approve them here!)
        </p>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Pending Payments Alert */}
      {stats && stats.pending_count > 0 && (
        <div style={{
          backgroundColor: '#ff9800',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <strong>⚠️ Action Required!</strong> You have {stats.pending_count} pending payment{stats.pending_count > 1 ? 's' : ''} to review for your uploaded notes.
          </div>
          {activeTab !== 'earnings' && (
            <button
              onClick={() => setActiveTab('earnings')}
              style={{
                padding: '8px 16px',
                backgroundColor: 'white',
                color: '#ff9800',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Review Now →
            </button>
          )}
        </div>
      )}
      
      {/* Tab Navigation */}
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('purchases')}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: activeTab === 'purchases' ? '#667eea' : 'transparent',
            color: activeTab === 'purchases' ? 'white' : '#666',
            cursor: 'pointer',
            borderRadius: '5px 5px 0 0',
            marginRight: '5px',
            fontWeight: 'bold'
          }}
        >
          My Purchases
        </button>
        <button
          onClick={() => setActiveTab('earnings')}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: activeTab === 'earnings' ? '#667eea' : 'transparent',
            color: activeTab === 'earnings' ? 'white' : '#666',
            cursor: 'pointer',
            borderRadius: '5px 5px 0 0',
            fontWeight: 'bold'
          }}
        >
          My Earnings - Review & Approve {stats && stats.pending_count > 0 && `(${stats.pending_count} Pending!)`}
        </button>
      </div>

      {activeTab === 'purchases' ? (
        <>
          <div style={{ marginBottom: '20px' }}>
            <Link to="/payment-upload" className="btn-action" style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: '#667eea',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px'
            }}>
              Submit New Payment
            </Link>
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
                    <th style={{ padding: '12px', textAlign: 'left' }}>Note</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Reference</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Admin Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(payment => (
                    <tr key={payment.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px' }}>
                        {new Date(payment.created_at).toLocaleDateString()}
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
                        {payment.admin_notes || '-'}
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
              <Link to="/payment-upload" style={{ color: '#667eea' }}>
                Submit your first payment
              </Link>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Instructions for Uploaders */}
          <div style={{
            backgroundColor: '#e8f5e9',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #4caf50'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>How Payment Review Works:</h3>
            <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
              <li>Students purchase your notes and submit payment screenshots</li>
              <li>You receive payment submissions with status "Pending"</li>
              <li>Click "View" to check the payment screenshot</li>
              <li>If payment is valid, click <strong style={{color: '#28a745'}}>"Approve"</strong></li>
              <li>If payment is fake/invalid, click <strong style={{color: '#dc3545'}}>"Reject"</strong></li>
              <li>Once approved, the student gets access to download your note!</li>
            </ol>
          </div>
          
          {/* Earnings Stats */}
          {stats && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '20px'
            }}>
              <div style={{
                padding: '20px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#28a745' }}>
                  NPR {parseFloat(stats.total_earnings).toFixed(2)}
                </h3>
                <p style={{ margin: 0, color: '#666' }}>Total Earnings</p>
              </div>
              <div style={{
                padding: '20px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>
                  {stats.approved_count}
                </h3>
                <p style={{ margin: 0, color: '#666' }}>Approved Sales</p>
              </div>
              <div style={{
                padding: '20px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#ffc107' }}>
                  {stats.pending_count}
                </h3>
                <p style={{ margin: 0, color: '#666' }}>Pending Payments</p>
              </div>
            </div>
          )}

          {earnings.length > 0 ? (
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
                    <th style={{ padding: '12px', textAlign: 'left' }}>Buyer</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Note</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Reference</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Screenshot</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.map(payment => (
                    <tr key={payment.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px' }}>
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {payment.buyer_name}<br/>
                        <small style={{ color: '#666' }}>@{payment.buyer_username}</small>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Link to={`/notes/${payment.note_id}`} style={{ color: '#667eea' }}>
                          {payment.note_title}
                        </Link>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <strong style={{ color: '#28a745' }}>NPR {payment.amount}</strong>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {payment.transaction_reference || 'N/A'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {getStatusBadge(payment.status)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {payment.screenshot_path ? (
                          <a 
                            href={`http://localhost:5000/${payment.screenshot_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#667eea', textDecoration: 'underline', fontWeight: 'bold' }}
                          >
                            📷 View Screenshot
                          </a>
                        ) : (
                          <span style={{ color: '#999' }}>No screenshot</span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {payment.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                              onClick={() => handlePaymentStatusUpdate(payment.id, 'approved')}
                              disabled={processingId === payment.id}
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
                              Approve
                            </button>
                            <button
                              onClick={() => handlePaymentStatusUpdate(payment.id, 'rejected')}
                              disabled={processingId === payment.id}
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
              <p>No earnings yet</p>
              <Link to="/upload-note" style={{ color: '#667eea' }}>
                Upload your first note to start earning
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyPayments;
