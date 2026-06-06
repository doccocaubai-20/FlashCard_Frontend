import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { translationData } from '../data/translationData';
import { 
  Sparkles, 
  Languages, 
  HelpCircle, 
  ChevronRight, 
  ChevronLeft, 
  ArrowLeft, 
  Volume2, 
  BookOpen, 
  Eye, 
  EyeOff
} from 'lucide-react';

export default function TranslationPlaygroundScreen() {
  const navigate = useNavigate();

  // Screen states
  const [filterLevel, setFilterLevel] = useState('HSK 1');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userTranslation, setUserTranslation] = useState('');
  const [showPinyin, setShowPinyin] = useState(true);
  const [checked, setChecked] = useState(false);

  // Filter sentences by level
  const filteredSentences = useMemo(() => {
    return translationData.filter((s) => s.level === filterLevel);
  }, [filterLevel]);

  const currentSentence = filteredSentences[currentIndex] || filteredSentences[0];

  const handleNext = () => {
    if (currentIndex < filteredSentences.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      resetQuestion();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      resetQuestion();
    }
  };

  const resetQuestion = () => {
    setUserTranslation('');
    setChecked(false);
  };

  const speakWord = (e, text) => {
    e.stopPropagation();
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const speakFullSentence = () => {
    if (!currentSentence || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentSentence.hanzi);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  // Grade translation based on matching keywords
  const gradingResult = useMemo(() => {
    if (!checked || !currentSentence) return null;

    const lowerInput = userTranslation.toLowerCase().trim();
    const matches = currentSentence.keywords.map((kw) => {
      // Simple word match check
      const found = lowerInput.includes(kw.toLowerCase());
      return { keyword: kw, found };
    });

    const score = Math.round(
      (matches.filter((m) => m.found).length / currentSentence.keywords.length) * 100
    );

    return { matches, score };
  }, [checked, userTranslation, currentSentence]);

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
              <Languages size={22} className="text-primary" />
              Luyện dịch câu song ngữ
            </h1>
            <p className="text-xs text-mute mt-0.5">Dịch câu Trung - Việt theo cấp độ HSK và nhận đánh giá từ khóa lập tức.</p>
          </div>
        </div>
      </div>

      {/* Level Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline dark:border-divider-dark pb-4">
        <div className="flex items-center gap-2 text-mute dark:text-on-dark-mute text-xs font-semibold uppercase tracking-wider">
          Cấp độ câu dịch:
        </div>
        <div className="flex gap-2">
          {['HSK 1', 'HSK 2', 'HSK 3'].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                setFilterLevel(lvl);
                setCurrentIndex(0);
                resetQuestion();
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

      {currentSentence && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Main workspace card */}
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/40 p-6 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[380px]">
              
              {/* Question Index Badge & Pinyin Toggle */}
              <div className="flex justify-between items-center border-b border-hairline dark:border-divider-dark pb-3">
                <span className="text-[10px] font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-widest">
                  Câu hỏi {currentIndex + 1} / {filteredSentences.length}
                </span>

                <button
                  type="button"
                  onClick={() => setShowPinyin(!showPinyin)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-deep font-semibold cursor-pointer"
                >
                  {showPinyin ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{showPinyin ? 'Ẩn Phiên âm' : 'Hiện Phiên âm'}</span>
                </button>
              </div>

              {/* Chinese Sentence Container */}
              <div className="py-6 text-center space-y-4">
                
                {/* Pinyin representation */}
                {showPinyin && (
                  <p className="text-sm font-mono font-semibold text-primary/80 tracking-wide select-all">
                    {currentSentence.pinyin}
                  </p>
                )}

                {/* Interactive character blocks (hover tooltip) */}
                <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-3 py-3 text-3xl font-display font-extrabold select-none leading-normal">
                  {currentSentence.tokens.map((token, idx) => (
                    <div 
                      key={idx} 
                      className="group relative cursor-help border-b-2 border-dashed border-mute/30 hover:border-primary pb-0.5 transition-colors shrink-0"
                    >
                      <span 
                        onClick={(e) => speakWord(e, token.word)} 
                        className="hover:text-primary transition-colors text-ink dark:text-on-dark font-display font-extrabold"
                      >
                        {token.word}
                      </span>
                      
                      {/* Interactive popup tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3.5 w-36 p-2 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-md shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-10 text-center space-y-0.5">
                        <div className="text-xs font-mono font-bold text-primary">{token.pinyin}</div>
                        <div className="text-[10px] text-body dark:text-on-dark-mute leading-normal">{token.meaning}</div>
                        <div className="text-[8px] text-mute pt-0.5">Click để nghe phát âm</div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Speaker trigger button */}
                  <button
                    onClick={speakFullSentence}
                    className="h-8 w-8 rounded-full bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-primary shadow-sm flex items-center justify-center cursor-pointer active:scale-95 ml-2 self-center shrink-0"
                    title="Nghe đọc toàn bộ câu"
                  >
                    <Volume2 size={13} />
                  </button>
                </div>

                <p className="text-[10px] text-mute italic leading-relaxed">
                  * Mẹo: Rê chuột lên từng chữ Hán để xem nghĩa từ vựng hoặc nhấp vào để nghe đọc.
                </p>
              </div>

              {/* User Translation Input */}
              <div className="space-y-3 pt-3 border-t border-hairline dark:border-divider-dark">
                <textarea
                  value={userTranslation}
                  onChange={(e) => setUserTranslation(e.target.value)}
                  disabled={checked}
                  rows={2}
                  className="w-full bg-surface-bone/50 dark:bg-black/35 border border-hairline dark:border-divider-dark rounded-md p-3 text-xs outline-none text-ink dark:text-on-dark focus:ring-1 focus:ring-primary focus:bg-surface-card placeholder-mute resize-none font-medium text-left"
                  placeholder="Nhập bản dịch tiếng Việt của bạn tại đây..."
                />

                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={resetQuestion}
                    className="px-4 py-2 border border-hairline dark:border-divider-dark rounded-full text-xs font-semibold text-mute hover:text-ink hover:bg-surface-bone dark:hover:bg-black cursor-pointer"
                  >
                    Làm lại câu này
                  </button>

                  <button
                    type="button"
                    onClick={() => setChecked(true)}
                    disabled={!userTranslation.trim() || checked}
                    className="px-5 py-2 bg-primary hover:bg-primary-deep text-white font-bold text-xs rounded-full cursor-pointer transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    Kiểm tra dịch
                  </button>
                </div>
              </div>

            </div>

            {/* Navigation Buttons */}
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

          {/* Sidebar Feedback Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/40 p-5 shadow-sm text-left flex flex-col gap-4 min-h-[380px]">
              <h3 className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider flex items-center gap-1.5 border-b border-hairline dark:border-divider-dark pb-3">
                <Sparkles size={14} className="text-primary" />
                Báo cáo kết quả dịch
              </h3>

              {checked && gradingResult ? (
                <div className="space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Score Ring */}
                    <div className="flex items-center gap-3 bg-surface-bone/50 dark:bg-black/25 p-3 rounded-md border border-hairline dark:border-divider-dark">
                      <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center font-mono font-extrabold text-sm text-primary">
                        {gradingResult.score}%
                      </div>
                      <div>
                        <div className="text-xs font-bold text-ink dark:text-on-dark">Điểm chính xác</div>
                        <div className="text-[10px] text-mute mt-0.5">Khớp {gradingResult.matches.filter(m => m.found).length}/{currentSentence.keywords.length} từ khóa dịch nghĩa</div>
                      </div>
                    </div>

                    {/* Standard translation response */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-bold text-mute uppercase">Bản dịch chuẩn:</span>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-3 rounded-md leading-relaxed">
                        {currentSentence.meaning}
                      </p>
                    </div>

                    {/* Keywords list with checkmarks */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-mono font-bold text-mute uppercase">Danh sách từ khóa cần dịch:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {gradingResult.matches.map((match, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold border ${
                              match.found
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400'
                                : 'bg-red-50 border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400'
                            }`}
                          >
                            <span className="font-mono">{match.found ? '✓' : '✗'}</span>
                            {match.keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Grammar links referrals */}
                  <div className="pt-3 border-t border-hairline dark:border-divider-dark">
                    <button
                      onClick={() => navigate('/grammar')}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-md transition-colors cursor-pointer"
                    >
                      <BookOpen size={13} />
                      Ôn tập Ngữ pháp HSK
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 flex-1">
                  <HelpCircle size={40} className="text-mute/40 stroke-1 mb-2.5" />
                  <p className="text-xs text-mute leading-relaxed max-w-[200px]">
                    Hãy nhập bản dịch của bạn ở bên trái và bấm <strong>Kiểm tra dịch</strong> để nhận đánh giá chi tiết.
                  </p>
                </div>
              )}

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
