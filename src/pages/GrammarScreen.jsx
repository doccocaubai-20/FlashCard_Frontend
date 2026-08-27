import React, { useState, useEffect, useMemo } from 'react';
import { grammarData } from '../data/grammarData';
import { skillLogsApi, grammarProgressApi } from '../services/learningApi';
import {
  BookOpenText,
  Volume2,
  Sparkles,
  Filter,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowLeft,
  ArrowRight,
  Play,
  Check,
  Award
} from 'lucide-react';
import HoverableText from '../components/common/HoverableText';
import grammarQuestionBank from '../data/grammarQuestionBank.json';
import { useNavigate } from 'react-router-dom';
import { speakChinese } from '../utils/tts';

// Glossary mapping for grammar terminology to help beginners analyze structures
const GRAMMAR_GLOSSARY = {
  'subj': { vn: 'Chủ ngữ (Subject)', desc: 'Chủ thể thực hiện hành động hoặc trạng thái' },
  'verb': { vn: 'Động từ (Verb)', desc: 'Từ chỉ hành động, hoạt động hoặc trạng thái' },
  'adj': { vn: 'Tính từ (Adjective)', desc: 'Từ miêu tả tính chất, đặc điểm hoặc trạng thái' },
  'obj': { vn: 'Tân ngữ (Object)', desc: 'Đối tượng chịu tác động hoặc nhận hành động' },
  'noun': { vn: 'Danh từ (Noun)', desc: 'Từ chỉ người, sự vật, địa điểm, khái niệm' },
  'place': { vn: 'Địa điểm (Place)', desc: 'Từ hoặc cụm từ chỉ nơi chốn, vị trí' },
  'time': { vn: 'Thời gian (Time)', desc: 'Từ chỉ mốc thời gian hoặc khoảng thời gian' },
  'pronoun': { vn: 'Đại từ (Pronoun)', desc: 'Từ dùng để xưng hô hoặc thay thế (tôi, bạn, họ...)' },
  'adverb': { vn: 'Phó từ (Adverb)', desc: 'Từ bổ nghĩa cho động từ, tính từ hoặc cả câu' },
  'prep': { vn: 'Giới từ (Preposition)', desc: 'Từ giới thiệu đối tượng chỉ hướng, thời gian, nơi chốn' },
  'measure': { vn: 'Lượng từ (Measure Word)', desc: 'Từ dùng kèm số từ để đếm đơn vị của danh từ' },
  'number': { vn: 'Số từ (Number)', desc: 'Từ chỉ số lượng, chữ số hoặc thứ tự (一, 二, 三...)' },
  'mental verb': { vn: 'Động từ tâm lý', desc: 'Chỉ hoạt động tâm lý, cảm xúc (như 喜欢, 想, 爱...)' },
  'verb / adj.': { vn: 'Động từ hoặc Tính từ', desc: 'Có thể sử dụng cả động từ hoặc tính từ tại vị trí này' },
  'noun / pronoun': { vn: 'Danh từ hoặc Đại từ', desc: 'Có thể đi kèm cả danh từ hoặc đại từ xưng hô' }
};

