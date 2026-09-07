import React from 'react';
import FarmPlantGraphic from './FarmPlantGraphic';
import { speakChinese } from '../../utils/tts';
import { Droplet, Volume2, BookOpen } from 'lucide-react';

export default function FarmPlantCard({ plant, onSelect, onQuickWater, waterCount = 0 }) {
  const {
    hanzi,
    pinyin,
    meaning,
    stage,
    deckTitle,
    isOverdue,
    growthPercentage = 0,
  } = plant;

  const stageBadgeInfo = {
    seed: { label: 'Hạt mầm', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
    sprout: { label: 'Mầm non', color: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20' },
    sapling: { label: 'Đơm hoa', color: 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20' },
    golden: { label: 'Cổ thụ', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/30' },
  };

  const badge = stageBadgeInfo[stage] || stageBadgeInfo.seed;

  const handleSpeak = (e) => {
    e.stopPropagation();
    speakChinese(hanzi);
  };

  return (
    <div
      onClick={() => onSelect(plant)}
      className={`group relative flex flex-col items-center justify-between rounded-3xl p-3.5 sm:p-4 cursor-pointer transition-all duration-300 select-none overflow-hidden backdrop-blur-xl ${
        isOverdue
          ? 'bg-sky-50/70 dark:bg-[#151c28]/95 border-2 border-sky-400/50 dark:border-sky-500/40 hover:border-sky-500 shadow-md shadow-sky-500/10 dark:shadow-sky-950/30 hover:-translate-y-1'
          : stage === 'golden'
          ? 'bg-amber-50/50 dark:bg-gradient-to-b dark:from-[#182622]/95 dark:to-[#0e161c]/95 border border-amber-400/40 hover:border-amber-400 shadow-md shadow-amber-500/10 dark:shadow-amber-950/20 hover:-translate-y-1'
          : 'bg-white/90 dark:bg-[#121d28]/90 border border-stone-200/90 dark:border-emerald-500/20 hover:border-emerald-500/60 shadow-sm hover:shadow-md hover:-translate-y-1'
      }`}
    >
      {/* Top Ambient Glow */}
      <div
        className={`absolute -top-10 -left-10 w-24 h-24 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 ${
          isOverdue
            ? 'bg-sky-400/15 dark:bg-sky-500/15'
            : stage === 'golden'
            ? 'bg-amber-400/15'
            : 'bg-emerald-400/10 dark:bg-emerald-500/15'
        }`}
      />

      {/* Top Row: Single Clean Status Badge */}
      <div className="w-full flex items-center justify-between z-10 gap-1.5 mb-1">
        {/* Single Stage or Thirsty indicator - No duplication! */}
        {isOverdue ? (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-400/30">
            <Droplet size={11} className="fill-current text-sky-500 dark:text-cyan-300 animate-pulse" />
            <span>Cần tưới</span>
          </span>
        ) : (
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
            {badge.label}
          </span>
        )}

        {/* Audio Pronounce Button */}
        <button
          type="button"
          onClick={handleSpeak}
          className="p-1 rounded-lg text-stone-400 hover:text-emerald-600 dark:hover:text-amber-300 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="Nghe phát âm"
        >
          <Volume2 size={13} />
        </button>
      </div>

      {/* Center Plant Graphic with Subtle Scale */}
      <div className="my-1.5 transform transition-transform group-hover:scale-105 duration-300 z-10">
        <FarmPlantGraphic stage={stage} isOverdue={isOverdue} size="md" />
      </div>

      {/* Crisp Hanzi & Meaning Box - font-medium (not font-black) to avoid blurred strokes */}
      <div className="w-full z-10 flex flex-col items-center">
        <div className="w-full relative bg-stone-50/80 dark:bg-white/[0.04] group-hover:bg-stone-100/80 dark:group-hover:bg-white/[0.07] border border-stone-200/80 dark:border-white/10 rounded-2xl py-2 px-2.5 text-center transition-colors shadow-inner flex flex-col items-center justify-center">
          {/* Hanzi: font-medium for razor-sharp crisp strokes */}
          <div className="text-2xl sm:text-3xl font-medium text-stone-800 dark:text-stone-100 tracking-normal font-sans">
            {hanzi}
          </div>

          {/* Pinyin */}
          <div className="text-[11px] sm:text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-300 mt-0.5 truncate max-w-[90%]">
            {pinyin || '...'}
          </div>
        </div>

        {/* Vietnamese Meaning Snippet */}
        <p className="text-[11px] text-stone-600 dark:text-stone-300 font-medium line-clamp-1 mt-1.5 px-1 text-center w-full">
          {meaning || 'Chưa có nghĩa'}
        </p>

        {/* Deck Title Tag (Only shown if genuinely available) */}
        {deckTitle && (
          <div className="flex items-center gap-1 text-[9px] text-stone-500 dark:text-stone-400 mt-1 max-w-[95%] truncate bg-stone-100/90 dark:bg-black/25 px-2 py-0.5 rounded-full border border-stone-200/50 dark:border-white/5">
            <BookOpen size={9} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="truncate">{deckTitle}</span>
          </div>
        )}
      </div>

      {/* Bottom Footer: Compact Quick Water (when thirsty) or Slim Progress Bar */}
      <div className="w-full mt-2.5 pt-2 border-t border-stone-200/70 dark:border-white/10 z-10">
        {isOverdue ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickWater(plant);
            }}
            disabled={waterCount <= 0}
            className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer ${
              waterCount > 0
                ? 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white shadow-sky-600/20 active:scale-95'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-500 cursor-not-allowed'
            }`}
          >
            <Droplet size={12} className="fill-current" />
            <span>Tưới (+5 XP)</span>
          </button>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400">
              <span>Độ lớn</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {stage === 'golden' ? '100% Cổ thụ' : `${growthPercentage}%`}
              </span>
            </div>
            <div className="h-1.5 w-full bg-stone-200/90 dark:bg-stone-800/90 rounded-full overflow-hidden p-px">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  stage === 'golden'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${Math.max(6, growthPercentage)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
