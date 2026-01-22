import api from './api';

export const reviewService = {
  // Note Reviews
  addOrUpdateReview: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  getNoteReviews: async (noteId) => {
    const response = await api.get(`/reviews/note/${noteId}`);
    return response.data;
  },

  getUserReview: async (noteId) => {
    const response = await api.get(`/reviews/note/${noteId}/my-review`);
    return response.data;
  },

  deleteReview: async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },

  // Session Reviews
  createSessionReview: async (sessionId, reviewData) => {
    const response = await api.post(`/tutors/sessions/${sessionId}/review`, reviewData);
    return response.data;
  },

  getSessionReviews: async (sessionId) => {
    const response = await api.get(`/tutors/sessions/${sessionId}/reviews`);
    return response.data;
  },

  getUserSessionReviews: async (userId) => {
    const response = await api.get(`/tutors/users/${userId}/reviews`);
    return response.data;
  }
};
