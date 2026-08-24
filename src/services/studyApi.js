import api from './api';

export const studyApi = {
    getToday: (deckId, extra) => {
        const params = [];
        if (deckId) params.push(`deckId=${deckId}`);
        if (extra) params.push(`extra=${extra}`);
        const query = params.length > 0 ? `?${params.join('&')}` : '';
        return api.get(`/api/study/today${query}`);
    },
    getAllCards: (deckId, limit, offset) =>
        api.get('/api/study/all-cards', { params: { deckId, limit, offset } }),
    review: (data) => api.post('/api/study/review', data),
};