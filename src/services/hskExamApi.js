import api from './api';

export const hskExamApi = {
  // 1. Get 6 levels with counts
  getLevels: async () => {
    try {
      const res = await api.get('/api/hsk-exams/levels');
      return res.data;
    } catch (e) {
      console.warn('API getLevels failed, using fallback:', e);
      return [
        { level: 1, count: 9 },
        { level: 2, count: 7 },
        { level: 3, count: 16 },
        { level: 4, count: 6 },
        { level: 5, count: 19 },
        { level: 6, count: 20 },
      ];
    }
  },

  // 2. Get tests by level (1 to 6)
  getExamsByLevel: async (level) => {
    try {
      const res = await api.get(`/api/hsk-exams/levels/${level}`);
      return res.data;
    } catch (e) {
      console.warn(`API getExamsByLevel(${level}) failed:`, e);
      // Direct fallback to API if backend offline
      try {
        const fallbackRes = await fetch(`https://api.xiehanzi.com/api/v1/hsk-tests/levels/${level}`);
        const data = await fallbackRes.json();
        return data.items || [];
      } catch (err) {
        return [];
      }
    }
  },

  // 3. Get full details of an exam
  getExamDetail: async (testId) => {
    try {
      const res = await api.get(`/api/hsk-exams/detail/${testId}`);
      return res.data;
    } catch (e) {
      console.warn(`API getExamDetail(${testId}) failed, trying fallback:`, e);
      // Fallback
      const match = testId.match(/hsk(\d)/i);
      const level = match ? parseInt(match[1], 10) : 1;
      const res = await fetch(`https://api.xiehanzi.com/api/v1/hsk-tests/levels/${level}/${testId}`);
      return await res.json();
    }
  },

  // 4. Grade user exam answers
  gradeExam: async (testId, answers) => {
    try {
      const res = await api.post(`/api/hsk-exams/${testId}/grade`, { answers });
      return res.data;
    } catch (e) {
      console.warn(`API gradeExam(${testId}) failed, trying direct grading:`, e);
      const res = await fetch(`https://api.xiehanzi.com/api/v1/hsk-tests/${testId}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      return await res.json();
    }
  },

  // 5. Submit result and save to DB
  submitResult: (data) => api.post('/api/hsk-exams/submit', data),

  // 6. Get user's exam results history
  getResults: () => api.get('/api/hsk-exams/results'),

  // Backward compatibility
  getExams: () => api.get('/api/hsk-exams'),
};
