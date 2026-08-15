import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { translationData } from '../data/translationData';
import { statsApi } from '../services/statsApi';
import HoverableText from '../components/common/HoverableText';
import {
  Mic,
  MicOff,
  Volume2,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Shuffle,
  ListOrdered,
  Dices,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';

export default function SpeakingScreen() {
  const navigate = useNavigate();

  // Selected level & indices
  const [filterLevel, setFilterLevel] = useState('HSK 1');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playMode, setPlayMode] = useState('sequential'); // 'sequential' | 'random'

  // Filter sentences
  const filteredSentences = useMemo(() => {
    return translationData.filter((s) => s.level === filterLevel);
  }, [filterLevel]);

  const currentSentence = filteredSentences[currentIndex] || filteredSentences[0];

  // Speech states
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState(null);
  const [spokenText, setSpokenText] = useState('');
  const [score, setScore] = useState(null);
  const [gradedChars, setGradedChars] = useState([]); // Array of { char, pinyin, correct }
  const [showMeaning, setShowMeaning] = useState(true); // Toggle for translation box
  const [checked, setChecked] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);

  const recognitionRef = useRef(null);

  // Grade spoken Hanzi character by character, matching pinyin syllables
  const gradePronunciation = (spokenStr) => {
    if (!currentSentence) return;

    // Clean targets (strip punctuation)
    const targetClean = currentSentence.hanzi.replace(/[。？！，、；：]/g, '').trim();
    const spokenClean = spokenStr.replace(/[。？！，、；：\s]/g, '').trim();

    const targetChars = Array.from(targetClean);
    const spokenChars = Array.from(spokenClean);

    // Extract individual pinyin words matching characters
    const rawPinyin = currentSentence.pinyin.replace(/[。？！，、；：?]/g, '').trim();
    const pinyinWords = rawPinyin ? rawPinyin.split(/\s+/) : [];

    const results = [];
    let correctCount = 0;

    targetChars.forEach((char, index) => {
      // Find matching character in spoken input
      const matchIdx = spokenChars.indexOf(char);
      const isCorrect = matchIdx !== -1;
      
      results.push({
        char,
        pinyin: pinyinWords[index] || '',
        correct: isCorrect
      });

      if (isCorrect) {
        spokenChars.splice(matchIdx, 1); // remove matched char to prevent duplicate matching
        correctCount++;
      }
    });

    const finalScore = targetChars.length > 0 ? Math.round((correctCount / targetChars.length) * 100) : 0;

    setGradedChars(results);
    setScore(finalScore);
    setChecked(true);
    statsApi.incrementQuestProgress('SPEAK_PRACTICE', 1).catch(err => console.error(err));
  };

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setBrowserSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'zh-CN'; // Set recognition to Chinese
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setSpeechError(null);
      setSpokenText('');
      setScore(null);
      setChecked(false);
    };

    rec.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSpokenText(transcript);
      gradePronunciation(transcript);
    };

    rec.onerror = (event) => {
      console.error('Speech Recognition Error:', event.error);
      if (event.error === 'not-allowed') {
        setSpeechError('Quyền sử dụng Microphone bị từ chối. Vui lòng bật quyền ghi âm trong cài đặt trình duyệt.');
      } else if (event.error === 'no-speech') {
        setSpeechError('Không nghe thấy giọng nói của bạn. Vui lòng thử lại và nói to hơn.');
      } else {
        setSpeechError(`Lỗi ghi âm: ${event.error}. Vui lòng thử lại.`);
      }
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [currentSentence]);

  const toggleListening = () => {
    if (!browserSupported || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setSpeechError(null);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSpeakSample = () => {
    if (!currentSentence || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentSentence.hanzi);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const resetPractice = () => {
    setSpokenText('');
    setScore(null);
    setGradedChars([]);
    setChecked(false);
    setSpeechError(null);
    setShowMeaning(true); // Reset translation box to visible for new practicing round
  };

  const handleNext = () => {
    if (playMode === 'random') {
      handleRandom();
    } else if (currentIndex < filteredSentences.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      resetPractice();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      resetPractice();
    }
  };

  // Keyboard navigation for sentences
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (playMode === 'random') {
          handleRandom();
        } else if (currentIndex < filteredSentences.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          resetPractice();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, filteredSentences.length, playMode]);

  const handleRandom = () => {
    if (filteredSentences.length <= 1) return;
    let newIdx;
    do {
      newIdx = Math.floor(Math.random() * filteredSentences.length);
    } while (newIdx === currentIndex);
    setCurrentIndex(newIdx);
    resetPractice();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-2 sm:px-4">
      {/* Soundwave animation styles */}
      <style>{`
        @keyframes soundwave {
          0%, 100% { height: 6px; transform: scaleY(1); }
          50% { height: 36px; transform: scaleY(1.4); }
        }
        .wave-bar {
          animation: soundwave 1.2s ease-in-out infinite;
          transform-origin: center;
        }
        .wave-bar:nth-child(1) { animation-delay: 0.1s; }
        .wave-bar:nth-child(2) { animation-delay: 0.25s; }
        .wave-bar:nth-child(3) { animation-delay: 0.4s; }
        .wave-bar:nth-child(4) { animation-delay: 0.55s; }
        .wave-bar:nth-child(5) { animation-delay: 0.7s; }
        .wave-bar:nth-child(6) { animation-delay: 0.15s; }
        .wave-bar:nth-child(7) { animation-delay: 0.3s; }
        .wave-bar:nth-child(8) { animation-delay: 0.45s; }
        .wave-bar:nth-child(9) { animation-delay: 0.6s; }
      `}</style>

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-hairline dark:border-divider-dark pb-5 gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-bone dark:hover:bg-zinc-800 text-mute transition-all cursor-pointer border border-hairline dark:border-zinc-800"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink dark:text-on-dark tracking-tight flex items-center gap-2">
              <Mic size={22} className="text-primary" />
              Luyện nói phát âm HSK
            </h1>
            <p className="text-xs text-mute dark:text-on-dark-mute mt-0.5">Nói câu chữ Hán và nhận phân tích chấm điểm phát âm chuẩn tức thời.</p>
          </div>
        </div>
      </div>

      {/* Level Filters & Mode Toggle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-surface-card dark:bg-zinc-900/50 p-4 rounded-2xl border border-hairline dark:border-divider-dark shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="text-mute dark:text-on-dark-mute text-[10px] font-mono font-bold uppercase tracking-wider shrink-0">
            Cấp độ câu luyện nói:
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6', 'HSK 7-9'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => {
                  setFilterLevel(lvl);
                  setCurrentIndex(0);
                  resetPractice();
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${filterLevel === lvl
                  ? 'bg-primary border-transparent text-white shadow-md'
                  : 'bg-surface-card hover:bg-surface-bone dark:bg-zinc-900 border-hairline dark:border-zinc-800 text-ink dark:text-on-dark'
                  }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
        {/* Mode Toggle */}
        <div className="flex items-center gap-1 bg-surface-bone dark:bg-zinc-950 rounded-full p-1 border border-hairline dark:border-zinc-800 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setPlayMode('sequential')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${playMode === 'sequential'
              ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm'
              : 'text-mute hover:text-ink dark:hover:text-on-dark'
              }`}
          >
            <ListOrdered size={14} />
            Lần lượt
          </button>
          <button
            type="button"
            onClick={() => { setPlayMode('random'); handleRandom(); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${playMode === 'random'
              ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm'
              : 'text-mute hover:text-ink dark:hover:text-on-dark'
              }`}
          >
            <Shuffle size={14} />
            Ngẫu nhiên
          </button>
        </div>
      </div>

      {/* Browser Support Check */}
      {!browserSupported && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl p-5 text-left flex gap-3 max-w-lg mx-auto">
          <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-red-600 dark:text-red-400">Trình duyệt không hỗ trợ ghi âm</h4>
            <p className="text-xs text-body dark:text-on-dark-mute leading-relaxed">
              Tính năng Speech Recognition hiện tại chưa được hỗ trợ hoàn toàn trên trình duyệt này. Vui lòng sử dụng <strong>Google Chrome, Microsoft Edge, hoặc Safari</strong> để có trải nghiệm học phát âm tốt nhất.
            </p>
          </div>
        </div>
      )}

      {browserSupported && currentSentence && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Main workspace */}
          <div className="lg:col-span-8 flex flex-col justify-between gap-6">
            <div className="relative rounded-3xl border border-hairline dark:border-divider-dark bg-surface-card dark:bg-zinc-900/40 p-6 sm:p-8 shadow-sm flex flex-col justify-between min-h-[460px] overflow-hidden group">
              {/* Decorative radial gradients for rich aesthetics */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 dark:bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-primary/10 transition-all duration-700" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

              {/* Index & reset */}
              <div className="flex justify-between items-center border-b border-hairline dark:border-zinc-800/80 pb-4 z-10">
                <span className="text-[10px] font-mono font-extrabold text-mute dark:text-on-dark-mute uppercase tracking-widest bg-surface-bone dark:bg-zinc-800/60 px-3 py-1 rounded-full border border-hairline dark:border-zinc-800">
                  Câu {currentIndex + 1} / {filteredSentences.length}
                </span>

                <button
                  type="button"
                  onClick={resetPractice}
                  className="flex items-center gap-1.5 text-xs font-bold text-mute hover:text-primary transition-all cursor-pointer active:scale-95 bg-surface-card hover:bg-surface-bone dark:bg-zinc-900 dark:hover:bg-black px-3 py-1.5 rounded-full border border-hairline dark:border-zinc-800 shadow-sm"
                >
                  <RefreshCw size={12} className="text-mute group-hover:rotate-180 transition-transform duration-500" />
                  <span>Xóa gõ lại</span>
                </button>
              </div>

              {/* Character blocks */}
              <div className="py-8 text-center space-y-6 z-10 flex-1 flex flex-col justify-center">
                <p className="text-sm font-mono font-bold text-primary/80 tracking-widest max-w-xl mx-auto leading-relaxed">
                  {currentSentence.pinyin}
                </p>

                {/* Target Sentence Display */}
                <div className="flex flex-wrap items-center justify-center gap-2 py-4 select-none leading-normal">
                  {checked && gradedChars.length > 0 ? (
                    /* Graded characters (color-coded) */
                    <div className="flex flex-wrap items-center justify-center gap-1">
                      {gradedChars.map((item, idx) => (
                        <span
                          key={idx}
                          className={`text-4xl sm:text-5xl font-display font-extrabold px-1.5 py-0.5 rounded-xl transition-all duration-300 ${item.correct
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/10 shadow-xs border border-emerald-500/20'
                            : 'text-red-500 dark:text-red-400 bg-red-500/10 dark:bg-red-500/10 border border-red-500/20'
                            }`}
                        >
                          {item.char}
                        </span>
                      ))}
                    </div>
                  ) : (
                    /* Default display characters */
                    <span className="text-4xl sm:text-5xl text-ink dark:text-on-dark font-display font-extrabold tracking-wide hover:scale-[1.02] transition-transform duration-300">
                      <HoverableText text={currentSentence.hanzi} />
                    </span>
                  )}

                  {/* Speaker play button */}
                  <button
                    onClick={handleSpeakSample}
                    className="h-10 w-10 rounded-full bg-surface-card hover:bg-surface-bone dark:bg-zinc-900 dark:hover:bg-black border border-hairline dark:border-zinc-800 text-primary shadow-sm flex items-center justify-center cursor-pointer active:scale-90 transition-all ml-3 shrink-0"
                    title="Nghe giọng chuẩn"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>

                {/* Redesigned Translation display with elegant interactive card */}
                <div className="max-w-md w-full mx-auto transition-all duration-300">
                  {showMeaning ? (
                    <div className="relative bg-slate-500/5 dark:bg-zinc-800/40 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-hairline dark:border-zinc-850 shadow-xs text-center group/meaning">
                      <button
                        type="button"
                        onClick={() => setShowMeaning(false)}
                        className="absolute top-2 right-2 text-[10px] font-mono font-bold text-mute hover:text-primary transition-colors cursor-pointer px-2 py-0.5 rounded-md hover:bg-surface-bone dark:hover:bg-zinc-900 select-none"
                      >
                        Ẩn
                      </button>
                      <span className="text-[10px] font-mono font-extrabold tracking-widest text-mute dark:text-on-dark-mute uppercase block mb-1.5 select-none">
                        Dịch nghĩa tiếng Việt
                      </span>
                      <p className="text-sm font-semibold text-ink dark:text-on-dark leading-relaxed">
                        {currentSentence.meaning}
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowMeaning(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface-bone/80 hover:bg-primary/10 hover:text-primary dark:bg-zinc-850 dark:hover:bg-primary/20 dark:hover:text-primary rounded-xl border border-hairline dark:border-zinc-800 text-xs font-bold text-mute transition-all cursor-pointer shadow-xs active:scale-95 select-none"
                    >
                      👁️ Xem dịch nghĩa
                    </button>
                  )}
                </div>
              </div>

              {/* Recording Controls */}
              <div className="pt-6 border-t border-hairline dark:border-zinc-800/80 text-center space-y-4 z-10">
                <div className="flex flex-col items-center justify-center gap-3">
                  {/* Dynamic Soundwave display when recording */}
                  {isListening ? (
                    <div className="flex items-end justify-center gap-1.5 h-10 mb-2">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="wave-bar w-1.5 bg-red-500 rounded-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="h-10 mb-2 flex items-center justify-center">
                      <span className="text-xs text-mute dark:text-on-dark-mute font-mono">Microphone sẵn sàng</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`h-20 w-20 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shadow-xl active:scale-90 relative ${isListening
                      ? 'bg-red-500 hover:bg-red-600 text-white ring-8 ring-red-500/20'
                      : 'bg-primary hover:bg-primary-deep text-white hover:shadow-primary/20 hover:shadow-2xl ring-8 ring-primary/10'
                      }`}
                  >
                    {isListening ? (
                      <MicOff size={32} className="animate-pulse" />
                    ) : (
                      <Mic size={32} />
                    )}
                  </button>

                  <span className="text-xs font-bold text-ink dark:text-on-dark mt-1">
                    {isListening ? 'Đang lắng nghe... Hãy nói ngay!' : 'Nhấp giữ Micro để bắt đầu nói'}
                  </span>
                </div>

                {/* Error message */}
                {speechError && (
                  <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200/30 dark:border-red-900/30 rounded-xl p-3 max-w-md mx-auto flex items-start gap-2 text-left">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{speechError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              {playMode === 'random' ? (
                <button
                  onClick={handleRandom}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-deep text-white rounded-full text-xs font-bold cursor-pointer transition-all shadow-md active:scale-95 mx-auto"
                >
                  <Dices size={16} />
                  Câu ngẫu nhiên khác
                </button>
              ) : (
                <>
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-1.5 px-5 py-2.5 border border-hairline dark:border-zinc-800 rounded-full text-xs font-bold text-mute hover:text-ink dark:hover:text-on-dark hover:bg-surface-bone dark:hover:bg-zinc-900 cursor-pointer disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm active:scale-95"
                  >
                    <ChevronLeft size={16} />
                    Câu trước
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={currentIndex === filteredSentences.length - 1}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-surface-card border border-hairline dark:bg-zinc-900 dark:border-zinc-800 rounded-full text-xs font-bold text-ink dark:text-on-dark hover:bg-surface-bone dark:hover:bg-black cursor-pointer disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm active:scale-95"
                  >
                    Câu tiếp theo
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sidebar results & feedback panel */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="rounded-3xl border border-hairline dark:border-divider-dark bg-surface-card dark:bg-zinc-900/40 p-6 shadow-sm min-h-[460px] flex flex-col justify-between text-left">
              <div className="space-y-6 flex-1 flex flex-col">
                <h3 className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider flex items-center gap-2 border-b border-hairline dark:border-zinc-850 pb-3">
                  <Sparkles size={14} className="text-primary animate-pulse" />
                  Đánh giá phát âm
                </h3>

                {checked && score !== null ? (
                  <div className="space-y-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-5">
                      {/* Score display ring */}
                      <div className="flex items-center gap-4 bg-surface-bone/50 dark:bg-zinc-900 p-4 rounded-2xl border border-hairline dark:border-zinc-800/80">
                        <div className="relative flex items-center justify-center shrink-0">
                          <svg className="w-16 h-16 transform -rotate-90">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="4"
                              className="text-hairline dark:text-zinc-800"
                              fill="transparent"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="4"
                              strokeDasharray={176}
                              strokeDashoffset={176 - (176 * score) / 100}
                              className={`transition-all duration-1000 ${score >= 80
                                ? 'text-emerald-500'
                                : score >= 50
                                  ? 'text-amber-500'
                                  : 'text-red-500'
                                }`}
                              fill="transparent"
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute font-mono font-extrabold text-sm text-ink dark:text-on-dark">
                            {score}%
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-extrabold text-ink dark:text-on-dark">
                            {score >= 80 ? 'Xuất sắc!' : score >= 50 ? 'Khá tốt!' : 'Cần cải thiện'}
                          </div>
                          <div className="text-[10px] text-mute dark:text-on-dark-mute mt-0.5">
                            Khớp {gradedChars.filter(c => c.correct).length}/{gradedChars.length} từ chữ Hán.
                          </div>
                        </div>
                      </div>

                      {/* Character Analysis Grid */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-mono font-bold text-mute uppercase tracking-widest block">Chi tiết từng chữ:</span>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {gradedChars.map((item, idx) => (
                            <div 
                              key={idx} 
                              className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-center ${
                                item.correct 
                                  ? 'bg-emerald-500/5 border-emerald-500/20 dark:border-emerald-500/10' 
                                  : 'bg-red-500/5 border-red-500/20 dark:border-red-500/10'
                              }`}
                            >
                              <span className={`text-xl font-display font-extrabold ${item.correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                {item.char}
                              </span>
                              <span className="text-[9px] font-mono text-mute leading-none">{item.pinyin}</span>
                              {item.correct ? (
                                <CheckCircle2 size={10} className="text-emerald-500 mt-0.5" />
                              ) : (
                                <XCircle size={10} className="text-red-400 mt-0.5" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Transcribed spoken speech */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono font-bold text-mute uppercase tracking-widest block">Kết quả ghi âm:</span>
                        <p className="text-lg font-display font-extrabold text-primary bg-primary/5 border border-primary/10 p-3.5 rounded-xl leading-relaxed select-all">
                          {spokenText || 'Trình duyệt không nghe rõ...'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2.5 mt-4">
                      <button
                        type="button"
                        onClick={handleSpeakSample}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 border border-hairline dark:border-zinc-800 hover:bg-surface-bone dark:hover:bg-zinc-900 text-ink dark:text-on-dark text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm"
                        title="Nghe lại phát âm mẫu của hệ thống"
                      >
                        <Volume2 size={14} />
                        Nghe lại mẫu
                      </button>
                      <button
                        type="button"
                        onClick={toggleListening}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-primary hover:bg-primary-deep text-white text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm"
                      >
                        <Mic size={14} />
                        Nói lại câu này
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-10 text-center gap-3">
                    <div className="h-16 w-16 rounded-full bg-surface-bone dark:bg-zinc-800 flex items-center justify-center border border-hairline dark:border-zinc-800">
                      <HelpCircle size={28} className="text-mute/40 stroke-1" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink dark:text-on-dark">Chờ phát âm...</p>
                      <p className="text-[10px] text-mute dark:text-on-dark-mute max-w-[190px] leading-relaxed mt-1 mx-auto">
                        Hãy nhấp vào nút ghi âm màu xanh bên trái và bắt đầu đọc to câu chữ Hán để hiển thị báo cáo chi tiết tại đây.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
