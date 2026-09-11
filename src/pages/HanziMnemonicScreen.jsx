import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Volume2, 
  Star, 
  Sparkles, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Check, 
  Layers, 
  Lightbulb,
  ArrowRight,
  Info
} from 'lucide-react';
import { hanziMnemonicApi } from '../services/hanziMnemonicApi';
import { favoriteWordsApi } from '../services/favoriteWordsApi';
import { useToast } from '../context/ToastContext';
import { speakChinese } from '../utils/tts';

const HSK_LEVELS = [
  { id: 'ALL', label: 'Tất cả HSK' },
  { id: 'HSK 1', label: 'HSK 1' },
  { id: 'HSK 2', label: 'HSK 2' },
  { id: 'HSK 3', label: 'HSK 3' },
  { id: 'HSK 4', label: 'HSK 4' },
  { id: 'HSK 5', label: 'HSK 5' },
  { id: 'HSK 6', label: 'HSK 6' },
];

const ETYMOLOGIES = [
  { id: 'ALL', label: 'Tất cả cấu tạo' },
  { id: 'Hội ý', label: 'Hội ý (Ghép nghĩa)' },
  { id: 'Tượng hình', label: 'Tượng hình (Vẽ sự vật)' },
  { id: 'Chỉ sự', label: 'Chỉ sự (Biểu tượng trừu tượng)' },
  { id: 'Hình thanh', label: 'Hình thanh (Nghĩa + Âm)' },
];

