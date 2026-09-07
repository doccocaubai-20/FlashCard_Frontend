import React from 'react';
import { Folder, Droplet, ArrowRight, CheckCircle2 } from 'lucide-react';

const DECK_PALETTES = [
  {
    bg: 'bg-gradient-to-br from-indigo-50/50 to-indigo-100/30 dark:from-indigo-950/10 dark:to-indigo-900/10 border-indigo-100 dark:border-indigo-900/30 hover:border-indigo-200 dark:hover:border-indigo-800',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    barBg: 'bg-indigo-500',
  },
  {
    bg: 'bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/10 dark:to-emerald-900/10 border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-200 dark:hover:border-emerald-800',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    barBg: 'bg-emerald-500',
  },
  {
    bg: 'bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/10 dark:to-purple-900/10 border-purple-100 dark:border-purple-900/30 hover:border-purple-200 dark:hover:border-purple-800',
    iconColor: 'text-purple-600 dark:text-purple-400',
    barBg: 'bg-purple-500',
  },
  {
    bg: 'bg-gradient-to-br from-rose-50/50 to-rose-100/30 dark:from-rose-950/10 dark:to-rose-900/10 border-rose-100 dark:border-rose-900/30 hover:border-rose-200 dark:hover:border-rose-800',
    iconColor: 'text-rose-600 dark:text-rose-400',
    barBg: 'bg-rose-500',
  },
  {
    bg: 'bg-gradient-to-br from-teal-50/50 to-teal-100/30 dark:from-teal-950/10 dark:to-teal-900/10 border-teal-100 dark:border-teal-900/30 hover:border-teal-200 dark:hover:border-teal-800',
    iconColor: 'text-teal-600 dark:text-teal-400',
    barBg: 'bg-teal-500',
  },
  {
    bg: 'bg-gradient-to-br from-sky-50/50 to-sky-100/30 dark:from-sky-950/10 dark:to-sky-900/10 border-sky-100 dark:border-sky-900/30 hover:border-sky-200 dark:hover:border-sky-800',
    iconColor: 'text-sky-600 dark:text-sky-400',
    barBg: 'bg-sky-500',
  },
  {
    bg: 'bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-950/10 dark:to-amber-900/10 border-amber-100 dark:border-amber-900/30 hover:border-amber-200 dark:hover:border-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
    barBg: 'bg-amber-500',
  },
];

export default function FarmEstateOverview({
  decks = [],
  onSelectDeck,
  onWaterDeck,
  waterCount = 0,
}) {
  if (!decks || decks.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 text-center shadow-sm">
        <div className="text-3xl mb-2">🌱</div>
        <h3 className="text-sm font-bold text-stone-800 dark:text-white">Chưa có phân khu mảnh vườn nào</h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          Hãy bắt đầu học flashcard từ các bộ bài để gieo mầm các mảnh vườn tri thức.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Subheader Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-bold text-ink dark:text-on-dark flex items-center gap-2">
            <span>Mảnh Vườn Phân Khu</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary dark:text-hero-glow">
              {decks.length} bộ thẻ
            </span>
          </h2>
          <p className="text-xs text-mute dark:text-on-dark-mute mt-0.5">
            Theo dõi tỷ lệ tươi tốt và chăm sóc nhanh theo từng bộ bài
          </p>
        </div>
      </div>

      {/* Grid of Deck Plots */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {decks.map((deck, idx) => {
          const style = DECK_PALETTES[idx % DECK_PALETTES.length];

          return (
            <div
              key={deck.id}
              className={`group relative flex flex-col justify-between p-5 sm:p-6 ${style.bg} rounded-2xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 select-none`}
            >
              <div>
                {/* Header: Icon + Health Badge */}
                <div className="flex items-center justify-between mb-3.5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-black/35 ${style.iconColor} shadow-xs`}>
                    <Folder size={20} />
                  </div>
                  <span
                    className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      deck.healthRate >= 80
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                        : deck.healthRate >= 50
                        ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20'
                        : 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20'
                    }`}
                  >
                    {deck.healthRate}% tươi tốt
                  </span>
                </div>

                {/* Deck Title */}
                <h3 className="text-lg font-bold text-ink dark:text-on-dark group-hover:text-primary dark:group-hover:text-primary transition-colors font-display tracking-tight truncate">
                  {deck.title}
                </h3>

                {/* Plant Count & Status */}
                <div className="flex items-center gap-2 mt-1.5 text-xs text-mute dark:text-on-dark-mute font-medium">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{deck.totalPlants} cây trồng</span>
                  {deck.overdueCount > 0 ? (
                    <>
                      <span>•</span>
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">{deck.overdueCount} cần tưới</span>
                    </>
                  ) : (
                    <>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Đang phát triển</span>
                    </>
                  )}
                </div>

                {/* Health Progress Bar */}
                <div className="h-1.5 w-full bg-white/60 dark:bg-black/35 rounded-full overflow-hidden border border-hairline dark:border-divider-dark/40 mt-3.5">
                  <div
                    className={`h-full ${style.barBg} rounded-full transition-all duration-300`}
                    style={{ width: `${Math.max(5, deck.healthRate)}%` }}
                  />
                </div>

                {/* Structured 4-Stage Breakdown */}
                <div className="grid grid-cols-4 gap-1 mt-3.5 bg-white/60 dark:bg-black/25 rounded-xl p-2 text-center border border-hairline dark:border-white/5">
                  <div>
                    <div className="text-[10px] font-medium text-mute dark:text-on-dark-mute">Mầm hạt</div>
                    <div className="text-xs font-bold text-ink dark:text-on-dark mt-0.5">{deck.seedCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium text-teal-600 dark:text-teal-400">Mầm non</div>
                    <div className="text-xs font-bold text-teal-700 dark:text-teal-300 mt-0.5">{deck.sproutCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium text-pink-600 dark:text-pink-400">Đơm hoa</div>
                    <div className="text-xs font-bold text-pink-700 dark:text-pink-300 mt-0.5">{deck.saplingCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium text-amber-600 dark:text-amber-400">Cổ thụ</div>
                    <div className="text-xs font-bold text-amber-700 dark:text-amber-300 mt-0.5">{deck.goldenCount}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3.5 border-t border-hairline dark:border-divider-dark flex items-center gap-2">
                {/* Water Plot Button */}
                {deck.overdueCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => onWaterDeck(deck.id)}
                    disabled={waterCount <= 0}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      waterCount > 0
                        ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs active:scale-95'
                        : 'bg-white/60 dark:bg-white/5 text-mute dark:text-on-dark-mute border border-hairline dark:border-white/5 cursor-not-allowed'
                    }`}
                  >
                    <Droplet size={13} className="fill-current" />
                    <span>Tưới ({Math.min(waterCount, deck.overdueCount)})</span>
                  </button>
                ) : (
                  <div className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={14} />
                    <span>100% Tươi tốt</span>
                  </div>
                )}

                {/* Explore Plot Button */}
                <button
                  type="button"
                  onClick={() => onSelectDeck(deck.id)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-deep text-white shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
                  title="Vào chăm sóc cây trong bộ bài này"
                >
                  <span>Chăm sóc</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
