import api from './api';

export const statsApi = {
    getSummary: () => api.get('/api/stats/summary'),
    getHeatmap: () => api.get('/api/stats/heatmap'),
    getBadges: () => api.get('/api/stats/badges'),
    updateGoals: (data) => api.put('/api/stats/goals', data),
    addXpCoins: (xp, coins) => api.put('/api/stats/add-xp-coins', { xp, coins }),
    buyItem: (price) => api.post('/api/stats/buy-item', { price }),
};