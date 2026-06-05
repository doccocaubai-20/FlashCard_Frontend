import api from './api';

export const aiFlashcardApi = {
  generate: (topic, count = 10, hskLevel = null) =>
    api.post('/flashcards/ai-generate', { topic, count, hskLevel }),
};
