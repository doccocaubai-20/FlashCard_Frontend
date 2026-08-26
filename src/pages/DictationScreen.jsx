import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Volume2, CheckCircle2, XCircle, ArrowRight, Trophy, Clock } from 'lucide-react';
import { studyApi } from '../services/studyApi';
import { favoriteWordsApi } from '../services/favoriteWordsApi';
import { fetchDeckDetails } from '../features/deck/deckSlice';
import { useDispatch } from 'react-redux';
import hsk1Data from '../data/tu_vung_hsk1.json';

export default function DictationScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Game States
  const [gameMode, setGameMode] = useState('pinyin'); // pinyin or hanzi
  const [isPlaying, setIsPlaying] = useState(false); // whether game has started
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Scoring
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectWords, setIncorrectWords] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isFinished, setIsFinished] = useState(false);


  // Timer Effect
  useEffect(() => {
    if (!startTime || isFinished) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.round((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, isFinished]);

  // Load cards
  useEffect(() => {
    const loadCards = async () => {
      try {
        setLoading(true);
        let wordList = [];

        if (id === 'favorites') {
          const res = await favoriteWordsApi.getFavorites();
          wordList = (res.data || []).map((f) => ({
            id: f.id,
            hanzi: f.hanzi,
            pinyin: f.pinyin,
            meaning: f.vi,
          }));
        } else if (id) {
          dispatch(fetchDeckDetails(id));
          const res = await studyApi.getAllCards(Number(id));
          const deckCards = res.data || [];
          wordList = deckCards.map((c) => ({
            id: c.id,
            hanzi: c.character || c.hanzi,
            pinyin: c.pinyin,
            meaning: c.meaning,
          }));
        }

        // If deck is empty or small, mix in HSK 1 fallback
        if (wordList.length < 3) {
          // Flatten HSK 1 database cards
          const hskCards = (hsk1Data || []).slice(0, 20).map((h, index) => ({
            id: `hsk1-${index}`,
            hanzi: h.character || h.hanzi || h.word,
            pinyin: h.pinyin || h.p,
            meaning: h.vietnamese || h.vi || h.translation,
          }));
          wordList = [...wordList, ...hskCards];
        }

        // Shuffle cards using Fisher-Yates
        for (let i = wordList.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [wordList[i], wordList[j]] = [wordList[j], wordList[i]];
        }

        // Take max 10 cards for a session
        setCards(wordList.slice(0, 10));
      } catch (err) {
        console.error('Failed to load dictation cards:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, [id, dispatch]);

  const activeCard = cards[currentIndex];

  const handleSpeak = (text) => {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.75;
    window.speechSynthesis.speak(utterance);
  };

  // Play sound when card activates
  useEffect(() => {
    if (isPlaying && activeCard && !isAnswered) {
      handleSpeak(activeCard.hanzi);
    }
  }, [isPlaying, currentIndex, isAnswered]);

  const startSession = (mode) => {
    setGameMode(mode);
    setIsPlaying(true);
    setCurrentIndex(0);
    setUserInput('');
    setIsAnswered(false);
    setCorrectCount(0);
    setIncorrectWords([]);
    setElapsedTime(0);
    setStartTime(Date.now());
    setIsFinished(false);
  };

  // Normalize string for checking (remove diacritics for Pinyin, clean spacing)
  const normalizeText = (text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove pinyin marks
      .replace(/[vü]/g, 'u') // map variants
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '') // strip special characters and spaces
      .trim();
  };

  const handleCheck = (e) => {
    if (e) e.preventDefault();
    if (isAnswered || !userInput.trim()) return;

    const cleanInput = userInput.trim();
    const correct = gameMode === 'hanzi'
      ? cleanInput === activeCard.hanzi
      : (normalizeText(cleanInput) === normalizeText(activeCard.pinyin) ||
        cleanInput.toLowerCase().replace(/\s+/g, '') === activeCard.pinyin.toLowerCase().replace(/\s+/g, ''));

    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setIncorrectWords((prev) => [...prev, activeCard]);
    }
  };

  const handleNext = () => {
    setUserInput('');
    setIsAnswered(false);

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-mute">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="text-sm font-medium">Đang soạn đề chính tả...</span>
      </div>
    );
  }

  // Pre-game Screen
  if (!isPlaying) {
    return (
      <div className="max-w-md mx-auto py-12 space-y-6">
        <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-md p-8 text-center shadow-sm">
          <div className="h-16 w-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center text-primary mb-5">
            <Volume2 size={32} />
          </div>
          <h2 className="font-display text-2xl font-extrabold text-ink dark:text-on-dark tracking-tight">Nghe viết chính tả</h2>
          <p className="text-sm text-body dark:text-on-dark-mute mt-3 leading-relaxed">
            Hệ thống sẽ phát âm từ vựng tiếng Trung, nhiệm vụ của bạn là gõ lại phiên âm Pinyin hoặc chữ Hán chính xác.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => startSession('pinyin')}
              className="w-full py-3 bg-primary hover:bg-primary-deep text-white font-mono font-bold rounded-full transition-all cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0"
            >
              Nghe ghi Phiên âm (Pinyin)
            </button>
            <button
              onClick={() => startSession('hanzi')}
              className="w-full py-3 bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-ink dark:text-on-dark font-mono font-bold rounded-full transition-colors cursor-pointer"
            >
              Nghe viết Chữ Hán
            </button>
          </div>

          <button
            onClick={() => navigate(id === 'favorites' ? '/decks' : `/decks/${id}`)}
            className="mt-6 text-xs text-mute hover:text-ink dark:hover:text-on-dark font-semibold cursor-pointer block mx-auto hover:underline"
          >
            Quay lại chi tiết bộ bài
          </button>
        </div>
      </div>
    );
  }

  // Game Board
  if (!isFinished) {
    return (
      <div className="max-w-xl mx-auto space-y-6 select-none pb-12 text-left">

        {/* Progress Bar & Exit */}
        <div className="flex justify-between items-center border-b border-hairline dark:border-divider-dark pb-4">
          <button
            onClick={() => setIsPlaying(false)}
            className="flex items-center gap-1.5 text-mute hover:text-ink dark:hover:text-on-dark font-mono font-bold text-xs cursor-pointer"
          >
            <ArrowLeft size={14} />
            Dừng chơi
          </button>

          <div className="flex items-center gap-3">
            <div className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute">
              Thời gian: {formatTime(elapsedTime)}
            </div>
            <span className="text-mute">•</span>
            <div className="text-xs font-mono font-bold text-primary">
              Thẻ {currentIndex + 1} / {cards.length}
            </div>
          </div>
        </div>

        {/* Play Card */}
        <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-md p-8 shadow-sm flex flex-col items-center gap-6 relative">

          {/* Main Speak button */}
          <button
            onClick={() => handleSpeak(activeCard.hanzi)}
            className="h-28 w-28 rounded-full bg-primary/5 hover:bg-primary/10 border-2 border-primary/25 hover:border-primary/50 text-primary flex items-center justify-center transition-all cursor-pointer shadow-inner active:scale-95 group"
            title="Nghe lại phát âm"
          >
            <Volume2 size={44} className="group-hover:scale-105 transition-transform" />
          </button>

          <div className="text-center">
            <h3 className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">
              {gameMode === 'pinyin' ? 'Nhập phiên âm Pinyin của từ vừa nghe' : 'Gõ lại chữ Hán chính xác'}
            </h3>
            {gameMode === 'pinyin' && (
              <p className="text-[10px] text-mute dark:text-on-dark-mute/70 mt-1">
                (Chấp nhận gõ không dấu, ví dụ: <strong>wo shi</strong> thay cho <strong>wǒ shì</strong>)
              </p>
            )}
          </div>

          {/* Form check */}
          <form onSubmit={handleCheck} className="w-full space-y-4 max-w-sm">
            <input
              type="text"
              autoFocus
              disabled={isAnswered}
              placeholder={gameMode === 'pinyin' ? 'Ví dụ: ni hao' : 'Ví dụ: 你好'}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="w-full text-center px-4 py-3 bg-surface-card dark:bg-surface-dark border-2 border-hairline dark:border-divider-dark rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-display text-lg font-bold text-ink dark:text-on-dark placeholder:opacity-40"
            />

            {!isAnswered ? (
              <button
                type="submit"
                disabled={!userInput.trim()}
                className={`w-full py-3 text-white font-mono font-bold text-xs rounded-full transition-all cursor-pointer shadow-sm hover:shadow active:scale-95 ${userInput.trim() ? 'bg-primary hover:bg-primary-deep' : 'bg-primary/40 cursor-not-allowed'
                  }`}
              >
                Kiểm tra kết quả
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3 bg-ink hover:bg-black dark:bg-primary dark:hover:bg-primary-deep text-white font-mono font-bold text-xs rounded-full transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
              >
                Tiếp tục
                <ArrowRight size={14} />
              </button>
            )}
          </form>

          {/* Result Feedback Banner */}
          {isAnswered && (
            <div
              style={{
                backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                borderColor: isCorrect ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'
              }}
              className={`w-full border-2 rounded-xl p-4 flex gap-3.5 items-start mt-2 animate-fade-in ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
            >
              <div className="shrink-0 mt-0.5">
                {isCorrect ? <CheckCircle2 size={20} className="text-green-500" /> : <XCircle size={20} className="text-red-500" />}
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-sm font-bold">{isCorrect ? 'Chúc mừng! Bạn đã gõ đúng!' : 'Chưa chính xác!'}</h4>
                <div className="mt-2 text-ink dark:text-on-dark space-y-1">
                  <div>Chữ Hán: <strong className="text-lg font-display"><span className="hanzi-char">{activeCard.hanzi}</span></strong></div>
                  <div>Phiên âm: <strong className="font-mono font-bold text-primary">{activeCard.pinyin}</strong></div>
                  <div className="text-xs text-mute dark:text-on-dark-mute mt-1">Ý nghĩa: {activeCard.meaning}</div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    );
  }

  // Victory / Final Results Dashboard
  const accuracy = Math.round((correctCount / cards.length) * 100);

  return (
    <div className="max-w-xl mx-auto pt-6 pb-12 select-none text-left">
      <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-md p-8 text-center shadow-lg animate-in fade-in zoom-in-95 duration-300 space-y-6">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary animate-bounce">
          <Trophy size={36} />
        </div>

        <div>
          <h2 className="font-display text-2xl font-extrabold text-ink dark:text-on-dark tracking-tight">Hoàn thành buổi chính tả!</h2>
          <p className="text-xs text-mute dark:text-on-dark-mute mt-1">Kết quả luyện viết nghe phát âm của bạn.</p>
        </div>

        {/* Bento grid scorecard */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-bone/50 dark:bg-black/25 p-4 rounded-md border border-hairline dark:border-divider-dark">
            <span className="text-[10px] font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider block">Tỷ lệ đúng</span>
            <span className="text-3xl font-extrabold font-mono text-primary mt-1 block">{accuracy}%</span>
            <span className="text-xs text-mute mt-1 block">({correctCount} / {cards.length} câu)</span>
          </div>

          <div className="bg-surface-bone/50 dark:bg-black/25 p-4 rounded-md border border-hairline dark:border-divider-dark">
            <span className="text-[10px] font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider block">Thời gian</span>
            <span className="text-3xl font-extrabold font-mono text-ink dark:text-on-dark mt-1 block flex justify-center items-center gap-1.5">
              <Clock size={20} className="text-mute shrink-0" />
              {formatTime(elapsedTime)}
            </span>
            <span className="text-xs text-mute mt-1 block">Tốc độ: {Math.round(elapsedTime / cards.length)}s / từ</span>
          </div>
        </div>

        {/* Incorrect words recap */}
        {incorrectWords.length > 0 && (
          <div className="text-left space-y-3">
            <h4 className="text-xs font-mono font-bold text-ink dark:text-on-dark uppercase tracking-wider">Từ vựng cần ôn lại ({incorrectWords.length})</h4>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {incorrectWords.map((word, idx) => (
                <div key={idx} className="bg-surface-bone/35 dark:bg-black/10 p-3 rounded-md border border-hairline dark:border-divider-dark flex justify-between items-center text-xs">
                  <div>
                    <span className="text-base font-extrabold text-ink dark:text-on-dark font-display"><span className="hanzi-char">{word.hanzi}</span></span>
                    <span className="font-mono font-bold text-primary ml-2">{word.pinyin}</span>
                    <p className="text-mute dark:text-on-dark-mute mt-1 font-medium leading-relaxed">{word.meaning}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => navigate(`/dictionary?word=${encodeURIComponent(word.hanzi)}`)}
                      className="px-2.5 py-1 bg-surface-card hover:bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full font-bold cursor-pointer transition-colors"
                    >
                      Tra từ
                    </button>
                    <button
                      onClick={() => navigate(`/write?word=${encodeURIComponent(word.hanzi)}`)}
                      className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-full font-bold cursor-pointer transition-colors"
                    >
                      Tập viết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions panel */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => setIsPlaying(false)}
            className="w-full py-3 bg-primary hover:bg-primary-deep text-white font-mono font-bold rounded-full transition-all cursor-pointer shadow-sm hover:shadow active:scale-95"
          >
            Chơi lượt chơi mới
          </button>
          <button
            onClick={() => navigate(id === 'favorites' ? '/decks' : `/decks/${id}`)}
            className="w-full py-3 bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-ink dark:text-on-dark font-mono font-bold rounded-full transition-colors cursor-pointer"
          >
            Quay lại chi tiết bộ bài
          </button>
        </div>

      </div>
    </div>
  );
}
