import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tutorService } from '../services/tutorService';
import './Profile.css';

const TutorProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    expertise: '',
    education: '',
    experience_years: 0,
    hourly_rate: 0,
    availability: {}
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const isOwnProfile = user?.id === id;

  useEffect(() => {
    if (id) {
      fetchTutorProfile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTutorProfile = async () => {
    try {
      const data = await tutorService.getTutorProfile(id);
      setProfile(data.profile);
      if (isOwnProfile) {
        setFormData({
          expertise: Array.isArray(data.profile.expertise) 
            ? data.profile.expertise.join(', ') 
            : data.profile.expertise || '',
          education: data.profile.education || '',
          experience_years: data.profile.experience_years || 0,
          hourly_rate: data.profile.hourly_rate || 0,
          availability: data.profile.availability || {}
        });
      }
    } catch (error) {
      console.error('Error fetching tutor profile:', error);
      setError('Tutor profile not found');
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
    setError('');
    setMessage('');

    try {
      await tutorService.createOrUpdateProfile(formData);
      setMessage('Tutor profile updated successfully!');
      setEditing(false);
      fetchTutorProfile();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setError('Error updating tutor profile');
    }
  };

  const handleBookSession = () => {
    navigate(`/session-booking/${id}`);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error && !profile && !editing) {
    return (
      <div className="profile-container">
        <div className="profile-box">
          <h2>Tutor Profile Not Found</h2>
          <p>{error}</p>
          {isOwnProfile && (
            <div>
              <p>You haven't created your tutor profile yet.</p>
              <button onClick={() => setEditing(true)} className="btn-edit">
                Create Tutor Profile
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-box">
        <button
          onClick={() => navigate('/tutors')}
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
            textDecoration: 'none',
          }}
        >
          ← Back to Tutors
        </button>
        <h2>{profile?.full_name || 'Create Your Tutor Profile'}</h2>
        
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        {!editing && profile ? (
          <div className="profile-view">
            <div className="profile-info">
              <p><strong>Username:</strong> {profile?.username}</p>
              <p><strong>Full Name:</strong> {profile?.full_name}</p>
              <p><strong>Bio:</strong> {profile?.bio || 'No bio provided'}</p>
              <p><strong>Expertise:</strong> {
                Array.isArray(profile?.expertise) 
                  ? profile.expertise.join(', ') 
                  : profile?.expertise || 'Not specified'
              }</p>
              <p><strong>Education:</strong> {profile?.education || 'Not specified'}</p>
              <p><strong>Experience:</strong> {profile?.experience_years || 0} years</p>
              <p><strong>Hourly Rate:</strong> NPR {profile?.hourly_rate || 0}/hour</p>
              <p><strong>Rating:</strong> {profile?.rating || 0}/5.00</p>
              <p><strong>Total Sessions:</strong> {profile?.total_sessions || 0}</p>
            </div>
            
            {isOwnProfile ? (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={() => setEditing(true)} className="btn-edit">
                  Edit Tutor Profile
                </button>
                <button 
                  onClick={() => navigate('/my-classes')}
                  style={{
                    padding: '10px 30px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}
                >
                  📚 My Classes
                </button>
                <button 
                  onClick={() => navigate('/create-class')}
                  style={{
                    padding: '10px 30px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}
                >
                  ➕ Create Class
                </button>
              </div>
            ) : (
              <button onClick={handleBookSession} className="btn-action">
                Book a Session
              </button>
            )}
          </div>
        ) : editing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>Expertise (comma-separated)</label>
              <input
                type="text"
                name="expertise"
                value={formData.expertise}
                onChange={handleChange}
                placeholder="e.g., Math, Physics, Chemistry"
                required
              />
            </div>

            <div className="form-group">
              <label>Education</label>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleChange}
                placeholder="e.g., Bachelor's in Mathematics"
              />
            </div>

            <div className="form-group">
              <label>Years of Experience</label>
              <input
                type="number"
                name="experience_years"
                value={formData.experience_years}
                onChange={handleChange}
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label>Hourly Rate (NPR)</label>
              <input
                type="number"
                name="hourly_rate"
                value={formData.hourly_rate}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                {profile ? 'Save Profile' : 'Create Tutor Profile'}
              </button>
              {profile && (
                <button type="button" onClick={() => setEditing(false)} className="btn-cancel">
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
};

export default TutorProfile;
