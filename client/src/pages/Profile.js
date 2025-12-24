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
              <p><strong>Full Name:</strong> {profile?.full_name}</p>
              <p><strong>Role:</strong> {profile?.role}</p>
              <p><strong>Bio:</strong> {profile?.bio || 'No bio provided'}</p>
              <p><strong>Member Since:</strong> {new Date(profile?.created_at).toLocaleDateString()}</p>
            </div>
            
            <button onClick={() => setEditing(true)} className="btn-edit">
              Edit Profile
            </button>

            <div className="profile-actions">
              <Link to="/upload-note" className="btn-action">Upload Note</Link>
              <Link to="/my-payments" className="btn-action">My Payments</Link>
              {user?.role === 'tutor' && (
                <Link to={`/tutors/${user.id}`} className="btn-action">My Tutor Profile</Link>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
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
