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
    seed: { label: 'Hạt mầm' },
    sprout: { label: 'Mầm non' },
    sapling: { label: 'Đơm hoa' },
    golden: { label: 'Cổ thụ' },
  };

  const badge = stageBadgeInfo[stage] || stageBadgeInfo.seed;

  const handleSpeak = (e) => {
    e.stopPropagation();
    speakChinese(hanzi);
  };

  return (
    <div
      onClick={() => onSelect(plant)}
      className="group bg-surface-card dark:bg-surface-card border border-hairline dark:border-white/10 hover:border-primary/40 rounded-2xl p-3.5 sm:p-4 cursor-pointer transition-all duration-200 select-none shadow-xs hover:shadow-sm flex flex-col items-center justify-between"
    >
      {/* Top Row: Clean Status Badge & Audio */}
      <div className="w-full flex items-center justify-between gap-1.5 mb-1">
        {isOverdue ? (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
            <Droplet size={10} className="fill-current text-sky-500" />
            <span>Cần tưới</span>
          </span>
        ) : (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border border-hairline dark:border-white/5 ${
            stage === 'golden'
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
              : 'bg-surface-bone dark:bg-white/5 text-mute'
          }`}>
            {badge.label}
          </span>
        )}

        {/* Audio Pronounce Button */}
        <button
          type="button"
          onClick={handleSpeak}
          className="p-1 rounded-lg text-mute hover:text-primary transition-colors cursor-pointer"
          title="Nghe phát âm"
        >
          <Volume2 size={13} />
        </button>
      </div>

      {/* Center Plant Graphic */}
      <div className="my-1 transform transition-transform group-hover:scale-105 duration-200">
        <FarmPlantGraphic stage={stage} isOverdue={isOverdue} size="md" />
      </div>

      {/* Crisp Hanzi Plaque */}
      <div className="w-full flex flex-col items-center">
        <div className="w-full bg-surface-bone dark:bg-white/5 border border-hairline dark:border-white/5 rounded-xl py-2 px-2 text-center transition-colors">
          <div className="text-2xl sm:text-3xl font-medium text-ink dark:text-on-dark tracking-normal font-sans antialiased">
            {hanzi}
          </div>
          <div className="text-xs font-mono font-semibold text-primary dark:text-hero-glow mt-0.5 truncate max-w-[90%] mx-auto">
            {pinyin || '...'}
          </div>
        </div>

        {/* Vietnamese Meaning Snippet */}
        <p className="text-xs text-mute dark:text-on-dark-mute line-clamp-1 mt-1.5 px-1 text-center w-full">
          {meaning || 'Chưa có nghĩa'}
        </p>

        {/* Deck Title Tag */}
        {deckTitle && (
          <div className="flex items-center gap-1 text-[10px] text-mute mt-1 max-w-[95%] truncate">
            <BookOpen size={10} className="shrink-0 text-primary/70 dark:text-hero-glow" />
            <span className="truncate">{deckTitle}</span>
          </div>
        )}
      </div>

      {/* Bottom Footer: Quick Water or Slim Progress Bar */}
      <div className="w-full mt-2.5 pt-2 border-t border-hairline dark:border-white/5">
        {isOverdue ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickWater(plant);
            }}
            disabled={waterCount <= 0}
            className={`w-full py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer ${
              waterCount > 0
                ? 'bg-primary hover:bg-primary-deep text-white active:scale-95'
                : 'bg-surface-bone dark:bg-white/5 text-mute cursor-not-allowed'
            }`}
          >
            <Droplet size={11} className="fill-current" />
            <span>Tưới (+5 XP)</span>
          </button>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-mute">
              <span>Độ lớn</span>
              <span className="font-semibold text-primary dark:text-hero-glow">
                {stage === 'golden' ? '100% Cổ thụ' : `${growthPercentage}%`}
              </span>
            </div>
            <div className="h-1 w-full bg-surface-bone dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  stage === 'golden'
                    ? 'bg-amber-500'
                    : 'bg-primary dark:bg-hero-glow'
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
