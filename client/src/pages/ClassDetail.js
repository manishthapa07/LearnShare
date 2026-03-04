import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { classService } from '../services/classService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import './Notes.css';

const ClassDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [modal, setModal] = useState({ show: false, message: '', type: 'info', showCancel: false, onConfirm: null });

  useEffect(() => {
    fetchClassDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchClassDetails = async () => {
    try {
      const data = await classService.getClassDetails(id);
      setClassData(data.class);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load class details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    setModal({
      show: true,
      message: 'Are you sure you want to send an enrollment request for this class? The tutor will need to approve your request before sessions are created.',
      type: 'confirm',
      showCancel: true,
      onConfirm: async () => {
        setEnrolling(true);
        try {
          const result = await classService.enrollInClass(id);
          setModal({ show: true, message: result.message || 'Enrollment request sent successfully! Waiting for tutor approval.', type: 'success', showCancel: false });
        } catch (err) {
          setModal({ show: true, message: err.response?.data?.error || 'Failed to send enrollment request', type: 'error', showCancel: false });
          setEnrolling(false);
        }
      }
    });
  };

  const calculateDuration = (startTime, endTime) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    return `${Math.floor(duration / 60)}h ${duration % 60}m`;
  };

  if (loading) {
    return <div className="notes-container">Loading class details...</div>;
  }

  if (error) {
    return (
      <div className="notes-container">
        <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>
        <button onClick={() => navigate('/classes')} style={{
          padding: '10px 20px',
          backgroundColor: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Back to Classes
        </button>
      </div>
    );
  }

  if (!classData) {
    return <div className="notes-container">Class not found</div>;
  }

  const isOwner = classData.tutor_id === user?.id;
  const isFull = (classData.enrolled_count || 0) >= classData.max_students;

  return (
    <div className="notes-container">
      <button
        onClick={() => navigate('/classes')}
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
        }}
      >
        ← Back to Classes
      </button>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
            <h1 style={{ margin: 0, color: '#2c3e50' }}>{classData.title}</h1>
            <span style={{
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 'bold',
              backgroundColor: classData.class_type === 'monthly' ? '#667eea' : '#28a745',
              color: 'white'
            }}>
              {classData.class_type === 'monthly' ? '📅 Monthly' : '⏰ Hourly'}
            </span>
          </div>
          <p style={{ fontSize: '18px', color: '#667eea', fontWeight: 'bold', margin: '10px 0' }}>
            📖 {classData.subject}
          </p>
          <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.6' }}>
            {classData.description || 'No description provided'}
          </p>
        </div>

        {/* Tutor Info */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '25px'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px' }}>👨‍🏫 Tutor Information</h3>
          <p style={{ margin: '8px 0' }}><strong>Name:</strong> {classData.tutor_name}</p>
          <p style={{ margin: '8px 0' }}><strong>Email:</strong> {classData.tutor_email}</p>
          {classData.tutor_rating && (
            <p style={{ margin: '8px 0' }}>
              <strong>Rating:</strong> ⭐ {Number(classData.tutor_rating).toFixed(1)}/5.0
            </p>
          )}
          {classData.expertise && classData.expertise.length > 0 && (
            <p style={{ margin: '8px 0' }}>
              <strong>Expertise:</strong> {classData.expertise.join(', ')}
            </p>
          )}
          {classData.education && (
            <p style={{ margin: '8px 0' }}>
              <strong>Education:</strong> {classData.education}
            </p>
          )}
        </div>

        {/* Schedule Info */}
        <div style={{
          backgroundColor: '#e8f5e9',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '25px'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px' }}>📅 Schedule</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>Duration</p>
              <p style={{ margin: '5px 0', fontWeight: 'bold' }}>
                {new Date(classData.start_date).toLocaleDateString()} - {new Date(classData.end_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>Class Days</p>
              <p style={{ margin: '5px 0', fontWeight: 'bold' }}>
                {classData.class_days?.join(', ') || 'Not specified'}
              </p>
            </div>
            <div>
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>Time</p>
              <p style={{ margin: '5px 0', fontWeight: 'bold' }}>
                {classData.start_time} - {classData.end_time}
              </p>
              <p style={{ margin: '5px 0', fontSize: '13px', color: '#666' }}>
                ({calculateDuration(classData.start_time, classData.end_time)} per session)
              </p>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div style={{
          backgroundColor: '#fff3cd',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '25px',
          textAlign: 'center'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '10px' }}>💰 Pricing</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#856404', margin: '10px 0' }}>
            NPR {classData.class_type === 'monthly' 
              ? (classData.monthly_fee ? Number(classData.monthly_fee).toFixed(2) : 'N/A')
              : (classData.hourly_rate ? `${Number(classData.hourly_rate).toFixed(2)}/hour` : 'N/A')}
          </p>
        </div>

        {/* Enrollment Info */}
        <div style={{
          backgroundColor: '#e3f2fd',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '25px'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px' }}>👥 Enrollment</h3>
          <p style={{ margin: '8px 0', fontSize: '16px' }}>
            <strong>Current Enrollment:</strong> {classData.enrolled_count || 0}/{classData.max_students} students
          </p>
          <div style={{
            backgroundColor: '#e0e0e0',
            height: '20px',
            borderRadius: '10px',
            overflow: 'hidden',
            marginTop: '10px'
          }}>
            <div style={{
              backgroundColor: isFull ? '#f44336' : '#4caf50',
              height: '100%',
              width: `${((classData.enrolled_count || 0) / classData.max_students) * 100}%`,
              transition: 'width 0.3s'
            }} />
          </div>
          <p style={{ margin: '10px 0', fontSize: '14px', color: '#666' }}>
            {isFull ? '❌ Class is full' : `✅ ${classData.max_students - (classData.enrolled_count || 0)} spots remaining`}
          </p>
          <p style={{ margin: '8px 0', fontSize: '14px' }}>
            <strong>Status:</strong>
            <span style={{
              marginLeft: '10px',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              backgroundColor: classData.status === 'active' ? '#d4edda' : '#f8d7da',
              color: classData.status === 'active' ? '#155724' : '#721c24'
            }}>
              {classData.status}
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {!isOwner && user?.role === 'student' && classData.status === 'active' && (
            <button
              onClick={handleEnroll}
              disabled={isFull || enrolling}
              style={{
                padding: '15px 40px',
                backgroundColor: isFull ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: isFull ? 'not-allowed' : 'pointer',
                opacity: enrolling ? 0.6 : 1
              }}
            >
              {enrolling ? 'Enrolling...' : isFull ? '❌ Class Full' : '✅ Enroll Now'}
            </button>
          )}
          {isOwner && (
            <>
              <button
                onClick={() => navigate('/my-class-sessions')}
                style={{
                  padding: '15px 40px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                📚 View Class Sessions
              </button>
              <button
                onClick={() => navigate(`/edit-class/${classData.id}`)}
                style={{
                  padding: '15px 40px',
                  backgroundColor: '#ffc107',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ✏️ Edit Class
              </button>
            </>
          )}
        </div>
      </div>

      <Modal
        show={modal.show}
        message={modal.message}
        type={modal.type}
        showCancel={modal.showCancel}
        onConfirm={modal.onConfirm}
        onClose={() => {
          setModal({ show: false, message: '', type: 'info', showCancel: false, onConfirm: null });
          if (modal.type === 'success') {
            setEnrolling(false);
            navigate('/my-class-sessions');
          }
        }}
      />
    </div>
  );
};

export default ClassDetail;
