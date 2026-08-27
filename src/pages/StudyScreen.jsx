import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchTodayStudy, submitReview, setTodayCards } from '../features/study/studySlice';
import { fetchAllDecks } from '../features/deck/deckSlice';
import { useToast } from '../context/ToastContext';
import { studyApi } from '../services/studyApi';
import { getItem, setItem } from '../utils/indexedDB';
import Flashcard from '../components/flashcard/Flashcard';
import HoverableText from '../components/common/HoverableText';
import SRSButtons from '../components/study/SRSButtons';
import {
  Layers,
  Clock,
  Play,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Star
} from 'lucide-react';
import { favoriteWordsApi } from '../services/favoriteWordsApi';
import { speakChinese, getBestVoice } from '../utils/tts';
import { flashcardApi } from '../services/flashcardApi';
import { dictionaryHistoryApi } from '../services/dictionaryHistoryApi';

const TOPICS = {
  1: { name: 'Cơ thể & Sinh học' },
  2: { name: 'Sức khỏe & Y tế' },
  3: { name: 'Tâm lý & Nhận thức' },
  4: { name: 'Thời trang & Chăm sóc' },
  5: { name: 'Gia đình & Vòng đời' },
  6: { name: 'Giao tiếp & Tương tác' },
  7: { name: 'Giáo dục & Học thuật' },
  8: { name: 'Tôn giáo & Triết học' },
  9: { name: 'Địa lý & Cảnh quan' },
  10: { name: 'Khí hậu & Thời tiết' },
  11: { name: 'Hệ sinh thái Động - Thực vật' },
  12: { name: 'Vũ trụ & Thiên văn' },
  13: { name: 'Thương mại & Tài chính' },
  14: { name: 'Nghề nghiệp & Việc làm' },
  15: { name: 'Chính trị & Pháp luật' },
  16: { name: 'Quân sự & Quốc phòng' },
  17: { name: 'Nghệ thuật & Biểu diễn' },
  18: { name: 'Ẩm thực & Đồ uống' },
  19: { name: 'Thể thao & Trò chơi' },
  20: { name: 'Du lịch & Khách sạn' },
  21: { name: 'Khoa học tự nhiên & Đo lường' },
  22: { name: 'Công nghệ thông tin & Viễn thông' },
  23: { name: 'Kỹ thuật & Sản xuất' },
  24: { name: 'Giao thông & Hạ tầng' },
};

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
  const [showOutline, setShowOutline] = useState(false);
  const { showToast } = useToast();

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
      showOutline: showOutline,
      strokeColor,
      outlineColor,
      drawingColor,
      radicalColor,
      highlightColor: '#ff6a3d',
      showCharacter: true
    });

    writerRef.current = writer;
    setMode('idle');
  }, [targetChar, showOutline]);

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
      onComplete: (_summary) => {
        showToast('Tuyệt vời! Bạn đã viết chính xác từ này!', 'success');
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
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono transition-all cursor-pointer ${activeCharIndex === i
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
          className={`px-3.5 py-2 text-white text-xs font-mono font-semibold rounded-full shadow transition-all cursor-pointer ${mode === 'quiz' ? 'bg-primary/50' : 'bg-primary hover:bg-primary-deep'
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

      <label className="flex items-center gap-2 text-xs font-bold text-mute dark:text-on-dark-mute cursor-pointer select-none">
        <input
          type="checkbox"
          checked={showOutline}
          onChange={(e) => setShowOutline(e.target.checked)}
          className="rounded text-primary focus:ring-primary border-hairline dark:border-white/10"
        />
        Hiện nét gợi ý
      </label>

      <p className="text-[10px] text-mute dark:text-on-dark-mute leading-relaxed text-center max-w-[240px]">
        {mode === 'quiz'
          ? 'Hãy vẽ các nét theo đúng thứ tự hiển thị. Thư viện sẽ tự động chấm điểm nét vẽ của bạn.'
          : 'Nhấn "Luyện viết" để bắt đầu thử viết, hoặc "Xem nét" để xem thứ tự các nét.'}
      </p>
    </div>
  );
}

// Speaking Practice sub-component using native Web Speech API and MediaRecorder
function SpeakingPractice({ character, pinyin, lang = 'zh-CN' }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState(null); // 'success', 'fail', null
  const [audioUrl, setAudioUrl] = useState(null);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const { showToast } = useToast();

  const handleSpeakGuide = () => {
    speakChinese(character, lang);
  };

  const handlePlayRecording = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch((err) => {
        console.error('Playback error:', err);
      });
    }
  };

  // Start Speech Recognition & MediaRecorder
  const handleStartListening = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Trình duyệt của bạn không hỗ trợ nhận dạng giọng nói (Speech Recognition). Vui lòng thử trên Google Chrome hoặc Safari.', 'warning');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    // 1. Request microphone and start recording
    let audioStream;
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setAudioUrl(null); // Clear previous recording

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        audioStream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
    } catch (err) {
      console.error('Error starting media recorder:', err);
      showToast('Không thể truy cập microphone. Vui lòng cấp quyền micro cho trang web!', 'warning');
      return;
    }

    // 2. Start Speech Recognition
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
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
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };

    recognition.onresult = (e) => {
      const spokenText = e.results[0][0].transcript;
      setTranscript(spokenText);

      const cleanSpoken = spokenText.replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, '').trim();
      const cleanTarget = character.replace(/[｜|].*/g, '').trim();

      if (cleanSpoken.includes(cleanTarget) || cleanTarget.includes(cleanSpoken)) {
        setResult('success');
      } else {
        setResult('fail');
      }
    };

    recognition.start();
  };

  // Clean up URL object on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

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
          className={`flex px-5 py-2.5 rounded-full text-xs font-mono font-bold transition-all shadow-sm active:scale-95 cursor-pointer items-center gap-2 ${isListening
              ? 'bg-red-650 hover:bg-red-700 text-white animate-pulse'
              : 'bg-primary hover:bg-primary-deep text-white'
            }`}
        >
          🎙️ {isListening ? 'Đang nghe...' : 'Nói ngay'}
        </button>

        {audioUrl && (
          <button
            type="button"
            onClick={handlePlayRecording}
            className="flex h-10 px-4 items-center justify-center rounded-full bg-amber-500 hover:bg-amber-600 text-white font-mono text-xs font-bold shadow-sm transition-all cursor-pointer gap-1.5"
            title="Nghe lại phát âm của bạn"
          >
            🎧 Nghe lại
          </button>
        )}
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
        Nhấp 🔊 để nghe phát âm mẫu, nhấp 🎙️ rồi đọc theo để kiểm tra và nhấn 🎧 để nghe lại giọng nói của bạn.
      </p>
    </div>
  );
}

// AI Example Box dynamic generator & database persistence
function AIExampleBox({ card, onExampleUpdated, lang = 'zh-CN', aiLimit, loadAiLimit }) {
  const isEnglish = lang === 'en-US';
  const hasExample = card.exampleHanzi && (isEnglish || card.examplePinyin) && card.exampleMeaning;
  const [isGenerating, setIsGenerating] = useState(false);
  const { showToast } = useToast();

  const handleSpeakExample = (e) => {
    e.stopPropagation();
    speakChinese(card.exampleHanzi, lang);
  };

  const handleGenerateExample = async (e) => {
    e.stopPropagation();
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await flashcardApi.generateAIExample(card.id);
      if (res.data) {
        onExampleUpdated?.(card.id, res.data);
        showToast('Đoạn câu ví dụ đã được tạo bằng AI thành công!', 'success');
        loadAiLimit?.();
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi gọi AI tạo ví dụ.';
      showToast(errMsg, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-md p-6 text-left space-y-4 shadow-sm transition-colors">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider flex items-center gap-1.5">
          ✨ Câu ví dụ minh họa
        </h4>
        {aiLimit && (
          <span className="text-[10px] font-mono font-bold text-mute dark:text-on-dark-mute">
            Còn lại: <strong className="text-primary">{Math.max(0, aiLimit.limit - aiLimit.count)}/{aiLimit.limit}</strong> lượt AI
          </span>
        )}
      </div>

      {hasExample ? (
        <div className="space-y-4 relative pr-12 group">
          <button
            type="button; button-icon"
            onClick={handleSpeakExample}
            className="absolute top-1 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-surface-card hover:bg-surface-bone border border-hairline dark:bg-surface-dark dark:border-divider-dark text-mute dark:text-on-dark-mute hover:text-primary shadow-sm transition-all cursor-pointer"
            title="Đọc câu ví dụ"
          >
            🔊
          </button>

          <div className="space-y-2">
            <p className="text-2xl font-display font-bold text-ink dark:text-on-dark leading-relaxed">
              {isEnglish ? <span>{card.exampleHanzi}</span> : <HoverableText text={card.exampleHanzi} />}
            </p>
            {!isEnglish && card.examplePinyin && (
              <p className="text-sm font-mono font-semibold text-primary dark:text-primary">
                {card.examplePinyin}
              </p>
            )}
            <p className="text-xs font-medium text-body dark:text-on-dark-mute italic">
              {card.exampleMeaning}
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleGenerateExample}
              disabled={isGenerating}
              className="inline-flex items-center gap-1 px-3 py-1 bg-surface-bone dark:bg-black/35 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 text-mute dark:text-on-dark-mute text-[10px] font-mono font-semibold rounded-full transition-all cursor-pointer border border-hairline dark:border-divider-dark disabled:opacity-50 active:scale-98"
            >
              {isGenerating ? '⏳ Đang tạo lại...' : '🔄 Tạo lại bằng AI'}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 space-y-4">
          <p className="text-xs text-mute dark:text-on-dark-mute italic leading-relaxed">
            Hiện tại từ vựng này chưa có câu ví dụ trong bộ thẻ.
          </p>
          <button
            type="button"
            onClick={handleGenerateExample}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-deep text-white text-xs font-mono font-bold rounded-full shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isGenerating ? '⏳ Đang tạo...' : '✨ Tạo câu ví dụ bằng AI'}
          </button>
        </div>
      )}
    </div>
  );
}

const speakUtterance = (text, lang, rate) => {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;

    // Apply the best neural/online voice if available
    const voiceInfo = getBestVoice(lang);
    if (voiceInfo && voiceInfo.voice) {
      utterance.voice = voiceInfo.voice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (err) => {
      console.warn('Speech error:', err);
      resolve();
    };
    window.speechSynthesis.speak(utterance);
  });
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function StudyScreen() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const deckIdParam = searchParams.get('deckId');
  const topicIdParam = searchParams.get('topicId');

  // Redux study state
  const todayCards = useSelector((state) => state.study.todayCards);
  const _isLoadingToday = useSelector((state) => state.study.isLoading);

  // Redux decks list
  const decks = useSelector((state) => state.deck.decks);

  const sortedDecks = useMemo(() => {
    if (!decks) return [];
    return [...decks].sort((a, b) => {
      if (a.isSystem && !b.isSystem) return 1; // Put custom decks first, then system decks
      if (!a.isSystem && b.isSystem) return -1;

      if (a.isSystem && b.isSystem) {
        const getHskLevel = (name) => {
          const match = (name || '').match(/HSK\s*(\d+)/i);
          if (match) return parseInt(match[1], 10);
          if ((name || '').includes('7-9')) return 7;
          return 99;
        };
        return getHskLevel(a.title || a.name) - getHskLevel(b.title || b.name);
      }
      return (a.title || a.name || '').localeCompare(b.title || b.name || '');
    });
  }, [decks]);

  const [favorites, setFavorites] = useState([]);

  const loadFavorites = async () => {
    try {
      const res = await favoriteWordsApi.getFavorites();
      setFavorites(res.data || []);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }
  };

  const isFavorite = (hanzi) => {
    if (!hanzi) return false;
    const cleanHanzi = hanzi.split(/[｜|]/)[0].trim();
    return favorites.some((f) => f.hanzi === cleanHanzi);
  };


  const handleToggleFavorite = async (hanzi, pinyin, meaning, exampleHanzi = '', examplePinyin = '', exampleMeaning = '') => {
    if (!hanzi) return;
    const cleanHanzi = hanzi.split(/[｜|]/)[0].trim();
    const alreadyFav = isFavorite(cleanHanzi);

    // --- Cập nhật Lạc quan (Optimistic Update) ---
    const previousFavorites = [...favorites];
    if (alreadyFav) {
      // Xóa ngay lập tức trên UI
      setFavorites((prev) => prev.filter((f) => f.hanzi !== cleanHanzi));
    } else {
      // Thêm tạm thời lên UI
      const tempFav = {
        id: -Date.now(), // ID âm tạm thời
        hanzi: cleanHanzi,
        pinyin: pinyin || '',
        sv: '',
        vi: meaning || '',
        exampleHanzi: exampleHanzi || '',
        examplePinyin: examplePinyin || '',
        exampleMeaning: exampleMeaning || '',
      };
      setFavorites((prev) => [tempFav, ...prev]);
    }
    // ---------------------------------------------

    try {
      if (alreadyFav) {
        await favoriteWordsApi.deleteFavoriteByHanzi(cleanHanzi);
      } else {
        const res = await favoriteWordsApi.addFavorite({
          hanzi: cleanHanzi,
          pinyin: pinyin || '',
          vi: meaning || '',
          exampleHanzi: exampleHanzi || '',
          examplePinyin: examplePinyin || '',
          exampleMeaning: exampleMeaning || '',
        });

        // Thay thế bản ghi tạm bằng bản ghi thật từ database response
        setFavorites((prev) =>
          prev.map((f) => (f.hanzi === cleanHanzi ? res.data : f))
        );
      }
      loadFavorites();
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      // Hoàn tác về trạng thái cũ nếu API lỗi
      setFavorites(previousFavorites);
    }
  };

  // Client local states
  const [aiLimit, setAiLimit] = useState({ count: 0, limit: 10 });
  const loadAiLimit = async () => {
    try {
      const res = await dictionaryHistoryApi.getTodayCount();
      setAiLimit({ count: res.data.count, limit: res.data.limit });
    } catch (err) {
      console.warn('Failed to load AI limit:', err);
    }
  };
  const [allCards, setAllCards] = useState([]);
  const [totalCardsCount, setTotalCardsCount] = useState(0);
  const [isAllCardsLoading, setIsAllCardsLoading] = useState(false);
  const [isStudyStarted, setIsStudyStarted] = useState(false);

  // Configurator preferences
  const [selectedDeckId, setSelectedDeckId] = useState(deckIdParam || 'all');
  const currentTopicId = useMemo(() => {
    if (selectedDeckId && deckIdParam && String(selectedDeckId) === String(deckIdParam)) {
      return topicIdParam ? Number(topicIdParam) : undefined;
    }
    return undefined;
  }, [selectedDeckId, deckIdParam, topicIdParam]);

  const [studyMode, setStudyMode] = useState('srs'); // srs, classic
  const [frontFaceMode, setFrontFaceMode] = useState('hanzi'); // hanzi, meaning
  const [showPinyinOnFront, setShowPinyinOnFront] = useState(false);
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);
  const [ttsTrigger, setTtsTrigger] = useState(() => {
    return localStorage.getItem('chongzi_tts_trigger') || 'change';
  });

  const handleUpdateTtsTrigger = (val) => {
    setTtsTrigger(val);
    localStorage.setItem('chongzi_tts_trigger', val);
  };

  // Passive Listening state
  const [isPassiveStarted, setIsPassiveStarted] = useState(false);
  const [isPassivePlaying, setIsPassivePlaying] = useState(false);
  const [passiveRate, setPassiveRate] = useState(0.8);
  const [isPassiveLoopEnabled, setIsPassiveLoopEnabled] = useState(true);
  const [passiveStatus, setPassiveStatus] = useState('idle'); // speaking_hanzi, pause_between, speaking_meaning, pause_next, paused, completed

  const passivePlayingRef = useRef(false);
  const passiveSeqIdRef = useRef(0);
  const passiveRateRef = useRef(passiveRate);
  const isPassiveLoopEnabledRef = useRef(isPassiveLoopEnabled);
  const activeQueueRef = useRef([]);

  useEffect(() => {
    if (deckIdParam) {
      setSelectedDeckId(deckIdParam);
    }
  }, [deckIdParam]);

  useEffect(() => {
    passiveRateRef.current = passiveRate;
  }, [passiveRate]);

  useEffect(() => {
    isPassiveLoopEnabledRef.current = isPassiveLoopEnabled;
  }, [isPassiveLoopEnabled]);

  // Study player state
  const [activeQueue, setActiveQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isStudyFinished, setIsStudyFinished] = useState(false);

  const [showWriting, setShowWriting] = useState(false);
  const [showSpeaking, setShowSpeaking] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Sync offline queued reviews to backend
  const syncOfflineReviews = async () => {
    const pendingStr = localStorage.getItem('chongzi_pending_reviews');
    if (!pendingStr) return;
    try {
      const pending = JSON.parse(pendingStr);
      if (pending.length === 0) return;
      console.log(`Syncing ${pending.length} offline reviews...`);

      for (const review of pending) {
        await dispatch(submitReview({ cardId: review.cardId, rating: review.rating })).unwrap();
      }

      localStorage.removeItem('chongzi_pending_reviews');
      setPendingSyncCount(0);
      console.log('Successfully synced offline reviews.');
    } catch (err) {
      console.error('Failed to sync offline reviews:', err);
    }
  };

  // Check pending reviews count from localStorage
  const checkPendingSync = () => {
    try {
      const pendingStr = localStorage.getItem('chongzi_pending_reviews');
      if (pendingStr) {
        const pending = JSON.parse(pendingStr);
        setPendingSyncCount(pending.length);
      } else {
        setPendingSyncCount(0);
      }
    } catch {
      setPendingSyncCount(0);
    }
  };

  useEffect(() => {
    checkPendingSync();
    const interval = setInterval(checkPendingSync, 3000);

    // Register online listener
    window.addEventListener('online', syncOfflineReviews);
    if (navigator.onLine) {
      syncOfflineReviews();
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', syncOfflineReviews);
    };
  }, []);

  useEffect(() => {
    activeQueueRef.current = activeQueue;
  }, [activeQueue]);

  // Reset writing/speaking practice sub-panels on card change
  useEffect(() => {
    setShowWriting(false);
    setShowSpeaking(false);
  }, [currentIndex]);

  // Auto-play TTS pronunciation when card changes
  useEffect(() => {
    if (!isStudyStarted || isStudyFinished || activeQueue.length === 0) return;
    if (ttsTrigger !== 'change') return; // Only autoplay on card change if setting matches

    const currentCard = activeQueue[currentIndex];
    if (!currentCard) return;

    // Determine deck language
    const currentDeck = decks.find((d) => d.id === currentCard.deckId);
    const isEnglish = currentDeck?.language === 'EN';
    const lang = isEnglish ? 'en-US' : 'zh-CN';
    const word = currentCard.hanzi || currentCard.front || '';

    if (word) {
      // Small timeout to ensure visual transition finishes smoothly
      const timer = setTimeout(() => {
        speakChinese(word, lang);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, activeQueue, isStudyStarted, isStudyFinished, decks, ttsTrigger]);

  // Auto-play TTS pronunciation when card is flipped
  useEffect(() => {
    if (!isStudyStarted || isStudyFinished || activeQueue.length === 0) return;
    if (ttsTrigger !== 'flip' || !isFlipped) return; // Only autoplay on flip if setting matches

    const currentCard = activeQueue[currentIndex];
    if (!currentCard) return;

    // Determine deck language
    const currentDeck = decks.find((d) => d.id === currentCard.deckId);
    const isEnglish = currentDeck?.language === 'EN';
    const lang = isEnglish ? 'en-US' : 'zh-CN';
    const word = currentCard.hanzi || currentCard.front || '';

    if (word) {
      speakChinese(word, lang);
    }
  }, [isFlipped, currentIndex, activeQueue, isStudyStarted, isStudyFinished, decks, ttsTrigger]);

  // Fetch decks and favorites once on mount
  useEffect(() => {
    dispatch(fetchAllDecks());
    loadFavorites();
    loadAiLimit();
  }, [dispatch]);

  // Load backend cards for the selected deck dynamically
  useEffect(() => {
    const loadAllCards = async () => {
      if (selectedDeckId === 'favorites') {
        setAllCards([]);
        setTotalCardsCount(0);
        return;
      }
      try {
        setIsAllCardsLoading(true);
        const deckIdParam = selectedDeckId === 'all' ? undefined : Number(selectedDeckId);

        // 1. Fetch first 100 cards and total count instantly (takes ~50ms)
        const res = await studyApi.getAllCards(deckIdParam, 100, undefined, currentTopicId);

        let initialCards = [];
        let totalCount = 0;

        if (res.data && res.data.cards) {
          initialCards = res.data.cards;
          totalCount = res.data.totalCount;
        } else {
          initialCards = res.data || [];
          totalCount = initialCards.length;
        }

        setAllCards(initialCards);
        setTotalCardsCount(totalCount);
        setItem('chongzi_offline_all_cards', initialCards).catch(e => console.warn(e));
      } catch (e) {
        console.error('Failed to load all cards:', e);
        // Fallback to IndexedDB
        try {
          const cached = await getItem('chongzi_offline_all_cards');
          if (cached) {
            setAllCards(cached);
            setTotalCardsCount(cached.length);
          }
        } catch (dbErr) {
          console.error('Failed to load all cards from IndexedDB:', dbErr);
        }
      } finally {
        setIsAllCardsLoading(false);
      }
    };
    loadAllCards();
  }, [selectedDeckId]);

  // Lazy load more cards in Classic mode as the user approaches the end of the queue
  useEffect(() => {
    if (studyMode !== 'classic' || selectedDeckId === 'favorites' || !isStudyStarted) return;
    if (isAllCardsLoading) return;

    const threshold = activeQueue.length - 20;
    if (currentIndex >= threshold && activeQueue.length < totalCardsCount) {
      const loadNextPage = async () => {
        try {
          setIsAllCardsLoading(true);
          const deckIdParam = selectedDeckId === 'all' ? undefined : Number(selectedDeckId);
          const offset = allCards.length;

          const res = await studyApi.getAllCards(deckIdParam, 100, offset, currentTopicId);

          let nextCards = [];
          if (res.data && res.data.cards) {
            nextCards = res.data.cards;
          } else {
            nextCards = res.data || [];
          }

          if (nextCards.length > 0) {
            setAllCards(prev => {
              const merged = [...prev, ...nextCards];
              setItem('chongzi_offline_all_cards', merged).catch(e => console.warn(e));
              return merged;
            });

            setActiveQueue(prev => [...prev, ...nextCards]);
          }
        } catch (e) {
          console.error('Failed to lazy load next page of cards:', e);
        } finally {
          setIsAllCardsLoading(false);
        }
      };
      loadNextPage();
    }
  }, [currentIndex, activeQueue.length, totalCardsCount, studyMode, selectedDeckId, isStudyStarted, isAllCardsLoading, allCards.length]);

  // Cache todayCards in IndexedDB asynchronously
  useEffect(() => {
    if (todayCards && todayCards.length > 0) {
      setItem('chongzi_offline_cards', todayCards).catch(e => {
        console.warn('Failed to cache today cards in IndexedDB:', e);
      });
    }
  }, [todayCards]);

  useEffect(() => {
    if (selectedDeckId === 'favorites') {
      setStudyMode('classic');
    }
  }, [selectedDeckId]);

  // Load today study cards depending on selectedDeckId
  useEffect(() => {
    if (selectedDeckId !== 'favorites') {
      const loadToday = async () => {
        try {
          const deckIdParam = selectedDeckId === 'all' ? undefined : Number(selectedDeckId);
          await dispatch(fetchTodayStudy({ deckId: deckIdParam, topicId: currentTopicId })).unwrap();
        } catch (err) {
          console.error('Failed to load today cards:', err);
          // Fallback to IndexedDB
          try {
            const cached = await getItem('chongzi_offline_cards');
            if (cached) {
              dispatch(setTodayCards(cached));
            }
          } catch (dbErr) {
            console.error('Failed to load today cards from IndexedDB:', dbErr);
          }
        }
      };
      loadToday();
    }
  }, [dispatch, selectedDeckId]);

  // Compute due cards for the currently selected deck under SRS mode
  const srsDueCount = useMemo(() => {
    if (selectedDeckId === 'favorites') return 0;
    if (selectedDeckId === 'all') {
      return todayCards ? todayCards.length : 0;
    }
    if (!todayCards) return 0;
    let list = todayCards;
    if (selectedDeckId !== 'all') {
      list = list.filter(c => c.deckId === Number(selectedDeckId));
    }
    if (currentTopicId) {
      list = list.filter(c => Number(c.topicId) === Number(currentTopicId));
    }
    return list.length;
  }, [todayCards, selectedDeckId, currentTopicId]);

  // Compute filtered queue dynamically based on selected deck and study mode
  const filteredQueue = useMemo(() => {
    if (selectedDeckId === 'favorites') {
      return favorites.map(f => ({
        id: f.id,
        deckId: 'favorites',
        hanzi: f.hanzi,
        character: f.hanzi,
        front: f.hanzi,
        pinyin: f.pinyin || '',
        meaning: f.vi || '',
        exampleHanzi: f.exampleHanzi || '',
        examplePinyin: f.examplePinyin || '',
        exampleMeaning: f.exampleMeaning || '',
        deckName: 'Từ vựng yêu thích'
      }));
    }

    let list = studyMode === 'srs' ? todayCards : allCards;

    if (selectedDeckId !== 'all') {
      list = list.filter((c) => c.deckId === Number(selectedDeckId));
    }
    if (currentTopicId) {
      list = list.filter((c) => Number(c.topicId) === Number(currentTopicId));
    }
    return list;
  }, [studyMode, todayCards, allCards, selectedDeckId, favorites, currentTopicId]);

  // Compute display count dynamically to show total count instantly
  const displayCount = useMemo(() => {
    if (selectedDeckId === 'favorites') return favorites.length;
    return studyMode === 'srs' ? srsDueCount : totalCardsCount;
  }, [selectedDeckId, favorites.length, studyMode, srsDueCount, totalCardsCount]);

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

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const handleLoadExtraCards = async (count) => {
    const deckId = selectedDeckId === 'all' ? undefined : Number(selectedDeckId);
    try {
      const result = await dispatch(fetchTodayStudy({ deckId, extra: count, topicId: currentTopicId })).unwrap();
      if (result && result.length > 0) {
        showToast(`Đã nạp thêm ${result.length} từ mới vào hàng đợi ôn tập!`, 'success');
      } else {
        showToast('Bộ bài này đã hết từ mới để nạp thêm!', 'warning');
      }
    } catch (err) {
      showToast('Có lỗi xảy ra khi nạp thêm từ mới.', 'error');
    }
  };

  // Start study session
  const handleStartStudy = () => {
    if (filteredQueue.length === 0) {
      showToast('Không tìm thấy từ vựng nào khớp với cấu hình học của bạn!', 'warning');
      return;
    }

    if (selectedDeckId === 'favorites' && studyMode === 'srs') {
      setStudyMode('classic');
    }

    let cardsToStudy = [...filteredQueue];
    if (isShuffleEnabled) {
      for (let i = cardsToStudy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardsToStudy[i], cardsToStudy[j]] = [cardsToStudy[j], cardsToStudy[i]];
      }
    }

    setActiveQueue(cardsToStudy);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsStudyFinished(false);
    setIsStudyStarted(true);
  };

  const runPassiveLoop = async (index, queue = activeQueueRef.current) => {
    const seqId = ++passiveSeqIdRef.current;

    const checkState = () => {
      return seqId === passiveSeqIdRef.current && passivePlayingRef.current;
    };

    if (!checkState()) return;
    if (queue.length === 0) return;

    if (index >= queue.length) {
      if (isPassiveLoopEnabledRef.current) {
        index = 0;
      } else {
        setIsPassivePlaying(false);
        passivePlayingRef.current = false;
        setPassiveStatus('completed');
        return;
      }
    }

    const card = queue[index];
    if (!card) return;

    setCurrentIndex(index);

    try {
      // Step 1: Speak Hanzi
      if (!checkState()) return;
      setPassiveStatus('speaking_hanzi');
      const cardDeck = decks.find(d => d.id === card.deckId);
      const cardLang = cardDeck?.language === 'EN' ? 'en-US' : 'zh-CN';
      await speakUtterance(card.hanzi, cardLang, passiveRateRef.current);

      // Step 2: Pause 1.5 seconds
      if (!checkState()) return;
      setPassiveStatus('pause_between');
      await delay(1500);

      // Step 3: Speak Vietnamese translation
      if (!checkState()) return;
      setPassiveStatus('speaking_meaning');
      await speakUtterance(card.meaning, 'vi-VN', passiveRateRef.current);

      // Step 4: Pause 3 seconds
      if (!checkState()) return;
      setPassiveStatus('pause_next');
      await delay(3000);

      // Step 5: Next card
      if (!checkState()) return;
      runPassiveLoop(index + 1, activeQueueRef.current);
    } catch (err) {
      console.error('Error in passive loop:', err);
    }
  };

  const handleStartPassive = () => {
    if (filteredQueue.length === 0) {
      showToast('Không tìm thấy từ vựng nào khớp với cấu hình học của bạn!', 'warning');
      return;
    }

    let cardsToStudy = [...filteredQueue];
    if (isShuffleEnabled) {
      for (let i = cardsToStudy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardsToStudy[i], cardsToStudy[j]] = [cardsToStudy[j], cardsToStudy[i]];
      }
    }

    setActiveQueue(cardsToStudy);
    setCurrentIndex(0);
    setIsPassiveStarted(true);
    setIsPassivePlaying(true);
    passivePlayingRef.current = true;

    setTimeout(() => {
      runPassiveLoop(0, cardsToStudy);
    }, 100);
  };

  const togglePassivePlay = () => {
    if (isPassivePlaying) {
      setIsPassivePlaying(false);
      passivePlayingRef.current = false;
      passiveSeqIdRef.current++;
      window.speechSynthesis?.cancel();
      setPassiveStatus('paused');
    } else {
      setIsPassivePlaying(true);
      passivePlayingRef.current = true;
      runPassiveLoop(currentIndex);
    }
  };

  const handlePassiveNext = () => {
    window.speechSynthesis?.cancel();
    passiveSeqIdRef.current++;
    const nextIdx = (currentIndex + 1) % activeQueue.length;
    setCurrentIndex(nextIdx);

    if (isPassivePlaying) {
      runPassiveLoop(nextIdx);
    } else {
      setPassiveStatus('paused');
    }
  };

  const handlePassivePrev = () => {
    window.speechSynthesis?.cancel();
    passiveSeqIdRef.current++;
    const prevIdx = (currentIndex - 1 + activeQueue.length) % activeQueue.length;
    setCurrentIndex(prevIdx);

    if (isPassivePlaying) {
      runPassiveLoop(prevIdx);
    } else {
      setPassiveStatus('paused');
    }
  };

  const handleQuitPassive = () => {
    setIsPassivePlaying(false);
    passivePlayingRef.current = false;
    passiveSeqIdRef.current++;
    window.speechSynthesis?.cancel();
    setIsPassiveStarted(false);
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

  const handleRate = async (rating) => {
    const currentCard = activeQueue[currentIndex];
    if (!currentCard) return;

    try {
      if (studyMode === 'srs') {
        if (navigator.onLine) {
          // Dispatch to backend database
          await dispatch(submitReview({ cardId: currentCard.id, rating })).unwrap();
        } else {
          // Offline: Queue review
          const pendingStr = localStorage.getItem('chongzi_pending_reviews') || '[]';
          let pending = [];
          try {
            pending = JSON.parse(pendingStr);
          } catch {
            pending = [];
          }
          pending.push({ cardId: currentCard.id, rating, timestamp: Date.now() });
          try {
            localStorage.setItem('chongzi_pending_reviews', JSON.stringify(pending));
          } catch (e) {
            console.warn('Failed to save pending reviews offline (quota exceeded):', e);
          }
          setPendingSyncCount(pending.length);
          console.log('Saved review offline:', currentCard.id, rating);
        }
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
    const isEnglish = currentCard ? (decks.find(d => d.id === currentCard.deckId)?.language === 'EN') : false;
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between border-b border-hairline dark:border-divider-dark pb-4">
          <button
            onClick={handleQuitStudy}
            className="flex items-center gap-2 text-mute hover:text-ink dark:text-on-dark-mute dark:hover:text-on-dark font-mono font-bold text-xs cursor-pointer"
          >
            <ArrowLeft size={14} />
            Thoát
          </button>
          <div className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute flex items-center gap-1.5">
            THẺ {currentIndex + 1} / {displayCount}
            {!navigator.onLine && (
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" title="Ngoại tuyến" />
            )}
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

        {/* Main Content Area: Responsive Grid (Side-by-side on desktop, vertical on mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">

          {/* Left Column (5 cols): Flashcard, SRS Ratings, and Navigation */}
          <div className="lg:col-span-5 flex flex-col items-center space-y-6 w-full">
            {currentCard ? (
              <div className="relative w-full max-w-xl mx-auto flex-shrink-0 mb-2">
                <Flashcard
                  cardData={currentCard}
                  isFlipped={isFlipped}
                  onFlip={handleFlip}
                  frontFaceMode={frontFaceMode}
                  showPinyinOnFront={showPinyinOnFront}
                  onTogglePinyinOnFront={() => setShowPinyinOnFront((prev) => !prev)}
                />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(
                      currentCard.hanzi,
                      currentCard.pinyin,
                      currentCard.meaning,
                      currentCard.exampleHanzi,
                      currentCard.examplePinyin,
                      currentCard.exampleMeaning
                    );
                  }}
                  className={`absolute top-5 left-5 z-30 p-2 rounded-full border transition-all cursor-pointer ${isFavorite(currentCard.hanzi)
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                      : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-mute hover:text-ink dark:hover:text-on-dark'
                    }`}
                  title={isFavorite(currentCard.hanzi) ? 'Xóa khỏi mục yêu thích' : 'Thêm vào mục yêu thích'}
                >
                  <Star size={16} fill={isFavorite(currentCard.hanzi) ? 'currentColor' : 'none'} />
                </button>
              </div>
            ) : (
              <div className="text-mute dark:text-on-dark-mute font-mono text-center">Lỗi: Không tìm thấy thẻ bài.</div>
            )}

            {/* Spaced Repetition Panel (shown only in SRS mode) */}
            {studyMode === 'srs' && (
              <div className="w-full max-w-xl mx-auto text-center">
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

            {/* Unified Navigation Buttons (Back & Next) */}
            <div className="flex items-center justify-between gap-6 w-full max-w-xl mx-auto pt-6 pb-2 flex-shrink-0">
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

          {/* Right Column (7 cols): Interactive Practice Tools (Writing, Speaking, AI Example Box) */}
          <div className="lg:col-span-7 w-full space-y-6">
            {currentCard && isFlipped ? (
              <div className="w-full space-y-6 bg-surface-card dark:bg-surface-dark/20 border border-hairline dark:border-divider-dark rounded-xl p-6 shadow-sm">

                {/* Practice Mode Toggle Buttons */}
                <div className="flex gap-4 w-full">
                  {!isEnglish && (
                    <button
                      type="button"
                      onClick={() => setShowWriting((prev) => !prev)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-full transition-all cursor-pointer text-xs font-mono font-bold shadow-sm ${showWriting
                          ? 'bg-primary text-white border-transparent'
                          : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
                        }`}
                    >
                      ✍️ {showWriting ? 'Ẩn luyện viết' : 'Luyện viết'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowSpeaking((prev) => !prev)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-full transition-all cursor-pointer text-xs font-mono font-bold shadow-sm ${showSpeaking
                        ? 'bg-primary text-white border-transparent'
                        : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
                      }`}
                  >
                    🎙️ {showSpeaking ? 'Ẩn luyện nói' : 'Luyện nói'}
                  </button>
                </div>

                {/* Conditional Sub-panels */}
                {showWriting && !isEnglish && (
                  <div className="w-full transition-all duration-300">
                    <WritingPractice character={currentCard.hanzi} />
                  </div>
                )}

                {showSpeaking && (
                  <div className="w-full transition-all duration-300">
                    <SpeakingPractice character={currentCard.hanzi} pinyin={currentCard.pinyin} lang={isEnglish ? 'en-US' : 'zh-CN'} />
                  </div>
                )}

                {/* AI Example Sentence Generator & Reader */}
                <div className="w-full">
                  <AIExampleBox
                    card={currentCard}
                    onExampleUpdated={handleExampleUpdated}
                    lang={isEnglish ? 'en-US' : 'zh-CN'}
                    aiLimit={aiLimit}
                    loadAiLimit={loadAiLimit}
                  />
                </div>
              </div>
            ) : (
              <div className="w-full bg-surface-card/30 dark:bg-surface-dark/10 border border-dashed border-hairline dark:border-divider-dark rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[360px] space-y-4">
                <div className="text-4xl animate-bounce">💡</div>
                <h4 className="font-display font-extrabold text-base text-ink dark:text-on-dark">Công cụ học tập tương tác</h4>
                <p className="text-xs text-mute dark:text-on-dark-mute max-w-sm leading-relaxed font-sans">
                  Chạm vào thẻ bài (hoặc nhấn phím Cách) để lật xem nghĩa. Hệ thống sẽ mở ra các công cụ luyện viết nét chữ, luyện nói phát âm, và sinh câu ví dụ AI tương ứng cho từ vựng này.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // Passive Listening Player Screen
  if (isPassiveStarted) {
    const currentCard = activeQueue[currentIndex];
    return (
      <div className="max-w-xl mx-auto space-y-8 p-6 pb-32 min-h-[70vh] flex flex-col justify-center">
        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between border-b border-hairline dark:border-divider-dark pb-4">
          <button
            onClick={handleQuitPassive}
            className="flex items-center gap-2 text-mute hover:text-ink dark:text-on-dark-mute dark:hover:text-on-dark font-mono font-bold text-xs cursor-pointer bg-transparent border-none"
          >
            <ArrowLeft size={14} />
            Thoát Nghe Thụ Động
          </button>
          <div className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute">
            THẺ {currentIndex + 1} / {displayCount}
          </div>
          <div className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-mono font-bold rounded-full animate-pulse">
            🎧 TỰ ĐỘNG CHẠY
          </div>
        </div>

        {/* Large Display Card */}
        {currentCard ? (
          <div className="w-full bg-surface-card dark:bg-surface-dark border-2 border-primary rounded-md p-10 text-center shadow-lg relative min-h-[300px] flex flex-col justify-center items-center gap-6 transition-all duration-300">
            {/* Status indicator badge */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center px-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-mute dark:text-on-dark-mute">
                {passiveStatus === 'speaking_hanzi' && '🔊 Đang đọc Hán tự'}
                {passiveStatus === 'pause_between' && '⏱️ Chờ dịch nghĩa...'}
                {passiveStatus === 'speaking_meaning' && '🔊 Đang đọc giải nghĩa'}
                {passiveStatus === 'pause_next' && '⏱️ Đợi chuyển thẻ...'}
                {passiveStatus === 'paused' && '⏸️ Tạm dừng'}
                {passiveStatus === 'completed' && '🏁 Đã hoàn thành'}
              </span>
              <span className="text-[10px] font-mono font-bold text-primary">
                {currentCard.deckName || 'Bộ bài'}
              </span>
            </div>

            {/* Hanzi Display */}
            <h2 className={`font-display text-6xl font-extrabold text-primary transition-all duration-300 ${passiveStatus === 'speaking_hanzi' ? 'scale-105' : ''}`}>
              {decks.find(d => d.id === currentCard.deckId)?.language === 'EN' ? <span>{currentCard.hanzi}</span> : <HoverableText text={currentCard.hanzi} />}
            </h2>

            {/* Pinyin */}
            <p className="text-xl font-mono font-bold text-ink dark:text-on-dark mt-2">
              {currentCard.pinyin}
            </p>

            {/* Meaning */}
            <p className="text-base text-body dark:text-on-dark-mute max-w-sm" title={currentCard.meaning}>
              {currentCard.meaning && currentCard.meaning.length > 90
                ? currentCard.meaning.substring(0, 90).trim() + '...'
                : currentCard.meaning}
            </p>
          </div>
        ) : (
          <div className="text-center font-mono text-mute dark:text-on-dark-mute">
            Không tìm thấy thẻ.
          </div>
        )}

        {/* Player controls */}
        <div className="space-y-6 bg-surface-card dark:bg-surface-dark/40 border border-hairline dark:border-divider-dark rounded-md p-6 shadow-sm">
          {/* Main Controls Row */}
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={handlePassivePrev}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-bone dark:bg-black/30 hover:bg-surface-bone/70 border border-hairline dark:border-divider-dark text-ink dark:text-on-dark shadow-sm transition-all cursor-pointer text-lg"
              title="Thẻ trước"
            >
              ⏮️
            </button>

            <button
              onClick={togglePassivePlay}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-primary hover:bg-primary-deep text-white shadow-md transition-all cursor-pointer text-2xl active:scale-95"
              title={isPassivePlaying ? 'Tạm dừng' : 'Tiếp tục'}
            >
              {isPassivePlaying ? '⏸️' : '▶️'}
            </button>

            <button
              onClick={handlePassiveNext}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-bone dark:bg-black/30 hover:bg-surface-bone/70 border border-hairline dark:border-divider-dark text-ink dark:text-on-dark shadow-sm transition-all cursor-pointer text-lg"
              title="Thẻ tiếp theo"
            >
              ⏭️
            </button>
          </div>

          {/* Config row */}
          <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-hairline dark:border-divider-dark">
            {/* Speed slider */}
            <div className="space-y-1.5 text-left">
              <label className="block text-[11px] font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">
                Tốc độ phát âm: {passiveRate.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={passiveRate}
                onChange={(e) => setPassiveRate(parseFloat(e.target.value))}
                className="w-full accent-primary bg-surface-bone dark:bg-black/40 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Loop switch */}
            <div className="flex items-center justify-between sm:justify-end gap-3 text-left">
              <span className="text-[11px] font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">
                Tự động lặp bộ bài
              </span>
              <input
                id="passive-loop-toggle"
                type="checkbox"
                checked={isPassiveLoopEnabled}
                onChange={(e) => setIsPassiveLoopEnabled(e.target.checked)}
                className="w-4 h-4 text-primary bg-surface-card border-hairline rounded focus:ring-primary accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Tip text */}
        <p className="text-[10px] text-mute dark:text-on-dark-mute leading-relaxed text-center font-mono">
          Chế độ nghe thụ động giúp bạn học rảnh tay. Trình duyệt sẽ tự động phát âm Hán tự (giọng Trung Quốc), dừng 1.5 giây, phát âm giải nghĩa (giọng Việt Nam), rồi đợi 3 giây để chuyển sang thẻ tiếp theo.
        </p>
      </div>
    );
  }

  // Study Configurator View (Default)
  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6 pb-32">

      {/* Brand & Title Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">

        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink dark:text-on-dark tracking-tight flex items-center gap-2">
            <span>Flashcard Study</span>
            {!navigator.onLine && (
              <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-500 font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                Ngoại tuyến
              </span>
            )}
          </h1>
          <p className="text-mute dark:text-on-dark-mute text-sm mt-1">
            Lật thẻ để kiểm tra trí nhớ. Đánh dấu từ bạn đã biết, ôn tập từ bạn chưa thuộc.
          </p>
        </div>
      </div>

      {pendingSyncCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-500 p-4 rounded-xl text-xs flex items-center justify-between font-mono font-bold shadow-xs">
          <span>⚠️ Có {pendingSyncCount} kết quả học ngoại tuyến đang chờ mạng để đồng bộ...</span>
          {navigator.onLine && (
            <button
              onClick={syncOfflineReviews}
              className="px-3.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-[10px] font-mono transition-colors cursor-pointer"
            >
              Đồng bộ ngay
            </button>
          )}
        </div>
      )}

      {/* Row: Bộ bài Selector */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">{t('study.select_deck')}</h3>
        <div className="relative max-w-md">
          <select
            value={selectedDeckId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedDeckId(val);
              if (val === 'all') {
                setSearchParams({});
              } else {
                setSearchParams({ deckId: val });
              }
            }}
            className="w-full px-5 py-3 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full shadow-sm text-sm text-ink dark:text-on-dark font-semibold outline-none cursor-pointer hover:bg-surface-bone dark:hover:bg-black transition-all"
          >
            <option value="all">{t('study.all_decks')}</option>
            <option value="favorites">⭐ {t('study.favorites_deck')} ({favorites.length})</option>
            {sortedDecks?.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.title || deck.name} {deck.isSystem ? `(${t('common.system', 'Hệ thống')})` : `(${t('common.custom', 'Tự tạo')})`}
              </option>
            ))}
          </select>
          {currentTopicId && TOPICS[currentTopicId] && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 text-xs font-semibold px-4.5 py-2 rounded-full">
              🏷️ Chỉ học chủ đề: <strong>{TOPICS[currentTopicId].name}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Row: STUDY MODE selector */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">{t('study.study_mode')}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Backed Repetition Block */}
          <div
            role="button"
            tabIndex={selectedDeckId === 'favorites' ? -1 : 0}
            onClick={() => {
              if (selectedDeckId === 'favorites') return;
              setStudyMode('srs');
            }}
            onKeyDown={(e) => {
              if (selectedDeckId === 'favorites') return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setStudyMode('srs');
              }
            }}
            className={`p-6 rounded-xl border-2 transition-all text-left flex items-start gap-4 hover:shadow-md relative select-none outline-none focus:ring-2 focus:ring-primary/50 ${selectedDeckId === 'favorites'
                ? 'opacity-40 cursor-not-allowed bg-surface-card border-hairline dark:bg-surface-dark text-ink dark:text-on-dark'
                : studyMode === 'srs'
                  ? 'bg-surface-card dark:bg-surface-dark border-primary shadow-lg shadow-primary/15 scale-[1.01] cursor-pointer'
                  : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-ink dark:text-on-dark cursor-pointer'
              }`}
          >
            {studyMode === 'srs' && selectedDeckId !== 'favorites' && (
              <div className="absolute top-4 right-4 text-primary animate-in fade-in zoom-in-75 duration-200">
                <CheckCircle size={20} className="fill-primary/10" />
              </div>
            )}
            <div className={`p-3 rounded-full ${studyMode === 'srs'
                ? 'bg-primary/10 text-primary'
                : 'bg-surface-bone dark:bg-black/35 text-mute dark:text-on-dark-mute'
              }`}>
              <Clock size={24} />
            </div>
            <div>
              <div className="font-display font-extrabold text-base text-ink dark:text-on-dark">{t('study.srs_mode')}</div>
              <p className="text-xs mt-1 leading-5 text-mute dark:text-on-dark-mute">
                {t('study.srs_desc')}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <div className={`inline-flex items-center px-2.5 py-1 text-[10px] font-mono font-bold rounded-full uppercase ${studyMode === 'srs'
                    ? 'bg-primary/15 text-primary'
                    : 'bg-surface-bone text-mute dark:bg-black/30 dark:text-on-dark-mute'
                  }`}>
                  {t('study.due_today', { count: srsDueCount })}
                </div>

                {srsDueCount === 0 && selectedDeckId !== 'favorites' && (
                  <div className="flex gap-1.5 z-40">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadExtraCards(10);
                      }}
                      className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded shadow-sm border transition-all cursor-pointer ${studyMode === 'srs'
                          ? 'bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary font-semibold'
                          : 'bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary font-semibold'
                        }`}
                      title={t('study.load_extra_title_10', 'Nạp thêm 10 từ mới để học')}
                    >
                      {t('study.extra_words', { count: 10 })}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadExtraCards(20);
                      }}
                      className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded shadow-sm border transition-all cursor-pointer ${studyMode === 'srs'
                          ? 'bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary font-semibold'
                          : 'bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary font-semibold'
                        }`}
                      title={t('study.load_extra_title_20', 'Nạp thêm 20 từ mới để học')}
                    >
                      {t('study.extra_words', { count: 20 })}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Classic Mode Block */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setStudyMode('classic')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setStudyMode('classic');
              }
            }}
            className={`p-6 rounded-xl border-2 transition-all text-left flex items-start gap-4 hover:shadow-md relative select-none outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer ${studyMode === 'classic'
                ? 'bg-surface-card dark:bg-surface-dark border-primary shadow-lg shadow-primary/15 scale-[1.01]'
                : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
              }`}
          >
            {studyMode === 'classic' && (
              <div className="absolute top-4 right-4 text-primary animate-in fade-in zoom-in-75 duration-200">
                <CheckCircle size={20} className="fill-primary/10" />
              </div>
            )}
            <div className={`p-3 rounded-full ${studyMode === 'classic'
                ? 'bg-primary/10 text-primary'
                : 'bg-surface-bone dark:bg-black/35 text-mute dark:text-on-dark-mute'
              }`}>
              <Layers size={24} />
            </div>
            <div>
              <div className="font-display font-extrabold text-base text-ink dark:text-on-dark">{t('study.classic_mode')}</div>
              <p className="text-xs mt-1 leading-5 text-mute dark:text-on-dark-mute">
                {t('study.classic_desc')}
              </p>
              <div className={`mt-3 inline-flex items-center px-2.5 py-1 text-[10px] font-mono font-bold rounded-full uppercase ${studyMode === 'classic'
                  ? 'bg-primary/15 text-primary'
                  : 'bg-surface-bone text-mute dark:bg-black/30 dark:text-on-dark-mute'
                }`}>
                {t('study.free_order')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row: MẶT TRƯỚC THẺ */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">{t('study.front_face')}</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setFrontFaceMode('hanzi')}
            className={`px-6 py-2.5 rounded-full text-xs font-mono font-bold cursor-pointer transition-all border ${frontFaceMode === 'hanzi'
                ? 'bg-primary border-transparent text-white shadow-sm'
                : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
              }`}
          >
            {t('study.show_hanzi_first')}
          </button>
          <button
            onClick={() => setFrontFaceMode('meaning')}
            className={`px-6 py-2.5 rounded-full text-xs font-mono font-bold cursor-pointer transition-all border ${frontFaceMode === 'meaning'
                ? 'bg-primary border-transparent text-white shadow-sm'
                : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
              }`}
          >
            {t('study.show_meaning_first')}
          </button>
        </div>
      </div>

      {/* Row: PHÁT ÂM TỰ ĐỘNG */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">Phát âm tự động (TTS)</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => handleUpdateTtsTrigger('change')}
            className={`px-6 py-2.5 rounded-full text-xs font-mono font-bold cursor-pointer transition-all border ${ttsTrigger === 'change'
                ? 'bg-primary border-transparent text-white shadow-sm'
                : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
              }`}
          >
            Chuyển thẻ là phát âm ngay
          </button>
          <button
            onClick={() => handleUpdateTtsTrigger('flip')}
            className={`px-6 py-2.5 rounded-full text-xs font-mono font-bold cursor-pointer transition-all border ${ttsTrigger === 'flip'
                ? 'bg-primary border-transparent text-white shadow-sm'
                : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
              }`}
          >
            Lật thẻ mới phát âm
          </button>
          <button
            onClick={() => handleUpdateTtsTrigger('none')}
            className={`px-6 py-2.5 rounded-full text-xs font-mono font-bold cursor-pointer transition-all border ${ttsTrigger === 'none'
                ? 'bg-primary border-transparent text-white shadow-sm'
                : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
              }`}
          >
            Tắt phát âm tự động
          </button>
        </div>
      </div>

      {/* Row: TÙY CHỌN NÂNG CAO */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">Tùy chọn nâng cao</h3>
        <div className="flex items-center gap-2 bg-surface-card dark:bg-surface-dark/40 border border-hairline dark:border-divider-dark p-4 rounded-md shadow-sm max-w-md">
          <input
            id="shuffle-toggle"
            type="checkbox"
            checked={isShuffleEnabled}
            onChange={(e) => setIsShuffleEnabled(e.target.checked)}
            className="w-4 h-4 text-primary bg-surface-card border-hairline rounded focus:ring-primary focus:ring-2 accent-primary cursor-pointer"
          />
          <label htmlFor="shuffle-toggle" className="text-sm font-bold text-ink dark:text-on-dark cursor-pointer select-none">
            🔀 Xáo trộn thứ tự thẻ ôn tập (Shuffle Cards)
          </label>
        </div>
      </div>

      {/* Sticky Bottom Action Footer Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-55 bg-canvas/90 dark:bg-surface-dark/95 backdrop-blur border-t border-hairline dark:border-divider-dark shadow-sm py-4">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-mute dark:text-on-dark-mute text-[10px] font-mono font-bold uppercase tracking-wider">Trạng thái lựa chọn</span>
            <span className="text-ink dark:text-on-dark text-lg font-extrabold mt-0.5 font-mono">
              {displayCount} từ đã chọn
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleStartPassive}
              className="px-5 py-3 bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-ink dark:text-on-dark font-mono font-bold rounded-full transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <span>🎧 Nghe thụ động</span>
            </button>

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

    </div>
  );
}
