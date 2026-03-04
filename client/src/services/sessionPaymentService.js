import api from './api';

export const sessionPaymentService = {
  // Submit session payment
  submitPayment: async (formData) => {
    const response = await api.post('/tutors/sessions/payments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get tutor's session payments (for review)
  getTutorPayments: async () => {
    const response = await api.get('/tutors/sessions/payments/tutor');
    return response.data;
  },

  // Get student's session payments
  getStudentPayments: async () => {
    const response = await api.get('/tutors/sessions/payments/student');
    return response.data;
  },

  // Review payment (approve/reject)
  reviewPayment: async (paymentId, status, reviewNotes) => {
    const response = await api.put(`/tutors/sessions/payments/${paymentId}/review`, {
      status,
      review_notes: reviewNotes,
    });
    return response.data;
  },
};
