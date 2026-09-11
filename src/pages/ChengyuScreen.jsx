import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Volume2, 
  Star, 
  ArrowRight, 
  Sparkles, 
  Filter, 
  X, 
  Copy, 
  Check, 
  Share2, 
  Compass, 
  Library, 
  Scroll, 
  Quote, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  BookMarked,
  Info
} from 'lucide-react';
import { chengyuApi } from '../services/chengyuApi';
import { favoriteWordsApi } from '../services/favoriteWordsApi';
import { useToast } from '../context/ToastContext';
import { speakChinese } from '../utils/tts';

const CATEGORIES = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'Ngụ ngôn & Triết lý', label: 'Ngụ ngôn & Triết lý' },
  { id: 'Chiến lược & Binh pháp', label: 'Chiến lược & Binh pháp' },
  { id: 'Lịch sử & Điển cố', label: 'Lịch sử & Điển cố' },
  { id: 'Ý chí & Nghị lực', label: 'Ý chí & Nghị lực' },
  { id: 'Đối nhân xử thế', label: 'Đối nhân xử thế' },
  { id: 'Tình cảm & Nghĩa khí', label: 'Tình cảm & Nghĩa khí' },
];

const LEVELS = [
  { id: 'ALL', label: 'Tất cả cấp độ' },
  { id: 'HSK 5', label: 'HSK 5' },
  { id: 'HSK 6', label: 'HSK 6' },
  { id: 'HSK 7-9', label: 'HSK 7-9' },
];

