import api from './api';

export const hskExamApi = {
  getExams: () => api.get('/api/hsk-exams'),
  getResults: () => api.get('/api/hsk-exams/results'),
  submitResult: (data) => api.post('/api/hsk-exams/submit', data)
};
