import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import './Auth.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, formData.password);
      navigate('/login', {
        state: { message: 'Password reset successfully. You can now log in with your new password.' }
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Reset Password</h2>
        <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
          Enter a new password for your account.
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter new password"
            />
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm new password"
            />
          </div>

          <ul style={{ fontSize: '12px', color: '#888', marginBottom: '16px', paddingLeft: '18px' }}>
            <li>At least 8 characters</li>
            <li>At least one uppercase letter</li>
            <li>At least one number</li>
            <li>At least one symbol (!@#$%^&*...)</li>
          </ul>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