export default function ChengyuScreen() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Data states
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Reader Modal states
  const [selectedIdiom, setSelectedIdiom] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [showPinyinInStory, setShowPinyinInStory] = useState(true);
  const [storyFontSize, setStoryFontSize] = useState('text-base'); // text-sm, text-base, text-lg
  const [copied, setCopied] = useState(false);
  const [starredMap, setStarredMap] = useState({});

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load summary once
  useEffect(() => {
    async function loadSummary() {
      try {
        const res = await chengyuApi.getSummary();
        setSummary(res.data);
      } catch (err) {
        console.error('Failed to load chengyu summary:', err);
      }
    }
    loadSummary();
  }, []);

  // Load idioms list on filter/page change
  useEffect(() => {
    async function fetchList() {
      setLoading(true);
      try {
        const res = await chengyuApi.getList({
          category: selectedCategory,
          level: selectedLevel,
          search: debouncedQuery,
          page: currentPage,
          limit: 12,
        });
        setItems(res.data.items || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      } catch (err) {
        console.error('Failed to load chengyu list:', err);
        showToast('Không thể tải dữ liệu thành ngữ.', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchList();
  }, [selectedCategory, selectedLevel, debouncedQuery, currentPage]);

  // Load user starred favorites to highlight star icon
  useEffect(() => {
    async function loadStarred() {
      try {
        const res = await favoriteWordsApi.getFavorites();
        const map = {};
        (res.data || []).forEach((w) => {
          map[w.hanzi] = w.id;
        });
        setStarredMap(map);
      } catch (e) {
        // ignore
      }
    }
    loadStarred();
  }, []);

  // Toggle favorite / starred
  const handleToggleFavorite = async (e, item) => {
    e.stopPropagation();
    const isStarred = !!starredMap[item.chengyu];

    try {
      if (isStarred) {
        await favoriteWordsApi.deleteFavoriteByHanzi(item.chengyu);
        setStarredMap((prev) => {
          const next = { ...prev };
          delete next[item.chengyu];
          return next;
        });
        showToast(`Đã bỏ lưu "${item.chengyu}"`, 'info');
      } else {
        await favoriteWordsApi.addFavorite({
          hanzi: item.chengyu,
          pinyin: item.pinyin,
          meaning: `${item.sinoVietnamese} - ${item.figurativeMeaning}`,
          hskLevel: item.hskLevel || 'HSK 5',
        });
        setStarredMap((prev) => ({ ...prev, [item.chengyu]: true }));
        showToast(`Đã lưu "${item.chengyu}" vào Sổ tay từ vựng!`, 'success');
      }
    } catch (err) {
      showToast('Thao tác không thành công, vui lòng thử lại.', 'error');
    }
  };

  // Open detail modal
  const handleOpenDetail = async (idOrChengyu) => {
    setModalLoading(true);
    try {
      const res = await chengyuApi.getDetail(idOrChengyu);
      setSelectedIdiom(res.data);
    } catch (err) {
      showToast('Không thể tải chi tiết điển tích.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  // Copy story text
  const handleCopyStory = (item) => {
    if (!item) return;
    const text = `【${item.chengyu}】(${item.pinyin} - ${item.sinoVietnamese})
• Nghĩa: ${item.figurativeMeaning}
• Xuất xứ: ${item.origin?.source} (${item.origin?.period})
${item.origin?.classicQuote ? `• Nguyên tác: "${item.origin.classicQuote}"\n` : ''}
【ĐIỂN TÍCH LỊCH SỬ】
${item.historicalStory?.content}

【BÀI HỌC NHÂN SINH】
${item.moralLesson}

(Nguồn: ChongZi - Nền tảng học tiếng Trung toàn diện)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Đã sao chép câu chuyện điển tích!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Category badge colors
  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Ngụ ngôn & Triết lý':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
      case 'Chiến lược & Binh pháp':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      case 'Lịch sử & Điển cố':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
      case 'Ý chí & Nghị lực':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
      case 'Đối nhân xử thế':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20';
      case 'Tình cảm & Nghĩa khí':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-stone-500/10 text-stone-700 dark:text-stone-300 border-stone-500/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-900 via-stone-900 to-stone-950 text-white p-6 sm:p-10 shadow-xl border border-amber-500/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-60 h-60 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-medium">
              <Scroll size={15} />
              <span>Thư tịch cổ & Điển tích văn hóa</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold font-chinese tracking-tight text-white flex items-center gap-3">
              <span>Kho Điển Tích Thành Ngữ</span>
              <span className="text-amber-400 text-xl sm:text-2xl font-light">成语故事</span>
            </h1>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
              Học và thấu hiểu hơn 120 câu thành ngữ 4 chữ kinh điển trong đề thi HSK 5, HSK 6 và HSK 7-9 qua các câu chuyện lịch sử thời Xuân Thu, Chiến Quốc, Hán Sở và ngụ ngôn Trang Tử.
            </p>
          </div>

          {/* Featured Idiom of the Day Card */}
          {summary?.featuredToday && (
            <div className="w-full lg:w-96 shrink-0 bg-white/10 dark:bg-black/30 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-4 hover:border-amber-400/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Sparkles size={14} /> Thành ngữ hôm nay
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
                  {summary.featuredToday.hskLevel}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-chinese text-3xl font-bold text-amber-300 tracking-wider">
                    {summary.featuredToday.chengyu}
                  </span>
                  <button
                    onClick={() => speakChinese(summary.featuredToday.chengyu, 'zh-CN')}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
                    title="Nghe phát âm"
                  >
                    <Volume2 size={18} />
                  </button>
                </div>
                <p className="text-xs text-stone-300">
                  <span className="font-medium text-amber-200">{summary.featuredToday.pinyin}</span> • <span className="font-mono">{summary.featuredToday.sinoVietnamese}</span>
                </p>
              </div>

              <p className="text-xs text-stone-200 line-clamp-2 leading-relaxed italic">
                "{summary.featuredToday.figurativeMeaning}"
              </p>

              <button
                onClick={() => handleOpenDetail(summary.featuredToday.id)}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <span>Khám phá điển tích</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-mute" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo chữ Hán (井底之蛙), Pinyin (jing di zhi wa), Hán-Việt (Tỉnh để chi oa) hoặc nghĩa tiếng Việt..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white dark:bg-surface-dark border border-hairline dark:border-divider-dark text-sm text-ink dark:text-on-dark placeholder-mute focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-mute hover:text-ink dark:hover:text-on-dark p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Level Filter Dropdown / Pill */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {LEVELS.map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => {
                  setSelectedLevel(lvl.id);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
                  selectedLevel === lvl.id
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-white dark:bg-surface-dark text-mute hover:text-ink dark:hover:text-on-dark border-hairline dark:border-divider-dark'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Tab Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-medium shrink-0 transition-all border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-ink dark:bg-on-dark text-white dark:text-surface-dark border-ink dark:border-on-dark font-semibold shadow-xs'
                    : 'bg-white dark:bg-surface-dark text-mute hover:text-ink dark:hover:text-on-dark border-hairline dark:border-divider-dark'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. TOTAL COUNT & ACTIVE FILTERS */}
      <div className="flex items-center justify-between text-xs text-mute px-1">
        <span>
          Tìm thấy <strong className="text-ink dark:text-on-dark font-semibold">{total}</strong> câu thành ngữ
        </span>
        {(selectedCategory !== 'ALL' || selectedLevel !== 'ALL' || searchQuery) && (
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setSelectedLevel('ALL');
              setSearchQuery('');
            }}
            className="text-primary hover:underline font-medium"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* 4. CHENGYU CARDS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-56 rounded-2xl bg-stone-100 dark:bg-stone-900/50 animate-pulse border border-hairline dark:border-divider-dark"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 space-y-3 bg-white dark:bg-surface-dark rounded-3xl border border-hairline dark:border-divider-dark p-8">
          <BookOpen className="mx-auto text-mute" size={40} />
          <h3 className="font-bold text-base text-ink dark:text-on-dark">Không tìm thấy thành ngữ phù hợp</h3>
          <p className="text-xs text-mute max-w-md mx-auto">
            Hãy thử tìm bằng từ khóa khác hoặc điều chỉnh lại bộ lọc cấp độ / chủ đề.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const isStarred = !!starredMap[item.chengyu];

            return (
              <div
                key={item.id}
                onClick={() => handleOpenDetail(item.id)}
                className="group relative bg-white dark:bg-surface-dark rounded-2xl border border-hairline dark:border-divider-dark p-5 shadow-xs hover:shadow-md hover:border-amber-400/50 dark:hover:border-amber-400/30 transition-all flex flex-col justify-between cursor-pointer space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar: Category & Star */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md border ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-mute">
                        {item.hskLevel}
                      </span>
                      <button
                        onClick={(e) => handleToggleFavorite(e, item)}
                        className={`p-1.5 rounded-lg transition-all ${
                          isStarred
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                            : 'text-mute hover:text-amber-500 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                        title={isStarred ? 'Bỏ lưu' : 'Lưu vào sổ tay'}
                      >
                        <Star size={16} className={isStarred ? 'fill-amber-500' : ''} />
                      </button>
                    </div>
                  </div>

                  {/* Main Characters & Pinyin */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-chinese text-2xl sm:text-3xl font-bold tracking-wider text-ink dark:text-on-dark group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {item.chengyu}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakChinese(item.chengyu, 'zh-CN');
                        }}
                        className="p-2 rounded-xl text-mute hover:text-primary hover:bg-primary/10 transition-all active:scale-95"
                        title="Nghe phát âm"
                      >
                        <Volume2 size={18} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-primary font-medium">{item.pinyin}</span>
                      <span className="text-mute">•</span>
                      <span className="font-mono text-mute">{item.sinoVietnamese}</span>
                    </div>
                  </div>

                  {/* Figurative Meaning */}
                  <p className="text-xs text-ink/80 dark:text-on-dark/80 line-clamp-2 leading-relaxed">
                    {item.figurativeMeaning}
                  </p>
                </div>

                {/* Bottom: Origin & Action */}
                <div className="pt-3 border-t border-hairline/60 dark:border-divider-dark/60 flex items-center justify-between text-xs">
                  <span className="text-mute truncate max-w-[170px]" title={item.origin?.source}>
                    {item.origin?.source || 'Điển cố cổ đại'}
                  </span>
                  <span className="text-primary font-bold inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Đọc tích</span>
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl border border-hairline dark:border-divider-dark text-mute hover:text-ink dark:hover:text-on-dark disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          {Array.from({ length: totalPages }).map((_, idx) => {
            const p = idx + 1;
            return (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-9 h-9 rounded-xl text-xs font-semibold transition-all ${
                  currentPage === p
                    ? 'bg-primary text-white shadow-xs'
                    : 'border border-hairline dark:border-divider-dark text-mute hover:text-ink dark:hover:text-on-dark'
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl border border-hairline dark:border-divider-dark text-mute hover:text-ink dark:hover:text-on-dark disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* 6. MODAL ĐỌC TRUYỆN ĐIỂN TÍCH (STORY READER MODAL) */}
      {selectedIdiom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-surface-dark rounded-3xl shadow-2xl border border-hairline dark:border-divider-dark flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-hairline dark:border-divider-dark flex items-start justify-between gap-4 bg-stone-50/50 dark:bg-stone-900/30">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md border ${getCategoryColor(selectedIdiom.category)}`}>
                    {selectedIdiom.category}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 text-mute">
                    {selectedIdiom.hskLevel}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <h2 className="font-chinese text-3xl sm:text-4xl font-bold tracking-wider text-ink dark:text-on-dark">
                    {selectedIdiom.chengyu}
                  </h2>
                  <button
                    onClick={() => speakChinese(selectedIdiom.chengyu, 'zh-CN')}
                    className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all active:scale-95"
                    title="Nghe phát âm thành ngữ"
                  >
                    <Volume2 size={20} />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-primary font-medium">{selectedIdiom.pinyin}</span>
                  <span className="text-mute">•</span>
                  <span className="font-mono text-mute font-medium">{selectedIdiom.sinoVietnamese}</span>
                </div>
              </div>

              {/* Action Buttons: Copy, Star, Close */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyStory(selectedIdiom)}
                  className="p-2 rounded-xl border border-hairline dark:border-divider-dark text-mute hover:text-ink dark:hover:text-on-dark hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
                  title="Sao chép nội dung"
                >
                  {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                </button>
                <button
                  onClick={(e) => handleToggleFavorite(e, selectedIdiom)}
                  className={`p-2 rounded-xl border border-hairline dark:border-divider-dark transition-all ${
                    starredMap[selectedIdiom.chengyu]
                      ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-500/30'
                      : 'text-mute hover:text-amber-500 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                  title="Lưu vào Sổ tay"
                >
                  <Star size={18} className={starredMap[selectedIdiom.chengyu] ? 'fill-amber-500' : ''} />
                </button>
                <button
                  onClick={() => setSelectedIdiom(null)}
                  className="p-2 rounded-xl border border-hairline dark:border-divider-dark text-mute hover:text-ink dark:hover:text-on-dark hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body Scroll */}
            <div className="p-5 sm:p-7 overflow-y-auto space-y-6 select-text">
              {/* Meaning Box */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-ink dark:text-on-dark space-y-1.5">
                <div>
                  <strong className="text-amber-700 dark:text-amber-400">Nghĩa đen: </strong>
                  <span>{selectedIdiom.literalMeaning}</span>
                </div>
                <div>
                  <strong className="text-amber-700 dark:text-amber-400">Nghĩa bóng / Ứng dụng: </strong>
                  <span>{selectedIdiom.figurativeMeaning}</span>
                </div>
              </div>

              {/* Origin & Historical Source */}
              {selectedIdiom.origin && (
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/40 border border-hairline dark:border-divider-dark space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 font-bold text-ink dark:text-on-dark">
                    <Scroll size={16} className="text-primary" />
                    <span>Xuất xứ thư tịch:</span>
                    <span className="text-primary">{selectedIdiom.origin.source}</span>
                    {selectedIdiom.origin.period && (
                      <span className="text-mute font-normal">({selectedIdiom.origin.period})</span>
                    )}
                  </div>
                  {selectedIdiom.origin.classicQuote && (
                    <div className="p-3 rounded-xl bg-white dark:bg-surface-dark border border-hairline dark:border-divider-dark font-chinese text-sm sm:text-base text-ink dark:text-on-dark italic leading-relaxed">
                      "{selectedIdiom.origin.classicQuote}"
                    </div>
                  )}
                </div>
              )}

              {/* Historical Story Content */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm sm:text-base text-ink dark:text-on-dark flex items-center gap-2">
                    <BookOpen size={18} className="text-primary" />
                    <span>Câu chuyện Điển tích lịch sử</span>
                  </h4>
                  {/* Font size control */}
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      onClick={() => setStoryFontSize('text-sm')}
                      className={`px-2 py-1 rounded-md border ${storyFontSize === 'text-sm' ? 'bg-primary text-white border-primary' : 'border-hairline text-mute'}`}
                    >
                      A-
                    </button>
                    <button
                      onClick={() => setStoryFontSize('text-base')}
                      className={`px-2 py-1 rounded-md border ${storyFontSize === 'text-base' ? 'bg-primary text-white border-primary' : 'border-hairline text-mute'}`}
                    >
                      A
                    </button>
                    <button
                      onClick={() => setStoryFontSize('text-lg')}
                      className={`px-2 py-1 rounded-md border ${storyFontSize === 'text-lg' ? 'bg-primary text-white border-primary' : 'border-hairline text-mute'}`}
                    >
                      A+
                    </button>
                  </div>
                </div>

                {selectedIdiom.historicalStory?.summary && (
                  <p className="text-xs sm:text-sm text-mute italic bg-stone-50 dark:bg-stone-900/30 p-3 rounded-xl border border-hairline dark:border-divider-dark">
                    <strong>Tóm tắt: </strong>{selectedIdiom.historicalStory.summary}
                  </p>
                )}

                <div className={`${storyFontSize} leading-relaxed text-ink/90 dark:text-on-dark/90 whitespace-pre-line space-y-3 font-normal`}>
                  {selectedIdiom.historicalStory?.content}
                </div>
              </div>

              {/* Moral Lesson Quote */}
              {selectedIdiom.moralLesson && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-emerald-700 dark:text-emerald-400">
                    <Quote size={16} />
                    <span>Bài học nhân sinh rút ra</span>
                  </div>
                  <p className="text-xs sm:text-sm text-ink/90 dark:text-on-dark/90 leading-relaxed italic">
                    {selectedIdiom.moralLesson}
                  </p>
                </div>
              )}

              {/* Modern Usage & Examples */}
              {selectedIdiom.modernUsage && (
                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-sm sm:text-base text-ink dark:text-on-dark flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-500" />
                    <span>Cách dùng & Ví dụ trong đời sống</span>
                  </h4>

                  {selectedIdiom.modernUsage.guideline && (
                    <p className="text-xs sm:text-sm text-mute leading-relaxed">
                      {selectedIdiom.modernUsage.guideline}
                    </p>
                  )}

                  <div className="space-y-2.5">
                    {(selectedIdiom.modernUsage.examples || []).map((ex, exIdx) => (
                      <div
                        key={exIdx}
                        className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/40 border border-hairline dark:border-divider-dark space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-chinese text-sm sm:text-base font-semibold text-ink dark:text-on-dark">
                            {ex.hanzi}
                          </p>
                          <button
                            onClick={() => speakChinese(ex.hanzi, 'zh-CN')}
                            className="p-1.5 rounded-lg text-mute hover:text-primary hover:bg-primary/10 transition-all shrink-0"
                            title="Nghe ví dụ"
                          >
                            <Volume2 size={16} />
                          </button>
                        </div>
                        <p className="text-xs text-primary font-medium">{ex.pinyin}</p>
                        <p className="text-xs text-mute">{ex.vietnamese}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Synonyms & Antonyms */}
              <div className="flex flex-wrap gap-4 pt-2 border-t border-hairline dark:border-divider-dark text-xs">
                {selectedIdiom.synonyms?.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-mute">Đồng nghĩa:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedIdiom.synonyms.map((s, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleOpenDetail(s)}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-ink dark:text-on-dark font-chinese hover:bg-amber-100 dark:hover:bg-amber-950/50 hover:text-amber-700 transition-all"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedIdiom.antonyms?.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-mute">Trái nghĩa:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedIdiom.antonyms.map((a, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => handleOpenDetail(a)}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-ink dark:text-on-dark font-chinese hover:bg-red-100 dark:hover:bg-red-950/50 hover:text-red-700 transition-all"
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-hairline dark:border-divider-dark bg-stone-50/50 dark:bg-stone-900/30 flex items-center justify-between text-xs">
              <span className="text-mute">
                Nhấn <kbd className="px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-800 font-mono text-[10px]">ESC</kbd> để đóng
              </span>
              <button
                onClick={() => setSelectedIdiom(null)}
                className="px-5 py-2 rounded-xl bg-ink dark:bg-on-dark text-white dark:text-surface-dark font-bold hover:opacity-90 transition-opacity"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
