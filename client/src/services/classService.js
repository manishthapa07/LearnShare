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
  },

  // Get pending enrollment requests (tutor)
  getPendingEnrollments: async () => {
    const response = await api.get('/classes/tutor/enrollment-requests');
    return response.data;
  },

  // Approve enrollment request (tutor) - uses class payment details
  approveEnrollment: async (enrollmentId) => {
    const response = await api.post(`/classes/enrollment/${enrollmentId}/approve`);
    return response.data;
  },

  // Reject enrollment request (tutor)
  rejectEnrollment: async (enrollmentId, reason) => {
    const response = await api.post(`/classes/enrollment/${enrollmentId}/reject`, { reason });
    return response.data;
  },

  // Get enrollment payment details (student)
  getEnrollmentPaymentDetails: async (enrollmentId) => {
    const response = await api.get(`/classes/enrollment/${enrollmentId}/payment-details`);
    return response.data;
  },

  // Submit enrollment payment (student)
  submitEnrollmentPayment: async (enrollmentId, paymentFile) => {
    const formData = new FormData();
    formData.append('payment', paymentFile);
    const response = await api.post(`/classes/enrollment/${enrollmentId}/submit-payment`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Get pending payment verifications (tutor)
  getPendingPaymentVerifications: async () => {
    const response = await api.get('/classes/tutor/payment-verifications');
    return response.data;
  },

  // Verify enrollment payment (tutor)
  verifyEnrollmentPayment: async (enrollmentId, approved, notes) => {
    const response = await api.post(`/classes/enrollment/${enrollmentId}/verify-payment`, { approved, notes });
    return response.data;
  }
};
