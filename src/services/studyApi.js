import api from './api';

export const studyApi = {
    getToday: (deckId, extra, topicId) => {
        const params = [];
        if (deckId) params.push(`deckId=${deckId}`);
        if (extra) params.push(`extra=${extra}`);
        if (topicId) params.push(`topicId=${topicId}`);
        const query = params.length > 0 ? `?${params.join('&')}` : '';
        return api.get(`/api/study/today${query}`);
    },
    getAllCards: (deckId, limit, offset, topicId) =>
        api.get('/api/study/all-cards', { params: { deckId, limit, offset, topicId } }),
    review: (data) => api.post('/api/study/review', data),
};