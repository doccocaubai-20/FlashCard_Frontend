import api from './api';

export const chengyuApi = {
  getSummary: () => api.get('/api/chengyu/summary'),
  getList: (params) => api.get('/api/chengyu/list', { params }),
  getDetail: (id) => api.get(`/api/chengyu/${id}`),
};
