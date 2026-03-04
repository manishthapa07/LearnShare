import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tutorService } from '../services/tutorService';
import './Notes.css';

const Tutors = () => {
  const { user } = useAuth();
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expertise, setExpertise] = useState('');

  useEffect(() => {
    fetchTutors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, expertise]);

  const fetchTutors = async () => {
    try {
      const data = await tutorService.getAllTutors({ search, expertise });
      setTutors(data.tutors || []);
    } catch (error) {
      console.error('Error fetching tutors:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          style={{
            fontSize: '16px',
            color: i <= rating ? '#ffc107' : '#ddd'
          }}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="notes-container">
      <div className="page-header">
        <h1>Find a Tutor</h1>
        {user?.role === 'tutor' && (
          <Link to={`/tutors/${user.id}`}>
            <button className="btn-submit">
              📚 My Tutor Profile
            </button>
          </Link>
        )}
      </div>
      
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="text"
          placeholder="Filter by expertise (e.g., Math, Physics)..."
          value={expertise}
          onChange={(e) => setExpertise(e.target.value)}
        />
      </div>
      
      {loading ? (
        <p>Loading tutors...</p>
      ) : (
        <div className="notes-grid">
          {tutors.length > 0 ? (
            tutors.map(tutor => (
              <div key={tutor.user_id} className="note-card">
                <h3>{tutor.full_name}</h3>
                <p className="tutor-username">@{tutor.username}</p>
                
                {tutor.bio && (
                  <p className="tutor-bio">{tutor.bio}</p>
                )}
                
                <div className="tutor-expertise">
                  <strong>Expertise:</strong>
                  <div className="expertise-tags">
                    {tutor.expertise?.map((exp, idx) => (
                      <span key={idx} className="expertise-tag">
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>
                
                {tutor.education && (
                  <p className="tutor-info-item">
                    <strong>Education:</strong> {tutor.education}
                  </p>
                )}
                
                {tutor.experience_years && (
                  <p className="tutor-info-item">
                    <strong>Experience:</strong> {tutor.experience_years} years
                  </p>
                )}
                
                <p className="tutor-price">
                  NPR {tutor.hourly_rate}/hour
                </p>
                
                <div className="tutor-rating">
                  <div className="stars">{renderStars(Math.round(tutor.rating || 0))}</div>
                  <span className="tutor-sessions-count">
                    ({tutor.total_sessions || 0} sessions)
                  </span>
                </div>
                
                <Link to={`/tutors/${tutor.user_id}`} className="btn-view">
                  View Profile & Book
                </Link>
              </div>
            ))
          ) : (
            <p>No tutors found</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Tutors;
