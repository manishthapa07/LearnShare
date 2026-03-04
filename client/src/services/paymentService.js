import api from './api';

export const paymentService = {
  submitPayment: async (formData) => {
    const response = await api.post('/payments/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getUserPayments: async () => {
    const response = await api.get('/payments/my-payments');
    return response.data;
  },

  getUploaderPayments: async (status) => {
    const response = await api.get('/payments/my-note-payments', { params: { status } });
    return response.data;
  },

  getAllPayments: async (status) => {
    const response = await api.get('/payments/all', { params: { status } });
    return response.data;
  },

  updatePaymentStatus: async (id, status, admin_notes) => {
    const response = await api.put(`/payments/${id}/status`, { status, admin_notes });
    return response.data;
  }
};
