import api from './api';

export const studyApi = {
    getToday: () => api.get('/api/study/today'),
    review: (data) => api.post('/api/study/review', data),
};