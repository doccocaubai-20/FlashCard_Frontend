import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import unscrambleQuestionBank from '../data/unscrambleQuestionBank.json';
import { useToast } from '../context/ToastContext';
import { gameRecordsApi } from '../services/learningApi';
import { 
  Puzzle, 
  Timer, 
  RotateCcw, 
  Trophy, 
  Volume2, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Play,
  ArrowRight,
  Home
} from 'lucide-react';

export default function UnscrambleGameScreen() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Game configuration states
  const [selectedLevel, setSelectedLevel] = useState('HSK 1');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  // Game play states
  const [sentences, setSentences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pool, setPool] = useState([]); // Shuffled tokens available
  const [workspace, setWorkspace] = useState([]); // Tokens selected by user
  
  // Checking states
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasMadeMistakeThisTurn, setHasMadeMistakeThisTurn] = useState(false);

  // Statistics
  const [correctCount, setCorrectCount] = useState(0); // Correct on first try
  const [seconds, setSeconds] = useState(0);
  const [roundHistory, setRoundHistory] = useState([]); // { sentence, firstTryCorrect }

  const timerRef = useRef(null);
  const currentSentence = sentences[currentIndex];

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

  // Save game record when game is won
  useEffect(() => {
    if (gameWon && gameStarted && sentences.length > 0) {
      const finalScore = Math.round((correctCount / sentences.length) * 100);
      gameRecordsApi.save({
        gameType: 'UNSCRAMBLE',
        level: selectedLevel,
        score: finalScore,
        accuracy: parseFloat((correctCount / sentences.length).toFixed(2)),
        duration: seconds,
        details: {
          totalSentences: sentences.length,
          correctCount,
          seconds,
          roundHistory: roundHistory.map(h => ({
            hanzi: h.sentence.hanzi,
            firstTryCorrect: h.firstTryCorrect
          })),
        }
      }).catch(err => console.error('Error saving unscramble game record:', err));
    }
  }, [gameWon, gameStarted, correctCount, sentences.length, selectedLevel, seconds, roundHistory]);

  // Start game round
  const startGame = () => {
    // Filter sentences by level
    const poolSentences = unscrambleQuestionBank.filter((s) => s.level === selectedLevel);
    
    if (poolSentences.length === 0) {
      showToast('Không tìm thấy câu phù hợp với cấp độ đã chọn.', 'warning');
      return;
    }

    // Pick 10 random sentences (or all if less than 10)
    const shuffled = [...poolSentences].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));

    setSentences(selected);
    setCurrentIndex(0);
    setSeconds(0);
    setCorrectCount(0);
    setRoundHistory([]);
    setGameStarted(true);
    setGameWon(false);
    
    setupSentence(selected[0]);
  };

  // Setup a specific sentence
  const setupSentence = (sentence) => {
    if (!sentence) return;

    // Create unique-identity tokens from sentence tokens (correct items)
    const correctPool = sentence.tokens.map((t, idx) => ({
      id: `token_correct_${idx}`,
      word: t.word,
      pinyin: t.pinyin,
      meaning: t.meaning,
      isDistractor: false,
      originalIndex: idx
    }));

    // Create unique-identity tokens from sentence distractors (distractor items)
    const distractorPool = (sentence.distractors || []).map((d, idx) => ({
      id: `token_dist_${idx}`,
      word: d.word,
      pinyin: d.pinyin,
      meaning: d.meaning,
      isDistractor: true,
      originalIndex: -1
    }));

    // Combine correct tokens and distractors
    const initialPool = [...correctPool, ...distractorPool];

    // Shuffle pool
    const shuffledPool = [...initialPool].sort(() => 0.5 - Math.random());
    
    setPool(shuffledPool);
    setWorkspace([]);
    setChecked(false);
    setIsCorrect(false);
    setHasMadeMistakeThisTurn(false);
  };

  // Move token from Pool to Workspace
  const handleTokenSelect = (token) => {
    if (checked) return;
    setWorkspace((prev) => [...prev, token]);
    setPool((prev) => prev.filter((item) => item.id !== token.id));
  };

  // Move token from Workspace back to Pool
  const handleTokenReturn = (token) => {
    if (checked) return;
    setPool((prev) => [...prev, token]);
    setWorkspace((prev) => prev.filter((item) => item.id !== token.id));
  };

  // Clear workspace
  const handleClearWorkspace = () => {
    if (checked) return;
    setPool((prev) => [...prev, ...workspace]);
    setWorkspace([]);
  };

  // Play audio via TTS
  const speakSentence = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  // Verify assembled order
  const handleCheck = () => {
    if (workspace.length === 0 || checked) return;

    const userStr = workspace.map((w) => w.word).join('');
    const targetStr = currentSentence.tokens.map((t) => t.word).join('');

    const correct = userStr === targetStr;
    setIsCorrect(correct);
    setChecked(true);

    if (correct) {
      // Speak the sentence immediately
      speakSentence(currentSentence.hanzi);

      if (!hasMadeMistakeThisTurn) {
        setCorrectCount((prev) => prev + 1);
      }

      // Record history
      setRoundHistory((prev) => [
        ...prev,
        {
          sentence: currentSentence,
          firstTryCorrect: !hasMadeMistakeThisTurn
        }
      ]);

      // Auto advance after 2 seconds if correct
      setTimeout(() => {
        handleNext();
      }, 2000);
    } else {
      setHasMadeMistakeThisTurn(true);
    }
  };

  const handleNext = () => {
    if (currentIndex < sentences.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setupSentence(sentences[nextIdx]);
    } else {
      // Round completed
      setGameWon(true);
    }
  };

  // Format time display
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
              <Puzzle size={22} className="text-primary" />
              Xếp câu tiếng Trung HSK
            </h1>
            <p className="text-xs text-mute mt-0.5">Sắp xếp các mảnh ghép từ vựng để tạo thành câu hoàn chỉnh theo ngữ pháp.</p>
          </div>
        </div>
      </div>

      {!gameStarted ? (
        /* Configuration Screen */
        <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/40 p-8 text-center max-w-lg mx-auto space-y-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary mx-auto">
            <Puzzle size={24} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-ink dark:text-on-dark">Chọn cấp độ thử thách</h2>
            <p className="text-xs text-mute leading-relaxed">
              Bạn sẽ nhận ngẫu nhiên 10 câu đố. Hãy dịch nghĩa tiếng Việt và chọn mảnh ghép chữ Hán tương ứng.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 py-2">
            {['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6', 'HSK 7-9'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  selectedLevel === lvl
                    ? 'bg-primary border-transparent text-white shadow-md'
                    : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button
            onClick={startGame}
            className="w-full py-3 bg-primary hover:bg-primary-deep text-white font-bold rounded-md cursor-pointer transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
          >
            <Play size={16} />
            Bắt đầu chơi
          </button>
        </div>
      ) : (
        /* Game Play Screen */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left panel: Game Arena */}
          <div className="lg:col-span-8 space-y-6 flex flex-col justify-between">
            
            {/* Top status */}
            <div className="flex justify-between items-center bg-surface-bone/35 dark:bg-black/15 border border-hairline dark:border-divider-dark p-3 rounded-md px-4">
              <span className="text-xs font-bold text-ink dark:text-on-dark font-mono">
                Câu {currentIndex + 1} / {sentences.length}
              </span>
              
              <div className="flex items-center gap-4">
                <span className="text-xs text-mute flex items-center gap-1 font-mono">
                  <Timer size={13} className="text-primary" />
                  {formatTime(seconds)}
                </span>
                
                <div className="w-24 bg-surface-bone dark:bg-black/40 h-2 rounded-full overflow-hidden border border-hairline dark:border-divider-dark">
                  <div 
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / sentences.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Prompt card */}
            <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/40 p-6 text-center space-y-4 shadow-sm min-h-[140px] flex flex-col justify-center">
              <span className="text-[9px] font-mono font-bold text-mute uppercase tracking-widest block">Dịch nghĩa tiếng Việt:</span>
              <p className="text-lg font-bold text-ink dark:text-on-dark italic font-serif leading-relaxed px-4">
                "{currentSentence?.meaning}"
              </p>
            </div>

            {/* Workspace (Answer selection) */}
            <div className="rounded-md border-2 border-dashed border-primary/30 dark:border-divider-dark bg-surface-bone/10 p-5 min-h-[120px] flex flex-wrap items-center justify-center gap-3 relative">
              {workspace.length === 0 ? (
                <div className="text-xs text-mute/50 font-semibold flex items-center gap-1.5 pointer-events-none select-none">
                  <HelpCircle size={14} />
                  Nhấp các mảnh ghép từ vựng bên dưới để xếp câu...
                </div>
              ) : (
                workspace.map((token) => (
                  <button
                    key={token.id}
                    onClick={() => handleTokenReturn(token)}
                    disabled={checked}
                    className={`px-4 py-2 bg-surface-card dark:bg-surface-dark border rounded-md shadow-xs text-base font-bold font-display hanzi-text cursor-pointer transition-all active:scale-95 ${
                      checked
                        ? isCorrect
                          ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/25'
                          : 'border-red-500 text-red-600 dark:text-red-400 bg-red-50/25'
                        : 'border-hairline dark:border-divider-dark text-ink dark:text-on-dark hover:border-primary/50'
                    }`}
                  >
                    {token.word}
                  </button>
                ))
              )}
            </div>

            {/* Shuffled Word Pool */}
            <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/30 p-5 min-h-[120px] flex flex-wrap items-center justify-center gap-3">
              {pool.length === 0 && workspace.length > 0 && !checked ? (
                <div className="text-xs text-mute italic font-medium">Đã chọn hết mảnh ghép. Hãy bấm Kiểm tra đáp án!</div>
              ) : (
                pool.map((token) => (
                  <button
                    key={token.id}
                    onClick={() => handleTokenSelect(token)}
                    disabled={checked}
                    className="px-4 py-2.5 bg-surface-bone/50 hover:bg-surface-bone dark:bg-black/25 dark:hover:bg-black/50 border border-hairline dark:border-divider-dark rounded-md text-base font-bold font-display hanzi-text cursor-pointer transition-all active:scale-95 text-ink dark:text-on-dark hover:border-primary/50"
                  >
                    {token.word}
                    {token.pinyin && (
                      <span className="block text-[8px] font-mono font-medium text-primary/70 tracking-normal mt-0.5">
                        {token.pinyin}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center gap-4">
              <button
                onClick={handleClearWorkspace}
                disabled={workspace.length === 0 || checked}
                className="px-4 py-2 border border-hairline dark:border-divider-dark rounded-full text-xs font-semibold text-mute hover:text-ink hover:bg-surface-bone dark:hover:bg-black cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              >
                Xóa làm lại
              </button>

              <div className="flex gap-2">
                {!checked ? (
                  <button
                    onClick={handleCheck}
                    disabled={workspace.length === 0}
                    className="px-6 py-2 bg-primary hover:bg-primary-deep disabled:bg-primary/40 text-white text-xs font-bold rounded-full cursor-pointer transition-all active:scale-95 disabled:pointer-events-none shadow-sm"
                  >
                    Kiểm tra đáp án
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-full cursor-pointer transition-all active:scale-95 shadow-sm"
                  >
                    {currentIndex === sentences.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo'}
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Right panel: Feedback & Correct Answer */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/40 p-5 shadow-sm min-h-[420px] flex flex-col justify-between">
              
              <div className="space-y-6 text-left">
                <h3 className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider border-b border-hairline dark:border-divider-dark pb-3">
                  Trạng thái đáp án
                </h3>

                {checked ? (
                  <div className="space-y-5">
                    
                    {/* Correct / Incorrect alert */}
                    {isCorrect ? (
                      <div className="flex items-start gap-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded p-4 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold">Chính xác!</h4>
                          <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed">
                            Cú pháp và trật tự từ của bạn hoàn toàn chính xác.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded p-4 text-red-600 dark:text-red-400">
                        <XCircle size={16} className="shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold">Chưa chính xác</h4>
                          <p className="text-[10px] text-red-700/80 dark:text-red-400/80 leading-relaxed">
                            Trật tự từ chưa đúng. Xem đáp án chuẩn bên dưới.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Speech sample button */}
                    <div className="space-y-2 border-t border-hairline dark:border-divider-dark pt-4">
                      <span className="text-[9px] font-mono font-bold text-mute uppercase">Đáp án đúng chuẩn:</span>
                      
                      <div className="bg-surface-bone/50 dark:bg-black/25 p-3.5 rounded border border-hairline dark:border-divider-dark space-y-2 relative">
                        <p className="text-lg font-bold font-display text-ink dark:text-on-dark select-all pr-8">
                          <span className="hanzi-char">{currentSentence.hanzi}</span>
                        </p>
                        <p className="text-xs font-mono font-bold text-primary/80">
                          {currentSentence.pinyin}
                        </p>

                        <button
                          onClick={() => speakSentence(currentSentence.hanzi)}
                          className="absolute right-2 top-2 p-1.5 bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark rounded-full text-primary shadow-xs cursor-pointer"
                          title="Nghe phát âm"
                        >
                          <Volume2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Word explanation details */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-mono font-bold text-mute uppercase">Từ vựng cấu thành:</span>
                      <div className="max-h-[140px] overflow-y-auto space-y-1.5 border border-hairline dark:border-divider-dark p-2.5 rounded bg-surface-bone/20 dark:bg-black/15">
                        {currentSentence.tokens.map((t, idx) => (
                          <div key={idx} className="flex justify-between items-start text-[10px] border-b border-hairline/40 dark:border-divider-dark/40 pb-1 last:border-0 last:pb-0">
                            <div>
                              <span className="font-bold text-ink dark:text-on-dark font-display">{t.word}</span>
                              <span className="text-mute font-mono ml-1.5">({t.pinyin})</span>
                            </div>
                            <span className="text-mute italic text-right max-w-[120px] truncate">{t.meaning}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center flex-1">
                    <Puzzle size={40} className="text-mute/30 stroke-1 mb-2 animate-pulse" />
                    <p className="text-xs text-mute max-w-[180px] leading-relaxed">
                      Sắp xếp tất cả mảnh ghép rồi nhấn nút để kiểm tra câu trả lời của bạn.
                    </p>
                  </div>
                )}
              </div>

              {checked && !isCorrect && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-primary text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
                >
                  Bỏ qua & Tiếp tục
                  <ArrowRight size={13} />
                </button>
              )}

            </div>
          </div>

        </div>
      )}

      {/* Game Over Bento Modal Report */}
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
            className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-lg max-w-2xl w-full p-6 text-center space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            
            {/* Header */}
            <div className="space-y-2">
              <div className="h-14 w-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Trophy size={28} className="animate-bounce" />
              </div>
              <h2 className="font-display text-2xl font-extrabold text-ink dark:text-on-dark tracking-tight">Thử thách hoàn thành!</h2>
              <p className="text-xs text-mute">Bạn đã ôn tập xong danh sách câu HSK xếp thứ tự.</p>
            </div>

            {/* Bento Grid Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded bg-surface-bone/50 dark:bg-black/25 border border-hairline dark:border-divider-dark text-center">
                <span className="text-[9px] font-mono font-bold text-mute uppercase tracking-widest block">Thời gian ôn</span>
                <span className="text-xl font-mono font-bold text-primary dark:text-primary-deep mt-1 block">{formatTime(seconds)}</span>
              </div>
              <div className="p-4 rounded bg-surface-bone/50 dark:bg-black/25 border border-hairline dark:border-divider-dark text-center">
                <span className="text-[9px] font-mono font-bold text-mute uppercase tracking-widest block">Lần đầu đúng</span>
                <span className="text-xl font-mono font-bold text-emerald-500 mt-1 block">{correctCount} / {sentences.length}</span>
              </div>
              <div className="p-4 rounded bg-surface-bone/50 dark:bg-black/25 border border-hairline dark:border-divider-dark text-center">
                <span className="text-[9px] font-mono font-bold text-mute uppercase tracking-widest block">Độ chính xác</span>
                <span className="text-xl font-mono font-bold text-ink dark:text-on-dark mt-1 block">
                  {sentences.length > 0 ? Math.round((correctCount / sentences.length) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Sentence List Table */}
            <div className="space-y-2 text-left">
              <h4 className="text-xs font-mono font-bold text-mute uppercase tracking-wider">Lịch sử câu đã làm:</h4>
              <div className="border border-hairline dark:border-divider-dark rounded-md overflow-hidden max-h-[200px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-bone dark:bg-black/45 border-b border-hairline dark:border-divider-dark text-[9px] font-mono uppercase tracking-wider text-mute">
                      <th className="p-2.5">Trạng thái</th>
                      <th className="p-2.5">Câu chữ Hán (Target)</th>
                      <th className="p-2.5">Ý nghĩa</th>
                      <th className="p-2.5 text-center">Nghe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline dark:divide-divider-dark text-[11px]">
                    {roundHistory.map((hist, idx) => (
                      <tr key={idx} className="hover:bg-surface-bone/35 dark:hover:bg-black/20">
                        <td className="p-2.5 font-bold">
                          {hist.firstTryCorrect ? (
                            <span className="text-emerald-500 flex items-center gap-0.5"><CheckCircle2 size={11} /> 1-Try</span>
                          ) : (
                            <span className="text-amber-500 flex items-center gap-0.5"><XCircle size={11} /> Đã sửa</span>
                          )}
                        </td>
                        <td className="p-2.5 font-bold font-display text-ink dark:text-on-dark">
                          <span className="hanzi-char">{hist.sentence.hanzi}</span>
                          <span className="block text-[9px] font-mono font-normal text-mute mt-0.5">{hist.sentence.pinyin}</span>
                        </td>
                        <td className="p-2.5 text-mute italic">"{hist.sentence.meaning}"</td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => speakSentence(hist.sentence.hanzi)}
                            className="p-1 rounded hover:bg-surface-bone dark:hover:bg-black text-primary transition-colors cursor-pointer"
                          >
                            <Volume2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                className="flex-1 py-2.5 border border-hairline dark:border-divider-dark rounded-md text-xs font-bold text-mute hover:text-ink hover:bg-surface-bone dark:hover:bg-black transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowLeft size={13} />
                Đổi cấp độ
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setGameWon(false);
                  navigate('/');
                }}
                className="flex-1 py-2.5 border border-hairline dark:border-divider-dark rounded-md text-xs font-bold text-mute hover:text-ink hover:bg-surface-bone dark:hover:bg-black transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Home size={13} />
                Trang chủ
              </button>

              <button
                type="button"
                onClick={startGame}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-deep text-white font-bold rounded-md transition cursor-pointer shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={13} />
                Chơi lại
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
