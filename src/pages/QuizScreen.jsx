import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Trophy, Clock, CheckCircle2, XCircle, HelpCircle, Eye, EyeOff } from 'lucide-react';
import { favoriteWordsApi } from '../services/favoriteWordsApi';
import api from '../services/api';

export default function QuizScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [userAnswers, setUserAnswers] = useState([]); // Array to store user's choices
  const [showPinyin, setShowPinyin] = useState(true);

  const isVirtual = id === 'favorites';

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        let rawCards = [];
        if (isVirtual) {
          const res = await favoriteWordsApi.getFavorites();
          rawCards = (res.data || []).map((f) => ({
            id: f.id,
            hanzi: f.hanzi,
            pinyin: f.pinyin || '',
            meaning: f.vi || '',
          }));
        } else {
          const res = await api.get(`/api/decks/${id}/flashcards`);
          rawCards = res.data || [];
        }
        setCards(rawCards);
        generateQuiz(rawCards);
      } catch (err) {
        console.error('Failed to fetch cards for quiz:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [id, isVirtual]);

  // Timer Effect
  useEffect(() => {
    if (loading || quizFinished || questions.length === 0 || isAnswered) return;

    if (timeLeft === 0) {
      handleOptionSelect(null); // Time out acts as selecting nothing/incorrect
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, loading, quizFinished, isAnswered, questions]);

  function generateQuiz(rawCards) {
    if (rawCards.length < 4) {
      setQuestions([]);
      return;
    }

    // 1. Shuffle cards and pick up to 10 targets
    const shuffledTargets = [...rawCards].sort(() => 0.5 - Math.random());
    const targetCards = shuffledTargets.slice(0, 10);

    // 2. Generate 4 options for each question
    const generatedQuestions = targetCards.map((target) => {
      // Pick 3 random distractor cards from all available cards (excluding target)
      const distractors = rawCards
        .filter((c) => c.id !== target.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const correctOption = target.meaning || target.back || target.pinyin;
      const distractorOptions = distractors.map((c) => c.meaning || c.back || c.pinyin);

      // Combine and shuffle options
      const options = [correctOption, ...distractorOptions].sort(() => 0.5 - Math.random());

      return {
        card: target,
        correctOption,
        options,
      };
    });

    setQuestions(generatedQuestions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizFinished(false);
    setIsAnswered(false);
    setSelectedOption(null);
    setTimeLeft(15);
    setUserAnswers([]);
  }

  const handleOptionSelect = useCallback((option) => {
    if (isAnswered) return;
    
    setSelectedOption(option);
    setIsAnswered(true);

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;
    const isCorrect = option === currentQuestion.correctOption;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    // Record answer history
    setUserAnswers((prev) => [
      ...prev,
      {
        question: currentQuestion.card.hanzi,
        pinyin: currentQuestion.card.pinyin,
        correctAnswer: currentQuestion.correctOption,
        selectedAnswer: option,
        isCorrect,
      },
    ]);
  }, [isAnswered, questions, currentQuestionIndex]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(15);
    } else {
      setQuizFinished(true);
    }
  }, [currentQuestionIndex, questions.length]);

  // Keyboard Shortcuts: Keys 1-4 to select options, Space/Enter to advance
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (quizFinished) return;

      const currentQuestion = questions[currentQuestionIndex];
      if (!currentQuestion) return;

      if (!isAnswered) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          e.preventDefault();
          const optionIndex = parseInt(e.key, 10) - 1;
          const option = currentQuestion.options[optionIndex];
          if (option !== undefined) {
            handleOptionSelect(option);
          }
        }
      } else {
        if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAnswered, quizFinished, questions, currentQuestionIndex, handleOptionSelect, handleNext]);

  const handleReplay = () => {
    generateQuiz(cards);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-mute gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="text-sm font-medium">Đang tạo bộ câu hỏi trắc nghiệm...</span>
      </div>
    );
  }

  if (cards.length < 4) {
    return (
      <div className="max-w-md mx-auto bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-md p-8 text-center space-y-6 shadow-sm mt-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
          <HelpCircle size={28} />
        </div>
        <h2 className="text-xl font-extrabold text-ink dark:text-on-dark font-display">Thiếu thẻ bài</h2>
        <p className="text-sm text-body dark:text-on-dark-mute leading-relaxed font-sans">
          Bộ bài này cần tối thiểu <strong>4 thẻ bài</strong> có định nghĩa/giải nghĩa để tạo câu hỏi trắc nghiệm. Vui lòng thêm thêm thẻ bài trước khi chơi.
        </p>
        <button
          onClick={() => navigate(isVirtual ? '/decks' : `/decks/${id}`)}
          className="w-full py-2.5 bg-primary hover:bg-primary-deep text-white font-bold rounded-full transition-colors cursor-pointer text-sm"
        >
          Quay lại
        </button>
      </div>
    );
  }

  if (quizFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-20">
        {/* Results Card */}
        <div className="bg-surface-card dark:bg-surface-dark/50 border border-hairline dark:border-divider-dark rounded-md p-8 text-center space-y-6 shadow-sm transition-colors">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Trophy size={36} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-ink dark:text-on-dark font-display tracking-tight">Hoàn thành Trắc nghiệm!</h1>
            <p className="text-mute dark:text-on-dark-mute text-sm mt-1">Kết quả kiểm tra bộ bài của bạn</p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto pt-2">
            <div className="bg-surface-bone dark:bg-black/30 p-4 rounded-md border border-hairline dark:border-divider-dark">
              <span className="block text-2xl font-black text-primary font-mono">{score}/{questions.length}</span>
              <span className="text-[10px] uppercase font-bold text-mute dark:text-on-dark-mute tracking-wider">Đúng</span>
            </div>
            <div className="bg-surface-bone dark:bg-black/30 p-4 rounded-md border border-hairline dark:border-divider-dark">
              <span className="block text-2xl font-black text-ink dark:text-on-dark font-mono">{percentage}%</span>
              <span className="text-[10px] uppercase font-bold text-mute dark:text-on-dark-mute tracking-wider">Tỷ lệ</span>
            </div>
            <div className="bg-surface-bone dark:bg-black/30 p-4 rounded-md border border-hairline dark:border-divider-dark">
              <span className="block text-2xl font-black text-amber-500 font-mono">{score * 10}</span>
              <span className="text-[10px] uppercase font-bold text-mute dark:text-on-dark-mute tracking-wider">Điểm số</span>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={handleReplay}
              className="px-6 py-2.5 bg-primary hover:bg-primary-deep text-white font-bold rounded-full transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <RefreshCw size={14} />
              Luyện lại
            </button>
            <button
              onClick={() => navigate(isVirtual ? '/decks' : `/decks/${id}`)}
              className="px-6 py-2.5 bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-ink dark:text-on-dark font-bold rounded-full transition-colors cursor-pointer"
            >
              Quay lại bộ bài
            </button>
          </div>
        </div>

        {/* Detailed Answers Breakdown */}
        <div className="bg-surface-card dark:bg-surface-dark/50 border border-hairline dark:border-divider-dark rounded-md p-6 shadow-sm transition-colors text-left space-y-4">
          <h3 className="text-sm font-bold text-ink dark:text-on-dark uppercase tracking-wider">Bảng chi tiết kết quả</h3>
          <div className="divide-y divide-hairline dark:divide-divider-dark">
            {userAnswers.map((ans, idx) => (
              <div key={idx} className="py-4 flex gap-4 items-start first:pt-0 last:pb-0">
                <div className="shrink-0 mt-0.5">
                  {ans.isCorrect ? (
                    <CheckCircle2 className="text-badge-success" size={20} />
                  ) : (
                    <XCircle className="text-red-500" size={20} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-display font-extrabold text-ink dark:text-on-dark">{ans.question}</span>
                    <span className="text-xs font-mono font-semibold text-primary">{ans.pinyin}</span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs">
                    <p className="text-mute dark:text-on-dark-mute">
                      Đáp án chọn: <strong className={ans.isCorrect ? 'text-badge-success' : 'text-red-500'}>{ans.selectedAnswer || 'Bỏ qua (Hết giờ)'}</strong>
                    </p>
                    {!ans.isCorrect && (
                      <p className="text-mute dark:text-on-dark-mute">
                        Đáp án đúng: <strong className="text-badge-success">{ans.correctAnswer}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 text-left">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between border-b border-hairline dark:border-divider-dark pb-4">
        <button
          onClick={() => navigate(isVirtual ? '/decks' : `/decks/${id}`)}
          className="flex items-center gap-1.5 text-xs font-bold text-mute hover:text-ink dark:text-on-dark-mute dark:hover:text-on-dark font-mono cursor-pointer"
        >
          <ArrowLeft size={14} />
          Thoát
        </button>
        <span className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute">
          CÂU {currentQuestionIndex + 1} / {questions.length}
        </span>
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
          <Clock size={12} className="animate-pulse" />
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* Timer Bar */}
      <div className="h-1.5 w-full bg-surface-bone dark:bg-black/35 rounded-full overflow-hidden border border-hairline dark:border-divider-dark">
        <div 
          className="h-full bg-primary transition-all duration-1000 ease-linear" 
          style={{ width: `${(timeLeft / 15) * 100}%` }} 
        />
      </div>

      {/* Calligraphy Question Card */}
      <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-md p-8 text-center space-y-4 shadow-sm relative overflow-hidden transition-colors">
        <span className="text-[10px] uppercase font-bold text-mute dark:text-on-dark-mute tracking-widest absolute top-4 left-6">
          Nghĩa của từ này là gì?
        </span>

        {/* Toggle Pinyin Button */}
        <button
          type="button"
          onClick={() => setShowPinyin((prev) => !prev)}
          className="absolute top-3 right-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-hairline dark:border-divider-dark bg-surface-card/85 dark:bg-surface-dark/85 hover:bg-surface-bone dark:hover:bg-black px-3 py-1.5 text-[10px] font-semibold text-ink dark:text-on-dark shadow-sm backdrop-blur transition-all duration-200 cursor-pointer"
          title="Ẩn/Hiện phiên âm Pinyin"
        >
          {showPinyin ? <EyeOff size={12} className="text-primary" /> : <Eye size={12} className="text-primary" />}
          <span className="font-mono">{showPinyin ? 'Ẩn Pinyin' : 'Hiện Pinyin'}</span>
        </button>
        
        <h2 className="text-7xl font-display font-extrabold text-ink dark:text-on-dark py-6 leading-none">
          {currentQuestion?.card.hanzi}
        </h2>
        
        <div 
          className={`text-lg font-mono font-bold text-primary transition-all duration-300 h-6 flex items-center justify-center ${
            showPinyin ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          {currentQuestion?.card.pinyin || ' '}
        </div>
      </div>

      {/* Multiple Choice Options List */}
      <div className="grid gap-3.5">
        {currentQuestion?.options.map((option, idx) => {
          const isSelected = selectedOption === option;
          const isCorrect = option === currentQuestion.correctOption;
          
          let optionStyle = "border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark hover:bg-surface-bone dark:hover:bg-black/50 text-ink dark:text-on-dark hover:border-primary";
          
          if (isAnswered) {
            if (isCorrect) {
              optionStyle = "border-badge-success/40 bg-badge-success/10 text-badge-success font-semibold";
            } else if (isSelected) {
              optionStyle = "border-red-500/40 bg-red-500/10 text-red-500 font-semibold";
            } else {
              optionStyle = "border-hairline dark:border-divider-dark bg-surface-card/45 dark:bg-surface-dark/25 text-mute dark:text-on-dark-mute cursor-not-allowed";
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isAnswered}
              onClick={() => handleOptionSelect(option)}
              className={`w-full text-left p-4 rounded-md border text-sm transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.99] flex items-center justify-between ${optionStyle}`}
            >
              <span>{option}</span>
              {isAnswered && isCorrect && <span className="text-badge-success text-xs font-mono font-bold">✓ Đúng</span>}
              {isAnswered && isSelected && !isCorrect && <span className="text-red-500 text-xs font-mono font-bold">✗ Sai</span>}
            </button>
          );
        })}
      </div>

      {/* Navigation Row */}
      {isAnswered && (
        <button
          onClick={handleNext}
          className="w-full py-3.5 bg-primary hover:bg-primary-deep text-white font-mono font-bold rounded-full transition-all shadow-md active:scale-95 text-center cursor-pointer"
        >
          {currentQuestionIndex === questions.length - 1 ? 'Hoàn thành kết quả' : 'Câu tiếp theo →'}
        </button>
      )}
    </div>
  );
}
