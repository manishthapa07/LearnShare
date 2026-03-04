import React, { useState, useEffect } from 'react';
import { classService } from '../services/classService';
import Modal from '../components/Modal';
import './Notes.css';

const PaymentVerification = () => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ show: false, message: '', type: 'info', showCancel: false, onConfirm: null });
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      setLoading(true);
      const data = await classService.getPendingPaymentVerifications();
      setVerifications(data.verifications || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load payment verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (verification) => {
    setSelectedVerification(verification);
    setVerificationNotes('');
    setModal({
      show: true,
      message: `Approve payment from ${verification.student_name} for "${verification.title}"? This will create all class sessions.`,
      type: 'confirm',
      showCancel: true,
      onConfirm: async () => {
        try {
          const result = await classService.verifyEnrollmentPayment(
            verification.id,
            true,
            verificationNotes
          );
          setModal({
            show: true,
            message: result.message || 'Payment approved successfully!',
            type: 'success',
            showCancel: false,
            onConfirm: null
          });
          fetchPendingVerifications();
        } catch (err) {
          setModal({
            show: true,
            message: err.response?.data?.error || 'Failed to approve payment',
            type: 'error',
            showCancel: false,
            onConfirm: null
          });
        }
      }
    });
  };

  const handleReject = (verification) => {
    setSelectedVerification(verification);
    setVerificationNotes('');
    setModal({
      show: true,
      message: `Reject payment from ${verification.student_name}? Student will need to resubmit.`,
      type: 'confirm',
      showCancel: true,
      onConfirm: async () => {
        const notes = prompt('Reason for rejection (optional):');
        try {
          const result = await classService.verifyEnrollmentPayment(
            verification.id,
            false,
            notes || 'Payment screenshot not clear or incorrect amount'
          );
          setModal({
            show: true,
            message: result.message || 'Payment rejected',
            type: 'success',
            showCancel: false,
            onConfirm: null
          });
          fetchPendingVerifications();
        } catch (err) {
          setModal({
            show: true,
            message: err.response?.data?.error || 'Failed to reject payment',
            type: 'error',
            showCancel: false,
            onConfirm: null
          });
        }
      }
    });
  };

  const viewScreenshot = (verification) => {
    setSelectedVerification(verification);
    setShowImageModal(true);
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
    return <div className="notes-container">Loading payment verifications...</div>;
  }

  return (
    <div className="notes-container">
      <h1>Payment Verifications</h1>

      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

      {verifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
          <h2>No Pending Verifications</h2>
          <p>You don't have any payment submissions to verify at the moment.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {verifications.map((verification) => (
            <div 
              key={verification.id} 
              style={{
                background: 'white',
                borderRadius: '10px',
                padding: '25px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderLeft: '4px solid #3498db'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '20px' }}>
                    {verification.title}
                  </h3>
                  <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                    <strong>Student:</strong> {verification.student_name} (@{verification.student_username})
                  </div>
                  <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                    <strong>Subject:</strong> {verification.subject}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                    <strong>Class Type:</strong> {verification.class_type === 'monthly' ? 'Monthly' : 'Hourly'}
                  </div>
                  <div style={{ color: '#888', fontSize: '13px', marginTop: '10px' }}>
                    Payment submitted {getTimeAgo(verification.updated_at)}
                  </div>
                </div>
                
                <div style={{ marginLeft: '20px' }}>
                  {verification.payment_screenshot && (
                    <button
                      onClick={() => viewScreenshot(verification)}
                      style={{
                        padding: '10px 20px',
                        background: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        marginBottom: '10px',
                        width: '100%'
                      }}
                    >
                      🖼️ View Screenshot
                    </button>
                  )}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleApprove(verification)}
                      style={{
                        padding: '10px 20px',
                        background: '#27ae60',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(verification)}
                      style={{
                        padding: '10px 20px',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Screenshot Modal */}
      {showImageModal && selectedVerification && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setShowImageModal(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              maxWidth: '90%',
              maxHeight: '90%',
              overflow: 'auto',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowImageModal(false);
              }}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '35px',
                height: '35px',
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: 'bold',
                zIndex: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
              }}
              title="Close"
            >
              ×
            </button>
            <h3 style={{ marginTop: 0 }}>Payment Screenshot</h3>
            <p style={{ color: '#666', marginBottom: '15px' }}>
              From: {selectedVerification.student_name}<br/>
              Class: {selectedVerification.title}
            </p>
            <div style={{ textAlign: 'center' }}>
              <img 
                src={`http://localhost:5000/${selectedVerification.payment_screenshot}`} 
                alt="Payment Screenshot"
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  border: '2px solid #ddd',
                  borderRadius: '8px'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  const errorDiv = document.createElement('div');
                  errorDiv.style.padding = '20px';
                  errorDiv.style.color = '#e74c3c';
                  errorDiv.style.textAlign = 'center';
                  errorDiv.innerHTML = `
                    <p>❌ Could not load screenshot</p>
                    <p style="font-size: 12px; color: #666;">Path: ${selectedVerification.payment_screenshot}</p>
                    <p style="font-size: 12px; color: #999;">The file may have been moved or deleted.</p>
                  `;
                  if (!e.target.nextElementSibling || e.target.nextElementSibling.tagName !== 'DIV') {
                    e.target.parentElement.appendChild(errorDiv);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      <Modal
        show={modal.show}
        message={modal.message}
        type={modal.type}
        showCancel={modal.showCancel}
        onConfirm={modal.onConfirm}
        onClose={() => setModal({ show: false, message: '', type: 'info', showCancel: false, onConfirm: null })}
      />
    </div>
  );
};

export default PaymentVerification;
