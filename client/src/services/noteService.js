import api from './api';

export const noteService = {
  uploadNote: async (formData) => {
    const response = await api.post('/notes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getAllNotes: async (params = {}) => {
    // Filter out undefined/null params
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await api.get('/notes', { params: cleanParams });
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

  getPurchasedNotes: async () => {
    const response = await api.get('/notes/user/purchased');
    return response.data;
  },

  updateNote: async (id, noteData) => {
    const response = await api.put(`/notes/${id}`, noteData);
    return response.data;
  },

  deleteNote: async (id) => {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  }
};
