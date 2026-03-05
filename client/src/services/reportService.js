import api from './api';

export const reportService = {
  // Submit a report against another user
  submitReport: (data) =>
    api.post('/reports', data).then(r => r.data),

  // Get all reports the current user has submitted
  getMyReports: () =>
    api.get('/reports/my').then(r => r.data),
};
