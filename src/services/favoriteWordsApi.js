import api from './api';

export const favoriteWordsApi = {
  getFavorites: () => api.get('/api/favorite-words'),
  addFavorite: (data) => api.post('/api/favorite-words', data),
  deleteFavorite: (id) => api.delete(`/api/favorite-words/${id}`),
  deleteFavoriteByHanzi: (hanzi) => api.delete(`/api/favorite-words/hanzi/${encodeURIComponent(hanzi)}`),
};
