import api from './api';

export const deckApi = {
    getDecks: () => api.get('/api/decks'),
    getDeckById: (id) => api.get(`/api/decks/${id}`),
    createDeck: (data) => api.post('/api/decks', data),
    updateDeck: (id, data) => api.put(`/api/decks/${id}`, data),
    deleteDeck: (id) => api.delete(`/api/decks/${id}`),
    generateParagraph: (id, words) => api.post(`/api/decks/${id}/generate-paragraph`, { words }),
    saveParagraph: (deckId, data) => api.post(`/api/decks/${deckId}/paragraphs`, data),
    getSavedParagraphs: (deckId) => api.get(`/api/decks/${deckId}/paragraphs`),
    deleteParagraph: (deckId, paragraphId) => api.delete(`/api/decks/${deckId}/paragraphs/${paragraphId}`),
};