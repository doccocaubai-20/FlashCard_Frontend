import api from './api';

export const flashcardApi = {
    getByDeck: (deckId) => api.get(`/api/decks/${deckId}/flashcards`),
    create: (data) => api.post('/api/flashcards', data),
    update: (id, data) => api.put(`/api/flashcards/${id}`, data),
    delete: (id) => api.delete(`/api/flashcards/${id}`),
    bulkImport: (data) => api.post('/api/flashcards/bulk-import', data),
};