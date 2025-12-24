import api from './api';

export const noteService = {
  uploadNote: async (formData) => {
    const response = await api.post('/notes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getAllNotes: async (params = {}) => {
    const response = await api.get('/notes', { params });
    return response.data;
  },

  getNote: async (id) => {
    const response = await api.get(`/notes/${id}`);
    return response.data;
  },

  downloadNote: async (id) => {
    const response = await api.get(`/notes/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  getUserNotes: async () => {
    const response = await api.get('/notes/user/my-notes');
    return response.data;
  },

  deleteNote: async (id) => {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  }
};
