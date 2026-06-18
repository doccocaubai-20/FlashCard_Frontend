import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Volume2, 
  Play, 
  Pause, 
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Award,
  RefreshCw
} from 'lucide-react';
import mockExamsData from '../data/hskMockExams.json';
import { hskExamApi } from '../services/hskExamApi';
import { useToast } from '../context/ToastContext';

// Import HSK level JSON files
import hsk1Data from '../data/tu_vung_hsk1.json';
import hsk2Data from '../data/tu_vung_hsk2.json';
import hsk3Data from '../data/tu_vung_hsk3.json';
import hsk4Data from '../data/tu_vung_hsk4.json';
import hsk5Data from '../data/tu_vung_hsk5.json';
import hsk6Data from '../data/tu_vung_hsk6.json';
import hsk79Data from '../data/tu_vung_hsk7_9.json';

// Helper to generate full HSK exam dynamically
function generateHskExam(level) {
  let vocab = [];
  switch (level) {
    case 1: vocab = hsk1Data; break;
    case 2: vocab = hsk2Data; break;
    case 3: vocab = hsk3Data; break;
    case 4: vocab = hsk4Data; break;
    case 5: vocab = hsk5Data; break;
    case 6: vocab = hsk6Data; break;
    case 7: vocab = hsk79Data; break;
    default: vocab = hsk1Data;
  }

  // Shuffle the vocabulary pool
  const pool = [...vocab].sort(() => 0.5 - Math.random());
  
  // Determine counts based on level
  let listeningCount = 20;
  let readingCount = 20;
  let writingCount = 0;
  
  if (level === 2) {
    listeningCount = 35;
    readingCount = 25;
  } else if (level === 3) {
    listeningCount = 40;
    readingCount = 30;
    writingCount = 10;
  } else if (level === 4) {
    listeningCount = 45;
    readingCount = 40;
    writingCount = 15;
  } else if (level === 5) {
    listeningCount = 45;
    readingCount = 45;
    writingCount = 10;
  } else if (level === 6) {
    listeningCount = 50;
    readingCount = 50;
    writingCount = 1; // 1 writing essay
  }

  const totalQuestionsNeeded = listeningCount + readingCount;
  const selectedWords = pool.slice(0, totalQuestionsNeeded);
  const generated = [];

  // Helper to get distractors for multiple choice options
  const getDistractors = (correctWord, key, count = 3) => {
    return vocab
      .filter(w => w && w['Tiếng Trung'] !== correctWord['Tiếng Trung'] && w[key])
      .sort(() => 0.5 - Math.random())
      .slice(0, count)
      .map(w => w[key]);
  };

  let wordIndex = 0;

  // 1. Generate Listening Questions
  for (let i = 0; i < listeningCount; i++) {
    const word = selectedWords[wordIndex++];
    if (!word) break;

    const isMeaningType = i % 2 === 0;
    const correctAns = isMeaningType ? word['Dịch nghĩa'] : word['Tiếng Trung'];
    
    // Distractors
    const dist = isMeaningType 
      ? getDistractors(word, 'Dịch nghĩa') 
      : getDistractors(word, 'Tiếng Trung');
    
    const options = [correctAns, ...dist].sort(() => 0.5 - Math.random());

    generated.push({
      id: `q-list-${i}`,
      section: 'listening',
      type: 'multiple-choice',
      questionText: isMeaningType 
        ? 'Nghe phát âm và chọn nghĩa tiếng Việt chính xác nhất:' 
        : 'Nghe phát âm và chọn chữ Hán tương ứng:',
      audioText: word['Tiếng Trung'],
      options,
      correctAnswer: correctAns,
      pinyin: word['Pinyin']
    });
  }

  // 2. Generate Reading Questions
  for (let i = 0; i < readingCount; i++) {
    const word = selectedWords[wordIndex++];
    if (!word) break;

    const isMeaningType = i % 2 === 0;
    const correctAns = isMeaningType ? word['Dịch nghĩa'] : word['Tiếng Trung'];

    const dist = isMeaningType 
      ? getDistractors(word, 'Dịch nghĩa') 
      : getDistractors(word, 'Tiếng Trung');
    
    const options = [correctAns, ...dist].sort(() => 0.5 - Math.random());

    generated.push({
      id: `q-read-${i}`,
      section: 'reading',
      type: 'multiple-choice',
      questionText: isMeaningType
        ? `Chọn nghĩa tiếng Việt phù hợp cho chữ Hán: "${word['Tiếng Trung']}"`
        : `Chọn chữ Hán tương ứng với nghĩa Việt: "${word['Dịch nghĩa']}"`,
      options,
      correctAnswer: correctAns,
      pinyin: isMeaningType ? null : word['Pinyin']
    });
  }

  // 3. Generate Writing Questions (Rearrange sentence)
  const wordsWithExamples = vocab.filter(w => w.exampleHanzi && w.exampleHanzi.length > 2);
  const shuffledExamples = wordsWithExamples.sort(() => 0.5 - Math.random());

  for (let i = 0; i < writingCount; i++) {
    const word = shuffledExamples[i % shuffledExamples.length];
    if (!word) break;

    const cleanSentence = word.exampleHanzi.replace(/[。,，？！?!]/g, '').trim();
    
    // Split into character blocks
    const wordsBlocks = Array.from(cleanSentence).sort(() => 0.5 - Math.random());

    generated.push({
      id: `q-write-${i}`,
      section: 'writing',
      type: 'arrange',
      questionText: 'Sắp xếp các chữ Hán sau thành câu hoàn chỉnh:',
      pinyin: `Phiên âm gợi ý: ${word.examplePinyin || ''}`,
      meaningHint: `Nghĩa gợi ý: ${word.exampleMeaning || ''}`,
      words: wordsBlocks,
      correctAnswer: cleanSentence
    });
  }

  return generated;
}

