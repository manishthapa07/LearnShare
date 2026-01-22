import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tutorService } from '../services/tutorService';
import { sessionPaymentService } from '../services/sessionPaymentService';
import './Auth.css';

const SessionPayment = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [amount, setAmount] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSessionDetails();
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      const data = await tutorService.getUserBookings();
      const currentSession = data.bookings.find(b => b.id === sessionId);
      if (currentSession) {
        setSession(currentSession);
        
        // Use the payment_amount if it exists (from session_payments table)
        if (currentSession.payment_amount) {
          setAmount(Number(currentSession.payment_amount).toFixed(2));
        } else if (currentSession.session_type === 'class') {
          // Fallback for class sessions without payment record
          const isMonthly = currentSession.description && currentSession.description.toLowerCase().includes('month');
          
          if (isMonthly && currentSession.tutor_monthly_fee) {
            setAmount(Number(currentSession.tutor_monthly_fee).toFixed(2));
          } else if (currentSession.tutor_hourly_rate && currentSession.duration_minutes) {
            const hours = currentSession.duration_minutes / 60;
            const calculatedAmount = (currentSession.tutor_hourly_rate * hours).toFixed(2);
            setAmount(calculatedAmount);
          }
        } else {
          // For individual sessions, calculate based on hourly rate and duration
          if (currentSession.tutor_hourly_rate && currentSession.duration_minutes) {
            const hours = currentSession.duration_minutes / 60;
            const calculatedAmount = (currentSession.tutor_hourly_rate * hours).toFixed(2);
            setAmount(calculatedAmount);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      setError('Unable to load session details');
    }
  };

  const handleFileChange = (e) => {
    setScreenshot(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!screenshot) {
      setError('Please upload a payment screenshot');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('session_id', sessionId);
      formData.append('amount', amount);
      formData.append('screenshot', screenshot);

      await sessionPaymentService.submitPayment(formData);
      setMessage('Payment submitted successfully! Waiting for tutor approval.');
      setTimeout(() => navigate('/my-sessions'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error submitting payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box" style={{ maxWidth: '600px' }}>
        <h2>Submit Session Payment</h2>
        
        {session && (
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#f0f4ff', 
            borderRadius: '8px', 
            marginBottom: '20px' 
          }}>
            <h3 style={{ marginTop: 0 }}>Session Details</h3>
            <p><strong>Tutor:</strong> {session.tutor_name}</p>
            <p><strong>Subject:</strong> {session.subject}</p>
            <p><strong>Date:</strong> {new Date(session.scheduled_date).toLocaleDateString()}</p>
            <p><strong>Duration:</strong> {session.duration_minutes} minutes</p>
          </div>
        )}

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Amount (NPR) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              step="0.01"
              min="0"
              readOnly
              style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
              placeholder="Amount will be auto-filled"
            />
            <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
              Amount is set by the tutor and cannot be changed
            </small>
          </div>

          <div className="form-group">
            <label>Payment Screenshot *</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              required
            />
            <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
              Upload a screenshot of your payment transaction
            </small>
          </div>

          <div style={{ 
            padding: '12px', 
            backgroundColor: '#fff3cd', 
            borderRadius: '8px', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>Payment Instructions:</strong>
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              <li>Complete the payment to the tutor</li>
              <li>Take a clear screenshot of the transaction</li>
              <li>Upload the screenshot here</li>
              <li>Wait for the tutor to approve</li>
            </ul>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Payment'}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          Track your payments: <a href="/my-sessions" style={{ color: '#667eea' }}>My Sessions</a>
        </p>
      </div>
    </div>
  );
};

export default SessionPayment;
