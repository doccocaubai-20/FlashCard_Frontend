import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTodayStudy, submitReview } from '../features/study/studySlice';
import { fetchAllDecks } from '../features/deck/deckSlice';
import { studyApi } from '../services/studyApi';
import Flashcard from '../components/flashcard/Flashcard';
import SRSButtons from '../components/study/SRSButtons';
import { 
  BookOpen, 
  Layers, 
  Clock, 
  Play, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

// SVG blossom logo
function BlossomIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C11.5 3.5 9.5 4.5 8 4.5C6.5 4.5 5.5 3.5 5 2C4 3 3 5 4 6.5C5 8 7 8.5 7.5 10C6 10.5 4.5 10 3 9.5C2 10.5 2 12.5 3.5 13C5 13.5 6.5 12.5 8 13.5C8.5 15 7.5 17 6.5 18C7.5 19 9.5 19 10.5 17.5C11.5 16 11.5 14 12.5 14.5C13.5 14 13.5 16 14.5 17.5C15.5 19 17.5 19 18.5 18C17.5 17 16.5 15 17 13.5C18.5 12.5 20 13.5 21.5 13C23 12.5 23 10.5 22 9.5C20.5 10 19 10.5 17.5 10C18 8.5 20 8 21 6.5C22 5 21 3 20 2C19.5 3.5 18.5 4.5 17 4.5C15.5 4.5 13.5 3.5 13 2H12Z" />
    </svg>
  );
}

