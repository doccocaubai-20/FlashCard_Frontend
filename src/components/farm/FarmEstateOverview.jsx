import React from 'react';
import { BookOpen, Droplet, Sparkles, Award, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function FarmEstateOverview({
  decks = [],
  onSelectDeck,
  onWaterDeck,
  waterCount = 0,
}) {
  if (!decks || decks.length === 0) {
    return (
      <div className="w-full bg-white/90 dark:bg-stone-900/60 border border-stone-200 dark:border-white/10 rounded-3xl p-8 text-center backdrop-blur-xl shadow-sm">
        <div className="text-4xl mb-3">🏡</div>
        <h3 className="text-base font-bold text-stone-800 dark:text-white">Chưa có phân khu mảnh vườn nào</h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          Hãy bắt đầu học flashcard từ các bộ bài để gieo mầm các mảnh vườn tri thức.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Subheader banner */}
      <div className="flex items-center justify-between bg-emerald-50/90 dark:bg-gradient-to-r dark:from-emerald-950/40 dark:via-stone-900/60 dark:to-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl px-4 py-3 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">🗺️</span>
          <div>
            <h2 className="text-sm font-black text-stone-900 dark:text-white">Bản Đồ Phân Khu Điền Trang ({decks.length} Mảnh Vườn)</h2>
            <p className="text-[11px] text-stone-600 dark:text-stone-400">
              Mỗi bộ thẻ bài tạo thành một khu vườn sinh thái riêng. Bạn có thể tưới nhanh cả vườn hoặc vào chăm sóc từng cây.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Deck Plots */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {decks.map((deck) => {
          const isFullHealth = deck.overdueCount === 0;
          return (
            <div
              key={deck.id}
              className="group relative bg-white/90 dark:bg-[#131d2a]/90 hover:bg-stone-50/90 dark:hover:bg-[#172535] border border-stone-200 dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-500/40 rounded-3xl p-5 transition-all duration-300 shadow-sm hover:shadow-md dark:shadow-xl dark:hover:shadow-[0_12px_28px_rgba(16,185,129,0.15)] flex flex-col justify-between select-none backdrop-blur-xl overflow-hidden"
            >
              {/* Top ambient color */}
              <div
                className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-opacity ${
                  isFullHealth ? 'bg-emerald-400/10 dark:bg-emerald-500/10' : 'bg-sky-400/15 dark:bg-sky-500/15'
                }`}
              />

              {/* Plot Header */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-lg text-white font-bold shadow-sm shrink-0">
                      🌿
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-stone-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors line-clamp-1">
                        {deck.title}
                      </h3>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                        {deck.totalPlants} cây trồng
                      </span>
                    </div>
                  </div>

                  {/* Health Rate Badge */}
                  <div
                    className={`px-2.5 py-1 rounded-full text-[11px] font-black flex items-center gap-1 shrink-0 ${
                      deck.healthRate >= 90
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30'
                        : deck.healthRate >= 60
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/30'
                        : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-400/30'
                    }`}
                  >
                    <span>{deck.healthRate}% tươi tốt</span>
                  </div>
                </div>

                {/* Health Progress Bar */}
                <div className="w-full bg-stone-100 dark:bg-stone-800/80 rounded-full h-2 mt-3 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      deck.healthRate >= 80
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-300'
                        : deck.healthRate >= 50
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-300'
                        : 'bg-gradient-to-r from-rose-500 to-amber-500'
                    }`}
                    style={{ width: `${Math.max(5, deck.healthRate)}%` }}
                  />
                </div>

                {/* Mini Breakdown of Stages */}
                <div className="grid grid-cols-4 gap-1.5 mt-3.5 text-center">
                  <div className="bg-stone-50 dark:bg-white/[0.03] border border-stone-200/60 dark:border-white/5 rounded-xl py-1.5 px-1">
                    <div className="text-[10px] text-stone-500 dark:text-stone-400">Mầm hạt</div>
                    <div className="text-xs font-bold text-stone-800 dark:text-stone-200 mt-0.5">{deck.seedCount}</div>
                  </div>
                  <div className="bg-teal-50/50 dark:bg-white/[0.03] border border-teal-100 dark:border-white/5 rounded-xl py-1.5 px-1">
                    <div className="text-[10px] text-teal-600 dark:text-teal-400">Mầm non</div>
                    <div className="text-xs font-bold text-teal-800 dark:text-teal-200 mt-0.5">{deck.sproutCount}</div>
                  </div>
                  <div className="bg-pink-50/50 dark:bg-white/[0.03] border border-pink-100 dark:border-white/5 rounded-xl py-1.5 px-1">
                    <div className="text-[10px] text-pink-600 dark:text-pink-400">Đơm hoa</div>
                    <div className="text-xs font-bold text-pink-800 dark:text-pink-200 mt-0.5">{deck.saplingCount}</div>
                  </div>
                  <div className="bg-amber-50/50 dark:bg-white/[0.03] border border-amber-100 dark:border-white/5 rounded-xl py-1.5 px-1">
                    <div className="text-[10px] text-amber-600 dark:text-amber-400">Cổ thụ</div>
                    <div className="text-xs font-bold text-amber-800 dark:text-amber-300 mt-0.5">{deck.goldenCount}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-stone-200/80 dark:border-white/10 flex items-center gap-2">
                {/* Water Plot Button */}
                {deck.overdueCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => onWaterDeck(deck.id)}
                    disabled={waterCount <= 0}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      waterCount > 0
                        ? 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white shadow-sm active:scale-95'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-stone-700 cursor-not-allowed'
                    }`}
                  >
                    <Droplet size={12} className="fill-current text-white" />
                    <span>Tưới cả vườn ({Math.min(waterCount, deck.overdueCount)})</span>
                  </button>
                ) : (
                  <div className="flex-1 py-2 px-3 rounded-xl text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center gap-1">
                    <CheckCircle2 size={13} />
                    <span>Xanh tươi 100%</span>
                  </div>
                )}

                {/* Explore Plot Button */}
                <button
                  type="button"
                  onClick={() => onSelectDeck(deck.id)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-100 dark:bg-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 text-stone-700 dark:text-stone-200 hover:text-emerald-700 dark:hover:text-emerald-300 border border-stone-200 dark:border-white/10 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  title="Xem chi tiết các cây trong vườn này"
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
