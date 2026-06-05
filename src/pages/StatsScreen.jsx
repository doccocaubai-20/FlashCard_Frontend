import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import GoalTracker from '../components/stats/GoalTracker';
import Heatmap from '../components/stats/Heatmap';
import { fetchSummary, fetchHeatmap, fetchBadges } from '../features/stats/statsSlice';
import { Trophy, Flame, Calendar, Award, ArrowLeft, BarChart3 } from 'lucide-react';

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

  useEffect(() => {
    dispatch(fetchSummary());
    dispatch(fetchHeatmap());
    dispatch(fetchBadges());
  }, [dispatch]);

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
    </div>
  );
}
