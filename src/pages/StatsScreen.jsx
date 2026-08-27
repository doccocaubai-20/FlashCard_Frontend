import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import GoalTracker from '../components/stats/GoalTracker';
import Heatmap from '../components/stats/Heatmap';
import { fetchSummary, fetchHeatmap, fetchBadges } from '../features/stats/statsSlice';
import { Trophy, Flame, Calendar, Award, ArrowLeft, BarChart3, Mic, Languages, Pencil, CheckSquare, Clock, History } from 'lucide-react';
import { skillLogsApi, gameRecordsApi } from '../services/learningApi';

const badgeIconMap = {
  Flame: Flame,
  Calendar: Calendar,
  Award: Award,
  Trophy: Trophy,
};

export default function StatsScreen() {
  const dispatch = useDispatch();
  const summary = useSelector((state) => state.stats.summary);
  const heatmapData = useSelector((state) => state.stats.heatmapData);
  const badges = useSelector((state) => state.stats.badges);
  const goals = useSelector((state) => state.stats.goals);

  const [recentLogs, setRecentLogs] = useState([]);
  const [bestGameScores, setBestGameScores] = useState({});
  const [historyTab, setHistoryTab] = useState('activities'); // 'activities' | 'games'
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    dispatch(fetchSummary());
    dispatch(fetchHeatmap());
    dispatch(fetchBadges());
  }, [dispatch]);

  useEffect(() => {
    const fetchHistoryData = async () => {
      try {
        setLoadingHistory(true);
        const [logsRes, fallingBest, matchingBest, unscrambleBest] = await Promise.all([
          skillLogsApi.getAll({ limit: 15 }),
          gameRecordsApi.getBest('FALLING_WORDS').catch(() => ({ data: null })),
          gameRecordsApi.getBest('MATCHING').catch(() => ({ data: null })),
          gameRecordsApi.getBest('UNSCRAMBLE').catch(() => ({ data: null })),
        ]);
        
        setRecentLogs(logsRes.data || []);
        setBestGameScores({
          FALLING_WORDS: fallingBest?.data || null,
          MATCHING: matchingBest?.data || null,
          UNSCRAMBLE: unscrambleBest?.data || null,
        });
      } catch (err) {
        console.error('Failed to load history stats:', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistoryData();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-hairline dark:border-white/8 pb-5">
        <Link
          to="/"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-bone dark:bg-white/5 text-mute hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="font-display text-xl font-semibold text-ink dark:text-on-dark tracking-tight flex items-center gap-2">
            <BarChart3 size={20} className="text-primary" />
            Thống kê chi tiết
          </h1>
          <p className="text-xs text-mute mt-0.5">Tổng quan quá trình học tập của bạn.</p>
        </div>
      </div>

      {/* Stats overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Chuỗi học', value: `${summary?.streak ?? 0} ngày`, icon: '🔥' },
          { label: 'Tổng thẻ đã ôn', value: summary?.totalStudied ?? 0, icon: '📚' },
          { label: 'Hôm nay', value: `${summary?.completedCards ?? 0} thẻ`, icon: '✅' },
          { label: 'Huy hiệu', value: badges?.length ?? 0, icon: '🏆' },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-xl border border-hairline dark:border-white/5 bg-surface-card dark:bg-surface-dark/60 shadow-sm p-4 text-center"
          >
            <span className="text-xl">{stat.icon}</span>
            <div className="text-lg font-bold text-ink dark:text-on-dark mt-1">{stat.value}</div>
            <div className="text-[10px] font-bold text-mute uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Goal + Heatmap */}
      <GoalTracker completed={summary?.completedCards ?? 0} target={goals?.dailyTarget ?? 20} />
      <Heatmap data={heatmapData} />

      {/* Badges */}
      <div className="rounded-xl border border-hairline dark:border-white/5 bg-surface-card dark:bg-surface-dark/60 shadow-sm p-5">
        <h2 className="text-sm font-bold text-ink dark:text-on-dark uppercase tracking-wider mb-4 flex items-center gap-2">
          <Trophy size={15} className="text-primary" />
          Huy hiệu đạt được ({badges?.length ?? 0})
        </h2>
        {badges?.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {badges.map((badge) => {
              const IconComponent = badgeIconMap[badge.icon] || Trophy;
              return (
                <div
                  key={badge.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-bone/50 dark:bg-white/5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <IconComponent size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink dark:text-on-dark">{badge.name}</h4>
                    <p className="text-[10px] text-mute mt-0.5">{badge.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 rounded-xl bg-surface-bone/30 dark:bg-white/3 text-xs text-mute">
            Chưa có huy hiệu. Hãy học bài mỗi ngày để tích lũy! 🎯
          </div>
        )}
      </div>

      {/* Recent History & Game Records Tabs */}
      <div className="rounded-xl border border-hairline dark:border-white/5 bg-surface-card dark:bg-surface-dark/60 shadow-sm p-5 space-y-4 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline dark:border-white/8 pb-3">
          <h2 className="text-sm font-bold text-ink dark:text-on-dark uppercase tracking-wider flex items-center gap-2">
            <History size={15} className="text-primary" />
            Nhật ký Lịch sử học tập
          </h2>
          
          <div className="flex items-center gap-1 bg-surface-bone dark:bg-black p-0.5 rounded-full border border-hairline dark:border-white/5 w-fit">
            <button
              onClick={() => setHistoryTab('activities')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                historyTab === 'activities'
                  ? 'bg-white dark:bg-zinc-800 text-primary shadow-xs'
                  : 'text-mute hover:text-ink dark:hover:text-on-dark'
              }`}
            >
              Luyện tập gần đây
            </button>
            <button
              onClick={() => setHistoryTab('games')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                historyTab === 'games'
                  ? 'bg-white dark:bg-zinc-800 text-primary shadow-xs'
                  : 'text-mute hover:text-ink dark:hover:text-on-dark'
              }`}
            >
              Kỷ lục Trò chơi
            </button>
          </div>
        </div>

        {loadingHistory ? (
          <div className="py-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : historyTab === 'activities' ? (
          recentLogs.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {recentLogs.map((log) => {
                let skillTitle = 'Luyện tập';
                let skillColor = 'bg-primary/10 text-primary';
                let SkillIcon = Award;

                if (log.skillType === 'SPEAKING') {
                  skillTitle = 'Luyện nói phát âm';
                  skillColor = 'bg-indigo-500/10 text-indigo-500';
                  SkillIcon = Mic;
                } else if (log.skillType === 'GRAMMAR') {
                  skillTitle = 'Luyện tập Ngữ pháp';
                  skillColor = 'bg-emerald-500/10 text-emerald-500';
                  SkillIcon = Award;
                } else if (log.skillType === 'TRANSLATION') {
                  skillTitle = 'Luyện dịch câu';
                  skillColor = 'bg-teal-500/10 text-teal-500';
                  SkillIcon = Languages;
                } else if (log.skillType === 'WRITING') {
                  skillTitle = 'Luyện viết chữ Hán';
                  skillColor = 'bg-purple-500/10 text-purple-500';
                  SkillIcon = Pencil;
                } else if (log.skillType === 'QUIZ') {
                  skillTitle = 'Trắc nghiệm bộ bài';
                  skillColor = 'bg-rose-500/10 text-rose-500';
                  SkillIcon = CheckSquare;
                } else if (log.skillType === 'DICTATION') {
                  skillTitle = 'Nghe viết chính tả';
                  skillColor = 'bg-amber-500/10 text-amber-600';
                  SkillIcon = Clock;
                }

                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-bone/30 dark:bg-white/3 border border-hairline/50 dark:border-white/5 hover:border-primary/20 dark:hover:border-primary/20 transition-all gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${skillColor}`}>
                        <SkillIcon size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-ink dark:text-on-dark truncate">{skillTitle}</h4>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-surface-bone dark:bg-black/35 text-mute dark:text-on-dark-mute">
                            {log.level || 'Tự do'}
                          </span>
                        </div>
                        <p className="text-[10px] text-mute dark:text-on-dark-mute mt-0.5 truncate">
                          {log.targetId ? `Nội dung: ${log.targetId}` : 'Bài tập tự do'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className={`text-xs font-black border px-2 py-0.5 rounded-md ${
                          log.score >= 90
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                            : log.score >= 70
                              ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/30'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                        }`}>
                          {log.score}%
                        </span>
                        <p className="text-[8px] text-mute mt-1 font-mono">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                          {new Date(log.createdAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 rounded-xl bg-surface-bone/20 dark:bg-white/3 text-xs text-mute">
              Chưa có lịch sử luyện tập gần đây. Hãy vào các màn hình luyện tập để ghi nhận hoạt động! 🎯
            </div>
          )
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            {[
              { key: 'FALLING_WORDS', title: 'Gõ từ rơi (Falling)', bg: 'from-blue-500/10 to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-500/5', icon: '🎮' },
              { key: 'MATCHING', title: 'Nối từ nhanh (Matching)', bg: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5', icon: '⚡' },
              { key: 'UNSCRAMBLE', title: 'Xếp câu HSK (Unscramble)', bg: 'from-purple-500/10 to-pink-500/10 dark:from-purple-500/5 dark:to-pink-500/5', icon: '🧩' },
            ].map((game) => {
              const record = bestGameScores[game.key];
              return (
                <div
                  key={game.key}
                  className={`rounded-2xl border border-hairline dark:border-white/5 bg-gradient-to-br ${game.bg} p-4 text-center space-y-3 flex flex-col justify-between`}
                >
                  <div className="space-y-1">
                    <span className="text-2xl block">{game.icon}</span>
                    <h4 className="text-xs font-black text-ink dark:text-on-dark">{game.title}</h4>
                  </div>

                  <div className="bg-white/65 dark:bg-black/35 rounded-xl p-3 border border-hairline/40 dark:border-white/5 space-y-1">
                    {record ? (
                      <>
                        <span className="text-[10px] font-bold text-mute uppercase tracking-widest block">Điểm kỷ lục</span>
                        <span className="text-2xl font-black text-primary block leading-none py-1">
                          {record.score}
                        </span>
                        {record.duration && (
                          <span className="text-[8px] font-mono text-mute block mt-1">
                            Thời gian: {record.duration} giây
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] font-bold text-mute block">Chưa chơi ván nào</span>
                        <span className="text-base font-bold text-mute/50 block py-1">---</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
