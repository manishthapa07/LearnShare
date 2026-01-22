import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { classService } from '../services/classService';
import { useAuth } from '../context/AuthContext';
import './Notes.css';

const BrowseClasses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await classService.getAllClasses();
      setClasses(data.classes || []);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (classId) => {
    if (!window.confirm('Are you sure you want to enroll in this class? All sessions will be created automatically.')) {
      return;
    }

    try {
      const result = await classService.enrollInClass(classId);
      alert(result.message || 'Enrolled successfully!');
      navigate('/my-sessions');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to enroll in class');
    }
  };

  const getDaysList = (days) => {
    if (!days || days.length === 0) return 'Not specified';
    return days.join(', ');
  };

  const calculateDuration = (startTime, endTime) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    return `${Math.floor(duration / 60)}h ${duration % 60}m`;
  };

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = 
      cls.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.tutor_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = 
      filterType === 'all' || cls.class_type === filterType;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return <div className="loading">Loading classes...</div>;
  }

  return (
    <div className="notes-container">
      <h1>📚 Browse Tuition Classes</h1>

      {error && <div className="error-message">{error}</div>}

      {/* Navigation Buttons */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {user?.role === 'student' && (
          <button
            onClick={() => navigate('/my-class-sessions')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            📚 My Class Sessions
          </button>
        )}
        {user?.role === 'tutor' && (
          <>
            <button
              onClick={() => navigate('/my-classes')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              📋 My Classes
            </button>
            <button
              onClick={() => navigate('/create-class')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ➕ Create Class
            </button>
          </>
        )}
      </div>

      {/* Search and Filter */}
      <div style={{ marginBottom: '30px' }}>
        <input
          type="text"
          placeholder="🔍 Search classes, subjects, or tutors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 20px',
            fontSize: '16px',
            border: '2px solid #e0e0e0',
            borderRadius: '25px',
            marginBottom: '15px',
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
        />

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['all', 'monthly', 'hourly'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: '8px 20px',
                backgroundColor: filterType === type ? '#667eea' : '#f8f9fa',
                color: filterType === type ? 'white' : '#333',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: filterType === type ? 'bold' : 'normal',
                textTransform: 'capitalize'
              }}
            >
              {type === 'all' ? 'All Classes' : `${type} Classes`}
            </button>
          ))}
        </div>
      </div>

      {filteredClasses.length > 0 ? (
        <div className="notes-grid">
          {filteredClasses.map(cls => (
            <div key={cls.id} className="note-card" style={{ 
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              padding: '20px',
              backgroundColor: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}>
              {/* Type Badge */}
              <div style={{ marginBottom: '10px' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  backgroundColor: cls.class_type === 'monthly' ? '#667eea' : '#28a745',
                  color: 'white'
                }}>
                  {cls.class_type === 'monthly' ? '📅 Monthly' : '⏰ Hourly'}
                </span>
              </div>

              {/* Title and Subject */}
              <h3 style={{ margin: '10px 0', color: '#333', fontSize: '20px' }}>
                {cls.title}
              </h3>
              <p style={{ 
                color: '#667eea', 
                fontWeight: 'bold',
                fontSize: '14px',
                marginBottom: '10px'
              }}>
                📖 {cls.subject}
              </p>

              {/* Description */}
              <p style={{ 
                color: '#666', 
                fontSize: '14px',
                marginBottom: '15px',
                minHeight: '40px'
              }}>
                {cls.description || 'No description provided'}
              </p>

              {/* Tutor Info */}
              <div style={{ 
                padding: '10px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                  <strong>👨‍🏫 Tutor:</strong> {cls.tutor_name}
                </p>
                {cls.tutor_rating && (
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    <strong>⭐ Rating:</strong> {Number(cls.tutor_rating).toFixed(1)}/5.0
                  </p>
                )}
                {cls.expertise && cls.expertise.length > 0 && (
                  <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                    <strong>Expertise:</strong> {cls.expertise.join(', ')}
                  </p>
                )}
              </div>

              {/* Schedule Info */}
              <div style={{ marginBottom: '15px' }}>
                <p style={{ margin: '5px 0', fontSize: '13px' }}>
                  <strong>📅 Duration:</strong> {new Date(cls.start_date).toLocaleDateString()} - {new Date(cls.end_date).toLocaleDateString()}
                </p>
                <p style={{ margin: '5px 0', fontSize: '13px' }}>
                  <strong>🗓️ Days:</strong> {getDaysList(cls.class_days)}
                </p>
                <p style={{ margin: '5px 0', fontSize: '13px' }}>
                  <strong>🕐 Time:</strong> {cls.start_time} - {cls.end_time} ({calculateDuration(cls.start_time, cls.end_time)})
                </p>
              </div>

              {/* Pricing */}
              <div style={{ 
                padding: '12px',
                backgroundColor: '#e8f5e9',
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                <p style={{ 
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#2e7d32'
                }}>
                  💰 NPR {cls.class_type === 'monthly' 
                    ? (cls.monthly_fee ? Number(cls.monthly_fee).toFixed(2) : 'N/A')
                    : (cls.hourly_rate ? `${Number(cls.hourly_rate).toFixed(2)}/hour` : 'N/A')}
                </p>
              </div>

              {/* Enrollment Info */}
              <div style={{ marginBottom: '15px' }}>
                <p style={{ margin: '5px 0', fontSize: '13px' }}>
                  <strong>👥 Enrolled:</strong> {cls.enrolled_count || 0}/{cls.max_students}
                  <span style={{
                    marginLeft: '10px',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    backgroundColor: (cls.enrolled_count || 0) >= cls.max_students ? '#ffebee' : '#e8f5e9',
                    color: (cls.enrolled_count || 0) >= cls.max_students ? '#c62828' : '#2e7d32'
                  }}>
                    {(cls.enrolled_count || 0) >= cls.max_students ? 'FULL' : `${cls.max_students - (cls.enrolled_count || 0)} spots left`}
                  </span>
                </p>
              </div>

              {/* Enroll Button */}
              <button
                onClick={() => handleEnroll(cls.id)}
                disabled={(cls.enrolled_count || 0) >= cls.max_students}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: (cls.enrolled_count || 0) >= cls.max_students ? '#ccc' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: (cls.enrolled_count || 0) >= cls.max_students ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if ((cls.enrolled_count || 0) < cls.max_students) {
                    e.target.style.backgroundColor = '#5568d3';
                  }
                }}
                onMouseLeave={(e) => {
                  if ((cls.enrolled_count || 0) < cls.max_students) {
                    e.target.style.backgroundColor = '#667eea';
                  }
                }}
              >
                {(cls.enrolled_count || 0) >= cls.max_students ? '❌ Class Full' : '✅ Enroll Now'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px'
        }}>
          <h2 style={{ color: '#666' }}>No classes found</h2>
          <p style={{ color: '#999' }}>
            {searchTerm ? 'Try different search terms' : 'No active classes available at the moment'}
          </p>
        </div>
      )}
    </div>
  );
};

export default BrowseClasses;
