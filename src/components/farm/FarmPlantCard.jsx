import React from 'react';
import FarmPlantGraphic from './FarmPlantGraphic';
import { Droplet, Sparkles, Award } from 'lucide-react';

export default function FarmPlantCard({ plant, onSelect, onQuickWater, waterCount = 0 }) {
  const {
    id,
    hanzi,
    pinyin,
    meaning,
    stage,
    interval,
    isOverdue,
    growthPercentage = 0,
  } = plant;

  const stageBadgeInfo = {
    seed: { label: 'Hạt giống', color: 'bg-amber-800/20 text-amber-300 border-amber-700/40' },
    sprout: { label: 'Mầm non', color: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40' },
    sapling: { label: 'Ra hoa', color: 'bg-pink-600/20 text-pink-300 border-pink-500/40' },
    golden: { label: 'Cổ thụ', color: 'bg-amber-500/20 text-amber-300 border-amber-400/50' },
  };

  const badge = stageBadgeInfo[stage] || stageBadgeInfo.seed;

  return (
    <div
      onClick={() => onSelect(plant)}
      className={`group relative flex flex-col items-center justify-between rounded-3xl p-3.5 sm:p-4 cursor-pointer transition-all duration-300 select-none overflow-hidden ${
        isOverdue
          ? 'bg-gradient-to-b from-amber-950/40 to-stone-900/90 border-2 border-amber-600/50 hover:border-amber-500 shadow-md shadow-amber-900/20 hover:-translate-y-1'
          : stage === 'golden'
          ? 'bg-gradient-to-b from-emerald-950/40 to-stone-900/90 border-2 border-amber-400/40 hover:border-amber-300 shadow-md shadow-amber-900/20 hover:-translate-y-1'
          : 'bg-gradient-to-b from-emerald-950/30 to-stone-900/90 border border-emerald-500/20 hover:border-emerald-400/60 shadow-md shadow-emerald-950/30 hover:-translate-y-1'
      }`}
    >
      {/* Soft Background Radial Light */}
      <div
        className={`absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-35 transition-opacity ${
          stage === 'golden'
            ? 'bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.4)_0%,_transparent_70%)]'
            : isOverdue
            ? 'bg-[radial-gradient(circle_at_center,_rgba(217,119,6,0.3)_0%,_transparent_70%)]'
            : 'bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.3)_0%,_transparent_70%)]'
        }`}
      />

      {/* Top Bar: Status Badges */}
      <div className="w-full flex items-center justify-between z-10 gap-1">
        {/* Stage Pill */}
        <span
          className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}
        >
          {badge.label}
        </span>

        {/* Health status */}
        {isOverdue ? (
          <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
            <Droplet size={11} className="fill-current text-sky-400" />
            <span>Khát nước</span>
          </span>
        ) : stage === 'golden' ? (
          <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
            <Award size={11} />
            <span>Đã làm chủ</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-emerald-400/90">
            <Sparkles size={11} />
            <span>Tươi tốt</span>
          </span>
        )}
      </div>

      {/* Center Plant Graphic */}
      <div className="my-2 sm:my-3 transform transition-transform group-hover:scale-105 duration-300 z-10">
        <FarmPlantGraphic stage={stage} isOverdue={isOverdue} size="md" />
      </div>

      {/* Wooden Signboard with Hanzi + Pinyin */}
      <div className="w-full z-10 flex flex-col items-center">
        <div className="w-full bg-gradient-to-b from-[#7f4f24] to-[#582f0e] border-2 border-[#936639] rounded-2xl py-1.5 px-2 text-center shadow-lg group-hover:from-[#936639] group-hover:to-[#653b12] transition-colors">
          <div className="text-xl sm:text-2xl font-black text-amber-100 tracking-wider font-serif">
            {hanzi}
          </div>
          <div className="text-[11px] sm:text-xs text-amber-200/90 font-mono font-medium truncate">
            {pinyin || '...'}
          </div>
        </div>

        {/* Vietnamese Meaning Snippet */}
        <p className="text-[11px] text-stone-300/80 font-medium line-clamp-1 mt-1.5 px-1 text-center">
          {meaning || 'Chưa có nghĩa'}
        </p>
      </div>

      {/* Bottom Footer: Quick Water or Progress Bar */}
      <div className="w-full mt-2.5 pt-2 border-t border-white/5 z-10">
        {isOverdue ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickWater(plant);
            }}
            disabled={waterCount <= 0}
            className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer ${
              waterCount > 0
                ? 'bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white shadow-sky-500/20 active:scale-95'
                : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
            }`}
          >
            <Droplet size={13} className="fill-current" />
            <span>Tưới nước (+5 XP)</span>
          </button>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-stone-400">
              <span>Độ thuần thục</span>
              <span className="font-semibold text-emerald-400">
                {stage === 'golden' ? 'Hoàn tất' : `${growthPercentage}%`}
              </span>
            </div>
            <div className="h-1.5 w-full bg-stone-800 rounded-full overflow-hidden p-px">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  stage === 'golden'
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${Math.max(5, growthPercentage)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
