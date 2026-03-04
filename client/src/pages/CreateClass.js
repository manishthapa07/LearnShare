import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { classService } from '../services/classService';
import Modal from '../components/Modal';
import './Notes.css';

const CreateClass = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    class_type: 'monthly',
    start_date: '',
    end_date: '',
    class_days: [],
    start_time: '',
    end_time: '',
    monthly_fee: '',
    hourly_rate: '',
    max_students: 20,
    payment_bank_account: '',
    payment_esewa_id: '',
    payment_khalti_id: '',
    payment_qr_code: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ show: false, message: '', type: 'info' });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDayToggle = (day) => {
    const days = formData.class_days.includes(day)
      ? formData.class_days.filter(d => d !== day)
      : [...formData.class_days, day];
    setFormData({ ...formData, class_days: days });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await classService.createClass(formData);
      setModal({ show: true, message: 'Class created successfully!', type: 'success' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create class');
      setLoading(false);
    }
  };

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
      <h1>Create Tuition Class</h1>

      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        {/* Basic Info */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Class Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="e.g., Advanced Mathematics - Grade 10"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Subject *
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            placeholder="e.g., Mathematics"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            placeholder="Describe what students will learn..."
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '14px',
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Class Type */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Class Type *
          </label>
          <div style={{ display: 'flex', gap: '20px' }}>
            <label style={{ cursor: 'pointer' }}>
              <input
                type="radio"
                name="class_type"
                value="monthly"
                checked={formData.class_type === 'monthly'}
                onChange={handleChange}
              />
              <span style={{ marginLeft: '5px' }}>Monthly Basis</span>
            </label>
            <label style={{ cursor: 'pointer' }}>
              <input
                type="radio"
                name="class_type"
                value="hourly"
                checked={formData.class_type === 'hourly'}
                onChange={handleChange}
              />
              <span style={{ marginLeft: '5px' }}>Hourly Basis</span>
            </label>
          </div>
        </div>

        {/* Date Range */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Start Date *
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              End Date *
            </label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Class Days */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
            Class Days *
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {daysOfWeek.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => handleDayToggle(day)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: formData.class_days.includes(day) ? '#667eea' : '#f0f0f0',
                  color: formData.class_days.includes(day) ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: formData.class_days.includes(day) ? 'bold' : 'normal'
                }}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Time Range */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Start Time *
            </label>
            <input
              type="time"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              End Time *
            </label>
            <input
              type="time"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Pricing */}
        {formData.class_type === 'monthly' ? (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Monthly Fee (NPR) *
            </label>
            <input
              type="number"
              name="monthly_fee"
              value={formData.monthly_fee}
              onChange={handleChange}
              required={formData.class_type === 'monthly'}
              placeholder="e.g., 5000"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
          </div>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Hourly Rate (NPR) *
            </label>
            <input
              type="number"
              name="hourly_rate"
              value={formData.hourly_rate}
              onChange={handleChange}
              required={formData.class_type === 'hourly'}
              placeholder="e.g., 500"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
          </div>
        )}

        {/* Max Students */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Maximum Students
          </label>
          <input
            type="number"
            name="max_students"
            value={formData.max_students}
            onChange={handleChange}
            min="1"
            max="100"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Payment Receiving Details */}
        <div style={{
          marginTop: '30px',
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '2px solid #667eea'
        }}>
          <h3 style={{ marginTop: 0, color: '#667eea', marginBottom: '15px' }}>
            💳 Payment Receiving Details
          </h3>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
            Provide at least one payment method. Students will use these details to pay for your class.
          </p>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Bank Account Number
            </label>
            <input
              type="text"
              name="payment_bank_account"
              value={formData.payment_bank_account}
              onChange={handleChange}
              placeholder="e.g., 1234567890 (Bank Name - Account Holder Name)"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              eSewa ID
            </label>
            <input
              type="text"
              name="payment_esewa_id"
              value={formData.payment_esewa_id}
              onChange={handleChange}
              placeholder="e.g., 9876543210"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Khalti Number
            </label>
            <input
              type="text"
              name="payment_khalti_id"
              value={formData.payment_khalti_id}
              onChange={handleChange}
              placeholder="e.g., 9876543210"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '0' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Payment QR Code URL (Optional)
            </label>
            <input
              type="text"
              name="payment_qr_code"
              value={formData.payment_qr_code}
              onChange={handleChange}
              placeholder="e.g., https://example.com/my-qr-code.png"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              Upload your QR code to an image hosting service and paste the URL here
            </small>
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 30px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 30px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Creating...' : 'Create Class'}
          </button>
        </div>
      </form>

      <Modal
        show={modal.show}
        message={modal.message}
        type={modal.type}
        onClose={() => {
          setModal({ show: false, message: '', type: 'info' });
          setLoading(false);
          navigate('/my-classes');
        }}
      />
    </div>
  );
};

export default CreateClass;
