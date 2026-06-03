import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTodayStudy, submitReview } from '../features/study/studySlice';
import { fetchAllDecks } from '../features/deck/deckSlice';
import { studyApi } from '../services/studyApi';
import { flashcardApi } from '../services/flashcardApi';
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

// Writing Practice sub-component using hanzi-writer
function WritingPractice({ character }) {
  const containerRef = useRef(null);
  const writerRef = useRef(null);
  const [mode, setMode] = useState('idle'); // idle, quiz

  const cleanChar = character.split(/[｜|]/)[0].trim();
  const chars = Array.from(cleanChar);
  const [activeCharIndex, setActiveCharIndex] = useState(0);
  const targetChar = chars[activeCharIndex] || chars[0] || '';

  useEffect(() => {
    if (!containerRef.current || !window.HanziWriter || !targetChar) return;

    // Clear container
    containerRef.current.innerHTML = '';

    const isDark = document.documentElement.classList.contains('dark');
    const outlineColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(32, 32, 32, 0.12)';
    const strokeColor = '#54cbd4'; // primary teal
    const drawingColor = isDark ? '#87ecf2' : '#54cbd4'; // glow on dark, brand on light
    const radicalColor = '#2b9a66'; // success green

    // Create HanziWriter instance
    const writer = window.HanziWriter.create(containerRef.current, targetChar, {
      width: 200,
      height: 200,
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
  }, [targetChar]);

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
    writerRef.current.clearCanvas();
  };

  return (
    <div className="flex flex-col items-center gap-4 bg-surface-bone dark:bg-black/20 border border-hairline dark:border-divider-dark rounded-md p-5 w-full max-w-sm mx-auto shadow-sm">
      <span className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">Luyện Viết Chữ Hán</span>
      
      {chars.length > 1 && (
        <div className="flex gap-2 mb-2 select-none">
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
              Cố {i + 1}: {c}
            </button>
          ))}
        </div>
      )}

      {/* Target Canvas Container */}
      <div 
        className="relative bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-md p-2 aspect-square w-[220px] h-[220px] flex items-center justify-center"
      >
        <div ref={containerRef} id="hanzi-writer-canvas" className="w-[200px] h-[200px]" />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAnimate}
          className="px-3.5 py-2 bg-surface-card hover:bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark text-ink dark:text-on-dark text-xs font-mono font-semibold rounded-full transition-all cursor-pointer"
        >
          Xem nét
        </button>
        <button
          type="button"
          onClick={handleQuiz}
          className={`px-3.5 py-2 text-white text-xs font-mono font-semibold rounded-full shadow transition-all cursor-pointer ${
            mode === 'quiz' ? 'bg-primary/50' : 'bg-primary hover:bg-primary-deep'
          }`}
        >
          {mode === 'quiz' ? 'Đang viết...' : 'Luyện viết'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-3.5 py-2 bg-surface-bone hover:bg-surface-bone/70 dark:bg-surface-dark dark:hover:bg-surface-dark/70 text-ink dark:text-on-dark text-xs font-mono font-semibold rounded-full transition-all cursor-pointer border border-hairline dark:border-divider-dark"
        >
          Làm mới
        </button>
      </div>
      <p className="text-[10px] text-mute dark:text-on-dark-mute leading-relaxed text-center max-w-[240px]">
        {mode === 'quiz' 
          ? 'Hãy vẽ các nét theo đúng thứ tự hiển thị. Thư viện sẽ tự động chấm điểm nét vẽ của bạn.' 
          : 'Nhấn "Luyện viết" để bắt đầu thử viết, hoặc "Xem nét" để xem thứ tự các nét.'}
      </p>
    </div>
  );
}

