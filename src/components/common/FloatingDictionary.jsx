import React, { useState, useEffect, useRef } from 'react';
import { useDictionary } from '../../hooks/useDictionary';
import { speakChinese } from '../../utils/tts';
import { favoriteWordsApi } from '../../services/favoriteWordsApi';
import { 
  BookOpen, Search, X, Volume2, Star, ArrowLeft, History, Loader2, Link2 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import HoverableText from './HoverableText';

export default function FloatingDictionary() {
  const { lookupMultiple, loading } = useDictionary();
  const [isOpen, setIsOpen] = useState(() => {
    try {
      return localStorage.getItem('chongzi_float_dict_open') === 'true';
    } catch {
      return false;
    }
  });

  const [query, setQuery] = useState(() => {
    try {
      return localStorage.getItem('chongzi_float_dict_query') || '';
    } catch {
      return '';
    }
  });

  const [results, setResults] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('chongzi_float_dict_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState('results'); // 'results' | 'history'

  // Dragging states
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('chongzi_float_dict_pos');
      return saved ? JSON.parse(saved) : { x: 24, y: 80 }; // bottom-right offset
    } catch {
      return { x: 24, y: 80 };
    }
  });

  const bubbleRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0, moved: false });

  // Load favorites list for star toggling
  const loadFavorites = async () => {
    try {
      const res = await favoriteWordsApi.getFavorites();
      setFavorites(res.data || []);
    } catch (err) {
      console.error('Failed to load favorites in bubble:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFavorites();
    }
  }, [isOpen]);

  // Perform search on query change
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      const trimmed = query.trim();
      if (!trimmed) {
        setResults([]);
        return;
      }
      try {
        localStorage.setItem('chongzi_float_dict_query', trimmed);
      } catch {}

      const matches = await lookupMultiple('all', trimmed);
      
      // Sort results by similarity
      const sorted = [...(matches || [])].sort((a, b) => {
        const qLower = trimmed.toLowerCase();
        if ((a.s || '').toLowerCase() === qLower) return -1;
        if ((b.s || '').toLowerCase() === qLower) return 1;
        return (a.s || '').length - (b.s || '').length;
      });

      setResults(sorted.slice(0, 15));
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [query, lookupMultiple]);

  // Persist open state
  useEffect(() => {
    try {
      localStorage.setItem('chongzi_float_dict_open', isOpen);
    } catch {}
  }, [isOpen]);

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem('chongzi_float_dict_history', JSON.stringify(history));
    } catch {}
  }, [history]);

  const isFavorite = (hanzi) => {
    return favorites.some((f) => f.hanzi === hanzi);
  };

  const handleToggleFavorite = async (word) => {
    const hanzi = word.s;
    const alreadyFav = isFavorite(hanzi);
    const prevFavs = [...favorites];

    if (alreadyFav) {
      setFavorites((prev) => prev.filter((f) => f.hanzi !== hanzi));
    } else {
      setFavorites((prev) => [
        { id: -Date.now(), hanzi, pinyin: word.p || '', vi: word.vi || '' },
        ...prev
      ]);
    }

    try {
      if (alreadyFav) {
        await favoriteWordsApi.deleteFavoriteByHanzi(hanzi);
      } else {
        const res = await favoriteWordsApi.addFavorite({
          hanzi,
          pinyin: word.p || '',
          sv: word.sv || '',
          vi: word.vi || ''
        });
        setFavorites((prev) => prev.map((f) => (f.hanzi === hanzi ? res.data : f)));
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      setFavorites(prevFavs);
    }
  };

  const handleSelectWord = (word) => {
    setSelectedWord(word);
    
    // Add to history
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.s !== word.s);
      return [word, ...filtered].slice(0, 20); // Keep last 20 words
    });
  };

  // Drag Handlers
  const handleMouseDown = (e) => {
    // Only drag with left click
    if (e.button !== 0) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    startDrag(clientX, clientY);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  const startDrag = (clientX, clientY) => {
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      posX: position.x,
      posY: position.y,
      moved: false
    };
  };

  const processDrag = (clientX, clientY) => {
    const diffX = dragStartRef.current.x - clientX;
    const diffY = dragStartRef.current.y - clientY;
    
    if (Math.abs(diffX) > 5 || Math.abs(diffY) > 5) {
      dragStartRef.current.moved = true;
    }

    let newX = dragStartRef.current.posX + diffX;
    let newY = dragStartRef.current.posY + diffY;

    // Boundary constraints
    const maxBoundX = window.innerWidth - 64;
    const maxBoundY = window.innerHeight - 64;

    newX = Math.max(12, Math.min(maxBoundX, newX));
    newY = Math.max(12, Math.min(maxBoundY, newY));

    setPosition({ x: newX, y: newY });
  };

  const handleMouseMove = (e) => {
    processDrag(e.clientX, e.clientY);
  };

  const handleTouchMove = (e) => {
    e.preventDefault(); // prevent body scroll while dragging
    const touch = e.touches[0];
    processDrag(touch.clientX, touch.clientY);
  };

  const endDrag = () => {
    try {
      localStorage.setItem('chongzi_float_dict_pos', JSON.stringify(position));
    } catch {}

    // Clean listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);

    // If not moved, trigger click
    if (!dragStartRef.current.moved) {
      setIsOpen((prev) => !prev);
    }
  };

  const handleMouseUp = () => endDrag();
  const handleTouchEnd = () => endDrag();

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999]">
      
      {/* Bubble Launcher Trigger */}
      <button
        ref={bubbleRef}
        type="button"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          right: `${position.x}px`,
          bottom: `${position.y}px`
        }}
        className={`fixed w-14 h-14 rounded-full flex items-center justify-center pointer-events-auto cursor-grab active:cursor-grabbing transition-transform select-none border border-white/20 shadow-2xl z-[99999] ${
          isOpen
            ? 'bg-rose-600 text-white rotate-90'
            : 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white hover:scale-105 active:scale-95 animate-pulse'
        }`}
        title="Tra từ điển nhanh"
      >
        {isOpen ? <X size={24} /> : <BookOpen size={24} />}
      </button>

      {/* Dictionary Card Panel */}
      {isOpen && (
        <div
          style={{
            right: `${Math.min(window.innerWidth - 370, position.x)}px`,
            bottom: `${Math.min(window.innerHeight - 520, position.y + 64)}px`
          }}
          className="fixed w-[350px] max-h-[480px] bg-slate-900/95 border border-white/10 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl pointer-events-auto flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 z-[99998] text-white font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/2">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-emerald-400" />
              <span className="text-xs font-black tracking-tight text-white/90">SỔ TRA TỪ ĐIỂN NHANH</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/5 rounded-lg text-white/50 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search box & Tabs */}
          {!selectedWord && (
            <div className="p-3 border-b border-white/5 space-y-2.5">
              {/* Input field */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tra bính âm, chữ Hán, nghĩa Việt..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-9 bg-black/40 border border-white/10 rounded-xl px-3 pl-8 text-xs placeholder-white/30 text-white focus:outline-none focus:border-emerald-500/50 transition-all font-sans"
                />
                <Search size={14} className="absolute left-2.5 top-2.5 text-white/30" />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-2.5 top-2 text-white/40 hover:text-white text-[10px] font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-2 text-[10px] font-bold border-b border-white/5 pb-1">
                <button
                  onClick={() => setActiveTab('results')}
                  className={`pb-1 px-1 transition-all ${
                    activeTab === 'results'
                      ? 'text-emerald-400 border-b-2 border-emerald-500'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  Kết quả ({results.length})
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`pb-1 px-1 transition-all flex items-center gap-1 ${
                    activeTab === 'history'
                      ? 'text-emerald-400 border-b-2 border-emerald-500'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <History size={10} />
                  Lịch sử ({history.length})
                </button>
              </div>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-3 min-h-0">
            {selectedWord ? (
              /* 1. Detail View */
              <div className="space-y-4 font-sans">
                {/* Back to list */}
                <button
                  onClick={() => setSelectedWord(null)}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <ArrowLeft size={12} />
                  <span>Quay lại danh sách</span>
                </button>

                {/* Main characters and audio */}
                <div className="flex justify-between items-start border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-3xl font-black text-yellow-400 tracking-wide font-serif">
                      <HoverableText text={selectedWord.s} className="relative inline-block cursor-help hover:opacity-80 transition-opacity" />
                    </h3>
                    <div className="text-[11px] font-bold text-white/50 mt-1 font-mono">
                      <span>{selectedWord.p}</span>
                      {selectedWord.sv && (
                        <span className="ml-2 text-emerald-400">[{selectedWord.sv.toUpperCase()}]</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => speakChinese(selectedWord.s)}
                      className="p-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/25 rounded-xl text-emerald-400 cursor-pointer transition-all"
                      title="Phát âm"
                    >
                      <Volume2 size={16} />
                    </button>
                    <button
                      onClick={() => handleToggleFavorite(selectedWord)}
                      className={`p-2 border rounded-xl cursor-pointer transition-all ${
                        isFavorite(selectedWord.s)
                          ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                          : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
                      }`}
                      title="Lưu yêu thích"
                    >
                      <Star size={16} className={isFavorite(selectedWord.s) ? 'fill-current' : ''} />
                    </button>
                  </div>
                </div>

                {/* Definition */}
                <div className="bg-black/30 border border-white/5 p-3 rounded-xl">
                  <span className="text-[8px] font-bold text-white/40 uppercase block mb-1">Nghĩa tiếng Việt</span>
                  <p className="text-xs leading-relaxed text-slate-200">
                    {selectedWord.vi}
                  </p>
                </div>

                {/* HSK Level (if available) */}
                {selectedWord.hsk && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/20 px-2.5 py-1 rounded-lg w-fit">
                    <span>Cấp độ: HSK {selectedWord.hsk}</span>
                  </div>
                )}

                {/* Link to Full Details Screen */}
                <Link
                  to={`/dictionary?word=${encodeURIComponent(selectedWord.s)}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-1.5 w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold text-white/80 hover:text-white transition-all mt-4 cursor-pointer"
                >
                  <Link2 size={12} />
                  <span>Xem chi tiết đầy đủ (Ví dụ & AI Giải nghĩa)</span>
                </Link>
              </div>
            ) : activeTab === 'results' ? (
              /* 2. Results List */
              query.trim() === '' ? (
                <div className="flex flex-col items-center justify-center py-14 text-center text-white/30 space-y-2">
                  <Search size={22} className="opacity-40" />
                  <span className="text-[10px] font-semibold">Nhập từ để tra cứu trực tuyến</span>
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center justify-center py-14 space-y-2 text-white/40">
                  <Loader2 size={20} className="animate-spin text-emerald-400" />
                  <span className="text-[9px] font-bold">Đang tra cứu từ điển...</span>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-1.5">
                  {results.map((item) => (
                    <div
                      key={item.id || item.s}
                      onClick={() => handleSelectWord(item)}
                      className="flex items-center justify-between p-2.5 bg-white/3 hover:bg-white/7 border border-white/5 hover:border-white/10 rounded-xl cursor-pointer transition-all active:scale-[0.99]"
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-black text-yellow-400 font-serif">
                            <HoverableText text={item.s} className="relative inline-block cursor-help hover:opacity-80 transition-opacity" />
                          </span>
                          <span className="text-[10px] text-white/40 truncate font-mono">{item.p}</span>
                        </div>
                        <p className="text-[10px] text-white/60 truncate mt-0.5 font-sans">{item.vi}</p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakChinese(item.s);
                        }}
                        className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
                      >
                        <Volume2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-14 text-center text-[10px] text-white/30 font-semibold">
                  Không tìm thấy kết quả phù hợp.
                </div>
              )
            ) : (
              /* 3. History List */
              history.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center pb-1 border-b border-white/5 mb-2">
                    <span className="text-[8px] font-bold text-white/40">TỪ ĐÃ XEM GẦN ĐÂY</span>
                    <button
                      onClick={() => setHistory([])}
                      className="text-[8px] font-bold text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Xóa tất cả
                    </button>
                  </div>
                  {history.map((item) => (
                    <div
                      key={`hist-${item.s}`}
                      onClick={() => handleSelectWord(item)}
                      className="flex items-center justify-between p-2 bg-white/2 hover:bg-white/5 border border-white/5 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-black text-yellow-500 font-serif">
                            <HoverableText text={item.s} className="relative inline-block cursor-help hover:opacity-80 transition-opacity" />
                          </span>
                          <span className="text-[9px] text-white/40 truncate font-mono">{item.p}</span>
                        </div>
                      </div>
                      <span className="text-[9px] text-white/40 font-mono">Xem</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-14 text-center text-white/30 space-y-2">
                  <History size={20} className="opacity-40" />
                  <span className="text-[10px] font-semibold">Lịch sử tra cứu của bạn đang trống</span>
                </div>
              )
            )}
          </div>
        </div>
      )}

    </div>
  );
}
