import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { classService } from '../services/classService';
import './Notes.css';

const EditClass = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    class_type: 'monthly',
    start_date: '',
    end_date: '',
    class_days: [],
    start_time: '',
    end_time: '',
    monthly_fee: '',
    hourly_rate: '',
    max_students: '',
    status: 'active'
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchClassDetails();
  }, [id]);

  const fetchClassDetails = async () => {
    try {
      const data = await classService.getClassDetails(id);
      const cls = data.class;
      
      setFormData({
        title: cls.title || '',
        subject: cls.subject || '',
        description: cls.description || '',
        class_type: cls.class_type || 'monthly',
        start_date: cls.start_date ? cls.start_date.split('T')[0] : '',
        end_date: cls.end_date ? cls.end_date.split('T')[0] : '',
        class_days: cls.class_days || [],
        start_time: cls.start_time || '',
        end_time: cls.end_time || '',
        monthly_fee: cls.monthly_fee || '',
        hourly_rate: cls.hourly_rate || '',
        max_students: cls.max_students || '',
        status: cls.status || 'active'
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load class details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      class_days: prev.class_days.includes(day)
        ? prev.class_days.filter(d => d !== day)
        : [...prev.class_days, day]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.subject) {
      alert('Please fill in title and subject');
      return;
    }

    if (formData.class_type === 'monthly' && !formData.monthly_fee) {
      alert('Please enter monthly fee for monthly classes');
      return;
    }

    if (formData.class_type === 'hourly' && !formData.hourly_rate) {
      alert('Please enter hourly rate for hourly classes');
      return;
    }

    setSubmitting(true);
    try {
      await classService.updateClass(id, formData);
      alert('Class updated successfully!');
      navigate(`/class/${id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update class');
    } finally {
      setSubmitting(false);
    }
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

  return (
    <div className="notes-container">
      <h1>✏️ Edit Class</h1>

      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Basic Info */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Class Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '5px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Subject *
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '5px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Class Type */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Class Type *
          </label>
          <select
            name="class_type"
            value={formData.class_type}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '5px'
            }}
          >
            <option value="monthly">Monthly (Fixed monthly fee)</option>
            <option value="hourly">Hourly (Per hour rate)</option>
          </select>
        </div>

        {/* Pricing */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          {formData.class_type === 'monthly' ? (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Monthly Fee (NPR) *
              </label>
              <input
                type="number"
                name="monthly_fee"
                value={formData.monthly_fee}
                onChange={handleChange}
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '5px'
                }}
              />
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Hourly Rate (NPR) *
              </label>
              <input
                type="number"
                name="hourly_rate"
                value={formData.hourly_rate}
                onChange={handleChange}
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '5px'
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Max Students *
            </label>
            <input
              type="number"
              name="max_students"
              value={formData.max_students}
              onChange={handleChange}
              min="1"
              required
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
            />
          </div>
        </div>

        {/* Schedule */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Start Date *
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              End Date *
            </label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Start Time *
            </label>
            <input
              type="time"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              End Time *
            </label>
            <input
              type="time"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
            />
          </div>
        </div>

        {/* Class Days */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Class Days
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {daysOfWeek.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => handleDayToggle(day)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: formData.class_days.includes(day) ? '#667eea' : '#f0f0f0',
                  color: formData.class_days.includes(day) ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: formData.class_days.includes(day) ? 'bold' : 'normal'
                }}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '5px'
            }}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => navigate(`/class/${id}`)}
            style={{
              padding: '12px 30px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '12px 30px',
              backgroundColor: submitting ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {submitting ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditClass;