export default function StudyScreen() {
  const dispatch = useDispatch();
  
  // Redux study state
  const todayCards = useSelector((state) => state.study.todayCards);
  const isLoadingToday = useSelector((state) => state.study.isLoading);
  
  // Redux decks list
  const decks = useSelector((state) => state.deck.decks);

  // Client local states
  const [allCards, setAllCards] = useState([]);
  const [isAllCardsLoading, setIsAllCardsLoading] = useState(false);
  const [isStudyStarted, setIsStudyStarted] = useState(false);
  
  // Configurator preferences
  const [selectedDeckId, setSelectedDeckId] = useState('all');
  const [studyMode, setStudyMode] = useState('srs'); // srs, classic
  const [frontFaceMode, setFrontFaceMode] = useState('hanzi'); // hanzi, meaning
  const [showPinyinOnFront, setShowPinyinOnFront] = useState(false);

  // Study player state
  const [activeQueue, setActiveQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isStudyFinished, setIsStudyFinished] = useState(false);

  // Load backend cards on mount
  useEffect(() => {
    const loadAllCards = async () => {
      try {
        setIsAllCardsLoading(true);
        const res = await studyApi.getAllCards();
        setAllCards(res.data || []);
      } catch (e) {
        console.error('Failed to load all cards:', e);
      } finally {
        setIsAllCardsLoading(false);
      }
    };
    loadAllCards();
    dispatch(fetchAllDecks());
  }, [dispatch]);

  // Load today study cards depending on selectedDeckId
  useEffect(() => {
    dispatch(fetchTodayStudy(selectedDeckId === 'all' ? undefined : Number(selectedDeckId)));
  }, [dispatch, selectedDeckId]);

  // Compute filtered queue dynamically based on selected deck and study mode
  const filteredQueue = useMemo(() => {
    let list = studyMode === 'srs' ? todayCards : allCards;
    if (selectedDeckId !== 'all') {
      list = list.filter((c) => c.deckId === Number(selectedDeckId));
    }
    return list;
  }, [studyMode, todayCards, allCards, selectedDeckId]);

  // Start study session
  const handleStartStudy = () => {
    if (filteredQueue.length === 0) {
      alert('Không tìm thấy từ vựng nào khớp với cấu hình học của bạn!');
      return;
    }

    setActiveQueue(filteredQueue);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsStudyFinished(false);
    setIsStudyStarted(true);
  };

  // Back to config panel
  const handleQuitStudy = () => {
    setIsStudyStarted(false);
  };

  // Flip card helper
  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  // Skip / Next card without scoring
  const handleSkip = () => {
    setIsFlipped(false);
    if (currentIndex < activeQueue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsStudyFinished(true);
    }
  };

  // Spaced Repetition rating score submission
  const handleRate = async (rating) => {
    const currentCard = activeQueue[currentIndex];
    if (!currentCard) return;

    try {
      if (studyMode === 'srs') {
        // Dispatch to backend database
        await dispatch(submitReview({ cardId: currentCard.id, rating })).unwrap();
      }
      
      // Move next
      setIsFlipped(false);
      if (currentIndex < activeQueue.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsStudyFinished(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Classic Mode navigation
  const handleNextClassic = () => {
    setIsFlipped(false);
    if (currentIndex < activeQueue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsStudyFinished(true);
    }
  };

  const handlePrevClassic = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    if (!isStudyStarted || isStudyFinished) return;

    const handleKeyDown = (e) => {
      // Ignore if writing text
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (studyMode === 'srs') {
          handleSkip();
        } else {
          handleNextClassic();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevClassic();
      } else if (studyMode === 'srs') {
        if (e.key === '1') {
          e.preventDefault();
          handleRate(1);
        } else if (e.key === '2') {
          e.preventDefault();
          handleRate(2);
        } else if (e.key === '3') {
          e.preventDefault();
          handleRate(3);
        } else if (e.key === '4') {
          e.preventDefault();
          handleRate(4);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isStudyStarted, isStudyFinished, studyMode, currentIndex, isFlipped, activeQueue]);

  // Finished study screen
  if (isStudyStarted && isStudyFinished) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-6">
            <CheckCircle size={36} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Hoàn thành buổi học!</h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-6">
            Tuyệt vời! Bạn đã hoàn thành tất cả {activeQueue.length} từ vựng đã chọn. Hãy tiếp tục duy trì thói quen học tập hàng ngày nhé!
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => {
                setIsStudyFinished(false);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors cursor-pointer shadow-md hover:shadow-lg shadow-indigo-500/10 active:scale-[0.99]"
            >
              Học lại danh sách này
            </button>
            <button
              onClick={handleQuitStudy}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-2xl transition-colors cursor-pointer"
            >
              Quay lại màn hình cài đặt
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active study page
  if (isStudyStarted) {
    const currentCard = activeQueue[currentIndex];
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <button
            onClick={handleQuitStudy}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-semibold text-sm cursor-pointer"
          >
            <ArrowLeft size={16} />
            Thoát
          </button>
          <div className="text-sm font-bold text-slate-500 dark:text-slate-400">
            Thẻ {currentIndex + 1} / {activeQueue.length}
          </div>
          <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full">
            {studyMode === 'srs' ? 'Spaced Repetition' : 'Classic Mode'}
          </div>
        </div>

        {/* Keyboard Shortcuts Helper Guide */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 dark:text-slate-500 bg-slate-100/50 dark:bg-slate-900/50 py-2 px-4 rounded-xl max-w-xl mx-auto border border-slate-200/40 dark:border-slate-800/50">
          <HelpCircle size={12} className="text-slate-400 dark:text-slate-500" />
          <span>Cách / Enter: Lật thẻ</span>
          <span>•</span>
          <span>Phím ← : Quay lại</span>
          <span>•</span>
          <span>Phím → : Tiếp theo</span>
          {studyMode === 'srs' && (
            <>
              <span>•</span>
              <span>Phím 1-4: Đánh giá nhanh</span>
            </>
          )}
        </div>

        {/* Flashcard Area */}
        <div className="flex flex-col items-center justify-center pt-4">
          {currentCard ? (
            <Flashcard 
              cardData={currentCard} 
              isFlipped={isFlipped} 
              onFlip={handleFlip} 
              frontFaceMode={frontFaceMode}
              showPinyinOnFront={showPinyinOnFront}
              onTogglePinyinOnFront={() => setShowPinyinOnFront((prev) => !prev)}
            />
          ) : (
            <div className="text-slate-500 dark:text-slate-400">Lỗi: Không tìm thấy thẻ bài.</div>
          )}
        </div>

        {/* Footer controls: Unified buttons for BOTH modes */}
        <div className="mt-8 flex flex-col items-center justify-center w-full max-w-xl mx-auto">
          
          {/* Spaced Repetition Panel (shown only in SRS mode) */}
          {studyMode === 'srs' && (
            <div className="w-full mb-6 text-center">
              {isFlipped ? (
                <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 shadow-md">
                  <SRSButtons onRate={handleRate} />
                </div>
              ) : (
                <div className="py-4 bg-slate-50 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Chạm vào thẻ để lật xem nghĩa (hoặc phím Cách)
                </div>
              )}
            </div>
          )}

          {/* Unified Navigation Buttons (Back & Next) */}
          <div className="flex items-center justify-between gap-6 w-full px-4">
            <button
              type="button"
              onClick={handlePrevClassic}
              disabled={currentIndex === 0}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:disabled:bg-[#121824] dark:disabled:text-slate-700 text-slate-700 dark:text-slate-200 font-extrabold rounded-2xl transition-all cursor-pointer border border-transparent dark:border-slate-800/50"
            >
              <ArrowLeft size={16} />
              Quay lại
            </button>
            
            <button
              type="button"
              onClick={studyMode === 'srs' ? handleSkip : handleNextClassic}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl transition-all cursor-pointer shadow-md hover:shadow-lg shadow-indigo-500/10 active:scale-[0.98]"
            >
              <span>{currentIndex === activeQueue.length - 1 ? 'Hoàn thành' : 'Tiếp theo'}</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </div>
    );
  }

  // Study Configurator View (Default)
  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6 pb-32">
      
      {/* Brand & Title Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
          <BlossomIcon className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-855 dark:text-slate-100">Flashcard Study</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Lật thẻ để kiểm tra trí nhớ. Đánh dấu từ bạn đã biết, ôn tập từ bạn chưa thuộc.
          </p>
        </div>
      </div>

      {/* Row: Bộ bài Selector */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Chọn bộ bài để học</h3>
        <div className="relative max-w-md">
          <select
            value={selectedDeckId}
            onChange={(e) => setSelectedDeckId(e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-sm text-slate-800 dark:text-slate-200 font-semibold outline-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <option value="all">Tất cả các bộ bài</option>
            {decks?.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.title || deck.name} {deck.isSystem ? '(Hệ thống)' : '(Tự tạo)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row: STUDY MODE selector */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Chế độ học</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Spaced Repetition Block */}
          <button
            onClick={() => setStudyMode('srs')}
            className={`p-6 rounded-3xl border transition-all text-left flex items-start gap-4 cursor-pointer hover:shadow-md ${
              studyMode === 'srs'
                ? 'bg-indigo-600 border-transparent text-white shadow-lg shadow-indigo-100 dark:shadow-none'
                : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className={`p-3 rounded-2xl ${
              studyMode === 'srs' 
                ? 'bg-white/20 text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-indigo-600'
            }`}>
              <Clock size={24} />
            </div>
            <div>
              <div className="font-bold text-base">Spaced Repetition</div>
              <p className={`text-xs mt-1 leading-5 ${studyMode === 'srs' ? 'text-white/80' : 'text-slate-550'}`}>
                Ôn tập thông minh. Thẻ tự động nhắc lại dựa theo thuật toán ghi nhớ SM-2.
              </p>
              <div className={`mt-3 inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${
                studyMode === 'srs'
                  ? 'bg-white/20 text-white'
                  : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400'
              }`}>
                {todayCards.length} thẻ đến hạn hôm nay
              </div>
            </div>
          </button>

          {/* Classic Mode Block */}
          <button
            onClick={() => setStudyMode('classic')}
            className={`p-6 rounded-3xl border transition-all text-left flex items-start gap-4 cursor-pointer hover:shadow-md ${
              studyMode === 'classic'
                ? 'bg-indigo-600 border-transparent text-white shadow-lg shadow-indigo-100 dark:shadow-none'
                : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className={`p-3 rounded-2xl ${
              studyMode === 'classic' 
                ? 'bg-white/20 text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-indigo-600'
            }`}>
              <Layers size={24} />
            </div>
            <div>
              <div className="font-bold text-base">Classic Mode</div>
              <p className={`text-xs mt-1 leading-5 ${studyMode === 'classic' ? 'text-white/80' : 'text-slate-550'}`}>
                Học tự do toàn bộ thẻ. Lướt qua và học theo thứ tự tăng dần mà không chấm điểm.
              </p>
              <div className={`mt-3 inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${
                studyMode === 'classic'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                Học theo thứ tự tự do
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Row: MẶT TRƯỚC THẺ */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mặt trước thẻ</h3>
        <div className="flex gap-4">
          <button
            onClick={() => setFrontFaceMode('hanzi')}
            className={`px-6 py-3 rounded-2xl text-sm font-bold cursor-pointer transition-all border ${
              frontFaceMode === 'hanzi'
                ? 'bg-indigo-600 border-transparent text-white shadow-md'
                : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Hiện Hán tự (Hanzi First)
          </button>
          <button
            onClick={() => setFrontFaceMode('meaning')}
            className={`px-6 py-3 rounded-2xl text-sm font-bold cursor-pointer transition-all border ${
              frontFaceMode === 'meaning'
                ? 'bg-indigo-600 border-transparent text-white shadow-md'
                : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Hiện nghĩa (Meaning First)
          </button>
        </div>
      </div>

      {/* Sticky Bottom Action Footer Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-55 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-t border-slate-200 dark:border-slate-800 shadow-lg py-4">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Trạng thái lựa chọn</span>
            <span className="text-slate-800 dark:text-slate-200 text-lg font-black mt-0.5">
              {filteredQueue.length} từ đã chọn
            </span>
          </div>

          <button
            onClick={handleStartStudy}
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer flex items-center gap-2"
          >
            <span>Bắt đầu học</span>
            <Play size={16} fill="currentColor" />
          </button>
        </div>
      </div>

    </div>
  );
}
