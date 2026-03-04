import React, { useState, useEffect } from 'react';
import { classService } from '../services/classService';
import Modal from '../components/Modal';
import './Notes.css';

const EnrollmentRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ show: false, message: '', type: 'info', showCancel: false, onConfirm: null });

  useEffect(() => {
    fetchEnrollmentRequests();
  }, []);

  const fetchEnrollmentRequests = async () => {
    try {
      setLoading(true);
      const data = await classService.getPendingEnrollments();
      setRequests(data.enrollmentRequests || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load enrollment requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (request) => {
    setModal({
      show: true,
      message: `Approve enrollment request from ${request.student_name} for "${request.class_title}"? Student will receive your class payment details.`,
      type: 'confirm',
      showCancel: true,
      onConfirm: async () => {
        setProcessingId(request.id);
        try {
          const result = await classService.approveEnrollment(request.id);
          setModal({ 
            show: true, 
            message: result.message || 'Enrollment approved! Student will receive payment details.', 
            type: 'success', 
            showCancel: false,
            onConfirm: null
          });
          await fetchEnrollmentRequests();
        } catch (err) {
          setModal({ 
            show: true, 
            message: err.response?.data?.error || 'Failed to approve enrollment', 
            type: 'error', 
            showCancel: false,
            onConfirm: null
          });
        } finally {
          setProcessingId(null);
        }
      }
    });
  };

  const handleReject = (request) => {
    setModal({
      show: true,
      message: `Reject enrollment request from ${request.student_name} for "${request.class_title}"?`,
      type: 'confirm',
      showCancel: true,
      onConfirm: async () => {
        setProcessingId(request.id);
        try {
          const result = await classService.rejectEnrollment(request.id);
          setModal({ show: true, message: result.message || 'Enrollment request rejected', type: 'success', showCancel: false });
          await fetchEnrollmentRequests();
        } catch (err) {
          setModal({ show: true, message: err.response?.data?.error || 'Failed to reject enrollment', type: 'error', showCancel: false });
        } finally {
          setProcessingId(null);
        }
      }
    });
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
    return <div className="notes-container">Loading enrollment requests...</div>;
  }

  return (
    <div className="notes-container">
      <h1>Enrollment Requests</h1>

      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

      {requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
          <h2>No Pending Requests</h2>
          <p>You don't have any pending enrollment requests at the moment.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {requests.map((request) => (
            <div 
              key={request.id} 
              style={{
                background: 'white',
                borderRadius: '10px',
                padding: '25px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderLeft: '4px solid #f39c12'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '20px' }}>
                    {request.class_title}
                  </h3>
                  <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                    <strong>Student:</strong> {request.student_name} ({request.student_email})
                  </div>
                  <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                    <strong>Subject:</strong> {request.subject}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                    <strong>Type:</strong> {request.class_type === 'monthly' ? 'Monthly Basis' : 'Hourly Basis'}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                    <strong>Fee:</strong> NPR {request.class_type === 'monthly' ? request.monthly_fee : request.hourly_rate + '/hour'}
                  </div>
                  <div style={{ color: '#888', fontSize: '13px', marginTop: '10px' }}>
                    Requested {getTimeAgo(request.created_at)}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
                  <button
                    onClick={() => handleApprove(request)}
                    disabled={processingId === request.id}
                    style={{
                      padding: '10px 20px',
                      background: processingId === request.id ? '#95a5a6' : '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: processingId === request.id ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      opacity: processingId === request.id ? 0.6 : 1
                    }}
                  >
                    {processingId === request.id ? '⏳ Processing...' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(request)}
                    disabled={processingId === request.id}
                    style={{
                      padding: '10px 20px',
                      background: processingId === request.id ? '#95a5a6' : '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: processingId === request.id ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      opacity: processingId === request.id ? 0.6 : 1
                    }}
                  >
                    {processingId === request.id ? '⏳ Processing...' : '✕ Reject'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        show={modal.show}
        message={modal.message}
        type={modal.type}
        showCancel={modal.showCancel}
        onConfirm={modal.onConfirm}
        onClose={() => {
          setModal({ show: false, message: '', type: 'info', showCancel: false, onConfirm: null });
          // Refresh the list when closing success modals
          if (modal.type === 'success') {
            fetchEnrollmentRequests();
          }
        }}
      />
    </div>
  );
};

export default EnrollmentRequests;
