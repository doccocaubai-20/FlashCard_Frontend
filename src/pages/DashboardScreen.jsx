import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import GoalTracker from '../components/stats/GoalTracker';
import Heatmap from '../components/stats/Heatmap';
import { fetchSummary, fetchHeatmap } from '../features/stats/statsSlice';
import { fetchAllDecks } from '../features/deck/deckSlice';

export default function DashboardScreen() {
  const dispatch = useDispatch();
  const summary = useSelector((state) => state.stats.summary);
  const heatmapData = useSelector((state) => state.stats.heatmapData);
  const goals = useSelector((state) => state.stats.goals);
  const decks = useSelector((state) => state.deck.decks);

  useEffect(() => {
    dispatch(fetchSummary());
    dispatch(fetchHeatmap());
    dispatch(fetchAllDecks());
  }, [dispatch]);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Tổng quan về tiến độ học tập và bộ sưu tập thẻ của bạn.</p>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/80 px-4 py-2 rounded-2xl">
            Chuỗi học hiện tại: <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{summary?.streak ?? 0} ngày 🔥</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] mt-6">
          <div className="space-y-6">
            <GoalTracker completed={summary?.completedCards ?? 0} target={goals?.dailyTarget ?? 20} />
            <Heatmap data={heatmapData} />
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Bộ bài của bạn</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Chọn một bộ bài bên dưới để bắt đầu luyện tập hoặc ôn thẻ.</p>
            <div className="mt-6 space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {decks?.length > 0 ? (
                decks.map((deck) => (
                  <Link
                    key={deck.id}
                    to={`/decks/${deck.id}`}
                    className="block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{deck.title || deck.name || 'Bộ bài chưa đặt tên'}</h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{deck.description || 'Không có mô tả cho bộ bài này.'}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-350 shrink-0">
                        {deck.cardCount ?? 0} thẻ
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center text-slate-500 dark:text-slate-400">
                  Chưa có bộ bài nào. Hãy tạo hoặc nhập một bộ bài mới để bắt đầu.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
