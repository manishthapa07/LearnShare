import api from './api';

export const reminderService = {
  createReminder: async (reminderData) => {
    const response = await api.post('/reminders', reminderData);
    return response.data;
  },

  getUserReminders: async (params = {}) => {
    const response = await api.get('/reminders', { params });
    return response.data;
  },

  updateReminder: async (id, reminderData) => {
    const response = await api.put(`/reminders/${id}`, reminderData);
    return response.data;
  },

  deleteReminder: async (id) => {
    const response = await api.delete(`/reminders/${id}`);
    return response.data;
  }
};
