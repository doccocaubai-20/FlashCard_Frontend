import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Volume2, 
  Play, 
  Pause, 
  Bookmark, 
  FileText, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  ListOrdered, 
  ChevronRight, 
  AlertCircle,
  HelpCircle,
  VolumeX,
  Send,
  Sparkles
} from 'lucide-react';
import { hskExamApi } from '../services/hskExamApi';
import { useToast } from '../context/ToastContext';

export default function HskExamPlayerScreen() {
  const { id: testId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Custom duration from query params (defaults to 35 min)
  const durationParam = parseInt(searchParams.get('duration'), 10);

  // Core Exam State
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User Interaction State
  const [userAnswers, setUserAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [notes, setNotes] = useState({}); // questionId -> string
  const [activeNoteModal, setActiveNoteModal] = useState(null); // questionId

  // Navigation & View State
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [gradeResult, setGradeResult] = useState(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 'wrong'
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Time State
  const [totalSeconds, setTotalSeconds] = useState(35 * 60);
  const [timeLeft, setTimeLeft] = useState(35 * 60);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Global Section Audio Player
  const globalAudioRef = useRef(null);
  const [isGlobalPlaying, setIsGlobalPlaying] = useState(false);
  const [globalCurrentTime, setGlobalCurrentTime] = useState(0);
  const [globalDuration, setGlobalDuration] = useState(0);
  const [globalVolume, setGlobalVolume] = useState(1);

  // Single Question Audio Player
  const questionAudioRef = useRef(null);
  const [playingQuestionAudioId, setPlayingQuestionAudioId] = useState(null);

  // Storage key for auto-saving progress
  const storageKey = `hsk_progress_${testId}`;

  // 1. Fetch Exam Details
  useEffect(() => {
    async function loadExam() {
      try {
        setLoading(true);
        setError(null);
        const data = await hskExamApi.getExamDetail(testId);
        if (!data || !data.sections) {
          throw new Error('Dữ liệu đề thi không hợp lệ');
        }
        setExam(data);

        // Determine total duration
        const officialMinutes = data.durationMinutes || (data.level === 1 ? 35 : data.level === 2 ? 50 : 85);
        const targetMinutes = durationParam && !isNaN(durationParam) ? durationParam : officialMinutes;
        const totalSecs = targetMinutes * 60;
        setTotalSeconds(totalSecs);

        // Restore saved progress if available
        try {
          const savedStr = localStorage.getItem(storageKey);
          if (savedStr) {
            const saved = JSON.parse(savedStr);
            if (saved.userAnswers) setUserAnswers(saved.userAnswers);
            if (saved.flagged) setFlaggedQuestions(new Set(saved.flagged));
            if (saved.notes) setNotes(saved.notes);
            if (saved.timeLeft > 0) setTimeLeft(saved.timeLeft);
            else setTimeLeft(totalSecs);
          } else {
            setTimeLeft(totalSecs);
          }
        } catch (e) {
          setTimeLeft(totalSecs);
        }
      } catch (err) {
        console.error('Failed to load exam detail:', err);
        setError('Không thể tải dữ liệu đề thi. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    }
    loadExam();
  }, [testId, durationParam]);

  // 2. Timer Countdown & Auto-Save
  useEffect(() => {
    if (loading || isSubmitted || isReviewMode) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isSubmitted, isReviewMode]);

  // Save progress periodically to localStorage
  useEffect(() => {
    if (loading || isSubmitted) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        userAnswers,
        flagged: Array.from(flaggedQuestions),
        notes,
        timeLeft
      }));
    } catch (e) {
      // ignore
    }
  }, [userAnswers, flaggedQuestions, notes, timeLeft, loading, isSubmitted]);

  // Flatten all questions with section info
  const allQuestions = useMemo(() => {
    if (!exam || !exam.sections) return [];
    const list = [];
    exam.sections.forEach((sec) => {
      (sec.questions || []).forEach((q) => {
        list.push({
          ...q,
          sectionId: sec.id,
          sectionTitle: sec.title || (sec.id === 'listening' ? 'Nghe' : sec.id === 'reading' ? 'Đọc' : 'Viết')
        });
      });
    });
    return list;
  }, [exam]);

  // Questions grouped by section
  const sectionGroups = useMemo(() => {
    if (!exam || !exam.sections) return [];
    return exam.sections.map((sec) => ({
      id: sec.id,
      title: sec.title || (sec.id === 'listening' ? '听力 (Nghe)' : sec.id === 'reading' ? '阅读 (Đọc)' : '书写 (Viết)'),
      shortTitle: sec.id === 'listening' ? 'Nghe' : sec.id === 'reading' ? 'Đọc' : 'Viết',
      questions: sec.questions || []
    }));
  }, [exam]);

  // Total questions count & answered count
  const totalQuestionsCount = allQuestions.length;
  const answeredCount = Object.keys(userAnswers).filter((k) => userAnswers[k] !== undefined && userAnswers[k] !== '').length;

  // Format MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Auto submit when time runs out
  const handleAutoSubmit = () => {
    showToast('Hết thời gian làm bài! Hệ thống đang tự động nộp bài.', 'info');
    handleSubmitExam();
  };

  // Submit and Grade
  const handleSubmitExam = async () => {
    setShowSubmitConfirm(false);
    try {
      showToast('Đang chấm điểm bài thi...', 'info');
      const grade = await hskExamApi.gradeExam(testId, userAnswers);
      setGradeResult(grade);
      setIsSubmitted(true);
      setIsReviewMode(false);
      localStorage.removeItem(storageKey);

      // Submit result to backend DB for user history
      try {
        const totalQ = grade.total || totalQuestionsCount;
        const correctQ = grade.correct || 0;
        const finalScore = grade.score || (totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0);

        // Section breakdown map
        const secScores = {};
        (grade.sections || []).forEach((s) => {
          secScores[s.id] = { correct: s.correct, total: s.total };
        });

        await hskExamApi.submitResult({
          testId,
          hskLevel: exam.level || 1,
          examTitle: exam.title || `HSK ${exam.level} Test`,
          score: finalScore,
          maxScore: 100,
          correctAnswers: correctQ,
          totalQuestions: totalQ,
          duration: elapsedTime,
          sectionScores: secScores,
          userAnswers
        });
      } catch (saveErr) {
        console.warn('Failed to save exam result to user history:', saveErr);
      }

      showToast('Nộp bài thành công!', 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error grading exam:', err);
      showToast('Có lỗi khi nộp bài. Vui lòng thử lại.', 'error');
    }
  };

  // Retake exam
  const handleRetakeExam = () => {
    setUserAnswers({});
    setFlaggedQuestions(new Set());
    setNotes({});
    setIsSubmitted(false);
    setGradeResult(null);
    setIsReviewMode(false);
    setTimeLeft(totalSeconds);
    setElapsedTime(0);
    localStorage.removeItem(storageKey);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Jump to specific question
  const scrollToQuestion = (qNumber) => {
    setActiveQuestionId(`q-${qNumber}`);
    const el = document.getElementById(`q-${qNumber}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Toggle flag on question
  const toggleFlag = (qId) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  // Handle choice selection
  const handleSelectOption = (qId, optionVal) => {
    if (isSubmitted && !isReviewMode) return;
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: optionVal
    }));
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Global Audio Handlers
  const toggleGlobalAudio = () => {
    if (!globalAudioRef.current) return;
    if (isGlobalPlaying) {
      globalAudioRef.current.pause();
      setIsGlobalPlaying(false);
    } else {
      globalAudioRef.current.play().then(() => {
        setIsGlobalPlaying(true);
      }).catch((e) => console.warn('Audio play error:', e));
    }
  };

  // Question Audio Handlers
  const playQuestionAudio = (qId, audioUrl) => {
    if (!audioUrl) return;
    if (playingQuestionAudioId === qId && questionAudioRef.current) {
      questionAudioRef.current.pause();
      setPlayingQuestionAudioId(null);
      return;
    }
    if (questionAudioRef.current) {
      questionAudioRef.current.pause();
    }
    const audio = new Audio(audioUrl);
    questionAudioRef.current = audio;
    setPlayingQuestionAudioId(qId);
    audio.play().catch(() => setPlayingQuestionAudioId(null));
    audio.onended = () => setPlayingQuestionAudioId(null);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-mute">
        <div className="w-10 h-10 rounded-full border-3 border-primary border-t-transparent animate-spin" />
        <p className="text-sm font-semibold">Đang chuẩn bị đề thi HSK...</p>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <AlertCircle size={40} className="text-red-500" />
        <h2 className="text-lg font-bold">{error || 'Không tìm thấy đề thi'}</h2>
        <button
          onClick={() => navigate('/hsk-exams')}
          className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-bold cursor-pointer"
        >
          Quay lại danh sách đề thi
        </button>
      </div>
    );
  }

  // ==========================================
  // VIEW: RESULT SCREEN (Screenshot 4)
  // ==========================================
  if (isSubmitted && !isReviewMode && gradeResult) {
    const scorePct = gradeResult.score || 0;
    const correctCount = gradeResult.correct || 0;
    const totalCount = gradeResult.total || totalQuestionsCount;

    // Filter questions if 'wrong' selected
    const allGradeQuestions = [];
    (gradeResult.sections || []).forEach((sec) => {
      (sec.questions || []).forEach((q) => {
        allGradeQuestions.push({
          ...q,
          sectionId: sec.id,
          sectionTitle: sec.title
        });
      });
    });

    const wrongQuestions = allGradeQuestions.filter((q) => !q.isCorrect);

    return (
      <div className="min-h-screen pb-20 animate-fade-in text-ink dark:text-on-dark select-none">
        <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6">
          
          {/* Back Nav Link */}
          <button
            onClick={() => navigate('/hsk-exams')}
            className="flex items-center gap-1.5 text-xs font-semibold text-mute dark:text-on-dark-mute hover:text-ink dark:hover:text-on-dark transition-colors cursor-pointer pt-2"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách đề thi
          </button>

          {/* HERO RESULT CARD (Screenshot 4) */}
          <div className="bg-white dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-6">
              
              {/* Score Percentage Box */}
              <div className="w-40 sm:w-48 bg-stone-100 dark:bg-black/25 rounded-2xl p-5 flex flex-col items-center justify-center text-center shrink-0">
                <div className={`text-4xl sm:text-5xl font-extrabold tracking-tight font-display ${
                  scorePct >= 60 ? 'text-[#c53030] dark:text-red-400' : 'text-[#c53030] dark:text-red-400'
                }`}>
                  {scorePct}%
                </div>
                <div className="text-xs font-semibold text-mute dark:text-on-dark-mute mt-2">
                  Đúng {correctCount}/{totalCount} câu
                </div>
              </div>

              {/* Exam Info & Section Breakdowns */}
              <div className="flex-1 flex flex-col justify-between text-center sm:text-left space-y-3">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-mute dark:text-on-dark-mute">
                    Kết quả của bạn
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-ink dark:text-on-dark tracking-tight">
                    {exam.title || `HSK ${exam.level} – Đề 1`}
                  </h2>
                </div>

                {/* Section Score Pills */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  {(gradeResult.sections || []).map((sec) => (
                    <div
                      key={sec.id}
                      className="px-3.5 py-1.5 rounded-full border border-hairline dark:border-divider-dark bg-stone-50 dark:bg-black/15 text-xs font-semibold text-ink dark:text-on-dark"
                    >
                      {sec.id === 'listening' ? 'Nghe' : sec.id === 'reading' ? 'Đọc' : 'Viết'}:{' '}
                      <span className="font-bold">{sec.correct}/{sec.total}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Action Buttons Row */}
            <div className="border-t border-hairline dark:border-divider-dark pt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsReviewMode(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#1e3a5f] hover:bg-[#162c48] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer shadow-xs"
              >
                <ListOrdered size={16} />
                Xem lại chi tiết bài làm
              </button>
              <button
                onClick={handleRetakeExam}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-hairline dark:border-divider-dark bg-white dark:bg-surface-dark hover:bg-stone-50 dark:hover:bg-black/20 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                <RotateCcw size={16} />
                Làm lại
              </button>
              <button
                onClick={() => navigate('/hsk-exams')}
                className="flex items-center justify-center px-5 py-3 rounded-xl border border-hairline dark:border-divider-dark bg-white dark:bg-surface-dark hover:bg-stone-50 dark:hover:bg-black/20 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                Chọn đề khác
              </button>
            </div>

          </div>

          {/* SECTION: XEM LẠI BÀI LÀM (Screenshot 4) */}
          <div className="space-y-6 pt-2">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xl font-bold tracking-tight text-ink dark:text-on-dark">
                Xem lại bài làm
              </h3>
              
              {/* Filter Tabs: Câu sai vs Tất cả */}
              <div className="flex items-center bg-stone-100 dark:bg-black/25 p-1 rounded-xl shrink-0 self-start sm:self-auto">
                <button
                  onClick={() => setReviewFilter('wrong')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reviewFilter === 'wrong'
                      ? 'bg-[#1e3a5f] text-white shadow-xs'
                      : 'text-mute hover:text-ink dark:hover:text-on-dark'
                  }`}
                >
                  Câu sai ({wrongQuestions.length})
                </button>
                <button
                  onClick={() => setReviewFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reviewFilter === 'all'
                      ? 'bg-[#1e3a5f] text-white shadow-xs'
                      : 'text-mute hover:text-ink dark:hover:text-on-dark'
                  }`}
                >
                  Tất cả ({totalCount})
                </button>
              </div>
            </div>

            {/* Link: Mở toàn bộ đề ở chế độ xem lại */}
            <div>
              <button
                onClick={() => setIsReviewMode(true)}
                className="text-xs sm:text-sm font-bold text-ink dark:text-on-dark hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                Mở toàn bộ đề ở chế độ xem lại →
              </button>
            </div>

            {/* MATRIX GRIDS BY SECTION */}
            {(gradeResult.sections || []).map((sec) => {
              const secName = sec.id === 'listening' ? 'Nghe' : sec.id === 'reading' ? 'Đọc' : 'Viết';
              return (
                <div key={sec.id} className="space-y-3">
                  <div className="text-sm font-bold text-ink dark:text-on-dark flex items-center gap-2">
                    <span className="w-1 h-3.5 bg-ink dark:bg-on-dark rounded-full inline-block" />
                    <span>{secName}</span>
                    <span className="text-xs font-normal text-mute">{sec.correct}/{sec.total}</span>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5">
                    {(sec.questions || []).map((q) => {
                      const isUnanswered = !q.selected;
                      const isCorrect = q.isCorrect;
                      const isWrong = !isCorrect && !isUnanswered;

                      // If filtered by 'wrong', dim correct ones
                      if (reviewFilter === 'wrong' && isCorrect) {
                        return (
                          <div
                            key={q.id}
                            className="h-10 rounded-xl border border-hairline/40 dark:border-divider-dark/40 flex items-center justify-center text-xs font-semibold text-mute/40 select-none opacity-40"
                          >
                            {q.number}
                          </div>
                        );
                      }

                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            setIsReviewMode(true);
                            setTimeout(() => scrollToQuestion(q.number), 100);
                          }}
                          className={`h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-transform hover:scale-105 cursor-pointer ${
                            isCorrect
                              ? 'bg-emerald-500/15 border border-emerald-500 text-emerald-600 dark:text-emerald-400'
                              : isWrong
                              ? 'bg-red-500/15 border border-red-500 text-red-600 dark:text-red-400'
                              : 'border-2 border-dashed border-red-400 text-red-500 bg-red-50/50 dark:bg-red-950/20'
                          }`}
                        >
                          {q.number}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* LEGEND */}
            <div className="flex flex-wrap items-center gap-5 pt-4 text-xs text-mute dark:text-on-dark-mute">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-sm bg-emerald-500 inline-block" />
                <span>Đúng</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-sm bg-red-500 inline-block" />
                <span>Sai</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-sm border-2 border-dashed border-red-400 inline-block" />
                <span>Chưa trả lời</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: EXAM PLAYER & REVIEW MODE (Screenshot 3)
  // ==========================================
  return (
    <div className="min-h-screen pb-24 text-ink dark:text-on-dark select-none">
      
      {/* 1. STICKY TOP HEADER */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-b border-hairline dark:border-divider-dark px-4 sm:px-8 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Exit button & Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (isSubmitted || isReviewMode) {
                  navigate('/hsk-exams');
                } else {
                  setShowExitConfirm(true);
                }
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-hairline dark:border-divider-dark hover:bg-stone-100 dark:hover:bg-black/20 text-xs font-bold text-mute hover:text-ink dark:hover:text-on-dark transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Thoát</span>
            </button>

            <div>
              <div className="text-sm font-bold text-ink dark:text-on-dark leading-tight">
                {exam.title || `HSK ${exam.level} – Đề 1`}
              </div>
              <div className="text-[11px] font-medium text-mute dark:text-on-dark-mute">
                {isReviewMode ? 'Chế độ xem lại đáp án' : `Đã trả lời ${answeredCount}/${totalQuestionsCount}`}
              </div>
            </div>
          </div>

          {/* Right: Timer, Fullscreen, Submit */}
          <div className="flex items-center gap-2 sm:gap-3">
            {!isReviewMode && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-mono font-bold ${
                timeLeft < 300 
                  ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 animate-pulse' 
                  : 'bg-stone-100 dark:bg-black/25 text-ink dark:text-on-dark border border-hairline dark:border-divider-dark'
              }`}>
                <Clock size={15} />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}

            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
              className="p-2 rounded-xl border border-hairline dark:border-divider-dark hover:bg-stone-100 dark:hover:bg-black/20 text-mute hover:text-ink dark:hover:text-on-dark transition-colors cursor-pointer hidden sm:flex"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {isReviewMode ? (
              <button
                onClick={() => setIsReviewMode(false)}
                className="px-4 py-2 rounded-xl bg-[#1e3a5f] hover:bg-[#162c48] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer shadow-xs"
              >
                Trở lại bảng điểm
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="px-5 py-2 rounded-xl bg-[#1e3a5f] hover:bg-[#162c48] text-white text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shadow-xs active:scale-95"
              >
                Nộp bài
              </button>
            )}
          </div>

        </div>
      </div>

      {/* 2. SECTION AUDIO PLAYER BAR (Screenshot 3) */}
      {exam.audioUrl && (
        <div className="bg-stone-100/90 dark:bg-black/30 border-b border-hairline dark:border-divider-dark px-4 sm:px-8 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-3 sm:gap-4">
            <audio
              ref={globalAudioRef}
              src={exam.audioUrl}
              onTimeUpdate={() => {
                if (globalAudioRef.current) {
                  setGlobalCurrentTime(globalAudioRef.current.currentTime);
                }
              }}
              onLoadedMetadata={() => {
                if (globalAudioRef.current) {
                  setGlobalDuration(globalAudioRef.current.duration);
                }
              }}
              onEnded={() => setIsGlobalPlaying(false)}
            />

            <button
              onClick={toggleGlobalAudio}
              className="p-1.5 rounded-lg bg-[#1e3a5f] text-white hover:bg-[#162c48] transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              {isGlobalPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>

            <span className="text-xs font-mono font-medium text-mute shrink-0">
              {formatTime(Math.floor(globalCurrentTime))} / {formatTime(Math.floor(globalDuration))}
            </span>

            {/* Scrub Slider */}
            <input
              type="range"
              min="0"
              max={globalDuration || 100}
              value={globalCurrentTime}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setGlobalCurrentTime(val);
                if (globalAudioRef.current) {
                  globalAudioRef.current.currentTime = val;
                }
              }}
              className="flex-1 h-1.5 bg-stone-300 dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#1e3a5f]"
            />

            <button
              onClick={() => {
                if (globalAudioRef.current) {
                  const newVol = globalVolume > 0 ? 0 : 1;
                  globalAudioRef.current.volume = newVol;
                  setGlobalVolume(newVol);
                }
              }}
              className="text-mute hover:text-ink dark:hover:text-on-dark transition-colors cursor-pointer hidden sm:block"
            >
              {globalVolume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN TWO-COLUMN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LEFT COLUMN: QUESTIONS SCROLL LIST */}
          <div className="flex-1 w-full space-y-10">
            {sectionGroups.map((sec) => (
              <div key={sec.id} className="space-y-6">
                
                {/* Section Header */}
                <div className="flex items-center gap-2 text-base sm:text-lg font-extrabold text-ink dark:text-on-dark border-b border-hairline dark:border-divider-dark pb-2">
                  <span className="w-1.5 h-4 bg-[#1e3a5f] dark:bg-blue-400 rounded-full inline-block" />
                  <span>{sec.title}</span>
                  <span className="text-xs font-medium text-mute">({sec.questions.length} câu)</span>
                </div>

                {/* Question Cards */}
                <div className="space-y-6">
                  {sec.questions.map((q) => {
                    const isAnswered = userAnswers[q.id] !== undefined && userAnswers[q.id] !== '';
                    const isFlagged = flaggedQuestions.has(q.id);
                    const hasNote = !!notes[q.id];
                    const selectedVal = userAnswers[q.id];

                    // Review Mode Data
                    const gradeInfo = gradeResult?.sections?.flatMap((s) => s.questions)?.find((gq) => gq.id === q.id);
                    const isCorrect = gradeInfo ? gradeInfo.isCorrect : false;
                    const correctAnswer = q.correctAnswer || gradeInfo?.answer;

                    return (
                      <div
                        key={q.id}
                        id={`q-${q.number}`}
                        className={`relative bg-white dark:bg-surface-dark border rounded-2xl p-5 sm:p-6 transition-all duration-200 shadow-2xs ${
                          activeQuestionId === `q-${q.number}`
                            ? 'ring-2 ring-[#1e3a5f]/40 border-[#1e3a5f]'
                            : isReviewMode
                            ? isCorrect
                              ? 'border-emerald-500/40 bg-emerald-500/5'
                              : 'border-red-500/40 bg-red-500/5'
                            : 'border-hairline dark:border-divider-dark'
                        }`}
                      >
                        {/* Question Card Header */}
                        <div className="flex items-center justify-between gap-4 pb-4 border-b border-hairline/60 dark:border-divider-dark/60">
                          
                          <div className="flex items-center gap-3">
                            {/* Question Number Badge */}
                            <span className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-black/30 border border-hairline dark:border-divider-dark flex items-center justify-center font-bold text-xs text-ink dark:text-on-dark">
                              {q.number}
                            </span>

                            {/* Question Audio Button */}
                            {q.audio && (
                              <button
                                onClick={() => playQuestionAudio(q.id, q.audio)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                                  playingQuestionAudioId === q.id
                                    ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                                    : 'border-hairline dark:border-divider-dark hover:bg-stone-50 dark:hover:bg-black/20 text-mute hover:text-ink'
                                }`}
                              >
                                {playingQuestionAudioId === q.id ? <Pause size={13} /> : <Volume2 size={13} />}
                                <span className="text-[11px] font-mono">Nghe câu {q.number}</span>
                              </button>
                            )}
                          </div>

                          {/* Flag & Note Icons */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => toggleFlag(q.id)}
                              title="Đánh dấu câu này"
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                isFlagged
                                  ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400'
                                  : 'border-hairline dark:border-divider-dark text-mute hover:text-ink'
                              }`}
                            >
                              <Bookmark size={15} fill={isFlagged ? 'currentColor' : 'none'} />
                            </button>

                            <button
                              onClick={() => setActiveNoteModal(q.id)}
                              title="Ghi chú"
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                hasNote
                                  ? 'bg-blue-500/20 border-blue-500 text-blue-600 dark:text-blue-400'
                                  : 'border-hairline dark:border-divider-dark text-mute hover:text-ink'
                              }`}
                            >
                              <FileText size={15} />
                            </button>
                          </div>

                        </div>

                        {/* Question Instruction / Prompt if any */}
                        {q.instruction && (
                          <div className="text-xs font-semibold text-mute mt-3 italic whitespace-pre-line">
                            {q.instruction}
                          </div>
                        )}

                        {q.prompt && (
                          <div className="text-base sm:text-lg font-bold text-ink dark:text-on-dark mt-3 leading-relaxed whitespace-pre-line font-chinese select-text">
                            {q.prompt}
                          </div>
                        )}

                        {/* QUESTION BODY BY TYPE */}
                        
                        {/* 1. True / False with Image (Screenshot 3 Q1-5) */}
                        {((q.imageUrls && q.imageUrls.length > 0 && (!q.options || q.options.length === 0)) || (q.correctAnswer === '√' || q.correctAnswer === '×')) && (
                          <div className="flex flex-col sm:flex-row items-center gap-6 mt-5">
                            {/* Image */}
                            {q.imageUrls && q.imageUrls[0] && (
                              <div className="w-full sm:w-56 h-40 bg-stone-100 dark:bg-black/20 rounded-xl overflow-hidden border border-hairline dark:border-divider-dark flex items-center justify-center p-2 shrink-0">
                                <img
                                  src={q.imageUrls[0]}
                                  alt={`Question ${q.number}`}
                                  className="max-h-full max-w-full object-contain rounded-lg"
                                  loading="lazy"
                                />
                              </div>
                            )}

                            {/* True / False Choice Buttons */}
                            <div className="flex-1 w-full space-y-3">
                              {['√', '×'].map((optSymbol) => {
                                const isOptSelected = selectedVal === optSymbol;
                                const isOptCorrect = correctAnswer === optSymbol;

                                let btnStyle = 'border-hairline dark:border-divider-dark hover:border-[#1e3a5f] bg-white dark:bg-black/10 text-ink dark:text-on-dark';
                                if (isReviewMode) {
                                  if (isOptCorrect) {
                                    btnStyle = 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold';
                                  } else if (isOptSelected && !isOptCorrect) {
                                    btnStyle = 'border-red-500 bg-red-500/15 text-red-600 dark:text-red-400 font-bold';
                                  } else {
                                    btnStyle = 'border-hairline opacity-50';
                                  }
                                } else if (isOptSelected) {
                                  btnStyle = 'border-[#1e3a5f] bg-[#1e3a5f]/10 dark:bg-[#1e3a5f]/25 text-[#1e3a5f] dark:text-blue-400 font-bold ring-2 ring-[#1e3a5f]/30';
                                }

                                return (
                                  <button
                                    key={optSymbol}
                                    onClick={() => handleSelectOption(q.id, optSymbol)}
                                    className={`w-full py-3.5 px-6 rounded-xl border flex items-center gap-3 transition-all duration-200 cursor-pointer text-left ${btnStyle}`}
                                  >
                                    <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs shrink-0 font-bold">
                                      {optSymbol}
                                    </span>
                                    <span className="text-sm font-semibold">
                                      {optSymbol === '√' ? '对 (Đúng)' : '错 (Sai)'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 2. Image Options Choice (A, B, C with images - Screenshot 3 Q6) */}
                        {q.options && q.options.length > 0 && q.imageUrls && q.imageUrls.length >= q.options.length && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-5">
                            {q.options.map((opt, optIdx) => {
                              const optImg = q.imageUrls[optIdx];
                              const isOptSelected = selectedVal === opt.id;
                              const isOptCorrect = correctAnswer === opt.id;

                              let cardStyle = 'border-hairline dark:border-divider-dark hover:border-[#1e3a5f] bg-white dark:bg-black/10 text-ink dark:text-on-dark';
                              if (isReviewMode) {
                                if (isOptCorrect) {
                                  cardStyle = 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold';
                                } else if (isOptSelected && !isOptCorrect) {
                                  cardStyle = 'border-red-500 bg-red-500/15 text-red-600 dark:text-red-400 font-bold';
                                } else {
                                  cardStyle = 'border-hairline opacity-50';
                                }
                              } else if (isOptSelected) {
                                cardStyle = 'border-[#1e3a5f] bg-[#1e3a5f]/10 dark:bg-[#1e3a5f]/25 text-[#1e3a5f] dark:text-blue-400 font-bold ring-2 ring-[#1e3a5f]/30';
                              }

                              return (
                                <div
                                  key={opt.id}
                                  onClick={() => handleSelectOption(q.id, opt.id)}
                                  className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col items-center gap-3 ${cardStyle}`}
                                >
                                  <div className="w-full flex items-center justify-between">
                                    <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold">
                                      {opt.id}
                                    </span>
                                  </div>
                                  {optImg && (
                                    <div className="w-full h-32 flex items-center justify-center overflow-hidden">
                                      <img src={optImg} alt={`Option ${opt.id}`} className="max-h-full max-w-full object-contain rounded-md" loading="lazy" />
                                    </div>
                                  )}
                                  {opt.text && (
                                    <div className="text-xs font-semibold text-center font-chinese">{opt.text}</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* 3. Text Multiple Choice (A, B, C, D text options) */}
                        {q.options && q.options.length > 0 && (!q.imageUrls || q.imageUrls.length < q.options.length) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                            {q.options.map((opt) => {
                              const isOptSelected = selectedVal === opt.id;
                              const isOptCorrect = correctAnswer === opt.id;

                              let cardStyle = 'border-hairline dark:border-divider-dark hover:border-[#1e3a5f] bg-white dark:bg-black/10 text-ink dark:text-on-dark';
                              if (isReviewMode) {
                                if (isOptCorrect) {
                                  cardStyle = 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold';
                                } else if (isOptSelected && !isOptCorrect) {
                                  cardStyle = 'border-red-500 bg-red-500/15 text-red-600 dark:text-red-400 font-bold';
                                } else {
                                  cardStyle = 'border-hairline opacity-50';
                                }
                              } else if (isOptSelected) {
                                cardStyle = 'border-[#1e3a5f] bg-[#1e3a5f]/10 dark:bg-[#1e3a5f]/25 text-[#1e3a5f] dark:text-blue-400 font-bold ring-2 ring-[#1e3a5f]/30';
                              }

                              return (
                                <button
                                  key={opt.id}
                                  onClick={() => handleSelectOption(q.id, opt.id)}
                                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all duration-200 cursor-pointer text-left ${cardStyle}`}
                                >
                                  <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold shrink-0">
                                    {opt.id}
                                  </span>
                                  <span className="text-sm font-semibold font-chinese leading-relaxed">
                                    {opt.text}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Note preview if any */}
                        {hasNote && (
                          <div className="mt-3 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-300">
                            <span className="font-bold">Ghi chú của bạn:</span> {notes[q.id]}
                          </div>
                        )}

                        {/* Review Mode: Explanation & Correct Answer display */}
                        {isReviewMode && (
                          <div className="mt-4 pt-4 border-t border-hairline/60 dark:border-divider-dark/60 flex items-center justify-between text-xs">
                            <span className="text-mute">
                              Đáp án chuẩn HSK: <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-mono">{correctAnswer}</strong>
                            </span>
                            {selectedVal ? (
                              <span className={isCorrect ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
                                Bạn chọn: <strong>{selectedVal}</strong> ({isCorrect ? 'Đúng' : 'Sai'})
                              </span>
                            ) : (
                              <span className="text-red-500 italic">Chưa trả lời</span>
                            )}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>

              </div>
            ))}
          </div>

          {/* RIGHT COLUMN: STICKY QUESTION NAVIGATION PALETTE (Screenshot 3) */}
          <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-20 space-y-4">
            <div className="bg-white dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-2xl p-5 shadow-xs space-y-5">
              
              <h3 className="font-bold text-sm text-ink dark:text-on-dark tracking-tight">
                Câu hỏi
              </h3>

              {/* Palette Groups by Section */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
                {sectionGroups.map((sec) => (
                  <div key={sec.id} className="space-y-2">
                    <div className="text-xs font-bold text-mute flex items-center gap-1.5">
                      <span className="w-1 h-3 bg-stone-400 dark:bg-stone-500 rounded-full inline-block" />
                      <span>{sec.shortTitle}</span>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      {sec.questions.map((q) => {
                        const isAns = userAnswers[q.id] !== undefined && userAnswers[q.id] !== '';
                        const isFlag = flaggedQuestions.has(q.id);
                        const hasN = !!notes[q.id];
                        const isActive = activeQuestionId === `q-${q.number}`;

                        // In review mode:
                        const gradeInfo = gradeResult?.sections?.flatMap((s) => s.questions)?.find((gq) => gq.id === q.id);
                        const isCorr = gradeInfo?.isCorrect;
                        const isUnans = isReviewMode && !userAnswers[q.id];

                        let btnColor = 'bg-stone-100 dark:bg-black/20 text-ink dark:text-on-dark border border-transparent';
                        if (isReviewMode) {
                          if (isCorr) {
                            btnColor = 'bg-emerald-500 text-white font-bold';
                          } else if (isUnans) {
                            btnColor = 'border-2 border-dashed border-red-400 text-red-500 bg-red-50 dark:bg-red-950/30 font-bold';
                          } else {
                            btnColor = 'bg-red-500 text-white font-bold';
                          }
                        } else if (isAns) {
                          btnColor = 'bg-[#1e3a5f] text-white font-bold';
                        }

                        return (
                          <button
                            key={q.id}
                            onClick={() => scrollToQuestion(q.number)}
                            className={`relative h-9 rounded-xl flex items-center justify-center text-xs font-semibold transition-all duration-150 cursor-pointer ${btnColor} ${
                              isActive ? 'ring-2 ring-[#1e3a5f] dark:ring-blue-400 ring-offset-2 dark:ring-offset-surface-dark' : ''
                            }`}
                          >
                            <span>{q.number}</span>

                            {/* Flag indicator icon */}
                            {isFlag && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-1 ring-white" />
                            )}
                            {/* Note indicator dot */}
                            {hasN && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-500 ring-1 ring-white" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* PALETTE LEGEND (Screenshot 3) */}
              <div className="border-t border-hairline dark:border-divider-dark pt-4 space-y-2 text-[11px] text-mute dark:text-on-dark-mute">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#1e3a5f] inline-block" />
                  <span>Đã trả lời</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-stone-200 dark:bg-stone-700 inline-block" />
                  <span>Chưa trả lời</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  <span>Đã đánh dấu</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                  <span>Có ghi chú</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* MODAL: QUESTION NOTE */}
      {activeNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-2xl p-5 shadow-xl space-y-4">
            <h4 className="font-bold text-sm text-ink dark:text-on-dark">
              Ghi chú cho câu hỏi
            </h4>
            <textarea
              rows={4}
              value={notes[activeNoteModal] || ''}
              onChange={(e) => setNotes({ ...notes, [activeNoteModal]: e.target.value })}
              placeholder="Nhập ghi chú hoặc từ vựng cần nhớ..."
              className="w-full p-3 rounded-xl border border-hairline dark:border-divider-dark bg-stone-50 dark:bg-black/20 text-xs text-ink dark:text-on-dark focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/40"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveNoteModal(null)}
                className="px-4 py-2 rounded-xl bg-[#1e3a5f] text-white text-xs font-bold cursor-pointer"
              >
                Lưu ghi chú
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM SUBMIT */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="font-bold text-base text-ink dark:text-on-dark">
              Xác nhận nộp bài
            </h4>
            <p className="text-xs text-mute leading-relaxed">
              Bạn đã hoàn thành <strong>{answeredCount}</strong> trên tổng số <strong>{totalQuestionsCount}</strong> câu hỏi.
              {totalQuestionsCount - answeredCount > 0 && (
                <span className="block text-red-500 font-semibold mt-1">
                  (Còn {totalQuestionsCount - answeredCount} câu chưa có câu trả lời!)
                </span>
              )}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 rounded-xl border border-hairline dark:border-divider-dark text-xs font-bold cursor-pointer"
              >
                Làm tiếp
              </button>
              <button
                onClick={handleSubmitExam}
                className="px-5 py-2 rounded-xl bg-[#1e3a5f] hover:bg-[#162c48] text-white text-xs font-bold cursor-pointer"
              >
                Nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM EXIT */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="font-bold text-base text-ink dark:text-on-dark">
              Thoát bài thi?
            </h4>
            <p className="text-xs text-mute leading-relaxed">
              Tiến độ làm bài và các câu trả lời hiện tại sẽ được tự động lưu lại trên máy này. Bạn có thể quay lại tiếp tục làm bất kỳ lúc nào.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 rounded-xl border border-hairline dark:border-divider-dark text-xs font-bold cursor-pointer"
              >
                Ở lại làm tiếp
              </button>
              <button
                onClick={() => navigate('/hsk-exams')}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                Xác nhận thoát
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
