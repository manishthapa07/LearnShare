import api from './api';

export const forumService = {
  createQuestion: async (questionData) => {
    const response = await api.post('/forum/questions', questionData);
    return response.data;
  },

  getAllQuestions: async (params = {}) => {
    const response = await api.get('/forum/questions', { params });
    return response.data;
  },

  getQuestion: async (id, incrementView = false) => {
    const response = await api.get(`/forum/questions/${id}`, {
      params: { incrementView: incrementView ? 'true' : 'false' }
    });
    return response.data;
  },

  voteQuestion: async (id, vote) => {
    const response = await api.post(`/forum/questions/${id}/vote`, { vote });
    return response.data;
  },

  createAnswer: async (answerData) => {
    const response = await api.post('/forum/answers', answerData);
    return response.data;
  },

  acceptAnswer: async (id) => {
    const response = await api.post(`/forum/answers/${id}/accept`);
    return response.data;
  },

  voteAnswer: async (id, vote) => {
    const response = await api.post(`/forum/answers/${id}/vote`, { vote });
    return response.data;
  },

  rateAnswer: async (id, rating) => {
    const response = await api.post(`/forum/answers/${id}/rate`, { rating });
    return response.data;
  }
};
