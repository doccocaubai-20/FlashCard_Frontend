import React from 'react';
import { Droplet, Coins, Sparkles, Loader2, Award, Sprout, HelpCircle } from 'lucide-react';

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
    overdueCount = 0,
    totalPlants = 0,
    canHarvest = false,
    harvestReward = 0,
  } = gardenState || {};

  const goldenTreesCount = gardenState?.goldenTreesCount || 0;
  const getFarmerTitle = () => {
    if (goldenTreesCount >= 50) return { title: 'Nông Thánh Tri Thức', level: 'Cấp 5' };
    if (goldenTreesCount >= 20) return { title: 'Bậc Thầy Điền Trang', level: 'Cấp 4' };
    if (goldenTreesCount >= 5) return { title: 'Thợ Vườn Lão Luyện', level: 'Cấp 3' };
    if (totalPlants >= 5) return { title: 'Người Làm Vườn', level: 'Cấp 2' };
    return { title: 'Tập Sự Gieo Mầm', level: 'Cấp 1' };
  };

  const rank = getFarmerTitle();

  return (
    <div className="w-full bg-surface-card dark:bg-surface-card border border-hairline dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 sm:gap-5">
        {/* Left: Farmer rank status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary dark:text-hero-glow flex items-center justify-center shrink-0">
            <Sprout size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-ink dark:text-on-dark">{rank.title}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-hero-glow">
                {rank.level}
              </span>
              <button
                type="button"
                onClick={onOpenGuide}
                className="text-mute hover:text-primary dark:hover:text-on-dark transition-colors cursor-pointer p-0.5"
                title="Xem hướng dẫn nông trại"
              >
                <HelpCircle size={14} />
              </button>
            </div>
            <p className="text-xs text-mute dark:text-on-dark-mute mt-0.5">
              Đang canh tác <strong className="text-ink dark:text-on-dark font-semibold">{totalPlants}</strong> cây ({goldenTreesCount} cổ thụ hoàng kim)
            </p>
          </div>
        </div>

        {/* Center: Resources (Clean counters matching ChongZi's style) */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Water */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-bone dark:bg-white/5 border border-hairline dark:border-white/5"
            title="Nước tưới cây (Ôn flashcard để nhận thêm nước)"
          >
            <div className="w-6 h-6 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Droplet size={13} className="fill-current" />
            </div>
            <div>
              <div className="text-xs font-bold text-ink dark:text-on-dark leading-none">
                {water} <span className="text-[10px] font-normal text-mute">bình</span>
              </div>
              <div className="text-[9px] text-mute font-medium leading-tight">Nước tưới</div>
            </div>
          </div>

          {/* Fertilizer */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-bone dark:bg-white/5 border border-hairline dark:border-white/5"
            title="Phân bón tăng trưởng"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles size={13} />
            </div>
            <div>
              <div className="text-xs font-bold text-ink dark:text-on-dark leading-none">
                {fertilizer} <span className="text-[10px] font-normal text-mute">túi</span>
              </div>
              <div className="text-[9px] text-mute font-medium leading-tight">Phân bón</div>
            </div>
          </div>

          {/* Coins */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-bone dark:bg-white/5 border border-hairline dark:border-white/5"
            title="Số Xu tích lũy"
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Coins size={13} className="fill-current" />
            </div>
            <div>
              <div className="text-xs font-bold text-ink dark:text-on-dark leading-none">
                {coins} <span className="text-[10px] font-normal text-mute">Xu</span>
              </div>
              <div className="text-[9px] text-mute font-medium leading-tight">Kho Xu</div>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Water All Button */}
          <button
            type="button"
            onClick={onWaterAll}
            disabled={overdueCount === 0 || water <= 0 || watering}
            className={`h-9 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              overdueCount > 0 && water > 0
                ? 'bg-primary hover:bg-primary-deep text-white shadow-xs active:scale-95'
                : 'bg-surface-bone dark:bg-white/5 text-mute dark:text-on-dark-mute border border-hairline dark:border-white/5 cursor-not-allowed'
            }`}
          >
            {watering ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Droplet size={13} className={overdueCount > 0 && water > 0 ? 'fill-current' : ''} />
            )}
            <span>Tưới tất cả {overdueCount > 0 ? `(${Math.min(water, overdueCount)})` : ''}</span>
          </button>

          {/* Harvest Button */}
          <button
            type="button"
            onClick={onHarvest}
            disabled={!canHarvest || harvesting}
            className={`h-9 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              canHarvest
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs active:scale-95'
                : 'bg-surface-bone dark:bg-white/5 text-mute dark:text-on-dark-mute border border-hairline dark:border-white/5 cursor-not-allowed'
            }`}
          >
            {harvesting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Award size={13} />
            )}
            <span>Thu hoạch {canHarvest && harvestReward > 0 ? `(+${harvestReward} 🪙)` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
