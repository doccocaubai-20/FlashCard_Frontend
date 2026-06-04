import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import GoalTracker from '../components/stats/GoalTracker';
import Heatmap from '../components/stats/Heatmap';
import { fetchSummary, fetchHeatmap, fetchBadges } from '../features/stats/statsSlice';
import { fetchAllDecks } from '../features/deck/deckSlice';
import { Trophy, Flame, Calendar, Award } from 'lucide-react';

const badgeIconMap = {
  Flame: Flame,
  Calendar: Calendar,
  Award: Award,
  Trophy: Trophy,
};

export default function DashboardScreen() {
  const dispatch = useDispatch();
  const summary = useSelector((state) => state.stats.summary);
  const heatmapData = useSelector((state) => state.stats.heatmapData);
  const badges = useSelector((state) => state.stats.badges);
  const goals = useSelector((state) => state.stats.goals);
  const decks = useSelector((state) => state.deck.decks);

  useEffect(() => {
    dispatch(fetchSummary());
    dispatch(fetchHeatmap());
    dispatch(fetchAllDecks());
    dispatch(fetchBadges());
  }, [dispatch]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-hairline dark:border-divider-dark pb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink dark:text-on-dark tracking-tight">Dashboard</h1>
        </div>
        <div className="text-sm text-charcoal dark:text-on-dark-mute font-mono bg-surface-bone dark:bg-black/20 border border-hairline dark:border-divider-dark px-4 py-2 rounded-full w-fit">
          Chuỗi học hiện tại: <span className="font-bold text-primary">{summary?.streak ?? 0} ngày 🔥</span>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        
        {/* Left Column: Stats & Heatmap */}
        <div className="space-y-6">
          <GoalTracker completed={summary?.completedCards ?? 0} target={goals?.dailyTarget ?? 20} />
          <Heatmap data={heatmapData} />

          {/* Unlocked Badges Container */}
          <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/40 p-5">
            <h2 className="font-display text-sm font-bold text-ink dark:text-on-dark tracking-tight uppercase tracking-wider mb-4 flex items-center gap-2">
              <Trophy size={16} className="text-primary" />
              Huy hiệu đạt được ({badges?.length ?? 0})
            </h2>
            {badges?.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {badges.map((badge) => {
                  const IconComponent = badgeIconMap[badge.icon] || Trophy;
                  return (
                    <div
                      key={badge.id}
                      className="flex items-center gap-3 p-3 rounded-md border border-hairline dark:border-divider-dark bg-surface-bone dark:bg-black/25"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <IconComponent size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-ink dark:text-on-dark">{badge.name}</h4>
                        <p className="text-[10px] text-mute dark:text-on-dark-mute mt-0.5">{badge.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-hairline dark:border-divider-dark rounded-md text-xs text-mute dark:text-on-dark-mute">
                Chưa có huy hiệu nào. Hãy tích cực học bài mỗi ngày để tích luỹ danh hiệu nhé!
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Decks List Panel */}
        <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/40 p-6">
          <h2 className="font-display text-xl font-bold text-ink dark:text-on-dark tracking-tight">Bộ bài của bạn</h2>
          <p className="mt-1 text-sm text-mute dark:text-on-dark-mute">Chọn một bộ bài bên dưới để bắt đầu luyện tập hoặc ôn thẻ.</p>
          <div className="mt-6 space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {decks?.length > 0 ? (
              decks.map((deck) => (
                <Link
                  key={deck.id}
                  to={`/decks/${deck.id}`}
                  className="block rounded-md border border-hairline dark:border-divider-dark bg-canvas dark:bg-surface-dark p-4 transition-all duration-200 hover:-translate-y-[2px] hover:border-primary dark:hover:border-primary"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-ink dark:text-on-dark">{deck.title || deck.name || 'Bộ bài chưa đặt tên'}</h3>
                      <p className="mt-1 text-xs text-mute dark:text-on-dark-mute line-clamp-1">{deck.description || 'Không có mô tả cho bộ bài này.'}</p>
                    </div>
                    <span className="rounded-full bg-surface-bone dark:bg-black/35 px-3 py-1 text-xs font-mono font-semibold text-charcoal dark:text-on-dark-mute shrink-0">
                      {deck.cardCount ?? 0} thẻ
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-hairline dark:border-divider-dark bg-canvas dark:bg-surface-dark/50 p-6 text-center text-mute dark:text-on-dark-mute">
                Chưa có bộ bài nào. Hãy tạo hoặc nhập một bộ bài mới để bắt đầu.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
