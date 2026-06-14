import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { translationData } from '../data/translationData';
import { statsApi } from '../services/statsApi';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  ArrowLeft, 
  Sparkles, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export default function SpeakingScreen() {
  const navigate = useNavigate();

  // Selected level & indices
  const [filterLevel, setFilterLevel] = useState('HSK 1');
  const [currentIndex, setCurrentIndex] = useState(0);

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
  const [gradedChars, setGradedChars] = useState([]); // Array of { char, correct }
  const [checked, setChecked] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);

  const recognitionRef = useRef(null);

  // Grade spoken Hanzi character by character
  const gradePronunciation = (spokenStr) => {
    if (!currentSentence) return;

    // Remove punctuation from both targets
    const targetClean = currentSentence.hanzi.replace(/[。？！，、；：]/g, '').trim();
    const spokenClean = spokenStr.replace(/[。？！，、；：\s]/g, '').trim();

    const targetChars = Array.from(targetClean);
    const spokenChars = Array.from(spokenClean);

    const results = [];
    let correctCount = 0;

    targetChars.forEach((char) => {
      // Find matching character in spoken input
      const matchIdx = spokenChars.indexOf(char);
      if (matchIdx !== -1) {
        results.push({ char, correct: true });
        spokenChars.splice(matchIdx, 1); // remove matched char to prevent duplicate matching
        correctCount++;
      } else {
        results.push({ char, correct: false });
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
  };

  const handleNext = () => {
    if (currentIndex < filteredSentences.length - 1) {
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-hairline dark:border-divider-dark pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-bone dark:hover:bg-black text-mute cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink dark:text-on-dark tracking-tight flex items-center gap-2">
              <Mic size={22} className="text-primary" />
              Luyện nói phát âm HSK
            </h1>
            <p className="text-xs text-mute mt-0.5">Nói câu chữ Hán và nhận phân tích chấm điểm phát âm chuẩn tức thời.</p>
          </div>
        </div>
      </div>

      {/* Level Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline dark:border-divider-dark pb-4">
        <div className="flex items-center gap-2 text-mute dark:text-on-dark-mute text-xs font-semibold uppercase tracking-wider">
          Cấp độ câu luyện nói:
        </div>
        <div className="flex gap-2">
          {['HSK 1', 'HSK 2', 'HSK 3'].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                setFilterLevel(lvl);
                setCurrentIndex(0);
                resetPractice();
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                filterLevel === lvl
                  ? 'bg-primary border-transparent text-white shadow-sm'
                  : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Browser Support Check */}
      {!browserSupported && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-md p-5 text-left flex gap-3 max-w-lg mx-auto">
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
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/40 p-6 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[400px]">
              
              {/* Index & reset */}
              <div className="flex justify-between items-center border-b border-hairline dark:border-divider-dark pb-3">
                <span className="text-[10px] font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-widest">
                  Câu {currentIndex + 1} / {filteredSentences.length}
                </span>

                <button
                  type="button"
                  onClick={resetPractice}
                  className="flex items-center gap-1 text-xs text-mute hover:text-primary transition-colors cursor-pointer"
                >
                  <RefreshCw size={12} />
                  <span>Xóa gõ lại</span>
                </button>
              </div>

              {/* Character blocks */}
              <div className="py-6 text-center space-y-4">
                <p className="text-sm font-mono font-semibold text-primary/80 tracking-wide">
                  {currentSentence.pinyin}
                </p>

                {/* Target Sentence Display */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 py-4 text-3xl font-display font-extrabold select-none leading-normal">
                  {checked && gradedChars.length > 0 ? (
                    /* Graded characters (color-coded) */
                    gradedChars.map((item, idx) => (
                      <span
                        key={idx}
                        className={`transition-colors duration-300 font-display font-extrabold ${
                          item.correct
                            ? 'text-emerald-500 dark:text-emerald-400'
                            : 'text-red-500 dark:text-red-400 border-b-2 border-red-500/30'
                        }`}
                      >
                        {item.char}
                      </span>
                    ))
                  ) : (
                    /* Default display characters */
                    <span className="text-ink dark:text-on-dark font-display font-extrabold">
                      {currentSentence.hanzi}
                    </span>
                  )}

                  {/* Speaker play button */}
                  <button
                    onClick={handleSpeakSample}
                    className="h-8 w-8 rounded-full bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-primary shadow-sm flex items-center justify-center cursor-pointer active:scale-95 ml-3"
                    title="Nghe giọng chuẩn"
                  >
                    <Volume2 size={13} />
                  </button>
                </div>

                <p className="text-sm font-semibold text-body dark:text-on-dark-mute italic">
                  "{currentSentence.meaning}"
                </p>
              </div>

              {/* Recording Controls */}
              <div className="pt-5 border-t border-hairline dark:border-divider-dark text-center space-y-4">
                
                {/* Audio record button */}
                <div className="flex flex-col items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`h-16 w-16 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                        : 'bg-primary hover:bg-primary-deep text-white'
                    }`}
                  >
                    {isListening ? <MicOff size={26} /> : <Mic size={26} />}
                  </button>
                  
                  <span className="text-xs font-bold text-ink dark:text-on-dark">
                    {isListening ? 'Đang lắng nghe... Nói ngay!' : 'Nhấn micro để bắt đầu nói'}
                  </span>
                </div>

                {/* Error message */}
                {speechError && (
                  <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200/40 rounded p-2.5 max-w-md mx-auto">
                    {speechError}
                  </p>
                )}
              </div>

            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex items-center gap-1 px-4 py-2 border border-hairline dark:border-divider-dark rounded-full text-xs font-semibold text-mute hover:text-ink hover:bg-surface-bone dark:hover:bg-black cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft size={14} />
                Câu trước
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === filteredSentences.length - 1}
                className="flex items-center gap-1 px-4 py-2 bg-surface-card border border-hairline dark:bg-surface-dark dark:border-divider-dark rounded-full text-xs font-semibold text-ink dark:text-on-dark hover:bg-surface-bone dark:hover:bg-black cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              >
                Câu tiếp theo
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Sidebar results & feedback panel */}
          <div className="lg:col-span-4 space-y-6 text-left">
            <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/40 p-5 shadow-sm min-h-[400px] flex flex-col justify-between">
              
              <div className="space-y-5">
                <h3 className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider flex items-center gap-1.5 border-b border-hairline dark:border-divider-dark pb-3">
                  <Sparkles size={14} className="text-primary" />
                  Đánh giá phát âm
                </h3>

                {checked && score !== null ? (
                  <div className="space-y-5">
                    {/* Score badge circle */}
                    <div className="flex items-center gap-3 bg-surface-bone/50 dark:bg-black/25 p-3 rounded-md border border-hairline dark:border-divider-dark">
                      <div className={`h-12 w-12 rounded-full border-4 flex items-center justify-center font-mono font-extrabold text-sm ${
                        score >= 80 
                          ? 'border-emerald-500/20 border-t-emerald-500 text-emerald-500' 
                          : score >= 50 
                          ? 'border-amber-500/20 border-t-amber-500 text-amber-500' 
                          : 'border-red-500/20 border-t-red-500 text-red-500'
                      }`}>
                        {score}%
                      </div>
                      <div>
                        <div className="text-xs font-bold text-ink dark:text-on-dark">
                          {score >= 80 ? 'Xuất sắc!' : score >= 50 ? 'Khá tốt!' : 'Cần cố gắng'}
                        </div>
                        <div className="text-[10px] text-mute mt-0.5">Đọc khớp {gradedChars.filter(c => c.correct).length}/{gradedChars.length} từ chữ Hán.</div>
                      </div>
                    </div>

                    {/* Speech to text result */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-bold text-mute uppercase">Trình duyệt nghe thấy:</span>
                      <p className="text-xs font-bold text-primary bg-primary/5 border border-primary/20 p-3 rounded-md leading-relaxed select-all">
                        {spokenText || '...'}
                      </p>
                    </div>

                    {/* Tips */}
                    <div className="text-[10px] text-mute leading-relaxed space-y-1">
                      <span className="font-bold text-ink dark:text-on-dark block">Mẹo luyện giọng:</span>
                      <p>1. Nhấp nút loa phát lại để nghe cách biến điệu âm sắc chuẩn.</p>
                      <p>2. Đọc rõ ràng từng chữ, giữ tốc độ vừa phải.</p>
                      <p>3. Kiểm tra lại micro nếu hệ thống nghe sai từ tiếng Việt.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center flex-1">
                    <Mic size={40} className="text-mute/30 stroke-1 mb-2" />
                    <p className="text-xs text-mute max-w-[180px] leading-relaxed">
                      Bấm nút ghi âm và đọc to câu chữ Hán để nhận kết quả phân tích phát âm.
                    </p>
                  </div>
                )}
              </div>

              {checked && score !== null && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-primary text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
                >
                  <Mic size={13} />
                  Thử nói lại
                </button>
              )}

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
