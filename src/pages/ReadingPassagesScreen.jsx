import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Volume2,
  Square,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Search,
  Star,
  RotateCcw,
  Eye,
  EyeOff,
  Check,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { readingPassagesApi } from '../services/readingPassagesApi';
import { favoriteWordsApi } from '../services/favoriteWordsApi';
import { useToast } from '../context/ToastContext';
import { useReadingAudio } from '../context/ReadingAudioContext';
import { HanziTooltip } from '../components/common/HoverableText';

/**
 * Tách chuỗi song ngữ Hán - Việt dạng:
 * "每天运动很健康 (Mỗi ngày vận động rất khỏe mạnh)"
 * thành { chinese: "每天运动很健康", vietnamese: "Mỗi ngày vận động rất khỏe mạnh" }
 */
function splitBilingualText(text) {
  if (!text) return { chinese: '', vietnamese: '' };
  const match = text.match(/^(.*?)\s*[(（]([^)）]+)[)）]\s*$/s);
  if (match) {
    return {
      chinese: match[1].trim(),
      vietnamese: match[2].trim(),
    };
  }
  return { chinese: text.trim(), vietnamese: '' };
}

export default function ReadingPassagesScreen() {
  const navigate = useNavigate();
  const { id: urlPassageId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  // Audio Context
  const {
    currentPassage: audioPassage,
    currentParagraphIndex: audioParaIdx,
    isPlaying: isAudioPlaying,
    isPaused: isAudioPaused,
    playPassage,
    stopAudio,
  } = useReadingAudio();

  // Navigation / Filter States
  const [selectedLevel, setSelectedLevel] = useState(() => {
    const lvlParam = searchParams.get('level');
    return lvlParam ? Number(lvlParam) : 1;
  });
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'read' | 'unread'

  // Data States
  const [summary, setSummary] = useState(null);
  const [passages, setPassages] = useState([]);
  const [userProgressMap, setUserProgressMap] = useState({});
  const [loadingList, setLoadingList] = useState(true);

  // Active Reader State (when viewing a specific passage)
  const [activePassage, setActivePassage] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [readerTab, setReaderTab] = useState('text'); // 'text' | 'quiz' | 'vocab'

  // Reader Controls
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  const [fontSize, setFontSize] = useState('md'); // 'sm' | 'md' | 'lg'

  // Quiz Interaction State
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [showQuizTranslation, setShowQuizTranslation] = useState(false); // Ẩn/Hiện tiếng Việt phần trắc nghiệm

  // Starred words set (tự động load từ database của user)
  const [savedWords, setSavedWords] = useState(new Set());

  // 1. Tải danh sách từ vựng yêu thích hiện có của user
  useEffect(() => {
    favoriteWordsApi
      .getFavorites()
      .then((res) => {
        if (res?.data && Array.isArray(res.data)) {
          setSavedWords(new Set(res.data.map((w) => w.hanzi)));
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch favorite words list:', err);
      });
  }, []);

  // 2. Tải thông tin tóm tắt cấp độ và tiến độ người dùng
  useEffect(() => {
    const fetchSummaryAndProgress = async () => {
      try {
        const [summaryRes, progressRes] = await Promise.allSettled([
          readingPassagesApi.getSummary(),
          readingPassagesApi.getUserProgress(),
        ]);

        if (summaryRes.status === 'fulfilled' && summaryRes.value?.data) {
          setSummary(summaryRes.value.data);
        }

        if (progressRes.status === 'fulfilled' && progressRes.value?.data) {
          const pMap = {};
          progressRes.value.data.forEach((p) => {
            pMap[p.passageId] = p;
          });
          setUserProgressMap(pMap);
        }
      } catch (err) {
        console.warn('Failed to load reading summary/progress:', err);
      }
    };

    fetchSummaryAndProgress();
  }, []);

  // 3. Tải danh sách bài đọc khi đổi level hoặc topic
  useEffect(() => {
    const fetchPassages = async () => {
      setLoadingList(true);
      try {
        const res = await readingPassagesApi.getPassagesByLevel(
          selectedLevel,
          selectedTopic !== 'all' ? selectedTopic : undefined,
        );
        setPassages(res.data || []);
      } catch (err) {
        console.error('Failed to load passages for level:', selectedLevel, err);
        setPassages([]);
      } finally {
        setLoadingList(false);
      }
    };

    if (!urlPassageId) {
      fetchPassages();
    }
  }, [selectedLevel, selectedTopic, urlPassageId]);

  // 4. Tải chi tiết bài đọc khi có URL param hoặc chọn bài
  useEffect(() => {
    const loadDetail = async (id) => {
      setLoadingDetail(true);
      setUserAnswers({});
      setQuizSubmitted(false);

      try {
        const res = await readingPassagesApi.getPassageById(id);
        setActivePassage(res.data);

        // Đánh dấu đã đọc tự động sau khi mở bài 3 giây
        setTimeout(() => {
          readingPassagesApi
            .saveProgress({
              passageId: id,
              hskLevel: res.data.hskLevel || selectedLevel,
              isRead: true,
            })
            .then((saveRes) => {
              if (saveRes?.data?.progress) {
                setUserProgressMap((prev) => ({
                  ...prev,
                  [id]: saveRes.data.progress,
                }));
              }
            })
            .catch(() => { });
        }, 3000);
      } catch (err) {
        showToast('Không tìm thấy bài đọc yêu cầu', 'error');
        setActivePassage(null);
      } finally {
        setLoadingDetail(false);
      }
    };

    if (urlPassageId) {
      loadDetail(urlPassageId);
    } else {
      setActivePassage(null);
    }
  }, [urlPassageId, selectedLevel, showToast]);

  // Lọc bài đọc theo tìm kiếm và trạng thái đọc
  const filteredPassages = useMemo(() => {
    return passages.filter((p) => {
      const matchSearch =
        !searchQuery ||
        p.title?.hanzi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.title?.pinyin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.title?.meaning?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.topicName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subTheme?.toLowerCase().includes(searchQuery.toLowerCase());

      const progress = userProgressMap[p.id];
      const isRead = !!progress?.isRead;

      if (statusFilter === 'read' && !isRead) return false;
      if (statusFilter === 'unread' && isRead) return false;

      return matchSearch;
    });
  }, [passages, searchQuery, statusFilter, userProgressMap]);

  // Điều hướng mở bài đọc
  const handleOpenPassage = (passageId) => {
    navigate(`/reading/${passageId}?level=${selectedLevel}`);
  };

  // Quay lại danh sách bài đọc
  const handleBackToList = () => {
    navigate(`/reading?level=${selectedLevel}`);
  };

  // Kiểm tra bài đọc hiện tại có đang được phát âm không
  const isCurrentPassageActiveInAudio =
    audioPassage?.id === activePassage?.id && (isAudioPlaying || isAudioPaused);

  // Bật/Tắt phát âm toàn bài
  const handleToggleSpeakAll = () => {
    if (isCurrentPassageActiveInAudio) {
      stopAudio();
    } else if (activePassage) {
      playPassage(activePassage, 0);
    }
  };

  // Phát âm một đoạn văn cụ thể
  const handleSpeakParagraph = (index) => {
    if (activePassage) {
      playPassage(activePassage, index);
    }
  };

  // Chọn câu trả lời trắc nghiệm
  const handleSelectOption = (questionId, optionKey) => {
    if (quizSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
  };

  // Nộp bài trắc nghiệm đọc hiểu
  const handleSubmitQuiz = async () => {
    if (!activePassage?.quiz?.length) return;

    setSubmittingQuiz(true);
    let correctCount = 0;
    activePassage.quiz.forEach((q) => {
      if (userAnswers[q.id] === q.answer) {
        correctCount++;
      }
    });

    const totalQuestions = activePassage.quiz.length;
    setQuizSubmitted(true);

    try {
      const res = await readingPassagesApi.saveProgress({
        passageId: activePassage.id,
        hskLevel: activePassage.hskLevel || selectedLevel,
        isRead: true,
        quizScore: correctCount,
        quizTotal: totalQuestions,
      });

      if (res?.data?.progress) {
        setUserProgressMap((prev) => ({
          ...prev,
          [activePassage.id]: res.data.progress,
        }));
      }

      if (res?.data?.xpAwarded > 0) {
        showToast(
          `Chúc mừng! Bạn đạt ${correctCount}/${totalQuestions} điểm và nhận được +${res.data.xpAwarded} XP!`,
          'success',
        );
      } else {
        showToast(
          `Đã ghi nhận kết quả: ${correctCount}/${totalQuestions} câu đúng!`,
          'info',
        );
      }
    } catch (err) {
      showToast('Đã lưu kết quả bài làm vào hệ thống', 'success');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // Làm lại bài trắc nghiệm
  const handleResetQuiz = () => {
    setUserAnswers({});
    setQuizSubmitted(false);
  };

  // Lưu hoặc Xóa từ vựng khỏi Sổ từ vựng (khắc phục lỗi conflict 409)
  const handleToggleSaveWord = async (word) => {
    const isSaved = savedWords.has(word.hanzi);

    if (isSaved) {
      // Đã lưu -> Bấm lại để HỦY LƯU (Remove)
      try {
        await favoriteWordsApi.deleteFavoriteByHanzi(word.hanzi);
        setSavedWords((prev) => {
          const next = new Set(prev);
          next.delete(word.hanzi);
          return next;
        });
        showToast(`Đã xóa "${word.hanzi}" khỏi Sổ từ vựng`, 'info');
      } catch (err) {
        showToast(`Không thể xóa từ "${word.hanzi}". Vui lòng thử lại`, 'error');
      }
    } else {
      // Chưa lưu -> Bấm để LƯU (Add)
      try {
        await favoriteWordsApi.addFavorite({
          hanzi: word.hanzi,
          pinyin: word.pinyin,
          meaning: word.meaning,
          hsk: activePassage?.hskLevel || selectedLevel,
        });
        setSavedWords((prev) => new Set([...prev, word.hanzi]));
        showToast(`Đã lưu "${word.hanzi}" vào Sổ từ vựng!`, 'success');
      } catch (err) {
        if (err?.response?.status === 409) {
          // Nếu server báo 409 Conflict (đã tồn tại), tự động đồng bộ trạng thái lưu
          setSavedWords((prev) => new Set([...prev, word.hanzi]));
          showToast(`Từ "${word.hanzi}" đã có sẵn trong Sổ từ vựng`, 'info');
        } else {
          showToast(`Lỗi khi lưu từ: ${err?.message || 'Vui lòng thử lại'}`, 'error');
        }
      }
    }
  };

  // Tách văn bản song ngữ theo đoạn
  const parsedParagraphs = useMemo(() => {
    if (!activePassage?.content?.hanzi) return [];

    const hzList = activePassage.content.hanzi
      .split('\n\n')
      .map((p) => p.trim())
      .filter(Boolean);
    const pyList = (activePassage.content.pinyin || '')
      .split('\n\n')
      .map((p) => p.trim())
      .filter(Boolean);
    const viList = (activePassage.content.meaning || '')
      .split('\n\n')
      .map((p) => p.trim())
      .filter(Boolean);

    return hzList.map((hz, idx) => ({
      index: idx,
      hanzi: hz,
      pinyin: pyList[idx] || '',
      meaning: viList[idx] || '',
    }));
  }, [activePassage]);

  // Danh sách chủ đề khả dụng cho bộ lọc
  const availableTopics = useMemo(() => {
    const topicsMap = new Map();
    passages.forEach((p) => {
      if (p.topicId && !topicsMap.has(p.topicId)) {
        topicsMap.set(p.topicId, p.topicName || `Chủ đề ${p.topicId}`);
      }
    });
    return Array.from(topicsMap.entries()).map(([id, name]) => ({ id, name }));
  }, [passages]);

  // Cỡ chữ Hán to rõ ràng, thoáng mắt
  const fontClasses = {
    sm: 'text-lg sm:text-xl leading-relaxed tracking-wide',
    md: 'text-xl sm:text-2xl leading-loose tracking-wide',
    lg: 'text-2xl sm:text-3xl leading-loose tracking-wide',
  };

  // ==========================================
  // RENDER: CHI TIẾT BÀI ĐỌC (READER MODE)
  // ==========================================
  if (activePassage || loadingDetail) {
    if (loadingDetail) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
          <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-semibold text-mute">Đang tải bài đọc...</p>
        </div>
      );
    }

    const currentProg = userProgressMap[activePassage?.id];
    const isCompletedQuiz =
      currentProg &&
      currentProg.quizTotal > 0 &&
      currentProg.quizScore / currentProg.quizTotal >= 0.75;

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-24 animate-fade-in relative">
        {/* Sticky Controls Bar — Ban đầu nằm ở giữa trang cùng bài đọc, cuộn lên sẽ dính lại ở trên đỉnh */}
        <div className="sticky top-16 md:top-0 z-30 flex flex-wrap items-center justify-between gap-3 bg-surface/95 dark:bg-card-dark/95 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-border/80 dark:border-border-dark shadow-sm mb-6 transition-all">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBackToList}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-card dark:bg-white/5 text-ink dark:text-on-dark font-medium text-xs hover:bg-primary/10 hover:text-primary transition-colors border border-hairline dark:border-white/10 cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>Danh sách</span>
            </button>

            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              {activePassage.hskLevel === 7 ? 'HSK 7-9' : `HSK ${activePassage.hskLevel || selectedLevel}`}
            </span>

            {activePassage.totalParts > 1 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Phần {activePassage.part}/{activePassage.totalParts}
              </span>
            )}
          </div>

          {/* Quick Reader Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Nút Nghe bài / Dừng đọc */}
            <button
              onClick={handleToggleSpeakAll}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${isCurrentPassageActiveInAudio && isAudioPlaying
                ? 'bg-rose-500 text-white shadow-xs animate-pulse'
                : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
            >
              {isCurrentPassageActiveInAudio && isAudioPlaying ? (
                <Square size={14} className="fill-white" />
              ) : (
                <Volume2 size={14} />
              )}
              <span>
                {isCurrentPassageActiveInAudio && isAudioPlaying ? 'Dừng đọc' : 'Nghe bài'}
              </span>
            </button>

            {/* Toggle Pinyin */}
            <button
              onClick={() => setShowPinyin((v) => !v)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${showPinyin
                ? 'bg-surface-card dark:bg-white/10 text-primary border-primary/30'
                : 'bg-transparent text-mute border-transparent hover:bg-surface-card'
                }`}
              title="Bật/Tắt Pinyin"
            >
              Pinyin {showPinyin ? '✓' : ''}
            </button>

            {/* Toggle Tiếng Việt */}
            <button
              onClick={() => setShowMeaning((v) => !v)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${showMeaning
                ? 'bg-surface-card dark:bg-white/10 text-primary border-primary/30'
                : 'bg-transparent text-mute border-transparent hover:bg-surface-card'
                }`}
              title="Bật/Tắt Bản dịch tiếng Việt"
            >
              Tiếng Việt {showMeaning ? '✓' : ''}
            </button>

            {/* Font Size Adjuster */}
            <div className="hidden sm:flex items-center bg-surface-bone dark:bg-white/5 rounded-xl p-0.5 border border-hairline dark:border-white/10">
              <button
                onClick={() => setFontSize('sm')}
                className={`px-2 py-1 text-xs rounded-lg font-bold transition-colors cursor-pointer ${fontSize === 'sm' ? 'bg-primary text-white' : 'text-mute hover:text-ink'
                  }`}
                title="Cỡ chữ nhỏ"
              >
                A-
              </button>
              <button
                onClick={() => setFontSize('md')}
                className={`px-2 py-1 text-xs rounded-lg font-bold transition-colors cursor-pointer ${fontSize === 'md' ? 'bg-primary text-white' : 'text-mute hover:text-ink'
                  }`}
                title="Cỡ chữ vừa (Mặc định)"
              >
                A
              </button>
              <button
                onClick={() => setFontSize('lg')}
                className={`px-2 py-1 text-xs rounded-lg font-bold transition-colors cursor-pointer ${fontSize === 'lg' ? 'bg-primary text-white' : 'text-mute hover:text-ink'
                  }`}
                title="Cỡ chữ lớn"
              >
                A+
              </button>
            </div>
          </div>
        </div>

        {/* Passage Title Banner */}
        <div className="bg-surface-card dark:bg-card-dark rounded-3xl p-6 sm:p-8 border border-border/80 dark:border-border-dark shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-mute dark:text-on-dark-mute flex items-center gap-1.5">
              <BookOpen size={14} className="text-primary" />
              {activePassage.topicName}
            </span>

            {currentProg?.isRead && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                <CheckCircle2 size={13} />
                Đã học
              </span>
            )}
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-ink dark:text-on-dark tracking-tight">
              {activePassage.title?.hanzi}
            </h1>
            {showPinyin && activePassage.title?.pinyin && (
              <p className="text-base font-semibold text-primary mt-1 font-sans">
                {activePassage.title.pinyin}
              </p>
            )}
            <p className="text-base sm:text-lg font-medium text-ink/80 dark:text-on-dark/80 mt-1">
              {activePassage.title?.meaning}
            </p>
          </div>

          {activePassage.contextDescription && (
            <div className="p-3.5 rounded-2xl bg-surface-bone dark:bg-white/5 border border-hairline dark:border-white/10 text-xs sm:text-sm text-mute dark:text-on-dark-mute italic">
              <span className="font-semibold not-italic">Bối cảnh:</span> {activePassage.contextDescription}
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-border/60 dark:border-border-dark pt-2 gap-6">
            <button
              onClick={() => setReaderTab('text')}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${readerTab === 'text'
                ? 'border-primary text-primary'
                : 'border-transparent text-mute hover:text-ink dark:hover:text-on-dark'
                }`}
            >
              <FileText size={16} />
              <span>Nội dung bài đọc</span>
            </button>

            <button
              onClick={() => setReaderTab('quiz')}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors relative cursor-pointer ${readerTab === 'quiz'
                ? 'border-primary text-primary'
                : 'border-transparent text-mute hover:text-ink dark:hover:text-on-dark'
                }`}
            >
              <HelpCircle size={16} />
              <span>Trắc nghiệm đọc hiểu ({activePassage.quiz?.length || 0})</span>
              {isCompletedQuiz && (
                <span className="h-2 w-2 rounded-full bg-emerald-500 absolute -top-1 -right-2" />
              )}
            </button>

            <button
              onClick={() => setReaderTab('vocab')}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${readerTab === 'vocab'
                ? 'border-primary text-primary'
                : 'border-transparent text-mute hover:text-ink dark:hover:text-on-dark'
                }`}
            >
              <Star size={16} />
              <span>Từ vựng mục tiêu ({activePassage.targetWordsUsed?.length || 0})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: NỘI DUNG BÀI ĐỌC */}
        {readerTab === 'text' && (
          <div className="space-y-6">
            {parsedParagraphs.map((para) => {
              const isPlayingThis =
                isCurrentPassageActiveInAudio && isAudioPlaying && audioParaIdx === para.index;

              return (
                <div
                  key={para.index}
                  className={`relative p-6 sm:p-7 rounded-3xl bg-surface-card dark:bg-card-dark border transition-all duration-300 ${isPlayingThis
                    ? 'border-primary shadow-md ring-2 ring-primary/25 bg-primary/5'
                    : 'border-border/80 dark:border-border-dark hover:border-primary/30'
                    }`}
                >
                  {/* Speaker audio button for this paragraph */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <button
                      onClick={() => handleSpeakParagraph(para.index)}
                      className={`p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${isPlayingThis
                        ? 'bg-primary text-white shadow-xs animate-pulse'
                        : 'bg-surface-bone dark:bg-white/5 text-mute hover:text-primary hover:bg-primary/10'
                        }`}
                      title={isPlayingThis ? 'Đang đọc...' : 'Nghe đoạn này'}
                    >
                      <Volume2 size={17} />
                    </button>
                  </div>

                  {/* Hanzi Paragraph Text — Cỡ chữ to, chuẩn Hán tự font serif */}
                  <div className={`font-serif text-ink dark:text-on-dark ${fontClasses[fontSize]} pr-12`}>
                    {para.hanzi.split('').map((char, charIdx) => {
                      if (/[\s\n\r\t，。！？、“”《》：；]/.test(char)) {
                        return <span key={charIdx}>{char}</span>;
                      }
                      return (
                        <HanziTooltip key={charIdx} char={char} noUnderline>
                          <span className="hover:text-primary transition-colors cursor-pointer inline-block">
                            {char}
                          </span>
                        </HanziTooltip>
                      );
                    })}
                  </div>

                  {/* Pinyin representation */}
                  {showPinyin && para.pinyin && (
                    <div className="mt-3 text-sm sm:text-base font-medium text-primary/80 dark:text-primary-light/80 leading-relaxed font-sans">
                      {para.pinyin}
                    </div>
                  )}

                  {/* Vietnamese translation */}
                  {showMeaning && para.meaning && (
                    <div className="mt-4 pt-4 border-t border-hairline dark:border-white/5 text-base sm:text-lg font-normal text-ink/75 dark:text-on-dark-mute leading-relaxed">
                      {para.meaning}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bottom Actions to switch to Quiz */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-primary/10 via-amber-500/10 to-transparent border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-ink dark:text-on-dark text-base">
                  Bạn đã đọc hiểu câu chuyện?
                </h3>
                <p className="text-xs text-mute mt-0.5">
                  Thử thách khả năng nắm bắt ý chính và từ vựng qua {activePassage.quiz?.length || 4} câu trắc nghiệm.
                </p>
              </div>

              <button
                onClick={() => setReaderTab('quiz')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-white font-bold text-sm shadow-sm hover:bg-primary/90 transition-all hover:scale-[1.02] shrink-0 cursor-pointer"
              >
                <span>Làm trắc nghiệm</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: TRẮC NGHIỆM ĐỌC HIỂU (QUIZ) */}
        {readerTab === 'quiz' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-surface-card dark:bg-card-dark border border-border/80 dark:border-border-dark flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-ink dark:text-on-dark">
                  Bộ câu hỏi đọc hiểu HSK
                </h2>
                <p className="text-xs text-mute mt-0.5">
                  Chọn đáp án chính xác nhất dựa trên nội dung bài đọc vừa học.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Nút Ẩn/Hiện tiếng Việt trong trắc nghiệm */}
                <button
                  onClick={() => setShowQuizTranslation((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${showQuizTranslation
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-surface-bone dark:bg-white/5 text-mute border-hairline dark:border-white/10 hover:text-ink'
                    }`}
                  title={showQuizTranslation ? 'Bấm để ẩn tiếng Việt' : 'Bấm để hiện tiếng Việt'}
                >
                  {showQuizTranslation ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span>{showQuizTranslation ? 'Tiếng Việt: Đang hiện' : 'Tiếng Việt: Đã ẩn'}</span>
                </button>

                {quizSubmitted && (
                  <button
                    onClick={handleResetQuiz}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-bone dark:bg-white/5 text-xs font-semibold text-ink dark:text-on-dark hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    <span>Làm lại</span>
                  </button>
                )}
              </div>
            </div>

            {/* Question Cards — Cỡ chữ to, rõ ràng, hỗ trợ ẩn/hiện tiếng Việt */}
            {activePassage.quiz?.map((q, qIndex) => {
              const selectedOpt = userAnswers[q.id];
              const isCorrect = selectedOpt === q.answer;
              const { chinese: qHanzi, vietnamese: qVi } = splitBilingualText(q.question);

              return (
                <div
                  key={q.id || qIndex}
                  className="p-6 sm:p-7 rounded-3xl bg-surface-card dark:bg-card-dark border border-border/80 dark:border-border-dark space-y-5 shadow-xs"
                >
                  {/* Câu hỏi với chữ Hán to và bản dịch tùy chọn */}
                  <div className="flex items-start gap-3.5">
                    <span className="h-8 w-8 rounded-xl bg-primary/10 text-primary font-extrabold text-sm flex items-center justify-center shrink-0 mt-0.5">
                      {qIndex + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-xl sm:text-2xl font-bold font-serif text-ink dark:text-on-dark leading-relaxed">
                        {qHanzi}
                      </p>
                      {showQuizTranslation && qVi && (
                        <p className="text-sm sm:text-base font-medium text-mute dark:text-on-dark-mute mt-1 leading-normal">
                          ({qVi})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Options ABCD — Cỡ chữ to, rõ ràng */}
                  <div className="grid grid-cols-1 gap-3 pt-1">
                    {['A', 'B', 'C', 'D'].map((optKey) => {
                      const optRaw = q.options?.[optKey];
                      if (!optRaw) return null;

                      const { chinese: optHanzi, vietnamese: optVi } = splitBilingualText(optRaw);
                      const isThisSelected = selectedOpt === optKey;
                      const isThisAnswer = q.answer === optKey;

                      let btnStyle =
                        'bg-surface-bone dark:bg-white/5 border-hairline dark:border-white/10 text-ink dark:text-on-dark hover:border-primary/40';

                      if (quizSubmitted) {
                        if (isThisAnswer) {
                          btnStyle =
                            'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold';
                        } else if (isThisSelected && !isCorrect) {
                          btnStyle =
                            'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300';
                        } else {
                          btnStyle = 'opacity-50 border-transparent';
                        }
                      } else if (isThisSelected) {
                        btnStyle = 'bg-primary/15 border-primary text-primary font-semibold';
                      }

                      return (
                        <button
                          key={optKey}
                          disabled={quizSubmitted}
                          onClick={() => handleSelectOption(q.id, optKey)}
                          className={`w-full text-left p-4 sm:p-4.5 rounded-2xl border transition-all flex items-center gap-3.5 cursor-pointer ${btnStyle}`}
                        >
                          <span
                            className={`h-7 w-7 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 ${isThisSelected
                              ? 'bg-primary text-white'
                              : 'bg-surface dark:bg-card-dark text-mute'
                              }`}
                          >
                            {optKey}
                          </span>

                          <div className="flex-1 min-w-0">
                            <div className="text-base sm:text-lg font-serif font-semibold text-ink dark:text-on-dark leading-normal">
                              {optHanzi}
                            </div>
                            {showQuizTranslation && optVi && (
                              <div className="text-xs sm:text-sm text-mute dark:text-on-dark-mute mt-0.5 leading-normal">
                                ({optVi})
                              </div>
                            )}
                          </div>

                          {quizSubmitted && isThisAnswer && (
                            <Check size={20} className="text-emerald-500 shrink-0" />
                          )}
                          {quizSubmitted && isThisSelected && !isCorrect && (
                            <XCircle size={20} className="text-rose-500 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Detailed Vietnamese Explanation */}
                  {quizSubmitted && q.explanation && (
                    <div className="p-4 rounded-2xl bg-surface-bone dark:bg-white/5 border border-hairline dark:border-white/10 text-sm text-ink/80 dark:text-on-dark-mute space-y-1 mt-3">
                      <div className="font-bold text-primary flex items-center gap-1.5">
                        <CheckCircle2 size={15} />
                        <span>Giải thích chi tiết:</span>
                      </div>
                      <p className="leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Quiz Submit Button */}
            {!quizSubmitted && (
              <button
                disabled={submittingQuiz || Object.keys(userAnswers).length === 0}
                onClick={handleSubmitQuiz}
                className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-base shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {submittingQuiz ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Nộp bài trắc nghiệm</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* TAB 3: TỪ VỰNG MỤC TIÊU (TARGET VOCABULARY) — Cỡ chữ to, hỗ trợ toggle xóa/lưu */}
        {readerTab === 'vocab' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-surface-card dark:bg-card-dark border border-border/80 dark:border-border-dark">
              <h2 className="text-base font-bold text-ink dark:text-on-dark">
                Danh sách từ vựng mục tiêu ({activePassage.targetWordsUsed?.length || 0} từ)
              </h2>
              <p className="text-xs text-mute mt-0.5">
                Các từ vựng cốt lõi của bài đọc. Bấm biểu tượng ngôi sao để lưu hoặc hủy lưu khỏi Sổ từ vựng.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {activePassage.targetWordsUsed?.map((word, wIndex) => {
                const isSaved = savedWords.has(word.hanzi);

                return (
                  <div
                    key={wIndex}
                    className="p-4 sm:p-5 rounded-2xl bg-surface-card dark:bg-card-dark border border-border/80 dark:border-border-dark flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-primary/30 transition-all"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        {/* Cỡ chữ Hán to vượt trội */}
                        <span className="text-2xl sm:text-3xl font-bold font-serif text-ink dark:text-on-dark tracking-wide">
                          {word.hanzi}
                        </span>
                        <span className="text-sm font-semibold text-primary px-2.5 py-0.5 rounded-lg bg-primary/10 font-sans">
                          {word.pinyin}
                        </span>
                      </div>
                      <p className="text-base font-medium text-ink/90 dark:text-on-dark/90">
                        {word.meaning}
                      </p>
                      {word.usageInSentence && (
                        <p className="text-sm text-mute dark:text-on-dark-mute italic pt-1">
                          "{word.usageInSentence}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        onClick={() => playPassage({ content: { hanzi: word.hanzi } }, 0)}
                        className="p-2.5 rounded-xl bg-surface-bone dark:bg-white/5 text-mute hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        title="Nghe phát âm"
                      >
                        <Volume2 size={17} />
                      </button>

                      <button
                        onClick={() => handleToggleSaveWord(word)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${isSaved
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-xs'
                          : 'bg-surface-bone dark:bg-white/5 text-ink dark:text-on-dark border-hairline dark:border-white/10 hover:border-amber-500/40'
                          }`}
                        title={isSaved ? 'Bấm để xóa khỏi Sổ từ vựng' : 'Bấm để lưu vào Sổ từ vựng'}
                      >
                        <Star
                          size={15}
                          className={isSaved ? 'fill-amber-500 text-amber-500' : 'text-mute'}
                        />
                        <span>{isSaved ? 'Đã lưu' : 'Lưu từ'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER: DANH SÁCH BÀI ĐỌC (BROWSER MODE)
  // ==========================================
  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-20 animate-fade-in">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-primary/15 via-surface-card to-amber-500/10 dark:from-primary/20 dark:via-card-dark dark:to-amber-500/10 border border-primary/20 shadow-xs">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink dark:text-on-dark tracking-tight">
            Kho Luyện Đọc Hiểu HSK
          </h1>
          <p className="text-sm text-mute dark:text-on-dark-mute leading-relaxed">
            Nâng cao khả năng đọc hiểu thực tế qua các bài văn song ngữ và trắc nghiệm chi tiết.
          </p>
        </div>
      </div>

      {/* Level Tabs (HSK 1 to HSK 7-9) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { level: 1, label: 'HSK 1' },
          { level: 2, label: 'HSK 2' },
          { level: 3, label: 'HSK 3' },
          { level: 4, label: 'HSK 4' },
          { level: 5, label: 'HSK 5' },
          { level: 6, label: 'HSK 6' },
          { level: 7, label: 'HSK 7-9' },
        ].map(({ level, label }) => {
          const isSelected = selectedLevel === level;
          const count = summary?.levels?.[level] || 0;

          return (
            <button
              key={level}
              onClick={() => {
                setSelectedLevel(level);
                setSelectedTopic('all');
                setSearchParams({ level });
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap border shrink-0 cursor-pointer ${isSelected
                ? 'bg-primary text-white border-primary shadow-sm scale-105'
                : 'bg-surface-card dark:bg-card-dark text-ink dark:text-on-dark border-border/80 dark:border-border-dark hover:border-primary/40'
                }`}
            >
              <span>{label}</span>
              {count > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${isSelected ? 'bg-white/20 text-white' : 'bg-surface-bone dark:bg-white/10 text-mute'
                    }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên bài đọc, từ khóa, chủ đề..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface-card dark:bg-card-dark border border-border/80 dark:border-border-dark text-sm text-ink dark:text-on-dark placeholder:text-mute focus:outline-hidden focus:border-primary transition-colors"
          />
        </div>

        {availableTopics.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-surface-card dark:bg-card-dark border border-border/80 dark:border-border-dark text-sm font-semibold text-ink dark:text-on-dark focus:outline-hidden focus:border-primary transition-colors"
            >
              <option value="all">Tất cả chủ đề</option>
              {availableTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Grid Danh Sách Bài Đọc */}
      {loadingList ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <div className="h-8 w-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-xs font-semibold text-mute">Đang tải danh sách bài đọc...</span>
        </div>
      ) : filteredPassages.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-3xl bg-surface-card dark:bg-card-dark border border-border/80 dark:border-border-dark space-y-3">
          <BookOpen className="mx-auto text-mute" size={40} />
          <h3 className="font-bold text-ink dark:text-on-dark text-base">Không tìm thấy bài đọc nào</h3>
          <p className="text-xs text-mute max-w-md mx-auto">
            Thử chuyển sang cấp độ HSK khác hoặc thay đổi từ khóa tìm kiếm.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPassages.map((p) => {
            const progress = userProgressMap[p.id];
            const isRead = !!progress?.isRead;
            const quizScore = progress?.quizScore;
            const quizTotal = progress?.quizTotal;

            return (
              <div
                key={p.id}
                onClick={() => handleOpenPassage(p.id)}
                className="group p-5 rounded-3xl bg-surface-card dark:bg-card-dark border border-border/80 dark:border-border-dark hover:border-primary/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                      {p.topicName || 'Chủ đề'}
                    </span>

                    {isRead && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={12} />
                        Đã học
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold font-serif text-ink dark:text-on-dark group-hover:text-primary transition-colors">
                      {p.title?.hanzi}
                    </h3>
                    <p className="text-xs font-semibold text-primary/80 mt-0.5 font-sans">
                      {p.title?.pinyin}
                    </p>
                    <p className="text-xs text-mute line-clamp-1 mt-1">
                      {p.title?.meaning}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-hairline dark:border-white/5 flex items-center justify-between text-xs text-mute">
                  <span>{p.wordCount || 0} chữ</span>

                  {quizTotal > 0 && (
                    <span className="font-bold text-primary">
                      Đúng {quizScore}/{quizTotal} câu
                    </span>
                  )}

                  <span className="font-semibold group-hover:translate-x-1 transition-transform text-primary flex items-center gap-0.5">
                    Đọc ngay &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
