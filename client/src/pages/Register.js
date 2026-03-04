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
  const [touched, setTouched] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateField = (name, value) => {
    let error = '';
    
    switch(name) {
      case 'username':
        if (value.length < 3) {
          error = 'Username must be at least 3 characters';
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          error = 'Username can only contain letters, numbers, and underscore';
        }
        break;
      
      case 'email':
        if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      
      case 'full_name':
        if (value.length < 2) {
          error = 'Full name must be at least 2 characters';
        } else if (!/^[a-zA-Z ]+$/.test(value)) {
          error = 'Full name can only contain letters and spaces';
        }
        break;
      
      case 'password':
        if (value.length < 8) {
          error = 'Password must be at least 8 characters';
        } else if (!/[A-Z]/.test(value)) {
          error = 'Password must contain at least one uppercase letter';
        } else if (!/[0-9]/.test(value)) {
          error = 'Password must contain at least one number';
        } else if (!/[!@#$%^&*]/.test(value)) {
          error = 'Password must contain at least one symbol (!@#$%^&*)';
        }
        break;
      
      case 'mobile':
        if (!/^[0-9]{10}$/.test(value)) {
          error = 'Mobile number must be exactly 10 digits';
        }
        break;
      
      default:
        break;
    }
    
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Validate if field has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setValidationErrors({
        ...validationErrors,
        [name]: error
      });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({
      ...touched,
      [name]: true
    });
    
    const error = validateField(name, value);
    setValidationErrors({
      ...validationErrors,
      [name]: error
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
              onBlur={handleBlur}
              required
              placeholder="Choose a username"
            />
            {touched.username && validationErrors.username && (
              <small style={{ color: '#e74c3c', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                {validationErrors.username}
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              placeholder="Enter your email"
            />
            {touched.email && validationErrors.email && (
              <small style={{ color: '#e74c3c', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                {validationErrors.email}
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              placeholder="Enter your full name"
            />
            {touched.full_name && validationErrors.full_name && (
              <small style={{ color: '#e74c3c', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                {validationErrors.full_name}
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              placeholder="Choose a password (min 8 characters)"
            />
            {touched.password && validationErrors.password && (
              <small style={{ color: '#e74c3c', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                {validationErrors.password}
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Mobile Number *</label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              placeholder="Enter your mobile number (10 digits)"
            />
            {touched.mobile && validationErrors.mobile && (
              <small style={{ color: '#e74c3c', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                {validationErrors.mobile}
              </small>
            )}
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
