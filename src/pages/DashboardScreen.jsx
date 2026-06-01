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
    <div className="space-y-8 p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500">Overview of your study progress and deck collection.</p>
          </div>
          <div className="text-sm text-slate-600">
            Current streak: <span className="font-semibold text-slate-900">{summary?.streak ?? 0} days</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <GoalTracker completed={summary?.completedCards ?? 0} target={goals?.dailyTarget ?? 20} />
            <Heatmap data={heatmapData} />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Your decks</h2>
            <p className="mt-2 text-sm text-slate-500">Open a deck to review flashcards or start a study session.</p>
            <div className="mt-6 space-y-4">
              {decks?.length > 0 ? (
                decks.map((deck) => (
                  <Link
                    key={deck.id}
                    to={`/decks/${deck.id}`}
                    className="block rounded-3xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">{deck.name || 'Untitled deck'}</h3>
                        <p className="mt-1 text-sm text-slate-500">{deck.description || 'No description available.'}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {deck.cardCount ?? 0} cards
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
                  No decks yet. Create or import a deck to get started.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
