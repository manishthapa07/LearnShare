import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    mobile: '',
    role: 'student',
    bio: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Register for LearnShare</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength="3"
              pattern="[a-zA-Z0-9_]{3,}"
              title="Username must be at least 3 characters (letters, numbers, underscore only)"
              placeholder="Choose a username"
            />
            <small style={{ color: '#666', fontSize: '12px' }}>At least 3 characters (letters, numbers, underscore)</small>
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
              title="Please enter a valid email address"
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              minLength="2"
              pattern="[a-zA-Z ]{2,}"
              title="Please enter your full name (letters and spaces only)"
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              pattern=".{6,}"
              title="Password must be at least 6 characters long"
              placeholder="Choose a password (min 6 characters)"
            />
            <small style={{ color: '#666', fontSize: '12px' }}>Must be at least 6 characters</small>
          </div>

          <div className="form-group">
            <label>Mobile Number *</label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              required
              pattern="[0-9]{10}"
              title="Please enter a valid 10-digit mobile number"
              placeholder="Enter your mobile number (10 digits)"
            />
            <small style={{ color: '#666', fontSize: '12px' }}>10-digit mobile number</small>
          </div>

          <div className="form-group">
            <label>Role</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="student">Student</option>
              <option value="tutor">Tutor</option>
            </select>
          </div>

          <div className="form-group">
            <label>Bio (Optional)</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself"
              rows="3"
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
