import api from './api';

export const deckApi = {
    getDecks: () => api.get('/api/decks'),
    getDeckById: (id) => api.get(`/api/decks/${id}`),
    createDeck: (data) => api.post('/api/decks', data),
    updateDeck: (id, data) => api.put(`/api/decks/${id}`, data),
    deleteDeck: (id) => api.delete(`/api/decks/${id}`),
};