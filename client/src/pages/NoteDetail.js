import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { noteService } from '../services/noteService';
import { reviewService } from '../services/reviewService';
import './Profile.css';

const NoteDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [reviewStats, setReviewStats] = useState({ average_rating: 0, review_count: 0 });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, review_text: '' });
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    category: '',
    price: 0,
    is_free: false,
    tags: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasPurchased, setHasPurchased] = useState(false);

  const fetchNote = useCallback(async () => {
    try {
      const data = await noteService.getNote(id);
      setNote(data.note);
      setHasPurchased(data.hasPurchased || false);
      setFormData({
        title: data.note.title,
        description: data.note.description || '',
        subject: data.note.subject,
        category: data.note.category,
        price: data.note.price,
        is_free: data.note.is_free,
        tags: Array.isArray(data.note.tags) ? data.note.tags.join(', ') : ''
      });
    } catch (error) {
      console.error('Error fetching note:', error);
      setError('Note not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    try {
      const data = await reviewService.getNoteReviews(id);
      setReviews(data.reviews || []);
      setReviewStats({
        average_rating: data.average_rating || 0,
        review_count: data.review_count || 0
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  }, [id]);

  const fetchUserReview = useCallback(async () => {
    try {
      const data = await reviewService.getUserReview(id);
      if (data.review) {
        setUserReview(data.review);
        setReviewForm({
          rating: data.review.rating,
          review_text: data.review.review_text || ''
        });
      } else {
        setUserReview(null);
      }
    } catch (error) {
      console.error('Error fetching user review:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchNote();
    fetchReviews();
    if (user) {
      fetchUserReview();
    }
  }, [fetchNote, fetchReviews, fetchUserReview, user]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await reviewService.addOrUpdateReview({
        note_id: id,
        ...reviewForm
      });
      
      // Clear the form and hide it immediately
      setShowReviewForm(false);
      setIsEditingReview(false);
      setReviewForm({ rating: 5, review_text: '' });
      
      setMessage('Review submitted successfully!');
      
      // Small delay to ensure backend has processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force refresh all review data sequentially and update states
      const [reviewsData, userReviewData, noteData] = await Promise.all([
        reviewService.getNoteReviews(id),
        reviewService.getUserReview(id),
        noteService.getNote(id)
      ]);
      
      // Update all states to force re-render
      setReviews(reviewsData.reviews || []);
      setReviewStats({
        average_rating: reviewsData.average_rating || 0,
        review_count: reviewsData.review_count || 0
      });
      
      if (userReviewData.review) {
        setUserReview(userReviewData.review);
      } else {
        setUserReview(null);
      }
      
      setNote(noteData.note);
      setHasPurchased(noteData.hasPurchased || false);
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error submitting review');
    }
  };

  const handleDeleteReview = async () => {
    if (window.confirm('Are you sure you want to delete your review?')) {
      try {
        await reviewService.deleteReview(userReview.id);
        setMessage('Review deleted successfully!');
        
        // Reset states immediately
        setUserReview(null);
        setReviewForm({ rating: 5, review_text: '' });
        
        // Small delay to ensure backend has processed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Force refresh all data
        const [reviewsData, noteData] = await Promise.all([
          reviewService.getNoteReviews(id),
          noteService.getNote(id)
        ]);
        
        setReviews(reviewsData.reviews || []);
        setReviewStats({
          average_rating: reviewsData.average_rating || 0,
          review_count: reviewsData.review_count || 0
        });
        setNote(noteData.note);
        
        setTimeout(() => setMessage(''), 3000);
      } catch (err) {
        setError('Error deleting review');
      }
    }
  };

  const handleEditReview = () => {
    setReviewForm({
      rating: userReview.rating,
      review_text: userReview.review_text || ''
    });
    setIsEditingReview(true);
    setShowReviewForm(true);
  };

  const renderStars = (rating, interactive = false, onChange = null) => {
    return (
      <div style={{ display: 'flex', gap: '5px' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            onClick={() => interactive && onChange && onChange(star)}
            style={{
              fontSize: '24px',
              color: star <= rating ? '#ffc107' : '#ddd',
              cursor: interactive ? 'pointer' : 'default'
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await noteService.updateNote(id, formData);
      setMessage('Note updated successfully!');
      setEditing(false);
      fetchNote();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating note');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      try {
        await noteService.deleteNote(id);
        alert('Note deleted successfully!');
        navigate('/notes');
      } catch (err) {
        setError(err.response?.data?.error || 'Error deleting note');
      }
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await noteService.downloadNote(id);
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = note.file_name || 'download';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert('Download started!');
    } catch (err) {
      setError(err.response?.data?.error || 'Error downloading note. You may need to purchase this resource.');
    }
  };

  const handlePurchase = () => {
    navigate(`/payment-upload?noteId=${id}`);
  };

  const isOwner = user?.id === note?.uploader_id;
  const isAdmin = user?.role === 'admin';

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error && !note) {
    return (
      <div className="profile-container">
        <div className="profile-box">
          <h2>Note Not Found</h2>
          <p>{error}</p>
          <Link to="/notes" className="btn-action">Back to Notes</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-box" style={{ maxWidth: '800px' }}>
        <h2>{editing ? 'Edit Resource' : 'Resource Details'}</h2>
        
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        {!editing ? (
          <div className="profile-view">
            <div className="profile-info">
              <h3>{note?.title}</h3>
              <p><strong>Subject:</strong> {note?.subject}</p>
              <p><strong>Category:</strong> {note?.category}</p>
              <p><strong>Description:</strong> {note?.description || 'No description provided'}</p>
              <p><strong>Uploaded by:</strong> {note?.uploader_full_name} (@{note?.uploader_name})</p>
              <p><strong>File:</strong> {note?.file_name}</p>
              <p><strong>File Size:</strong> {(note?.file_size / 1024).toFixed(2)} KB</p>
              <p><strong>Price:</strong> {note?.is_free ? 'Free' : `NPR ${note?.price}`}</p>
              <p><strong>Downloads:</strong> {note?.downloads || 0}</p>
              <p><strong>Tags:</strong> {
                Array.isArray(note?.tags) && note.tags.length > 0
                  ? note.tags.join(', ')
                  : 'No tags'
              }</p>
              <p><strong>Uploaded:</strong> {new Date(note?.created_at).toLocaleDateString()}</p>
            </div>
            
            <div className="profile-actions">
              {user && !note?.is_free && !isOwner && !hasPurchased && (
                <button onClick={handlePurchase} className="btn-submit" style={{ marginRight: '10px' }}>
                  Purchase for NPR {note?.price}
                </button>
              )}
              
              {user && (note?.is_free || isOwner || hasPurchased) && (
                <button onClick={handleDownload} className="btn-action">
                  Download Resource
                </button>
              )}
              
              {hasPurchased && !isOwner && (
                <div style={{ color: '#28a745', fontSize: '14px', marginTop: '10px', fontWeight: 'bold' }}>
                  ✅ You own this resource
                </div>
              )}
              
              {(isOwner || isAdmin) && (
                <>
                  <button onClick={() => setEditing(true)} className="btn-edit">
                    Edit Resource
                  </button>
                  <button onClick={handleDelete} className="btn-cancel" style={{ marginLeft: '10px' }}>
                    Delete Resource
                  </button>
                </>
              )}
              
              <Link to="/notes" className="btn-action" style={{ marginLeft: '10px' }}>
                Back to Notes
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="profile-form">
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
              />
            </div>

            <div className="form-group">
              <label>Subject</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="notes">Lecture Notes</option>
                <option value="assignment">Assignments</option>
                <option value="tutorial">Tutorials</option>
                <option value="reference">Reference Materials</option>
                <option value="past-papers">Past Papers</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tags (comma-separated)</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
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
                <label>Price (NPR)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-submit">Update Resource</button>
              <button type="button" onClick={() => setEditing(false)} className="btn-cancel">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Reviews Section */}
        {!editing && (
          <div className="reviews-section" style={{ marginTop: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Reviews & Ratings</h2>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '24px', marginBottom: '5px' }}>
                  {renderStars(reviewStats.average_rating || 0, false)}
                  <span style={{ marginLeft: '10px', fontSize: '18px', color: '#666' }}>
                    {reviewStats.average_rating ? reviewStats.average_rating.toFixed(1) : '0.0'}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#888' }}>
                  {reviewStats.review_count} {reviewStats.review_count === 1 ? 'review' : 'reviews'}
                </div>
              </div>
            </div>

            {/* User's Review Form */}
            {user && !userReview && !showReviewForm && (note?.is_free || isOwner || hasPurchased) && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="btn-submit"
                style={{ marginBottom: '20px' }}
              >
                Write a Review
              </button>
            )}
            
            {/* Show message if user hasn't purchased */}
            {user && !userReview && !showReviewForm && !note?.is_free && !isOwner && !hasPurchased && (
              <div style={{
                padding: '15px',
                backgroundColor: '#fff3cd',
                borderRadius: '8px',
                marginBottom: '20px',
                color: '#856404',
                border: '1px solid #ffc107'
              }}>
                ℹ️ You must purchase this resource to leave a review
              </div>
            )}

            {/* Review Form */}
            {showReviewForm && (
              <div className="review-form" style={{
                backgroundColor: '#f9f9f9',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h3>{isEditingReview ? 'Edit Your Review' : 'Write Your Review'}</h3>
                <form onSubmit={handleReviewSubmit}>
                  <div className="form-group">
                    <label>Rating</label>
                    <div style={{ fontSize: '32px' }}>
                      {renderStars(reviewForm.rating, true, (rating) => 
                        setReviewForm({ ...reviewForm, rating })
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Review</label>
                    <textarea
                      value={reviewForm.review_text}
                      onChange={(e) => setReviewForm({ ...reviewForm, review_text: e.target.value })}
                      rows="4"
                      placeholder="Share your thoughts about this resource..."
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-submit">{isEditingReview ? 'Update Review' : 'Submit Review'}</button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReviewForm(false);
                        setIsEditingReview(false);
                        setReviewForm({ rating: 5, review_text: '' });
                      }}
                      className="btn-cancel"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* User's Existing Review */}
            {userReview && !showReviewForm && (
              <div className="user-review" style={{
                backgroundColor: '#e3f2fd',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Your Review</h3>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={handleEditReview}
                      className="btn-edit"
                      style={{ 
                        fontSize: '14px',
                        padding: '8px 16px',
                        backgroundColor: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={handleDeleteReview}
                      style={{ 
                        fontSize: '14px',
                        padding: '8px 16px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: '10px' }}>
                  {renderStars(userReview.rating, false)}
                  <p style={{ marginTop: '10px', fontSize: '16px' }}>{userReview.review_text}</p>
                  <p style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
                    Posted on {new Date(userReview.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {/* All Reviews */}
            <div className="reviews-list">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div
                    key={review.id}
                    className="review-item"
                    style={{
                      backgroundColor: '#fff',
                      padding: '20px',
                      borderRadius: '8px',
                      marginBottom: '15px',
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '16px' }}>{review.reviewer_name}</strong>
                        <div style={{ marginTop: '5px' }}>
                          {renderStars(review.rating, false)}
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        {new Date(review.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <p style={{ marginTop: '15px', fontSize: '15px', lineHeight: '1.6' }}>
                      {review.review_text}
                    </p>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: '#888', padding: '40px 0' }}>
                  No reviews yet. Be the first to review this resource!
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteDetail;
