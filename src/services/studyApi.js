import api from './api';

export const studyApi = {
    getToday: (deckId) => api.get(`/api/study/today${deckId ? `?deckId=${deckId}` : ''}`),
    getAllCards: () => api.get('/api/study/all-cards'),
    review: (data) => api.post('/api/study/review', data),
};