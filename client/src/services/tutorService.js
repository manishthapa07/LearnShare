import api from './api';

export const tutorService = {
  createOrUpdateProfile: async (profileData) => {
    const response = await api.post('/tutors/profile', profileData);
    return response.data;
  },

  getTutorProfile: async (id) => {
    const response = await api.get(`/tutors/profile/${id}`);
    return response.data;
  },

  getAllTutors: async (params = {}) => {
    const response = await api.get('/tutors', { params });
    return response.data;
  },

  bookSession: async (bookingData) => {
    const response = await api.post('/tutors/sessions/book', bookingData);
    return response.data;
  },

  getUserBookings: async () => {
    const response = await api.get('/tutors/sessions/my-bookings');
    return response.data;
  },

  updateSessionStatus: async (id, statusData) => {
    const response = await api.put(`/tutors/sessions/${id}/status`, statusData);
    return response.data;
  },

  cancelClassEnrollment: async (classId) => {
    const response = await api.delete(`/classes/${classId}/cancel-enrollment`);
    return response.data;
  }
};
