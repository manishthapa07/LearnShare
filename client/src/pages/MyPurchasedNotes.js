import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { noteService } from '../services/noteService';
import './Notes.css';

const MyPurchasedNotes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPurchasedNotes();
  }, []);

  const fetchPurchasedNotes = async () => {
    try {
      setLoading(true);
      const data = await noteService.getPurchasedNotes();
      setNotes(data.notes);
    } catch (err) {
      setError('Failed to load purchased notes');
      console.error('Error fetching purchased notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (noteId) => {
    try {
      const blob = await noteService.downloadNote(noteId);
      const note = notes.find(n => n.id === noteId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = note?.file_name || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Error downloading note: ' + (err.response?.data?.error || 'Download failed'));
    }
  };

  if (loading) {
    return <div className="loading">Loading your purchased notes...</div>;
  }

  return (
    <div className="notes-container">
      <div className="notes-header" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px',
        borderRadius: '15px',
        color: 'white',
        marginBottom: '30px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>📚 My Purchased Notes</h1>
        <p style={{ marginTop: '10px', fontSize: '16px', opacity: 0.9 }}>
          Notes you've purchased and downloaded
        </p>
        <div style={{ marginTop: '20px', display: 'flex', gap: '20px', fontSize: '14px' }}>
          <div style={{ 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            padding: '10px 20px', 
            borderRadius: '20px',
            fontWeight: 'bold'
          }}>
            📊 Total Notes: {notes.length}
          </div>
          <div style={{ 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            padding: '10px 20px', 
            borderRadius: '20px',
            fontWeight: 'bold'
          }}>
            💰 Paid: {notes.filter(n => !n.is_free).length}
          </div>
          <div style={{ 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            padding: '10px 20px', 
            borderRadius: '20px',
            fontWeight: 'bold'
          }}>
            🎁 Free: {notes.filter(n => n.is_free).length}
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {notes.length === 0 ? (
        <div className="no-notes" style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: 'white',
          borderRadius: '15px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>📭</div>
          <h2 style={{ color: '#333', marginBottom: '10px' }}>No Purchased Notes Yet</h2>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            Start building your knowledge library by purchasing notes
          </p>
          <button 
            onClick={() => navigate('/notes')} 
            className="btn-submit"
            style={{ 
              padding: '15px 40px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            🔍 Browse Available Notes
          </button>
        </div>
      ) : (
        <div className="notes-grid">
          {notes.map((note) => (
            <div key={note.id} className="note-card" style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              border: note.is_free ? '2px solid #28a745' : '2px solid #667eea'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
            }}>
              <div className="note-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '15px'
              }}>
                <h3 style={{ 
                  margin: 0,
                  fontSize: '20px',
                  color: '#333',
                  flex: 1
                }}>{note.title}</h3>
                {note.is_free ? (
                  <span style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    marginLeft: '10px'
                  }}>
                    🎁 FREE
                  </span>
                ) : (
                  <span style={{
                    backgroundColor: '#667eea',
                    color: 'white',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    marginLeft: '10px'
                  }}>
                    💎 PAID
                  </span>
                )}
              </div>

              <div className="note-content" style={{ marginBottom: '15px' }}>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  marginBottom: '12px'
                }}>
                  <div style={{ 
                    backgroundColor: '#f8f9fa',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}>
                    <strong style={{ color: '#667eea' }}>📖 Subject:</strong>
                    <div style={{ marginTop: '4px', color: '#333' }}>{note.subject}</div>
                  </div>
                  <div style={{ 
                    backgroundColor: '#f8f9fa',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}>
                    <strong style={{ color: '#667eea' }}>📂 Category:</strong>
                    <div style={{ marginTop: '4px', color: '#333' }}>{note.category}</div>
                  </div>
                </div>

                <p style={{ 
                  fontSize: '14px',
                  color: '#666',
                  lineHeight: '1.6',
                  marginBottom: '12px'
                }}>
                  {note.description || 'No description provided'}
                </p>

                <div style={{ 
                  borderTop: '1px solid #eee',
                  paddingTop: '12px',
                  marginTop: '12px'
                }}>
                  <p style={{ fontSize: '13px', color: '#666', margin: '4px 0' }}>
                    <strong>👤 Uploaded by:</strong> {note.uploader_full_name} <span style={{ color: '#999' }}>(@{note.uploader_name})</span>
                  </p>
                  <p style={{ fontSize: '13px', color: '#666', margin: '4px 0' }}>
                    <strong>📄 File:</strong> {note.file_name}
                  </p>
                  <p style={{ fontSize: '13px', color: '#666', margin: '4px 0' }}>
                    <strong>💾 Size:</strong> {(note.file_size / 1024).toFixed(2)} KB
                  </p>
                  
                  {note.purchase_date && (
                    <p style={{ 
                      fontSize: '13px',
                      color: note.is_free ? '#28a745' : '#667eea',
                      marginTop: '8px',
                      fontWeight: 'bold'
                    }}>
                      <strong>📅 {note.is_free ? 'Downloaded' : 'Purchased'}:</strong> {new Date(note.purchase_date).toLocaleDateString('en-US', { 
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                </div>

                {note.tags && note.tags.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '6px' }}>
                      <strong>🏷️ Tags:</strong>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {note.tags.map((tag, index) => (
                        <span
                          key={index}
                          style={{
                            backgroundColor: '#e9ecef',
                            color: '#495057',
                            padding: '4px 12px',
                            borderRadius: '15px',
                            fontSize: '11px',
                            fontWeight: '500'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="note-actions" style={{
                display: 'flex',
                gap: '10px',
                paddingTop: '15px',
                borderTop: '1px solid #eee'
              }}>
                <button
                  onClick={() => navigate(`/notes/${note.id}`)}
                  className="btn-action"
                  style={{ 
                    flex: 1,
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    borderRadius: '8px'
                  }}
                >
                  👁️ View Details
                </button>
                <button
                  onClick={() => handleDownload(note.id)}
                  className="btn-submit"
                  style={{ 
                    flex: 1,
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    borderRadius: '8px'
                  }}
                >
                  📥 Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ 
        marginTop: '40px',
        textAlign: 'center',
        padding: '30px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
      }}>
        <button
          onClick={() => navigate('/notes')}
          className="btn-action"
          style={{
            padding: '15px 40px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          ← Browse More Notes
        </button>
      </div>
    </div>
  );
};

export default MyPurchasedNotes;
