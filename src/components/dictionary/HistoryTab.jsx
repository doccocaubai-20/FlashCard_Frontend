import React, { useState, useMemo, useEffect } from 'react';
import {
  History,
  Trash2,
  Search,
  Sparkles,
  PenTool,
  Volume2,
  Star,
  ArrowRight,
  Filter,
  ArrowUpDown,
  BookOpen,
  X,
  AlertTriangle
} from 'lucide-react';
import { speakChinese } from '../../utils/tts';
import { safeLocalGet, safeLocalSet } from '../../utils/storage';
import { useToast } from '../../context/ToastContext';

const HISTORY_STORAGE_KEY = 'chongzi_dict_history_cache';

export default function HistoryTab({
  history = [],
  setHistory,
  onSelectWord,
  onSwitchTab,
  onClearAllHistory,
  favorites = [],
  onToggleFavorite,
}) {
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [hskFilter, setHskFilter] = useState('ALL'); // 'ALL' | '1' | '2' | '3' | '4' | '5' | '6'
  const [sortBy, setSortBy] = useState('NEWEST'); // 'NEWEST' | 'OLDEST' | 'AZ' | 'HSK'
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  // Sync history to local storage safely
  useEffect(() => {
    if (history && history.length > 0) {
      safeLocalSet(HISTORY_STORAGE_KEY, history);
    }
  }, [history]);

  // Load fallback from storage if empty on mount
  useEffect(() => {
    if ((!history || history.length === 0) && setHistory) {
      const cached = safeLocalGet(HISTORY_STORAGE_KEY, []);
      if (cached && cached.length > 0) {
        setHistory(cached);
      }
    }
  }, [history, setHistory]);

  const isWordFavorite = (hanzi) => {
    return favorites.some((f) => f.hanzi === hanzi);
  };

  // Remove individual history record
  const handleDeleteItem = (e, itemToDelete) => {
    e.stopPropagation();
    const updated = history.filter((item) => {
      if (item.id && itemToDelete.id) return item.id !== itemToDelete.id;
      return item.hanzi !== itemToDelete.hanzi;
    });

    if (setHistory) {
      setHistory(updated);
    }
    safeLocalSet(HISTORY_STORAGE_KEY, updated);
    toast?.addToast(`Đã xóa "${itemToDelete.hanzi}" khỏi lịch sử`, 'info');
  };

  // Filter and sort items
  const filteredHistory = useMemo(() => {
    let result = [...history];

    // 1. Text search filter
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter((item) => {
        const hanzi = (item.hanzi || '').toLowerCase();
        const pinyin = (item.pinyin || '').toLowerCase();
        const sv = (item.sv || '').toLowerCase();
        const vi = (item.vi || '').toLowerCase();
        return (
          hanzi.includes(q) ||
          pinyin.includes(q) ||
          sv.includes(q) ||
          vi.includes(q)
        );
      });
    }

    // 2. HSK filter
    if (hskFilter !== 'ALL') {
      const targetHsk = parseInt(hskFilter, 10);
      result = result.filter((item) => item.hsk === targetHsk);
    }

    // 3. Sorting
    result.sort((a, b) => {
      if (sortBy === 'NEWEST') {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime() || (a.id || 0);
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime() || (b.id || 0);
        return timeB - timeA;
      }
      if (sortBy === 'OLDEST') {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime() || (a.id || 0);
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime() || (b.id || 0);
        return timeA - timeB;
      }
      if (sortBy === 'AZ') {
        const valA = (a.pinyin || a.hanzi || '').toLowerCase();
        const valB = (b.pinyin || b.hanzi || '').toLowerCase();
        return valA.localeCompare(valB, 'zh');
      }
      if (sortBy === 'HSK') {
        const hskA = a.hsk || 99;
        const hskB = b.hsk || 99;
        return hskA - hskB;
      }
      return 0;
    });

    return result;
  }, [history, searchTerm, hskFilter, sortBy]);

  const handleClearAll = () => {
    setShowClearConfirmModal(false);
    if (onClearAllHistory) {
      onClearAllHistory();
    } else if (setHistory) {
      setHistory([]);
    }
    safeLocalSet(HISTORY_STORAGE_KEY, []);
    toast?.addToast('Đã xóa toàn bộ lịch sử tra cứu!', 'success');
  };

  const handleItemClick = (item) => {
    const wordObj = {
      s: item.hanzi,
      t: item.traditional || item.hanzi,
      p: item.pinyin || '',
      sv: item.sv || '',
      vi: item.vi || '',
      hsk: item.hsk || null,
      aiExplanation: item.aiExplanation || '',
    };
    onSelectWord(wordObj);
    onSwitchTab('search');
  };

  return (
    <div className="flex flex-col gap-6 text-left animate-fade-in">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline dark:border-divider-dark pb-4">
        <div>
          <h3 className="font-display font-extrabold text-ink dark:text-on-dark text-lg tracking-tight flex items-center gap-2">
            <History size={20} className="text-primary" />
            Lịch sử tra cứu
          </h3>
          <p className="text-xs text-mute dark:text-on-dark-mute mt-0.5">
            Các từ vựng bạn đã từng tra cứu, được lưu trữ an toàn trên thiết bị và đồng bộ tài khoản.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setShowClearConfirmModal(true)}
            className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold cursor-pointer border border-rose-200 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/50 px-3 py-1.5 rounded-full transition-all self-start sm:self-auto"
          >
            <Trash2 size={13} />
            <span>Xóa tất cả ({history.length})</span>
          </button>
        )}
      </div>

      {/* Filters and Controls Bar */}
      {history.length > 0 && (
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Filter Input */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Lọc từ trong lịch sử (chữ Hán, pinyin, nghĩa...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-xs text-ink dark:text-on-dark shadow-xs"
            />
            <Search className="absolute left-3 top-2.5 text-mute" size={14} />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-mute hover:text-ink cursor-pointer p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* HSK Level Filter */}
            <div className="flex items-center gap-1 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark px-2 py-1 rounded-full text-xs shadow-xs">
              <Filter size={12} className="text-mute" />
              <select
                value={hskFilter}
                onChange={(e) => setHskFilter(e.target.value)}
                className="bg-transparent text-xs text-ink dark:text-on-dark font-medium outline-none cursor-pointer pr-1"
              >
                <option value="ALL">Tất cả HSK</option>
                <option value="1">HSK 1</option>
                <option value="2">HSK 2</option>
                <option value="3">HSK 3</option>
                <option value="4">HSK 4</option>
                <option value="5">HSK 5</option>
                <option value="6">HSK 6</option>
              </select>
            </div>

            {/* Sorter Dropdown */}
            <div className="flex items-center gap-1 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark px-2.5 py-1 rounded-full text-xs shadow-xs">
              <ArrowUpDown size={12} className="text-mute" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs text-ink dark:text-on-dark font-medium outline-none cursor-pointer pr-1"
              >
                <option value="NEWEST">Mới nhất</option>
                <option value="OLDEST">Cũ nhất</option>
                <option value="AZ">A-Z (Pinyin)</option>
                <option value="HSK">Theo cấp HSK</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* History Items List */}
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-surface-card dark:bg-surface-dark/40 rounded-2xl border border-dashed border-hairline dark:border-divider-dark animate-fade-in">
          <History size={44} className="stroke-1 text-mute mb-3 opacity-60" />
          <h4 className="text-base font-bold text-ink dark:text-on-dark">
            Chưa có lịch sử tra cứu
          </h4>
          <p className="text-xs text-mute dark:text-on-dark-mute max-w-sm mt-1 leading-relaxed">
            Mỗi khi bạn tra từ mới hoặc nhấp vào một từ vựng, hệ thống sẽ tự động lưu lại ở đây để bạn dễ dàng ôn tập.
          </p>
          <button
            type="button"
            onClick={() => onSwitchTab('search')}
            className="mt-4 px-5 py-2 rounded-full bg-primary hover:bg-primary-deep text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <BookOpen size={13} />
            <span>Tra cứu từ ngay</span>
          </button>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-surface-card dark:bg-surface-dark/40 rounded-2xl border border-dashed border-hairline dark:border-divider-dark animate-fade-in">
          <Search size={36} className="stroke-1 text-mute mb-2 opacity-60" />
          <h4 className="text-sm font-bold text-ink dark:text-on-dark">
            Không tìm thấy từ nào khớp bộ lọc
          </h4>
          <p className="text-xs text-mute mt-1">
            Hãy thử tìm bằng từ khóa khác hoặc chuyển bộ lọc HSK về "Tất cả HSK".
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setHskFilter('ALL');
            }}
            className="mt-3 px-4 py-1.5 rounded-full border border-hairline dark:border-divider-dark text-xs font-semibold text-primary hover:bg-surface-bone cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="text-[11px] font-mono text-mute">
            Đang hiển thị {filteredHistory.length} từ
          </div>

          <div className="divide-y divide-hairline dark:divide-divider-dark bg-surface-card dark:bg-surface-dark/40 rounded-2xl border border-hairline dark:border-divider-dark shadow-xs overflow-hidden">
            {filteredHistory.map((item, idx) => {
              const fav = isWordFavorite(item.hanzi);
              const mappedWord = {
                s: item.hanzi,
                t: item.traditional || item.hanzi,
                p: item.pinyin || '',
                sv: item.sv || '',
                vi: item.vi || '',
                hsk: item.hsk || null,
              };

              return (
                <div
                  key={`${item.hanzi}_${idx}`}
                  onClick={() => handleItemClick(item)}
                  className="flex gap-4 py-3.5 px-4 items-center hover:bg-surface-bone/60 dark:hover:bg-black/20 transition-all cursor-pointer group"
                >
                  {/* Calligraphy Box (Mễ tự ô miniature) */}
                  <div className="shrink-0 w-12 h-12 bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-xl flex items-center justify-center shadow-2xs font-display group-hover:border-primary/50 group-hover:text-primary transition-all">
                    <span className="text-xl font-bold text-ink dark:text-on-dark leading-none">
                      {item.hanzi}
                    </span>
                  </div>

                  {/* Word Information */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.sv && (
                        <span className="text-sm font-bold text-ink dark:text-on-dark group-hover:text-primary transition-colors font-mono">
                          {item.sv.toUpperCase()}
                        </span>
                      )}
                      {item.pinyin && (
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                          {item.pinyin}
                        </span>
                      )}
                      {item.hsk && (
                        <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                          HSK {item.hsk}
                        </span>
                      )}
                      {item.aiExplanation && (
                        <span className="text-[10px] text-primary dark:text-link bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 font-bold flex items-center gap-1">
                          <Sparkles size={10} />
                          Đã giải thích AI
                        </span>
                      )}
                    </div>

                    {item.vi && (
                      <p className="text-xs text-body dark:text-on-dark-mute line-clamp-1 font-medium leading-relaxed">
                        {item.vi}
                      </p>
                    )}
                  </div>

                  {/* Actions right bar */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakChinese(item.hanzi);
                      }}
                      className="h-8 w-8 rounded-full bg-surface-card hover:bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark text-primary flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-2xs"
                      title="Phát âm"
                    >
                      <Volume2 size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onToggleFavorite) onToggleFavorite(mappedWord);
                      }}
                      className={`h-8 w-8 rounded-full border transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs ${fav
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-500'
                          : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark border-hairline dark:border-divider-dark text-mute hover:text-ink'
                        }`}
                      title={fav ? 'Xóa khỏi mục yêu thích' : 'Thêm vào yêu thích'}
                    >
                      <Star size={13} fill={fav ? 'currentColor' : 'none'} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSwitchTab('ai', mappedWord);
                      }}
                      className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold border border-primary/20 transition-all cursor-pointer"
                      title="Xem giải thích bằng AI"
                    >
                      <Sparkles size={11} />
                      <span>AI</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSwitchTab('handwriting', mappedWord);
                      }}
                      className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-surface-bone hover:bg-surface-card dark:bg-surface-dark text-ink dark:text-on-dark text-[11px] font-bold border border-hairline dark:border-divider-dark transition-all cursor-pointer"
                      title="Luyện viết tay"
                    >
                      <PenTool size={11} className="text-amber-600" />
                      <span>Viết</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(e, item)}
                      className="h-8 w-8 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/30 text-mute hover:text-rose-600 flex items-center justify-center cursor-pointer transition-colors"
                      title="Xóa từ này khỏi lịch sử"
                    >
                      <Trash2 size={13} />
                    </button>

                    <ArrowRight size={15} className="text-mute group-hover:text-primary transition-colors hidden sm:block" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 text-left">
            <div className="flex items-center gap-2.5 text-amber-600">
              <AlertTriangle size={22} />
              <h4 className="font-display font-bold text-ink dark:text-on-dark text-base">
                Xác nhận xóa toàn bộ lịch sử?
              </h4>
            </div>
            <p className="text-xs text-body dark:text-on-dark-mute leading-relaxed">
              Bạn có chắc chắn muốn xóa toàn bộ <strong>{history.length} từ</strong> trong lịch sử tra cứu không? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="flex-1 py-2 rounded-xl border border-hairline dark:border-divider-dark text-xs font-bold text-ink dark:text-on-dark hover:bg-surface-bone cursor-pointer transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
              >
                Xóa tất cả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
