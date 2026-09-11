import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Search,
  Clock,
  Sparkles,
  Video as VideoIcon,
  Tv,
  Plus,
  Users,
  UploadCloud,
  Layers
} from 'lucide-react';
import videoLessonsData from '../data/videoLessonsData';
import videoLessonApi from '../services/videoLessonApi';
import ContributeVideoModal from '../components/video/ContributeVideoModal';
import Pagination from '../components/common/Pagination';

const HSK_COLORS = {
  1: { badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400', bar: 'bg-emerald-500' },
  2: { badge: 'bg-sky-500/10 text-sky-600 border-sky-500/30 dark:text-sky-400', bar: 'bg-sky-500' },
  3: { badge: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400', bar: 'bg-amber-500' },
  4: { badge: 'bg-orange-500/10 text-orange-600 border-orange-500/30 dark:text-orange-400', bar: 'bg-orange-500' },
  5: { badge: 'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400', bar: 'bg-rose-500' },
  6: { badge: 'bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400', bar: 'bg-purple-500' },
};

export default function VideoListScreen() {
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState('ALL'); // 'ALL' | 'COMMUNITY' | 1..6
  const [searchQuery, setSearchQuery] = useState('');
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);

  // Initialize with static data for instantaneous render, then sync from API/local cache
  const [videos, setVideos] = useState(videoLessonsData);
  const [isLoading, setIsLoading] = useState(false);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const data = await videoLessonApi.getVideoLessons();
      if (Array.isArray(data) && data.length > 0) {
        setVideos(data);
      }
    } catch (e) {
      console.warn('Could not fetch latest video lessons:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Lọc theo HSK, Cộng đồng và từ khóa tìm kiếm
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      let matchLevel = true;
      if (selectedLevel === 'COMMUNITY') {
        matchLevel = !!v.isCommunity;
      } else if (selectedLevel !== 'ALL') {
        matchLevel = v.level === Number(selectedLevel);
      }

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (v.title && v.title.toLowerCase().includes(q)) ||
        (v.titleHanzi && v.titleHanzi.toLowerCase().includes(q)) ||
        (v.topic && v.topic.toLowerCase().includes(q)) ||
        (v.channel && v.channel.toLowerCase().includes(q));

      return matchLevel && matchSearch;
    });
  }, [videos, selectedLevel, searchQuery]);

  const levelCounts = useMemo(() => {
    const counts = {
      ALL: videos.length,
      COMMUNITY: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
    };
    videos.forEach((v) => {
      if (v.isCommunity) counts.COMMUNITY++;
      if (counts[v.level] !== undefined) counts[v.level]++;
    });
    return counts;
  }, [videos]);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Tự động quay về trang 1 khi đổi bộ lọc hoặc tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLevel, searchQuery]);

  const paginatedVideos = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredVideos.slice(startIndex, startIndex + pageSize);
  }, [filteredVideos, currentPage, pageSize]);

  const handleVideoCreated = (newVideo) => {
    fetchVideos();
    if (newVideo && (newVideo.id || newVideo.youtubeId)) {
      navigate(`/video/${newVideo.id || newVideo.youtubeId}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Banner Giới thiệu & Nút Đóng góp */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/95 via-primary to-amber-600 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
              <span>Học tiếng Trung qua Video YouTube</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Xem hoạt hình & podcast có phụ đề đồng bộ
            </h1>
            <p className="text-white/80 text-xs sm:text-sm max-w-xl leading-relaxed">
              Luyện nghe, shadowing theo giọng chuẩn bản xứ, tra từ điển một chạm và đóng góp video học từ tệp JSON.
            </p>
          </div>

          {/* Action Button: Đóng góp video */}
          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={() => setIsContributeModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-primary hover:bg-white/90 text-xs sm:text-sm font-extrabold shadow-lg shadow-black/10 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <UploadCloud size={18} />
              <span>Đóng góp Video (JSON)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Thanh Bộ lọc & Tìm kiếm */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-surface-dark p-3 rounded-2xl border border-hairline dark:border-divider-dark shadow-sm">
        {/* HSK & Community Level Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            onClick={() => setSelectedLevel('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedLevel === 'ALL'
                ? 'bg-primary text-white shadow-sm shadow-primary/30'
                : 'text-sub dark:text-on-dark-mute hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            Tất cả ({levelCounts.ALL})
          </button>

          {levelCounts.COMMUNITY > 0 && (
            <button
              onClick={() => setSelectedLevel('COMMUNITY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedLevel === 'COMMUNITY'
                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                  : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
              }`}
            >
              <Users size={13} />
              Cộng đồng ({levelCounts.COMMUNITY})
            </button>
          )}

          {[1, 2, 3, 4, 5, 6].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedLevel === lvl
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'text-sub dark:text-on-dark-mute hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              HSK {lvl} ({levelCounts[lvl] || 0})
            </button>
          ))}
        </div>

        {/* Ô Tìm kiếm */}
        <div className="relative sm:w-72">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute"
          />
          <input
            type="text"
            placeholder="Tìm theo chủ đề, tiêu đề, kênh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs font-medium rounded-xl border border-hairline dark:border-divider-dark bg-surface-bone/50 dark:bg-surface-deep/60 text-ink dark:text-on-dark placeholder:text-mute focus:outline-none focus:border-primary transition"
          />
        </div>
      </div>

      {/* Danh sách Thẻ Video */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-surface-dark rounded-3xl border border-hairline dark:border-divider-dark space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <VideoIcon size={28} />
          </div>
          <h3 className="text-base font-bold text-ink dark:text-on-dark">
            Không tìm thấy video nào
          </h3>
          <p className="text-xs text-mute max-w-sm mx-auto">
            Hãy thử thay đổi cấp độ HSK hoặc bấm nút &quot;Đóng góp Video&quot; để thêm bài học mới từ tệp JSON của bạn.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setIsContributeModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:bg-primary-deep transition cursor-pointer"
            >
              + Đóng góp Video đầu tiên
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedVideos.map((video) => {
            const colors = HSK_COLORS[video.level] || HSK_COLORS[1];
            const minutes = Math.round(video.durationSec / 60) || 3;

            return (
              <div
                key={video.id}
                onClick={() => navigate(`/video/${video.id}`)}
                className="group flex flex-col bg-white dark:bg-surface-dark rounded-2xl overflow-hidden border border-hairline dark:border-divider-dark shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                {/* Thumbnail YouTube */}
                <div className="relative aspect-video w-full bg-black overflow-hidden">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.target.src = `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`;
                    }}
                  />
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Play Button Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:bg-primary transition-all duration-300">
                      <Play size={20} className="fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Badge HSK & Community góc trái trên */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    {video.level && (
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-md border ${colors.badge} bg-white/90 dark:bg-black/80 shadow-sm`}
                      >
                        HSK {video.level}
                      </span>
                    )}
                    {video.isCommunity && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-md border border-amber-500/40 text-amber-500 bg-amber-500/10 bg-white/90 dark:bg-black/80 shadow-sm flex items-center gap-1">
                        <Users size={10} />
                        Cộng đồng
                      </span>
                    )}
                  </div>

                  {/* Thời lượng góc phải dưới */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-white text-[11px] font-bold">
                    <Clock size={12} />
                    <span>{minutes} phút</span>
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-mute">
                      <span className="truncate max-w-[65%]">{video.topic || 'Video'}</span>
                      <span className="shrink-0 text-primary font-bold">
                        {video.totalSentences} câu
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-ink dark:text-on-dark line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {video.title}
                    </h3>

                    {video.titleHanzi && (
                      <p className="text-xs font-medium text-mute font-display truncate">
                        {video.titleHanzi}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-hairline/60 dark:border-divider-dark/60 flex items-center justify-between text-[11px] text-mute">
                    <span className="truncate">{video.channel || video.contributorName || 'YouTube'}</span>
                    <span className="inline-flex items-center gap-1 font-bold text-primary group-hover:underline">
                      Học ngay →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          </div>

          {/* Thanh phân trang */}
          <Pagination
            currentPage={currentPage}
            totalItems={filteredVideos.length}
            pageSize={pageSize}
            pageSizeOptions={[8, 12, 16, 24]}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            itemLabel="video"
          />
        </div>
      )}

      {/* Modal đóng góp Video từ JSON */}
      <ContributeVideoModal
        isOpen={isContributeModalOpen}
        onClose={() => setIsContributeModalOpen(false)}
        onCreated={handleVideoCreated}
      />
    </div>
  );
}
