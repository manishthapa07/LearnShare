import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { classService } from '../services/classService';
import './Notes.css';

const MyClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyClasses();
  }, []);

  const fetchMyClasses = async () => {
    try {
      const data = await classService.getTutorClasses();
      setClasses(data.classes || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await classService.deleteClass(classId);
        alert('Class deleted successfully');
        fetchMyClasses();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete class');
      }
    }
  };

  if (loading) {
    return <div className="notes-container">Loading...</div>;
  }

  return (
    <div className="notes-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>My Classes</h1>
        <button
          onClick={() => navigate('/create-class')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          ➕ Create New Class
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

      {classes.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '20px' }}>
            You haven't created any classes yet
          </p>
          <button
            onClick={() => navigate('/create-class')}
            style={{
              padding: '12px 30px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Create Your First Class
          </button>
        </div>
      ) : (
        <div className="notes-grid">
          {classes.map(cls => (
            <div key={cls.id} className="note-card">
              <div style={{ marginBottom: '15px' }}>
                <h3 style={{ marginBottom: '10px', color: '#2c3e50' }}>{cls.title}</h3>
                <p style={{ color: '#667eea', fontWeight: 'bold', marginBottom: '5px' }}>
                  {cls.subject}
                </p>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                  {cls.description || 'No description'}
                </p>
              </div>

              <div style={{ fontSize: '13px', color: '#555', marginBottom: '15px' }}>
                <p><strong>Type:</strong> {cls.class_type === 'monthly' ? 'Monthly' : 'Hourly'}</p>
                <p><strong>Fee:</strong> NPR {cls.class_type === 'monthly' ? cls.monthly_fee : cls.hourly_rate}/{cls.class_type === 'monthly' ? 'month' : 'hour'}</p>
                <p><strong>Schedule:</strong> {new Date(cls.start_date).toLocaleDateString()} - {new Date(cls.end_date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {cls.start_time} - {cls.end_time}</p>
                <p><strong>Days:</strong> {cls.class_days?.join(', ') || 'Not set'}</p>
                <p><strong>Enrolled:</strong> {cls.enrolled_count || 0}/{cls.max_students}</p>
                <p>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    backgroundColor: cls.status === 'active' ? '#d4edda' : '#f8d7da',
                    color: cls.status === 'active' ? '#155724' : '#721c24'
                  }}>
                    {cls.status}
                  </span>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link
                  to={`/class/${cls.id}`}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '5px',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}
                >
                  View Details
                </Link>
                <button
                  onClick={() => handleDelete(cls.id)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyClasses;