// Speaking Practice sub-component using native Web Speech API
function SpeakingPractice({ character, pinyin }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState(null); // 'success', 'fail', null
  const recognitionRef = useRef(null);

  // Text to Speech Pronunciation Guide
  const handleSpeakGuide = () => {
    if (!window.speechSynthesis) {
      alert('Trình duyệt của bạn không hỗ trợ Text-to-Speech.');
      return;
    }
    const utterance = new SpeechSynthesisUtterance(character);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  // Start Speech Recognition
  const handleStartListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Trình duyệt của bạn không hỗ trợ nhận dạng giọng nói (Speech Recognition). Vui lòng thử trên Google Chrome hoặc Safari.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setResult(null);
    };

    recognition.onerror = (e) => {
      console.error(e);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (e) => {
      const spokenText = e.results[0][0].transcript;
      setTranscript(spokenText);

      const cleanSpoken = spokenText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '').trim();
      const cleanTarget = character.replace(/[｜|].*/g, '').trim();

      if (cleanSpoken.includes(cleanTarget) || cleanTarget.includes(cleanSpoken)) {
        setResult('success');
      } else {
        setResult('fail');
      }
    };

    recognition.start();
  };

  return (
    <div className="flex flex-col items-center gap-4 bg-surface-bone dark:bg-black/20 border border-hairline dark:border-divider-dark rounded-md p-5 w-full max-w-sm mx-auto shadow-sm">
      <span className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">Luyện Phát Âm</span>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSpeakGuide}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-card hover:bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark text-primary dark:text-primary shadow-sm transition-all cursor-pointer text-sm"
          title="Nghe phát âm chuẩn"
        >
          🔊
        </button>

        <button
          type="button"
          onClick={handleStartListening}
          className={`flex px-5 py-2.5 rounded-full text-xs font-mono font-bold transition-all shadow-sm active:scale-95 cursor-pointer items-center gap-2 ${
            isListening 
              ? 'bg-red-650 hover:bg-red-700 text-white animate-pulse' 
              : 'bg-primary hover:bg-primary-deep text-white'
          }`}
        >
          🎙️ {isListening ? 'Đang nghe...' : 'Nói ngay'}
        </button>
      </div>

      {transcript && (
        <div className="text-center space-y-1 mt-1">
          <p className="text-xs font-medium text-mute dark:text-on-dark-mute">
            Bạn vừa nói: <strong className="text-ink dark:text-on-dark">"{transcript}"</strong>
          </p>
          {result === 'success' && (
            <p className="text-xs font-bold text-badge-success flex items-center justify-center gap-1">
              ✓ Phát âm chính xác!
            </p>
          )}
          {result === 'fail' && (
            <p className="text-xs font-bold text-red-600 flex items-center justify-center gap-1">
              ✗ Chưa chính xác. Hãy nghe lại và thử lại.
            </p>
          )}
        </div>
      )}

      <p className="text-[10px] text-mute dark:text-on-dark-mute leading-relaxed text-center max-w-[240px]">
        Nhấp 🔊 để nghe phát âm mẫu của từ <strong className="font-mono">"{pinyin}"</strong>, nhấp 🎙️ rồi đọc theo để kiểm tra khả năng phát âm của bạn.
      </p>
    </div>
  );
}

