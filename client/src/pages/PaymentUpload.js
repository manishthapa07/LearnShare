import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import { noteService } from '../services/noteService';
import './Auth.css';

const PaymentUpload = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const noteId = searchParams.get('noteId');
  
  const [note, setNote] = useState(null);
  const [formData, setFormData] = useState({
    note_id: noteId || '',
    amount: '',
    transaction_reference: ''
  });
  const [screenshot, setScreenshot] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (noteId) {
      fetchNoteDetails();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  const fetchNoteDetails = async () => {
    try {
      const data = await noteService.getNote(noteId);
      setNote(data.note);
      setFormData(prev => ({
        ...prev,
        note_id: noteId,
        amount: data.note.price
      }));
    } catch (error) {
      console.error('Error fetching note:', error);
      setError('Unable to load note details');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setError('');

    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPG, JPEG, and PNG images are allowed');
        e.target.value = '';
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`File size exceeds 5MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        e.target.value = '';
        return;
      }

      setScreenshot(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!screenshot) {
      setError('Please upload a payment screenshot');
      setLoading(false);
      return;
    }

    const data = new FormData();
    data.append('note_id', formData.note_id);
    data.append('amount', formData.amount);
    data.append('transaction_reference', formData.transaction_reference);
    data.append('screenshot', screenshot);

    try {
      await paymentService.submitPayment(data);
      setMessage('Payment submitted successfully! Awaiting admin approval.');
      setTimeout(() => navigate('/my-payments'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error submitting payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box" style={{ maxWidth: '600px' }}>
        <button
          onClick={() => navigate(noteId ? `/notes/${noteId}` : '/notes')}
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
          ← Back to Note
        </button>
        <h2>Submit Payment</h2>
        
        {note && (
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#f0f4ff', 
            borderRadius: '8px', 
            marginBottom: '20px' 
          }}>
            <h3 style={{ marginTop: 0 }}>Purchasing: {note.title}</h3>
            <p><strong>Subject:</strong> {note.subject}</p>
            <p><strong>Price:</strong> ${note.price}</p>
          </div>
        )}

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#fff3cd', 
          borderRadius: '8px', 
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          <h4 style={{ marginTop: 0 }}>Payment Instructions:</h4>
          <ol style={{ paddingLeft: '20px', margin: '10px 0' }}>
            <li>Make a payment to the platform's payment account</li>
            <li>Take a screenshot of your payment confirmation</li>
            <li>Upload the screenshot below along with payment details</li>
            <li>Wait for admin approval to access the resource</li>
          </ol>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Note ID *</label>
            <input
              type="text"
              name="note_id"
              value={formData.note_id}
              onChange={handleChange}
              required
              placeholder="Enter note ID or select from note page"
              readOnly={!!noteId}
            />
          </div>

          <div className="form-group">
            <label>Amount (USD) *</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="Enter payment amount"
            />
          </div>

          <div className="form-group">
            <label>Transaction Reference (Optional)</label>
            <input
              type="text"
              name="transaction_reference"
              value={formData.transaction_reference}
              onChange={handleChange}
              placeholder="Transaction ID or reference number"
            />
          </div>

          <div className="form-group">
            <label>Payment Screenshot * (JPG, JPEG, PNG - Max 5MB)</label>
            <input
              type="file"
              onChange={handleFileChange}
              required
              accept="image/jpeg,image/jpg,image/png"
            />
            {screenshot && (
              <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                Selected: {screenshot.name} ({(screenshot.size / (1024 * 1024)).toFixed(2)}MB)
              </div>
            )}
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Payment'}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          Already submitted? <a href="/my-payments" style={{ color: '#667eea' }}>Check payment status</a>
        </p>
      </div>
    </div>
  );
};

export default PaymentUpload;