// Sub-component to parse and render formulas interactively with color-coded grammar pills
function ParsedFormula({ formula }) {
  if (!formula) return null;

  // Split formula components by '+'
  const tokens = formula.split('+');

  const getGlossaryKey = (tokenStr) => {
    const clean = tokenStr.trim().toLowerCase().replace(/\.$/, '');
    if (clean === 's' || clean === 'subj' || clean === 'subject') return 'subj';
    if (clean === 'v' || clean === 'verb') return 'verb';
    if (clean === 'o' || clean === 'obj' || clean === 'object') return 'obj';
    if (clean === 'n' || clean === 'noun') return 'noun';
    if (clean === 'adj' || clean === 'adjective') return 'adj';
    if (clean === 'adv' || clean === 'adverb') return 'adverb';
    if (clean === 'prep' || clean === 'preposition') return 'prep';
    if (clean === 'num' || clean === 'number') return 'number';
    if (clean === 'm' || clean === 'mw' || clean === 'measure' || clean === 'measure word') return 'measure';
    if (clean === 'pron' || clean === 'pronoun') return 'pronoun';
    if (clean === 'place') return 'place';
    if (clean === 'time') return 'time';
    return clean;
  };

  const renderToken = (rawToken, keyPrefix) => {
    const trimmed = rawToken.trim();
    if (!trimmed) return null;

    // Check if token contains "hoặc" or "or" to split them
    if (trimmed.includes(' hoặc ')) {
      const parts = trimmed.split(' hoặc ');
      return (
        <span key={keyPrefix} className="inline-flex items-center gap-1">
          {parts.map((part, pIdx) => (
            <React.Fragment key={pIdx}>
              {pIdx > 0 && <span className="text-[11px] font-bold text-mute dark:text-on-dark-mute px-0.5 select-none">hoặc</span>}
              {renderToken(part, `${keyPrefix}-part-${pIdx}`)}
            </React.Fragment>
          ))}
        </span>
      );
    }

    if (trimmed.includes(' or ')) {
      const parts = trimmed.split(' or ');
      return (
        <span key={keyPrefix} className="inline-flex items-center gap-1">
          {parts.map((part, pIdx) => (
            <React.Fragment key={pIdx}>
              {pIdx > 0 && <span className="text-[11px] font-bold text-mute dark:text-on-dark-mute px-0.5 select-none">hoặc</span>}
              {renderToken(part, `${keyPrefix}-part-${pIdx}`)}
            </React.Fragment>
          ))}
        </span>
      );
    }

    // Check if optional: e.g. "(S)" or "(Obj.)"
    const isOptional = trimmed.startsWith('(') && trimmed.endsWith(')');
    let cleanToken = isOptional ? trimmed.slice(1, -1).trim() : trimmed;

    // Strip leading '+' inside parentheses if any, e.g. "(+ Obj.)"
    if (cleanToken.startsWith('+')) {
      cleanToken = cleanToken.slice(1).trim();
    }

    // Strip ending question mark or punctuation for key comparison
    let finalCleanToken = cleanToken;
    let suffix = '';
    if (cleanToken.endsWith('?')) {
      finalCleanToken = cleanToken.slice(0, -1).trim();
      suffix = '?';
    }

    const key = getGlossaryKey(finalCleanToken);
    const glossaryInfo = GRAMMAR_GLOSSARY[key];

    // Default badge style
    let badgeStyle = "bg-primary/10 border-primary/20 text-primary dark:text-primary-deep font-bold";
    let hoverTitle = "Trợ từ hoặc từ khóa cố định bắt buộc có trong câu mẫu";

    if (glossaryInfo) {
      hoverTitle = `${glossaryInfo.vn}: ${glossaryInfo.desc}`;

      if (key === 'subj') {
        badgeStyle = "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs";
      } else if (key === 'verb') {
        badgeStyle = "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs";
      } else if (key === 'adj') {
        badgeStyle = "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 font-bold shadow-xs";
      } else if (key === 'obj') {
        badgeStyle = "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold shadow-xs";
      } else if (key === 'noun') {
        badgeStyle = "bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900/60 text-sky-600 dark:text-sky-400 font-bold shadow-xs";
      } else if (key === 'place') {
        badgeStyle = "bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900/60 text-teal-600 dark:text-teal-400 font-bold shadow-xs";
      } else if (key === 'time') {
        badgeStyle = "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 font-bold shadow-xs";
      } else if (key === 'pronoun') {
        badgeStyle = "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/60 text-purple-600 dark:text-purple-400 font-bold shadow-xs";
      } else if (key === 'adverb') {
        badgeStyle = "bg-fuchsia-50 dark:bg-fuchsia-950/40 border-fuchsia-200 dark:border-fuchsia-900/60 text-fuchsia-600 dark:text-fuchsia-400 font-bold shadow-xs";
      } else if (key === 'prep') {
        badgeStyle = "bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-900/60 text-violet-600 dark:text-violet-400 font-bold shadow-xs";
      } else if (key === 'measure') {
        badgeStyle = "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900/60 text-orange-600 dark:text-orange-400 font-bold shadow-xs";
      } else if (key === 'number') {
        badgeStyle = "bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-900/60 text-yellow-600 dark:text-yellow-400 font-bold shadow-xs";
      }
    } else {
      // Check if it's Chinese character
      const hasChinese = /[\u4e00-\u9fa5]/.test(finalCleanToken);
      if (hasChinese) {
        badgeStyle = "bg-primary border border-primary/20 text-white font-extrabold px-3 py-1 shadow-[0_0_8px_rgba(84,203,212,0.3)] rounded-md";
        hoverTitle = "Trợ từ / Từ khóa cố định bắt buộc có trong câu mẫu";
      } else {
        // Fallback style for others
        badgeStyle = "bg-surface-bone dark:bg-black/35 border-hairline dark:border-divider-dark text-body dark:text-on-dark-mute font-mono text-[11px] px-2 py-0.5 rounded";
      }
    }

    const displayText = isOptional ? `(${finalCleanToken})${suffix}` : `${finalCleanToken}${suffix}`;

    return (
      <span
        title={hoverTitle}
        className={`inline-flex items-center px-3 py-1.5 text-sm border cursor-help transition-all hover:scale-105 select-all ${badgeStyle} ${isOptional ? 'border-dashed opacity-75' : ''
          }`}
      >
        {displayText}
      </span>
    );
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 py-1">
      {tokens.map((token, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="text-mute dark:text-on-dark-mute font-light px-0.5 text-xs select-none">+</span>}
          {renderToken(token, `token-${index}`)}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function GrammarScreen() {
  const navigate = useNavigate()
  const [filterLevel, setFilterLevel] = useState('All');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const LIMIT = 10;

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterLevel]);

  // Synchronize pageInput with currentPage
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Grouping by title to resolve duplication at runtime
  const groupedGrammar = useMemo(() => {
    const list = filterLevel === 'All' ? grammarData : grammarData.filter((g) => g.level === filterLevel);
    const groups = [];
    const map = new Map();

    list.forEach((item) => {
      // Group by level and title to prevent collision across levels
      const key = `${item.level}_${item.title}`;
      if (!map.has(key)) {
        const groupObj = {
          id: item.id, // first item's ID used as group key/expansion identifier
          level: item.level,
          title: item.title,
          url: item.url,
          items: [] // array of all matching raw entries
        };
        map.set(key, groupObj);
        groups.push(groupObj);
      }
      map.get(key).items.push(item);
    });
    return groups;
  }, [filterLevel]);

  const totalCount = groupedGrammar.length;
  const totalPages = Math.ceil(totalCount / LIMIT) || 1;

  const paginatedGrammar = useMemo(() => {
    const startIndex = (currentPage - 1) * LIMIT;
    return groupedGrammar.slice(startIndex, startIndex + LIMIT);
  }, [groupedGrammar, currentPage, LIMIT]);

  const [expandedId, setExpandedId] = useState(groupedGrammar[0]?.id || null);
  const [activeTabs, setActiveTabs] = useState({}); // Tracking active sub-structure tab index per group ID
  const [showLegend, setShowLegend] = useState(false); // Collapsible glossary guide for beginners
  // Grammar practice states
  const [practiceId, setPracticeId] = useState(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [translationInput, setTranslationInput] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  const [grammarProgress, setGrammarProgress] = useState([]);

  // Fetch grammar progress from database on mount or when returning from practice
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await grammarProgressApi.getAll();
        setGrammarProgress(res.data || []);
      } catch (err) {
        console.error('Failed to fetch grammar progress:', err);
      }
    };
    if (!practiceId) {
      fetchProgress();
    }
  }, [practiceId]);

  const currentQuizQuestions = useMemo(() => {
    return grammarQuestionBank[practiceId] || [];
  }, [practiceId]);

  // Save results when quiz finishes
  useEffect(() => {
    if (isQuizFinished && practiceId && currentQuizQuestions.length > 0) {
      const currentGrammar = grammarData.find(g => g.id === practiceId);
      const score = Math.round((correctCount / currentQuizQuestions.length) * 100);

      // Save to general skill logs
      skillLogsApi.save({
        skillType: 'GRAMMAR',
        targetId: practiceId,
        level: currentGrammar?.level || 'Ngữ pháp',
        score: score,
        accuracy: parseFloat((correctCount / currentQuizQuestions.length).toFixed(2)),
        details: {
          totalQuestions: currentQuizQuestions.length,
          correctCount: correctCount,
        }
      }).catch(err => console.error('Error saving grammar skill log:', err));

      // Save to grammar progress (upsert mastery score)
      grammarProgressApi.save({
        grammarId: practiceId,
        level: currentGrammar?.level || 'Ngữ pháp',
        score: score,
        correct: score >= 80 // If score >= 80% it's counted as a correct attempt for mastery increment
      }).catch(err => console.error('Error saving grammar progress:', err));
    }
  }, [isQuizFinished, practiceId, correctCount, currentQuizQuestions.length]);

  const currentQuestion = currentQuizQuestions[quizIndex];

  const startPractice = (grammarId) => {
    setPracticeId(grammarId);
    setQuizIndex(0);
    setSelectedOption(null);
    setTranslationInput('');
    setIsChecked(false);
    setIsCorrect(false);
    setCorrectCount(0);
    setIsQuizFinished(false);
  };

  const handleCheckQuestion = () => {
    if (!currentQuestion) return;
    setIsChecked(true);
    if (currentQuestion.type === 'mcq') {
      const correct = selectedOption === currentQuestion.answer;
      setIsCorrect(correct);
      if (correct) {
        setCorrectCount(prev => prev + 1);
      }
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setTranslationInput('');
    setIsChecked(false);
    setIsCorrect(false);
    if (quizIndex + 1 < currentQuizQuestions.length) {
      setQuizIndex(prev => prev + 1);
    } else {
      setIsQuizFinished(true);
    }
  };

  const handleSelfGrade = (correct) => {
    if (correct) {
      setCorrectCount(prev => prev + 1);
    }
    setSelectedOption(null);
    setTranslationInput('');
    setIsChecked(false);
    setIsCorrect(false);
    if (quizIndex + 1 < currentQuizQuestions.length) {
      setQuizIndex(prev => prev + 1);
    } else {
      setIsQuizFinished(true);
    }
  };

  const handleSpeakExample = (e, text) => {
    e.stopPropagation();
    speakChinese(text, 'zh-CN');
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => {
      const newId = prev === id ? null : id;
      if (newId) {
        // Scroll the newly expanded item into view after React re-renders
        setTimeout(() => {
          const el = document.getElementById(`grammar-${newId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 80);
      }
      return newId;
    });
  };

  const getActiveTab = (groupId) => activeTabs[groupId] || 0;
  const setActiveTab = (groupId, index) => {
    setActiveTabs((prev) => ({ ...prev, [groupId]: index }));
  };

  if (practiceId && currentQuizQuestions.length > 0) {
    const currentGrammar = grammarData.find(g => g.id === practiceId);

    return (
      <div className="max-w-3xl lg:max-w-4xl mx-auto space-y-6 text-left pb-12 select-none">
        {/* Progress header & exit */}
        <div className="flex justify-between items-center border-b border-hairline dark:border-divider-dark pb-4">
          <button
            onClick={() => setPracticeId(null)}
            className="flex items-center gap-1.5 text-mute hover:text-ink dark:hover:text-on-dark font-mono font-bold text-xs cursor-pointer"
          >
            <ArrowLeft size={14} />
            Thoát luyện tập
          </button>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono font-extrabold uppercase bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded flex-shrink-0">
              {currentGrammar?.level || 'Ngữ pháp'}
            </span>
            <span className="text-mute">•</span>
            <div className="text-xs font-mono font-bold text-primary">
              Câu {quizIndex + 1} / {currentQuizQuestions.length}
            </div>
          </div>
        </div>

        {/* Victory Screen */}
        {isQuizFinished ? (
          <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-xl p-8 text-center shadow-lg space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 animate-bounce">
              <Trophy size={36} />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-extrabold text-ink dark:text-on-dark tracking-tight">Hoàn thành luyện tập!</h2>
              <p className="text-xs text-mute dark:text-on-dark-mute">Bạn vừa hoàn thành 20 câu hỏi luyện tập cho cấu trúc ngữ pháp này.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="bg-surface-bone/35 dark:bg-black/25 border border-hairline dark:border-zinc-800 rounded-xl p-4 text-center">
                <span className="text-[10px] font-mono font-bold text-mute uppercase block">Độ chính xác</span>
                <span className="text-2xl font-black text-emerald-500 block mt-1">
                  {Math.round((correctCount / currentQuizQuestions.length) * 100)}%
                </span>
              </div>
              <div className="bg-surface-bone/35 dark:bg-black/25 border border-hairline dark:border-zinc-800 rounded-xl p-4 text-center">
                <span className="text-[10px] font-mono font-bold text-mute uppercase block">Số câu đúng</span>
                <span className="text-2xl font-black text-primary block mt-1">
                  {correctCount} / {currentQuizQuestions.length}
                </span>
              </div>
            </div>

            <div className="flex gap-3 max-w-md mx-auto pt-4">
              <button
                onClick={() => startPractice(practiceId)}
                className="flex-1 py-3 bg-primary hover:bg-primary-deep text-white font-mono font-bold text-xs rounded-full transition-all cursor-pointer shadow-sm"
              >
                Luyện tập lại
              </button>
              <button
                onClick={() => setPracticeId(null)}
                className="flex-1 py-3 bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-ink dark:text-on-dark font-mono font-bold text-xs rounded-full transition-all cursor-pointer"
              >
                Quay lại danh sách
              </button>
            </div>
          </div>
        ) : (
          /* Active Question Board */
          <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-2xl p-7 sm:p-10 shadow-md space-y-8 relative overflow-hidden text-left">
            <div className="space-y-2 border-b border-hairline dark:border-divider-dark pb-4">
              <span className="text-[10px] sm:text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-widest block">
                {currentQuestion.type === 'mcq' ? 'TRẮC NGHIỆM - CHỌN ĐÁP ÁN ĐÚNG' : 'DỊCH CÂU - TỰ LUYỆN TẬP'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-ink dark:text-on-dark leading-relaxed font-display">
                {currentGrammar?.title}
              </h2>
            </div>

            {/* Prompt */}
            <div className="bg-surface-bone/45 dark:bg-black/35 border border-hairline dark:border-zinc-800/80 rounded-2xl p-8 sm:p-12 text-center space-y-4">
              <p className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-ink dark:text-on-dark tracking-wider leading-relaxed">
                {currentQuestion.type === 'translate_zh_vi' ? (
                  <HoverableText text={currentQuestion.prompt} />
                ) : (
                  <span className="hanzi-text font-bold">{currentQuestion.prompt}</span>
                )}
              </p>
              {currentQuestion.pinyin && (
                <p className="text-lg sm:text-2xl font-mono font-bold text-primary/80 tracking-wide">
                  {currentQuestion.pinyin}
                </p>
              )}
            </div>

            {/* MCQ Option Choices */}
            {currentQuestion.type === 'mcq' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOption === option.id;
                  const isCorrectAnswer = option.id === currentQuestion.answer;

                  let cardStyle = 'bg-surface-card border-hairline hover:bg-surface-bone dark:hover:bg-black/30 text-ink dark:text-on-dark';
                  if (isChecked) {
                    if (isCorrectAnswer) {
                      cardStyle = 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-black shadow-sm';
                    } else if (isSelected) {
                      cardStyle = 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400 font-black shadow-sm';
                    } else {
                      cardStyle = 'bg-surface-card border-hairline opacity-60 text-ink dark:text-on-dark';
                    }
                  } else if (isSelected) {
                    cardStyle = 'border-primary ring-2 ring-primary bg-primary/5 text-primary font-black';
                  }

                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={isChecked}
                      onClick={() => setSelectedOption(option.id)}
                      className={`p-5 sm:p-6 rounded-2xl border-2 text-left text-lg sm:text-2xl transition-all flex items-center gap-4 cursor-pointer shadow-xs ${cardStyle}`}
                    >
                      <span className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-sm font-mono font-black ${isSelected
                        ? 'bg-primary text-white'
                        : isChecked && isCorrectAnswer
                          ? 'bg-emerald-500 text-white'
                          : 'bg-surface-bone dark:bg-black/40 text-mute'
                        }`}>
                        {option.id}
                      </span>
                      <span className="font-display font-extrabold leading-normal hanzi-text tracking-wide">{option.text}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Translation Text Input */
              <div className="space-y-3 pt-2">
                <span className="text-xs font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-widest block">
                  Nhập bản dịch của bạn:
                </span>
                <textarea
                  disabled={isChecked}
                  placeholder={
                    currentQuestion.type === 'translate_zh_vi'
                      ? 'Nhập bản dịch tiếng Việt...'
                      : 'Nhập câu tiếng Trung (Pinyin hoặc Chữ Hán)...'
                  }
                  value={translationInput}
                  onChange={(e) => setTranslationInput(e.target.value)}
                  rows={3}
                  className="w-full p-5 bg-surface-card dark:bg-surface-dark border-2 border-hairline dark:border-divider-dark rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-lg sm:text-xl font-bold text-ink dark:text-on-dark placeholder:opacity-40 leading-relaxed"
                />
              </div>
            )}

            {/* Answer check explanation / Reference translation */}
            {isChecked && (
              <div
                style={{
                  backgroundColor: currentQuestion.type === 'mcq'
                    ? (isCorrect ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)')
                    : 'rgba(84, 203, 212, 0.12)',
                  borderColor: currentQuestion.type === 'mcq'
                    ? (isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)')
                    : 'rgba(84, 203, 212, 0.3)'
                }}
                className={`w-full border-2 rounded-xl p-4 flex gap-3.5 items-start mt-4 animate-fade-in text-left`}
              >
                <div className="shrink-0 mt-0.5">
                  {currentQuestion.type === 'mcq' ? (
                    isCorrect
                      ? <CheckCircle2 size={20} className="text-emerald-500" />
                      : <XCircle size={20} className="text-red-500" />
                  ) : (
                    <Award size={20} className="text-primary" />
                  )}
                </div>
                <div className="flex-1 text-left space-y-1">
                  <h4 className={`text-sm font-bold ${currentQuestion.type === 'mcq'
                    ? (isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')
                    : 'text-primary'
                    }`}>
                    {currentQuestion.type === 'mcq'
                      ? (isCorrect ? 'Tuyệt vời! Bạn trả lời chính xác.' : 'Chưa chính xác!')
                      : 'So sánh với đáp án mẫu:'
                    }
                  </h4>

                  {currentQuestion.type === 'mcq' ? (
                    <p className="text-xs text-body dark:text-on-dark-mute leading-relaxed pt-1 font-medium">
                      {currentQuestion.explanation}
                    </p>
                  ) : (
                    <div className="pt-1.5 space-y-2">
                      <div className="bg-surface-card p-3 rounded-lg border border-hairline dark:border-zinc-800 space-y-1">
                        <span className="text-[9px] font-mono text-mute uppercase block">Đáp án hệ thống:</span>
                        <p className="text-sm font-bold text-ink dark:text-on-dark font-display leading-relaxed">
                          {currentQuestion.referenceAnswer}
                        </p>
                        {currentQuestion.pinyin && (
                          <p className="text-xs font-mono font-semibold text-primary">
                            {currentQuestion.pinyin}
                          </p>
                        )}
                      </div>

                      <div className="bg-surface-bone/50 dark:bg-black/20 p-3 rounded-lg border border-hairline dark:border-zinc-850 space-y-1">
                        <span className="text-[9px] font-mono text-mute uppercase block">Đáp án của bạn:</span>
                        <p className="text-sm font-semibold text-body dark:text-on-dark-mute leading-relaxed italic">
                          {translationInput.trim() || '(Bạn không nhập nội dung)'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons footer */}
            <div className="pt-4 flex justify-end">
              {!isChecked ? (
                <button
                  type="button"
                  disabled={currentQuestion.type === 'mcq' ? !selectedOption : !translationInput.trim()}
                  onClick={handleCheckQuestion}
                  className={`px-6 py-2.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer shadow-sm ${(currentQuestion.type === 'mcq' ? selectedOption : translationInput.trim())
                    ? 'bg-primary hover:bg-primary-deep text-white hover:scale-[1.02] active:scale-98'
                    : 'bg-primary/30 text-white/60 cursor-not-allowed'
                    }`}
                >
                  Kiểm tra kết quả
                </button>
              ) : currentQuestion.type === 'mcq' ? (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="px-6 py-2.5 bg-ink hover:bg-black dark:bg-primary dark:hover:bg-primary-deep text-white font-mono font-bold text-xs rounded-full transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
                >
                  Tiếp tục
                  <ArrowRight size={14} />
                </button>
              ) : (
                /* Self grading buttons for translation */
                <div className="w-full flex items-center justify-between gap-3 border-t border-hairline dark:border-divider-dark pt-4 mt-2">
                  <span className="text-[10px] font-mono font-bold text-mute">Bạn trả lời có đúng không?</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelfGrade(false)}
                      className="px-4 py-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-500 text-xs font-bold rounded-full transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                    >
                      <XCircle size={13} />
                      Sai rồi
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelfGrade(true)}
                      className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-500 text-xs font-bold rounded-full transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                    >
                      <CheckCircle2 size={13} />
                      Đúng rồi
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-bone dark:hover:bg-zinc-800 text-mute transition-all cursor-pointer border border-hairline dark:border-zinc-800"
        >
          <ArrowLeft size={16} />
        </button>

        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink dark:text-on-dark tracking-tight">Ngữ pháp HSK</h1>
          <p className="text-mute dark:text-on-dark-mute text-sm mt-0.5">
            Tổng hợp các cấu trúc ngữ pháp cốt lõi cấp độ HSK 1 - HSK 6 kèm chú giải và phát âm câu ví dụ mẫu.
          </p>
        </div>
      </div>

      {/* Visual Glossary/Legend for Beginners */}
      <div className="bg-surface-card dark:bg-surface-dark/35 border border-hairline dark:border-divider-dark rounded-md overflow-hidden transition-all duration-300">
        <button
          type="button"
          onClick={() => setShowLegend(!showLegend)}
          className="w-full px-5 py-3 flex items-center justify-between text-left cursor-pointer hover:bg-surface-bone/20 dark:hover:bg-black/10 select-none"
        >
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Sparkles size={14} className="animate-pulse text-primary" />
            <span>Mẹo học: Cách phân tích cấu trúc ngữ pháp</span>
          </div>
          <span className="text-xs text-mute dark:text-on-dark-mute font-medium underline">
            {showLegend ? 'Ẩn hướng dẫn' : 'Xem hướng dẫn ký hiệu'}
          </span>
        </button>

        {showLegend && (
          <div className="px-5 pb-5 border-t border-hairline dark:border-divider-dark pt-4 space-y-3 animate-fade-in text-left">
            <p className="text-xs text-body dark:text-on-dark-mute leading-relaxed">
              Các công thức ngữ pháp được mã hóa màu giúp người mới học phân tích nhanh cấu trúc câu tiếng Trung (rê chuột lên ký hiệu để xem giải thích chi tiết):
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
              {Object.entries(GRAMMAR_GLOSSARY).slice(0, 12).map(([key, info]) => {
                let colorClass = "bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400";
                if (key === 'subj') colorClass = "bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-400";
                if (key === 'verb') colorClass = "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-400";
                if (key === 'adj') colorClass = "bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-400";
                if (key === 'noun') colorClass = "bg-sky-50 border-sky-200 text-sky-600 dark:bg-sky-950/40 dark:border-sky-900/60 dark:text-sky-400";
                if (key === 'place') colorClass = "bg-teal-50 border-teal-200 text-teal-600 dark:bg-teal-950/40 dark:border-teal-900/60 dark:text-teal-400";
                if (key === 'time') colorClass = "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-400";
                if (key === 'pronoun') colorClass = "bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-950/40 dark:border-purple-900/60 dark:text-purple-400";
                if (key === 'adverb') colorClass = "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-600 dark:bg-fuchsia-950/40 dark:border-fuchsia-900/60 dark:text-fuchsia-400";
                if (key === 'prep') colorClass = "bg-violet-50 border-violet-200 text-violet-600 dark:bg-violet-950/40 dark:border-violet-900/60 dark:text-violet-400";
                if (key === 'measure') colorClass = "bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-950/40 dark:border-orange-900/60 dark:text-orange-400";
                if (key === 'number') colorClass = "bg-yellow-50 border-yellow-200 text-yellow-600 dark:bg-yellow-950/40 dark:border-yellow-900/60 dark:text-yellow-400";

                const displayKey = key.charAt(0).toUpperCase() + key.slice(1) + (['verb', 'noun', 'place', 'time', 'pronoun', 'adverb', 'number'].includes(key) ? '' : '.');

                return (
                  <div key={key} className="border border-hairline dark:border-divider-dark rounded p-2 flex flex-col gap-0.5 bg-surface-bone/25 dark:bg-black/15">
                    <span className={`inline-self-start px-2 py-0.5 rounded text-[10px] border font-bold ${colorClass}`}>
                      {displayKey}
                    </span>
                    <span className="text-[11px] font-bold text-ink dark:text-on-dark">{info.vn}</span>
                    <span className="text-[9px] text-mute dark:text-on-dark-mute leading-normal">{info.desc}</span>
                  </div>
                );
              })}
              <div className="border border-hairline dark:border-divider-dark rounded p-2 flex flex-col gap-0.5 bg-surface-bone/25 dark:bg-black/15">
                <span className="inline-self-start px-2 py-0.5 rounded text-[10px] border font-extrabold bg-primary border-primary/20 text-white shadow-xs">
                  字 (Hán tự)
                </span>
                <span className="text-[11px] font-bold text-ink dark:text-on-dark">Từ cố định</span>
                <span className="text-[9px] text-mute dark:text-on-dark-mute leading-normal">Trợ từ, phó từ cố định bắt buộc có mặt trong câu ngữ pháp</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Level Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline dark:border-divider-dark pb-4">
        <div className="flex items-center gap-2 text-mute dark:text-on-dark-mute text-xs font-semibold uppercase tracking-wider">
          <Filter size={14} />
          Lọc theo cấp độ:
        </div>

        <div className="flex gap-1.5 select-none overflow-x-auto no-scrollbar max-w-full pb-1 flex-nowrap -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          {['All', 'HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6'].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                setFilterLevel(lvl);
                // Collapse and auto-select first group in new list to ensure clean navigation
                const list = lvl === 'All' ? grammarData : grammarData.filter(g => g.level === lvl);
                if (list.length > 0) {
                  // Find first group key based on level/title grouping
                  const firstItem = list[0];
                  setExpandedId(firstItem.id);
                } else {
                  setExpandedId(null);
                }
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer shrink-0 ${filterLevel === lvl
                ? 'bg-primary border-transparent text-white shadow-sm'
                : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
                }`}
            >
              {lvl === 'All' ? 'Tất cả' : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Grammar Points Accordion List */}
      <div className="space-y-4">
        {paginatedGrammar.length > 0 ? (
          paginatedGrammar.map((group) => {
            const isExpanded = expandedId === group.id;
            const progressItems = group.items.map(item => grammarProgress.find(p => p.grammarId === item.id)).filter(Boolean);
            const hasProgress = progressItems.length > 0;
            const maxMastery = hasProgress ? Math.max(...progressItems.map(p => p.masteryScore)) : 0;
            const itemsCount = group.items.length;
            const activeIdx = getActiveTab(group.id);
            const activeItem = group.items[activeIdx] || group.items[0];

            return (
              <div
                key={group.id}
                id={`grammar-${group.id}`}
                className="bg-surface-card dark:bg-surface-dark/40 border border-hairline dark:border-divider-dark rounded-md overflow-hidden transition-all shadow-sm scroll-mt-4"
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(group.id)}
                  className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-surface-bone/35 dark:hover:bg-black/20 select-none text-left transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-extrabold uppercase bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded flex-shrink-0">
                        {group.level}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-mute uppercase tracking-widest leading-none">
                        Cấu trúc ngữ pháp
                      </span>
                      {itemsCount > 1 && (
                        <span className="text-[9px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 px-2 py-0.5 rounded flex-shrink-0">
                          {itemsCount} cấu trúc
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-ink dark:text-on-dark truncate font-display">
                      {group.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {hasProgress && (
                      <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all shadow-xs ${
                        maxMastery >= 90
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                          : maxMastery >= 70
                            ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/30'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                      }`}>
                        <Award size={12} className="text-current shrink-0" />
                        <span>Độ thông thạo: {maxMastery}%</span>
                      </div>
                    )}
                    {hasProgress && (
                      <div className={`flex sm:hidden h-5 w-5 items-center justify-center rounded-full text-[8px] font-black border ${
                        maxMastery >= 90
                          ? 'bg-emerald-500 text-white border-emerald-600'
                          : maxMastery >= 70
                            ? 'bg-teal-500 text-white border-teal-600'
                            : 'bg-amber-500 text-white border-amber-600'
                      }`} title={`Độ thông thạo: ${maxMastery}%`}>
                        {maxMastery}
                      </div>
                    )}
                    <div className="text-mute dark:text-on-dark-mute">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>

                {/* Collapsible Content */}
                {isExpanded && activeItem && (
                  <div className="px-5 pb-6 border-t border-hairline dark:border-divider-dark pt-5 space-y-5 text-left animate-fade-in">

                    {/* Sub-structures Tab Selector (if duplicate formulas exist under this title) */}
                    {itemsCount > 1 && (
                      <div className="flex flex-wrap gap-1.5 p-1 bg-surface-bone/50 dark:bg-black/30 rounded-md border border-hairline dark:border-divider-dark">
                        {group.items.map((item, idx) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveTab(group.id, idx)}
                            className={`flex-1 min-w-[120px] px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer text-center ${activeIdx === idx
                              ? 'bg-primary text-white shadow-sm'
                              : 'text-mute hover:text-ink hover:bg-surface-bone dark:text-on-dark-mute dark:hover:text-on-dark dark:hover:bg-black/40'
                              }`}
                          >
                            Cách dùng {idx + 1}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Formula & Explanation Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">

                      {/* Formula representation (parsed) */}
                      <div className="md:col-span-6 space-y-2">
                        <span className="text-[10px] font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">
                          Công thức cấu trúc
                        </span>
                        <div className="bg-surface-bone/80 dark:bg-black/35 p-4 border border-hairline dark:border-divider-dark rounded-md flex flex-wrap items-center justify-center gap-1.5 shadow-sm min-h-[60px]">
                          <ParsedFormula formula={activeItem.formula} />
                        </div>
                      </div>

                      {/* Explanation */}
                      <div className="md:col-span-6 space-y-2">
                        <span className="text-[10px] font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">
                          Ý nghĩa & Cách dùng
                        </span>
                        <p className="text-sm font-medium text-body dark:text-on-dark-mute leading-relaxed bg-surface-bone/30 dark:bg-black/10 border border-hairline dark:border-divider-dark rounded-md p-4 min-h-[60px] flex items-center">
                          {activeItem.explanation}
                        </p>
                      </div>

                    </div>

                    {/* Practice Grammar Trigger Button */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => startPractice(activeItem.id)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-deep text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-[0.99] hover:shadow-md"
                      >
                        <Play size={14} className="fill-white text-white stroke-[3]" />
                        <span>Luyện tập cấu trúc ngữ pháp này (20 câu trắc nghiệm & dịch)</span>
                      </button>
                    </div>

                    {/* Tips & Attentions (if exist) */}
                    {(activeItem.tips || activeItem.attentions) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeItem.tips && (
                          <div className="bg-amber-50/30 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 rounded-md p-4 space-y-1">
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
                              Mẹo học
                            </span>
                            <p className="text-sm text-body dark:text-on-dark-mute leading-relaxed font-medium">
                              {activeItem.tips}
                            </p>
                          </div>
                        )}
                        {activeItem.attentions && (
                          <div className="bg-rose-50/30 dark:bg-rose-950/10 border border-rose-200/50 dark:border-rose-900/30 rounded-md p-4 space-y-1">
                            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
                              Lưu ý quan trọng
                            </span>
                            <p className="text-sm text-body dark:text-on-dark-mute leading-relaxed font-medium">
                              {activeItem.attentions}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Example Sentences */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">
                        <Sparkles size={11} className="text-primary" />
                        Các câu ví dụ thực tế
                      </div>

                      <div className="space-y-3">
                        {activeItem.examples.map((ex, idx) => (
                          <div
                            key={idx}
                            onClick={(e) => handleSpeakExample(e, ex.hanzi)}
                            className="group bg-surface-bone/30 dark:bg-black/20 hover:bg-surface-bone dark:hover:bg-black border border-hairline dark:border-divider-dark rounded-md p-4 flex items-center justify-between gap-4 cursor-pointer transition-all hover:scale-[1.005]"
                          >
                            <div className="space-y-1 flex-1 text-left min-w-0">
                              <p className="text-lg font-display font-extrabold text-ink dark:text-on-dark leading-relaxed group-hover:text-primary transition-colors">
                                <HoverableText text={ex.hanzi} />
                              </p>
                              <p className="text-xs font-mono font-semibold text-primary">
                                {ex.pinyin}
                              </p>
                              <p className="text-xs font-medium text-body dark:text-on-dark-mute italic pt-0.5 leading-relaxed">
                                {ex.meaning}
                              </p>
                            </div>

                            <button
                              type="button"
                              className="h-8 w-8 rounded-full bg-surface-card border border-hairline dark:bg-surface-dark dark:border-divider-dark text-primary shadow-sm flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shrink-0 cursor-pointer"
                              title="Nghe phát âm ví dụ"
                            >
                              <Volume2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center text-xs text-mute dark:text-on-dark-mute bg-surface-card border border-hairline rounded-md border-dashed italic">
            Không tìm thấy điểm ngữ pháp nào phù hợp.
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2 sm:gap-4 pb-6 select-none">
          {/* Prev Button */}
          <button
            type="button"
            onClick={() => {
              if (currentPage > 1) {
                setCurrentPage(prev => prev - 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            disabled={currentPage === 1}
            className="px-3 py-2 sm:px-4 sm:py-2 rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-mute hover:text-ink dark:hover:text-on-dark text-[11px] sm:text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
          >
            &larr; <span className="hidden sm:inline">Trang</span> trước
          </button>

          {/* Page Number Manual Input */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-mute shrink-0">
            <span className="hidden sm:inline">Trang</span>
            <input
              type="text"
              value={pageInput}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*$/.test(val)) {
                  setPageInput(val);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.target.blur();
                }
              }}
              onBlur={() => {
                let val = parseInt(pageInput, 10);
                if (isNaN(val) || val < 1) {
                  val = 1;
                } else if (val > totalPages) {
                  val = totalPages;
                }
                setPageInput(val.toString());
                setCurrentPage(val);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-10 sm:w-12 px-1.5 py-0.5 sm:py-1 text-center border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark text-ink dark:text-on-dark rounded font-mono font-bold text-[11px] sm:text-xs focus:ring-1 focus:ring-primary outline-none"
            />
            <span>/ {totalPages}</span>
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={() => {
              if (currentPage < totalPages) {
                setCurrentPage(prev => prev + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            disabled={currentPage === totalPages}
            className="px-3 py-2 sm:px-4 sm:py-2 rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-mute hover:text-ink dark:hover:text-on-dark text-[11px] sm:text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
          >
            Trang sau &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
