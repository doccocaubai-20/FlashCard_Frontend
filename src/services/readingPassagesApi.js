import api from './api';

export const readingPassagesApi = {
  // Lấy tổng quan các cấp độ và số lượng bài đọc
  getSummary: () => api.get('/api/reading-passages/summary'),

  // Lấy danh sách bài đọc theo cấp độ (HSK 1-6) và chủ đề tùy chọn
  getPassagesByLevel: (level, topicId) =>
    api.get(`/api/reading-passages/level/${level}`, {
      params: topicId ? { topicId } : undefined,
    }),

  // Lấy chi tiết toàn bộ bài đọc (văn bản, Pinyin, dịch, từ vựng, trắc nghiệm)
  getPassageById: (id) => api.get(`/api/reading-passages/${id}`),

  // Lưu tiến độ đọc & làm quiz (có bảo vệ chống hack XP ở Backend)
  saveProgress: (data) => api.post('/api/reading-passages/progress', data),

  // Lấy danh sách tiến độ đọc của người dùng hiện tại
  getUserProgress: (hskLevel) =>
    api.get('/api/reading-passages/user-progress', {
      params: hskLevel ? { hskLevel } : undefined,
    }),
};
