import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tutorService } from '../services/tutorService';
import './Auth.css';

const SessionBooking = () => {
  const { tutorId } = useParams();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [formData, setFormData] = useState({
    tutor_id: tutorId || '',
    subject: '',
    description: '',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 60
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tutorId) {
      fetchTutorProfile();
    }
  }, [tutorId]);

  const fetchTutorProfile = async () => {
    try {
      const data = await tutorService.getTutorProfile(tutorId);
      setTutor(data.profile);
      setFormData(prev => ({ ...prev, tutor_id: tutorId }));
    } catch (error) {
      console.error('Error fetching tutor:', error);
      setError('Unable to load tutor details');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await tutorService.bookSession(formData);
      setMessage('Session booked successfully! The tutor will confirm shortly.');
      setTimeout(() => navigate('/my-sessions'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error booking session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box" style={{ maxWidth: '600px' }}>
        <h2>Book a Tutoring Session</h2>
        
        {tutor && (
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#f0f4ff', 
            borderRadius: '8px', 
            marginBottom: '20px' 
          }}>
            <h3 style={{ marginTop: 0 }}>Tutor: {tutor.full_name}</h3>
            <p><strong>Expertise:</strong> {Array.isArray(tutor.expertise) ? tutor.expertise.join(', ') : tutor.expertise}</p>
            <p><strong>Hourly Rate:</strong> NPR {tutor.hourly_rate}/hour</p>
            <p><strong>Rating:</strong> {tutor.rating}/5.00 ({tutor.total_sessions} sessions)</p>
          </div>
        )}

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tutor ID *</label>
            <input
              type="text"
              name="tutor_id"
              value={formData.tutor_id}
              onChange={handleChange}
              required
              placeholder="Enter tutor ID or select from tutors page"
              readOnly={!!tutorId}
            />
          </div>

          <div className="form-group">
            <label>Subject *</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              placeholder="e.g., Calculus, Physics, Programming"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what you need help with"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Date *</label>
            <input
              type="date"
              name="scheduled_date"
              value={formData.scheduled_date}
              onChange={handleChange}
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label>Time *</label>
            <input
              type="time"
              name="scheduled_time"
              value={formData.scheduled_time}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Duration (minutes) *</label>
            <select
              name="duration_minutes"
              value={formData.duration_minutes}
              onChange={handleChange}
              required
            >
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>

          <div style={{ 
            padding: '12px', 
            backgroundColor: '#fff3cd', 
            borderRadius: '8px', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>Note:</strong> Your booking will be pending until the tutor confirms. 
            You'll receive a meeting link once confirmed.
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Booking...' : 'Book Session'}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          View your bookings: <a href="/my-sessions" style={{ color: '#667eea' }}>My Sessions</a>
        </p>
      </div>
    </div>
  );
};

export default SessionBooking;
