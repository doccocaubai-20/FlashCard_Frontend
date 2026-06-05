import api from './api';

export const dictionaryApi = {
  search: (type, q, multiple = false) =>
    api.get(`/api/dictionary/search`, { params: { type, q, multiple } }),
  getHskWords: (level, limit) =>
    api.get(`/api/dictionary/hsk`, { params: { level, limit } }),
  getWordOfTheDay: () =>
    api.get(`/api/dictionary/wotd`),
  getSyllables: () =>
    api.get(`/api/dictionary/syllables`),
  getSyllableDetails: (syllable) =>
    api.get(`/api/dictionary/syllable-details`, { params: { syllable } }),
  getWordsByRadical: (char) =>
    api.get(`/api/dictionary/radical`, { params: { char } }),
};
