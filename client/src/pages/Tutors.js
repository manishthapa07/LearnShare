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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Find a Tutor</h1>
        {user?.role === 'tutor' && (
          <Link to={`/tutors/${user.id}`}>
            <button 
              className="btn-submit"
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
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
                <p style={{ fontSize: '14px', color: '#666' }}>@{tutor.username}</p>
                
                {tutor.bio && (
                  <p style={{ fontSize: '14px', marginTop: '10px' }}>{tutor.bio}</p>
                )}
                
                <div style={{ marginTop: '10px' }}>
                  <strong>Expertise:</strong>
                  <div style={{ marginTop: '5px' }}>
                    {tutor.expertise?.map((exp, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-block',
                          backgroundColor: '#667eea',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          marginRight: '5px',
                          marginBottom: '5px'
                        }}
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>
                
                {tutor.education && (
                  <p style={{ marginTop: '10px', fontSize: '14px' }}>
                    <strong>Education:</strong> {tutor.education}
                  </p>
                )}
                
                {tutor.experience_years && (
                  <p style={{ fontSize: '14px' }}>
                    <strong>Experience:</strong> {tutor.experience_years} years
                  </p>
                )}
                
                <p style={{ fontSize: '16px', color: '#28a745', fontWeight: 'bold', marginTop: '10px' }}>
                  NPR {tutor.hourly_rate}/hour
                </p>
                
                <div style={{ marginTop: '10px' }}>
                  {renderStars(Math.round(tutor.rating || 0))}
                  <span style={{ marginLeft: '5px', fontSize: '14px', color: '#666' }}>
                    ({tutor.total_sessions || 0} sessions)
                  </span>
                </div>
                
                <Link to={`/tutors/${tutor.user_id}`} className="btn-view" style={{ marginTop: '15px', display: 'inline-block' }}>
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
