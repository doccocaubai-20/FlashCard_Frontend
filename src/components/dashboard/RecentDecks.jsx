import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight, Play, PlusCircle, Sparkles } from 'lucide-react';
import { safeLocalGet, recordDeckStudy } from '../../utils/storage';

const getDeckColor = (name) => {
  const colors = [
    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function RecentDecks({ decks = [], onStudyDeck }) {
  const navigate = useNavigate();

  const localRecentMap = safeLocalGet('chongzi_recent_studied_decks', {});

  // Sort: decks with latest study activity first, then by mastery percentage, then custom decks
  const recentDecks = [...(decks || [])]
    .sort((a, b) => {
      // 1. Prioritize by exact last studied timestamp (local tracking or backend)
      const aTime = Math.max(
        Number(localRecentMap[String(a.id)]) || 0,
        a.lastStudiedAt ? new Date(a.lastStudiedAt).getTime() : 0
      );
      const bTime = Math.max(
        Number(localRecentMap[String(b.id)]) || 0,
        b.lastStudiedAt ? new Date(b.lastStudiedAt).getTime() : 0
      );

      if (aTime !== bTime && (aTime > 0 || bTime > 0)) {
        return bTime - aTime;
      }

      // 2. Prioritize decks with actual study progress (mastery percentage descending)
      const aPercent = (a.cardCount > 0) ? ((a.studiedCount || 0) / a.cardCount) : 0;
      const bPercent = (b.cardCount > 0) ? ((b.studiedCount || 0) / b.cardCount) : 0;
      if (Math.abs(aPercent - bPercent) > 0.001) {
        return bPercent - aPercent;
      }

      const aStudied = a.studiedCount || 0;
      const bStudied = b.studiedCount || 0;
      if (aStudied !== bStudied) {
        return bStudied - aStudied;
      }

      // 3. Prioritize custom user decks over system decks if neither has been studied
      if (!a.isSystem && b.isSystem) return -1;
      if (a.isSystem && !b.isSystem) return 1;

      // 4. Fallback to original order
      return 0;
    })
    .slice(0, 3);

  const handleStudy = (deckId, e) => {
    if (e) e.stopPropagation();
    recordDeckStudy(deckId);
    if (onStudyDeck) {
      onStudyDeck(deckId);
    } else {
      navigate(`/study?deckId=${deckId}`);
    }
  };

  return (
    <div className="rounded-2xl bg-surface-card dark:bg-surface-card border border-hairline dark:border-white/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-primary dark:text-hero-glow" />
          <h2 className="text-sm sm:text-base font-bold text-ink dark:text-on-dark">
            Bộ thẻ gần đây
          </h2>
        </div>
        <Link
          to="/decks"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary dark:text-hero-glow hover:text-primary-deep transition-colors group"
        >
          <span>Xem tất cả</span>
          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Decks List / Empty State */}
      {recentDecks.length > 0 ? (
        <div className="space-y-3">
          {recentDecks.map((deck) => {
            const title = deck.title || deck.name || 'Bộ thẻ chưa đặt tên';
            const cardCount = deck.cardCount ?? 0;
            const studied = deck.studiedCount || 0;
            const masteryPercent = cardCount > 0
              ? Math.min(100, Math.round((studied / cardCount) * 100))
              : 0;
            const colorClass = getDeckColor(title);
            const initial = title.charAt(0).toUpperCase();

            return (
              <div
                key={deck.id}
                onClick={() => navigate(`/decks/${deck.id}`)}
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-bone/60 dark:bg-white/5 border border-hairline dark:border-white/10 hover:border-primary/30 dark:hover:border-primary/40 hover:bg-surface-bone dark:hover:bg-white/10 transition-all cursor-pointer shadow-2xs"
              >
                {/* Left: Deck Initial Badge & Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-bold shadow-xs select-none ${colorClass}`}
                  >
                    {initial}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-ink dark:text-on-dark group-hover:text-primary dark:group-hover:text-hero-glow transition-colors truncate">
                        {title}
                      </h3>
                      <span className="shrink-0 text-[10px] font-semibold text-mute dark:text-ash bg-white/70 dark:bg-white/10 border border-hairline dark:border-white/10 px-1.5 py-0.2 rounded-md">
                        {cardCount} thẻ
                      </span>
                    </div>

                    {/* Progress Bar & Subtext */}
                    <div className="flex items-center gap-2.5 mt-1.5">
                      <div className="h-1.5 flex-1 max-w-[140px] bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary dark:bg-hero-glow rounded-full transition-all duration-500"
                          style={{ width: `${masteryPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-mute dark:text-ash">
                        {masteryPercent}% thành thạo
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: "Học tiếp" Quick Study Trigger */}
                <div className="shrink-0 flex items-center justify-end">
                  <button
                    onClick={(e) => handleStudy(deck.id, e)}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white dark:bg-primary/20 dark:hover:bg-primary dark:text-primary-light dark:hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs group/btn"
                    title={`Học bộ bài: ${title}`}
                  >
                    <Play size={12} className="fill-current transition-transform group-hover/btn:scale-110" />
                    <span>Học tiếp</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-7 px-4 text-center rounded-xl bg-surface-bone/40 dark:bg-white/5 border border-dashed border-hairline dark:border-white/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:text-primary-light mb-2.5">
            <Sparkles size={20} />
          </div>
          <p className="text-xs font-semibold text-ink dark:text-on-dark">
            Chưa có bộ thẻ nào
          </p>
          <p className="text-[11px] text-mute dark:text-ash mt-0.5 max-w-[220px]">
            Tạo bộ bài mới để bắt đầu lưu trữ và học từ vựng với SRS.
          </p>
          <Link
            to="/flashcards/new"
            className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-white hover:bg-primary-deep text-xs font-bold shadow-xs hover:shadow-sm transition-all active:scale-95"
          >
            <PlusCircle size={13} />
            <span>Tạo bộ bài đầu tiên</span>
          </Link>
        </div>
      )}
    </div>
  );
}
