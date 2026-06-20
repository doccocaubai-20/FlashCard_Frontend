import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import HandwritingCanvas from '../components/common/HandwritingCanvas';
import { useDictionary } from '../hooks/useDictionary';
import { favoriteWordsApi } from '../services/favoriteWordsApi';
import { statsApi } from '../services/statsApi';
import { BookOpen, Star, Volume2, ArrowRight } from 'lucide-react';

export default function FreeWriteScreen() {
  const { lookupMultiple } = useDictionary();
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [searchParams] = useSearchParams();
  const wordParam = searchParams.get('word');

  // Async calculated dictionary data
  const [breakdown, setBreakdown] = useState([]);
  const [compoundSv, setCompoundSv] = useState('');

  // HanziWriter state
  const writerRef = useRef(null);
  const containerRef = useRef(null);
  const [mode, setMode] = useState('idle'); // idle, quiz
  const [activeCharIndex, setActiveCharIndex] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  // Quiz grading states
  const [quizScore, setQuizScore] = useState(100);
  const [quizMistakes, setQuizMistakes] = useState(0);
  const [quizTotalStrokes, setQuizTotalStrokes] = useState(0);
  const [quizCurrentStroke, setQuizCurrentStroke] = useState(0);
  const [quizReport, setQuizReport] = useState(null); // { score, mistakes, grade, feedback }

  async function loadFavorites() {
    try {
      const res = await favoriteWordsApi.getFavorites();
      setFavorites(res.data || []);
    } catch (err) {
      console.error('Failed to load favorites in free-write:', err);
    }
  }

  useEffect(() => {
    loadFavorites();
    if (wordParam) {
      const cleanWord = decodeURIComponent(wordParam).trim();
      setQuery(cleanWord);
      handleSearch(cleanWord);
    }
  }, [wordParam]);

  const isFavorite = (hanzi) => {
    return favorites.some((f) => f.hanzi === hanzi);
  };

  const handleToggleFavorite = async () => {
    if (!selectedWord) return;
    const hanzi = selectedWord.s;
    const alreadyFav = isFavorite(hanzi);

    // --- Cập nhật Lạc quan (Optimistic Update) ---
    const previousFavorites = [...favorites];
    if (alreadyFav) {
      // Xóa ngay lập tức trên UI
      setFavorites((prev) => prev.filter((f) => f.hanzi !== hanzi));
    } else {
      // Thêm tạm thời lên UI
      const tempFav = {
        id: -Date.now(),
        hanzi,
        pinyin: selectedWord.p || '',
        sv: compoundSv || '',
        vi: selectedWord.vi || '',
      };
      setFavorites((prev) => [tempFav, ...prev]);
    }
    // ---------------------------------------------

    try {
      if (alreadyFav) {
        await favoriteWordsApi.deleteFavoriteByHanzi(hanzi);
      } else {
        const res = await favoriteWordsApi.addFavorite({
          hanzi,
          pinyin: selectedWord.p || '',
          sv: compoundSv || '',
          vi: selectedWord.vi || '',
        });

        // Thay thế bản ghi tạm bằng bản ghi thật từ database
        setFavorites((prev) =>
          prev.map((f) => (f.hanzi === hanzi ? res.data : f))
        );
      }
      loadFavorites();
    } catch (err) {
      console.error('Failed to toggle favorite in free-write:', err);
      // Hoàn tác về trạng thái cũ nếu API lỗi
      setFavorites(previousFavorites);
    }
  };

  const handleRecognize = (character) => {
    setQuery((prev) => {
      const nextQuery = prev + character;
      handleSearch(nextQuery);
      return nextQuery;
    });
  };

  function getSortScore(item, queryLower) {
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
  }

  async function segmentPinyin(s) {
    if (!s) return [];
    const memo = new Map();
    const helper = async (startIndex) => {
      if (startIndex === s.length) return [];
      if (memo.has(startIndex)) return memo.get(startIndex);
      
      for (let len = Math.min(6, s.length - startIndex); len >= 1; len--) {
        const part = s.substring(startIndex, startIndex + len);
        const matches = await lookupMultiple('pinyin', part);
        if (matches && matches.length > 0) {
          const rest = await helper(startIndex + len);
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
    return (await helper(0)) || [];
  }

  async function resolveQueryToWord(q) {
    const cleanQ = (q || '').trim();
    if (!cleanQ) return null;

    const isHanzi = /[\u4e00-\u9fa5]/.test(cleanQ);

    if (isHanzi) {
      // 1. Direct match in dictionary
      const exactMatches = await lookupMultiple('hanzi', cleanQ);
      const exactMatch = exactMatches.find((m) => m.s === cleanQ || m.t === cleanQ);
      if (exactMatch) {
        return exactMatch;
      }

      // 2. Decompose characters
      const chars = Array.from(cleanQ);
      const resolvedParts = [];
      for (const char of chars) {
        const matches = await lookupMultiple('hanzi', char);
        const match = matches.find((m) => m.s === char || m.t === char);
        resolvedParts.push(match || { s: char, t: char, p: '', sv: '', vi: 'Không có dữ liệu' });
      }

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
    const directPinyinMatches = await lookupMultiple('pinyin', lowerQ);
    const directPinyin = directPinyinMatches.find(m => m.s === lowerQ || m.p === lowerQ || m.sp === lowerQ);
    if (directPinyin) {
      return directPinyin;
    }

    const words = lowerQ.split(/\s+/);
    const pinyinSyllables = [];
    let isPurePinyin = true;
    
    for (const word of words) {
      const segmented = await segmentPinyin(word);
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
        const matches = await lookupMultiple('pinyin', syl);
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
        const exactMatches = await lookupMultiple('hanzi', combinedHanzi);
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
    const meaningMatches = await lookupMultiple('meaning', lowerQ);
    if (meaningMatches.length > 0) {
      meaningMatches.sort((a, b) => getSortScore(b, lowerQ) - getSortScore(a, lowerQ));
      return meaningMatches[0];
    }

    return null;
  }

  async function handleSearch(searchQuery) {
    if (isSearching) return;
    const q = (searchQuery || '').trim();
    if (!q) {
      setSelectedWord(null);
      setBreakdown([]);
      setCompoundSv('');
      return;
    }

    setIsSearching(true);
    try {
      let match = await resolveQueryToWord(q);

      // Fallback: If not found but contains Chinese characters, filter out everything else
      if (!match && /[\u4e00-\u9fa5]/.test(q)) {
        const hanziOnly = q.replace(/[^\u4e00-\u9fa5]/g, '');
        if (hanziOnly) {
          match = await resolveQueryToWord(hanziOnly);
        }
      }

      if (match) {
        setSelectedWord(match);
        setActiveCharIndex(0);

        // Calculate breakdown and compound Hán Việt asynchronously
        const word = match.s;
        const chars = Array.from(word);

        // 1. Calculate Compound Hán Việt
        if (match.sv) {
          setCompoundSv(match.sv);
        } else if (chars.length === 1) {
          const matches = await lookupMultiple('hanzi', word);
          const singleMatch = matches.find((m) => m.s === word || m.t === word);
          setCompoundSv(singleMatch?.sv || '');
        } else {
          const parts = [];
          for (const char of chars) {
            const matches = await lookupMultiple('hanzi', char);
            const singleMatch = matches.find((m) => m.s === char || m.t === char);
            parts.push(singleMatch?.sv || `[${char}]`);
          }
          setCompoundSv(parts.join(' ').replace(/\s+/g, ' ').trim());
        }

        // 2. Calculate Character Breakdown
        if (chars.length > 1) {
          const bdList = [];
          for (const char of chars) {
            const matches = await lookupMultiple('hanzi', char);
            const singleMatch = matches.find((m) => m.s === char || m.t === char);
            bdList.push({
              char,
              pinyin: singleMatch?.p || '',
              sv: singleMatch?.sv || '',
              vi: singleMatch?.vi || 'Không tìm thấy dữ liệu',
            });
          }
          setBreakdown(bdList);
        } else {
          setBreakdown([]);
        }
      } else {
        setSelectedWord(null);
        setBreakdown([]);
        setCompoundSv('');
      }
    } catch (err) {
      console.error('Failed to search in FreeWriteScreen:', err);
    } finally {
      setIsSearching(false);
    }
  }

  const handleSpeak = () => {
    if (!selectedWord || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(selectedWord.s);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  // Clear search results when search bar is cleared
  useEffect(() => {
    if (!query.trim()) {
      setSelectedWord(null);
      setBreakdown([]);
      setCompoundSv('');
    }
  }, [query]);

  const handleClearAll = () => {
    setQuery('');
    setSelectedWord(null);
    setBreakdown([]);
    setCompoundSv('');
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

  function handleQuiz() {
    if (!writerRef.current) return;
    writerRef.current.cancelQuiz();
    setQuizScore(100);
    setQuizMistakes(0);
    setQuizReport(null);
    setMode('quiz');

    // Get total strokes
    const strokeCount = writerRef.current._withData && writerRef.current._withData.character 
      ? writerRef.current._withData.character.strokes.length 
      : 0;
    setQuizTotalStrokes(strokeCount);
    setQuizCurrentStroke(0);

    writerRef.current.quiz({
      onStrokeCorrect: (strokeData) => {
        setQuizCurrentStroke(strokeData.strokeNum + 1);
        setQuizMistakes(strokeData.totalMistakes);
        setQuizScore(Math.max(0, 100 - strokeData.totalMistakes * 10));
      },
      onStrokeMismatch: (strokeData) => {
        setQuizMistakes(strokeData.totalMistakes);
        setQuizScore(Math.max(0, 100 - strokeData.totalMistakes * 10));
      },
      onComplete: (summary) => {
        const finalMistakes = summary.totalMistakes || 0;
        const finalScore = Math.max(0, 100 - finalMistakes * 10);
        
        let grade = 'C';
        let feedback = 'Hãy cố gắng luyện tập thêm nhiều lần!';
        if (finalScore >= 95) {
          grade = 'A+';
          feedback = 'Xuất sắc! Nét viết thanh thoát, đúng chuẩn tuyệt đối!';
        } else if (finalScore >= 85) {
          grade = 'A';
          feedback = 'Rất tốt! Chữ viết rất chuẩn xác và thẳng hàng.';
        } else if (finalScore >= 70) {
          grade = 'B';
          feedback = 'Đạt yêu cầu. Bạn cần chú ý thêm thứ tự nét.';
        }

        setQuizReport({
          score: finalScore,
          mistakes: finalMistakes,
          grade,
          feedback,
          character: summary.character
        });
        setMode('idle');
        statsApi.incrementQuestProgress('WRITE_PRACTICE', 1).catch(err => console.error(err));
      }
    });
  }
  const handleReset = () => {
    if (!writerRef.current) return;
    writerRef.current.cancelQuiz();
    setMode('idle');
    setQuizReport(null);
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
            Luyện viết chữ Hán theo các nét chuẩn ở bên trái và viết tay nhận diện, tra cứu ở bên phải.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Writing Practice (Luyện viết chuẩn) */}
        {selectedWord ? (
          <div className="lg:col-span-5 bg-surface-card dark:bg-surface-dark/50 p-6 rounded-xl border border-hairline dark:border-white/5 shadow-sm flex flex-col items-center gap-4 transition-colors min-h-[550px] justify-center">
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
                        : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-white/5 text-ink dark:text-on-dark'
                    }`}
                  >
                    Chữ {i + 1}: {c}
                  </button>
                ))}
              </div>
            )}

            {/* Writer Container */}
            <div className="relative bg-surface-card dark:bg-surface-dark border border-hairline dark:border-white/5 rounded-xl p-2 w-[236px] h-[236px] flex items-center justify-center shadow-inner">
              <div ref={containerRef} id="free-write-canvas" className="w-[220px] h-[220px]" />
            </div>

            {mode === 'quiz' && (
              <div className="w-full max-w-[236px] bg-surface-bone/50 dark:bg-black/35 p-3.5 rounded-xl border border-hairline dark:border-white/5 text-left space-y-1 animate-fade-in">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-mute">Nét vẽ:</span>
                  <span className="text-primary font-mono font-bold">{quizCurrentStroke} / {quizTotalStrokes}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-mute">Lỗi vẽ sai:</span>
                  <span className="text-red-500 font-mono font-bold">{quizMistakes}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-mute">Đo độ chính xác:</span>
                  <span className="text-teal-500 font-mono font-bold">{quizScore}%</span>
                </div>
              </div>
            )}

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
        ) : (
          <div className="lg:col-span-5 bg-surface-card dark:bg-surface-dark/30 p-6 rounded-xl border border-dashed border-hairline dark:border-white/5 shadow-sm flex flex-col items-center justify-center py-20 text-mute text-center min-h-[550px] transition-colors">
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                <span className="text-sm font-medium">Đang tìm kiếm...</span>
              </>
            ) : (
              <>
                <BookOpen size={48} className="stroke-1 text-mute dark:text-on-dark-mute mb-3 animate-pulse" />
                <h3 className="text-md font-bold text-ink dark:text-on-dark mb-1">Chưa chọn từ</h3>
                <p className="text-xs text-mute dark:text-on-dark-mute max-w-xs leading-relaxed">
                  Hãy nhập từ khóa hoặc vẽ chữ ở bảng viết tay bên phải để bắt đầu phân tích và luyện nét viết chuẩn.
                </p>
              </>
            )}
          </div>
        )}

        {/* Right Side: Translation Details & Handwriting Canvas */}
        <div className="lg:col-span-7 bg-surface-card dark:bg-surface-dark/50 p-6 rounded-xl border border-hairline dark:border-white/5 shadow-sm flex flex-col gap-6 transition-colors min-h-[550px]">
          
          {/* Query Edit Bar */}
          <div className="flex gap-2.5 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Từ/cụm từ đang soạn... (Hoặc tự nhập bằng bàn phím)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
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
                    {compoundSv && (
                      <>
                        <span>|</span>
                        <span className="text-primary dark:text-link">{compoundSv.toUpperCase()}</span>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start flex-1">
                
                {/* Details & Meaning */}
                <div className="space-y-4">
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
                        {breakdown.map((item, idx) => (
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

                {/* Handwriting Canvas */}
                <div>
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

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center max-w-[400px] mx-auto w-full">
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
          )}
        </div>

      </div>

      {/* Quiz Report Modal */}
      {quizReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark max-w-sm w-full rounded-md p-6 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="relative pt-2">
              <div className="text-7xl font-display font-extrabold text-ink dark:text-on-dark animate-pulse">
                {quizReport.character}
              </div>
              <div className={`absolute -top-1.5 right-4 h-12 w-12 rounded-full border-2 font-mono font-extrabold text-base flex items-center justify-center shadow ${
                quizReport.score >= 90
                  ? 'bg-amber-500/10 border-amber-500/35 text-amber-500'
                  : quizReport.score >= 70
                  ? 'bg-teal-500/10 border-teal-500/35 text-teal-500'
                  : 'bg-orange-500/10 border-orange-500/35 text-orange-500'
              }`}>
                {quizReport.grade}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-ink dark:text-on-dark font-display">
                Kết quả luyện viết
              </h3>
              <p className="text-xs text-mute dark:text-on-dark-mute max-w-xs mx-auto leading-relaxed">
                {quizReport.feedback}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-surface-bone/50 dark:bg-black/20 p-4 rounded-md border border-hairline dark:border-divider-dark text-left">
              <div>
                <span className="text-[10px] font-bold text-mute uppercase tracking-wider block">Điểm số</span>
                <span className="text-xl font-extrabold font-mono text-primary">{quizReport.score}%</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-mute uppercase tracking-wider block">Lỗi sai nét</span>
                <span className="text-xl font-extrabold font-mono text-red-500">{quizReport.mistakes} lần</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {activeCharIndex + 1 < chars.length && (
                <button
                  onClick={() => {
                    const nextIdx = activeCharIndex + 1;
                    setActiveCharIndex(nextIdx);
                    setQuizReport(null);
                    setTimeout(() => {
                      handleQuiz();
                    }, 200);
                  }}
                  className="w-full py-3 bg-primary hover:bg-primary-deep text-white font-mono font-bold text-xs rounded-full cursor-pointer transition-all shadow-sm hover:shadow active:scale-95 flex items-center justify-center gap-1.5"
                >
                  Viết chữ tiếp theo ({chars[activeCharIndex + 1]})
                  <ArrowRight size={14} />
                </button>
              )}
              
              <button
                onClick={handleQuiz}
                className="w-full py-3 bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-ink dark:text-on-dark font-mono font-bold text-xs rounded-full transition-colors cursor-pointer"
              >
                Luyện lại chữ này
              </button>

              <button
                onClick={() => setQuizReport(null)}
                className="w-full py-2 text-xs font-semibold text-mute hover:text-ink dark:hover:text-on-dark cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
