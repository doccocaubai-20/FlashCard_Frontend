import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAllDecks, fetchFlashcardsByDeck } from '../features/deck/deckSlice';
import { dictionaryApi } from '../services/dictionaryApi';
import { cleanDefinition } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import { statsApi } from '../services/statsApi';
import { gameRecordsApi } from '../services/learningApi';
import { 
  Gamepad2, 
  Timer, 
  RotateCcw, 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  Volume2, 
  ArrowLeft 
} from 'lucide-react';

export default function MatchingGameScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  // No local useDictionary needed
  const decks = useSelector((state) => state.deck.decks);

  // Game configuration states
  const [selectedSource, setSelectedSource] = useState('hsk1'); // hsk1, hsk2, hsk3, deck_<id>
  const [deckCards, setDeckCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);

  // Game play states
  const [cards, setCards] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState([]); // Currently clicked card indices (max 2)
  const [matchedWordIds, setMatchedWordIds] = useState(new Set()); // IDs of matched pairs
  const [failedIndices, setFailedIndices] = useState([]); // Temporary red indicators on mismatch
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  // Statistics
  const [moves, setMoves] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const timerRef = useRef(null);

  // Save game records when game is won
  useEffect(() => {
    if (gameWon && gameStarted) {
      const finalScore = Math.max(0, 100 - mistakes * 10);
      gameRecordsApi.save({
        gameType: 'MATCHING',
        level: selectedSource,
        score: finalScore,
        accuracy: moves > 0 ? parseFloat(((moves - mistakes) / moves).toFixed(2)) : 0,
        duration: seconds,
        details: {
          moves,
          mistakes,
          seconds,
        }
      }).catch(err => console.error('Error saving matching game record:', err));
    }
  }, [gameWon, gameStarted, score, selectedSource, moves, mistakes, seconds]);

  // Fetch all decks on mount
  useEffect(() => {
    dispatch(fetchAllDecks());
  }, [dispatch]);

  // Load custom deck cards if selected
  useEffect(() => {
    if (selectedSource.startsWith('deck_')) {
      const deckId = selectedSource.replace('deck_', '');
      setLoadingCards(true);
      dispatch(fetchFlashcardsByDeck(deckId))
        .unwrap()
        .then((cards) => {
          setDeckCards(cards || []);
          setLoadingCards(false);
        })
        .catch((err) => {
          console.error(err);
          setLoadingCards(false);
        });
    }
  }, [selectedSource, dispatch]);

  // Timer logic
  useEffect(() => {
    if (gameStarted && !gameWon) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameStarted, gameWon]);

  // Generate game board
  const setupGame = async () => {
    let pool = [];

    if (selectedSource.startsWith('hsk')) {
      const level = parseInt(selectedSource.replace('hsk', ''));
      setLoadingCards(true);
      try {
        const res = await dictionaryApi.getHskWords(level, 100);
        pool = res.data || [];
        pool = pool.filter(w => w && w.s && w.s.length <= 3);
      } catch (err) {
        console.error('Failed to load matching game words:', err);
      } finally {
        setLoadingCards(false);
      }
    } else {
      // Custom deck cards
      pool = deckCards.map((c) => ({
        s: c.front,
        p: '',
        vi: c.back
      }));
    }

    if (pool.length < 6) {
      showToast('Không đủ từ vựng (tối thiểu 6 từ) để bắt đầu trò chơi.', 'error');
      return;
    }

    // Select 6 random unique words
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 6);

    // Create 12 cards (6 fronts - Hanzi, 6 backs - Pinyin/Meaning)
    const generatedCards = [];
    selected.forEach((word, index) => {
      const wordId = `word_${index}`;
      
      // Card 1: Hanzi
      generatedCards.push({
        id: `${wordId}_front`,
        wordId,
        type: 'front',
        text: word.s,
        original: word
      });

      // Card 2: Meaning/Pinyin
      const cleanVi = cleanDefinition(word.vi, 40);
      const backText = word.p ? `${word.p} — ${cleanVi}` : cleanVi;
      generatedCards.push({
        id: `${wordId}_back`,
        wordId,
        type: 'back',
        text: backText,
        original: word
      });
    });

    // Shuffle the 12 cards
    const shuffledCards = generatedCards.sort(() => 0.5 - Math.random());
    setCards(shuffledCards);
    setSelectedIndices([]);
    setMatchedWordIds(new Set());
    setFailedIndices([]);
    setMoves(0);
    setMistakes(0);
    setSeconds(0);
    setGameStarted(true);
    setGameWon(false);
  };

  const handleCardClick = (index) => {
    if (!gameStarted || gameWon) return;

    // Ignore if click is already matched or selected
    const card = cards[index];
    if (matchedWordIds.has(card.wordId)) return;
    if (selectedIndices.includes(index)) return;
    if (selectedIndices.length >= 2) return; // Wait for flip back

    const newSelected = [...selectedIndices, index];
    setSelectedIndices(newSelected);

    if (newSelected.length === 2) {
      const idx1 = newSelected[0];
      const idx2 = newSelected[1];
      const card1 = cards[idx1];
      const card2 = cards[idx2];
      setMoves((m) => m + 1);

      // Check if they are of different types and match the same word ID
      if (card1.type !== card2.type && card1.wordId === card2.wordId) {
        // Match found!
        setTimeout(() => {
          setMatchedWordIds((prev) => {
            const next = new Set(prev);
            next.add(card1.wordId);
            if (next.size === 6) {
              setGameWon(true);
              statsApi.incrementQuestProgress('PLAY_GAME', 1).catch(err => console.error(err));
            }
            return next;
          });
          setSelectedIndices([]);
        }, 300);
      } else {
        // Mismatch!
        setMistakes((m) => m + 1);
        setFailedIndices(newSelected);
        setTimeout(() => {
          setSelectedIndices([]);
          setFailedIndices([]);
        }, 800);
      }
    }
  };

  const speakHanzi = (e, text) => {
    e.stopPropagation();
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate stats
  const accuracy = moves > 0 ? Math.round(((6) / moves) * 100) : 0;
  const score = Math.max(0, 100 - mistakes * 10);

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
              <Gamepad2 size={22} className="text-primary" />
              Nối từ chữ Hán
            </h1>
            <p className="text-xs text-mute mt-0.5">Luyện phản xạ nhận diện Hán tự bằng cách ghép đôi chính xác.</p>
          </div>
        </div>
      </div>

      {!gameStarted ? (
        /* Setup / Configuration Panel */
        <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/40 p-8 text-center max-w-lg mx-auto space-y-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary mx-auto">
            <Gamepad2 size={24} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-ink dark:text-on-dark">Cấu hình phòng chơi</h2>
            <p className="text-xs text-mute leading-relaxed">Chọn nguồn từ vựng để bắt đầu trò chơi ghép đôi chữ Hán.</p>
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
          </div>

          <button
            onClick={setupGame}
            disabled={loadingCards}
            className="w-full py-2.5 bg-primary hover:bg-primary-deep text-white font-bold rounded-md cursor-pointer transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
          >
            {loadingCards ? 'Đang tải dữ liệu...' : 'Bắt đầu chơi'}
          </button>
        </div>
      ) : (
        /* Game Board Area */
        <div className="space-y-6">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 bg-surface-bone/50 dark:bg-black/20 p-4 border border-hairline dark:border-divider-dark rounded-md">
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-[9px] font-mono font-bold text-mute uppercase tracking-widest">Thời gian</span>
              <span className="text-lg font-mono font-bold text-ink dark:text-on-dark flex items-center gap-1 mt-0.5">
                <Timer size={14} className="text-primary" />
                {formatTime(seconds)}
              </span>
            </div>
            
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-[9px] font-mono font-bold text-mute uppercase tracking-widest">Độ chính xác</span>
              <span className="text-lg font-mono font-bold text-ink dark:text-on-dark mt-0.5">
                {accuracy}%
              </span>
            </div>

            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-[9px] font-mono font-bold text-mute uppercase tracking-widest">Sai sót</span>
              <span className="text-lg font-mono font-bold text-ink dark:text-on-dark mt-0.5">
                {mistakes} lỗi
              </span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {cards.map((card, index) => {
              const isSelected = selectedIndices.includes(index);
              const isMatched = matchedWordIds.has(card.wordId);
              const isFailed = failedIndices.includes(index);

              return (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(index)}
                  className={`h-28 rounded-md border flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all duration-300 relative select-none shadow-xs hover:shadow-md ${
                    isMatched
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 opacity-60 scale-95 pointer-events-none'
                      : isFailed
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-500/80 text-red-600 dark:text-red-400 scale-95 animate-pulse'
                      : isSelected
                      ? 'bg-primary/15 border-primary text-primary ring-2 ring-primary/40 shadow-[0_0_12px_rgba(15,82,87,0.3)] dark:shadow-[0_0_15px_rgba(15,82,87,0.55)]'
                      : 'bg-surface-card hover:bg-surface-bone/35 dark:bg-surface-dark dark:hover:bg-black/30 border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
                  }`}
                >
                  {/* Speaker helper button inside Hanzi card */}
                  {card.type === 'front' && !isMatched && (
                    <button
                      onClick={(e) => speakHanzi(e, card.text)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full hover:bg-surface-bone dark:hover:bg-black text-mute hover:text-primary transition-colors cursor-pointer"
                      title="Nghe phát âm"
                    >
                      <Volume2 size={11} />
                    </button>
                  )}

                  {/* Icon states */}
                  {isMatched && (
                    <div className="absolute top-1.5 right-1.5 text-emerald-500">
                      <CheckCircle2 size={12} />
                    </div>
                  )}
                  {isFailed && (
                    <div className="absolute top-1.5 right-1.5 text-red-500">
                      <XCircle size={12} />
                    </div>
                  )}

                  <div className={`font-medium ${card.type === 'front' ? 'text-2xl font-display font-extrabold' : 'text-xs leading-relaxed font-mono font-bold text-charcoal dark:text-on-dark-mute'}`}>
                    {card.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setGameStarted(false)}
              className="px-4 py-2 border border-hairline dark:border-divider-dark rounded-full text-xs font-semibold text-mute hover:text-ink hover:bg-surface-bone dark:hover:bg-black cursor-pointer"
            >
              Đổi nguồn từ vựng
            </button>

            <button
              onClick={setupGame}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-deep text-white font-mono font-bold text-xs rounded-full cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              <RotateCcw size={12} />
              Chơi lại
            </button>
          </div>
        </div>
      )}

      {/* Game Won Bento Modal Report */}
      {gameWon && (
        <div 
          onClick={() => {
            setGameWon(false);
            setGameStarted(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-lg max-w-lg w-full p-6 text-center space-y-6 shadow-2xl relative"
          >
            
            {/* Header */}
            <div className="space-y-2">
              <div className="h-14 w-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Trophy size={28} className="animate-bounce" />
              </div>
              <h2 className="font-display text-2xl font-extrabold text-ink dark:text-on-dark tracking-tight">Chiến thắng xuất sắc!</h2>
              <p className="text-xs text-mute">Bạn đã ghép đôi chính xác tất cả các quân bài chữ Hán.</p>
            </div>

            {/* Bento Grid Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded bg-surface-bone/50 dark:bg-black/25 border border-hairline dark:border-divider-dark text-center">
                <span className="text-[9px] font-mono font-bold text-mute uppercase tracking-widest block">Thời gian</span>
                <span className="text-xl font-mono font-bold text-primary dark:text-primary-deep mt-1 block">{formatTime(seconds)}</span>
              </div>
              <div className="p-4 rounded bg-surface-bone/50 dark:bg-black/25 border border-hairline dark:border-divider-dark text-center">
                <span className="text-[9px] font-mono font-bold text-mute uppercase tracking-widest block">Số lượt đi</span>
                <span className="text-xl font-mono font-bold text-ink dark:text-on-dark mt-1 block">{moves} lần</span>
              </div>
              <div className="p-4 rounded bg-surface-bone/50 dark:bg-black/25 border border-hairline dark:border-divider-dark text-center">
                <span className="text-[9px] font-mono font-bold text-mute uppercase tracking-widest block">Độ chính xác</span>
                <span className="text-xl font-mono font-bold text-ink dark:text-on-dark mt-1 block">{accuracy}%</span>
              </div>
              <div className="p-4 rounded bg-surface-bone/50 dark:bg-black/25 border border-hairline dark:border-divider-dark text-center">
                <span className="text-[9px] font-mono font-bold text-mute uppercase tracking-widest block">Điểm số</span>
                <span className="text-xl font-mono font-bold text-emerald-500 mt-1 block">{score}/100</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setGameWon(false);
                  setGameStarted(false);
                }}
                className="flex-1 py-2.5 border border-hairline dark:border-divider-dark rounded-md text-xs font-bold text-mute hover:text-ink hover:bg-surface-bone dark:hover:bg-black transition cursor-pointer"
              >
                Chọn bài mới
              </button>
              <button
                type="button"
                onClick={setupGame}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-deep text-white font-bold rounded-md transition cursor-pointer shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={14} />
                Chơi lại
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
