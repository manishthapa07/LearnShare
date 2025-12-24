import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { noteService } from '../services/noteService';
import './Notes.css';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const data = await noteService.getAllNotes({ search, subject });
        setNotes(data.notes || []);
      } catch (error) {
        console.error('Error fetching notes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotes();
  }, [search, subject]);

  return (
    <div className="notes-container">
      <h1>Browse Notes</h1>
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
                <p><strong>Price:</strong> {note.is_free ? 'Free' : `$${note.price}`}</p>
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
