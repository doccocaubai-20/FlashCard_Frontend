import api from './api';

export const aiFlashcardApi = {
  generate: (topic, count = 10, hskLevel = null, excludeWords = [], language = 'ZH') =>
    api.post('/api/flashcards/ai-generate', { topic, count, hskLevel, excludeWords, language }),
};
