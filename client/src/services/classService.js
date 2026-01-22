import api from './api';

export const classService = {
  // Get all active classes
  getAllClasses: async () => {
    const response = await api.get('/classes');
    return response.data;
  },

  // Get class details
  getClassDetails: async (classId) => {
    const response = await api.get(`/classes/${classId}`);
    return response.data;
  },

  // Create new class (tutor only)
  createClass: async (classData) => {
    const response = await api.post('/classes', classData);
    return response.data;
  },

  // Get tutor's classes
  getTutorClasses: async () => {
    const response = await api.get('/classes/tutor/my-classes');
    return response.data;
  },

  // Update class
  updateClass: async (classId, updateData) => {
    const response = await api.put(`/classes/${classId}`, updateData);
    return response.data;
  },

  // Delete class
  deleteClass: async (classId) => {
    const response = await api.delete(`/classes/${classId}`);
    return response.data;
  },

  // Enroll in class (student)
  enrollInClass: async (classId) => {
    const response = await api.post(`/classes/${classId}/enroll`);
    return response.data;
  },

  // Get student's enrolled classes
  getMyEnrolledClasses: async () => {
    const response = await api.get('/classes/student/enrolled');
    return response.data;
  }
};