export default function HanziMnemonicScreen() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Data states
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [selectedEtymology, setSelectedEtymology] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Detail Modal states
  const [selectedChar, setSelectedChar] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
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
        const res = await hanziMnemonicApi.getSummary();
        setSummary(res.data);
      } catch (err) {
        console.error('Failed to load hanzi mnemonics summary:', err);
      }
    }
    loadSummary();
  }, []);

  // Load characters list on filter/page change
  useEffect(() => {
    async function fetchList() {
      setLoading(true);
      try {
        const res = await hanziMnemonicApi.getList({
          level: selectedLevel,
          etymology: selectedEtymology,
          search: debouncedQuery,
          page: currentPage,
          limit: 24,
        });
        setItems(res.data.items || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      } catch (err) {
        console.error('Failed to load hanzi mnemonics list:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchList();
  }, [selectedLevel, selectedEtymology, debouncedQuery, currentPage]);

  // Load user starred favorites
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
    const isStarred = !!starredMap[item.char];

    try {
      if (isStarred) {
        await favoriteWordsApi.deleteFavoriteByHanzi(item.char);
        setStarredMap((prev) => {
          const next = { ...prev };
          delete next[item.char];
          return next;
        });
        showToast(`Đã bỏ lưu chữ "${item.char}"`, 'info');
      } else {
        await favoriteWordsApi.addFavorite({
          hanzi: item.char,
          pinyin: item.pinyin,
          meaning: `${item.sinoVietnamese} - ${item.meaning}`,
          hskLevel: item.hskLevel || 'HSK 1',
        });
        setStarredMap((prev) => ({ ...prev, [item.char]: true }));
        showToast(`Đã lưu chữ "${item.char}" vào Sổ tay!`, 'success');
      }
    } catch (err) {
      showToast('Thao tác không thành công, vui lòng thử lại.', 'error');
    }
  };

  // Open detail modal
  const handleOpenDetail = async (char) => {
    setModalLoading(true);
    try {
      const res = await hanziMnemonicApi.getByChar(char);
      setSelectedChar(res.data);
    } catch (err) {
      showToast('Không thể tải chi tiết chiết tự.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  // Copy mnemonic
  const handleCopyMnemonic = (item) => {
    if (!item) return;
    const comps = (item.components || []).map((c) => `${c.char} (${c.meaning})`).join(' + ');
    const text = `【${item.char}】(Pinyin: ${item.pinyin} • Hán-Việt: ${item.sinoVietnamese})
• Ý nghĩa: ${item.meaning}
• Cấu tạo: ${comps} $\rightarrow$ ${item.char}
• Phương pháp ghi nhớ: ${item.mnemonicStory}
(Nguồn: ChongZi - Nền tảng học tiếng Trung toàn diện)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Đã sao chép câu chuyện chiết tự!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-stone-900 to-slate-950 text-white p-6 sm:p-10 shadow-xl border border-indigo-500/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-60 h-60 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-medium">
              <Lightbulb size={15} />
              <span>Ghi nhớ mặt chữ qua hình tượng trực quan</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold font-chinese tracking-tight text-white flex items-center gap-3">
              <span>Kho Chiết Tự Chữ Hán</span>
              <span className="text-indigo-400 text-xl sm:text-2xl font-light">汉字拆字与记忆法</span>
            </h1>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
              Giải mã 1.900+ chữ Hán HSK 1–6 bằng phương pháp bóc tách bộ thủ và câu chuyện liên tưởng thị giác. Học 1 lần nhớ trọn đời mà không lo quên nét.
            </p>
          </div>

          {/* Featured Character Card */}
          {summary?.featuredToday && (
            <div className="w-full lg:w-96 shrink-0 bg-white/10 dark:bg-black/30 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-4 hover:border-indigo-400/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Sparkles size={14} /> Chữ Hán hôm nay
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-400/20 text-indigo-200 border border-indigo-400/30">
                  {summary.featuredToday.hskLevel}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-chinese text-4xl font-bold text-indigo-300">
                      {summary.featuredToday.char}
                    </span>
                    <button
                      onClick={() => speakChinese(summary.featuredToday.char, 'zh-CN')}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
                      title="Nghe phát âm"
                    >
                      <Volume2 size={18} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-300">
                    <span className="font-medium text-indigo-200">{summary.featuredToday.pinyin}</span>
                    <span>•</span>
                    <span className="font-mono">{summary.featuredToday.sinoVietnamese}</span>
                  </div>
                </div>

                {/* Formula pill */}
                <div className="text-right">
                  <div className="text-[11px] text-stone-300">
                    {summary.featuredToday.meaning}
                  </div>
                  <div className="text-[10px] text-indigo-200 mt-1 font-mono">
                    {(summary.featuredToday.components || []).map(c => c.char).join(' + ')}
                  </div>
                </div>
              </div>

              <p className="text-xs text-stone-200 line-clamp-2 leading-relaxed italic bg-black/20 p-2.5 rounded-xl border border-white/10">
                "{summary.featuredToday.mnemonicStory}"
              </p>

              <button
                onClick={() => handleOpenDetail(summary.featuredToday.char)}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <span>Xem chiết tự & từ ghép</span>
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
              placeholder="Tìm theo chữ Hán (休), Pinyin (xiu), Hán-Việt (Hưu), nghĩa (nghỉ ngơi)..."
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

          {/* Etymology Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {ETYMOLOGIES.map((ety) => (
              <button
                key={ety.id}
                onClick={() => {
                  setSelectedEtymology(ety.id);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
                  selectedEtymology === ety.id
                    ? 'bg-ink dark:bg-on-dark text-white dark:text-surface-dark border-ink dark:border-on-dark shadow-xs'
                    : 'bg-white dark:bg-surface-dark text-mute hover:text-ink dark:hover:text-on-dark border-hairline dark:border-divider-dark'
                }`}
              >
                {ety.label}
              </button>
            ))}
          </div>
        </div>

        {/* HSK Level Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {HSK_LEVELS.map((lvl) => {
            const isSelected = selectedLevel === lvl.id;
            return (
              <button
                key={lvl.id}
                onClick={() => {
                  setSelectedLevel(lvl.id);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-white dark:bg-surface-dark text-mute hover:text-ink dark:hover:text-on-dark border-hairline dark:border-divider-dark'
                }`}
              >
                <span>{lvl.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. TOTAL COUNT & ACTIVE FILTERS */}
      <div className="flex items-center justify-between text-xs text-mute px-1">
        <span>
          Tìm thấy <strong className="text-ink dark:text-on-dark font-semibold">{total}</strong> chữ Hán
        </span>
        {(selectedLevel !== 'ALL' || selectedEtymology !== 'ALL' || searchQuery) && (
          <button
            onClick={() => {
              setSelectedLevel('ALL');
              setSelectedEtymology('ALL');
              setSearchQuery('');
            }}
            className="text-primary hover:underline font-medium"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* 4. HANZI CARDS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-stone-100 dark:bg-stone-900/50 animate-pulse border border-hairline dark:border-divider-dark"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 space-y-3 bg-white dark:bg-surface-dark rounded-3xl border border-hairline dark:border-divider-dark p-8">
          <BookOpen className="mx-auto text-mute" size={40} />
          <h3 className="font-bold text-base text-ink dark:text-on-dark">Không tìm thấy chữ Hán phù hợp</h3>
          <p className="text-xs text-mute max-w-md mx-auto">
            Hệ thống đang tiếp tục sinh dữ liệu chiết tự tự động. Hãy thử tìm từ khóa khác hoặc tải lại sau giây lát.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => {
            const isStarred = !!starredMap[item.char];

            return (
              <div
                key={item.char}
                onClick={() => handleOpenDetail(item.char)}
                className="group relative bg-white dark:bg-surface-dark rounded-2xl border border-hairline dark:border-divider-dark p-4 shadow-xs hover:shadow-md hover:border-indigo-400/50 dark:hover:border-indigo-400/30 transition-all flex flex-col justify-between cursor-pointer space-y-3"
              >
                <div className="space-y-2.5">
                  {/* Top: HSK Level & Star */}
                  <div className="flex items-center justify-between">
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
                      <Star size={15} className={isStarred ? 'fill-amber-500' : ''} />
                    </button>
                  </div>

                  {/* Character, Pinyin & Meaning */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <h3 className="font-chinese text-3xl sm:text-4xl font-bold tracking-tight text-ink dark:text-on-dark group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.char}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-primary font-medium">{item.pinyin}</span>
                        <span className="text-mute">•</span>
                        <span className="font-mono text-mute">{item.sinoVietnamese}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakChinese(item.char, 'zh-CN');
                      }}
                      className="p-2 rounded-xl text-mute hover:text-primary hover:bg-primary/10 transition-all active:scale-95 shrink-0"
                      title="Nghe phát âm"
                    >
                      <Volume2 size={18} />
                    </button>
                  </div>

                  {/* Components breakdown */}
                  {item.components && item.components.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.components.map((c, cIdx) => (
                        <span
                          key={cIdx}
                          className="text-[11px] px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800/60 text-ink/80 dark:text-on-dark/80 font-mono"
                        >
                          {c.char} ({c.meaning})
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Mnemonic Story Preview */}
                  <p className="text-xs text-mute line-clamp-2 leading-relaxed italic">
                    "{item.mnemonicStory}"
                  </p>
                </div>

                {/* Bottom: Meaning & Action */}
                <div className="pt-2.5 border-t border-hairline/60 dark:border-divider-dark/60 flex items-center justify-between text-xs">
                  <span className="text-ink dark:text-on-dark font-medium truncate max-w-[150px]">
                    {item.meaning}
                  </span>
                  <span className="text-primary font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Chi tiết</span>
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
          {Array.from({ length: Math.min(7, totalPages) }).map((_, idx) => {
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
          {totalPages > 7 && <span className="text-mute px-1">...</span>}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl border border-hairline dark:border-divider-dark text-mute hover:text-ink dark:hover:text-on-dark disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* 6. DETAIL MODAL */}
      {selectedChar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-surface-dark rounded-3xl shadow-2xl border border-hairline dark:border-divider-dark flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-hairline dark:border-divider-dark flex items-start justify-between gap-4 bg-stone-50/50 dark:bg-stone-900/30">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 text-mute">
                    {selectedChar.hskLevel}
                  </span>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                    {selectedChar.etymologyType || 'Hội ý'}
                  </span>
                  <span className="text-xs text-mute">
                    {selectedChar.strokeCount} nét
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-chinese text-5xl font-bold tracking-tight text-ink dark:text-on-dark">
                    {selectedChar.char}
                  </span>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">{selectedChar.pinyin}</span>
                      <button
                        onClick={() => speakChinese(selectedChar.char, 'zh-CN')}
                        className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all active:scale-95"
                        title="Nghe phát âm"
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>
                    <div className="text-xs font-mono text-mute font-medium">
                      Hán-Việt: <strong className="text-ink dark:text-on-dark">{selectedChar.sinoVietnamese}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyMnemonic(selectedChar)}
                  className="p-2 rounded-xl border border-hairline dark:border-divider-dark text-mute hover:text-ink dark:hover:text-on-dark hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
                  title="Sao chép chiết tự"
                >
                  {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                </button>
                <button
                  onClick={(e) => handleToggleFavorite(e, selectedChar)}
                  className={`p-2 rounded-xl border border-hairline dark:border-divider-dark transition-all ${
                    starredMap[selectedChar.char]
                      ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-500/30'
                      : 'text-mute hover:text-amber-500 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                  title="Lưu vào Sổ tay"
                >
                  <Star size={18} className={starredMap[selectedChar.char] ? 'fill-amber-500' : ''} />
                </button>
                <button
                  onClick={() => setSelectedChar(null)}
                  className="p-2 rounded-xl border border-hairline dark:border-divider-dark text-mute hover:text-ink dark:hover:text-on-dark hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body Scroll */}
            <div className="p-5 sm:p-7 overflow-y-auto space-y-6 select-text">
              {/* Meaning & Formula Breakdown */}
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <strong className="text-indigo-700 dark:text-indigo-400">Nghĩa tiếng Việt:</strong>
                  <span className="font-semibold text-ink dark:text-on-dark">{selectedChar.meaning}</span>
                </div>

                {selectedChar.components && selectedChar.components.length > 0 && (
                  <div className="pt-2 border-t border-indigo-500/20 flex items-center gap-2 flex-wrap">
                    <span className="text-mute font-medium">Công thức chiết tự:</span>
                    <div className="flex items-center gap-1.5">
                      {selectedChar.components.map((c, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <span className="text-mute font-bold">+</span>}
                          <span className="px-2 py-0.5 rounded bg-white dark:bg-surface-dark border border-indigo-500/30 font-mono font-semibold">
                            {c.char} <span className="text-mute font-normal text-[11px]">({c.meaning})</span>
                          </span>
                        </React.Fragment>
                      ))}
                      <span className="text-mute font-bold">=</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold font-chinese">
                        {selectedChar.char}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Mnemonic Story */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-ink dark:text-on-dark flex items-center gap-2">
                  <Lightbulb size={16} className="text-amber-500" />
                  <span>Câu chuyện liên tưởng ghi nhớ (Mnemonic)</span>
                </h4>
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/40 border border-hairline dark:border-divider-dark text-xs sm:text-sm text-ink/90 dark:text-on-dark/90 leading-relaxed italic">
                  "{selectedChar.mnemonicStory}"
                </div>
              </div>

              {/* Common Words */}
              {selectedChar.commonWords && selectedChar.commonWords.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-ink dark:text-on-dark flex items-center gap-2">
                    <Layers size={16} className="text-primary" />
                    <span>Từ ghép thông dụng</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {selectedChar.commonWords.map((cw, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/40 border border-hairline dark:border-divider-dark space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-chinese text-base font-bold text-ink dark:text-on-dark">
                            {cw.word}
                          </span>
                          <button
                            onClick={() => speakChinese(cw.word, 'zh-CN')}
                            className="p-1 rounded text-mute hover:text-primary transition-all"
                            title="Nghe"
                          >
                            <Volume2 size={14} />
                          </button>
                        </div>
                        <div className="text-[11px] text-primary font-medium">{cw.pinyin}</div>
                        <div className="text-xs text-mute">{cw.meaning}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Example Sentence */}
              {selectedChar.exampleSentence && (
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-ink dark:text-on-dark flex items-center gap-2">
                    <BookOpen size={16} className="text-emerald-500" />
                    <span>Câu ví dụ mẫu</span>
                  </h4>
                  <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/40 border border-hairline dark:border-divider-dark space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-chinese text-sm sm:text-base font-semibold text-ink dark:text-on-dark">
                        {selectedChar.exampleSentence.hanzi}
                      </p>
                      <button
                        onClick={() => speakChinese(selectedChar.exampleSentence.hanzi, 'zh-CN')}
                        className="p-1.5 rounded-lg text-mute hover:text-primary transition-all shrink-0"
                        title="Nghe câu ví dụ"
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-primary font-medium">{selectedChar.exampleSentence.pinyin}</p>
                    <p className="text-xs text-mute">{selectedChar.exampleSentence.vietnamese}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-hairline dark:border-divider-dark bg-stone-50/50 dark:bg-stone-900/30 flex items-center justify-between text-xs">
              <span className="text-mute">
                Nhấn <kbd className="px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-800 font-mono text-[10px]">ESC</kbd> để đóng
              </span>
              <button
                onClick={() => setSelectedChar(null)}
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
