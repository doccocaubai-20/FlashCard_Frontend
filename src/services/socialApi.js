import api from './api';

export const socialApi = {
  // Get leaderboard
  getLeaderboard: () => api.get('/social/leaderboard'),

  // Share a deck - returns { shareCode, title }
  shareDeck: (deckId) => api.post(`/social/decks/${deckId}/share`),

  // Import a deck by share code
  importDeck: (shareCode) => api.post(`/social/decks/import/${shareCode}`),

  // Browse public decks
  getPublicDecks: (page = 1, limit = 20) =>
    api.get(`/social/decks/public?page=${page}&limit=${limit}`),
};
