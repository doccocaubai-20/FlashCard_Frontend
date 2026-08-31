import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllDecks, fetchFlashcardsByDeck } from '../features/deck/deckSlice';
import { dictionaryApi } from '../services/dictionaryApi';
import api from '../services/api';
import { gameRecordsApi, weakWordsApi } from '../services/learningApi';
import { cleanDefinition } from '../utils/formatters';
import { 
  Zap, 
  Heart, 
  RotateCcw, 
  Trophy, 
  Volume2, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Pause,
  Info,
  XCircle
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function FallingWordsGameScreen() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Load custom decks from Redux
  const [loadingCards, setLoadingCards] = useState(false);
  const decks = useSelector((state) => state.deck.decks);

  // Configuration States
  const [selectedSource, setSelectedSource] = useState('hsk1'); // hsk1, hsk2, hsk3, deck_<id>
  const [hintMode, setHintMode] = useState('pinyin'); // none, pinyin, meaning
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Play States
  const [fallingWords, setFallingWords] = useState([]);
  const [wordPool, setWordPool] = useState([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [inputValue, setInputValue] = useState('');
  const [flashRed, setFlashRed] = useState(false);
  const [explosions, setExplosions] = useState([]); // Array of { id, x, y, text }
  
  // Review log
  const [destroyedWords, setDestroyedWords] = useState([]);
  const [missedWords, setMissedWords] = useState([]);

  // Refs for loop controls
  const inputRef = useRef(null);
  const lastSpawnRef = useRef(0);
  const deckCardsRef = useRef([]);

  // Load high score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('falling_words_highscore');
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
    dispatch(fetchAllDecks());
  }, [dispatch]);

  // Load custom deck cards if selected
  useEffect(() => {
    if (selectedSource.startsWith('deck_')) {
      const deckId = selectedSource.replace('deck_', '');
      dispatch(fetchFlashcardsByDeck(deckId))
        .unwrap()
        .then((cards) => {
          deckCardsRef.current = cards || [];
        })
        .catch((err) => {
          console.error('Failed to load custom deck cards:', err);
        });
    }
  }, [selectedSource, dispatch]);

  // Accent & spacer stripping normalization function
  const normalizeText = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD') // Decompose accents
      .replace(/[\u0300-\u036f]/g, '') // Strip accents
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]/g, '') // Strip non-alphanumeric characters (spaces, punctuation)
      .trim();
  };

  // Start game play
  const handleStartGame = async () => {
    let pool = [];

    setLoadingCards(true);
    try {
      if (selectedSource.startsWith('hsk')) {
        const level = parseInt(selectedSource.replace('hsk', ''), 10);
        const res = await dictionaryApi.getHskWords(level, 100);
        pool = res.data || [];
        pool = pool.filter(w => w && w.s && w.s.length <= 4);
      } else {
        // Custom deck cards mapped to standard dict layout
        const cards = deckCardsRef.current;
        pool = cards.map((c) => ({
          s: c.front,
          p: '',
          vi: c.back
        }));
      }
    } catch (err) {
      console.error('Failed to load game pool:', err);
    } finally {
      setLoadingCards(false);
    }

    if (pool.length === 0) {
      showToast('Nguồn từ vựng được chọn không có dữ liệu hoặc đang tải. Vui lòng chọn nguồn khác.', 'warning');
      return;
    }

    setWordPool(pool);
    
    // Spawn 3 staggered words immediately
    const initialWords = [];
    const count = Math.min(3, pool.length);
    const selectedIndices = new Set();
    
    for (let i = 0; i < count; i++) {
      let idx;
      do {
        idx = Math.floor(Math.random() * pool.length);
      } while (selectedIndices.has(idx) && selectedIndices.size < pool.length);
      selectedIndices.add(idx);
      
      const entry = pool[idx];
      const keyPinyins = [];
      if (entry.p) keyPinyins.push(normalizeText(entry.p));
      if (entry.pt) keyPinyins.push(normalizeText(entry.pt));
      if (entry.sp) keyPinyins.push(normalizeText(entry.sp));

      const keyVis = [];
      if (entry.vi) {
        const parts = entry.vi.split(/[/;,()]/);
        parts.forEach((p) => {
          const cleaned = normalizeText(p);
          if (cleaned) keyVis.push(cleaned);
        });
      }

      initialWords.push({
        id: `word_${Date.now()}_${i}_${Math.random()}`,
        word: entry,
        x: 10 + (i * 25) + Math.random() * 10, // Stagger horizontally
        y: -(i * 120) - 20, // Stagger vertically
        speed: 0.35 + Math.random() * 0.3,
        keyPinyins,
        keyVis
      });
    }

    setFallingWords(initialWords);
    setScore(0);
    setLives(3);
    setInputValue('');
    setGameOver(false);
    setIsPaused(false);
    setDestroyedWords([]);
    setMissedWords([]);
    setGameStarted(true);

    lastSpawnRef.current = Date.now();

    // Auto-focus input
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  };

  // Main game loop (Y coordinate update & auto spawn)
  const scoreRef = useRef(score);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    const gameTick = setInterval(() => {
      setFallingWords((prev) => {
        let missedCount = 0;
        const missedList = [];
        
        const nextWords = prev.map((w) => {
          const nextY = w.y + w.speed;
          if (nextY >= 470) { // Hit bottom (arena is 500px)
            missedCount++;
            missedList.push(w.word);
            return null;
          }
          return { ...w, y: nextY };
        }).filter(Boolean);

        if (missedCount > 0) {
          setMissedWords((m) => [...m, ...missedList]);
          setLives((l) => {
            const nextL = l - missedCount;
            if (nextL <= 0) {
              setGameOver(true);
              // Update high score
              setScore((finalScore) => {
                setHighScore((currHigh) => {
                   if (finalScore > currHigh) {
                     try {
                       localStorage.setItem('falling_words_highscore', finalScore.toString());
                     } catch (e) {
                       console.warn('Failed to save falling words highscore:', e);
                     }
                     return finalScore;
                   }
                  return currHigh;
                });
                return finalScore;
              });
            }
            return Math.max(0, nextL);
          });

          // Flash red effect
          setFlashRed(true);
          setTimeout(() => setFlashRed(false), 200);
        }

        // Spawn check (maintain at least 3 active falling words or trigger on spawn interval)
        const now = Date.now();
        const currentScore = scoreRef.current;
        const spawnInterval = Math.max(1000, 2600 - Math.min(1600, currentScore * 70));
        
        if (now - lastSpawnRef.current >= spawnInterval || nextWords.length < 3) {
          if (wordPool.length > 0) {
            const entry = wordPool[Math.floor(Math.random() * wordPool.length)];
            
            // Check if word is already falling
            if (!nextWords.some((w) => w.word.s === entry.s)) {
              const keyPinyins = [];
              if (entry.p) keyPinyins.push(normalizeText(entry.p));
              if (entry.pt) keyPinyins.push(normalizeText(entry.pt));
              if (entry.sp) keyPinyins.push(normalizeText(entry.sp));

              const keyVis = [];
              if (entry.vi) {
                const parts = entry.vi.split(/[/;,()]/);
                parts.forEach((p) => {
                  const cleaned = normalizeText(p);
                  if (cleaned) keyVis.push(cleaned);
                });
              }

              const x = 5 + Math.random() * 80;
              const speed = 0.35 + Math.random() * 0.3 + Math.min(1.2, currentScore * 0.015);

              nextWords.push({
                id: `word_${Date.now()}_${Math.random()}`,
                word: entry,
                x,
                y: -30,
                speed: Math.min(speed, 2.2),
                keyPinyins,
                keyVis
              });
              
              lastSpawnRef.current = now;
            }
          }
        }

        return nextWords;
      });

    }, 30);

    return () => clearInterval(gameTick);
  }, [gameStarted, gameOver, isPaused, wordPool]);

  // Save game records and weak words when game is over
  useEffect(() => {
    if (gameOver && gameStarted) {
      gameRecordsApi.save({
        gameType: 'FALLING_WORDS',
        level: selectedSource,
        score: score,
        details: {
          destroyedCount: destroyedWords.length,
          missedCount: missedWords.length,
          missedWords: missedWords.map(w => w.s),
        }
      }).catch(err => console.error('Error saving game record:', err));

      if (missedWords.length > 0) {
        const uniqueMissed = [];
        const seen = new Set();
        missedWords.forEach(w => {
          if (w && w.s && !seen.has(w.s)) {
            seen.add(w.s);
            uniqueMissed.push(w);
          }
        });

        Promise.all(
          uniqueMissed.map(w =>
            weakWordsApi.save({
              hanzi: w.s,
              pinyin: w.p || '',
              meaning: w.vi || '',
              source: 'FALLING_GAME'
            })
          )
        ).catch(err => console.error('Error saving weak words from falling game:', err));
      }
    }
  }, [gameOver, gameStarted, score, selectedSource, destroyedWords.length, missedWords]);

  // Input check on keystroke
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);

    const cleanedInput = normalizeText(val);
    if (!cleanedInput) return;

    // Find first matching active word
    let matchWord = null;
    
    for (const w of fallingWords) {
      const isMatchPinyin = w.keyPinyins.some((kp) => kp === cleanedInput);
      const isMatchVi = w.keyVis.some((kv) => kv === cleanedInput);

      if (isMatchPinyin || isMatchVi) {
        matchWord = w;
        break;
      }
    }

    if (matchWord) {
      // Correct Match!
      // Add explosion effect
      const newExplosion = {
        id: `expl_${Date.now()}`,
        x: matchWord.x,
        y: matchWord.y,
        text: matchWord.word.s
      };
      setExplosions((prev) => [...prev, newExplosion]);
      
      // Auto-remove explosion after 600ms
      setTimeout(() => {
        setExplosions((prev) => prev.filter((ex) => ex.id !== newExplosion.id));
      }, 600);

      // Remove from falling list
      setFallingWords((prev) => prev.filter((w) => w.id !== matchWord.id));
      
      // Add to reviews
      setDestroyedWords((prev) => [...prev, matchWord.word]);
      
      // Score update
      setScore((s) => s + 1);

      // Clear input
      setInputValue('');
    }
  };

  // Speech TTS handler
  const speakHanzi = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-hairline dark:border-divider-dark pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-bone dark:hover:bg-black text-mute cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink dark:text-on-dark tracking-tight flex items-center gap-2">
              <Zap size={22} className="text-amber-500 animate-pulse" />
              Gõ từ vựng rơi (Falling Words)
            </h1>
            <p className="text-xs text-mute mt-0.5">Thử thách phản xạ nhanh: Gõ pinyin hoặc nghĩa tiếng Việt để phá hủy các bong bóng chữ Hán.</p>
          </div>
        </div>
      </div>

      {!gameStarted ? (
        /* Configuration Screen */
        <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/40 p-8 text-center max-w-lg mx-auto space-y-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-500 mx-auto">
            <Zap size={24} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-ink dark:text-on-dark">Cấu hình phòng đấu</h2>
            <p className="text-xs text-mute leading-relaxed">
              Các từ chữ Hán sẽ rơi xuống. Gõ Pinyin (không dấu, viết liền) hoặc Nghĩa tiếng Việt của từ để bắn hạ chúng!
            </p>
          </div>

          <div className="space-y-4 text-left">
            <div>
              <label className="text-[10px] font-mono font-bold text-mute uppercase tracking-wider block mb-1.5">Nguồn từ vựng:</label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full bg-surface-bone dark:bg-black/35 border border-hairline dark:border-divider-dark text-sm font-semibold py-2 px-3 rounded-md outline-none text-ink dark:text-on-dark focus:ring-1 focus:ring-primary"
              >
                <option value="hsk1">Từ vựng HSK Cấp 1</option>
                <option value="hsk2">Từ vựng HSK Cấp 2</option>
                <option value="hsk3">Từ vựng HSK Cấp 3</option>
                <option value="hsk4">Từ vựng HSK Cấp 4</option>
                <option value="hsk5">Từ vựng HSK Cấp 5</option>
                <option value="hsk6">Từ vựng HSK Cấp 6</option>
                <option value="hsk7">Từ vựng HSK Cấp 7-9</option>
                {decks?.map((d) => (
                  <option key={d.id} value={`deck_${d.id}`}>Bộ bài: {d.title || d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono font-bold text-mute uppercase tracking-wider block mb-1.5 font-bold">Chế độ hiển thị gợi ý:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'none', label: 'Không hiện' },
                  { value: 'pinyin', label: 'Hiện Pinyin' },
                  { value: 'meaning', label: 'Hiện Nghĩa' }
                ].map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setHintMode(mode.value)}
                    className={`py-2 px-3 border rounded text-xs font-bold transition-all cursor-pointer ${
                      hintMode === mode.value
                        ? 'bg-primary border-transparent text-white shadow-xs'
                        : 'bg-surface-bone/50 dark:bg-black/20 border-hairline dark:border-divider-dark text-ink dark:text-on-dark hover:bg-surface-bone'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleStartGame}
            disabled={loadingCards}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/40 text-white font-bold rounded-md cursor-pointer transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
          >
            <Play size={16} />
            {loadingCards ? 'Đang chuẩn bị dữ liệu...' : 'Bắt đầu đấu trường'}
          </button>
        </div>
      ) : (
        /* Arcade Arena view */
        <div className="space-y-6">
          
          {/* Top Info HUD */}
          <div className="grid grid-cols-3 gap-4 bg-slate-900 border border-slate-800 p-4 rounded-md text-white items-center">
            
            {/* Lives Indicator */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mr-2">Mạng:</span>
              {[1, 2, 3].map((h) => (
                <Heart
                  key={h}
                  size={18}
                  className={`transition-colors duration-300 ${
                    lives >= h ? 'text-red-500 fill-red-500 animate-pulse' : 'text-slate-600'
                  }`}
                />
              ))}
            </div>

            {/* Score */}
            <div className="text-center flex flex-col justify-center items-center">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Điểm số</span>
              <span className="text-2xl font-mono font-extrabold text-amber-400">{score}</span>
            </div>

            {/* High Score / Level */}
            <div className="text-right flex flex-col justify-center items-end">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Kỷ lục của bạn</span>
              <span className="text-sm font-mono font-bold text-slate-300 flex items-center gap-1">
                <Trophy size={12} className="text-yellow-500" />
                {highScore}
              </span>
            </div>

          </div>

          {/* Core Arena Box */}
          <div 
            className={`w-full h-[500px] bg-slate-950 border rounded-lg relative overflow-hidden transition-colors duration-150 ${
              flashRed 
                ? 'border-red-600 shadow-[inset_0_0_40px_rgba(220,38,38,0.4)]' 
                : 'border-slate-800 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]'
            }`}
          >
            {/* Dark Space background effect */}
            <div className="absolute inset-0 bg-radial-grid opacity-10 pointer-events-none" />

            {/* Game state layers */}
            {isPaused && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20 space-y-4">
                <Pause size={40} className="text-amber-500 animate-bounce" />
                <h3 className="text-lg font-bold">Trò chơi tạm dừng</h3>
                <button
                  onClick={() => setIsPaused(false)}
                  className="px-6 py-2 bg-primary hover:bg-primary-deep text-white text-xs font-bold rounded-full cursor-pointer"
                >
                  Tiếp tục chơi
                </button>
              </div>
            )}

            {/* Falling Words List */}
            {fallingWords.length === 0 && !gameOver && (
              <div className="absolute inset-0 flex items-center justify-center text-center p-8 pointer-events-none select-none">
                <div className="space-y-1.5 opacity-30 text-white">
                  <Zap size={30} className="mx-auto animate-bounce" />
                  <p className="text-xs font-semibold">Chuẩn bị gõ các bong bóng từ sắp rơi xuống...</p>
                </div>
              </div>
            )}

            {fallingWords.map((item) => (
              <div
                key={item.id}
                style={{ 
                  left: `${item.x}%`, 
                  top: `${item.y}px`,
                  transform: 'translateX(-50%)'
                }}
                className="absolute transition-all duration-75 ease-linear flex flex-col items-center z-10"
              >
                {/* Word Bubble Capsule */}
                <div 
                  className="px-4 py-2.5 rounded-full border bg-slate-900/90 text-white shadow-lg flex flex-col items-center justify-center min-w-[70px] select-none hover:border-amber-400 transition-colors"
                  style={{
                    borderColor: 'rgba(245, 158, 11, 0.4)',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)'
                  }}
                >
                  <span className="text-lg font-bold font-display tracking-wide text-amber-200">
                    {item.word.s}
                  </span>
                  
                  {/* Hint tag inside bubble */}
                  {hintMode === 'pinyin' && item.word.p && (
                    <span className="text-[8px] font-mono text-slate-400 tracking-normal mt-0.5 max-w-[80px] truncate">
                      {item.word.p}
                    </span>
                  )}

                  {hintMode === 'meaning' && item.word.vi && (
                    <span className="text-[8px] text-slate-400 tracking-normal mt-0.5 max-w-[80px] truncate">
                      {cleanDefinition(item.word.vi, 12)}
                    </span>
                  )}
                </div>

                {/* Light tail trail */}
                <div className="w-[1px] h-4 bg-gradient-to-t from-transparent to-amber-500/30 opacity-60 mt-0.5" />
              </div>
            ))}

            {/* Burst / Explosion Animations */}
            {explosions.map((ex) => (
              <div
                key={ex.id}
                style={{ 
                  left: `${ex.x}%`, 
                  top: `${ex.y}px`,
                  transform: 'translate(-50%, -50%)'
                }}
                className="absolute pointer-events-none z-30 flex items-center justify-center"
              >
                {/* Exploding text */}
                <span className="text-2xl font-display font-extrabold text-amber-400 scale-up-out duration-500">
                  {ex.text}
                </span>
                
                {/* Concentric rings */}
                <div className="absolute h-16 w-16 rounded-full border border-amber-400 animate-ping opacity-60" />
                <div className="absolute h-10 w-10 rounded-full border border-teal-400 animate-ping opacity-80" />
              </div>
            ))}

          </div>

          {/* Typing Axis & Control Panel */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Input field */}
            <div className="md:col-span-7 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                disabled={isPaused || gameOver}
                placeholder="Gõ pinyin hoặc nghĩa tiếng Việt..."
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-md text-center py-3.5 px-4 text-xl font-bold tracking-wide outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-slate-600 placeholder:text-sm"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                inputMode="text"
              />
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 font-bold font-mono mt-1.5">
                <Info size={10} />
                <span>Không cần gõ dấu thanh hay khoảng cách</span>
              </div>
            </div>

            {/* In-game quick commands */}
            <div className="md:col-span-5 flex gap-2">
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className="flex-1 py-3 px-3 border border-slate-700 bg-slate-800 hover:bg-slate-750 text-white rounded-md font-bold text-xs cursor-pointer flex items-center justify-center gap-1"
              >
                {isPaused ? <Play size={13} /> : <Pause size={13} />}
                <span>{isPaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
              </button>

              <button
                type="button"
                onClick={() => setGameStarted(false)}
                className="flex-1 py-3 px-3 border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-md font-bold text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                title="Thoát phòng"
              >
                <ArrowLeft size={13} />
                <span>Thoát phòng</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* Game Over Bento Modal Report */}
      {gameOver && (
        <div 
          onClick={() => {
            setGameOver(false);
            setGameStarted(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-lg max-w-2xl w-full p-6 text-center space-y-6 shadow-2xl relative text-white max-h-[90vh] overflow-y-auto"
          >
            
            {/* Broken Heart or Trophy icon */}
            <div className="space-y-2">
              <div className="h-14 w-14 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <XCircle size={28} className="animate-pulse" />
              </div>
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-red-500">Mất hết mạng sống!</h2>
              <p className="text-xs text-slate-400">Tốc độ rơi quá nhanh đã làm cạn kiệt mạng sống của bạn.</p>
            </div>

            {/* Bento Grid Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded bg-slate-950 border border-slate-800 text-center">
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Điểm số đạt</span>
                <span className="text-2xl font-mono font-extrabold text-amber-400 mt-1 block">{score}</span>
              </div>
              <div className="p-4 rounded bg-slate-950 border border-slate-800 text-center">
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Đã tiêu diệt</span>
                <span className="text-2xl font-mono font-extrabold text-emerald-400 mt-1 block">{destroyedWords.length} từ</span>
              </div>
              <div className="p-4 rounded bg-slate-950 border border-slate-800 text-center">
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Kỷ lục cá nhân</span>
                <span className="text-2xl font-mono font-extrabold text-white mt-1 block">{highScore}</span>
              </div>
            </div>

            {/* Split lists: shot down vs missed reviews */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              
              {/* Missed Words */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle size={12} />
                  Cần ôn tập lại ({missedWords.length}):
                </h4>
                <div className="border border-slate-800 rounded bg-slate-950 max-h-[160px] overflow-y-auto p-2 divide-y divide-slate-800 text-[10px]">
                  {missedWords.length === 0 ? (
                    <div className="text-slate-600 italic py-4 text-center">Không bỏ lỡ từ nào! Hoàn hảo!</div>
                  ) : (
                    missedWords.map((item, idx) => (
                      <div key={idx} className="py-2 flex justify-between items-center first:pt-0 last:pb-0">
                        <div>
                          <span className="text-base font-bold text-red-300 font-display">{item.s}</span>
                          <span className="text-slate-400 font-mono ml-2">({item.p || 'N/A'})</span>
                        </div>
                        <div className="text-slate-500 text-[9px] italic max-w-[120px] truncate text-right">
                          {cleanDefinition(item.vi, 16)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Destroyed Words */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Từ vựng đã bắn hạ ({destroyedWords.length}):
                </h4>
                <div className="border border-slate-800 rounded bg-slate-950 max-h-[160px] overflow-y-auto p-2 divide-y divide-slate-800 text-[10px]">
                  {destroyedWords.length === 0 ? (
                    <div className="text-slate-600 italic py-4 text-center">Chưa bắn hạ được từ nào.</div>
                  ) : (
                    destroyedWords.map((item, idx) => (
                      <div key={idx} className="py-2 flex justify-between items-center first:pt-0 last:pb-0">
                        <div>
                          <span className="text-base font-bold text-emerald-300 font-display">{item.s}</span>
                          <span className="text-slate-400 font-mono ml-2">({item.p || 'N/A'})</span>
                        </div>
                        <button
                          onClick={() => speakHanzi(item.s)}
                          className="p-1 rounded hover:bg-slate-800 text-amber-500 shrink-0"
                          title="Nghe"
                        >
                          <Volume2 size={11} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setGameOver(false);
                  setGameStarted(false);
                }}
                className="flex-1 py-2.5 border border-slate-800 rounded-md text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Cấp độ khác
              </button>
              
              <button
                type="button"
                onClick={handleStartGame}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-md transition cursor-pointer shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={13} />
                Chơi lại ngay
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
