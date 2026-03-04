import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { classService } from '../services/classService';
import Modal from '../components/Modal';
import './Notes.css';

const EnrollmentPayment = () => {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentFile, setPaymentFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState({ show: false, message: '', type: 'info' });

  useEffect(() => {
    fetchEnrollmentDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollmentId]);

  const fetchEnrollmentDetails = async () => {
    try {
      setLoading(true);
      const data = await classService.getEnrollmentPaymentDetails(enrollmentId);
      setEnrollment(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setModal({
          show: true,
          message: 'Please upload an image file (JPG, PNG, or GIF)',
          type: 'error'
        });
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setModal({
          show: true,
          message: 'File size must be less than 5MB',
          type: 'error'
        });
        return;
      }
      setPaymentFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!paymentFile) {
      setModal({
        show: true,
        message: 'Please select a payment screenshot to upload',
        type: 'error'
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await classService.submitEnrollmentPayment(enrollmentId, paymentFile);
      setModal({
        show: true,
        message: result.message || 'Payment screenshot submitted successfully!',
        type: 'success'
      });
      
      // Redirect after successful submission
      setTimeout(() => {
        navigate('/my-classes');
      }, 2000);
    } catch (err) {
      setModal({
        show: true,
        message: err.response?.data?.error || 'Failed to submit payment',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="notes-container">Loading payment details...</div>;
  }

  if (error) {
    return (
      <div className="notes-container">
        <h1>Error</h1>
        <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>
        <button onClick={() => navigate('/my-classes')} className="btn">
          Back to My Classes
        </button>
      </div>
    );
  }

  if (!enrollment || enrollment.status !== 'awaiting_payment') {
    return (
      <div className="notes-container">
        <h1>Payment Not Required</h1>
        <p>This enrollment does not require payment at this time.</p>
        <button onClick={() => navigate('/my-classes')} className="btn">
          Back to My Classes
        </button>
      </div>
    );
  }

  return (
    <div className="notes-container">
      <button
        onClick={() => navigate('/my-classes')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: '#667eea',
          fontSize: '0.95rem',
          fontWeight: '600',
          cursor: 'pointer',
          padding: '0 0 16px 0',
        }}
      >
        ← Back to My Classes
      </button>
      <h1>Complete Payment</h1>
      
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ marginTop: 0, color: '#667eea' }}>{enrollment.title}</h2>
        <div style={{ color: '#666', marginBottom: '10px' }}>
          <strong>Subject:</strong> {enrollment.subject}
        </div>
        <div style={{ color: '#666', marginBottom: '10px' }}>
          <strong>Tutor:</strong> {enrollment.tutor_name}
        </div>
        <div style={{ color: '#666', marginBottom: '10px' }}>
          <strong>Class Type:</strong> {enrollment.class_type === 'monthly' ? 'Monthly' : 'Hourly'}
        </div>
        <div style={{ color: '#666', marginBottom: '10px' }}>
          <strong>Total Sessions:</strong> {enrollment.sessionCount}
        </div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60', marginTop: '15px' }}>
          Total Amount: NPR {enrollment.totalAmount}
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Payment Methods</h3>
        
        {enrollment.payment_bank_account && (
          <div style={{
            background: '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '15px',
            borderLeft: '4px solid #667eea'
          }}>
            <strong style={{ color: '#333' }}>Bank Account:</strong>
            <div style={{ fontSize: '16px', marginTop: '5px', color: '#555' }}>
              {enrollment.payment_bank_account}
            </div>
          </div>
        )}

        {enrollment.payment_esewa_id && (
          <div style={{
            background: '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '15px',
            borderLeft: '4px solid #60d394'
          }}>
            <strong style={{ color: '#333' }}>eSewa ID:</strong>
            <div style={{ fontSize: '16px', marginTop: '5px', color: '#555' }}>
              {enrollment.payment_esewa_id}
            </div>
          </div>
        )}

        {enrollment.payment_khalti_id && (
          <div style={{
            background: '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '15px',
            borderLeft: '4px solid #5d2e8c'
          }}>
            <strong style={{ color: '#333' }}>Khalti Number:</strong>
            <div style={{ fontSize: '16px', marginTop: '5px', color: '#555' }}>
              {enrollment.payment_khalti_id}
            </div>
          </div>
        )}

        {enrollment.payment_qr_code && (
          <div style={{
            background: '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '15px',
            borderLeft: '4px solid #ff6b6b'
          }}>
            <strong style={{ color: '#333' }}>Payment QR Code:</strong>
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
              <img 
                src={enrollment.payment_qr_code} 
                alt="Payment QR Code"
                style={{ maxWidth: '300px', border: '2px solid #ddd', borderRadius: '8px' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<div style="color: #666; padding: 10px;">QR Code: <a href="${enrollment.payment_qr_code}" target="_blank" rel="noopener noreferrer">${enrollment.payment_qr_code}</a></div>`;
                }}
              />
            </div>
          </div>
        )}

        {enrollment.tutor_payment_notes && (
          <div style={{
            background: '#fff3cd',
            padding: '15px',
            borderRadius: '8px',
            marginTop: '15px',
            borderLeft: '4px solid #ffc107'
          }}>
            <strong style={{ color: '#856404' }}>Note from Tutor:</strong>
            <div style={{ marginTop: '5px', color: '#856404' }}>
              {enrollment.tutor_payment_notes}
            </div>
          </div>
        )}
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Upload Payment Screenshot</h3>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              Payment Screenshot (JPG, PNG, or GIF - Max 5MB)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px dashed #ddd',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            />
            {paymentFile && (
              <div style={{ marginTop: '10px', color: '#27ae60' }}>
                ✓ Selected: {paymentFile.name}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => navigate('/my-classes')}
              style={{
                padding: '14px 28px',
                background: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !paymentFile}
              style={{
                padding: '14px 28px',
                background: submitting || !paymentFile ? '#cccccc' : '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: submitting || !paymentFile ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Payment'}
            </button>
          </div>
        </form>
      </div>

      <Modal
        show={modal.show}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ show: false, message: '', type: 'info' })}
      />
    </div>
  );
};

export default EnrollmentPayment;