export default function HskExamPlayerScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  
  // User answers state (maps question ID to selected answer)
  const [userAnswers, setUserAnswers] = useState({});
  const [arrangeDraft, setArrangeDraft] = useState([]); // for rearrange type questions

  // Time & Status
  const [timeLeft, setTimeLeft] = useState(1800); // fallback 30m
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);

  // Audio Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Initialize Exam dynamically
  useEffect(() => {
    const foundExam = mockExamsData.find(e => e.id === id);
    if (!foundExam) {
      showToast('Không tìm thấy đề thi này!', 'error');
      navigate('/hsk-exams');
      return;
    }
    
    // Dynamically generate the full question set based on level
    const generatedQuestions = generateHskExam(foundExam.hskLevel);
    
    setExam(foundExam);
    setQuestions(generatedQuestions);
    setTimeLeft(foundExam.duration || 1800);
    
    // Clear answers
    setUserAnswers({});
    setArrangeDraft([]);
    setIsSubmitted(false);
    setScoreResult(null);

    // Timer Interval
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleAutoSubmit();
          return 0;
        }
        setElapsedTime(e => e + 1);
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerIntervalRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [id, navigate]);

  // Cleanup audio on question change
  useEffect(() => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Reset arrange draft if the new question is arrange type
    const q = questions[currentIdx];
    if (q && q.type === 'arrange') {
      const saved = userAnswers[q.id];
      if (saved) {
        setArrangeDraft(saved.split(' '));
      } else {
        setArrangeDraft([]);
      }
    }
  }, [currentIdx, questions]);

  // TTS speech output for dynamic audio
  const handlePlayAudio = (q) => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    if (!window.speechSynthesis) {
      showToast('Trình duyệt không hỗ trợ phát âm thanh!', 'warning');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(q.audioText);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    
    utterance.onend = () => {
      setIsPlaying(false);
    };
    utterance.onerror = () => {
      setIsPlaying(false);
    };
  };

  // Rearrange words block selection
  const handleWordBlockClick = (word, qId) => {
    if (isSubmitted) return;
    
    let nextDraft = [...arrangeDraft];
    // Allow multiple duplicates of same characters by index
    nextDraft.push(word);
    setArrangeDraft(nextDraft);

    // Update answers mapping
    const answerStr = nextDraft.join(' ');
    setUserAnswers(prev => ({
      ...prev,
      [qId]: answerStr
    }));
  };

  const clearArrangeDraft = (qId) => {
    if (isSubmitted) return;
    setArrangeDraft([]);
    setUserAnswers(prev => ({
      ...prev,
      [qId]: ''
    }));
  };

  const selectOption = (option, qId) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({
      ...prev,
      [qId]: option
    }));
  };

  const handleAutoSubmit = () => {
    showToast('Hết thời gian làm bài! Hệ thống tự động nộp bài.', 'info');
    submitExam();
  };

  const submitExam = async () => {
    clearInterval(timerIntervalRef.current);
    if (audioRef.current) audioRef.current.pause();

    // Grade the exam
    let correct = 0;
    questions.forEach(q => {
      const ans = userAnswers[q.id] || '';
      
      if (q.type === 'arrange') {
        const sortedUser = ans.trim();
        const cleanUser = sortedUser.replace(/\s+/g, '');
        const cleanCorrect = q.correctAnswer.replace(/\s+/g, '');
        if (cleanUser === cleanCorrect) {
          correct++;
        }
      } else {
        if (ans === q.correctAnswer) {
          correct++;
        }
      }
    });

    const score = Math.round((correct / questions.length) * exam.maxScore);
    
    const resultPayload = {
      hskLevel: exam.hskLevel,
      examTitle: exam.title,
      score: score,
      maxScore: exam.maxScore,
      correctAnswers: correct,
      totalQuestions: questions.length,
      duration: elapsedTime
    };

    try {
      await hskExamApi.submitResult(resultPayload);
      setScoreResult(resultPayload);
      setIsSubmitted(true);
      showToast('Nộp bài thi thành công!', 'success');
    } catch (err) {
      console.error('Failed to submit exam result:', err);
      showToast('Lỗi khi nộp bài thi lên hệ thống.', 'error');
      setScoreResult(resultPayload);
      setIsSubmitted(true);
    }
  };

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!exam) return null;

  const currentQ = questions[currentIdx];

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16 animate-fade-in select-none">
      
      {/* LEFT COLUMN: Sidebar Navigation & Status */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-surface-card dark:bg-surface-dark/40 border border-hairline dark:border-divider-dark rounded-md p-6 space-y-6 shadow-sm">
          
          <button
            onClick={() => navigate('/hsk-exams')}
            className="flex items-center gap-2 text-mute hover:text-ink dark:hover:text-on-dark font-mono font-bold text-xs cursor-pointer"
          >
            <ArrowLeft size={14} />
            Quay lại danh sách đề
          </button>

          {/* Title */}
          <div>
            <h2 className="text-base font-bold text-ink dark:text-on-dark tracking-tight">{exam.title}</h2>
            <p className="text-[10px] text-mute font-mono mt-0.5 uppercase tracking-wider">HSK Cấp {exam.hskLevel}</p>
          </div>

          {/* Clock Timer */}
          <div className="flex items-center justify-between bg-surface-bone/50 dark:bg-black/20 border border-hairline dark:border-divider-dark p-4 rounded-md">
            <span className="text-xs font-mono font-bold text-mute uppercase tracking-widest flex items-center gap-1.5">
              <Clock size={14} className="text-primary animate-pulse" />
              {isSubmitted ? 'Thời gian hoàn thành' : 'Thời gian còn lại'}
            </span>
            <span className="text-xl font-mono font-extrabold text-ink dark:text-on-dark">
              {isSubmitted 
                ? formatTimer(elapsedTime) 
                : formatTimer(timeLeft)}
            </span>
          </div>

          {/* Question Grid Map */}
          <div className="space-y-3">
            <span className="text-[9px] font-mono font-bold text-mute uppercase tracking-widest block">Sơ đồ câu hỏi ({questions.length} câu)</span>
            <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIdx;
                const isAnswered = userAnswers[q.id] !== undefined && userAnswers[q.id] !== '';
                
                let btnClass = 'border-hairline dark:border-divider-dark text-mute hover:border-primary';
                if (isCurrent) {
                  btnClass = 'border-primary ring-2 ring-primary/20 text-primary font-bold';
                } else if (isAnswered) {
                  if (isSubmitted) {
                    let isCorrect = false;
                    const ans = userAnswers[q.id];
                    if (q.type === 'arrange') {
                      isCorrect = ans.replace(/\s+/g, '') === q.correctAnswer.replace(/\s+/g, '');
                    } else {
                      isCorrect = ans === q.correctAnswer;
                    }
                    btnClass = isCorrect 
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold' 
                      : 'bg-red-500/15 border-red-500/40 text-red-400 font-bold';
                  } else {
                    btnClass = 'bg-primary/10 border-primary/20 text-primary font-bold';
                  }
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 rounded-md border text-xs font-mono transition-all cursor-pointer flex items-center justify-center ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions Submit */}
          {!isSubmitted ? (
            <button
              onClick={submitExam}
              className="w-full py-3 bg-red-500 hover:bg-red-600 active:scale-98 text-white font-mono font-bold text-xs rounded-full cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
            >
              <Send size={13} />
              Nộp bài thi HSK
            </button>
          ) : (
            <button
              onClick={() => navigate('/hsk-exams')}
              className="w-full py-3 bg-surface-bone dark:bg-black/30 border border-hairline dark:border-divider-dark hover:bg-surface-bone/80 text-ink dark:text-on-dark font-mono font-bold text-xs rounded-full cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              Quay lại luyện đề
            </button>
          )}

        </div>
      </div>

      {/* RIGHT COLUMN: Question View & Workspace */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Graded Result Summary Panel */}
        {isSubmitted && scoreResult && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-md space-y-3 animate-in zoom-in-95 duration-300">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <Award size={18} />
              Kết quả làm bài thi của bạn
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-black/10 rounded-md border border-emerald-500/10">
                <div className="text-[10px] font-mono text-mute uppercase">Điểm số</div>
                <div className="text-lg font-mono font-extrabold text-emerald-400">{scoreResult.score}/{scoreResult.maxScore}</div>
              </div>
              <div className="p-3 bg-black/10 rounded-md border border-emerald-500/10">
                <div className="text-[10px] font-mono text-mute uppercase">Số câu đúng</div>
                <div className="text-lg font-mono font-extrabold text-emerald-400">{scoreResult.correctAnswers}/{scoreResult.totalQuestions}</div>
              </div>
              <div className="p-3 bg-black/10 rounded-md border border-emerald-500/10">
                <div className="text-[10px] font-mono text-mute uppercase">Tỷ lệ đúng</div>
                <div className="text-lg font-mono font-extrabold text-emerald-400">
                  {Math.round((scoreResult.correctAnswers / scoreResult.totalQuestions) * 100)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Question Card */}
        {currentQ && (
          <div className="bg-surface-card dark:bg-surface-dark/40 border border-hairline dark:border-divider-dark rounded-md p-8 space-y-6 shadow-sm min-h-[350px] flex flex-col justify-between">
            
            {/* Header info for current question */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-hairline dark:border-divider-dark pb-3">
                <span className="text-xs font-mono font-bold text-primary tracking-widest uppercase">
                  Câu hỏi {currentIdx + 1} / {questions.length} • Phần {
                    currentQ.section === 'listening' ? 'NGHE (听力)' : 
                    currentQ.section === 'reading' ? 'ĐỌC (阅读)' : 'VIẾT (书写)'
                  }
                </span>
                
                {isSubmitted && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold ${
                    (currentQ.type === 'arrange' 
                      ? (userAnswers[currentQ.id]?.replace(/\s+/g, '') === currentQ.correctAnswer.replace(/\s+/g, '')) 
                      : (userAnswers[currentQ.id] === currentQ.correctAnswer))
                      ? 'text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-sm border border-emerald-500/20'
                      : 'text-red-400 bg-red-500/10 px-2 py-0.5 rounded-sm border border-red-500/20'
                  }`}>
                    {((currentQ.type === 'arrange' 
                      ? (userAnswers[currentQ.id]?.replace(/\s+/g, '') === currentQ.correctAnswer.replace(/\s+/g, '')) 
                      : (userAnswers[currentQ.id] === currentQ.correctAnswer))) 
                      ? <CheckCircle2 size={11} /> 
                      : <XCircle size={11} />}
                    {((currentQ.type === 'arrange' 
                      ? (userAnswers[currentQ.id]?.replace(/\s+/g, '') === currentQ.correctAnswer.replace(/\s+/g, '')) 
                      : (userAnswers[currentQ.id] === currentQ.correctAnswer))) ? 'Đúng' : 'Sai'}
                  </span>
                )}
              </div>

              {/* Listening section visual player */}
              {currentQ.section === 'listening' && (
                <div className="flex flex-col items-center justify-center p-6 bg-surface-bone/30 dark:bg-black/15 border border-hairline dark:border-divider-dark rounded-md space-y-4 max-w-md mx-auto">
                  <div className={`h-16 w-16 rounded-full flex items-center justify-center ${isPlaying ? 'bg-primary/20 text-primary animate-pulse' : 'bg-primary/10 text-primary'}`}>
                    <Volume2 size={32} />
                  </div>
                  <div className="text-center space-y-1">
                    <span className="text-[10px] font-mono font-bold text-mute uppercase tracking-widest">Phát âm thanh hội thoại</span>
                    <p className="text-xs text-mute/70 dark:text-on-dark-mute/70">
                      Bấm nút phát để nghe giọng đọc của giáo viên bản xứ.
                    </p>
                  </div>
                  <button
                    onClick={() => handlePlayAudio(currentQ)}
                    className="px-6 py-2 bg-primary hover:bg-primary-deep text-white font-mono font-bold text-xs rounded-full flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                    {isPlaying ? 'Tạm dừng' : 'Nghe Phát Âm'}
                  </button>
                </div>
              )}

              {/* Question text */}
              <div className="space-y-2">
                <h3 className="text-base font-bold text-ink dark:text-on-dark leading-relaxed">
                  {currentQ.questionText}
                </h3>
                {currentQ.pinyin && (
                  <p className="text-xs text-mute font-mono tracking-wide">{currentQ.pinyin}</p>
                )}
                {currentQ.meaningHint && (
                  <p className="text-xs text-mute font-mono tracking-wide">{currentQ.meaningHint}</p>
                )}
              </div>

              {/* OPTIONS GRID */}
              {currentQ.type !== 'arrange' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  {currentQ.options?.map((option) => {
                    const isSelected = userAnswers[currentQ.id] === option;
                    const isCorrect = option === currentQ.correctAnswer;
                    
                    let cardStyle = 'border-hairline dark:border-divider-dark hover:border-primary bg-surface-card dark:bg-surface-dark';
                    if (isSubmitted) {
                      if (isCorrect) {
                        cardStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold';
                      } else if (isSelected) {
                        cardStyle = 'border-red-500 bg-red-500/10 text-red-400 font-bold';
                      } else {
                        cardStyle = 'border-hairline dark:border-divider-dark opacity-60';
                      }
                    } else if (isSelected) {
                      cardStyle = 'border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary/20';
                    }

                    return (
                      <div
                        key={option}
                        onClick={() => selectOption(option, currentQ.id)}
                        className={`p-4 border rounded-md text-sm cursor-pointer transition-all ${cardStyle}`}
                      >
                        {option}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* WRITING TYPE: Arrange words cards selection */
                <div className="space-y-6 pt-4">
                  {/* Draft sentence created by user */}
                  <div className="min-h-12 p-3 bg-surface-bone/30 dark:bg-black/15 border border-dashed border-hairline dark:border-divider-dark rounded-md flex flex-wrap gap-2 items-center">
                    {arrangeDraft.length === 0 ? (
                      <span className="text-xs text-mute/60 italic">Bấm các chữ phía dưới theo thứ tự để ghép câu...</span>
                    ) : (
                      arrangeDraft.map((word, wIdx) => (
                        <span
                          key={`${word}-${wIdx}`}
                          className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold rounded-md select-none"
                        >
                          {word}
                        </span>
                      ))
                    )}
                  </div>

                  {/* Word block choices */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono font-bold text-mute uppercase tracking-widest block">Khối từ lựa chọn</span>
                      {!isSubmitted && arrangeDraft.length > 0 && (
                        <button
                          onClick={() => clearArrangeDraft(currentQ.id)}
                          className="text-[10px] font-mono font-bold text-red-400 hover:text-red-500 cursor-pointer"
                        >
                          Làm lại câu này
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {currentQ.words.map((word, wIdx) => {
                        // Count occurrences in draft vs options
                        const countInDraft = arrangeDraft.filter(w => w === word).length;
                        const countInOptions = currentQ.words.filter(w => w === word).length;
                        const isChosen = countInDraft >= countInOptions;

                        return (
                          <button
                            key={`${word}-${wIdx}`}
                            disabled={isChosen || isSubmitted}
                            onClick={() => handleWordBlockClick(word, currentQ.id)}
                            className={`px-4 py-2 border rounded-md text-xs font-semibold transition-all ${
                              isChosen 
                                ? 'bg-surface-bone dark:bg-black/20 border-hairline opacity-30 cursor-not-allowed' 
                                : 'bg-surface-card hover:bg-surface-bone border-hairline dark:border-divider-dark text-ink dark:text-on-dark cursor-pointer'
                            }`}
                          >
                            {word}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grading display for arrange type */}
                  {isSubmitted && (
                    <div className="p-4 bg-surface-bone/40 dark:bg-black/20 border border-hairline dark:border-divider-dark rounded-md text-xs space-y-1">
                      <div className="font-semibold text-mute">Đáp án chuẩn HSK:</div>
                      <div className="font-bold text-primary text-sm font-sans">{currentQ.correctAnswer}</div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Bottom Actions: Next/Back button navigation */}
            <div className="flex items-center justify-between border-t border-hairline dark:border-divider-dark pt-6 mt-6">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(prev => prev - 1)}
                className="flex items-center gap-1 px-4 py-2 border border-hairline dark:border-divider-dark rounded-full text-xs font-mono font-bold text-mute hover:text-ink dark:hover:text-on-dark disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft size={14} />
                Câu trước
              </button>

              <button
                disabled={currentIdx === questions.length - 1}
                onClick={() => setCurrentIdx(prev => prev + 1)}
                className="flex items-center gap-1 px-4 py-2 border border-hairline dark:border-divider-dark rounded-full text-xs font-mono font-bold text-mute hover:text-ink dark:hover:text-on-dark disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                Câu tiếp
                <ChevronRight size={14} />
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
