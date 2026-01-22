import React, { useState } from 'react';
import { noteService } from '../services/noteService';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

const UploadNote = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    category: '',
    price: '0',
    is_free: true,
    tags: ''
  });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const ALLOWED_FILE_TYPES = ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError('');

    if (selectedFile) {
      // Validate file type
      const fileExt = '.' + selectedFile.name.split('.').pop().toLowerCase();
      if (!ALLOWED_FILE_TYPES.includes(fileExt)) {
        setError(`Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`);
        e.target.value = '';
        return;
      }

      // Validate file size
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError(`File size exceeds 10MB limit. Your file is ${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB`);
        e.target.value = '';
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!file) {
      setError('Please select a file to upload');
      setLoading(false);
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    data.append('file', file);

    try {
      await noteService.uploadNote(data);
      setMessage('Note uploaded successfully!');
      setTimeout(() => navigate('/notes'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error uploading note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box" style={{ maxWidth: '700px' }}>
        <h2>Upload Study Resource</h2>
        
        {/* Info Banner */}
        <div style={{
          backgroundColor: '#e3f2fd',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #2196f3'
        }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
            💰 <strong>Manage Your Earnings:</strong> After uploading notes, students can purchase them. 
            You'll receive payment submissions to review and approve.
          </p>
          <Link 
            to="/my-payments" 
            style={{ 
              color: '#2196f3', 
              fontWeight: 'bold',
              textDecoration: 'underline',
              fontSize: '14px'
            }}
          >
            → View Earnings & Approve Payments
          </Link>
        </div>
        
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter resource title"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your resource"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Subject *</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              placeholder="e.g., Mathematics, Physics, Computer Science"
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select category</option>
              <option value="notes">Lecture Notes</option>
              <option value="assignment">Assignments</option>
              <option value="tutorial">Tutorials</option>
              <option value="reference">Reference Materials</option>
              <option value="past-papers">Past Papers</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>File * (PDF, DOC, DOCX, TXT, PPT, PPTX - Max 10MB)</label>
            <input
              type="file"
              onChange={handleFileChange}
              required
              accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
            />
            {file && (
              <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)}MB)
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., algebra, calculus, equations"
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="is_free"
                checked={formData.is_free}
                onChange={handleChange}
                style={{ marginRight: '10px' }}
              />
              Make this resource free
            </label>
          </div>

          {!formData.is_free && (
            <div className="form-group">
              <label>Price (NPR) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                placeholder="Enter price"
              />
            </div>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload Resource'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadNote;