// AI Example Box dynamic generator & database persistence
function AIExampleBox({ card, onExampleUpdated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const hasExample = card.exampleHanzi && card.examplePinyin && card.exampleMeaning;

  const handleSpeakExample = (e) => {
    e.stopPropagation();
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(card.exampleHanzi);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  const handleGenerate = async (e) => {
    e.stopPropagation();
    setLoading(true);
    setError(null);

    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    if (!apiKey) {
      setError('Lỗi: Chưa cấu hình VITE_DEEPSEEK_API_KEY trong file .env');
      setLoading(false);
      return;
    }

    try {
      const prompt = `Hãy tạo một câu ví dụ tiếng Trung giao tiếp cực kỳ đơn giản và thực tế trình độ HSK 1 chứa từ khóa: "${card.hanzi}" (Pinyin: ${card.pinyin}).
Yêu cầu trả về đúng định dạng JSON như sau, không kèm bất kỳ ký tự nào ngoài JSON, không bọc trong markdown codeblock:
{
  "exampleHanzi": "chữ giản thể của câu ví dụ",
  "examplePinyin": "phiên âm pinyin tương ứng",
  "exampleMeaning": "dịch nghĩa tiếng Việt tự nhiên nhất"
}`;

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-v4-flash',
          messages: [
            { role: 'system', content: 'You are a professional Chinese language teacher. Return only valid raw JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const resJson = await response.json();
      const content = resJson.choices[0].message.content.trim();
      const cleaned = content.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleaned);

      if (!parsed.exampleHanzi || !parsed.examplePinyin || !parsed.exampleMeaning) {
        throw new Error('Dữ liệu AI trả về thiếu trường bắt buộc.');
      }

      // Save to database
      await flashcardApi.update(card.id, {
        exampleHanzi: parsed.exampleHanzi,
        examplePinyin: parsed.examplePinyin,
        exampleMeaning: parsed.exampleMeaning
      });

      // Update parent React state
      onExampleUpdated(card.id, parsed);

    } catch (err) {
      console.error(err);
      setError(`Lỗi: ${err.message || 'Không thể tạo ví dụ. Thử lại sau.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-md p-6 text-left space-y-4 shadow-sm transition-colors">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider flex items-center gap-1.5">
          ✨ Câu ví dụ minh họa
        </h4>
        {!loading && !hasExample && (
          <button
            type="button"
            onClick={handleGenerate}
            className="flex items-center gap-1.5 px-4.5 py-2 bg-primary hover:bg-primary-deep text-white rounded-full text-xs font-mono font-bold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            ⚡ Tạo ví dụ bằng AI
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-mute dark:text-on-dark-mute py-3 text-xs font-mono">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span>AI đang suy nghĩ câu ví dụ phù hợp...</span>
        </div>
      )}

      {error && (
        <p className="text-xs font-mono font-semibold text-red-650">{error}</p>
      )}

      {hasExample && (
        <div className="space-y-2 relative pr-12 group">
          <button
            type="button; button-icon"
            onClick={handleSpeakExample}
            className="absolute top-1 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-surface-card hover:bg-surface-bone border border-hairline dark:bg-surface-dark dark:border-divider-dark text-mute dark:text-on-dark-mute hover:text-primary shadow-sm transition-all cursor-pointer"
            title="Đọc câu ví dụ"
          >
            🔊
          </button>
          
          <p className="text-2xl font-display font-bold text-ink dark:text-on-dark leading-relaxed">
            {card.exampleHanzi}
          </p>
          <p className="text-sm font-mono font-semibold text-primary dark:text-primary">
            {card.examplePinyin}
          </p>
          <p className="text-xs font-medium text-body dark:text-on-dark-mute italic">
            {card.exampleMeaning}
          </p>
        </div>
      )}

      {!loading && !hasExample && !error && (
        <p className="text-xs text-mute dark:text-on-dark-mute italic leading-relaxed">
          Hiện tại từ vựng này chưa có câu ví dụ trong bộ thẻ. Nhấp nút "Tạo ví dụ bằng AI" để tự động tạo câu ví dụ HSK đơn giản, giải nghĩa và pinyin đi kèm.
        </p>
      )}
    </div>
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

  const [showWriting, setShowWriting] = useState(false);
  const [showSpeaking, setShowSpeaking] = useState(false);

  // Reset writing/speaking practice sub-panels on card change
  useEffect(() => {
    setShowWriting(false);
    setShowSpeaking(false);
  }, [currentIndex]);

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

  const handleExampleUpdated = (cardId, exampleData) => {
    setActiveQueue((prevQueue) =>
      prevQueue.map((c) =>
        c.id === cardId
          ? {
              ...c,
              exampleHanzi: exampleData.exampleHanzi,
              examplePinyin: exampleData.examplePinyin,
              exampleMeaning: exampleData.exampleMeaning,
              example: `${exampleData.exampleHanzi} (${exampleData.examplePinyin}) - ${exampleData.exampleMeaning}`
            }
          : c
      )
    );

    setAllCards((prevCards) =>
      prevCards.map((c) =>
        c.id === cardId
          ? {
              ...c,
              exampleHanzi: exampleData.exampleHanzi,
              examplePinyin: exampleData.examplePinyin,
              exampleMeaning: exampleData.exampleMeaning,
              example: `${exampleData.exampleHanzi} (${exampleData.examplePinyin}) - ${exampleData.exampleMeaning}`
            }
          : c
      )
    );
  };

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
      <div className="flex min-h-[70vh] items-center justify-center p-6 bg-canvas dark:bg-surface-dark">
        <div className="max-w-md w-full bg-surface-card dark:bg-surface-dark/60 border border-hairline dark:border-divider-dark rounded-md p-10 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-6">
            <CheckCircle size={36} />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-ink dark:text-on-dark tracking-tight">Hoàn thành buổi học!</h1>
          <p className="mt-3 text-sm text-body dark:text-on-dark-mute leading-6 font-sans">
            Tuyệt vời! Bạn đã hoàn thành tất cả {activeQueue.length} từ vựng đã chọn. Hãy tiếp tục duy trì thói quen học tập hàng ngày nhé!
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => {
                setIsStudyFinished(false);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className="w-full py-3 bg-primary hover:bg-primary-deep text-white font-mono font-bold rounded-full transition-colors cursor-pointer shadow-sm active:scale-[0.99]"
            >
              Học lại danh sách này
            </button>
            <button
              onClick={() => {
                setIsStudyStarted(false);
                setIsStudyFinished(false);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className="w-full py-3 bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-ink dark:text-on-dark font-mono font-bold rounded-full transition-colors cursor-pointer"
            >
              Quay lại cấu hình
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
        <div className="flex items-center justify-between border-b border-hairline dark:border-divider-dark pb-4">
          <button
            onClick={handleQuitStudy}
            className="flex items-center gap-2 text-mute hover:text-ink dark:text-on-dark-mute dark:hover:text-on-dark font-mono font-bold text-xs cursor-pointer"
          >
            <ArrowLeft size={14} />
            Thoát
          </button>
          <div className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute">
            THẺ {currentIndex + 1} / {activeQueue.length}
          </div>
          <div className="px-3 py-1 bg-surface-bone dark:bg-black/30 border border-hairline dark:border-divider-dark text-primary text-[10px] font-mono font-bold rounded-full">
            {studyMode === 'srs' ? 'Spaced Repetition' : 'Classic Mode'}
          </div>
        </div>

        {/* Keyboard Shortcuts Helper Guide */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-mute dark:text-on-dark-mute bg-surface-bone/50 dark:bg-black/10 py-2 px-4 rounded-full max-w-xl mx-auto border border-hairline dark:border-divider-dark font-mono">
          <HelpCircle size={12} className="text-primary" />
          <span>Cách / Enter: Lật thẻ</span>
          <span>•</span>
          <span>Phím ←: Quay lại</span>
          <span>•</span>
          <span>Phím →: Tiếp theo</span>
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
            <div className="text-mute dark:text-on-dark-mute font-mono">Lỗi: Không tìm thấy thẻ bài.</div>
          )}
        </div>

        {/* Footer controls: Unified buttons for BOTH modes */}
        <div className="mt-8 flex flex-col items-center justify-center w-full max-w-xl mx-auto space-y-6">
          
          {/* Spaced Repetition Panel (shown only in SRS mode) */}
          {studyMode === 'srs' && (
            <div className="w-full text-center">
              {isFlipped ? (
                <div className="w-full bg-surface-card dark:bg-surface-dark/40 border border-hairline dark:border-divider-dark rounded-md p-5 shadow-sm">
                  <SRSButtons onRate={handleRate} />
                </div>
              ) : (
                <div className="py-4 bg-surface-bone/50 dark:bg-black/20 border border-dashed border-hairline dark:border-divider-dark rounded-md text-xs text-mute dark:text-on-dark-mute font-semibold">
                  Chạm vào thẻ để lật xem nghĩa (hoặc phím Cách)
                </div>
              )}
            </div>
          )}

          {/* Interactive Tools Panel: Writing, Speaking, and AI Example (Shown when flipped) */}
          {currentCard && isFlipped && (
            <div className="w-full space-y-6">
              {/* Practice Mode Toggle Buttons */}
              <div className="flex gap-4 w-full px-4">
                <button
                  type="button"
                  onClick={() => setShowWriting((prev) => !prev)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-full transition-all cursor-pointer text-xs font-mono font-bold shadow-sm ${
                    showWriting
                      ? 'bg-primary text-white border-transparent'
                      : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
                  }`}
                >
                  ✍️ {showWriting ? 'Ẩn luyện viết' : 'Luyện viết'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSpeaking((prev) => !prev)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-full transition-all cursor-pointer text-xs font-mono font-bold shadow-sm ${
                    showSpeaking
                      ? 'bg-primary text-white border-transparent'
                      : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
                  }`}
                >
                  🎙️ {showSpeaking ? 'Ẩn luyện nói' : 'Luyện nói'}
                </button>
              </div>

              {/* Conditional Sub-panels */}
              {showWriting && (
                <div className="w-full transition-all duration-300">
                  <WritingPractice character={currentCard.hanzi} />
                </div>
              )}

              {showSpeaking && (
                <div className="w-full transition-all duration-300">
                  <SpeakingPractice character={currentCard.hanzi} pinyin={currentCard.pinyin} />
                </div>
              )}

              {/* AI Example Sentence Generator & Reader */}
              <div className="w-full px-4">
                <AIExampleBox card={currentCard} onExampleUpdated={handleExampleUpdated} />
              </div>
            </div>
          )}

          {/* Unified Navigation Buttons (Back & Next) */}
          <div className="flex items-center justify-between gap-6 w-full px-4 pt-2">
            <button
              type="button"
              onClick={handlePrevClassic}
              disabled={currentIndex === 0}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-surface-card hover:bg-surface-bone disabled:opacity-40 dark:bg-surface-dark dark:hover:bg-black text-ink dark:text-on-dark font-mono font-bold rounded-full transition-all cursor-pointer border border-hairline dark:border-divider-dark"
            >
              <ArrowLeft size={14} />
              Quay lại
            </button>
            
            <button
              type="button"
              onClick={studyMode === 'srs' ? handleSkip : handleNextClassic}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary-deep text-white font-mono font-bold rounded-full transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <span>{currentIndex === activeQueue.length - 1 ? 'Hoàn thành' : 'Tiếp theo'}</span>
              <ArrowRight size={14} />
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
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-sm shrink-0">
          <BlossomIcon className="h-8 w-8" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink dark:text-on-dark tracking-tight">Flashcard Study</h1>
          <p className="text-mute dark:text-on-dark-mute text-sm mt-1">
            Lật thẻ để kiểm tra trí nhớ. Đánh dấu từ bạn đã biết, ôn tập từ bạn chưa thuộc.
          </p>
        </div>
      </div>

      {/* Row: Bộ bài Selector */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">Chọn bộ bài để học</h3>
        <div className="relative max-w-md">
          <select
            value={selectedDeckId}
            onChange={(e) => setSelectedDeckId(e.target.value)}
            className="w-full px-5 py-3 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full shadow-sm text-sm text-ink dark:text-on-dark font-semibold outline-none cursor-pointer hover:bg-surface-bone dark:hover:bg-black transition-all"
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
        <h3 className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">Chế độ học</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Spaced Repetition Block */}
          <button
            onClick={() => setStudyMode('srs')}
            className={`p-6 rounded-md border transition-all text-left flex items-start gap-4 cursor-pointer hover:shadow-sm ${
              studyMode === 'srs'
                ? 'bg-primary border-transparent text-white'
                : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
            }`}
          >
            <div className={`p-3 rounded-full ${
              studyMode === 'srs' 
                ? 'bg-white/20 text-white' 
                : 'bg-surface-bone dark:bg-black/35 text-primary'
            }`}>
              <Clock size={24} />
            </div>
            <div>
              <div className="font-display font-extrabold text-base">Spaced Repetition</div>
              <p className={`text-xs mt-1 leading-5 ${studyMode === 'srs' ? 'text-white/80' : 'text-mute dark:text-on-dark-mute'}`}>
                Ôn tập thông minh. Thẻ tự động nhắc lại dựa theo thuật toán ghi nhớ SM-2.
              </p>
              <div className={`mt-3 inline-flex items-center px-2.5 py-1 text-[10px] font-mono font-bold rounded-full uppercase ${
                studyMode === 'srs'
                  ? 'bg-white/20 text-white'
                  : 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary'
              }`}>
                {todayCards.length} thẻ đến hạn hôm nay
              </div>
            </div>
          </button>

          {/* Classic Mode Block */}
          <button
            onClick={() => setStudyMode('classic')}
            className={`p-6 rounded-md border transition-all text-left flex items-start gap-4 cursor-pointer hover:shadow-sm ${
              studyMode === 'classic'
                ? 'bg-primary border-transparent text-white'
                : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
            }`}
          >
            <div className={`p-3 rounded-full ${
              studyMode === 'classic' 
                ? 'bg-white/20 text-white' 
                : 'bg-surface-bone dark:bg-black/35 text-primary'
            }`}>
              <Layers size={24} />
            </div>
            <div>
              <div className="font-display font-extrabold text-base">Classic Mode</div>
              <p className={`text-xs mt-1 leading-5 ${studyMode === 'classic' ? 'text-white/80' : 'text-mute dark:text-on-dark-mute'}`}>
                Học tự do toàn bộ thẻ. Lướt qua và học theo thứ tự tăng dần mà không chấm điểm.
              </p>
              <div className={`mt-3 inline-flex items-center px-2.5 py-1 text-[10px] font-mono font-bold rounded-full uppercase ${
                studyMode === 'classic'
                  ? 'bg-white/20 text-white'
                  : 'bg-surface-bone text-mute dark:bg-black/30 dark:text-on-dark-mute'
              }`}>
                Học theo thứ tự tự do
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Row: MẶT TRƯỚC THẺ */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">Mặt trước thẻ</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setFrontFaceMode('hanzi')}
            className={`px-6 py-2.5 rounded-full text-xs font-mono font-bold cursor-pointer transition-all border ${
              frontFaceMode === 'hanzi'
                ? 'bg-primary border-transparent text-white shadow-sm'
                : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
            }`}
          >
            Hiện Hán tự (Hanzi First)
          </button>
          <button
            onClick={() => setFrontFaceMode('meaning')}
            className={`px-6 py-2.5 rounded-full text-xs font-mono font-bold cursor-pointer transition-all border ${
              frontFaceMode === 'meaning'
                ? 'bg-primary border-transparent text-white shadow-sm'
                : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
            }`}
          >
            Hiện nghĩa (Meaning First)
          </button>
        </div>
      </div>

      {/* Sticky Bottom Action Footer Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-55 bg-canvas/90 dark:bg-surface-dark/95 backdrop-blur border-t border-hairline dark:border-divider-dark shadow-sm py-4">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-mute dark:text-on-dark-mute text-[10px] font-mono font-bold uppercase tracking-wider">Trạng thái lựa chọn</span>
            <span className="text-ink dark:text-on-dark text-lg font-extrabold mt-0.5 font-mono">
              {filteredQueue.length} từ đã chọn
            </span>
          </div>

          <button
            onClick={handleStartStudy}
            className="px-6 py-3 bg-primary hover:bg-primary-deep text-white font-mono font-bold rounded-full transition-all shadow-sm cursor-pointer flex items-center gap-2"
          >
            <span>Bắt đầu học</span>
            <Play size={14} fill="currentColor" />
          </button>
        </div>
      </div>

    </div>
  );
}
