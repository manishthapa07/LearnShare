import api from './api';

export const adminService = {
  // Dashboard
  getStats: () =>
    api.get('/admin/stats').then(r => r.data),

  // Users
  getUsers: (params = {}) =>
    api.get('/admin/users', { params }).then(r => r.data),

  updateUserRole: (userId, role) =>
    api.put(`/admin/users/${userId}/role`, { role }).then(r => r.data),

  deleteUser: (userId) =>
    api.delete(`/admin/users/${userId}`).then(r => r.data),

  // Notes
  getNotes: (params = {}) =>
    api.get('/admin/notes', { params }).then(r => r.data),

  deleteNote: (noteId) =>
    api.delete(`/admin/notes/${noteId}`).then(r => r.data),

  // Forum
  getQuestions: (params = {}) =>
    api.get('/admin/questions', { params }).then(r => r.data),

  deleteQuestion: (questionId) =>
    api.delete(`/admin/questions/${questionId}`).then(r => r.data),

  // Payments (reuse existing payment endpoints)
  getAllPayments: (status = '') =>
    api.get('/payments/all', { params: status ? { status } : {} }).then(r => r.data),

  updatePaymentStatus: (paymentId, status, admin_notes) =>
    api.put(`/payments/${paymentId}/status`, { status, admin_notes }).then(r => r.data),

  // Reports
  getReports: (params = {}) =>
    api.get('/admin/reports', { params }).then(r => r.data),

  updateReportStatus: (reportId, status, action_taken) =>
    api.put(`/admin/reports/${reportId}`, { status, action_taken }).then(r => r.data),
};
