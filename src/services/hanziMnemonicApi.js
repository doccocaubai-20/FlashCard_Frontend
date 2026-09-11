import api from './api';

export const hanziMnemonicApi = {
  getSummary: () => api.get('/api/hanzi-mnemonics/summary'),
  getList: (params) => api.get('/api/hanzi-mnemonics/list', { params }),
  getByChar: (char) => api.get(`/api/hanzi-mnemonics/${encodeURIComponent(char)}`),
};
