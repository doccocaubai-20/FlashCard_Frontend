import api from './api';

export const statsApi = {
    getSummary: () => api.get('/api/stats/summary'),
    getHeatmap: () => api.get('/api/stats/heatmap'),
    getBadges: () => api.get('/api/stats/badges'),
    updateGoals: (data) => api.put('/api/stats/goals', data),
    addXpCoins: (xp, coins) => api.put('/api/stats/add-xp-coins', { xp, coins }),
    buyItem: (price, itemType) => api.post('/api/stats/buy-item', { price, itemType }),
    useXpBoost: () => api.post('/api/stats/use-xp-boost'),
    getQuests: (tzOffset = 420) => api.get('/api/stats/quests', { params: { tzOffset } }),
    incrementQuestProgress: (questType, amount, tzOffset = 420) => api.put('/api/stats/quests/progress', { questType, amount, tzOffset }),
    getDailyQuiz: (tzOffset = 420) => api.get('/api/stats/daily-quiz', { params: { tzOffset } }),
    getGardenState: (tzOffset = 420) => api.get('/api/stats/garden', { params: { tzOffset } }),
    harvestGarden: (tzOffset = 420) => api.post('/api/stats/garden/harvest', { tzOffset }),
};