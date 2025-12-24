import React, { useState } from 'react';
import { noteService } from '../services/noteService';
import { useNavigate } from 'react-router-dom';

const UploadNote = () => {
  const [formData, setFormData] = useState({ title: '', description: '', subject: '', category: '', price: '0', is_free: true, tags: '' });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (file) data.append('file', file);
    try {
      await noteService.uploadNote(data);
      setMessage('Note uploaded successfully!');
      setTimeout(() => navigate('/notes'), 2000);
    } catch (error) {
      setMessage('Error uploading note');
    }
  };

  return (
    <div style={{padding: '40px', maxWidth: '600px', margin: '0 auto'}}>
      <h2>Upload Note</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Title" onChange={(e) => setFormData({...formData, title: e.target.value})} required style={{width: '100%', padding: '10px', margin: '10px 0'}} />
        <textarea placeholder="Description" onChange={(e) => setFormData({...formData, description: e.target.value})} style={{width: '100%', padding: '10px', margin: '10px 0'}} />
        <input type="text" placeholder="Subject" onChange={(e) => setFormData({...formData, subject: e.target.value})} required style={{width: '100%', padding: '10px', margin: '10px 0'}} />
        <input type="text" placeholder="Category" onChange={(e) => setFormData({...formData, category: e.target.value})} required style={{width: '100%', padding: '10px', margin: '10px 0'}} />
        <input type="file" onChange={(e) => setFile(e.target.files[0])} required style={{width: '100%', padding: '10px', margin: '10px 0'}} />
        <label><input type="checkbox" checked={formData.is_free} onChange={(e) => setFormData({...formData, is_free: e.target.checked})} /> Free</label>
        {!formData.is_free && <input type="number" placeholder="Price" onChange={(e) => setFormData({...formData, price: e.target.value})} style={{width: '100%', padding: '10px', margin: '10px 0'}} />}
        <button type="submit" style={{padding: '10px 20px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}>Upload</button>
      </form>
    </div>
  );
};
export default UploadNote;
