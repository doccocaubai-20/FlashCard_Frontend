import React, { useState, useEffect, useRef } from 'react';
import HandwritingCanvas from '../components/common/HandwritingCanvas';
import { useDictionary } from '../hooks/useDictionary';
import { favoriteWordsApi } from '../services/favoriteWordsApi';
import { BookOpen, Star, Sparkles, Volume2, HelpCircle } from 'lucide-react';

export default function FreeWriteScreen() {
  const { lookupMultiple, loading: dictLoading } = useDictionary();
  const [query, setQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState(null);
  const [favorites, setFavorites] = useState([]);

  // HanziWriter state
  const writerRef = useRef(null);
  const containerRef = useRef(null);
  const [mode, setMode] = useState('idle'); // idle, quiz
  const [activeCharIndex, setActiveCharIndex] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  const loadFavorites = async () => {
    try {
      const res = await favoriteWordsApi.getFavorites();
      setFavorites(res.data || []);
    } catch (err) {
      console.error('Failed to load favorites in free-write:', err);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const isFavorite = (hanzi) => {
    return favorites.some((f) => f.hanzi === hanzi);
  };

  const getCompoundHanViet = (word) => {
    if (!word) return '';
    const chars = Array.from(word);
    if (chars.length === 1) {
      const matches = lookupMultiple('hanzi', word);
      const match = matches.find((m) => m.s === word || m.t === word);
      return match?.sv || '';
    }
    const parts = chars.map((char) => {
      const matches = lookupMultiple('hanzi', char);
      const match = matches.find((m) => m.s === char || m.t === char);
      return match?.sv || `[${char}]`;
    });
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  };

  const getCharacterBreakdown = (word) => {
    if (!word || word.length <= 1) return [];
    const chars = Array.from(word);
    return chars.map((char) => {
      const matches = lookupMultiple('hanzi', char);
      const match = matches.find((m) => m.s === char || m.t === char);
      return {
        char,
        pinyin: match?.p || '',
        sv: match?.sv || '',
        vi: match?.vi || 'Không tìm thấy dữ liệu',
      };
    });
  };

  const handleToggleFavorite = async () => {
    if (!selectedWord) return;
    const hanzi = selectedWord.s;
    const alreadyFav = isFavorite(hanzi);
    try {
      if (alreadyFav) {
        await favoriteWordsApi.deleteFavoriteByHanzi(hanzi);
      } else {
        const sv = getCompoundHanViet(hanzi) || '';
        await favoriteWordsApi.addFavorite({
          hanzi,
          pinyin: selectedWord.p || '',
          sv,
          vi: selectedWord.vi || '',
        });
      }
      loadFavorites();
    } catch (err) {
      console.error('Failed to toggle favorite in free-write:', err);
    }
  };

  const handleRecognize = (character) => {
    setQuery((prev) => {
      const nextQuery = prev + character;
      handleSearch(nextQuery);
      return nextQuery;
    });
  };

  const getSortScore = (item, queryLower) => {
    const s = (item.s || '').toLowerCase();
    const t = (item.t || '').toLowerCase();
    const p = (item.p || '').toLowerCase();
    const pt = (item.pt || '').toLowerCase();
    const sp = (item.sp || '').toLowerCase();
    const sv = (item.sv || '').toLowerCase();
    const vi = (item.vi || '').toLowerCase();
    const en = Array.isArray(item.en) ? item.en.join(' ').toLowerCase() : (item.en || '').toLowerCase();

    let score = 0;

    if (s === queryLower || t === queryLower) score += 10000;
    if (p === queryLower || pt === queryLower || sp === queryLower) score += 5000;
    if (sv === queryLower) score += 2000;

    const firstVi = vi.split('/')[0].trim();
    if (firstVi === queryLower || vi.trim() === queryLower) score += 1000;

    if (s.startsWith(queryLower) || t.startsWith(queryLower)) score += 500;
    if (sv.startsWith(queryLower)) score += 300;

    if (item.hsk) score += (10 - item.hsk) * 200;
    if (item.b) score += item.b * 10;
    if (item.bwr) score -= item.bwr * 0.1;
    if (item.mwr) score -= item.mwr * 0.1;

    const isVariant =
      vi.includes('biến thể cổ của') ||
      vi.includes('biến thể của') ||
      vi.includes('biến thể cũ của') ||
      vi.includes('cổ của') ||
      en.includes('variant of') ||
      en.includes('archaic variant') ||
      en.includes('old variant');

    if (isVariant) score -= 8000;
    score -= s.length * 10;

    return score;
  };

  const segmentPinyin = (s) => {
    if (!s) return [];
    const memo = new Map();
    const helper = (startIndex) => {
      if (startIndex === s.length) return [];
      if (memo.has(startIndex)) return memo.get(startIndex);
      
      for (let len = Math.min(6, s.length - startIndex); len >= 1; len--) {
        const part = s.substring(startIndex, startIndex + len);
        const matches = lookupMultiple('pinyin', part);
        if (matches && matches.length > 0) {
          const rest = helper(startIndex + len);
          if (rest !== null) {
            const result = [part, ...rest];
            memo.set(startIndex, result);
            return result;
          }
        }
      }
      memo.set(startIndex, null);
      return null;
    };
    return helper(0) || [];
  };

  const resolveQueryToWord = (q) => {
    const cleanQ = (q || '').trim();
    if (!cleanQ) return null;

    const isHanzi = /[\u4e00-\u9fa5]/.test(cleanQ);

    if (isHanzi) {
      // 1. Direct match in dictionary
      const exactMatches = lookupMultiple('hanzi', cleanQ);
      const exactMatch = exactMatches.find((m) => m.s === cleanQ || m.t === cleanQ);
      if (exactMatch) {
        return exactMatch;
      }

      // 2. Decompose characters
      const chars = Array.from(cleanQ);
      const resolvedParts = chars.map(char => {
        const matches = lookupMultiple('hanzi', char);
        const match = matches.find((m) => m.s === char || m.t === char);
        if (match) return match;
        return { s: char, t: char, p: '', sv: '', vi: 'Không có dữ liệu' };
      });

      const combinedPinyin = resolvedParts.map(p => p.p).filter(Boolean).join(' ');
      const combinedSv = resolvedParts.map(p => p.sv).filter(Boolean).join(' ');
      const combinedVi = resolvedParts.map(p => `${p.s}: ${p.vi}`).join(' | ');

      return {
        s: cleanQ,
        t: cleanQ,
        p: combinedPinyin,
        sv: combinedSv,
        vi: combinedVi,
        isVirtual: true
      };
    }

    // Not Hanzi: try Pinyin or Meaning
    const lowerQ = cleanQ.toLowerCase();
    
    // Check if it matches a direct meaning or single word pinyin first
    const directPinyinMatches = lookupMultiple('pinyin', lowerQ);
    const directPinyin = directPinyinMatches.find(m => m.s === lowerQ || m.p === lowerQ || m.sp === lowerQ);
    if (directPinyin) {
      return directPinyin;
    }

    const words = lowerQ.split(/\s+/);
    const pinyinSyllables = [];
    let isPurePinyin = true;
    
    for (const word of words) {
      const segmented = segmentPinyin(word);
      if (segmented && segmented.length > 0) {
        pinyinSyllables.push(...segmented);
      } else {
        isPurePinyin = false;
        break;
      }
    }

    if (isPurePinyin && pinyinSyllables.length > 0) {
      const resolvedChars = [];
      
      for (const syl of pinyinSyllables) {
        const matches = lookupMultiple('pinyin', syl);
        const singleCharMatches = matches.filter(m => m.s && m.s.length === 1);
        
        if (singleCharMatches.length > 0) {
          singleCharMatches.sort((a, b) => getSortScore(b, syl) - getSortScore(a, syl));
          resolvedChars.push(singleCharMatches[0]);
        } else if (matches.length > 0) {
          matches.sort((a, b) => getSortScore(b, syl) - getSortScore(a, syl));
          resolvedChars.push(matches[0]);
        } else {
          isPurePinyin = false;
          break;
        }
      }

      if (isPurePinyin && resolvedChars.length > 0) {
        const combinedHanzi = resolvedChars.map(c => c.s).join('');
        
        // If the joined Hanzi word exists in the dictionary, return it directly!
        const exactMatches = lookupMultiple('hanzi', combinedHanzi);
        const exactMatch = exactMatches.find(m => m.s === combinedHanzi);
        if (exactMatch) {
          return exactMatch;
        }

        const combinedPinyin = resolvedChars.map(c => c.p).filter(Boolean).join(' ');
        const combinedSv = resolvedChars.map(c => c.sv).filter(Boolean).join(' ');
        const combinedVi = resolvedChars.map(c => `${c.s}: ${c.vi}`).join(' | ');

        return {
          s: combinedHanzi,
          t: combinedHanzi,
          p: combinedPinyin,
          sv: combinedSv,
          vi: combinedVi,
          isVirtual: true
        };
      }
    }

    // Meaning match fallback
    const meaningMatches = lookupMultiple('meaning', lowerQ);
    if (meaningMatches.length > 0) {
      meaningMatches.sort((a, b) => getSortScore(b, lowerQ) - getSortScore(a, lowerQ));
      return meaningMatches[0];
    }

    return null;
  };

  const handleSearch = (searchQuery) => {
    const q = (searchQuery || '').trim();
    if (!q) {
      setSelectedWord(null);
      return;
    }

    let match = resolveQueryToWord(q);

    // Fallback: If not found but contains Chinese characters, filter out everything else
    if (!match && /[\u4e00-\u9fa5]/.test(q)) {
      const hanziOnly = q.replace(/[^\u4e00-\u9fa5]/g, '');
      if (hanziOnly) {
        match = resolveQueryToWord(hanziOnly);
      }
    }

    if (match) {
      setSelectedWord(match);
      setActiveCharIndex(0);
    } else {
      setSelectedWord(null);
    }
  };

  const handleSpeak = () => {
    if (!selectedWord || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(selectedWord.s);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const handleClearAll = () => {
    setQuery('');
    setSelectedWord(null);
  };

  // HanziWriter rendering logic
  const targetChar = selectedWord ? Array.from(selectedWord.s)[activeCharIndex] : '';

  useEffect(() => {
    if (!containerRef.current || !window.HanziWriter || !targetChar) return;

    containerRef.current.innerHTML = '';

    const isDark = document.documentElement.classList.contains('dark');
    const outlineColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(32, 32, 32, 0.12)';
    const strokeColor = '#54cbd4';
    const drawingColor = isDark ? '#87ecf2' : '#54cbd4';
    const radicalColor = '#2b9a66';

    const writer = window.HanziWriter.create(containerRef.current, targetChar, {
      width: 220,
      height: 220,
      padding: 5,
      showOutline: true,
      strokeColor,
      outlineColor,
      drawingColor,
      radicalColor,
      highlightColor: '#ff6a3d',
      showCharacter: true
    });

    writerRef.current = writer;
    setMode('idle');
  }, [targetChar, resetKey]);

  const handleAnimate = () => {
    if (!writerRef.current) return;
    writerRef.current.cancelQuiz();
    setMode('idle');
    writerRef.current.animateCharacter();
  };

  const handleQuiz = () => {
    if (!writerRef.current) return;
    writerRef.current.cancelQuiz();
    setMode('quiz');
    writerRef.current.quiz({
      onComplete: (summary) => {
        alert('Tuyệt vời! Bạn đã viết chính xác từ này!');
        setMode('idle');
      }
    });
  };

  const handleReset = () => {
    if (!writerRef.current) return;
    writerRef.current.cancelQuiz();
    setMode('idle');
    setResetKey((prev) => prev + 1);
  };

  const chars = selectedWord ? Array.from(selectedWord.s) : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-sm shrink-0">
          <BookOpen size={18} />
        </div>
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink dark:text-on-dark tracking-tight">Luyện viết chữ Hán</h1>
          <p className="text-mute dark:text-on-dark-mute text-sm mt-0.5">
            Viết chữ lên bảng vẽ bên trái để nhận diện và luyện viết theo nét chuẩn ở bên phải.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Handwriting Canvas */}
        <div className="lg:col-span-5">
          <HandwritingCanvas 
            onRecognize={handleRecognize} 
            query={query}
            onDeleteLastChar={() => {
              setQuery((prev) => {
                const next = prev.slice(0, -1);
                handleSearch(next);
                return next;
              });
            }}
            onClearAll={handleClearAll}
          />
        </div>

        {/* Right Side: Translation Details & Stroke Grid */}
        <div className="lg:col-span-7 bg-surface-card dark:bg-surface-dark/50 p-6 rounded-md border border-hairline dark:border-divider-dark shadow-sm flex flex-col gap-6 transition-colors min-h-[550px]">
          
          {/* Query Edit Bar */}
          <div className="flex gap-2.5 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Từ/cụm từ đang soạn... (Hoặc tự nhập bằng bàn phím)"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="w-full pl-4 pr-10 py-2.5 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-ink dark:text-on-dark shadow-sm"
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="absolute right-3.5 top-3 text-mute hover:text-ink dark:hover:text-on-dark cursor-pointer font-bold text-xs"
                  title="Xóa hết"
                >
                  ✕
                </button>
              )}
            </div>
            
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery((prev) => {
                    const next = prev.slice(0, -1);
                    handleSearch(next);
                    return next;
                  });
                }}
                className="flex items-center justify-center p-2.5 rounded-full border border-hairline dark:border-divider-dark text-mute hover:text-ink dark:hover:text-on-dark bg-surface-card dark:bg-surface-dark hover:bg-surface-bone dark:hover:bg-black transition-colors cursor-pointer text-sm font-semibold"
                title="Xóa ký tự cuối (Backspace)"
              >
                ⌫ Xóa
              </button>
            )}
          </div>

          {selectedWord ? (
            <div className="flex flex-col gap-6 text-left flex-1">
              
              {/* Word & Buttons Bar */}
              <div className="flex justify-between items-start border-b border-hairline dark:border-divider-dark pb-4 flex-wrap gap-4">
                <div>
                  <h2 className="text-4xl font-extrabold text-ink dark:text-on-dark font-display">
                    {selectedWord.s}
                  </h2>
                  <div className="flex items-center gap-2 mt-1.5 text-sm font-semibold text-mute dark:text-on-dark-mute">
                    <span>{selectedWord.p || 'Không có Pinyin'}</span>
                    {getCompoundHanViet(selectedWord.s) && (
                      <>
                        <span>|</span>
                        <span className="text-primary dark:text-link">{getCompoundHanViet(selectedWord.s).toUpperCase()}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSpeak}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-primary shadow-sm transition-all cursor-pointer"
                    title="Đọc phát âm"
                  >
                    <Volume2 size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all cursor-pointer ${
                      isFavorite(selectedWord.s)
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                        : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-mute hover:text-ink dark:hover:text-on-dark'
                    }`}
                    title={isFavorite(selectedWord.s) ? 'Xóa khỏi mục yêu thích' : 'Thêm vào mục yêu thích'}
                  >
                    <Star size={16} fill={isFavorite(selectedWord.s) ? 'currentColor' : 'none'} />
                  </button>

                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="px-4 py-1.5 border border-hairline dark:border-divider-dark hover:bg-surface-bone dark:hover:bg-black text-ink dark:text-on-dark rounded-full text-xs font-semibold transition-all cursor-pointer bg-surface-card dark:bg-surface-dark"
                  >
                    Làm lại
                  </button>
                </div>
              </div>

              {/* Bento Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start flex-1">
                
                {/* Details & Meaning */}
                <div className="space-y-4 md:col-span-1">
                  <div>
                    <h4 className="text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider mb-2">Định nghĩa & Bản dịch</h4>
                    <div className="bg-surface-bone/50 dark:bg-black/20 p-4 rounded-md border border-hairline dark:border-divider-dark">
                      <p className="text-sm font-semibold text-ink dark:text-on-dark leading-relaxed">
                        {selectedWord.vi}
                      </p>
                    </div>
                  </div>

                  {selectedWord.hsk && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                      HSK {selectedWord.hsk}
                    </div>
                  )}

                  {selectedWord.s.length > 1 && (
                    <div className="space-y-2 mt-2">
                      <h4 className="text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider">Phân tích từng chữ</h4>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {getCharacterBreakdown(selectedWord.s).map((item, idx) => (
                          <div key={idx} className="bg-surface-bone/50 dark:bg-black/35 p-3 rounded-md border border-hairline dark:border-divider-dark text-xs flex gap-2.5">
                            <span className="text-base font-extrabold text-primary shrink-0">{item.char}</span>
                            <div className="text-left">
                              <div className="font-bold text-ink dark:text-on-dark font-mono">
                                {item.pinyin} {item.sv && `| ${item.sv.toUpperCase()}`}
                              </div>
                              <div className="text-body dark:text-on-dark-mute mt-1 leading-relaxed">{item.vi}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Animated Calligraphy Grid */}
                <div className="flex flex-col items-center gap-4 bg-surface-bone/30 dark:bg-black/10 border border-hairline dark:border-divider-dark rounded-md p-5 shadow-sm md:col-span-2">
                  <span className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">Luyện viết chuẩn</span>
                  
                  {chars.length > 1 && (
                    <div className="flex gap-1.5 mb-1 overflow-x-auto max-w-full select-none no-scrollbar">
                      {chars.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setActiveCharIndex(i)}
                          className={`px-3 py-1 rounded-full text-xs font-bold font-mono transition-all cursor-pointer ${
                            activeCharIndex === i
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
                          }`}
                        >
                          Chữ {i + 1}: {c}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Writer Container */}
                  <div className="relative bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-md p-2 w-[236px] h-[236px] flex items-center justify-center shadow-inner">
                    <div ref={containerRef} id="free-write-canvas" className="w-[220px] h-[220px]" />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAnimate}
                      className="px-3.5 py-1.5 bg-surface-card hover:bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark text-ink dark:text-on-dark text-xs font-mono font-semibold rounded-full transition-all cursor-pointer shadow-sm"
                    >
                      Xem nét
                    </button>
                    <button
                      type="button"
                      onClick={handleQuiz}
                      className={`px-3.5 py-1.5 text-white text-xs font-mono font-semibold rounded-full shadow transition-all cursor-pointer ${
                        mode === 'quiz' ? 'bg-primary/50' : 'bg-primary hover:bg-primary-deep'
                      }`}
                    >
                      {mode === 'quiz' ? 'Đang viết...' : 'Luyện viết'}
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-3.5 py-1.5 bg-surface-bone hover:bg-surface-bone/70 dark:bg-surface-dark dark:hover:bg-surface-dark/70 text-ink dark:text-on-dark text-xs font-mono font-semibold rounded-full transition-all cursor-pointer border border-hairline dark:border-divider-dark"
                    >
                      Làm mới
                    </button>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-mute bg-surface-bone/20 dark:bg-surface-dark/20 rounded-md border border-dashed border-hairline dark:border-divider-dark animate-fade-in flex-1">
              <BookOpen size={48} className="stroke-1 text-mute dark:text-on-dark-mute mb-3" />
              <p className="text-sm font-medium text-body dark:text-on-dark-mute max-w-sm text-center leading-relaxed">
                Nhấp chuột vẽ các nét tiếng Trung lên bảng vẽ bên trái và bấm vào gợi ý nhận diện để bắt đầu phân tích từ vựng và luyện nét viết.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
