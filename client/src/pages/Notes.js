import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { noteService } from '../services/noteService';
import './Notes.css';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [priceFilter, setPriceFilter] = useState(''); // '', 'free', 'paid'

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const filters = { search, subject };
        if (priceFilter === 'free') {
          filters.is_free = true;
        } else if (priceFilter === 'paid') {
          filters.is_free = false;
        }
        const data = await noteService.getAllNotes(filters);
        setNotes(data.notes || []);
      } catch (error) {
        console.error('Error fetching notes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotes();
  }, [search, subject, priceFilter]);

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
        <h1>Browse Notes</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/my-purchased-notes">
            <button 
              className="btn-action"
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
              📚 My Purchased Notes
            </button>
          </Link>
          <Link to="/upload-note">
            <button 
              className="btn-submit"
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              + Upload Note
            </button>
          </Link>
        </div>
      </div>
      
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="text"
          placeholder="Filter by subject..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <select
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value)}
          style={{
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          <option value="">All Notes</option>
          <option value="free">Free Only</option>
          <option value="paid">Paid Only</option>
        </select>
      </div>
      
      {loading ? (
        <p>Loading notes...</p>
      ) : (
        <div className="notes-grid">
          {notes.length > 0 ? (
            notes.map(note => (
              <div key={note.id} className="note-card">
                <h3>{note.title}</h3>
                <p>{note.description}</p>
                <p><strong>Subject:</strong> {note.subject}</p>
                {note.rating && (
                  <div style={{ marginBottom: '8px' }}>
                    {renderStars(Math.round(note.rating))}
                    <span style={{ marginLeft: '5px', fontSize: '14px', color: '#666' }}>
                      ({note.rating.toFixed(1)})
                    </span>
                  </div>
                )}
                <p><strong>Price:</strong> {note.is_free ? 'Free' : `NPR ${note.price}`}</p>
                <Link to={`/notes/${note.id}`} className="btn-view">View Details</Link>
              </div>
            ))
          ) : (
            <p>No notes found</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Notes;
