import React from 'react';
import { Droplet, Coins, HelpCircle, Sparkles, Loader2, Award, Calendar } from 'lucide-react';

export default function FarmHeaderStats({
  gardenState,
  onWaterAll,
  onHarvest,
  onOpenGuide,
  watering = false,
  harvesting = false,
}) {
  const {
    water = 0,
    fertilizer = 0,
    coins = 0,
    xp = 0,
    overdueCount = 0,
    totalPlants = 0,
    canHarvest = false,
    harvestReward = 0,
  } = gardenState || {};

  // Farmer rank based on mastered golden trees or total plants
  const goldenTreesCount = gardenState?.goldenTreesCount || 0;
  const getFarmerTitle = () => {
    if (goldenTreesCount >= 50) return { title: 'Nông Thánh Tri Thức', icon: '👑', color: 'text-amber-400' };
    if (goldenTreesCount >= 20) return { title: 'Bậc Thầy Điền Trang', icon: '🏛️', color: 'text-purple-400' };
    if (goldenTreesCount >= 5) return { title: 'Thợ Vườn Lão Luyện', icon: '🌿', color: 'text-emerald-400' };
    if (totalPlants >= 5) return { title: 'Người Làm Vườn Chăm Chỉ', icon: '🌱', color: 'text-teal-400' };
    return { title: 'Tập Sự Gieo Mầm', icon: '🌾', color: 'text-stone-300' };
  };

  const rank = getFarmerTitle();

  return (
    <div className="w-full bg-gradient-to-r from-emerald-50/90 via-white to-teal-50/90 dark:from-stone-900/90 dark:via-emerald-950/40 dark:to-stone-900/90 border border-emerald-200/80 dark:border-emerald-500/20 rounded-3xl p-4 sm:p-6 shadow-sm dark:shadow-xl backdrop-blur-md relative overflow-hidden transition-colors">
      {/* Decorative Glow */}
      <div className="absolute -top-16 -left-16 w-48 h-48 bg-emerald-400/15 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-amber-400/15 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 sm:gap-6">
        {/* Left: Farm Identity & Farmer Rank */}
        <div className="flex items-center gap-3.5 shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 border-2 border-emerald-400/40 flex items-center justify-center text-2xl shadow-md shrink-0">
            {rank.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white font-sans tracking-tight whitespace-nowrap">
                Nông Trại Tri Thức
              </h1>
              <button
                type="button"
                onClick={onOpenGuide}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                title="Hướng dẫn làm nông trại"
              >
                <HelpCircle size={17} />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs whitespace-nowrap">
              <span className={`font-bold ${rank.color}`}>{rank.title}</span>
              <span className="text-stone-400 dark:text-stone-500">•</span>
              <span className="text-stone-600 dark:text-stone-300 font-medium">
                {totalPlants} cây ({goldenTreesCount} cổ thụ)
              </span>
            </div>
          </div>
        </div>

        {/* Center: Resource Pills */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
          {/* Water Droplets */}
          <div
            className="flex items-center gap-2 bg-white/90 dark:bg-stone-800/80 border border-sky-200 dark:border-sky-500/30 px-3.5 py-2 rounded-2xl shadow-sm"
            title="Nước tưới cây (Ôn flashcard để nhận thêm nước)"
          >
            <div className="w-7 h-7 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Droplet size={16} className="fill-current animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-black text-sky-700 dark:text-sky-300 leading-none">
                {water} <span className="text-[10px] font-normal text-sky-600/70 dark:text-sky-400/70">bình</span>
              </div>
              <div className="text-[9px] text-stone-500 dark:text-stone-400 font-medium">Nước tưới</div>
            </div>
          </div>

          {/* Fertilizer */}
          <div
            className="flex items-center gap-2 bg-white/90 dark:bg-stone-800/80 border border-emerald-200 dark:border-emerald-500/30 px-3.5 py-2 rounded-2xl shadow-sm"
            title="Phân bón tăng trưởng (Duy trì streak hoặc nhiệm vụ để nhận)"
          >
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="text-xs font-black text-emerald-700 dark:text-emerald-300 leading-none">
                {fertilizer} <span className="text-[10px] font-normal text-emerald-600/70 dark:text-emerald-400/70">túi</span>
              </div>
              <div className="text-[9px] text-stone-500 dark:text-stone-400 font-medium">Phân bón</div>
            </div>
          </div>

          {/* Coins */}
          <div
            className="flex items-center gap-2 bg-white/90 dark:bg-stone-800/80 border border-amber-200 dark:border-amber-500/30 px-3.5 py-2 rounded-2xl shadow-sm"
            title="Số Xu ChongZi tích lũy"
          >
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Coins size={16} className="fill-current" />
            </div>
            <div>
              <div className="text-xs font-black text-amber-700 dark:text-amber-300 leading-none">
                {coins} <span className="text-[10px] font-normal text-amber-600/70 dark:text-amber-400/70">Xu</span>
              </div>
              <div className="text-[9px] text-stone-500 dark:text-stone-400 font-medium">Kho Xu</div>
            </div>
          </div>
        </div>

        {/* Right: Quick Bulk Actions */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          {/* Water All Button */}
          <button
            type="button"
            onClick={onWaterAll}
            disabled={overdueCount === 0 || water <= 0 || watering}
            className={`flex-1 sm:flex-initial h-11 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all whitespace-nowrap cursor-pointer ${
              overdueCount > 0 && water > 0
                ? 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white shadow-sky-600/20 active:scale-95'
                : 'bg-stone-100 dark:bg-stone-800/80 text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-stone-700/60 cursor-not-allowed'
            }`}
          >
            {watering ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Droplet size={15} className={overdueCount > 0 ? 'fill-current animate-bounce' : ''} />
            )}
            <span>
              Tưới tất cả {overdueCount > 0 ? `(${Math.min(water, overdueCount)})` : ''}
            </span>
          </button>

          {/* Harvest Button */}
          <button
            type="button"
            onClick={onHarvest}
            disabled={!canHarvest || harvesting}
            className={`flex-1 sm:flex-initial h-11 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all whitespace-nowrap cursor-pointer ${
              canHarvest
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-amber-950 shadow-amber-500/20 animate-pulse active:scale-95'
                : 'bg-stone-100 dark:bg-stone-800/80 text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-stone-700/60 cursor-not-allowed'
            }`}
          >
            {harvesting ? (
              <Loader2 size={15} className="animate-spin text-amber-950" />
            ) : (
              <Award size={15} />
            )}
            <span>
              Thu hoạch {canHarvest && harvestReward > 0 ? `(+${harvestReward} 🪙)` : ''}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
