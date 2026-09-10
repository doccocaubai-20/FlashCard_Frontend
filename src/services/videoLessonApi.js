import api from './api';
import videoLessonsData from '../data/videoLessonsData';

const CUSTOM_VIDEOS_STORAGE_KEY = 'chongzi_custom_video_lessons';

function getLocalCustomVideos() {
  try {
    const raw = localStorage.getItem(CUSTOM_VIDEOS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalCustomVideo(video) {
  try {
    const list = getLocalCustomVideos();
    const existingIndex = list.findIndex(
      (v) => v.id === video.id || v.youtubeId === video.youtubeId
    );
    if (existingIndex >= 0) {
      list[existingIndex] = video;
    } else {
      list.unshift(video);
    }
    localStorage.setItem(CUSTOM_VIDEOS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save custom video locally:', e);
  }
}

export const videoLessonApi = {
  // 1. Lấy danh sách metadata của tất cả bài học video
  async getVideoLessons() {
    let apiVideos = [];
    try {
      const res = await api.get('/api/video-lessons');
      if (Array.isArray(res.data) && res.data.length > 0) {
        apiVideos = res.data;
      }
    } catch (err) {
      console.warn('Lấy bài học từ backend không khả dụng, dùng dữ liệu dự phòng:', err.message);
    }

    // Kết hợp: nếu backend trả về danh sách thì dùng, ngược lại dùng tĩnh
    const baseVideos =
      apiVideos.length > 0
        ? apiVideos
        : videoLessonsData.map((v) => ({
            id: v.id || v.youtubeId,
            youtubeId: v.youtubeId,
            title: v.title,
            titleHanzi: v.titleHanzi || null,
            level: v.level != null ? Number(v.level) : null,
            topic: v.topic || 'Khác',
            channel: v.channel || 'YouTube',
            durationSec: v.durationSec,
            thumbnailUrl: v.thumbnailUrl,
            totalSentences: v.totalSentences || (v.segments ? v.segments.length : 0),
            isSystem: true,
            isCommunity: false,
            contributorName: 'Hệ thống',
            createdAt: null,
          }));

    // Gộp thêm các video cục bộ người dùng vừa thêm trên máy
    const localVideos = getLocalCustomVideos();
    const combined = [...baseVideos];
    for (const lv of localVideos) {
      const exists = combined.some(
        (b) => b.id === lv.id || b.youtubeId === lv.youtubeId
      );
      if (!exists) {
        combined.unshift({
          id: lv.id || lv.youtubeId,
          youtubeId: lv.youtubeId,
          title: lv.title,
          titleHanzi: lv.titleHanzi || null,
          level: lv.level != null ? Number(lv.level) : null,
          topic: lv.topic || 'Cộng đồng',
          channel: lv.channel || 'YouTube',
          durationSec: lv.durationSec,
          thumbnailUrl: lv.thumbnailUrl,
          totalSentences: lv.totalSentences || (lv.segments ? lv.segments.length : 0),
          isSystem: false,
          isCommunity: true,
          contributorName: lv.contributorName || 'Bạn đóng góp',
          createdAt: lv.createdAt || new Date().toISOString(),
        });
      }
    }

    return combined;
  },

  // 2. Lấy chi tiết 1 bài học theo ID (kèm toàn bộ mảng câu phụ đề segments)
  async getVideoLessonById(id) {
    const cleanId = String(id).trim();

    // Thử gọi API backend trước
    try {
      const res = await api.get(`/api/video-lessons/${encodeURIComponent(cleanId)}`);
      if (res.data && res.data.segments) {
        return res.data;
      }
    } catch (err) {
      // Backend không có hoặc lỗi mạng, tìm ở cache local / file tĩnh
    }

    // Tìm trong localStorage
    const localVideos = getLocalCustomVideos();
    const foundLocal = localVideos.find(
      (v) => v.id === cleanId || v.youtubeId === cleanId
    );
    if (foundLocal && foundLocal.segments) {
      return foundLocal;
    }

    // Tìm trong file tĩnh videoLessonsData
    const foundStatic = videoLessonsData.find(
      (v) => v.id === cleanId || v.youtubeId === cleanId
    );
    if (foundStatic) {
      return foundStatic;
    }

    return null;
  },

  // 3. Đóng góp bài học video mới từ JSON
  async contributeVideoLesson(payload) {
    const normalizedId =
      payload.id || `c-${payload.youtubeId}-${Date.now()}`;
    const lessonToSave = {
      ...payload,
      id: normalizedId,
      isCommunity: true,
      isSystem: false,
      contributorName: payload.contributorName || 'Người dùng đóng góp',
      createdAt: new Date().toISOString(),
    };

    // 1. Lưu dự phòng tức thời vào localStorage
    saveLocalCustomVideo(lessonToSave);

    // 2. Gửi lên backend
    try {
      const res = await api.post('/api/video-lessons', lessonToSave);
      if (res.data) {
        saveLocalCustomVideo(res.data);
        return res.data;
      }
    } catch (err) {
      console.warn('Không thể đồng bộ lên backend, đã lưu tạm trên trình duyệt:', err.message);
    }

    return lessonToSave;
  },

  // 4. Xóa bài học đã đóng góp
  async deleteVideoLesson(id) {
    const cleanId = String(id).trim();
    try {
      const list = getLocalCustomVideos().filter(
        (v) => v.id !== cleanId && v.youtubeId !== cleanId
      );
      localStorage.setItem(CUSTOM_VIDEOS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}

    try {
      await api.delete(`/api/video-lessons/${encodeURIComponent(cleanId)}`);
    } catch (e) {}

    return { success: true };
  },
};

export default videoLessonApi;
