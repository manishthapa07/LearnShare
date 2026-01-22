import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { Link } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    mobile: '',
    bio: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await authService.getProfile();
      setProfile(data.user);
      setFormData({
        full_name: data.user.full_name,
        mobile: data.user.mobile || '',
        bio: data.user.bio || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
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
    try {
      await authService.updateProfile(formData);
      setMessage('Profile updated successfully!');
      setEditing(false);
      fetchProfile();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error updating profile');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-box">
        <h2>User Profile</h2>
        
        {message && <div className="success-message">{message}</div>}
        
        {!editing ? (
          <div className="profile-view">
            <div className="profile-info">
              <p><strong>Username:</strong> {profile?.username}</p>
              <p><strong>Email:</strong> {profile?.email}</p>
              <p><strong>Mobile:</strong> {profile?.mobile || 'Not provided'}</p>
              <p><strong>Full Name:</strong> {profile?.full_name}</p>
              <p><strong>Role:</strong> {profile?.role}</p>
              <p><strong>Bio:</strong> {profile?.bio || 'No bio provided'}</p>
              <p>
                <strong>Rating:</strong> 
                {profile?.average_rating && profile.average_rating > 0 ? (
                  <>
                    <span style={{ color: '#ffc107', marginLeft: '10px', fontSize: '18px' }}>
                      {'★'.repeat(Math.round(Number(profile.average_rating)))}
                      {'☆'.repeat(5 - Math.round(Number(profile.average_rating)))}
                    </span>
                    <span style={{ marginLeft: '10px', color: '#666' }}>
                      {Number(profile.average_rating).toFixed(1)} ({profile.total_reviews || 0} {profile.total_reviews === 1 ? 'review' : 'reviews'})
                    </span>
                  </>
                ) : (
                  <span style={{ marginLeft: '10px', color: '#999', fontStyle: 'italic' }}>
                    No reviews yet
                  </span>
                )}
              </p>
              <p><strong>Member Since:</strong> {new Date(profile?.created_at).toLocaleDateString()}</p>
            </div>
            
            <button onClick={() => setEditing(true)} className="btn-edit">
              Edit Profile
            </button>

            <div className="profile-actions">
              <Link to="/upload-note" className="btn-action">Upload Note</Link>
              <Link to="/my-purchased-notes" className="btn-action">📚 My Purchased Notes</Link>
              <Link to="/my-payments" className="btn-action">My Payments</Link>
              {user?.role === 'tutor' && (
                <Link to={`/tutors/${user.id}`} className="btn-action">My Tutor Profile</Link>
              )}
              {user?.role === 'student' && (
                <div className="become-tutor-section">
                  <p className="become-tutor-text">Want to share your knowledge?</p>
                  <Link to={`/tutors/${user.id}`} className="btn-become-tutor">
                    🎓 Become a Tutor
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-form">
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
              />
            </div>

            <div className="form-group">
              <label>Mobile Number</label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                pattern="[0-9]{10}"
                title="Please enter a valid 10-digit mobile number"
                placeholder="10-digit mobile number"
              />
              <small style={{ color: '#666', fontSize: '12px' }}>Optional: 10-digit mobile number</small>
            </div>

            <div className="form-group">
              <label>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="4"
              />
            </div>

            <div className="form-buttons">
              <button type="submit" className="btn-submit">Save Changes</button>
              <button type="button" onClick={() => setEditing(false)} className="btn-cancel">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
