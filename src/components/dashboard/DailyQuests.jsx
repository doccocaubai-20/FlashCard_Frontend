import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  Award,
  Sparkles,
  HelpCircle,
  Loader2,
  BookOpen,
  PenTool,
  Search,
  Gamepad2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { statsApi } from '../../services/statsApi';
import { safeLocalGet, safeLocalSet } from '../../utils/storage';
import { getTodayQuestCount } from '../../utils/questTracker';

const getQuestIcon = (type) => {
  switch (type) {
    case 'STUDY_CARDS':
      return BookOpen;
    case 'WRITE_PRACTICE':
      return PenTool;
    case 'DICTIONARY_LOOKUP':
      return Search;
    case 'PLAY_GAME':
      return Gamepad2;
    default:
      return Sparkles;
  }
};

export default function DailyQuests({
  quests: initialQuests = null,
  dailyQuiz: initialQuiz = null,
  studiedCards = 0,
  onRefreshSummary,
}) {
  const { t } = useTranslation();
  const todayStr = new Date().toISOString().split('T')[0];

  // Active Tab: 'quests' (Danh sách nhiệm vụ) or 'quiz' (Thử thách HSK hôm nay)
  const [activeTab, setActiveTab] = useState('quests');

  // Quests list state
  const [questsList, setQuestsList] = useState([]);
  const [claimedQuests, setClaimedQuests] = useState(() => {
    const saved = safeLocalGet(`chongzi_claimed_quests_${todayStr}`, []);
    return Array.isArray(saved) ? saved : [];
  });
  const [claimLoadingId, setClaimLoadingId] = useState(null);

  // Daily Quiz state
  const [quiz, setQuiz] = useState(initialQuiz);
  const [quizLoading, setQuizLoading] = useState(!initialQuiz);
  const [selectedQuizOption, setSelectedQuizOption] = useState(null);
  const [quizStatus, setQuizStatus] = useState('idle'); // 'idle' | 'correct' | 'incorrect'
  const [quizFeedback, setQuizFeedback] = useState('');
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(() => {
    return safeLocalGet('chongzi_daily_quiz_completed', '') === todayStr;
  });

  // Build or fetch quests
  const loadQuests = useCallback(async () => {
    if (initialQuests && initialQuests.length > 0) {
      setQuestsList(initialQuests);
      return;
    }

    try {
      const res = await statsApi.getQuests();
      if (Array.isArray(res?.data) && res.data.length > 0) {
        const mergedQuests = res.data.map((q) => {
          let localCount = 0;
          if (q.questType === 'DICTIONARY_LOOKUP') {
            localCount = getTodayQuestCount('chongzi_dict_lookups_today');
          } else if (q.questType === 'WRITE_PRACTICE') {
            localCount = getTodayQuestCount('chongzi_write_count_today');
          } else if (q.questType === 'PLAY_GAME') {
            localCount = getTodayQuestCount('chongzi_games_played_today');
          } else if (q.questType === 'STUDY_CARDS') {
            localCount = studiedCards;
          }
          return {
            ...q,
            progress: Math.max(q.progress || 0, localCount),
          };
        });
        setQuestsList(mergedQuests);

        // Sync claimed quests from Database so all devices and environments stay in sync
        const dbClaimed = res.data.filter((q) => q.completed).map((q) => q.id);
        if (dbClaimed.length > 0) {
          setClaimedQuests((prev) => Array.from(new Set([...prev, ...dbClaimed])));
        }
        return;
      }
    } catch (err) {
      console.warn('Could not fetch quests from API, using default quest list:', err);
    }

    // High-quality baseline quests connected to real study metrics
    const defaultQuests = [
      {
        id: 'quest_study',
        questType: 'STUDY_CARDS',
        title: 'Ôn tập 20 thẻ bài',
        description: 'Hoàn thành lượt ôn thẻ định kỳ hôm nay',
        target: 20,
        progress: studiedCards,
        xpReward: 30,
        coinReward: 10,
      },
      {
        id: 'quest_dict',
        questType: 'DICTIONARY_LOOKUP',
        title: 'Tra cứu 3 từ vựng mới',
        description: 'Tìm hiểu từ mới và xem chiết tự chữ Hán',
        target: 3,
        progress: Math.min(3, getTodayQuestCount('chongzi_dict_lookups_today')),
        xpReward: 15,
        coinReward: 5,
      },
      {
        id: 'quest_write',
        questType: 'WRITE_PRACTICE',
        title: 'Luyện viết 5 chữ Hán',
        description: 'Tập viết đúng quy tắc bút thuận trên canvas',
        target: 5,
        progress: Math.min(5, getTodayQuestCount('chongzi_write_count_today')),
        xpReward: 25,
        coinReward: 10,
      },
      {
        id: 'quest_game',
        questType: 'PLAY_GAME',
        title: 'Thử thách 1 ván Đấu trường',
        description: 'Rèn luyện phản xạ với Falling Words hoặc Quiz',
        target: 1,
        progress: Math.min(1, getTodayQuestCount('chongzi_games_played_today')),
        xpReward: 20,
        coinReward: 5,
      },
    ];
    setQuestsList(defaultQuests);
  }, [initialQuests, studiedCards]);

  // Load daily quiz if not provided
  useEffect(() => {
    if (initialQuiz) {
      setQuiz(initialQuiz);
      setQuizLoading(false);
      return;
    }

    let isMounted = true;
    (async () => {
      setQuizLoading(true);
      try {
        const res = await statsApi.getDailyQuiz();
        if (res?.data && isMounted) {
          setQuiz(res.data);
        }
      } catch (err) {
        console.warn('Failed to load daily quiz:', err);
      } finally {
        if (isMounted) setQuizLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [initialQuiz]);

  useEffect(() => {
    loadQuests();
  }, [loadQuests]);

  // Handle claiming quest reward
  const handleClaim = async (quest) => {
    if (claimedQuests.includes(quest.id) || claimLoadingId) return;

    setClaimLoadingId(quest.id);
    try {
      if (typeof quest.id === 'number') {
        await statsApi.claimQuest(quest.id);
      } else {
        await statsApi.addXpCoins(quest.xpReward || 20, quest.coinReward || 5);
      }
      const updated = [...claimedQuests, quest.id];
      setClaimedQuests(updated);
      safeLocalSet(`chongzi_claimed_quests_${todayStr}`, updated);

      if (onRefreshSummary) {
        onRefreshSummary();
      }
    } catch (err) {
      console.error('Failed to claim quest reward:', err);
    } finally {
      setClaimLoadingId(null);
    }
  };

  // Handle answering Daily Quiz
  const handleAnswerQuiz = async () => {
    if (!quiz || hasCompletedQuiz || selectedQuizOption === null) return;

    const opt = quiz.options[selectedQuizOption];
    if (opt?.isCorrect) {
      setQuizStatus('correct');
      setQuizFeedback(t('dashboard.quiz_correct_feedback', 'Chính xác! Bạn nhận được +20 XP và +10 Xu!'));
      safeLocalSet('chongzi_daily_quiz_completed', todayStr);
      setHasCompletedQuiz(true);

      try {
        await statsApi.addXpCoins(20, 10);
        if (onRefreshSummary) {
          onRefreshSummary();
        }
      } catch (err) {
        console.error('Failed to add quiz reward:', err);
      }
    } else {
      setQuizStatus('incorrect');
      setQuizFeedback(t('dashboard.quiz_incorrect_feedback', 'Chưa chính xác, hãy suy nghĩ thêm một chút nhé!'));
    }
  };

  return (
    <div className="rounded-2xl bg-surface-card dark:bg-surface-card border border-hairline dark:border-white/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
      {/* Header with Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline dark:border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary dark:text-hero-glow" />
          <h2 className="text-sm sm:text-base font-bold text-ink dark:text-on-dark">
            Nhiệm vụ &amp; Thử thách ngày
          </h2>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1 bg-surface-bone dark:bg-white/5 p-1 rounded-xl border border-hairline dark:border-white/10 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('quests')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'quests'
                ? 'bg-surface-card dark:bg-white/15 text-primary dark:text-white shadow-2xs'
                : 'text-mute hover:text-ink dark:hover:text-white'
            }`}
          >
            Nhiệm vụ ({questsList.length})
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'quiz'
                ? 'bg-surface-card dark:bg-white/15 text-primary dark:text-white shadow-2xs'
                : 'text-mute hover:text-ink dark:hover:text-white'
            }`}
          >
            <span>Câu đố HSK</span>
            {hasCompletedQuiz ? (
              <CheckCircle2 size={12} className="text-emerald-500" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: DAILY QUESTS LIST */}
      {activeTab === 'quests' && (
        <div className="space-y-3">
          {questsList.map((quest) => {
            const Icon = getQuestIcon(quest.questType);
            const isClaimed = claimedQuests.includes(quest.id);
            const progress = quest.id === 'quest_study' ? studiedCards : (quest.progress || 0);
            const target = quest.target || 1;
            const isCompleted = progress >= target;
            const progressPercent = Math.min(100, Math.round((progress / target) * 100));

            return (
              <div
                key={quest.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-surface-bone/50 dark:bg-white/5 border border-hairline dark:border-white/10 transition-all"
              >
                {/* Left: Quest Icon & Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      isCompleted
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-primary/10 text-primary dark:text-primary-light'
                    }`}
                  >
                    <Icon size={17} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-ink dark:text-on-dark truncate">
                        {quest.title}
                      </h3>
                      {/* Reward Badge */}
                      <span className="shrink-0 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                        +{quest.xpReward} XP / +{quest.coinReward} Xu
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="h-1.5 flex-1 max-w-[120px] bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-primary dark:bg-hero-glow'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-mute dark:text-ash">
                        {progress}/{target}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Claim Button */}
                <div className="shrink-0 flex items-center justify-end">
                  {isClaimed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      <CheckCircle2 size={12} />
                      Đã nhận
                    </span>
                  ) : isCompleted ? (
                    <button
                      onClick={() => handleClaim(quest)}
                      disabled={claimLoadingId === quest.id}
                      className="inline-flex items-center gap-1.5 min-h-[34px] px-3.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all active:scale-95 cursor-pointer animate-pulse"
                      title="Nhận thưởng nhiệm vụ"
                    >
                      {claimLoadingId === quest.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Award size={13} />
                      )}
                      <span>Nhận thưởng</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-mute dark:text-ash bg-surface-bone dark:bg-white/10 px-2.5 py-1 rounded-lg">
                      Đang làm ({progress}/{target})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: DAILY HSK QUIZ CHALLENGE */}
      {activeTab === 'quiz' && (
        <div className="space-y-3.5">
          {quizLoading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2">
              <Loader2 size={22} className="animate-spin text-primary" />
              <span className="text-xs text-mute">Đang tải câu hỏi trắc nghiệm HSK...</span>
            </div>
          ) : quiz ? (
            <div className="space-y-3">
              {/* Question Headline */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-mute dark:text-ash flex items-center gap-1">
                  <HelpCircle size={12} className="text-primary dark:text-hero-glow" />
                  Trắc nghiệm nhanh HSK hôm nay
                </span>
                <span className="text-[10px] font-bold text-primary dark:text-primary-light bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  +20 XP • +10 Xu
                </span>
              </div>

              <h3 className="text-xs sm:text-sm font-bold text-ink dark:text-on-dark leading-relaxed">
                {quiz.question}
              </h3>

              {/* Options */}
              <div className="space-y-1.5">
                {(quiz.options || []).map((opt, index) => {
                  const isSelected = selectedQuizOption === index;
                  return (
                    <button
                      key={index}
                      onClick={() => !hasCompletedQuiz && setSelectedQuizOption(index)}
                      disabled={hasCompletedQuiz}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between border cursor-pointer ${
                        isSelected
                          ? 'bg-primary/15 border-primary text-primary dark:text-primary-light shadow-2xs'
                          : 'bg-surface-bone/60 hover:bg-surface-bone dark:bg-white/5 dark:hover:bg-white/10 border-hairline dark:border-white/10 text-ink dark:text-on-dark'
                      } ${hasCompletedQuiz ? 'cursor-default opacity-85' : 'active:scale-[0.99]'}`}
                    >
                      <span className="truncate pr-2">{opt.text}</span>
                      {hasCompletedQuiz && opt.isCorrect && (
                        <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          ĐÚNG
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Quiz Footer Actions */}
              <div className="border-t border-hairline dark:border-white/10 pt-2.5 flex items-center justify-between gap-3">
                <span className="text-xs text-mute truncate max-w-[200px]">
                  {quizStatus === 'idle'
                    ? hasCompletedQuiz
                      ? 'Bạn đã hoàn thành câu đố hôm nay!'
                      : 'Chọn đáp án và bấm gửi để nhận thưởng'
                    : quizFeedback}
                </span>

                {!hasCompletedQuiz ? (
                  <button
                    onClick={handleAnswerQuiz}
                    disabled={selectedQuizOption === null}
                    className={`min-h-[34px] px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                      selectedQuizOption !== null
                        ? 'bg-primary hover:bg-primary-deep text-white cursor-pointer active:scale-95'
                        : 'bg-surface-bone dark:bg-white/5 text-mute border border-hairline dark:border-white/10 cursor-not-allowed'
                    }`}
                  >
                    Gửi đáp án
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={14} />
                    Hoàn thành
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-mute">
              Chưa có câu đố hôm nay. Hãy quay lại vào ngày mai!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
